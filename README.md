# 🚀 InterviewCraft AI
### AI-Powered Resume Interview Preparation using Retrieval-Augmented Generation (RAG)

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql)
![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange)
![Groq](https://img.shields.io/badge/LLM-Groq-black)
![RAG](https://img.shields.io/badge/Architecture-RAG-success)

</p>

---

# 📖 Overview

**InterviewCraft AI** is an intelligent interview preparation platform that generates **personalized interview questions** based on a candidate's resume and a target job description using **Retrieval-Augmented Generation (RAG)**.

Instead of asking generic interview questions, the system understands the candidate's experience, retrieves the most relevant resume sections for every job requirement, and generates highly contextual interview questions with STAR-format model answers.

The application also stores interview history, user responses, AI feedback, and scores, allowing candidates to continuously improve their interview performance.

---

# ✨ Key Features

## 👤 Authentication

- Secure JWT Authentication
- User Registration & Login
- Password Hashing using bcrypt
- Protected APIs

---

## 📄 Resume Analysis

- Upload Resume (PDF)
- Automatic Text Extraction
- Resume Parsing
- Intelligent Section-aware Chunking

---

## 💼 Job Description Analysis

- Upload Job Description
- Automatic Requirement Extraction
- Requirement-wise Processing

---

## 🧠 Retrieval-Augmented Generation (RAG)

- Local Sentence Embeddings
- Semantic Similarity Search
- Context Retrieval
- Resume Grounding
- Hallucination Reduction

---

## 🤖 AI Interview Generator

For every job requirement the system generates

- Personalized Interview Question
- STAR Format Model Answer
- Resume Evidence
- Question Category

---

## 🎤 Interview Practice

Candidates can

- Practice Interview Questions
- Submit Answers
- Receive AI Feedback
- View AI Score
- Track Previous Sessions

---

## 📊 Interview History

Every interview session is permanently stored.

Users can revisit

- Resume
- Job Description
- Questions
- Answers
- AI Feedback
- Scores

---

# 🧠 Why RAG?

Traditional interview platforms simply send the entire resume to an LLM and ask it to generate questions.

This often produces:

- Hallucinated experience
- Generic questions
- Poor personalization

InterviewCraft AI uses **Retrieval-Augmented Generation**.

Instead of sending the whole resume, it retrieves only the most relevant resume section for every job requirement before generating interview questions.

Benefits

✅ Context-aware

✅ Resume-grounded

✅ Explainable

✅ More accurate

✅ Less hallucination

---

# ⚙️ Complete Workflow

```
                    Resume PDF
                         │
                         ▼
                PDF Text Extraction
                         │
                         ▼
                Section-aware Chunking
                         │
                         ▼
              Sentence Embedding Model
                         │
                         ▼
                 Chroma Vector Database
                         │
                         │
Job Description ─────────┘
        │
        ▼
Requirement Extraction
        │
        ▼
Semantic Similarity Search
        │
        ▼
Relevant Resume Context
        │
        ▼
Groq LLM
        │
        ▼
Interview Question
+
STAR Model Answer
        │
        ▼
Candidate Practice
        │
        ▼
AI Evaluation
        │
        ▼
Feedback + Score
        │
        ▼
Stored in MySQL
```

---

# 🔍 RAG Pipeline

## Step 1

Candidate uploads a Resume PDF.

---

## Step 2

The backend extracts text using

- pdfplumber

---

## Step 3

The extracted resume is split into meaningful chunks.

Instead of splitting every 500 characters, the system performs **section-aware chunking** to preserve semantic meaning.

Example

```
Education

↓

Skills

↓

Projects

↓

Experience

↓

Certifications
```

---

## Step 4

Each chunk is converted into a dense vector using

```
all-MiniLM-L6-v2
```

Sentence Transformer embeddings.

---

## Step 5

The vectors are stored inside ChromaDB.

Each uploaded resume gets an independent vector collection.

```
resume_5_12

resume_5_13

resume_12_1
```

---

## Step 6

The uploaded Job Description is automatically divided into hiring requirements.

Example

```
React

REST APIs

Docker

SQL

Leadership
```

---

## Step 7

For every requirement

```
Requirement

↓

Semantic Search

↓

Most Relevant Resume Chunk
```

---

## Step 8

Groq receives

```
Requirement

+

Retrieved Resume Chunk
```

and generates

- Interview Question
- STAR Model Answer

---

## Step 9

Candidate practices answering.

---

## Step 10

The AI evaluates

- Technical Accuracy
- Communication
- Completeness
- STAR Structure

and generates

- Score
- Feedback
- Suggestions

---

# 🏗 System Architecture

```
                +--------------------+
                | React Frontend     |
                +---------+----------+
                          |
                          |
                     REST APIs
                          |
                          ▼
                +--------------------+
                | FastAPI Backend    |
                +---------+----------+
                          |
        +-----------------+----------------+
        |                                  |
        ▼                                  ▼
 MySQL Database                    ChromaDB Vector Store
        |                                  |
        |                                  |
 Session Memory                 Resume Embeddings
        |                                  |
        +---------------+------------------+
                        |
                        ▼
                 Groq LLM API
                        |
                        ▼
           Interview Question Generator
```

---

# 🗄 Database Schema

```
users

├── resumes

├── job_descriptions

├── interview_sessions

├── questions

└── user_answers
```

---

## Tables

### users

Stores

- User Information
- Authentication Details

---

### resumes

Stores

- Resume Text
- Uploaded File
- Chroma Collection

---

### job_descriptions

Stores uploaded Job Descriptions.

---

### interview_sessions

Links

```
User

↓

Resume

↓

Job Description

↓

Interview Session
```

---

### questions

Stores

- Question
- Source Resume Snippet
- Model Answer

---

### user_answers

Stores

- Candidate Answer
- AI Feedback
- Score

---

# 🛠 Technology Stack

| Layer | Technology |
|----------|----------------|
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | MySQL |
| Vector Database | ChromaDB |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Embeddings | Sentence Transformers |
| LLM | Groq |
| PDF Parser | pdfplumber |
| Password Hashing | bcrypt |
| Deployment | Render + Vercel |

---

# 📂 Project Structure

```
InterviewCraft-AI/

│

├── backend/

│ ├── app/

│ │ ├── auth/

│ │ ├── config/

│ │ ├── database/

│ │ ├── models/

│ │ ├── routers/

│ │ ├── schemas/

│ │ ├── utils/

│ │ └── main.py

│

├── frontend/

│ ├── src/

│ ├── public/

│ └── package.json

│

├── render.yaml

├── README.md

└── requirements.txt
```

---

# 🚀 Local Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/interviewcraft-ai.git

cd interviewcraft-ai
```

---

## Backend

```bash
cd backend

python -m venv venv

# Windows

venv\Scripts\activate

# Linux / macOS

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🔐 Environment Variables

Backend

```env
DATABASE_URL=

SECRET_KEY=

GROQ_API_KEY=

GROQ_MODEL=llama-3.3-70b-versatile

FRONTEND_ORIGIN=http://localhost:5173

CHROMA_PERSIST_DIR=./chroma_data
```

Frontend

```env
VITE_API_URL=http://localhost:8000
```

---

# 📈 Future Enhancements

- Voice-based Mock Interviews
- AI Resume Improvement Suggestions
- ATS Resume Score
- Company-specific Interview Preparation
- Coding Interview Module
- HR Interview Simulation
- Behavioral Analysis
- Multi-language Support
- Dashboard Analytics
- Email Interview Reports

---

# 👨‍💻 Author

**Ganesh J**

AI & Full Stack Developer

Passionate about building scalable AI-powered applications using FastAPI, React, Retrieval-Augmented Generation (RAG), and Large Language Models.

---

# ⭐ If you found this project useful, consider giving it a star!