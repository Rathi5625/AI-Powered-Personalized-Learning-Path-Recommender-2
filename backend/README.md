# AI-Powered Personalized Learning Path Recommender (Backend)

A production-ready Spring Boot 3.3.x monolithic backend application running on Java 21, providing personalized learning path recommendations, topological prerequisite scheduling, conversational AI intake, and vector similarity matching using PostgreSQL `pgvector` hosted on **Supabase** (or local Postgres).

---

## 🚀 Features

- **Personalized Recommendations**: Combines semantic embeddings with topological sorting of course prerequisites and experience/interest weighting.
- **Conversational Intake**: Multi-turn chat orchestration powered by OpenAI models via Spring `WebClient`.
- **Vector Search**: PostgreSQL `pgvector` cosine similarity (`<=>`) queries against high-dimensional dense embeddings.
- **Stateless JWT Security**: Spring Security with Bearer token authentication for all protected endpoints.
- **Milestone & Progress Tracking**: Real-time progress dashboard, milestone lifecycle transitions, and qualitative feedback loops.
- **Interactive Documentation**: SpringDoc OpenAPI / Swagger UI integration.
- **Automated Schema Migrations**: Flyway versioned migration scripts with native `pgvector` extension enablement.

---

## 🛠️ Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.3.x (Web, WebFlux, Data JPA, Security, Validation)
- **Database**: PostgreSQL (Supabase with `pgvector` extension)
- **Security**: JWT (jjwt 0.12.6)
- **Migrations**: Flyway (`V1__enable_pgvector.sql`, `V2__init_schema.sql`)
- **API Docs**: springdoc-openapi (`/swagger-ui.html`)
- **Testing**: JUnit 5, Mockito, Testcontainers

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a project on [Supabase](https://supabase.com).
2. Ensure `pgvector` is enabled (Flyway migration `V1__enable_pgvector.sql` executes `CREATE EXTENSION IF NOT EXISTS vector;` automatically. It can also be checked via Supabase Dashboard → Database → Extensions → search "vector").
3. Navigate to **Project Settings → Database** and copy the **Direct connection** URI (Port `5432`).
   > ⚠️ **Important**: Use the direct port `5432` connection string (not the pooled port `6543`), as Flyway and Hibernate require direct session-level capabilities.
4. Ensure `?sslmode=require` is appended to the JDBC URL.

### Local Alternative (Docker pgvector)
```bash
docker run -d \
  --name pgvector-learningpath \
  -e POSTGRES_DB=learningpath \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` inside `backend/` or export environment variables:

```bash
# Database (Supabase Direct Connection)
DB_URL=jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_db_password

# JWT
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# LLM Provider
LLM_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1

# Embeddings
EMBEDDING_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BASE_URL=https://api.openai.com/v1

# Application
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🔨 Building and Running

### 1. Build with Maven
```bash
cd backend
mvn clean install
```

### 2. Run the Spring Boot Application
```bash
cd backend
mvn spring-boot:run
```

The application will start on `http://localhost:8080`.

---

## 📖 API Documentation & Swagger UI

Access the interactive API documentation at:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

To test secured endpoints:
1. Send `POST /api/auth/register` or `POST /api/auth/login` to obtain a JWT.
2. Click **Authorize** in Swagger UI and enter `Bearer <your_token>`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user and receive JWT |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT |
| `POST` | `/api/chat/message` | Conversational intake and goal parsing |
| `GET` | `/api/profile/me` | Fetch authenticated learner's profile |
| `PUT` | `/api/profile/me` | Update goals, interests, learning style |
| `POST` | `/api/profile/me/completed-courses/{id}` | Mark course completed |
| `GET` | `/api/courses` | Paginated catalog filterable by skill/level/platform |
| `GET` | `/api/courses/{id}` | Get course detail |
| `GET` | `/api/courses/search?query=` | Semantic vector search |
| `POST` | `/api/learning-paths/generate` | Generate personalized learning path |
| `GET` | `/api/learning-paths/{id}` | Get full learning path with milestones |
| `GET` | `/api/learning-paths/me` | Get all learning paths for learner |
| `POST` | `/api/learning-paths/{id}/regenerate` | Regenerate path with qualitative feedback |
| `POST` | `/api/progress/milestones/{id}/start` | Start milestone |
| `POST` | `/api/progress/milestones/{id}/complete` | Complete milestone |
| `POST` | `/api/progress/milestones/{id}/feedback` | Record milestone feedback |
| `GET` | `/api/progress/dashboard` | Aggregated learner dashboard metrics |
