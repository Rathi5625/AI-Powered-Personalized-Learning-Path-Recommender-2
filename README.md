# AetherPath — AI-Powered Personalized Learning Path Recommender

AetherPath is an intelligent curriculum generation and mentorship platform designed for developers and technical learners seeking mastery in specialized engineering domains. Unlike standard LLM prompts that guess courses with hallucinations, AetherPath uses deterministic pgvector embedding retrieval paired with prerequisite-aware topological graph sorting, structured milestone generation, adaptive knowledge assessments, and a persistent, context-aware AI mentor.

---

## Key Features

- **Conversational Intake & Goal Calibration**: Multi-turn chat interface analyzes learner background, target job titles, time commitments, and preferred learning styles.
- **Vector-Driven Recommendation Engine**: Employs dense vector embeddings (`nvidia/nv-embedqa-e5-v5` or OpenAI-compatible) and cosine distance in PostgreSQL (`pgvector`) to discover the most relevant courses and modules.
- **Topological Prerequisite Sequencing**: Deterministic Java graph algorithms resolve concept dependencies, ensuring foundational milestones precede advanced topics.
- **Architect Rationale & Explanations**: Milestone-level synthesis explaining exactly *why* each resource was chosen and how it bridges the gap to the learner's ambition.
- **Curriculum Adaptation & Feedback**: Fine-tune or regenerate learning paths dynamically based on learner feedback and pacing.
- **Interactive React Flow Curriculum Graphs**: Visual step-by-step milestone graphs with status tracking (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
- **Targeted Knowledge Assessments**: Generates 5-question technical evaluations calibrated to the learner's active trajectory milestones or custom topics, complete with rationale and score breakdowns.
- **Context-Aware AI Mentor Studio**: Multi-turn technical tutor bound to specific courses, assessments, or overall curriculum context.
- **Curated Course & YouTube Catalog**: ~792 pre-indexed courses and video lectures spanning systems architecture, cloud/DevOps, full-stack, data engineering, and machine learning.
- **Security & OTP Verification**: Stateless JWT authentication supporting optional 6-digit email OTP verification (or terminal console fallback for local dev).
- **Learner Dossier & Profile**: Résumé-style portfolio tracking target skills, employment status, experience level, and verified completed modules.

---

## Tech Stack

### Backend
- **Framework & Runtime**: Java 21, Spring Boot 3.3.2
- **Database & Vectors**: PostgreSQL with `pgvector` (hosted on Supabase)
- **Persistence & Migrations**: Spring Data JPA, Hibernate, Flyway
- **Security**: Spring Security 6 with stateless JWT Bearer token authentication
- **AI Integration**: Spring WebClient calling OpenAI-compatible APIs (configured by default for NVIDIA NIM)
- **API Documentation**: SpringDoc OpenAPI / Swagger UI

### Frontend (`frontend-v3`)
- **Core**: React 18, TypeScript, Vite
- **Styling & Theme**: Tailwind CSS with custom **Knowledge Core** tokens (`void`, `surface`, `line`, `ion`, `ember`)
- **State & Telemetry**: TanStack React Query v5, Zustand
- **Visualizations**: React Flow (`@xyflow/react`), Recharts, React Three Fiber + Drei (3D Knowledge Core)
- **Animation**: Framer Motion
- **Forms & Validation**: React Hook Form, Zod

### LLM & Embedding Setup
The backend interfaces with OpenAI-compatible chat completion (`/chat/completions`) and embedding (`/embeddings`) endpoints. By default, it connects to **NVIDIA NIM** (`https://integrate.api.nvidia.com/v1`) using `nvidia/nemotron-3-super-120b-a12b` for chat/reasoning and `nvidia/llama-nemotron-embed-vl-1b-v2` (dimension: 2048) for embeddings, but can be swapped to OpenAI or any compatible provider via environment variables alone.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│             frontend-v3 (React 18 + Vite)             │
│  Interactive 3D Core • React Flow • Chat • Telemetry   │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Auth)
┌───────────────────────────▼────────────────────────────┐
│              backend (Spring Boot 3 + Java 21)         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Recommendation Pipeline                          │  │
│  │ 1. Vector Search (pgvector cosine similarity)    │  │
│  │ 2. Deterministic Prerequisite Topological Sort   │  │
│  │ 3. LLM Milestone Rationale Synthesis             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ AI Services                                      │  │
│  │ • Conversational Intake Chat                     │  │
│  │ • AI Mentor Studio (Course/Assessment Context)   │  │
│  │ • Adaptive Assessment Synthesis                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
   SQL / pgvector Queries       OpenAI-Compatible HTTP
              │                            │
