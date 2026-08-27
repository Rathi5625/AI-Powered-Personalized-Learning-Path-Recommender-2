import psycopg2
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

print("=== VERIFYING SUPABASE CATALOG DATASETS ===")

# 1. Total count
cur.execute("SELECT count(*) FROM courses")
total = cur.fetchone()[0]
print(f"Total courses/resources: {total}")

# 2. Resource types
cur.execute("SELECT resource_type, count(*) FROM courses GROUP BY resource_type")
for r in cur.fetchall():
    print(f"  Resource Type: {r[0]:10} -> Count: {r[1]}")

# 3. Level breakdown for VIDEO
cur.execute("SELECT level, count(*) FROM courses WHERE resource_type = 'VIDEO' GROUP BY level")
print("\nVIDEO breakdown by level:")
for r in cur.fetchall():
    print(f"  Level: {r[0]:10} -> Count: {r[1]}")

# 4. Level breakdown for COURSE
cur.execute("SELECT level, count(*) FROM courses WHERE resource_type = 'COURSE' GROUP BY level")
print("\nCOURSE breakdown by level:")
for r in cur.fetchall():
    print(f"  Level: {r[0]:10} -> Count: {r[1]}")

# 5. Check YouTube videos details
cur.execute("SELECT id, title, platform, link, duration_hours, level FROM courses WHERE resource_type = 'VIDEO' LIMIT 5")
print("\nSample YouTube videos:")
for r in cur.fetchall():
    print(f"  ID: {r[0]} | Title: {r[1]} | Platform: {r[2]} | Level: {r[5]} | Link: {r[3]}")

cur.close()
conn.close()
