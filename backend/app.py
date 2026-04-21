import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

from modules.parser import extract_text_from_pdf
from modules.ai_model import evaluate_vendors_batch, ask_vendor_question, analyze_tender_bias
from modules.database import save_evaluation, write_audit_log, get_audit_logs, get_evaluation_history

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
