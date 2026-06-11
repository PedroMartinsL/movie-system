# Movie System - Servico de IA

Este diretorio contem o microservico de Inteligencia Artificial do Movie System.

Ele foi desenvolvido de forma isolada com FastAPI e tem foco em traducao de legendas no formato `.srt`.

## Objetivo do MVP

- Receber uma legenda `.srt`
- Receber `movie_id`, `source_language` e `target_language`
- Traduzir apenas as linhas de texto da legenda (mantendo numeracao e timestamps)
- Retornar a legenda traduzida
- Salvar o arquivo traduzido localmente em `storage/output`

## Fora de escopo neste MVP

- Integracao com frontend
- Integracao com Spring Boot
- Integracao com storage real
- Integracao com autenticacao
- Integracao com banco de dados
- Extracao de audio de video
- Geracao de legenda a partir de video

## Requisitos

- Python 3.10+
- pip
- ffmpeg instalado para extrair audio de arquivos de video

## Como rodar o servico (passo a passo)

1. Entre na pasta do servico:

```powershell
cd .\fastapi-language
```

2. (Opcional) Crie e ative um ambiente virtual:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Instale as dependencias:

```powershell
pip install -r requirements.txt
```

4. Inicie a API:

```powershell
uvicorn app.main:app --reload
```

5. Com o servidor rodando, acesse:

- Documentacao Swagger: http://127.0.0.1:8000/docs
- Health check direto: http://127.0.0.1:8000/ai/health

Observacao importante:

- `GET /` retorna 404 e isso e normal, pois a rota raiz nao foi criada neste MVP.

## Endpoints disponiveis

### 1) GET /ai/health

Objetivo: verificar se o servico esta online.

Resposta esperada:

```json
{
  "status": "ok",
  "service": "ai-service",
  "message": "AI service is running"
}
```

### 2) POST /ai/translate-subtitle

Objetivo: traduzir uma legenda `.srt`.

Payload de exemplo:

```json
{
  "movie_id": "movie-001",
  "source_language": "en",
  "target_language": "pt-BR",
  "subtitle_content": "1\n00:00:01,000 --> 00:00:03,000\nHello, welcome to the movie.",
  "format": "srt"
}
```

Resposta de exemplo:

```json
{
  "movie_id": "movie-001",
  "source_language": "en",
  "target_language": "pt-BR",
  "format": "srt",
  "status": "success",
  "translated_subtitle": "1\n00:00:01,000 --> 00:00:03,000\nOla, bem-vindo ao filme.",
  "file_path": "storage/output/movie-001_pt-BR.srt"
}
```

## Erros comuns ao testar o POST

- Status `400 Bad Request` com `subtitle_content` invalido:
  - O campo precisa conter texto em formato SRT real.
  - Exemplo invalido: `"subtitle_content": "string"`
- Status `405 Method Not Allowed`:
  - O endpoint `/ai/translate-subtitle` aceita apenas metodo `POST`.

## Onde o arquivo traduzido e salvo

- Pasta local: `storage/output`
- Nome padrao: `{movie_id}_{target_language}.srt`
- Exemplo: `movie-001_pt-BR.srt`

## Testes automatizados

Os testes usam `pytest` e validam:

- health check (`GET /ai/health`)
- traducao com sucesso (`POST /ai/translate-subtitle`)
- retorno de erro para SRT invalido

Para executar:

```powershell
pytest -q
```

Arquivo de testes:

- `tests/test_ai_routes.py`

## Sobre a traducao de IA

A traducao pode rodar de duas formas:

- `AI_PROVIDER=mock`: usa traducao mockada, boa para testes automatizados e demo sem dependencias.
- `AI_PROVIDER=ollama`: chama um modelo local pelo Ollama em `/api/generate`.

Exemplo usando Ollama local:

```powershell
ollama pull llama3.2
$env:AI_PROVIDER="ollama"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:OLLAMA_MODEL="llama3.2"
uvicorn app.main:app --reload --port 8002
```

No Docker Compose, use:

```powershell
$env:AI_PROVIDER="ollama"
$env:OLLAMA_BASE_URL="http://host.docker.internal:11434"
$env:OLLAMA_MODEL="llama3.2"
docker compose up --build language-fastapi
```

Observacao: o Ollama e usado aqui para traducao de legendas SRT. Para transcrever audio MP3 real, o caminho mais indicado e integrar um modelo de transcricao como Whisper; o endpoint `/ai/transcribe` ainda simula transcricao quando nao recebe `subtitle_content`.

## Endpoints adicionados para Player e Idiomas

### POST /idioma/

Cria um idioma disponivel para legendas.

Payload:

```json
{
  "name": "pt-BR"
}
```

### GET /idiomas/

Lista todos os idiomas cadastrados.

### GET /player/{title_id}/manifest

Retorna um manifesto HLS mockado com URL segura para o player iniciar a reproducao.

### GET /player/{title_id}/subtitles?lang={language}

Busca legenda por filme e idioma.

- Se a legenda existir, retorna `status: "ready"` com o conteudo.
- Se nao existir, mas existir SRT original em ingles, retorna `202` com `status: "processing"` e dispara a geracao em background.
- Se nao houver SRT original, retorna `404`.

### POST /ai/transcribe

Mock do servico de IA.

- Sem `subtitle_content`, simula transcricao de audio para SRT.
- Com `subtitle_content` e `target_language`, traduz uma legenda SRT existente.

### POST /ai/transcribe-file

Recebe um arquivo real de audio ou video e gera uma legenda `.srt`.

Formato: `multipart/form-data`

Campos:

```text
movie_id         id do filme
source_language  codigo do idioma original, ex: en, pt-BR, es
file             arquivo .mp3, .wav, .mp4, .mkv, .mov, .webm
```

Fluxo:

- Se o arquivo for video, o servico usa `ffmpeg` para extrair audio.
- Depois usa `faster-whisper` para transcrever o audio.
- A transcricao e convertida para SRT.
- A legenda gerada e salva em `storage/output`.
- O filme recebe uma legenda pronta no idioma `source_language`.

Exemplo com `curl`:

```powershell
curl.exe -X POST http://localhost:8002/ai/transcribe-file `
  -F "movie_id=1" `
  -F "source_language=en" `
  -F "file=@C:\Users\Elward\Downloads\MOVIES\audio.mp3"
```

## Idiomas padronizados

O servico usa `languageCode` para integrar com catalogo, storage e front.

```json
[
  { "name": "Português", "code": "pt-BR" },
  { "name": "Inglês", "code": "en" },
  { "name": "Espanhol", "code": "es" },
  { "name": "Francês", "code": "fr" },
  { "name": "Alemão", "code": "de" },
  { "name": "Italiano", "code": "it" },
  { "name": "Japonês", "code": "ja" },
  { "name": "Coreano", "code": "ko" },
  { "name": "Mandarim", "code": "zh" },
  { "name": "Russo", "code": "ru" }
]
```
