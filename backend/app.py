import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

from modules.parser import extract_text_from_pdf
from modules.ai_model import evaluate_vendors_batch, ask_vendor_question

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
    # ── Get user requirements text ──
    user_requirements = request.form.get('user_requirements', '').strip()
    if not user_requirements:
        return jsonify({"error": "Please enter your tender requirements."}), 400

    # ── Get uploaded PDFs (multiple) ──
    uploaded_files = request.files.getlist('files')
    if not uploaded_files or all(f.filename == '' for f in uploaded_files):
        return jsonify({"error": "Please upload at least one contractor proposal PDF."}), 400

    # ── Process each PDF ──
    parsed_proposals = []

    for file in uploaded_files:
        if file.filename == '' or not allowed_file(file.filename):
            continue

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Extract text from this PDF
        parsed_text = extract_text_from_pdf(filepath)
        if parsed_text:
            parsed_proposals.append({
                "filename": filename,
                "parsed_text": parsed_text
            })

    if not parsed_proposals:
        return jsonify({"error": "Could not parse any of the uploaded PDFs."}), 500

    # ── Vendor Evaluation via Gemini AI ──
    evaluation_result = evaluate_vendors_batch(user_requirements, parsed_proposals)

    return jsonify({
        "message": "Evaluation complete",
        "files_processed": len(parsed_proposals),
        "evaluation": evaluation_result
    }), 200


@app.route('/api/chat', methods=['POST'])
def chat_with_vendor():
    """
    RAG endpoint: Answer a question about a specific vendor's proposal PDF.
    Expects JSON: { "vendor_pdf_text": "...", "message": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400

    pdf_text = data.get('vendor_pdf_text', '').strip()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({"error": "Please provide a question."}), 400
    if not pdf_text:
        return jsonify({"error": "No proposal text provided for this vendor."}), 400

    reply = ask_vendor_question(pdf_text, message)

    return jsonify({"reply": reply}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
