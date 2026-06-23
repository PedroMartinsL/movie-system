FROM python:3.11-slim
WORKDIR /app

# FFmpeg necessário para extrair áudio
RUN apt-get update && apt-get install -y \
    ffmpeg wget git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir setuptools && pip install --no-cache-dir -r requirements.txt

# Pré-baixa o modelo Whisper no build (evita download em runtime)
RUN python -c "import whisper; whisper.load_model('small')"

COPY src/ ./src/
WORKDIR /app/src
EXPOSE 8005
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
