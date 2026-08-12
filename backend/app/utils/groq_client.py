import json
from groq import Groq
from app.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY)


def _chat(system: str, user: str) -> str:
    completion = _client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.4,
        max_tokens=800,
    )
    return completion.choices[0].message.content.strip()


def generate_question_for_chunk(resume_chunk: str, jd_requirement: str) -> dict:
    """
    Given a resume chunk (grounded context) and the JD requirement it was
    retrieved for, generate one likely interview question plus a model
    STAR-format answer, grounded only in the resume chunk provided.
    """
    system = (
        "You are an experienced technical interviewer. You generate one sharp, "
        "specific interview question based ONLY on the resume excerpt given, "
        "targeted at the job requirement provided. Then provide a strong model "
        "answer in STAR format (Situation, Task, Action, Result), written as if "
        "the candidate is answering, using only facts that could plausibly come "
        "from the resume excerpt - do not invent unrelated details. "
        "Respond ONLY with valid JSON, no markdown fences, no preamble, in this "
        'exact shape: {"question": "...", "category": "project|skill|experience|behavioral", '
        '"model_answer": "..."}'
    )
    user = (
        f"Job requirement: {jd_requirement}\n\n"
        f"Resume excerpt:\n{resume_chunk}\n\n"
        "Generate the question and model answer now."
    )
    raw = _chat(system, user)
    return _safe_json(raw, fallback_question=jd_requirement)


def score_user_answer(question: str, model_answer: str, user_answer: str) -> dict:
    """Compare the user's practice answer against the model answer and give feedback."""
    system = (
        "You are an interview coach. Compare the candidate's answer to the model "
        "answer for the same question, and give constructive, specific feedback "
        "(2-4 sentences) plus a score from 1-10 for how complete and convincing "
        "the answer is. Respond ONLY with valid JSON, no markdown fences: "
        '{"feedback": "...", "score": <int 1-10>}'
    )
    user = (
        f"Question: {question}\n\n"
        f"Model answer: {model_answer}\n\n"
        f"Candidate's answer: {user_answer}\n\n"
        "Give feedback and a score now."
    )
    raw = _chat(system, user)
    parsed = _safe_json(raw, fallback_question=None)
    if "feedback" not in parsed:
        parsed = {"feedback": raw, "score": 5}
    return parsed


def chat_reply(history: list[dict], retrieved_context: str, resume_summary: str, jd_summary: str) -> str:
    """
    Conversational turn with memory: history is a list of {"role": "user"|"assistant", "content": "..."}
    from earlier in this session. retrieved_context is the resume chunk(s) most relevant to the
    latest user message (RAG retrieval for this turn).
    """
    system = (
        "You are an interview prep assistant helping a candidate prepare for a specific job. "
        "You have access to the candidate's resume and the job description they're targeting. "
        "Answer their questions directly and specifically, grounding anything about their "
        "background in the retrieved resume context below - never invent experience they don't "
        "have. If they ask for more interview questions, generate new ones distinct from what's "
        "already been discussed in this conversation. Keep answers focused and practical, a few "
        "sentences to a short paragraph unless they ask for a list.\n\n"
        f"Job description summary: {jd_summary}\n\n"
        f"Relevant resume context for the current question:\n{retrieved_context or '(no strongly relevant chunk found)'}"
    )

    messages = [{"role": "system", "content": system}]
    # include prior turns for memory (cap to last 12 messages to keep context tight)
    messages.extend(history[-12:])

    completion = _client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=0.5,
        max_tokens=600,
    )
    return completion.choices[0].message.content.strip()


def _safe_json(raw: str, fallback_question: str | None) -> dict:
    # Strip accidental markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "question": fallback_question or "Tell me more about this experience.",
            "category": "general",
            "model_answer": raw,
        }