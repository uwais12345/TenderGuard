import PyPDF2
import re

def extract_text_from_pdf(pdf_path):
    """Extracts and cleans text from an uploaded PDF file."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + " "
        
        # Basic text cleaning: remove extra whitespaces and newlines
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None
