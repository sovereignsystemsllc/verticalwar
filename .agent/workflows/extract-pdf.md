---
description: Extract text from Substack PDFs for Codex HTML Injection
---
This workflow extracts text from legacy Substack PDFs and prepares them for subsequent AI parsing and injection into the Sovereign Supabase.

// turbo

1. Install the required `pdfplumber` dependency in the Python environment:

```powershell
pip install pdfplumber
```

1. Run the extraction pipeline script. **Note: I will ask the Operator for the absolute paths to the PDF they want to parse, and where they want the output text file saved before executing this step.**

```powershell
python -u scripts/extract_pdf.py "{input_pdf_path}" "{output_txt_path}"
```

1. Ensure the extracted text is verified, and then prepare it for subsequent AI parsing using the Sovereign Context to convert it into raw V3 HTML layout, which can then be directly inserted into the Supabase `articles` table.
