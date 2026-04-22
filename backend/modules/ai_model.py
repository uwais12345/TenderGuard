import os
import json
from google import genai
from google.genai import types

def _get_genai_client():
    """Returns the configured Gemini Client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing. Please set it in your .env file.")
    return genai.Client(api_key=api_key)

def _generate_json(prompt):
    """Generates JSON output using the gemini-2.5-flash model."""
    client = _get_genai_client()
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.2,
    )
    return client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=config
    )

def _generate_text(prompt):
    """Generates plain text output using the gemini-2.5-flash model."""
    client = _get_genai_client()
    config = types.GenerateContentConfig(
        temperature=0.4,
    )
    return client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=config
    )

def compress_proposal(text):
    """
    Compresses a raw PDF text into a dense, signal-rich summary for evaluation.
    This prevents the AI from truncating long documents and missing critical data.
    """
    # If it's already short enough, don't waste API calls
    if len(text) < 3000:
        return text
        
    prompt = f"""
You are an expert Procurement Data Extractor.
The following text is raw, potentially noisy text extracted from a vendor's proposal PDF. It may be very long.
Your job is to compress this document into a dense summary containing ONLY the critical information needed for a procurement officer to evaluate the bid.

EXTRACT AND SUMMARIZE THE FOLLOWING:
1. Company Name & Background
2. Financial Bid Details (Total price, unit price, taxes, currency)
3. Delivery terms, timelines, and payment terms
4. Compliance & Certifications (ISO, MSME, etc.)
5. Past Projects & Experience relevant to the bid
6. Specific technical specifications of the product/service offered
7. Pros, strengths, or value-adds
8. Cons, limitations, or deviations from standard terms

Do NOT include fluff, marketing talk, or filler words. Use bullet points and keep it as dense as possible.

Raw Text:
'''
{text}
'''
"""
    try:
        response = _generate_text(prompt)
        return response.text
    except Exception as e:
        print(f"Compression error: {e}")
        # Fallback to truncated text if compression fails
        return text[:8000]



def evaluate_vendors_batch(user_requirements_text, parsed_proposals):
    """
    Batch vendor evaluation using Google Gemini.
    Extracts technical scores AND financial bid data for L1/L2/L3 ranking.
    """
    # Wrap checking just in case key is missing
    try:
        _get_genai_client()
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
        print(f"Compressing document: {prop['filename']}...")
        compressed_text = compress_proposal(prop["parsed_text"])
        proposals_context.append({
            "filename": prop["filename"],
            "document_content": compressed_text
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
        response = _generate_json(prompt)
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
        _get_genai_client()
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
        response = _generate_text(prompt)
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
        _get_genai_client()
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
        response = _generate_json(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Bias Checker Error: {e}")
        return {"error": str(e)}

def generate_tender(prompt_text):
    """
    Generates a formal, vendor-neutral Government Request for Proposal (RFP) / Tender Document
    based on a short natural language prompt from the user.
    """
    try:
        _get_genai_client()
    except Exception as e:
        return f"System Error: {str(e)}"

    prompt = f"""
You are an expert Government Procurement Officer and Technical RFP Writer.
Your task is to write a complete, professional, and compliant Request for Proposal (RFP) / Tender Document based on the user's brief request.

The document MUST NOT contain any brand-locking or restrictive criteria. Use generic specifications.
Format the output as clean Markdown.
Use the following structure:
# REQUEST FOR PROPOSAL (RFP)
**Tender Reference Number:** RFP-{'{import random; random.randint(1000,9999)}'}-2026
**Issue Date:** [Current Date]

## 1. Introduction & Background
## 2. Scope of Work / Technical Specifications
(Ensure these are generic and completely vendor-neutral)
## 3. Eligibility Criteria
(Turnover, past experience, required non-restrictive certs)
## 4. Delivery & Payment Terms
## 5. Bid Submission Guidelines

User's Request: "{prompt_text}"

