<div align="center">

# 💠 Cine Vault

**Plataforma de streaming de filmes baseada em microsserviços**

<img width="853" height="933" alt="image" src="https://github.com/user-attachments/assets/b03d9902-bc7c-4d5a-adb9-ee60f7ff4e1a" />

</div>

---

## 💠 Arquitetura

```
Cliente (Browser)
      │
      ▼
┌─────────────────────────────────────────┐
│           API GATEWAY :8080             │  ← Único ponto de entrada externo
│  • Autenticação JWT                     │
│  • Rate limiting (Redis)                │
│  • Proxy reverso por rota               │
└──────────┬──────────────────────────────┘
           │ rede interna (Docker bridge)
    ┌──────┴──────────────────────────────────────┐
    │                                             │
    ▼                                             ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────┐
│ auth-service │  │catalog-service│  │  storage-service  │
│   :8001      │  │    :8002      │  │      :8003        │
│  PostgreSQL  │  │  PostgreSQL   │  │  PostgreSQL+MinIO │
│  JWT + OAuth │  │  Catálogo de  │  │  Vídeos/Posters   │
│  Google      │  │  filmes       │  │                   │
└──────────────┘  └───────────────┘  └────────┬──────────┘
                                               │ RabbitMQ
                                               ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────┐
│subtitle-svc  │  │ subscription  │  │    ai-service     │
│   :8004      │◀─│    :8006      │  │      :8005        │
│  VTT tracks  │  │  Planos/Assin │  │  Groq Whisper     │
│  PostgreSQL  │  │  PostgreSQL   │  │  Legendas auto    │
└──────────────┘  └───────────────┘  └───────────────────┘

┌──────────────┐  ┌───────────────┐
│notification  │  │   Frontend    │
│   :8007      │  │    :3000      │
│  Email/SMTP  │  │  React + Vite │
│  PostgreSQL  │  │  Nginx        │
└──────────────┘  └───────────────┘

Infra: RabbitMQ · Redis · MinIO · MailHog
```

---

## 💠 Fluxo JWT

```
Cliente → API Gateway
  ├── Extrai Bearer token do header Authorization
  ├── Valida assinatura com JWT_SECRET
  ├── Injeta x-user-id e x-user-role nos headers internos
  └── Encaminha para o microsserviço correspondente
```

**Redes Docker:**
- `external` — API Gateway ↔ Frontend ↔ mundo externo
- `internal` — comunicação entre microsserviços (totalmente isolada)

---

## 💠 Como Rodar

### Pré-requisitos
- Docker Desktop
- Conta Groq (gratuita) → console.groq.com

### 1. Clone e configure
```bash
git clone <repo>
cd movie-system
cp .env.example .env
```

Preencha o `.env`:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=gsk_...
```

### 2. Suba tudo
```bash
docker compose up --build -d
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| MailHog | http://localhost:8025 |

### 3. Parar
```bash
docker compose down
```

---

## 💠 Tornar-se ADMIN

Por padrão todos os usuários são `NORMAL`. Para promover a ADMIN:

```bash
docker exec movie-system-auth-db-1 psql -U auth_user -d auth_db \
  -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'seu@email.com';"
```

Apenas ADMINs podem publicar, editar e deletar filmes.

---

## 💠 Serviços

| Serviço | Porta | Responsabilidade |
|---|---|---|
| **api-gateway** | 8080 | Roteamento, autenticação JWT, rate limit |
| **auth-service** | 8001 | Login, registro, OAuth Google, JWT |
| **catalog-service** | 8002 | CRUD de filmes |
| **storage-service** | 8003 | Upload/stream de vídeos e posters (MinIO) |
| **subtitle-service** | 8004 | Armazenamento e entrega de legendas VTT |
| **ai-service** | 8005 | Geração automática de legendas via Groq Whisper |
| **subscription-service** | 8006 | Planos e assinaturas |
| **notification-service** | 8007 | Envio de emails via SMTP |

---

## 💠 Rotas do API Gateway

### Auth
| Método | Rota | Acesso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| GET | `/auth/google` | Público |
| GET | `/auth/me` | Autenticado |
| POST | `/auth/logout` | Autenticado |
| PATCH | `/auth/profile` | Autenticado |
| PATCH | `/auth/password` | Autenticado |

### Catalog
| Método | Rota | Acesso |
|---|---|---|
| GET | `/catalog/movies` | Autenticado |
| GET | `/catalog/movies/:id` | Autenticado |
| POST | `/catalog/movies` | ADMIN |
| PATCH | `/catalog/movies/:id` | ADMIN |
| DELETE | `/catalog/movies/:id` | ADMIN |

### Storage
| Método | Rota | Acesso |
|---|---|---|
| POST | `/storage/upload/video?movieId=` | ADMIN |
| POST | `/storage/upload/poster?movieId=` | ADMIN |
| GET | `/storage/stream/:movieId` | Autenticado |
| GET | `/storage/poster/:movieId` | Público |

### Legendas
| Método | Rota | Acesso |
|---|---|---|
| GET | `/subtitles/:movieId` | Autenticado |
| GET | `/subtitles/:movieId/:language` | Autenticado |

### AI
| Método | Rota | Acesso |
|---|---|---|
| GET | `/ai/jobs` | Autenticado |
| GET | `/ai/jobs/:id` | Autenticado |

---

## 💠 Fluxo de Legendas Automáticas

```
Upload de vídeo pelo admin
      │
      ▼
storage-service → publica evento video.uploaded no RabbitMQ
      │
      ▼
ai-service consome o evento
  ├── Baixa vídeo do MinIO
  ├── Extrai áudio com FFmpeg (MP3 16kbps mono)
  ├── Envia para Groq Whisper large-v3-turbo
  ├── Recebe transcrição VTT com timestamps
  └── Salva no subtitle-service → aparece no player
```

---

## 💠 Stack Técnica

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Microsserviços Node | Fastify, Prisma ORM, TypeScript |
| Microsserviços Python | FastAPI, SQLAlchemy, Uvicorn |
| Banco de dados | PostgreSQL 15 (um por serviço) |
| Mensageria | RabbitMQ 3 (topic exchange) |
| Cache | Redis 7 |
| Storage | MinIO (compatível S3) |
| IA / Legendas | Groq API — Whisper large-v3-turbo |
| Containers | Docker, Docker Compose |
| Proxy | Nginx |
---
