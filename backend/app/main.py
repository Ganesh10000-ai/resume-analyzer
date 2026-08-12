from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import auth, resume, jd, questions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Resume Interview Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(questions.router)


@app.get("/health")
def health():
    return {"status": "ok"}
