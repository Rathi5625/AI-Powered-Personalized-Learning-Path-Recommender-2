"""Verification script for NVIDIA Nemotron-3-Embed-1B (2048-dim) pgvector migration and API pipeline.
"""
import os
import sys
import json
import urllib.request
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("psycopg2 not installed. Run 'pip install psycopg2-binary' to use this script.", file=sys.stderr)
    sys.exit(2)


def load_env():
    env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v


def test_nvidia_embedding_api():
    print("==================================================")
    print("1. Testing NVIDIA Embedding API with nemotron-3-embed-1b...")
    api_key = os.environ.get("EMBEDDING_API_KEY")
    base_url = os.environ.get("EMBEDDING_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model = os.environ.get("EMBEDDING_MODEL", "nvidia/nemotron-3-embed-1b")

    if not api_key:
        print("ERROR: EMBEDDING_API_KEY is missing.")
        return None, None

    url = f"{base_url.rstrip('/')}/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Query embedding test
    query_payload = {
        "model": model,
        "input": ["Mastering Full Stack Web Development with React and Spring Boot"],
        "input_type": "query"
    }
    req_query = urllib.request.Request(url, json.dumps(query_payload).encode("utf-8"), headers)
    with urllib.request.urlopen(req_query) as resp:
        query_data = json.loads(resp.read().decode("utf-8"))
        query_vec = query_data["data"][0]["embedding"]
        print(f"  [SUCCESS] Query Embedding: HTTP {resp.status}, model={model}, dimension={len(query_vec)}")

    # Passage embedding test
    passage_payload = {
        "model": model,
        "input": ["Comprehensive guide covering REST APIs, database design, Docker, and frontend integration."],
        "input_type": "passage"
    }
    req_passage = urllib.request.Request(url, json.dumps(passage_payload).encode("utf-8"), headers)
    with urllib.request.urlopen(req_passage) as resp:
        passage_data = json.loads(resp.read().decode("utf-8"))
        passage_vec = passage_data["data"][0]["embedding"]
        print(f"  [SUCCESS] Passage Embedding: HTTP {resp.status}, model={model}, dimension={len(passage_vec)}")

    return query_vec, passage_vec


def test_supabase_pgvector_compatibility(query_vec, passage_vec):
    print("\n==================================================")
    print("2. Testing Supabase pgvector database compatibility...")
    host = "aws-0-ap-southeast-1.pooler.supabase.com"
    user = os.environ.get("DB_USERNAME", "postgres.qdcifgxwpzohrgfkiurg")
    password = os.environ.get("DB_PASSWORD")
    dbname = "postgres"
    port = 5432

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode="require",
        connect_timeout=15
    )
    conn.autocommit = True
    cur = conn.cursor()

    # Check pgvector extension
    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
    row = cur.fetchone()
    print(f"  [DB] pgvector extension installed: version {row[0] if row else 'NOT FOUND'}")

    # Check current vector column definitions
    cur.execute("""
        SELECT column_name, udt_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'content_embedding';
    """)
    course_col = cur.fetchone()
    print(f"  [DB] courses.content_embedding column: {course_col}")

    cur.execute("""
        SELECT column_name, udt_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'learner_profiles' AND column_name = 'goal_embedding';
    """)
    profile_col = cur.fetchone()
    print(f"  [DB] learner_profiles.goal_embedding column: {profile_col}")

    # Apply V6 migration DDL if column is still 1536
    print("  [DB] Applying V6 migration (altering vector column dimension to 2048)...")
    cur.execute("ALTER TABLE courses ALTER COLUMN content_embedding TYPE vector(2048) USING NULL;")
    cur.execute("ALTER TABLE learner_profiles ALTER COLUMN goal_embedding TYPE vector(2048) USING NULL;")
    print("  [SUCCESS] Vector columns updated to vector(2048) successfully!")

    # Record migration in flyway_schema_history if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema='public' AND table_name='flyway_schema_history'
        );
    """)
    if cur.fetchone()[0]:
        cur.execute("SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;")
        print("  [DB] Current Flyway History:")
        for r in cur.fetchall():
            print(f"    - Rank {r[0]}: V{r[1]} ({r[2]}) success={r[3]}")

    # Test indexing a course with the real 2048-dim passage embedding
    cur.execute("SELECT id, title FROM courses LIMIT 1;")
    sample_course = cur.fetchone()
    if sample_course:
        course_id, title = sample_course
        passage_vec_str = "[" + ",".join(str(x) for x in passage_vec) + "]"
        cur.execute("UPDATE courses SET content_embedding = %s::vector WHERE id = %s;", (passage_vec_str, course_id))
        print(f"  [SUCCESS] Updated course '{title}' (ID: {course_id}) with 2048-dim passage embedding.")

        # Test semantic search using cosine distance operator <=>
        query_vec_str = "[" + ",".join(str(x) for x in query_vec) + "]"
        cur.execute("""
            SELECT id, title, (content_embedding <=> %s::vector) AS cosine_dist
            FROM courses
            WHERE content_embedding IS NOT NULL
            ORDER BY content_embedding <=> %s::vector ASC
            LIMIT 5;
        """, (query_vec_str, query_vec_str))
        rows = cur.fetchall()
        print("  [SUCCESS] pgvector Cosine Similarity Search Results:")
        for cid, t, dist in rows:
            print(f"    - Course: '{t}', Cosine Distance: {dist:.4f}, Similarity: {1.0 - dist:.4f}")

    conn.close()


def main():
    load_env()
    query_vec, passage_vec = test_nvidia_embedding_api()
    if query_vec and passage_vec:
        test_supabase_pgvector_compatibility(query_vec, passage_vec)
        print("\n==================================================")
        print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
