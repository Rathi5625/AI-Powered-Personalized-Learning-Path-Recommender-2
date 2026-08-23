"""One-off Supabase state check for PART 0 verification.
Reports course/video counts and how many rows carry a content_embedding.
Reads nothing from stdin; connection params inlined from backend/.env.
"""
import sys

try:
    import psycopg2
except ImportError:
    print("psycopg2 not installed", file=sys.stderr)
    sys.exit(2)

CONN = dict(
    host="aws-0-ap-southeast-1.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.qdcifgxwpzohrgfkiurg",
    password="@Parth@657825op@",
    sslmode="require",
    connect_timeout=15,
)

def main():
    conn = psycopg2.connect(**CONN)
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
