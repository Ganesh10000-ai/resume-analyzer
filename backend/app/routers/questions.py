from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas, auth
from app.utils.chunker import extract_jd_requirements
from app.utils.vectorstore import retrieve_relevant_chunks
from app.utils.groq_client import generate_question_for_chunk, score_user_answer, chat_reply

router = APIRouter(tags=["sessions"])


@router.post("/sessions/generate", response_model=schemas.SessionOut)
def generate_session(
    payload: schemas.GenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == payload.resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    jd = (
        db.query(models.JobDescription)
        .filter(models.JobDescription.id == payload.jd_id, models.JobDescription.user_id == current_user.id)
        .first()
    )
    if not resume or not jd:
        raise HTTPException(status_code=404, detail="Resume or job description not found")

    session = models.InterviewSession(
        user_id=current_user.id, resume_id=resume.id, jd_id=jd.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # --- RAG pipeline ---
    # 1. Break JD into individual requirement lines
    requirements = extract_jd_requirements(jd.raw_text)[: payload.num_questions]

    seen_chunks = set()
    for req in requirements:
        # 2. Retrieve the resume chunk(s) most relevant to this requirement
        chunks = retrieve_relevant_chunks(resume.chroma_collection, req, top_k=1)
        if not chunks:
            continue
        chunk = chunks[0]
        dedupe_key = chunk[:80]
        if dedupe_key in seen_chunks:
            continue
        seen_chunks.add(dedupe_key)

        # 3. Generate a grounded question + model answer from that chunk
        result = generate_question_for_chunk(chunk, req)

        question = models.Question(
            session_id=session.id,
            question_text=result.get("question", req),
            category=result.get("category", "general"),
            source_snippet=chunk,
            model_answer=result.get("model_answer", ""),
        )
        db.add(question)

    db.commit()
    db.refresh(session)

    # eager-load questions for response
    session = (
        db.query(models.InterviewSession)
        .options(joinedload(models.InterviewSession.questions))
        .filter(models.InterviewSession.id == session.id)
        .first()
    )
    return session


@router.get("/sessions", response_model=list[schemas.SessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.InterviewSession)
        .options(joinedload(models.InterviewSession.questions))
        .filter(models.InterviewSession.user_id == current_user.id)
        .order_by(models.InterviewSession.created_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session = (
        db.query(models.InterviewSession)
        .options(joinedload(models.InterviewSession.questions))
        .filter(models.InterviewSession.id == session_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/questions/{question_id}/answer", response_model=schemas.AnswerFeedbackOut)
def submit_answer(
    question_id: int,
    payload: schemas.AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    question = (
        db.query(models.Question)
        .join(models.InterviewSession)
        .filter(models.Question.id == question_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    result = score_user_answer(question.question_text, question.model_answer, payload.answer_text)
    feedback_text = result.get("feedback", "")
    score = int(result.get("score", 5))

    existing = db.query(models.UserAnswer).filter(models.UserAnswer.question_id == question_id).first()
    if existing:
        existing.answer_text = payload.answer_text
        existing.feedback = feedback_text
        existing.score = score
    else:
        answer = models.UserAnswer(
            question_id=question_id,
            answer_text=payload.answer_text,
            feedback=feedback_text,
            score=score,
        )
        db.add(answer)

    db.commit()
    return {"feedback": feedback_text, "score": score}


@router.get("/sessions/{session_id}/chat", response_model=list[schemas.ChatMessageOut])
def get_chat_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session = (
        db.query(models.InterviewSession)
        .filter(models.InterviewSession.id == session_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )


@router.post("/sessions/{session_id}/chat", response_model=schemas.ChatMessageOut)
def send_chat_message(
    session_id: int,
    payload: schemas.ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session = (
        db.query(models.InterviewSession)
        .options(joinedload(models.InterviewSession.resume), joinedload(models.InterviewSession.jd))
        .filter(models.InterviewSession.id == session_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Persist the user's message first
    user_msg = models.ChatMessage(session_id=session.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # RAG retrieval: pull resume context relevant to this specific message
    retrieved = retrieve_relevant_chunks(session.resume.chroma_collection, payload.message, top_k=2)
    context = "\n---\n".join(retrieved)

    # Load full prior conversation for this session (memory)
    prior_messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session.id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in prior_messages]

    jd_summary = session.jd.raw_text[:800]

    reply_text = chat_reply(history, context, resume_summary="", jd_summary=jd_summary)

    assistant_msg = models.ChatMessage(
        session_id=session.id, role="assistant", content=reply_text, source_snippet=context or None
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg