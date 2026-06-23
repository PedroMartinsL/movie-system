from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database import get_db, create_tables, SubtitleTrack, SubtitleStatus, SubtitleSource

app = FastAPI(title="Subtitle Service")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

LANGUAGE_LABELS = {
    "pt": "Português",
    "en": "Inglês",
    "es": "Espanhol",
    "fr": "Francês",
    "de": "Alemão",
    "ja": "Japonês",
    "ko": "Coreano",
    "zh": "Mandarim",
}


@app.on_event("startup")
def startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "service": "subtitle-service"}


# ─── Schemas ─────────────────────────────────────────────────────────────────

class SubtitleCreate(BaseModel):
    movie_id: str
    language: str
    content: str
    source: Optional[str] = "AI_GENERATED"
    status: Optional[str] = "READY"


class SubtitleResponse(BaseModel):
    id: str
    movie_id: str
    language: str
    language_label: str
    status: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Rotas ───────────────────────────────────────────────────────────────────

@app.get("/subtitles/{movie_id}", response_model=List[SubtitleResponse])
def list_subtitles(movie_id: str, db: Session = Depends(get_db)):
    tracks = db.query(SubtitleTrack).filter(SubtitleTrack.movie_id == movie_id).all()
    return tracks


@app.get("/subtitles/{movie_id}/status")
def subtitle_status(movie_id: str, db: Session = Depends(get_db)):
    tracks = db.query(SubtitleTrack).filter(SubtitleTrack.movie_id == movie_id).all()
    return {
        "movie_id": movie_id,
        "total": len(tracks),
        "languages": [{"language": t.language, "status": t.status} for t in tracks],
    }


@app.get("/subtitles/{movie_id}/{language}")
def get_subtitle_content(movie_id: str, language: str, db: Session = Depends(get_db)):
    track = db.query(SubtitleTrack).filter(
        SubtitleTrack.movie_id == movie_id,
        SubtitleTrack.language == language,
        SubtitleTrack.status == SubtitleStatus.READY,
    ).first()

    if not track:
        raise HTTPException(status_code=404, detail="Legenda não encontrada")

    return {"content": track.content, "language": language, "language_label": track.language_label}


@app.post("/subtitles", status_code=201)
def create_subtitle(body: SubtitleCreate, db: Session = Depends(get_db)):
    existing = db.query(SubtitleTrack).filter(
        SubtitleTrack.movie_id == body.movie_id,
        SubtitleTrack.language == body.language,
    ).first()

    label = LANGUAGE_LABELS.get(body.language, body.language)

    if existing:
        existing.content = body.content
        existing.status = body.status
        existing.source = body.source
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "movie_id": existing.movie_id, "language": existing.language}

    track = SubtitleTrack(
        id=str(uuid.uuid4()),
        movie_id=body.movie_id,
        language=body.language,
        language_label=label,
        content=body.content,
        status=body.status,
        source=body.source,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return {"id": track.id, "movie_id": track.movie_id, "language": track.language}


@app.delete("/subtitles/{movie_id}/{language}", status_code=204)
def delete_subtitle(movie_id: str, language: str, db: Session = Depends(get_db)):
    track = db.query(SubtitleTrack).filter(
        SubtitleTrack.movie_id == movie_id,
        SubtitleTrack.language == language,
    ).first()
    if not track:
        raise HTTPException(status_code=404, detail="Legenda não encontrada")
    db.delete(track)
    db.commit()
