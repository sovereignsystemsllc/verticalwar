# Sovereign V3 Extraction Tools

This directory contains standalone utility scripts for operating the Sovereign architecture out-of-band.

## The Forerunner Pipeline

These scripts are designed to metamorphose legacy, siloed data (such as Substack PDF exports) into Sovereign V3's dynamic payload stream.

### `extract_pdf.py`

A tactical text-miner built on `pdfplumber`. It securely rips plaintext from Substack export PDFs while maintaining block structure, making it the first stage of the Matrix Base HTML conversion flow.

**Dependencies:**

```bash
pip install pdfplumber
```

**Usage:**

```bash
python scripts/extract_pdf.py "path/to/input.pdf" "path/to/output.txt"
```

*Note: Ensure paths are wrapped in quotes if they contain spaces. The output txt file can then be fed into the Gemini context for intelligent HTML conversion before Supabase injection.*
