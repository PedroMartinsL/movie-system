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

A traducao esta mockada por enquanto, pela funcao `mock_translate_text`.

Ela existe para o MVP e foi deixada simples para facilitar futura troca por IA real (OpenAI, Gemini, Whisper ou outro modelo).
