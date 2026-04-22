import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

from modules.parser import extract_text_from_pdf
from modules.ai_model import evaluate_vendors_batch, ask_vendor_question, analyze_tender_bias, generate_tender, score_tender_eligibility, generate_risk_report
from modules.database import save_evaluation, write_audit_log, get_audit_logs, get_evaluation_history, get_vendor_stats, get_full_evaluation
from modules.tn_tenders import fetch_active_tenders, fetch_debarment_list, check_vendor_against_debarment
from modules.market_intel import fetch_all_market_tenders

# Configuration
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/upload', methods=['POST'])
def upload_file():
    # ── Get officer name and requirements ──
    officer_name = request.form.get('officer_name', 'Anonymous').strip()
    user_requirements = request.form.get('user_requirements', '').strip()

    if not user_requirements:
        return jsonify({"error": "Please enter your tender requirements."}), 400

    uploaded_files = request.files.getlist('files')
    if not uploaded_files or all(f.filename == '' for f in uploaded_files):
        return jsonify({"error": "Please upload at least one contractor proposal PDF."}), 400

    # ── Process each PDF ──
    parsed_proposals = []
    file_names = []

    for file in uploaded_files:
        if file.filename == '' or not allowed_file(file.filename):
            continue

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        parsed_text = extract_text_from_pdf(filepath)
        if parsed_text:
            parsed_proposals.append({"filename": filename, "parsed_text": parsed_text})
            file_names.append(filename)

    if not parsed_proposals:
        return jsonify({"error": "Could not parse any of the uploaded PDFs."}), 500

    # ── Gemini AI Evaluation ──
    evaluation_result = evaluate_vendors_batch(user_requirements, parsed_proposals)

    # ── Save to MongoDB ──
    eval_id = save_evaluation(
        officer_name=officer_name,
        requirements=user_requirements,
        files_processed=file_names,
        evaluation_result=evaluation_result
    )

    # ── Write Audit Log ──
    write_audit_log(
        officer_name=officer_name,
        action="EVALUATION",
        evaluation_id=eval_id,
        metadata={
            "files": file_names,
            "vendor_count": len(evaluation_result.get("top_vendors", [])),
            "top_vendor": evaluation_result.get("top_vendors", [{}])[0].get("company_name", "N/A") if evaluation_result.get("top_vendors") else "N/A"
        }
    )

    return jsonify({
        "message": "Evaluation complete",
        "files_processed": len(parsed_proposals),
        "evaluation": evaluation_result,
        "evaluation_id": eval_id
    }), 200


