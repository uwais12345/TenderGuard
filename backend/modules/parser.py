import PyPDF2
import re
import os

try:
    import pytesseract
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: pytesseract or pdf2image not installed. OCR disabled.")

def extract_text_from_pdf(pdf_path):
    """Extracts and cleans text from an uploaded PDF file, falling back to OCR if needed."""
    text = ""
    try:
        # Try standard text extraction first
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # If extraction is extremely short, it's likely a scanned image PDF
        if len(text) < 50 and OCR_AVAILABLE:
            print(f"Standard extraction failed or returned too little text (< 50 chars). Falling back to OCR for {pdf_path}...")
            try:
                # Convert PDF pages to images
                images = convert_from_path(pdf_path)
                ocr_text = ""
                for img in images:
                    ocr_text += pytesseract.image_to_string(img) + " "
                
                # Clean OCR text
                ocr_text = re.sub(r'\s+', ' ', ocr_text).strip()
                if ocr_text:
                    print("OCR extraction successful.")
                    return ocr_text
            except Exception as ocr_e:
                print(f"OCR fallback failed: {ocr_e}. Please visually ensure Tesseract and Poppler are installed on Windows.")
                # We return whatever little text we had, or empty
                return text

        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None
