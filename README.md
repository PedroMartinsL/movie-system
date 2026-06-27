# CineVault — Movie System

> Plataforma de streaming de filmes construída como projeto acadêmico de microsserviços.
> Cada funcionalidade é um serviço independente, com banco de dados próprio, comunicação assíncrona via mensageria e integração com IA para geração automática de legendas.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Padrões de Microsserviços Aplicados](#3-padrões-de-microsserviços-aplicados)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Pré-Requisitos](#5-pré-requisitos)
6. [Como Clonar o Projeto](#6-como-clonar-o-projeto)
7. [Como Configurar o Ambiente](#7-como-configurar-o-ambiente)
8. [Como Executar o Sistema](#8-como-executar-o-sistema)
9. [Como Validar se Tudo Está Funcionando](#9-como-validar-se-tudo-está-funcionando)
10. [Fluxo Completo de Autenticação](#10-fluxo-completo-de-autenticação)
11. [Fluxo Completo de Publicação de Filme](#11-fluxo-completo-de-publicação-de-filme)
12. [Fluxo Completo de Reprodução](#12-fluxo-completo-de-reprodução)
13. [Fluxo de Geração de Legendas por IA](#13-fluxo-de-geração-de-legendas-por-ia)
14. [Usuários de Demonstração](#14-usuários-de-demonstração)
15. [Endpoints Principais](#15-endpoints-principais)
16. [Troubleshooting](#16-troubleshooting)
17. [Critérios da Disciplina](#17-critérios-da-disciplina)
18. [Roteiro de Demonstração em Vídeo](#18-roteiro-de-demonstração-em-vídeo)

---

## 1. Visão Geral do Projeto

### Nome

**CineVault - Movie System**

### Objetivo

Desenvolver uma plataforma completa de streaming de filmes utilizando arquitetura de microsserviços, demonstrando na prática os principais conceitos de sistemas distribuídos: isolamento de domínios, comunicação assíncrona, autenticação centralizada, armazenamento de objetos e inteligência artificial aplicada.

### Problema que Resolve

Plataformas de streaming tradicionais são construídas como monólitos: uma única aplicação que faz tudo. Isso cria gargalos de escala, acoplamento de código e dificuldade de manutenção. O CineVault demonstra como decompor esse problema em serviços pequenos, autônomos e substituíveis, cada um responsável por uma única parte do negócio.

### Principais Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Cadastro e Login | Registro de usuários com senha criptografada e autenticação via JWT |
| Catálogo de Filmes | Listagem, busca por título/gênero, destaques e filmes recentes |
| Upload de Filmes | Administradores fazem upload de vídeo e pôster diretamente pela interface |
| Streaming com URL Pré-assinada | Vídeos servidos via URL temporária gerada pelo MinIO, sem exposição direta do storage |
| Legendas Automáticas por IA | Whisper transcreve o áudio e LibreTranslate traduz para Português, Inglês e Espanhol |
| Assinaturas | Três planos de assinatura (Básico, Padrão, Premium) com preços e features diferentes |
| Notificações por E-mail | E-mails automáticos disparados quando legendas ficam prontas ou assinatura é ativada |
| RBAC | Controle de acesso baseado em papéis: ADMIN e NORMAL |

### Tecnologias Utilizadas

**Backend:**

| Serviço | Linguagem | Framework | Banco |
|---|---|---|---|
| API Gateway | Node.js 20 | Fastify | Redis |
| Auth Service | Node.js 20 | Fastify + Prisma | PostgreSQL 15 |
| Catalog Service | Node.js 20 | Fastify + Prisma | PostgreSQL 15 |
| Storage Service | Node.js 20 | Fastify + Prisma | PostgreSQL 15 |
| Subtitle Service | Python 3.11 | FastAPI + SQLAlchemy | PostgreSQL 15 |
| AI Service | Python 3.11 | FastAPI + SQLAlchemy | PostgreSQL 15 |
| Subscription Service | Node.js 20 | Fastify + Prisma | PostgreSQL 15 |
| Notification Service | Node.js 20 | Fastify + Prisma | PostgreSQL 15 |

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Nginx (para servir o build de produção no Docker)

**Infraestrutura:**
- Docker + Docker Compose
- RabbitMQ 3 (mensageria assíncrona)
- MinIO (object storage compatível com S3)
- Redis 7 (blacklist de tokens JWT)
- MailHog (servidor SMTP local para desenvolvimento)
- LibreTranslate (tradução automática local, sem API externa)
- OpenAI Whisper `small` (transcrição de fala, roda localmente)

---

## 2. Arquitetura do Sistema

O sistema é composto por **8 microsserviços** mais o **frontend**, todos orquestrados pelo Docker Compose. Nenhum serviço acessa diretamente o banco de dados de outro. A comunicação ocorre via HTTP (síncrona) ou RabbitMQ (assíncrona).

### Visão Macro

```mermaid
graph TB
    Browser["🌐 Navegador<br/>localhost:3000"]
    GW["🚪 API Gateway<br/>:8080"]
    FE["🎬 Frontend React<br/>:3000"]
    
    Browser --> FE
    Browser --> GW

    subgraph Serviços
        AUTH["🔐 Auth Service<br/>:8001"]
        CAT["🎞️ Catalog Service<br/>:8002"]
        STO["💾 Storage Service<br/>:8003"]
        SUB_SVC["📝 Subtitle Service<br/>:8004"]
        AI["🤖 AI Service<br/>:8005"]
        SUBSCRIPTION["💳 Subscription Service<br/>:8006"]
        NOTIF["📧 Notification Service<br/>:8007"]
    end

    GW --> AUTH
    GW --> CAT
    GW --> STO
    GW --> SUB_SVC
    GW --> AI
    GW --> SUBSCRIPTION
    GW --> NOTIF

    subgraph Infraestrutura
        MQ["🐰 RabbitMQ"]
        MINIO["🪣 MinIO"]
        REDIS["⚡ Redis"]
        MAILHOG["📮 MailHog<br/>:8025"]
        LT["🌍 LibreTranslate"]
    end

    STO --> MQ
    AI --> MQ
    NOTIF --> MQ
    STO --> MINIO
    AI --> MINIO
    GW --> REDIS
    NOTIF --> MAILHOG
    AI --> LT
    AI --> SUB_SVC
```

### Descrição de Cada Serviço

#### 🚪 API Gateway (porta 8080)

**Responsabilidade:** É o único ponto de entrada externo do sistema. Todo request do frontend passa obrigatoriamente por aqui antes de chegar a qualquer serviço.

**O que faz:**
- Valida o JWT de cada requisição (exceto rotas públicas)
- Consulta o Redis para verificar se o token foi revogado (logout)
- Injeta os headers `x-user-id`, `x-user-role` e `x-user-email` nos requests que repassará aos serviços internos (os serviços nunca precisam validar JWT novamente)
- Aplica RBAC: bloqueia com HTTP 403 se um usuário NORMAL tentar acessar rotas de ADMIN
- Faz proxy reverso para todos os 7 microsserviços

**Banco:** Redis (apenas para blacklist de tokens)

**Tecnologia:** Node.js + Fastify + `@fastify/http-proxy` + `jsonwebtoken` + `ioredis`

---

#### 🔐 Auth Service (porta 8001)

**Responsabilidade:** Tudo relacionado à identidade do usuário.

**O que faz:**
- Registra novos usuários (hash de senha com bcrypt, custo 12)
- Autentica com e-mail e senha
- Emite JWT de acesso (15 minutos) e refresh token (7 dias, UUID aleatório armazenado no banco)
- Renova o access token via refresh token válido
- Revoga o token no logout (insere na blacklist do Redis via API Gateway)
- Permite atualizar perfil (nome, idiomas preferidos)

**Banco:** PostgreSQL exclusivo (`auth_db`)

**Schema:**
```
User: id, email, name, passwordHash, role (ADMIN/NORMAL), languages[], createdAt
RefreshToken: id, token, userId, expiresAt, createdAt
```

---

#### 🎞️ Catalog Service (porta 8002)

**Responsabilidade:** Gerencia o catálogo de filmes.

**O que faz:**
- CRUD completo de filmes (criar, listar, buscar, atualizar, deletar)
- Listagem com paginação, filtro por gênero e busca por título
- Endpoint `/catalog/home` que retorna filmes em destaque e mais recentes
- Armazena referências ao poster e vídeo (IDs do storage), não os arquivos em si

**Banco:** PostgreSQL exclusivo (`catalog_db`)

**Schema:**
```
Movie: id, title, description, year, genre (enum), idioma, posterId, videoId,
       status (PROCESSING/READY/ERROR), featured, createdAt, updatedAt
```

Gêneros disponíveis: `ACTION`, `DRAMA`, `COMEDY`, `HORROR`, `ROMANCE`, `SCI_FI`

---

#### 💾 Storage Service (porta 8003)

**Responsabilidade:** Gerencia o armazenamento físico de arquivos (vídeos e pôsteres).

**O que faz:**
- Recebe upload de vídeo (multipart, até 5 GB) e armazena no MinIO
- Recebe upload de pôster e armazena no MinIO
- Gera URLs pré-assinadas temporárias para streaming e visualização de pôsteres
- Após upload de vídeo, publica o evento `video.uploaded` no RabbitMQ para disparar a IA
- Registra metadados de cada arquivo no banco (tamanho, tipo MIME, bucket, nome do objeto)

**Banco:** PostgreSQL exclusivo (`storage_db`)

**Schema:**
```
FileRecord: id, movieId, type (VIDEO/POSTER), bucketName, objectName, size, mimeType, createdAt
```

**MinIO Buckets:**
- `movies-videos` — vídeos (privado, acesso somente via URL pré-assinada)
- `movies-posters` — pôsteres (público para leitura anônima)

---

#### 📝 Subtitle Service (porta 8004)

**Responsabilidade:** Armazena e serve legendas em formato WebVTT.

**O que faz:**
- Recebe legendas criadas pela IA (HTTP POST interno)
- Lista todas as legendas disponíveis para um filme
- Serve o conteúdo WebVTT de uma legenda específica por idioma
- Suporta idiomas: `pt`, `en`, `es`, `fr`, `de`, `ja`, `ko`, `zh`

**Banco:** PostgreSQL exclusivo (`subtitle_db`) via SQLAlchemy

**Schema:**
```
SubtitleTrack: id, movie_id, language, language_label, content (WebVTT), status, source
```

---

#### 🤖 AI Service (porta 8005)

**Responsabilidade:** Pipeline completo de inteligência artificial para geração de legendas.

**O que faz:**
1. Fica consumindo a fila `ai.video.uploaded` do RabbitMQ
2. Ao receber um evento, baixa o vídeo do MinIO para um diretório temporário
3. Extrai o áudio do vídeo com **FFmpeg** (converte para WAV mono 16 kHz)
4. Transcreve o áudio com **OpenAI Whisper** modelo `small` (roda 100% localmente)
5. Converte os segmentos para o formato **WebVTT**
6. Detecta o idioma original automaticamente
7. Traduz as legendas para os demais idiomas via **LibreTranslate** (roda localmente)
8. Envia cada legenda ao Subtitle Service via HTTP POST
9. Registra o job no banco com status `QUEUED → PROCESSING → COMPLETED/ERROR`

**Banco:** PostgreSQL exclusivo (`ai_db`) via SQLAlchemy

**Schema:**
```
ProcessingJob: id, movie_id, status, source_language, error_message, created_at, updated_at
```

**Modelos de IA utilizados:**
- Whisper `small`: ~460 MB, precisão boa, velocidade razoável
- LibreTranslate: tradução PT ↔ EN ↔ ES (carregado localmente no container)

---

#### 💳 Subscription Service (porta 8006)

**Responsabilidade:** Gerencia planos e assinaturas dos usuários.

**O que faz:**
- Lista planos disponíveis (rota pública)
- Cria assinatura para o usuário autenticado
- Consulta assinatura ativa do usuário
- Cancela assinatura
- Ao criar assinatura, publica evento `subscription.created` no RabbitMQ

**Banco:** PostgreSQL exclusivo (`subscription_db`)

**Schema:**
```
Plan: id, name, description, priceMonthly, features[], active, createdAt
Subscription: id, userId, planId, status (ACTIVE/CANCELLED/EXPIRED), startedAt, expiresAt
```

**Planos pré-cadastrados (seed automático):**

| Plano | Preço/mês | Qualidade | Telas | Extras |
|---|---|---|---|---|
| Básico | R$ 19,90 | SD | 1 | — |
| Padrão | R$ 39,90 | HD | 2 | Download offline |
| Premium | R$ 59,90 | 4K | 4 | Download, suporte prioritário |

---

#### 📧 Notification Service (porta 8007)

**Responsabilidade:** Envia notificações por e-mail em resposta a eventos do sistema.

**O que faz:**
- Consome dois eventos do RabbitMQ:
  - `subtitles.ready` → envia e-mail ao admin informando que as legendas ficaram prontas
  - `subscription.created` → envia e-mail ao usuário confirmando a assinatura
- Registra cada notificação enviada no banco (log de auditoria)
- Usa Nodemailer + MailHog (SMTP local) — em produção, trocaria por SMTP real

**Banco:** PostgreSQL exclusivo (`notification_db`)

**Schema:**
```
NotificationLog: id, event, payload, recipient, status, createdAt
```

---

### Como os Serviços se Comunicam

```mermaid
graph LR
    GW["API Gateway"] -->|HTTP proxy| AUTH["Auth Service"]
    GW -->|HTTP proxy| CAT["Catalog Service"]
    GW -->|HTTP proxy| STO["Storage Service"]
    GW -->|HTTP proxy| SUB_SVC["Subtitle Service"]
    GW -->|HTTP proxy| AI["AI Service"]
    GW -->|HTTP proxy| SUB["Subscription Service"]
    GW -->|HTTP proxy| NOTIF["Notification Service"]

    STO -->|"Publica: video.uploaded"| MQ["RabbitMQ\nmovie-events (topic)"]
    SUB -->|"Publica: subscription.created"| MQ
    
    MQ -->|"Consome: ai.video.uploaded"| AI
    MQ -->|"Consome: notifications.subtitles.ready"| NOTIF
    MQ -->|"Consome: notifications.subscription.created"| NOTIF

    AI -->|"HTTP POST /subtitles"| SUB_SVC
    AI -->|"GET/download arquivo"| MINIO["MinIO"]
    STO -->|"PUT upload arquivo"| MINIO
```

---

## 3. Padrões de Microsserviços Aplicados

### Database per Service

Cada microsserviço possui seu **próprio banco de dados PostgreSQL**, completamente isolado. Nenhum serviço acessa diretamente o banco de outro.

**Por que isso importa:**
- Se o banco do Catalog Service cair, o Auth Service continua funcionando
- Cada serviço pode evoluir seu schema de forma independente
- Não há risco de um serviço corromper dados de outro

```
auth-db:5432         → apenas auth-service
catalog-db:5432      → apenas catalog-service
storage-db:5432      → apenas storage-service
subtitle-db:5432     → apenas subtitle-service
ai-db:5432           → apenas ai-service
subscription-db:5432 → apenas subscription-service
notification-db:5432 → apenas notification-service
```

---

### API Gateway (padrão BFF)

O frontend nunca fala diretamente com os serviços internos. **Todo o tráfego passa pelo gateway na porta 8080.**

Benefícios:
- Um único ponto de autenticação
- Os serviços internos ficam inacessíveis externamente (rede `internal` do Docker)
- Logs centralizados de acesso

---

### JWT (JSON Web Token)

O token de acesso é um JWT assinado com `HS256`. Seu payload contém:

```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@email.com",
  "role": "ADMIN",
  "iss": "movie-system",
  "aud": "movie-system-clients",
  "iat": 1700000000,
  "exp": 1700000900
}
```

| Campo | Significado |
|---|---|
| `sub` | ID do usuário (UUID) |
| `email` | E-mail do usuário |
| `role` | Papel: `ADMIN` ou `NORMAL` |
| `iss` | Emissor: `movie-system` |
| `aud` | Audiência: `movie-system-clients` |
| `iat` | Emitido em (timestamp) |
| `exp` | Expira em (15 minutos após `iat`) |

O gateway valida `iss` e `aud` em cada request. Tokens com valores diferentes são rejeitados imediatamente.

---

### RBAC (Role-Based Access Control)

O controle de acesso é aplicado no API Gateway antes de qualquer proxy:

| Tipo de Rota | Exemplos | Quem Acessa |
|---|---|---|
| Pública | `GET /catalog/movies`, `POST /auth/login`, `GET /subscriptions/plans` | Qualquer pessoa, sem token |
| Autenticada | `GET /subtitles/:id`, `POST /subscriptions`, `GET /auth/me` | Qualquer usuário logado |
| Admin | `POST /catalog/movies`, `POST /storage/upload/video`, `GET /ai/jobs` | Apenas role=ADMIN |

---

### Docker e Docker Compose

O sistema completo é levantado com **um único comando**: `docker compose up --build`.

Cada serviço tem seu próprio `Dockerfile` com **build multi-stage** (Node.js):
1. **Stage `builder`**: instala dependências de dev, compila TypeScript
2. **Stage final**: copia apenas o binário compilado, instala somente deps de produção

Isso resulta em imagens menores e sem código-fonte exposto.

Os serviços possuem **healthchecks** configurados. O Docker Compose aguarda cada serviço ficar saudável antes de iniciar os que dependem dele (`depends_on: condition: service_healthy`).

---

## 4. Estrutura de Diretórios

```
movie-system/
│
├── docker-compose.yml          # Orquestra todos os 15+ containers
│
├── api-gateway/                # Único ponto de entrada externo
│   ├── src/
│   │   ├── server.ts           # Servidor Fastify principal
│   │   ├── redis.ts            # Conexão com Redis (blacklist JWT)
│   │   ├── middleware/
│   │   │   └── jwtAuth.ts      # Validação JWT + injeção de headers
│   │   └── routes/
│   │       └── proxy.ts        # Definição de rotas públicas/admin + proxies
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── services/
│   │
│   ├── auth-service/           # Autenticação e gestão de usuários
│   │   ├── src/
│   │   │   ├── server.ts       # Servidor Fastify
│   │   │   ├── db.ts           # Cliente Prisma
│   │   │   ├── jwt.ts          # Geração/validação de tokens
│   │   │   └── routes/
│   │   │       └── auth.ts     # Endpoints: register, login, refresh, logout, me, profile
│   │   ├── prisma/
│   │   │   └── schema.prisma   # User, RefreshToken
│   │   └── Dockerfile
│   │
│   ├── catalog-service/        # Catálogo de filmes
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── db.ts
│   │   │   └── routes/
│   │   │       └── movies.ts   # CRUD + busca + paginação + home
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Movie (com enum Genre e MovieStatus)
│   │   └── Dockerfile
│   │
│   ├── storage-service/        # Upload e streaming de arquivos
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── db.ts
│   │   │   ├── minio.ts        # Cliente MinIO + criação de buckets
│   │   │   ├── rabbitmq.ts     # Publicação de eventos no RabbitMQ
│   │   │   └── routes/
│   │   │       └── storage.ts  # upload/video, upload/poster, stream/:id, poster/:id
│   │   ├── prisma/
│   │   │   └── schema.prisma   # FileRecord
│   │   └── Dockerfile
│   │
│   ├── subtitle-service/       # Armazenamento e serving de legendas (Python)
│   │   ├── src/
│   │   │   ├── main.py         # FastAPI com todos os endpoints
│   │   │   └── database.py     # SQLAlchemy models + engine + session
│   │   └── Dockerfile
│   │
│   ├── ai-service/             # Pipeline de IA: Whisper + LibreTranslate (Python)
│   │   ├── src/
│   │   │   ├── main.py         # FastAPI + health + endpoints de jobs
│   │   │   ├── consumer.py     # Consumer RabbitMQ (fila ai.video.uploaded)
│   │   │   ├── processor.py    # Orquestrador do pipeline (download → FFmpeg → Whisper → tradução → POST)
│   │   │   ├── whisper_service.py     # Transcrição com Whisper + conversão para WebVTT
│   │   │   ├── translation_service.py # Tradução com LibreTranslate
│   │   │   └── database.py     # SQLAlchemy: ProcessingJob
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── subscription-service/   # Planos e assinaturas
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── db.ts
│   │   │   ├── rabbitmq.ts     # Publica subscription.created
│   │   │   ├── seed.ts         # Cria os 3 planos no banco na inicialização
│   │   │   └── routes/
│   │   │       └── subscriptions.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Plan, Subscription
│   │   └── Dockerfile
│   │
│   └── notification-service/   # Notificações por e-mail via RabbitMQ
│       ├── src/
│       │   ├── server.ts
│       │   ├── db.ts
│       │   ├── consumer.ts     # Consome subtitles.ready + subscription.created
│       │   ├── mailer.ts       # Nodemailer + MailHog
│       │   └── routes/
│       │       └── notifications.ts
│       ├── prisma/
│       │   └── schema.prisma   # NotificationLog
│       └── Dockerfile
│
└── front-react/                # Frontend React + TypeScript
    ├── src/
    │   ├── services/
    │   │   └── api.ts          # Todas as chamadas HTTP para o API Gateway
    │   └── app/
    │       ├── types.ts        # Tipos TypeScript compartilhados (Movie, Genre, etc.)
    │       ├── components/
    │       │   ├── MovieModal.tsx      # Modal do filme com player de vídeo + legendas
    │       │   ├── PublishForm.tsx     # Formulário de publicação (admin only)
    │       │   └── Navbar.tsx         # Barra de navegação com menu por role
    │       └── pages/
    │           ├── Home.tsx           # Catálogo principal
    │           ├── Login.tsx
    │           └── Register.tsx
    ├── Dockerfile              # Build multi-stage: Vite → Nginx
    ├── vite.config.ts
    └── package.json
```

---

## 5. Pré-Requisitos

Você precisará ter instalado:

### Docker Desktop

O Docker Desktop inclui tanto o Docker Engine quanto o Docker Compose. É a única ferramenta necessária para rodar o projeto.

- **Windows / macOS:** [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** Instale Docker Engine + Docker Compose Plugin separadamente

**Versão mínima recomendada:** Docker 24+, Docker Compose 2.20+

Para verificar:
```bash
docker --version
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x
```

> **Atenção (Windows):** Certifique-se de que o Docker Desktop está em execução antes de qualquer comando. O ícone da baleia deve aparecer na barra de tarefas.

### Git

Para clonar o repositório.

- [https://git-scm.com/downloads](https://git-scm.com/downloads)

```bash
git --version
# git version 2.x.x
```

### Recursos de Máquina Recomendados

| Recurso | Mínimo | Recomendado |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Espaço em disco | 10 GB livres | 15 GB livres |
| CPU | 4 núcleos | 8 núcleos |

> O AI Service faz download e carrega o modelo Whisper (~460 MB) e as bibliotecas de IA (~2 GB incluindo PyTorch). O primeiro build demora mais que os subsequentes por causa disso.

---

## 6. Como Clonar o Projeto

Abra um terminal e execute:

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO> movie-system

# 2. Entre na pasta do projeto
cd movie-system

# 3. Confirme que os arquivos estão presentes
ls
# Deve mostrar: api-gateway/ services/ front-react/ docker-compose.yml README.md
```

Não é necessário instalar Node.js, Python ou qualquer outra dependência localmente. Tudo roda dentro dos containers Docker.

---

## 7. Como Configurar o Ambiente

### Nenhuma configuração necessária para desenvolvimento local

O projeto está pré-configurado para rodar localmente sem nenhum arquivo `.env` adicional. Todas as variáveis de ambiente já estão definidas no `docker-compose.yml`.

### Portas Utilizadas

| Porta | Serviço | Acesso |
|---|---|---|
| `3000` | Frontend React | `http://localhost:3000` |
| `8080` | API Gateway | `http://localhost:8080` |
| `8025` | MailHog (interface web de e-mails) | `http://localhost:8025` |

> As demais portas (bancos de dados, RabbitMQ, MinIO, serviços internos) ficam na rede interna do Docker e **não são acessíveis pelo host** por padrão.

### Variáveis de Ambiente Principais

Estas variáveis estão no `docker-compose.yml` e você pode alterá-las se necessário:

| Variável | Valor Padrão | Onde é usada |
|---|---|---|
| `JWT_SECRET` | `movie-system-super-secret-key-change-in-production` | api-gateway, auth-service |
| `MINIO_ROOT_USER` | `minioadmin` | minio, storage-service, ai-service |
| `MINIO_ROOT_PASSWORD` | `minioadmin123` | minio, storage-service, ai-service |
| `RABBITMQ_DEFAULT_USER` | `guest` | rabbitmq, todos que consomem |
| `VITE_API_URL` | `http://localhost:8080` | frontend (aponta para o gateway) |
| `WHISPER_MODEL` | `small` | ai-service |

> **Produção:** Troque o `JWT_SECRET` por um valor aleatório longo. Nunca use os valores padrão de MinIO e RabbitMQ em ambiente público.

---

## 8. Como Executar o Sistema

Siga os passos exatamente nesta ordem:

### Passo 1 — Entre na pasta do projeto

```bash
cd movie-system
```

### Passo 2 — Inicie todos os serviços

```bash
docker compose up --build
```

O parâmetro `--build` garante que as imagens sejam (re)construídas a partir do código-fonte atual. Use esse parâmetro sempre que modificar qualquer arquivo do projeto.

### Passo 3 — Aguarde o build

O primeiro build **demora entre 10 e 30 minutos** dependendo da velocidade da sua internet e CPU. Isso acontece uma única vez. Builds subsequentes são muito mais rápidos (cache do Docker).

O que acontece durante o build, na ordem:

1. Docker constrói as imagens de cada serviço
2. Para os serviços Node.js: `npm install` + `tsc` (compilação TypeScript)
3. Para o frontend: `npm install` + `vite build` (bundle de produção)
4. Para os serviços Python: `pip install` com PyTorch (~2 GB), Whisper, FastAPI, etc.
5. Para o AI Service especificamente: baixa e carrega o modelo Whisper `small` (~460 MB) durante o build

### Passo 4 — Acompanhe o progresso

Durante o build você verá logs como:

```
 => [ai-service 3/8] RUN apt-get update && apt-get install -y ffmpeg wget git
 => [ai-service 4/8] RUN pip install --no-cache-dir -r requirements.txt
 => [ai-service 5/8] RUN python -c "import whisper; whisper.load_model('small')"
```

Esse último passo (step 5) é o mais demorado do sistema inteiro.

### Passo 5 — Identifique quando os serviços estão prontos

Quando o build terminar, os containers começarão a iniciar. Você verá mensagens como:

```
auth-service-1        | auth-service running on port 8001
catalog-service-1     | catalog-service running on port 8002
storage-service-1     | storage-service running on port 8003
subscription-service-1| subscription-service running on port 8006
notification-service-1| notification-service consumer started
api-gateway-1         | Server listening at http://0.0.0.0:8080
```

O sistema está **pronto para uso** quando o `api-gateway` aparecer como rodando.

### Passo 6 — Acesse o frontend

Abra o navegador em: **`http://localhost:3000`**

Você verá a tela inicial do CineVault com a opção de fazer login ou cadastro.

### Parar o sistema

Para parar todos os containers, pressione `Ctrl + C` no terminal. Para remover os containers (mas manter os volumes/dados):

```bash
docker compose down
```

Para remover tudo, incluindo volumes (apaga banco de dados e arquivos):

```bash
docker compose down -v
```

---

## 9. Como Validar se Tudo Está Funcionando

Execute o checklist abaixo após os containers iniciarem:

### Checklist de Saúde dos Serviços

```bash
# Verifica todos os containers rodando
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Você deve ver algo como:

```
NAMES                          STATUS
movie-system-api-gateway-1     Up 2 minutes (healthy)
movie-system-auth-service-1    Up 3 minutes (healthy)
movie-system-catalog-service-1 Up 3 minutes (healthy)
movie-system-storage-service-1 Up 3 minutes (healthy)
movie-system-subtitle-service-1 Up 3 minutes (healthy)
movie-system-ai-service-1      Up 2 minutes (healthy)
movie-system-subscription-service-1 Up 3 minutes (healthy)
movie-system-notification-service-1 Up 3 minutes (healthy)
movie-system-frontend-1        Up 2 minutes
movie-system-rabbitmq-1        Up 5 minutes (healthy)
movie-system-redis-1           Up 5 minutes (healthy)
movie-system-minio-1           Up 5 minutes (healthy)
movie-system-minio-init-1      Up 4 minutes
movie-system-mailhog-1         Up 5 minutes
...
```

### Verificação Manual dos Endpoints

Abra o terminal e execute:

```bash
# API Gateway está respondendo?
curl http://localhost:8080/health
# Esperado: {"status":"ok","service":"api-gateway"}

# Catálogo público funciona sem autenticação?
curl http://localhost:8080/catalog/movies
# Esperado: {"data":[],"pagination":{...}}

# Planos de assinatura disponíveis sem login?
curl http://localhost:8080/subscriptions/plans
# Esperado: {"plans":[{"name":"Básico",...},{"name":"Padrão",...},{"name":"Premium",...}]}

# Frontend está acessível?
curl -I http://localhost:3000
# Esperado: HTTP/1.1 200 OK
```

### Verificação da Interface Web

| URL | O que deve aparecer |
|---|---|
| `http://localhost:3000` | Tela do CineVault com catálogo |
| `http://localhost:8025` | Interface do MailHog (e-mails enviados) |

### Verificação dos Logs

Se algum serviço não estiver saudável:

```bash
# Ver logs de um serviço específico
docker compose logs auth-service
docker compose logs ai-service
docker compose logs api-gateway

# Seguir logs em tempo real
docker compose logs -f catalog-service
```

---

## 10. Fluxo Completo de Autenticação

### Registro de Usuário

```mermaid
sequenceDiagram
    participant U as Usuário (Browser)
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as auth-db (PostgreSQL)

    U->>GW: POST /auth/register { email, name, password }
    Note over GW: Rota pública — sem validação JWT
    GW->>AUTH: POST /auth/register (proxy)
    AUTH->>AUTH: Valida campos obrigatórios
    AUTH->>AUTH: Hash bcrypt(password, cost=12)
    AUTH->>DB: INSERT INTO User (email, name, passwordHash, role='NORMAL')
    DB-->>AUTH: User criado
    AUTH->>AUTH: Gera access token JWT (15min)
    AUTH->>AUTH: Gera refresh token (UUID aleatório)
    AUTH->>DB: INSERT INTO RefreshToken (token, userId, expiresAt=+7d)
    AUTH-->>GW: { accessToken, refreshToken, user }
    GW-->>U: 201 { accessToken, refreshToken, user }
    Note over U: Salva tokens no localStorage
```

### Login

```mermaid
sequenceDiagram
    participant U as Usuário
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant REDIS as Redis

    U->>GW: POST /auth/login { email, password }
    GW->>AUTH: POST /auth/login (proxy)
    AUTH->>AUTH: Busca User por email
    AUTH->>AUTH: bcrypt.compare(password, hash)
    alt Senha correta
        AUTH->>AUTH: Gera novo access token JWT
        AUTH->>AUTH: Gera novo refresh token
        AUTH-->>GW: { accessToken, refreshToken, user }
        GW-->>U: 200 { accessToken, refreshToken, user }
    else Senha incorreta
        AUTH-->>GW: 401 { error: "Credenciais inválidas" }
        GW-->>U: 401
    end
```

### Validação de Requisição Autenticada

```mermaid
sequenceDiagram
    participant U as Usuário
    participant GW as API Gateway
    participant REDIS as Redis
    participant SVC as Microsserviço

    U->>GW: GET /catalog/movies/123 + Authorization: Bearer <token>
    GW->>GW: Extrai token do header
    GW->>REDIS: GET blacklist:<token>
    alt Token está na blacklist
        REDIS-->>GW: "revoked"
        GW-->>U: 401 Token revogado
    else Token não está na blacklist
        REDIS-->>GW: null
        GW->>GW: jwt.verify(token, secret, { issuer, audience })
        alt Token válido
            GW->>GW: Injeta headers: x-user-id, x-user-role, x-user-email
            GW->>SVC: GET /catalog/movies/123 + headers injetados
            SVC-->>GW: 200 { movie }
            GW-->>U: 200 { movie }
        else Token inválido/expirado
            GW-->>U: 401 Token inválido ou expirado
        end
    end
```

### Logout

```mermaid
sequenceDiagram
    participant U as Usuário
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant REDIS as Redis
    participant DB as auth-db

    U->>GW: POST /auth/logout { refreshToken } + Bearer token
    GW->>GW: Valida JWT
    GW->>GW: Adiciona access token na blacklist do Redis
    GW->>AUTH: POST /auth/logout (proxy)
    AUTH->>DB: DELETE RefreshToken WHERE token = ?
    AUTH-->>GW: 204
    GW-->>U: 204
    Note over U: Remove tokens do localStorage
```

### Renovação de Token (Refresh)

Quando o access token expira (15 minutos), o frontend pode obter um novo sem pedir login novamente:

```bash
POST /auth/refresh
{ "refreshToken": "uuid-do-refresh-token" }
# Resposta: { "accessToken": "novo-jwt" }
```

---

## 11. Fluxo Completo de Publicação de Filme

Apenas usuários com `role = ADMIN` podem publicar filmes.

```mermaid
sequenceDiagram
    participant ADMIN as Admin (Browser)
    participant GW as API Gateway
    participant CAT as Catalog Service
    participant STO as Storage Service
    participant MINIO as MinIO
    participant MQ as RabbitMQ
    participant AI as AI Service

    Note over ADMIN: Preenche formulário: título, gênero, idioma, descrição, poster, vídeo

    ADMIN->>GW: POST /catalog/movies { title, description, year, genre, idioma }
    Note over GW: Verifica role=ADMIN
    GW->>CAT: POST /catalog/movies
    CAT->>CAT: INSERT Movie (status='PROCESSING')
    CAT-->>ADMIN: 201 { id: "uuid-do-filme", status: "PROCESSING", ... }

    par Upload em paralelo
        ADMIN->>GW: POST /storage/upload/poster?movieId=uuid (multipart)
        GW->>STO: POST /storage/upload/poster
        STO->>MINIO: PUT movies-posters/uuid-poster.jpg
        STO->>STO: INSERT FileRecord (type=POSTER)
        STO-->>ADMIN: 200 { movieId, objectName }
    and
        ADMIN->>GW: POST /storage/upload/video?movieId=uuid (multipart)
        GW->>STO: POST /storage/upload/video
        STO->>MINIO: PUT movies-videos/uuid-video.mp4
        STO->>STO: INSERT FileRecord (type=VIDEO)
        STO->>MQ: PUBLISH movie-events / video.uploaded { movieId, bucketName, objectName }
        STO-->>ADMIN: 200 { movieId, objectName }
    end

    MQ->>AI: DELIVER ai.video.uploaded { movieId, bucketName, objectName }
    Note over AI: Pipeline de legendas iniciado (ver seção 13)

    ADMIN->>GW: PATCH /catalog/movies/uuid { posterId: uuid, videoId: uuid }
    GW->>CAT: PATCH /catalog/movies/uuid
    CAT->>CAT: UPDATE Movie SET posterId, videoId
    CAT-->>ADMIN: 200 { movie atualizado }
```

---

## 12. Fluxo Completo de Reprodução

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend React
    participant GW as API Gateway
    participant STO as Storage Service
    participant MINIO as MinIO
    participant SUB_SVC as Subtitle Service

    U->>FE: Clica em um filme no catálogo
    FE->>FE: Abre MovieModal com dados do filme

    FE->>GW: GET /subtitles/{movieId}
    GW->>SUB_SVC: GET /subtitles/{movieId}
    SUB_SVC-->>FE: [ { language: "pt", language_label: "Português", ... }, ... ]
    FE->>FE: Exibe "Legendas: Português, Inglês, Espanhol"

    U->>FE: Clica no botão Play ▶
    FE->>GW: GET /storage/stream/{movieId}
    GW->>STO: GET /storage/stream/{movieId}
    STO->>MINIO: presignedGetObject("movies-videos", objectName, 3600s)
    MINIO-->>STO: URL pré-assinada temporária (válida por 1h)
    STO-->>GW: { url: "http://minio:9000/movies-videos/uuid?X-Amz-Signature=..." }
    GW-->>FE: { url: "..." }

    FE->>FE: Define src do <video> com a URL pré-assinada
    FE->>MINIO: Requisição direta ao MinIO pela URL pré-assinada
    MINIO-->>FE: Stream do arquivo de vídeo
    FE->>FE: Reproduz vídeo no player HTML5
```

> **Por que URL pré-assinada?** O bucket `movies-videos` é privado. Ninguém pode acessar diretamente sem autenticação. A URL pré-assinada é uma URL temporária gerada pelo MinIO que carrega a assinatura criptográfica da credencial de acesso. Ela expira em 1 hora e não pode ser usada além disso.

---

## 13. Fluxo de Geração de Legendas por IA

Este pipeline roda completamente em background após o upload de um vídeo, sem intervenção do usuário.

```mermaid
sequenceDiagram
    participant MQ as RabbitMQ
    participant AI as AI Service (consumer.py)
    participant PROC as AI Service (processor.py)
    participant MINIO as MinIO
    participant WHISPER as Whisper Model
    participant LT as LibreTranslate
    participant SUB_SVC as Subtitle Service
    participant NOTIF as Notification Service

    MQ->>AI: DELIVER { movieId, bucketName, objectName }
    AI->>AI: Cria ProcessingJob (status=QUEUED) no banco
    AI->>AI: Inicia Thread separada para não bloquear o consumer
    
    AI->>PROC: process_video(job_id, movie_id, bucket, object)
    PROC->>PROC: Atualiza job: status=PROCESSING
    
    PROC->>MINIO: fget_object(bucket, objectName) → /tmp/video.mp4
    MINIO-->>PROC: Arquivo salvo localmente

    PROC->>PROC: ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
    Note over PROC: Extrai áudio mono 16kHz (formato ideal para Whisper)

    PROC->>WHISPER: model.transcribe(audio.wav)
    WHISPER-->>PROC: { language: "en", segments: [{start, end, text}, ...] }
    Note over PROC: Detectou idioma original: inglês

    PROC->>PROC: Converte segmentos para formato WebVTT
    PROC->>SUB_SVC: POST /subtitles { movie_id, language: "en", content: "WEBVTT\n..." }
    SUB_SVC-->>PROC: 201 OK

    loop Para cada idioma diferente do original (pt, es)
        PROC->>LT: POST /translate { q: texto, source: "en", target: "pt" }
        LT-->>PROC: { translatedText: "..." }
        PROC->>PROC: Reconstrói WebVTT com texto traduzido
        PROC->>SUB_SVC: POST /subtitles { movie_id, language: "pt", content: "..." }
        SUB_SVC-->>PROC: 201 OK
    end

    PROC->>PROC: Atualiza job: status=COMPLETED
    
    Note over MQ: AI Service publica subtitles.ready
    MQ->>NOTIF: DELIVER { movieId }
    NOTIF->>NOTIF: Envia e-mail ao admin: "Legendas prontas para o filme X"
    NOTIF->>NOTIF: INSERT NotificationLog
```

### Formato WebVTT

As legendas são armazenadas no formato WebVTT, compatível nativamente com a tag `<track>` do HTML5:

```
WEBVTT

1
00:00:01.000 --> 00:00:03.500
Hello, welcome to CineVault.

2
00:00:04.000 --> 00:00:07.000
This is an example subtitle.
```

---

## 14. Usuários de Demonstração

O sistema **não cria usuários automaticamente** via seed. Você precisa criar manualmente pelo frontend ou pela API.

### Criar um Usuário Normal

1. Acesse `http://localhost:3000`
2. Clique em **Registrar**
3. Preencha nome, e-mail e senha
4. Clique em **Criar conta**

O usuário é criado com `role = NORMAL` por padrão.

### Promover um Usuário a ADMIN

Para ter acesso às funcionalidades de administrador (publicar filmes, ver jobs de IA, etc.), é necessário alterar o role diretamente no banco:

```bash
# 1. Conecta ao container do banco de autenticação
docker compose exec auth-db psql -U auth_user -d auth_db

# 2. Dentro do psql, liste os usuários cadastrados
SELECT id, email, name, role FROM "User";

# 3. Promova o usuário desejado a ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu@email.com';

# 4. Confirme a alteração
SELECT email, role FROM "User";

# 5. Saia do psql
\q
```

Depois de promovido, **faça logout e login novamente** no frontend para que o novo JWT com `role=ADMIN` seja emitido.

### O que muda com role=ADMIN

Com o papel de ADMIN, o frontend exibe:
- Botão **"Publicar Filme"** na navbar
- Formulário completo de publicação com upload de vídeo e pôster
- Acesso ao endpoint de jobs de IA via API

### Planos de Assinatura (pré-cadastrados automaticamente)

Os três planos são criados automaticamente na primeira inicialização do `subscription-service`:

```bash
# Verificar planos criados
curl http://localhost:8080/subscriptions/plans
```

---

## 15. Endpoints Principais

Todos os endpoints são acessados via `http://localhost:8080`. O API Gateway é o único ponto de entrada.

### Autenticação

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ Pública | Cria conta. Body: `{ email, name, password }` |
| `POST` | `/auth/login` | ❌ Pública | Autentica. Body: `{ email, password }`. Retorna `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/refresh` | ❌ Pública | Renova access token. Body: `{ refreshToken }` |
| `POST` | `/auth/logout` | ✅ Autenticado | Revoga tokens. Body: `{ refreshToken }` |
| `GET` | `/auth/me` | ✅ Autenticado | Retorna dados do usuário logado |
| `PATCH` | `/auth/profile` | ✅ Autenticado | Atualiza perfil. Body: `{ name?, languages? }` |

**Exemplo de register:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@teste.com","name":"João Silva","password":"senha123"}'
# Resposta: {"accessToken":"eyJ...","refreshToken":"uuid-...","user":{...}}
```

---

### Catálogo

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/catalog/movies` | ❌ Pública | Lista filmes com paginação. Query: `?search=&genre=&page=` |
| `GET` | `/catalog/movies/:id` | ❌ Pública | Detalhes de um filme |
| `GET` | `/catalog/home` | ❌ Pública | Filmes em destaque + mais recentes |
| `GET` | `/catalog/categories` | ❌ Pública | Categorias disponíveis |
| `POST` | `/catalog/movies` | 🔴 ADMIN | Cria filme. Body: `{ title, description, year, genre, idioma, featured? }` |
| `PATCH` | `/catalog/movies/:id` | 🔴 ADMIN | Atualiza filme |
| `DELETE` | `/catalog/movies/:id` | 🔴 ADMIN | Remove filme |

**Exemplo de criação de filme (ADMIN):**
```bash
curl -X POST http://localhost:8080/catalog/movies \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Blade Runner 2049","description":"...","year":2017,"genre":"SCI_FI","idioma":"Inglês"}'
```

---

### Storage

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/storage/upload/video?movieId=:id` | 🔴 ADMIN | Upload de vídeo (multipart). Campo: `file` |
| `POST` | `/storage/upload/poster?movieId=:id` | 🔴 ADMIN | Upload de pôster (multipart). Campo: `file` |
| `GET` | `/storage/stream/:movieId` | ✅ Autenticado | Retorna URL pré-assinada do vídeo. Resposta: `{ url }` |
| `GET` | `/storage/poster/:movieId` | ✅ Autenticado | Retorna URL pré-assinada do pôster. Resposta: `{ url }` |

---

### Legendas

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/subtitles/:movieId` | ✅ Autenticado | Lista todas as legendas do filme. Retorna array de tracks |
| `GET` | `/subtitles/:movieId/status` | ✅ Autenticado | Status de processamento das legendas |
| `GET` | `/subtitles/:movieId/:language` | ✅ Autenticado | Conteúdo WebVTT de uma legenda específica. Ex: `/subtitles/uuid/pt` |

---

### Assinaturas

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/subscriptions/plans` | ❌ Pública | Lista os 3 planos disponíveis |
| `GET` | `/subscriptions/me` | ✅ Autenticado | Assinatura ativa do usuário logado |
| `POST` | `/subscriptions` | ✅ Autenticado | Cria assinatura. Body: `{ planId }` |
| `PATCH` | `/subscriptions/:id/cancel` | ✅ Autenticado | Cancela assinatura |

---

### AI Jobs (Admin)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/ai/jobs` | 🔴 ADMIN | Lista todos os jobs de processamento |
| `GET` | `/ai/jobs/:id` | 🔴 ADMIN | Detalhes de um job específico |

---

### Notificações (Admin)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/notifications/logs` | 🔴 ADMIN | Histórico de notificações enviadas |

---

## 16. Troubleshooting

### O build trava no AI Service por muito tempo

**Causa:** O AI Service precisa baixar PyTorch (~2 GB via pip) e o modelo Whisper (~460 MB). O processo é demorado na primeira vez.

**Solução:** Aguarde. O build pode levar entre 15 e 40 minutos dependendo da velocidade da internet. Na segunda vez, o Docker usa cache e é quase instantâneo.

---

### Erro: `port is already allocated`

**Causa:** Outra aplicação está usando a porta 3000, 8080 ou 8025.

**Solução:**
```bash
# No Linux/macOS, veja quem está usando a porta
lsof -i :3000

# No Windows (PowerShell)
netstat -ano | findstr :3000

# Alternativa: Mude a porta no docker-compose.yml
# De: "3000:3000"
# Para: "3001:3000"  (acesse em localhost:3001)
```

---

### Serviço aparece como `unhealthy`

**Causa:** O serviço levou mais tempo para iniciar do que o healthcheck esperava.

**Solução:**
```bash
# Veja os logs do serviço problemático
docker compose logs nome-do-servico

# Reinicie apenas o serviço com problema
docker compose restart nome-do-servico
```

---

### Erro de banco de dados: `connection refused`

**Causa:** O serviço tentou conectar ao banco antes que o PostgreSQL estivesse pronto.

**Solução:** Os healthchecks do `docker-compose.yml` já tratam isso. Se mesmo assim ocorrer, é um problema de tempo. Aguarde e reinicie:

```bash
docker compose restart auth-service
```

---

### MinIO indisponível / uploads falham

**Causa:** O MinIO não subiu corretamente ou os buckets não foram criados.

**Solução:**
```bash
# Verifique o status do MinIO
docker compose logs minio
docker compose logs minio-init

# Reinicie o MinIO e o minio-init
docker compose restart minio
docker compose up minio-init
```

---

### RabbitMQ indisponível / legendas não são geradas

**Causa:** O RabbitMQ demorou para iniciar e algum serviço tentou conectar antes.

**Solução:**
```bash
docker compose logs rabbitmq
docker compose restart ai-service notification-service storage-service
```

---

### Frontend não carrega / tela em branco

**Causa:** O build do frontend falhou ou o nginx não subiu corretamente.

**Solução:**
```bash
docker compose logs frontend

# Forçar rebuild do frontend
docker compose up --build frontend
```

---

### Erro 401 após fazer login

**Causa:** O `accessToken` pode ter expirado (15 minutos) ou não está sendo enviado.

**Diagnóstico:**
1. Abra o DevTools do navegador → aba Application → Local Storage
2. Verifique se `accessToken` está presente
3. Se não estiver, faça login novamente

**Para debug do JWT:**
```bash
# No terminal, decodifique o token (base64 da parte do meio)
echo "SEU_TOKEN_SEM_ASSINATURA" | base64 -d
```

---

### Erro 403 ao tentar publicar filme

**Causa:** Usuário não tem `role = ADMIN`.

**Solução:** Siga as instruções da seção [Promover um Usuário a ADMIN](#promover-um-usuário-a-admin).

---

### E-mails não aparecem no MailHog

**Causa:** O notification-service pode não ter consumido o evento ainda.

**Solução:**
1. Acesse `http://localhost:8025` (MailHog)
2. Verifique se o e-mail está lá
3. Se não estiver, veja os logs:

```bash
docker compose logs notification-service
```

---

### Limpar tudo e começar do zero

```bash
# Para e remove containers + volumes (apaga todos os dados)
docker compose down -v

# Remove imagens locais do projeto
docker compose down --rmi local

# Refaz tudo do zero
docker compose up --build
```

---

## 17. Critérios da Disciplina

Esta seção demonstra explicitamente como cada requisito típico de uma disciplina de arquitetura de microsserviços foi atendido pelo projeto.

| Requisito | Implementação | Status |
|---|---|---|
| **Múltiplos microsserviços independentes** | 7 microsserviços (auth, catalog, storage, subtitle, ai, subscription, notification) + API Gateway | ✅ Implementado |
| **Database per Service** | 7 bancos PostgreSQL isolados, um por serviço. Nenhum serviço acessa o banco do outro | ✅ Implementado |
| **API Gateway** | `api-gateway/` em Node.js + Fastify com `@fastify/http-proxy`. Único ponto de entrada externo | ✅ Implementado |
| **Autenticação com JWT** | JWT com claims `sub`, `email`, `role`, `iss`, `aud`. Access token 15min, refresh token 7 dias | ✅ Implementado |
| **RBAC (controle de acesso por papel)** | Roles ADMIN e NORMAL aplicadas no gateway. Rotas protegidas por papel via `requireRole()` | ✅ Implementado |
| **Comunicação síncrona (HTTP/REST)** | Todos os serviços expõem APIs REST. Frontend → Gateway → Serviços via HTTP | ✅ Implementado |
| **Comunicação assíncrona (mensageria)** | RabbitMQ com exchange `movie-events` (topic). Eventos: `video.uploaded`, `subtitles.ready`, `subscription.created` | ✅ Implementado |
| **Containerização com Docker** | Cada serviço tem Dockerfile próprio com build multi-stage | ✅ Implementado |
| **Orquestração com Docker Compose** | `docker-compose.yml` com healthchecks, depends_on e redes isoladas (internal/external) | ✅ Implementado |
| **Diferentes linguagens/tecnologias** | Node.js (6 serviços) + Python 3.11 (2 serviços: subtitle-service e ai-service) | ✅ Implementado |
| **Object Storage** | MinIO (compatível com S3). Buckets `movies-videos` e `movies-posters`. URLs pré-assinadas para streaming seguro | ✅ Implementado |
| **Inteligência Artificial** | Whisper `small` para transcrição de áudio + LibreTranslate para tradução automática de legendas | ✅ Implementado |
| **Frontend integrado** | React 18 + TypeScript + Tailwind CSS. Interface completa de catálogo, player, formulário de publicação e assinaturas | ✅ Implementado |
| **Healthchecks** | Todos os serviços têm endpoint `/health` e healthcheck configurado no Docker Compose | ✅ Implementado |
| **Isolamento de rede** | Rede `internal` (serviços não expostos ao host) + rede `external` (gateway e frontend) | ✅ Implementado |
| **Notificações por e-mail** | Nodemailer + MailHog. E-mails disparados por eventos assíncronos via RabbitMQ | ✅ Implementado |
| **Token blacklist** | Redis armazena tokens revogados. Gateway consulta antes de cada request autenticado | ✅ Implementado |
| **Seed de dados** | subscription-service cria automaticamente os 3 planos de assinatura na inicialização | ✅ Implementado |
| **Migrações de banco** | Prisma Migrate rodado automaticamente no CMD de cada serviço Node.js | ✅ Implementado |

---

## 18. Roteiro de Demonstração em Vídeo

Este roteiro cobre as principais funcionalidades em até 5 minutos. Recomenda-se gravar com a janela do terminal ao lado do navegador.

### Preparação (antes de gravar)

1. Suba o sistema: `docker compose up --build`
2. Aguarde todos os containers ficarem `(healthy)`
3. Crie uma conta de teste pelo frontend
4. Promova ela a ADMIN pelo banco (seção 14)
5. Faça logout e login novamente para atualizar o token

### Roteiro Detalhado

**[0:00 – 0:30] Introdução e visão geral da arquitetura**

- Mostre o `docker-compose.yml` brevemente, citando os 15+ containers
- Execute `docker ps` no terminal para mostrar todos rodando
- Diga: "Cada serviço tem seu próprio banco de dados PostgreSQL independente"

**[0:30 – 1:00] Autenticação e JWT**

- Acesse `http://localhost:3000`
- Faça login com a conta ADMIN
- Abra o DevTools → Application → Local Storage
- Mostre o `accessToken` armazenado
- Abra [jwt.io](https://jwt.io) e cole o token para mostrar o payload com `sub`, `email`, `role`, `iss`, `aud`
- Destaque: "Access token expira em 15 minutos. O refresh token dura 7 dias."

**[1:00 – 1:30] RBAC na prática**

- Mostre o botão "Publicar Filme" na navbar (visível apenas para ADMIN)
- Abra o terminal e faça uma request admin como usuário NORMAL:
  ```bash
  curl -X POST http://localhost:8080/catalog/movies \
    -H "Authorization: Bearer TOKEN_DE_USUARIO_NORMAL" \
    -H "Content-Type: application/json" \
    -d '{"title":"Teste"}'
  # Retorno: 403 Forbidden
  ```
- Diga: "O API Gateway bloqueia a request antes de chegar ao Catalog Service"

**[1:30 – 2:30] Upload de Filme**

- Clique em "Publicar Filme"
- Preencha os campos (título, gênero, idioma, descrição)
- Selecione um arquivo de pôster (imagem) e um de vídeo (pode ser um vídeo curto de 10s)
- Clique em "Publicar no Catálogo"
- No terminal, mostre os logs do storage-service publicando o evento no RabbitMQ:
  ```bash
  docker compose logs -f storage-service
  # Deve mostrar: RabbitMQ event published: video.uploaded
  ```
- Mostre os logs do ai-service iniciando o processamento:
  ```bash
  docker compose logs -f ai-service
  # Deve mostrar: [AI Consumer] Evento recebido: movieId=...
  ```

**[2:30 – 3:30] Pipeline de IA e Legendas**

- Aguarde o AI Service processar (ou tenha um resultado pronto de uma execução anterior)
- Mostre os logs do ai-service:
  ```
  [AI] Baixando vídeo...
  [AI] Extraindo áudio com FFmpeg
  [AI] Transcrevendo com Whisper
  [AI] Idioma detectado: en
  [AI] Traduzindo para: pt
  [AI] Traduzindo para: es
  [AI] Job concluído com sucesso
  ```
- Acesse o MailHog em `http://localhost:8025` e mostre o e-mail de "Legendas prontas"
- Abra o modal do filme no frontend e mostre as legendas disponíveis

**[3:30 – 4:30] Streaming com URL Pré-assinada**

- No modal do filme, clique no botão Play ▶
- Mostre o vídeo tocando no player HTML5
- Abra o DevTools → aba Network → filtre por "stream"
- Mostre a request para `/storage/stream/:id` retornando uma URL do MinIO com parâmetros de assinatura (`X-Amz-Signature`, `X-Amz-Expires`)
- Diga: "Esta URL expira em 1 hora. Sem ela, ninguém pode acessar o vídeo diretamente."

**[4:30 – 5:00] Comunicação assíncrona e Docker Compose**

- Mostre o painel de queues do RabbitMQ (opcional, se quiser acessar pela porta 15672 caso exposta)
- Ou simplesmente execute:
  ```bash
  docker compose logs rabbitmq | grep -i "queue"
  ```
- Feche com: "Todo o sistema roda com um único `docker compose up --build`. Sem instalar Node.js, Python ou qualquer outra dependência localmente."

---

*Projeto desenvolvido para a disciplina de Arquitetura de Microsserviços.*
