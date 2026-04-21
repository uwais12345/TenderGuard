# TenderGuard 🛡️

TenderGuard is an enterprise-grade, AI-powered e-procurement suite designed to automate and secure the government public tendering process. It eliminates manual reading of lengthy proposals, removes human bias, and provides a fully mathematically-backed, auditable evaluation matrix.

## 🚀 Key Features

*   **Generative AI Tender Drafter:** Automatically generates compliant, non-restrictive, and professional Request for Proposals (RFPs) from brief user prompts.
*   **Vendor Evaluation Engine:** Upload multiple PDF proposals and the system will automatically parse them, map them against strict mandatory clauses, and assign a percentage matching score.
*   **Financial L1/L2/L3 Ranking:** Automatically extracts total bid values, computes GST logic, highlights unit prices & delivery timelines, and ranks bidders financially. 
*   **Clause-by-Clause Compliance Matrix:** Generates a strict PASS/FAIL matrix extracting exact quotes from vendor PDFs to justify why they meet or fail eligibility criteria.
*   **Vigilance Bias Checker:** Allows auditors to upload draft tenders and automatically flags "Brand Locking" or exclusionary, biased clauses before publication.
*   **MongoDB Vendor Reputation Data:** Stores historical bidding data to compute a vendor's global track record (Win Rate, Average L1 occurrences, etc.) over time.
*   **Immutable Audit Trail:** Creates a government-compliant ledger of every evaluation, export, chat, and action taken by officers.
*   **Contextual RAG Chat:** "Ask AI" queries specifically about a vendor's uploaded document to clarify doubts instantly. 
*   **Tesseract OCR Fallback:** Designed to read both pure digital PDFs and scanned, image-based historical documents.

---

## 🛠️ Technology Stack

**Backend**
*   **Python / Flask:** Core RESTful API routing.
*   **Google Gemini API:** LLM reasoning engine for document parsing and generative drafting.
*   **MongoDB (Motor/PyMongo):** NoSQL document store for evaluation results, vendor history, and audit logs.
*   **PyPDF2, pdf2image & Pytesseract:** Advanced PDF parsing and Optical Character Recognition.

**Frontend**
*   **React.js (Vite):** Fast, component-based user interface.
*   **Lucide-React:** Lightweight, crisp iconography.
*   **React-Markdown:** For rendering live generative-AI responses.
*   **Vanilla CSS:** Custom luxury design system featuring glassmorphism, skeleton loaders, and micro-animations.

---

## ⚙️ Local Development & Setup

### 1. Prerequisites (Crucial for OCR capabilities)
If you intend to parse scanned images, you must have the following system dependencies installed mathematically:
*   [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
*   [Poppler](https://poppler.freedesktop.org/) (for `pdf2image`)

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend

# Create and activate a Virtual Environment
python -m venv venv
.\venv\Scripts\activate   # Windows

# Install Dependencies
pip install -r requirements.txt

# Environment Variables
# Rename .env.example to .env and input your Google API Key and your local MONGO_URI
# GEMINI_API_KEY="your_api_key_here"
# MONGO_URI="mongodb://localhost:27017/"

# Run the Flask Server
python app.py
```

### 3. Frontend Setup
Open a separate terminal and navigate to the `frontend` directory:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be accessible at `http://localhost:5173` (or port 5174).

---

## 📖 Modules Overview

1.  **Vendor Evaluation:** The core dashboard. Upload your Requirements PDF and multiple Vendor Proposal PDFs. The system will rate and rank them.
2.  **Tender Drafter:** A generative tool to instantly write RFPs based on natural language constraints.
3.  **Bias & Vigilance Check:** A tool for compliance officers to audit drafts for brand-locking prior to publication.
4.  **Vendor Directory:** A global view of all vendors in the MongoDB database, showing historical scores and ranking win rates.
