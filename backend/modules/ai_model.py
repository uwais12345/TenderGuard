import os
import json
import google.generativeai as genai


def _configure_genai():
    """Configure the Gemini SDK with the API key from environment."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing. Please set it in your .env file.")
    genai.configure(api_key=api_key)


def _get_json_model():
    """Returns a Gemini model configured for structured JSON output."""
    _configure_genai()
    return genai.GenerativeModel(
        model_name="gemini-flash-latest",
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.2,
        }
    )


def _get_text_model():
    """Returns a Gemini model configured for plain text output (used for chat)."""
    _configure_genai()
    return genai.GenerativeModel(
        model_name="gemini-flash-latest",
        generation_config={
            "temperature": 0.4,
        }
    )


def evaluate_vendors_batch(user_requirements_text, parsed_proposals):
    """
    Batch vendor evaluation using Google Gemini.
    Extracts technical scores AND financial bid data for L1/L2/L3 ranking.
    """
    try:
        model = _get_json_model()
    except Exception as e:
        return {
            "top_vendors": [],
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": f"System Error: {str(e)}",
            "financial_summary": ""
        }

    proposals_context = []
    parsed_text_map = {}
    for prop in parsed_proposals:
        proposals_context.append({
            "filename": prop["filename"],
            "document_content": prop["parsed_text"]
        })
        parsed_text_map[prop["filename"]] = prop["parsed_text"]

    prompt = f"""
You are an expert procurement and tender evaluation assistant for government e-procurement systems.
Your task is to evaluate the following contractor proposals against the specified user requirements.

User/Tender Requirements:
'''
{user_requirements_text}
'''

Contractor Proposals:
'''
{json.dumps(proposals_context, indent=2)}
'''

Analyze each proposal against the requirements.
Determine the company name from their proposal document. If not clear, use the filename.
Assign a 'match_score' (0-100): how well their proposal meets the user requirements.
Assign a 'success_rate' (0-100): overall reliability based on past documented experience.
Summarize their 'past_history'.
Extract up to 4 'pros' and up to 4 'cons'.
Assign 5 sub-dimension scores (0-100 each):
  - cost_score: pricing competitiveness
  - delivery_score: speed and reliability of delivery
  - compliance_score: regulatory and certification standards
  - security_score: security practices
  - experience_score: relevant past project experience

FINANCIAL BID EXTRACTION (critical for government L1 procurement):
Extract from each proposal:
  - total_bid_value: total quoted price as number (null if not found)
  - unit_price: price per unit as number (null if not found)
  - currency: currency code, default "INR"
  - gst_percentage: GST percentage as number (null if not found)
  - gst_amount: GST amount as number (null if not found)
  - total_with_gst: final total including taxes as number (null if not found)
  - payment_terms: payment terms string ("Not specified" if not found)
  - delivery_days: delivery timeline in days as number (null if not found)
  - bid_validity_days: bid validity period in days as number (null if not found)
  - l_rank: 1 for lowest bid (L1), 2 for second lowest (L2), 3 for third (L3), null if price unknown

CLAUSE-BY-CLAUSE COMPLIANCE MATRIX (Critical for technical evaluation):
Extract individual mandatory requirements from the User/Tender Requirements.
For each vendor, evaluate against every extracted requirement.
  - 'clause': The specific requirement (e.g., "Must have ISO 27001", "Turnover > $1M")
  - 'status': "PASS", "FAIL", or "PARTIAL"
  - 'rationale': Brief explanation of why they passed or failed based solely on the text
  - 'excerpt': A short, direct quote from their proposal proving the status (or "Not mentioned" if absent)

Sort top_vendors by match_score descending. Return at most 3 vendors.

