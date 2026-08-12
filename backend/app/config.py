from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    class Config:
        env_file = ".env"


settings = Settings()