Generate the full Markdown document now:
"""
    try:
        response = _generate_text(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini Generative Tender Error: {e}")
        return f"Failed to generate tender: {str(e)}"

def score_tender_eligibility(tender_metadata, vendor_profile):
    """
    Analyzes a fetched TN Tender against a vendor profile to determine Go/No-Go eligibility.
    """
    try:
        _get_genai_client()
    except Exception as e:
        return {"error": str(e)}

    prompt = f"""
You are an expert Procurement Bid/No-Bid Analyst.
Your task is to analyze a live government tender requirement and compare it against the user's Vendor Profile to output an eligibility score.

Tender Details:
'''
Title: {tender_metadata.get('title', 'Unknown')}
Reference No: {tender_metadata.get('id', 'Unknown')}
'''

Vendor Profile:
'''
{vendor_profile}
'''

Determine a 'Go/No-Go' eligibility score (0-100%) and provide a brief rationale explaining why they are or are not a good fit for this tender based purely on the title and any inferred typical requirements for this type of tender.

Return EXACTLY this JSON schema:
{{
  "eligibility_score": 0,
  "decision": "GO" | "NO-GO" | "MARGINAL",
  "rationale": "Brief 2-3 sentence explanation",
  "missing_requirements": ["list of likely missing certs or capacity, if any"]
}}
"""
    try:
        response = _generate_json(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Eligibility Scoring Error: {e}")
        return {"error": str(e)}

def generate_risk_report(vendor_data):
    """
    Generates a deep risk assessment report for a vendor based on their evaluation data.
    Covers financial, operational, compliance, and geopolitical risk dimensions.
    """
    try:
        _get_genai_client()
    except Exception as e:
        return {"error": str(e)}

    prompt = f"""
You are a Senior Procurement Risk Analyst for the Tamil Nadu Government.
Your job is to generate a comprehensive risk assessment report for the following vendor
based on their evaluation data.

Vendor Data:
'''
Company Name: {vendor_data.get('company_name', 'Unknown')}
Match Score: {vendor_data.get('match_score', 'N/A')}%
Success Rate: {vendor_data.get('success_rate', 'N/A')}%
Past History: {vendor_data.get('past_history', 'Not provided')}
Pros: {json.dumps(vendor_data.get('pros', []))}
Cons: {json.dumps(vendor_data.get('cons', []))}
Financial Bid Value: {vendor_data.get('total_bid_value', 'Not disclosed')}
Delivery Days: {vendor_data.get('delivery_days', 'Not specified')}
Compliance Score: {vendor_data.get('compliance_score', 'N/A')}
'''

Generate a structured risk report with these 4 risk dimensions:
1. Financial Risk - Can they deliver within budget? Are they financially stable?
2. Delivery / Operational Risk - Can they meet timelines? Any capacity concerns?
3. Compliance Risk - Are there regulatory or certification gaps?
4. Reputational Risk - Based on past history, any red flags?

For each risk, assign:
- risk_level: "LOW", "MEDIUM", or "HIGH"
- risk_score: 0-100 (higher = more risky)
- summary: 1-2 sentence assessment

Also provide:
- overall_risk_score: 0-100 (weighted average)
- overall_risk_level: "LOW", "MEDIUM", or "HIGH"
- top_recommendation: One clear action the procurement officer should take

Return EXACTLY this JSON schema:
{{
  "overall_risk_score": 35,
  "overall_risk_level": "MEDIUM",
  "top_recommendation": "string",
  "dimensions": {{
    "financial": {{ "risk_level": "LOW", "risk_score": 20, "summary": "string" }},
    "delivery": {{ "risk_level": "MEDIUM", "risk_score": 45, "summary": "string" }},
    "compliance": {{ "risk_level": "LOW", "risk_score": 15, "summary": "string" }},
    "reputational": {{ "risk_level": "HIGH", "risk_score": 70, "summary": "string" }}
  }}
}}
"""
    try:
        response = _generate_json(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Risk Report Error: {e}")
        return {"error": str(e)}
