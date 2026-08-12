import re
from typing import List

# Common resume section headers to split on
SECTION_HEADERS = [
    "experience", "work experience", "professional experience",
    "projects", "personal projects", "academic projects",
    "skills", "technical skills", "skills & tools",
    "education", "certifications", "achievements",
    "publications", "extracurricular", "summary", "objective",
]


def chunk_resume(text: str, max_chunk_chars: int = 700) -> List[str]:
    """
    Split resume text into semantically meaningful chunks.
    Strategy: split on blank lines / bullet boundaries first, then
    merge small lines into chunks up to max_chunk_chars so each chunk
    is roughly "one bullet / one project / one role".
    """
    # Normalize whitespace
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    chunks = []
    buffer = ""
    for line in lines:
        is_header = line.lower().strip(" :") in SECTION_HEADERS
        if is_header and buffer:
            chunks.append(buffer.strip())
            buffer = ""
            continue

        candidate = (buffer + "\n" + line).strip() if buffer else line
        if len(candidate) > max_chunk_chars:
            if buffer:
                chunks.append(buffer.strip())
            buffer = line
        else:
            buffer = candidate

    if buffer:
        chunks.append(buffer.strip())

    # Filter out tiny noise chunks (e.g. stray single words)
    chunks = [c for c in chunks if len(c) > 15]
    return chunks


def extract_jd_requirements(jd_text: str) -> List[str]:
    """
    Pull out likely requirement/skill lines from a JD: bullet points,
    or lines containing common requirement keywords.
    """
    lines = [ln.strip("-•* \t") for ln in jd_text.split("\n") if ln.strip()]
    keep = []
    keyword_pattern = re.compile(
        r"\b(experience|proficien|knowledge of|familiar with|skills?|degree|years?|required|preferred|responsib)\b",
        re.IGNORECASE,
    )
    for ln in lines:
        if len(ln) < 8:
            continue
        if keyword_pattern.search(ln) or ln.endswith((".", ":")) is False:
            keep.append(ln)

    if not keep:
        # Fallback: just chunk the whole JD into sentences
        keep = re.split(r"(?<=[.!?])\s+", jd_text)
        keep = [k.strip() for k in keep if len(k.strip()) > 15]

    return keep[:25]
