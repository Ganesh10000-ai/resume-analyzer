import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="owner", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    chroma_collection = Column(String(255), nullable=False)  # collection name holding chunks
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("InterviewSession", back_populates="jd")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="sessions")
    resume = relationship("Resume", back_populates="sessions")
    jd = relationship("JobDescription", back_populates="sessions")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100))  # e.g. project, skill, experience, behavioral
    source_snippet = Column(Text)  # resume chunk this question was grounded in
    model_answer = Column(Text)  # suggested STAR-format answer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    user_answer = relationship("UserAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), unique=True, nullable=False)
    answer_text = Column(Text, nullable=False)
    feedback = Column(Text)
    score = Column(Integer)  # 1-10 rubric score from LLM feedback
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="user_answer")
