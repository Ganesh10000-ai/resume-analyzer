import os
from typing import List
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
from app.config import settings

# Silence Chroma's anonymized telemetry (harmless posthog version-mismatch warning otherwise)
os.environ["ANONYMIZED_TELEMETRY"] = "False"

_client = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIR,
    settings=ChromaSettings(anonymized_telemetry=False),
)

# Lightweight ONNX-based embedding (bundled with chromadb) - no torch, no CUDA,
# no risk of the AVX-512 SIGILL crash that full torch builds hit on Render's
# shared CPU instances. Downloads a small (~80MB) MiniLM ONNX model on first use.
_embedder = embedding_functions.DefaultEmbeddingFunction()


def collection_name_for_resume(user_id: int, resume_id: int) -> str:
    return f"resume_{user_id}_{resume_id}"


def store_resume_chunks(collection_name: str, chunks: List[str]) -> None:
    """Embed and persist resume chunks under a per-resume collection."""
    try:
        _client.delete_collection(collection_name)
    except Exception:
        pass

    collection = _client.create_collection(
        name=collection_name, embedding_function=_embedder
    )
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids)


def retrieve_relevant_chunks(collection_name: str, query: str, top_k: int = 3) -> List[str]:
    """Given a JD requirement (query), retrieve the most relevant resume chunks."""
    try:
        collection = _client.get_collection(name=collection_name, embedding_function=_embedder)
    except Exception:
        return []

    results = collection.query(query_texts=[query], n_results=top_k)
    docs = results.get("documents", [[]])[0]
    return docs