@app.route('/api/chat', methods=['POST'])
def chat_with_vendor():
    """RAG: Answer questions about a specific vendor's proposal PDF."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400

    pdf_text = data.get('vendor_pdf_text', '').strip()
    message = data.get('message', '').strip()
    officer_name = data.get('officer_name', 'Anonymous')

    if not message:
        return jsonify({"error": "Please provide a question."}), 400
    if not pdf_text:
        return jsonify({"error": "No proposal text provided for this vendor."}), 400

    reply = ask_vendor_question(pdf_text, message)

    # Log the chat action
    write_audit_log(
        officer_name=officer_name,
        action="PDF_CHAT",
        evaluation_id=None,
        metadata={"question": message[:100]}
    )

    return jsonify({"reply": reply}), 200


@app.route('/api/audit-log', methods=['GET'])
def fetch_audit_log():
    """Return the last 50 audit log entries."""
    logs = get_audit_logs(limit=50)
    return jsonify({"logs": logs}), 200


@app.route('/api/evaluation-history', methods=['GET'])
def fetch_evaluation_history():
    """Return the last 20 evaluation summaries."""
    history = get_evaluation_history(limit=20)
    return jsonify({"history": history}), 200


@app.route('/api/analyze-bias', methods=['POST'])
def analyze_bias():
    """Vigilance Tool: Analyze a single draft tender PDF for restrictive clauses."""
    officer_name = request.form.get('officer_name', 'Vigilance Officer').strip()
    
    if 'file' not in request.files:
        return jsonify({"error": "No draft tender file provided."}), 400
        
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Please upload a PDF."}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    parsed_text = extract_text_from_pdf(filepath)
    if not parsed_text:
        return jsonify({"error": "Failed to extract text from the draft document."}), 500

    # Run Bias Analysis
    result = analyze_tender_bias(parsed_text)

    # Log the action
    write_audit_log(
        officer_name=officer_name,
        action="BIAS_CHECK",
        evaluation_id=None,
        metadata={"draft_file": filename, "score": result.get("restrictive_score")}
    )

    return jsonify({"bias_analysis": result}), 200

@app.route('/api/generate-tender', methods=['POST'])
def auto_draft_tender():
    """Generative AI Tool: Write a new tender from a brief description."""
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "No prompt provided."}), 400
    
    prompt = data['prompt'].strip()
    if not prompt:
        return jsonify({"error": "Prompt cannot be empty."}), 400
        
    tender_markdown = generate_tender(prompt)
    return jsonify({"tender_markdown": tender_markdown}), 200

@app.route('/api/vendors', methods=['GET'])
def fetch_vendors():
    """Vendor Reputation Engine: Return aggregated vendor track record."""
    stats = get_vendor_stats()
    return jsonify({"vendor_stats": stats}), 200

@app.route('/api/tn-tenders/active', methods=['GET'])
def get_tn_tenders():
    """Fetch live active tenders from TN Tenders Portal."""
    tenders = fetch_active_tenders()
    return jsonify({"tenders": tenders}), 200

@app.route('/api/tn-tenders/score', methods=['POST'])
def score_tn_tender():
    """Score a TN tender against a vendor profile."""
    data = request.get_json()
    if not data or 'tender' not in data:
        return jsonify({"error": "No tender data provided."}), 400
        
    tender = data['tender']
    vendor_profile = data.get('vendor_profile', 'Standard General Contractor Profile: ISO 9001 certified, $5M turnover, experience in general supplies and services.')
    
    score_result = score_tender_eligibility(tender, vendor_profile)
    return jsonify(score_result), 200

@app.route('/api/risk-report', methods=['POST'])
def get_risk_report():
    """Generate a risk assessment report for a given vendor."""
    data = request.get_json()
    if not data or 'vendor' not in data:
        return jsonify({"error": "No vendor data provided."}), 400
    
    report = generate_risk_report(data['vendor'])
    return jsonify(report), 200

@app.route('/api/check-debarment', methods=['POST'])
def check_debarment():
    """Check if a vendor name appears on the TN Tenders debarment/blacklist."""
    data = request.get_json()
    if not data or 'vendor_name' not in data:
        return jsonify({"error": "No vendor name provided."}), 400
    
    debarment_list = fetch_debarment_list()
    matches = check_vendor_against_debarment(data['vendor_name'], debarment_list)
    return jsonify({
        "vendor_name": data['vendor_name'],
        "is_blacklisted": len(matches) > 0,
        "matches": matches,
        "total_debarred_in_db": len(debarment_list)
    }), 200

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Return aggregated analytics for the TenderGuard dashboard."""
    history = get_evaluation_history(limit=100)
    logs = get_audit_logs(limit=100)
    stats = get_vendor_stats()
    
    total_evaluations = len(history)
    total_vendors_evaluated = sum(h.get('vendor_count', 0) for h in history)
    total_bids_automated = sum(1 for l in logs if l.get('action') == 'BID_AUTOMATION')
    total_bias_checks = sum(1 for l in logs if l.get('action') == 'BIAS_CHECK')
    total_drafts = sum(1 for l in logs if l.get('action') == 'TENDER_DRAFT')
    
    # Top evaluated vendors
    top_vendors = stats[:5] if stats else []
    
    return jsonify({
        "total_evaluations": total_evaluations,
        "total_vendors_evaluated": total_vendors_evaluated,
        "total_bids_automated": total_bids_automated,
        "total_bias_checks": total_bias_checks,
        "total_drafts": total_drafts,
        "top_vendors": top_vendors,
        "recent_activity": logs[:10]
    }), 200

@app.route('/api/market-intel', methods=['GET'])
def get_market_intel():
    """Real-Time Tender Market Intelligence — aggregates multiple portals."""
    sources_param = request.args.get('sources', None)
    sources = sources_param.split(',') if sources_param else None
    data = fetch_all_market_tenders(sources)
    return jsonify(data), 200

@app.route('/api/evaluations/history', methods=['GET'])
def get_eval_history():
    """Fetch the list of past evaluations for the session drawer."""
    history = get_evaluation_history(limit=50)
    return jsonify(history), 200

@app.route('/api/evaluation/<eval_id>', methods=['GET'])
def get_evaluation(eval_id):
    """Fetch a specific evaluation session by ID."""
    doc = get_full_evaluation(eval_id)
    if not doc:
        return jsonify({"error": "Evaluation not found"}), 404
    return jsonify(doc), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
