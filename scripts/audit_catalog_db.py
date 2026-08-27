import os
import psycopg2

def load_env(path):
    env = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

env = load_env("backend/.env")
db_user = env.get("DB_USERNAME", "")
db_pass = env.get("DB_PASSWORD", "")

conn = psycopg2.connect(
    host="aws-0-ap-southeast-1.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user=db_user,
    password=db_pass,
    sslmode="require"
)
cur = conn.cursor()

print("=== 1. All Tables in Public Schema ===")
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

for t in tables:
    cur.execute(f"SELECT count(*) FROM {t}")
    cnt = cur.fetchone()[0]
    print(f"  Table: {t:30} -> Count: {cnt}")

print("\n=== 2. Columns of 'courses' Table ===")
cur.execute("""
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'courses';
""")
for c in cur.fetchall():
    print(f"  {c[0]:25} {c[1]:15} ({c[2]})")

print("\n=== 3. Distinct resource_type in 'courses' ===")
cur.execute("SELECT resource_type, count(*) FROM courses GROUP BY resource_type")
for r in cur.fetchall():
    print(f"  resource_type: '{r[0]}' -> count: {r[1]}")

print("\n=== 4. Distinct platform in 'courses' ===")
cur.execute("SELECT platform, count(*) FROM courses GROUP BY platform ORDER BY count(*) DESC")
for r in cur.fetchall():
    print(f"  platform: '{r[0]}' -> count: {r[1]}")

print("\n=== 5. Distinct level in 'courses' ===")
cur.execute("SELECT level, count(*) FROM courses GROUP BY level")
for r in cur.fetchall():
    print(f"  level: '{r[0]}' -> count: {r[1]}")

print("\n=== 6. Sample records from courses (including any youtube/video links) ===")
cur.execute("""
    SELECT id, title, platform, resource_type, level, link 
    FROM courses 
    WHERE link ILIKE '%youtube%' OR link ILIKE '%youtu.be%' OR platform ILIKE '%youtube%' OR resource_type ILIKE '%video%' OR resource_type ILIKE '%youtube%'
    LIMIT 10;
""")
sample_videos = cur.fetchall()
print(f"Found {len(sample_videos)} sample video rows:")
for s in sample_videos:
    print("  ", s)

cur.execute("""
    SELECT count(*) 
    FROM courses 
    WHERE link ILIKE '%youtube%' OR link ILIKE '%youtu.be%' OR platform ILIKE '%youtube%';
""")
yt_link_count = cur.fetchone()[0]
print(f"\nTotal courses with YouTube links or YouTube platform: {yt_link_count}")

cur.close()
conn.close()
