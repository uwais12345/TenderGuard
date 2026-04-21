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

    Args:
        user_requirements_text (str): The typed tender requirements string.
        parsed_proposals (list): A list of dicts, each with 'filename' and 'parsed_text'.

    Returns:
        Dict with 'top_vendors', 'total_evaluated', and 'analysis_summary'.
        Each vendor also includes 5 sub-scores for radar chart visualization.
    """
    try:
        model = _get_json_model()
    except Exception as e:
        return {
            "top_vendors": [],
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": f"System Error: {str(e)}"
        }

    # Prepare the context for Gemini, including parsed text keyed by filename
    proposals_context = []
    parsed_text_map = {}
    for prop in parsed_proposals:
        proposals_context.append({
            "filename": prop["filename"],
            "document_content": prop["parsed_text"]
        })
        parsed_text_map[prop["filename"]] = prop["parsed_text"]

    prompt = f"""
You are an expert procurement and tender evaluation assistant.
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
Determine the company's name from their proposal document. If not perfectly clear, use the filename or a generic descriptive name.
Assign a 'match_score' (0-100) representing how well their proposal meets the user requirements.
Assign a 'success_rate' (0-100) representing their overall reliability or documented past success.
Summarize their 'past_history'.
Extract up to 4 'pros' (strengths) and up to 4 'cons' (weaknesses).
Also assign 5 sub-dimension scores (0-100 each):
  - 'cost_score': How competitive/affordable is their pricing?
  - 'delivery_score': How fast and reliable is their delivery/execution?
  - 'compliance_score': How well do they meet regulatory/certification standards?
  - 'security_score': How strong are their data/infrastructure security practices?
  - 'experience_score': How experienced are they with similar large-scale projects?
Sort the top vendors by match_score descending. Provide at most 3 top vendors.

Return a JSON object EXACTLY in the following schema:
{{
  "top_vendors": [
    {{
      "company_name": "Company Name",
      "source_file": "document filename",
      "match_score": 95,
      "success_rate": 88,
      "past_history": "Summary of their past experience",
      "pros": ["Strength 1", "Strength 2"],
      "cons": ["Weakness 1"],
      "cost_score": 80,
      "delivery_score": 90,
      "compliance_score": 85,
      "security_score": 78,
      "experience_score": 92
    }}
  ],
  "analysis_summary": "A 1-2 sentence overall summary of the evaluation."
}}
"""

    try:
        response = model.generate_content(prompt)
        result_data = json.loads(response.text)

        # Attach parsed_text to each vendor for frontend RAG chat
        top_vendors = result_data.get("top_vendors", [])
        for vendor in top_vendors:
            src = vendor.get("source_file", "")
            vendor["parsed_text"] = parsed_text_map.get(src, "")

        return {
            "top_vendors": top_vendors,
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": result_data.get("analysis_summary", "Evaluation completed successfully.")
        }
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "top_vendors": [],
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": f"Failed to perform LLM analysis: {str(e)}"
        }


def ask_vendor_question(pdf_text, question):
    """
    RAG: Answer a specific question about a vendor's proposal PDF.

    Args:
        pdf_text (str): The full extracted text from the vendor's proposal PDF.
        question (str): The user's question about the proposal.

    Returns:
        str: The AI-generated answer.
    """
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
