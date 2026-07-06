from sqlalchemy import create_engine, Column, String, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from datetime import datetime
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://subtitle_user:subtitle_pass@subtitle-db:5432/subtitle_db")
# SQLAlchemy sync engine (substituímos asyncpg pelo psycopg2 para simplicidade)
engine = create_engine(DATABASE_URL.replace("postgresql+asyncpg", "postgresql"), echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class SubtitleStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"


class SubtitleSource(str, enum.Enum):
    AI_GENERATED = "AI_GENERATED"
    MANUAL = "MANUAL"


# ═══════════════════════════════════════════════════════════════════════════
# A "estante de legendas": cada linha é UMA legenda (de um filme, num idioma).
# ═══════════════════════════════════════════════════════════════════════════
class SubtitleTrack(Base):
    __tablename__ = "subtitle_tracks"

    id = Column(String, primary_key=True)
    movie_id = Column(String, nullable=False, index=True)  # de qual filme é
    language = Column(String, nullable=False)              # código: pt, en, es...
    language_label = Column(String, nullable=False)        # nome amigável: Português...
    content = Column(Text, nullable=True)  # o texto da legenda (formato VTT)
    status = Column(SAEnum(SubtitleStatus), default=SubtitleStatus.PROCESSING)  # PROCESSING/READY/ERROR
    source = Column(SAEnum(SubtitleSource), default=SubtitleSource.AI_GENERATED)  # feita pela IA ou manual
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
