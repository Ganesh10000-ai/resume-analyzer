from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.chunker import chunk_resume
from app.utils.vectorstore import collection_name_for_resume, store_resume_chunks

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload", response_model=schemas.ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    resume = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=text,
        chroma_collection="pending",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    collection_name = collection_name_for_resume(current_user.id, resume.id)
    chunks = chunk_resume(text)
    store_resume_chunks(collection_name, chunks)

    resume.chroma_collection = "test"
    db.commit()
    db.refresh(resume)
    return resume


@router.get("", response_model=list[schemas.ResumeOut])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Resume)
        .filter(models.Resume.user_id == current_user.id)
        .order_by(models.Resume.created_at.desc())
        .all()
    )
