import pdfplumber
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from a PDF file's bytes."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts).strip()