┌─────────────▼─────────────┐   ┌──────────▼─────────────┐
│  Supabase PostgreSQL      │   │  NVIDIA NIM / OpenAI   │
│  (pgvector extension)     │   │  Llama 3.1 & EmbedQA   │
└───────────────────────────┘   └────────────────────────┘
```

> **Note on Recommendation Design**: The curriculum structure and prerequisite ordering are computed deterministically in Java using database embeddings and graph algorithms—the LLM is strictly used for intent extraction, natural language rationale, conversational intake, and mentoring.

---

## Project Structure

```
/
├── backend/       # Spring Boot 3 API (Java 21, Flyway migrations, JPA, pgvector)
├── frontend-v3/   # React 18 frontend (Knowledge Core UI, React Flow, TanStack Query)
└── README.md      # Root documentation
```

*Earlier frontend prototypes (`frontend/`, `frontend-v2/`) were removed after `frontend-v3/` was finalized.*

---

## Getting Started

### Prerequisites
- **Java 21** (e.g. Eclipse Adoptium Temurin or OpenJDK 21)
- **Apache Maven 3.9+**
- **Node.js 18+** and **npm**
- **Supabase PostgreSQL instance** (with the `vector` extension enabled under Database → Extensions)
- **NVIDIA NIM API Key** (or an OpenAI API key)

---

### Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Configure the following environment variables in `backend/.env`:
   - `DB_URL`: JDBC connection string to Supabase (e.g. `jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require` or your Supabase Session Pooler URL).
   - `DB_USERNAME`: Database username (e.g. `postgres` or `postgres.<project-ref>` if using pooler).
   - `DB_PASSWORD`: Your Supabase database password.
   - `JWT_SECRET`: A secure random string (at least 32 characters).
   - `LLM_API_KEY`: Your NVIDIA NIM key (`nvapi-...`) or OpenAI key.
   - `EMBEDDING_API_KEY`: Your NVIDIA NIM key (`nvapi-...`) or OpenAI key.
   - `SMTP_*`: Leave empty to log OTP codes to the terminal console during development, or configure SMTP credentials for real email delivery.

4. Run Flyway migrations and start the backend:
   ```bash
   mvn spring-boot:run
   ```

5. *(Optional)* To seed the catalog with the 792 curated courses on initial boot:
   - Set `APP_IMPORT_ENABLED=true` in `.env`.
   - Start the server once to run the importer, then set `APP_IMPORT_ENABLED=false`.

6. Confirm the backend is accessible at `http://localhost:8080`. Swagger documentation is available at [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

---

### Frontend Setup

1. Open a new terminal and navigate to `frontend-v3/`:
   ```bash
   cd frontend-v3
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL=http://localhost:8080/api` is configured.

3. Install dependencies and launch the development server:
   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require` |
| `DB_USERNAME` | PostgreSQL username | `postgres` (or `postgres.<ref>`) |
| `DB_PASSWORD` | PostgreSQL user password | `your_supabase_db_password` |
| `JWT_SECRET` | Secret key for signing stateless JWT tokens | `min_32_char_random_secret` |
| `JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds | `86400000` (24 hours) |
| `LLM_API_KEY` | API key for LLM chat completion | `nvapi-...` |
| `LLM_MODEL` | Model identifier for chat completions | `nvidia/nemotron-3-super-120b-a12b` |
| `LLM_BASE_URL` | Base URL for OpenAI-compatible LLM endpoint | `https://integrate.api.nvidia.com/v1` |
| `EMBEDDING_API_KEY` | API key for text embedding generation | `nvapi-...` |
| `EMBEDDING_MODEL` | Model identifier for embeddings | `nvidia/llama-nemotron-embed-vl-1b-v2` |
| `EMBEDDING_BASE_URL` | Base URL for OpenAI-compatible embedding endpoint | `https://integrate.api.nvidia.com/v1` |
| `EMBEDDING_DIMENSION` | Vector embedding dimension matching pgvector column | `2048` |
| `SERVER_PORT` | Port the Spring Boot server listens on | `8080` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins for browser requests | `http://localhost:5173` |
| `REQUIRE_EMAIL_VERIFICATION` | Require OTP verification before allowing login | `true` |
| `SMTP_HOST` | SMTP server host (leave blank for console OTP) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username / email address | `user@example.com` |
| `SMTP_PASSWORD` | SMTP app password | `app_password` |
| `APP_IMPORT_ENABLED` | One-time curated course dataset import on boot | `false` |

### Frontend (`frontend-v3/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL pointing to the Spring Boot REST API | `http://localhost:8080/api` |

---

## Core API Endpoints

Swagger UI is the interactive source of truth for all API contracts: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new learner account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit email OTP code | No |
| `POST` | `/api/chat/message` | Conversational intake turn & goal extraction | Yes |
| `POST` | `/api/learning-paths/generate` | Synthesize deterministic curriculum graph | Yes |
| `GET` | `/api/learning-paths/{id}` | Retrieve learning path and milestone graph | Yes |
| `POST` | `/api/learning-paths/{id}/regenerate` | Recalibrate curriculum based on feedback | Yes |
| `GET` | `/api/courses/search` | Semantic vector search across catalog | Yes |
| `POST` | `/api/assessments/generate` | Generate targeted 5-question evaluation | Yes |
| `POST` | `/api/assessments/{id}/submit` | Submit answers and receive score + rationale | Yes |
| `POST` | `/api/mentor/message` | Context-aware AI Mentor conversation turn | Yes |
| `GET` | `/api/dashboard` | Telemetry readouts, active shell state, next up | Yes |
| `GET` | `/api/profile/me` | Retrieve user profile, skills, and credentials | Yes |

---

## Known Limitations & Notes for Reviewers

- **Mentor In-Memory Session**: AI Mentor chat history is maintained in-process per active session and is not stored in PostgreSQL across backend restarts.
- **Development OTP Mode**: If SMTP settings are omitted in `.env`, the backend falls back to `ConsoleEmailService` and prints the 6-digit OTP directly to the terminal logs with clear visual formatting.
- **Supabase Connection Pools**: When connecting via Supabase Session Pooler (port 5432), ensure `DB_USERNAME` uses the `postgres.<project-ref>` format.
- **Provider Interchangeability**: The embedding and LLM clients rely on standard OpenAI REST specifications (`/v1/chat/completions` and `/v1/embeddings`), allowing drop-in switching between NVIDIA NIM, OpenAI, or self-hosted Ollama/vLLM instances without code changes.