Return EXACTLY this JSON schema:
{{
  "top_vendors": [
    {{
      "company_name": "string",
      "source_file": "string",
      "match_score": 95,
      "success_rate": 88,
      "past_history": "string",
      "pros": ["string"],
      "cons": ["string"],
      "cost_score": 80,
      "delivery_score": 90,
      "compliance_score": 85,
      "security_score": 78,
      "experience_score": 92,
      "total_bid_value": 4500000,
      "unit_price": 45000,
      "currency": "INR",
      "gst_percentage": 18,
      "gst_amount": 810000,
      "total_with_gst": 5310000,
      "payment_terms": "30% advance, 70% on delivery",
      "delivery_days": 15,
      "bid_validity_days": 90,
      "l_rank": 1,
      "compliance_matrix": [
        {{
          "clause": "string",
          "status": "PASS/FAIL/PARTIAL",
          "rationale": "string",
          "excerpt": "string"
        }}
      ]
    }}
  ],
  "analysis_summary": "string",
  "financial_summary": "string"
}}
"""

    try:
        response = model.generate_content(prompt)
        result_data = json.loads(response.text)

        top_vendors = result_data.get("top_vendors", [])
        for vendor in top_vendors:
            src = vendor.get("source_file", "")
            vendor["parsed_text"] = parsed_text_map.get(src, "")

        return {
            "top_vendors": top_vendors,
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": result_data.get("analysis_summary", "Evaluation completed successfully."),
            "financial_summary": result_data.get("financial_summary", "")
        }
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "top_vendors": [],
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": f"Failed to perform LLM analysis: {str(e)}",
            "financial_summary": ""
        }


def ask_vendor_question(pdf_text, question):
    """RAG: Answer a specific question about a vendor's proposal PDF."""
    try:
        model = _get_text_model()
    except Exception as e:
        return f"System Error: {str(e)}"

    prompt = f"""You are an expert procurement analyst. You have been given the full text of a contractor's tender proposal.
Answer the user's question strictly based on the information present in the document.
If the answer is not explicitly stated in the document, say "This information is not specified in the proposal."

Proposal Document:
'''
{pdf_text[:8000]}
'''

User Question: {question}

Provide a concise, accurate, and professional answer."""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        return f"Failed to generate answer: {str(e)}"

def analyze_tender_bias(draft_tender_text):
    """
    Vigilance Officer Tool: Analyzes a draft tender document for bias, brand-locking, and restrictive clauses.
    Returns a JSON object with restrictive score and flagged clauses.
    """
    try:
        model = _get_json_model()
    except Exception as e:
        return {"error": str(e)}

    prompt = f"""
You are a strict Government Vigilance and Procurement Audit Officer.
Your task is to analyze the following draft tender document written by a procurement department BEFORE it is published to the public.
You are looking for ANY signs of bias, brand-lock, overly restrictive technical criteria, or unjustified vendor exclusion.

Examples of restrictive clauses:
- Mentioning a specific brand (e.g., "Intel Processor", "Apple iPad", "Cisco Router") instead of generic specs ("8-core x86 processor", "Tablet", "Enterprise Router").
- Extremely specific dimensions or weights that serve no functional purpose but match exactly one manufacturer's product.
- Unreasonably high turnover requirements or past experience requirements that exclude competent MSMEs.
- Asking for a specific proprietary certification when a general equivalent exists.

Draft Tender Document:
'''
{draft_tender_text[:15000]}
'''

Analyze the document and return a JSON object EXACTLY matching this schema:
{{
  "restrictive_score": 0, // 0 to 100. 0 = perfectly neutral, 100 = highly biased/restrictive
  "overall_assessment": "Short 2 sentence summary of the fairness of this tender.",
  "flagged_clauses": [
    {{
      "clause": "The exact sentence from the text",
      "issue_type": "Brand Lock" | "Overly Restrictive Spec" | "Unjustified Barrier",
      "explanation": "Why this is a problem",
      "suggestion": "How to rewrite it generically"
    }}
  ]
}}
"""
    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Bias Checker Error: {e}")
        return {"error": str(e)}
