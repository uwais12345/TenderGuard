import os
import json
import google.generativeai as genai

# Initialize Gemini model parameters
# The actual API key is picked up automatically from the GEMINI_API_KEY env variable by the google SDK.
def _get_gemini_model():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing. Please set it in your .env file.")
    
    genai.configure(api_key=api_key)
    # Using gemini-flash-latest for compatibility
    return genai.GenerativeModel(
        model_name="gemini-flash-latest",
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.2, # Low temperature for more deterministic, analytical responses
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
    """
    try:
        model = _get_gemini_model()
    except Exception as e:
        return {
            "top_vendors": [],
            "total_evaluated": len(parsed_proposals),
            "analysis_summary": f"System Error: {str(e)}"
        }

    # Prepare the context for Gemini
    proposals_context = []
    for prop in parsed_proposals:
        proposals_context.append({
            "filename": prop["filename"],
            "document_content": prop["parsed_text"]
        })

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
      "cons": ["Weakness 1"]
    }}
  ],
  "analysis_summary": "A 1-2 sentence overall summary of the evaluation."
}}
"""

    try:
        response = model.generate_content(prompt)
        # response.text is guaranteed to be a JSON string because of response_mime_type
        result_data = json.loads(response.text)
        
        return {
            "top_vendors": result_data.get("top_vendors", []),
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
