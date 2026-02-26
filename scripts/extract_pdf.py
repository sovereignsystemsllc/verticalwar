import pdfplumber
import argparse
import sys
import os

def extract_pdf_to_text(pdf_path, output_path):
    """
    Extracts text from a given PDF file and writes it to an output text file.
    Uses pdfplumber to maintain basic structure during extraction.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        sys.exit(1)

    try:
        print(f"Opening {pdf_path}...")
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for i, page in enumerate(pdf.pages):
                extracted = page.extract_text()
                if extracted:
                    full_text += extracted + "\n"
                print(f"  -> Extracted page {i + 1}/{len(pdf.pages)}")
            
        # Ensure output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_text)
            
        print(f"\nSuccess! Extracted {len(pdf.pages)} pages of text.")
        print(f"Saved to: {output_path}")
        
    except Exception as e:
        print(f"Error reading or extracting PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract text from a PDF file for Sovereign Codex HTML conversion.")
    parser.add_argument("input_pdf", help="Absolute or relative path to the input PDF file")
    parser.add_argument("output_txt", help="Absolute or relative path for the output text file")
    
    args = parser.parse_args()
    
    extract_pdf_to_text(args.input_pdf, args.output_txt)
