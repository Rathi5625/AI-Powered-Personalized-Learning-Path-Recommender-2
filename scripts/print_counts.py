import psycopg2, os
from audit_catalog_db import load_env

env = load_env("backend/.env")
conn = psycopg2.connect(
    host="aws-0-ap-southeast-1.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user=env["DB_USERNAME"],
    password=env["DB_PASSWORD"],
    sslmode="require"
)
cur = conn.cursor()
cur.execute("SELECT count(*) FROM courses")
total = cur.fetchone()[0]
print(f"Total records in 'courses' table: {total}")

cur.execute("SELECT resource_type, count(*) FROM courses GROUP BY resource_type")
for r in cur.fetchall():
    print(f"  resource_type: {r[0]} -> {r[1]}")

cur.execute("SELECT count(*) FROM skills")
print(f"Total records in 'skills' table: {cur.fetchone()[0]}")

cur.execute("SELECT count(*) FROM course_skills")
print(f"Total records in 'course_skills' table: {cur.fetchone()[0]}")

cur.close()
conn.close()
