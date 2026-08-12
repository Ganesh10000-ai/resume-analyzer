import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# --- Auth ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Resume / JD ---
class ResumeOut(BaseModel):
    id: int
    filename: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class JDCreate(BaseModel):
    title: Optional[str] = None
    raw_text: str


class JDOut(BaseModel):
    id: int
    title: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Sessions / Questions ---
class GenerateRequest(BaseModel):
    resume_id: int
    jd_id: int
    num_questions: int = 8


class QuestionOut(BaseModel):
    id: int
    question_text: str
    category: Optional[str]
    source_snippet: Optional[str]
    model_answer: Optional[str]

    class Config:
        from_attributes = True
        protected_namespaces = ()


class SessionOut(BaseModel):
    id: int
    resume_id: int
    jd_id: int
    created_at: datetime.datetime
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    answer_text: str


class AnswerFeedbackOut(BaseModel):
    feedback: str
    score: int


# --- Chat (session memory) ---
class ChatMessageIn(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    source_snippet: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True