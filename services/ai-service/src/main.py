from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import threading

from database import get_db, create_tables, ProcessingJob
from consumer import start_consumer

app = FastAPI(title="AI Service")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup():
    create_tables()
    # Inicia o consumer RabbitMQ em thread separada
    t = threading.Thread(target=start_consumer, daemon=True)
    t.start()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.get("/ai/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).all()
    return [
        {
            "id": j.id,
            "movie_id": j.movie_id,
            "status": j.status,
            "source_language": j.source_language,
            "error_message": j.error_message,
            "created_at": j.created_at,
            "updated_at": j.updated_at,
        }
        for j in jobs
    ]


@app.get("/ai/describe")
def describe_movie(title: str, description: str = "", genre: str = "", year: str = "", idioma: str = ""):
    genre_map = {
        "ACTION": "ação", "DRAMA": "drama", "COMEDY": "comédia",
        "HORROR": "terror", "ROMANCE": "romance", "SCIFI": "ficção científica",
        "DOCUMENTARY": "documentário", "ANIMATION": "animação", "THRILLER": "thriller",
    }
    genre_pt = genre_map.get(genre.upper(), genre.lower()) if genre else ""

    intro = f'Olá! Vou te contar um pouco sobre "{title}".'

    context_parts = []
    if year:
        context_parts.append(f"lançado em {year}")
    if genre_pt:
        context_parts.append(f"do gênero {genre_pt}")
    if idioma:
        context_parts.append(f"no idioma {idioma}")

    context = f"É um título {', '.join(context_parts)}." if context_parts else ""
    body = description if description else "Não há descrição disponível para este título."
    closing = "Espero que curta bastante. Boa sessão! 🍿"

    message = " ".join(p for p in [intro, context, body, closing] if p)
    return {"message": message}


@app.get("/ai/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return {
        "id": job.id,
        "movie_id": job.movie_id,
        "status": job.status,
        "source_language": job.source_language,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }
