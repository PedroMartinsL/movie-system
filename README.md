# 🎬 Movie System

> Projeto acadêmico desenvolvido para a disciplina de **Integração de Sistemas** da
> **Universidade de Pernambuco**

---

## 📚 Informações Acadêmicas

* **Disciplina:** Integração de Sistemas
* **Professor:** Caio Bruno Bezerra de Souza

### 👨‍💻 Alunos

* Gabriel Couto
* Gabriel Lopes
* Joserlan Gonçalves
* Pedro Martins

----

# 📌 Visão Geral

O **Movie System** é uma arquitetura baseada em microsserviços para uma plataforma de streaming de filmes e séries, inspirada em soluções modernas utilizadas por grandes empresas do setor.

O sistema foi projetado com foco em:

* Escalabilidade
* Separação de responsabilidades
* Integração entre serviços
* Segurança e autenticação
* Processamento multimídia
* Inteligência Artificial
* Modularização de domínio

---

# 🏗️ Arquitetura do Sistema

A aplicação está dividida em múltiplos serviços independentes, organizados por domínio de negócio.

## 🔗 Diagrama da Arquitetura

[Visualizar Diagrama no Miro](https://miro.com/app/board/uXjVJ7R0wBA=/?utm_source=chatgpt.com)

---

# 🧩 Estrutura dos Módulos

---

# 🔐 Módulo de Acesso

Responsável pela autenticação, gerenciamento de perfis e notificações da plataforma.

---

## 🔑 Serviço de Identidade e Acesso (`/auth`)

Gerencia autenticação e autorização utilizando JWT.

### Endpoints

| Método | Rota             | Descrição                             |
| ------ | ---------------- | ------------------------------------- |
| POST   | `/auth/register` | Cria uma nova conta                   |
| POST   | `/auth/login`    | Realiza autenticação e gera token JWT |
| POST   | `/auth/refresh`  | Renova o token de sessão              |

---

## 👤 Serviço Central de Usuários (`/users`)

Responsável pelos perfis vinculados à conta do usuário.

### Endpoints

| Método | Rota                 | Descrição                |
| ------ | -------------------- | ------------------------ |
| GET    | `/users/me/profiles` | Lista os perfis da conta |
| POST   | `/users/me/profiles` | Cria um novo perfil      |

---

## 🔔 Serviço de Notificações (`/notifications`)

Centraliza notificações e alertas do sistema.

### Endpoints

| Método | Rota                     | Descrição                                                     |
| ------ | ------------------------ | ------------------------------------------------------------- |
| GET    | `/notifications`         | Busca notificações recentes                                   |
| POST   | `/notifications/webhook` | Endpoint interno para disparo de e-mails e push notifications |

---

# 💳 Módulo Financeiro

Responsável pelo gerenciamento de assinaturas e pagamentos.

---

## 💰 Serviço de Assinaturas (`/subscriptions`)

### Endpoints

| Método | Rota                       | Descrição                    |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/subscriptions/plans`     | Lista planos disponíveis     |
| POST   | `/subscriptions/checkout`  | Processa pagamento           |
| GET    | `/subscriptions/me/status` | Retorna status da assinatura |

### 📦 Planos Disponíveis

* Básico
* Padrão
* Premium

### 📄 Status possíveis

* Ativa
* Inadimplente
* Cancelada

---

# 🎥 Camada de Negócio

Camada principal da aplicação responsável pela experiência do usuário.

---

## 🎞️ Serviço de Catálogo (`/catalog`)

Consulta conteúdos disponíveis por região.

### Endpoints

| Método | Rota                        | Descrição                                      |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/catalog/home`             | Retorna trilhas e carrosséis da página inicial |
| GET    | `/catalog/search?q={query}` | Busca filmes e séries                          |

---

## ▶️ Serviço de Reprodução e Legendas (`/player`)

Responsável pela reprodução de mídia e gerenciamento de legendas.

### Endpoints

| Método | Rota                                           | Descrição                    |
| ------ | ---------------------------------------------- | ---------------------------- |
| GET    | `/player/{title_id}/manifest`                  | Retorna manifesto HLS/DASH   |
| GET    | `/player/{title_id}/subtitles?lang={language}` | Retorna legendas do conteúdo |

### 📺 Tecnologias relacionadas

* HLS
* DASH
* VTT
* SRT

---

## 🤖 Serviço de Inteligência Artificial (`/ai`)

Serviço responsável pela geração automática de legendas.

### Endpoints

| Método | Rota             | Descrição                             |
| ------ | ---------------- | ------------------------------------- |
| POST   | `/ai/transcribe` | Recebe áudio e retorna legenda gerada |

### 📥 Entrada

* Arquivos MP3

### 📤 Saída

* Arquivos VTT
* Arquivos SRT

---

## 📢 Serviço de Propagandas (`/ads`)

Sistema integrado a empresas parceiras para anúncios durante reprodução.

### Endpoints

| Método | Rota             | Descrição                           |
| ------ | ---------------- | ----------------------------------- |
| GET    | `/ads/placement` | Retorna anúncio a ser exibido       |
| POST   | `/ads/campaigns` | Cadastro de campanhas publicitárias |

---

# 💾 Módulo de Armazenamento (Backoffice)

Responsável pelo upload, processamento e gerenciamento de mídia.

---

## ☁️ Serviço de Armazenamento (`/storage`)

### Endpoints

| Método | Rota                          | Descrição                        |
| ------ | ----------------------------- | -------------------------------- |
| POST   | `/storage/upload/video`       | Upload de vídeo bruto            |
| POST   | `/storage/upload/metadata`    | Upload de capas e metadados      |
| GET    | `/storage/status/{upload_id}` | Consulta status do processamento |

---

# 🔄 Fluxo Geral do Sistema

---

**Relatório Técnico — Validação de Legendas e IA**

## Resumo
- **Status:** O projeto foi inicializado localmente usando Docker Compose. Os serviços essenciais (Postgres, MinIO, storage-spring, language-fastapi e gateway) foram levantados com sucesso e o fluxo de geração/tradução de legendas foi validado na instância local.

## Como executei (comandos)
- **Subir serviços essenciais:**

```bash
docker compose up -d postgres-storage minio storage-spring language-fastapi
docker compose up -d --build gateway
```

- **Verificar health do serviço AI:**

```bash
curl http://localhost:8002/ai/health
# ou no PowerShell:
Invoke-RestMethod -Uri http://localhost:8002/ai/health
```

- **Solicitar geração/tradução de legenda (player):**

```bash
# Primeiro request inicia geração em background
Invoke-RestMethod -Uri "http://localhost:8002/player/movie-001/subtitles?lang=es"
# Segundo request retorna legenda pronta
Invoke-RestMethod -Uri "http://localhost:8002/player/movie-001/subtitles?lang=es"
```

## Banco encontrado
- **Tipo:** PostgreSQL (container `postgres-storage` definido em [docker-compose.yml](docker-compose.yml)).
- **Banco usado pelo módulo de armazenamento:** `movie_db` (variáveis definidas em [.env](.env)).
- **Tabelas principais detectadas:** `tb_movie` (criada pelo serviço [springboot-storage](springboot-storage)).
- **Registros:** A tabela `tb_movie` contém registros de teste; no ambiente atual há 1 registro inicial carregado automaticamente.

Comando usado para checagem no container:

```bash
docker exec -i postgres-storage psql -U postgres -d movie_db -c "\dt"
docker exec -i postgres-storage psql -U postgres -d movie_db -c "SELECT COUNT(*) FROM tb_movie;"
docker exec -i postgres-storage psql -U postgres -d movie_db -c "SELECT id, title, movie_year, genre, description FROM tb_movie ORDER BY id LIMIT 10;"
```

## Dados encontrados (filmes)
- **Primeiros registros (exemplo):**

```
id: 1
title: Teen Titans Haunted
year: 2003
genre: ACTION
description: Episodio usado para testar upload, armazenamento e legendas.
```
- **Campos obrigatórios validados:** `id`, `title` (título), `description` (descrição), `genre` (gênero), `movie_year` (ano) — presentes no modelo `Movie` em [springboot-storage/src/main/java/com/pedromartinsl/dslist/entities/Movie.java](springboot-storage/src/main/java/com/pedromartinsl/dslist/entities/Movie.java).

## Testes de funcionalidades e evidências (IA / legendas)
- **Health AI:** resposta esperada:

```
{"status":"ok","service":"ai-language-player-service","message":"AI service is running"}
```

- **Geração/tradução de legenda via player:**
    - Primeiro `GET /player/movie-001/subtitles?lang=es` retornou `status: processing`.
    - Segundo `GET /player/movie-001/subtitles?lang=es` retornou `status: ready` e o conteúdo da legenda.

- **Arquivo de legenda gerado:** [fastapi-language/storage/output/movie-001_es.srt](fastapi-language/storage/output/movie-001_es.srt)

Conteúdo do arquivo gerado (evidência):

```
1
00:00:01,000 --> 00:00:03,000
Olá, bem-vindo ao filme.
```

## Problemas encontrados e correções aplicadas
- Problema: `language-fastapi` container falhou inicialmente devido a dependência ausente `httpx` (ModuleNotFoundError).  
    - Arquivo relacionado: [fastapi-language/Dockerfile](fastapi-language/Dockerfile) e [fastapi-language/requirements.txt](fastapi-language/requirements.txt).  
    - Ação: Rebuild da imagem `language-fastapi` para garantir instalação de dependências. (Comando: `docker compose up -d --build language-fastapi`).

- Problema: `api-gateway` falhava ao iniciar devido a pacote `jose` incompatível com Python 3.x (SyntaxError).  
    - Arquivo relacionado: [fastapi-gateway/requirements.txt](fastapi-gateway/requirements.txt) — dependência `jose` causava erro.  
    - Correção aplicada: substituição por `python-jose==3.3.0` e rebuild da imagem. (Arquivo alterado: [fastapi-gateway/requirements.txt](fastapi-gateway/requirements.txt)).

- Problema: import incorreto em `fastapi-gateway/core/security.py` (tentava importar `settings` de `config` não encontrado).  
    - Arquivo e linha: [fastapi-gateway/core/security.py](fastapi-gateway/core/security.py) — import corrigido para `from core.config import settings`.

Alterações realizadas no repositório (evidência):
- [fastapi-gateway/requirements.txt](fastapi-gateway/requirements.txt) — substituição para `python-jose==3.3.0`.
- [fastapi-gateway/core/security.py](fastapi-gateway/core/security.py) — correção do import do `settings`.

Impacto: após essas correções os serviços `language-fastapi` e `api-gateway` iniciaram corretamente e endpoints foram acessíveis para validação.

## Sugestões e próximos passos (prioritários)
- Persistência e escalabilidade: mover repositório de legendas in-memory para um banco persistente (ex.: Postgres) e usar armazenamento compartilhado (MinIO/S3) para arquivos de legenda.  
- Workers assíncronos: externalizar geração/tradução de legendas para workers (Celery/RQ) para tolerância a falhas e para execução em múltiplas instâncias.  
- Observabilidade: adicionar logs estruturados, métricas (Prometheus) e alertas para chamadas a IA, ffmpeg, e transcrição.  
- Robustez de IA: adicionar retries, timeouts e fallback (mock) nos calls a provedores IA; considerar envio de blocos de contexto para tradução para melhorar qualidade.

## O que ainda é necessário do seu lado (se desejar que eu continue)
- Autorizar se quer que eu aplique persistência (ex.: migrar legendas para DB + MinIO), ou que eu implemente um worker assíncrono.  
- Fornecer arquivos de mídia de teste para validar transcrição real via `faster-whisper` (atualmente a imagem já instala `faster-whisper`, mas depende de modelo e recursos de CPU/GPU).

---
Relatório gerado automaticamente e adicionado ao README pelo analisador. Se quiser, eu ajusto o formato ou adiciono mais logs e comandos detalhados.

```text
Usuário → Auth → Assinatura → Catálogo → Reprodução → Storage
                                    ↓
                                   IA
                                    ↓
                                Legendas
```

---

# 🛡️ Segurança

O sistema utiliza:

* JWT para autenticação
* Tokens de renovação (Refresh Token)
* Comunicação entre microsserviços
* Controle de acesso baseado em sessão

---

# 🚀 Objetivos do Projeto

* Demonstrar integração entre microsserviços
* Simular arquitetura real de streaming
* Aplicar conceitos de APIs REST
* Trabalhar autenticação distribuída
* Explorar escalabilidade modular
* Integrar IA em sistemas multimídia

---

# 🧠 Conceitos Aplicados

* Microsserviços
* APIs REST
* JWT Authentication
* Processamento assíncrono
* Streaming de mídia
* Integração entre serviços
* Inteligência Artificial
* Armazenamento distribuído

---

# 🛠️ Possíveis Tecnologias

## Backend

* Node.js
* NestJS
* Express

## Banco de Dados

* PostgreSQL
* MongoDB
* Redis

## Infraestrutura

* Docker
* Kubernetes
* NGINX

## Streaming

* FFmpeg
* HLS
* DASH

---

# 📌 Considerações Finais

O projeto busca representar uma arquitetura moderna de plataforma de streaming, aplicando conceitos de integração de sistemas, modularização e comunicação distribuída entre serviços independentes.

Além disso, o sistema explora o uso de inteligência artificial para automação de legendas e personalização da experiência do usuário.

---

# 📄 Licença

Projeto acadêmico desenvolvido exclusivamente para fins educacionais na disciplina de Integração de Sistemas da Universidade de Pernambuco.
