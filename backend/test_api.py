import os
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

api_key = os.environ.get('GEMINI_API_KEY')
print(f"Key loaded: {api_key[:10]}...")

genai.configure(api_key=api_key)

# Test 1 - plain text
model_text = genai.GenerativeModel('gemini-flash-latest')
r1 = model_text.generate_content('Say hello')
print("Plain text OK:", r1.text[:50])

# Test 2 - JSON mode (this is what evaluation uses)
model_json = genai.GenerativeModel(
    'gemini-flash-latest',
    generation_config={"response_mime_type": "application/json", "temperature": 0.2}
)
r2 = model_json.generate_content('Return this JSON: {"status": "ok"}')
print("JSON mode OK:", r2.text[:100])
