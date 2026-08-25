"""Diagnostic script for database state check.
Reports course/video counts and how many rows carry a content_embedding.
Reads connection parameters from environment variables (DB_URL or DB_HOST/DB_USER/DB_PASSWORD)
or automatically parses backend/.env if available.
"""
import os
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("psycopg2 not installed. Run 'pip install psycopg2-binary' to use this script.", file=sys.stderr)
    sys.exit(2)


def load_env_file():
    """Load key-value pairs from backend/.env into os.environ if present."""
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


def get_connection():
    load_env_file()

    db_url = os.environ.get("DB_URL")
    if db_url:
        return psycopg2.connect(db_url)

    host = os.environ.get("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
    port = int(os.environ.get("DB_PORT", "5432"))
    dbname = os.environ.get("DB_NAME", "postgres")
    user = os.environ.get("DB_USERNAME", os.environ.get("DB_USER", "postgres.qdcifgxwpzohrgfkiurg"))
    password = os.environ.get("DB_PASSWORD")

    if not password:
        print("Error: DB_PASSWORD (or DB_URL) environment variable is not set.", file=sys.stderr)
        print("Please set DB_PASSWORD in your environment or in backend/.env", file=sys.stderr)
        sys.exit(1)

    return psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode=os.environ.get("DB_SSLMODE", "require"),
        connect_timeout=15,
    )


def main():
    conn = get_connection()
    cur = conn.cursor()

    # Does the courses table exist yet?
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema='public' AND table_name='courses'
        );
    """)
    if not cur.fetchone()[0]:
        print("TABLE courses: DOES NOT EXIST (backend has not migrated yet)")
        conn.close()
        return

    cur.execute("SELECT count(*) FROM courses;")
    total = cur.fetchone()[0]
    print(f"courses total rows: {total}")

    cur.execute("""
        SELECT resource_type, count(*),
               count(content_embedding) AS with_embedding
        FROM courses
        GROUP BY resource_type
        ORDER BY resource_type;
    """)
    print("by resource_type (type | rows | with_embedding):")
    for rt, cnt, emb in cur.fetchall():
        print(f"  {rt} | {cnt} | {emb}")

    cur.execute("SELECT count(*) FROM courses WHERE content_embedding IS NULL;")
    print(f"rows with NULL content_embedding: {cur.fetchone()[0]}")

    cur.execute("SELECT count(*) FROM skills;")
    print(f"skills total rows: {cur.fetchone()[0]}")

    # sample a couple titles per type
    cur.execute("""
        SELECT resource_type, title, platform
        FROM courses ORDER BY id LIMIT 6;
    """)
    print("sample rows:")
    for rt, title, plat in cur.fetchall():
        print(f"  [{rt}] {title!r} via {plat}")

    conn.close()


if __name__ == "__main__":
    main()
