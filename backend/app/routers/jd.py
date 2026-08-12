from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/jds", tags=["job-descriptions"])


@router.post("", response_model=schemas.JDOut)
def create_jd(
    payload: schemas.JDCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    jd = models.JobDescription(
        user_id=current_user.id,
        title=payload.title,
        raw_text=payload.raw_text,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("", response_model=list[schemas.JDOut])
def list_jds(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.JobDescription)
        .filter(models.JobDescription.user_id == current_user.id)
        .order_by(models.JobDescription.created_at.desc())
        .all()
    )
