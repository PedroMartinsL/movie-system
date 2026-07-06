from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ai_user:ai_pass@ai-db:5432/ai_db")
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ═══════════════════════════════════════════════════════════════════════════
# O "ai-db": tabela que guarda o STATUS de cada processamento de vídeo.
# É o "caderninho" do cérebro — o admin consulta em /ai/jobs.
# ═══════════════════════════════════════════════════════════════════════════
class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True)
    movie_id = Column(String, nullable=False, index=True)   # de qual filme é
    status = Column(String, default="QUEUED")  # QUEUED → PROCESSING → COMPLETED / ERROR
    source_language = Column(String, nullable=True)  # idioma detectado pela IA
    error_message = Column(Text, nullable=True)      # se deu erro, guarda o motivo
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
