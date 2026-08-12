# Ground — RAG Resume Interview Analyzer

Upload a resume + job description. The app retrieves the resume snippets most
relevant to each JD requirement (RAG), generates grounded interview questions
+ model answers via Groq, and lets you practice with AI feedback. Session
history (memory) is persisted in MySQL so past questions/answers are never lost.

**Stack:** React (Vite) · FastAPI · MySQL · ChromaDB (vector store, local/free)
· Groq (`llama-3.3-70b-versatile`) · JWT auth

---

## How the RAG pipeline works

1. **Ingest**: resume PDF → `pdfplumber` extracts text → `chunker.py` splits
   it into section-aware chunks (~1 chunk per bullet/project/role).
2. **Embed & index**: each chunk is embedded locally with
   `sentence-transformers/all-MiniLM-L6-v2` (no external API, runs on CPU)
   and stored in a per-resume ChromaDB collection.
3. **Retrieve**: the JD is split into requirement lines. For each
   requirement, Chroma does a similarity search to pull the single most
   relevant resume chunk.
4. **Generate**: the (requirement, resume chunk) pair is sent to Groq, which
   returns one interview question + a STAR-format model answer — grounded
   only in that chunk, so every question can be traced back to a specific
   line on the resume.
5. **Memory**: sessions, questions, and your own practice answers + AI
   feedback are all stored in MySQL, so you can revisit any past session.

---

## Database schema (MySQL)

```
users              (id, email, hashed_password, full_name, created_at)
resumes            (id, user_id, filename, raw_text, chroma_collection, created_at)
job_descriptions   (id, user_id, title, raw_text, created_at)
interview_sessions (id, user_id, resume_id, jd_id, created_at)
questions          (id, session_id, question_text, category, source_snippet, model_answer, created_at)
user_answers       (id, question_id, answer_text, feedback, score, created_at)
```

Tables are created automatically on backend startup via SQLAlchemy
(`Base.metadata.create_all`) — no manual migration needed for this project
scope.

---

## Local setup

### 1. MySQL
Create a local database:
```sql
CREATE DATABASE resume_analyzer;
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in DATABASE_URL, GROQ_API_KEY, SECRET_KEY
uvicorn app.main:app --reload
```
Get a free Groq API key at https://console.groq.com/keys — free tier is
generous and plenty for this project.

Backend runs at `http://localhost:8000`. Interactive API docs at
`http://localhost:8000/docs`.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## Deployment

### Backend → Render
1. Push this repo to GitHub.
2. On Render: **New → Web Service**, connect the repo, root directory
   `backend/`.
3. Build command: `pip install -r requirements.txt`
   Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`,
   `SECRET_KEY`, `FRONTEND_ORIGIN` (your Vercel URL once deployed).
5. For MySQL: Render doesn't offer managed MySQL on the free tier — use
   **PlanetScale**, **Railway**, or **Aiven** for a free managed MySQL
   instance, and paste its connection string into `DATABASE_URL`.
   Format: `mysql+pymysql://user:password@host:3306/dbname`
6. Note: ChromaDB persists to local disk (`CHROMA_PERSIST_DIR`). Render's
   free tier disk is ephemeral on redeploy — fine for a resume-project demo,
   but mention this tradeoff if asked (a production version would use a
   hosted vector DB like Chroma Cloud, Pinecone, or pgvector).

### Frontend → Vercel
1. On Vercel: **New Project**, import the repo, root directory `frontend/`.
2. Framework preset: Vite.
3. Add environment variable `VITE_API_URL` = your Render backend URL.
4. Deploy.

---

## Talking points for interviews

- **Why RAG here, not just "call an LLM with the whole resume"**: grounding
  each question in a *retrieved, cited* chunk means every question is
  traceable and the model can't hallucinate unrelated experience — this is
  the actual value RAG adds over a single long prompt.
- **Chunking strategy**: section-aware chunking (splitting on resume
  headers) instead of naive fixed-length splitting, so each chunk stays
  semantically coherent (one project/bullet, not half a sentence).
- **Memory**: sessions/questions/answers persist in MySQL — a second axis of
  "memory" beyond vector retrieval, letting you track improvement over time.
- **Local embeddings**: using `sentence-transformers` locally instead of an
  embeddings API keeps the retrieval step free and fast, and only the
  generation step calls out to Groq.
