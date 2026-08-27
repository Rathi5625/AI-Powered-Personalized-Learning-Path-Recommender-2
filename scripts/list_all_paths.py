import psycopg2
import os

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

cur.execute("SELECT id, goal_description, status, created_at FROM learning_paths ORDER BY created_at DESC")
for r in cur.fetchall():
    print(f"ID: {r[0]} | Goal: '{r[1]}' | Status: {r[2]} | Created: {r[3]}")

cur.close()
conn.close()
