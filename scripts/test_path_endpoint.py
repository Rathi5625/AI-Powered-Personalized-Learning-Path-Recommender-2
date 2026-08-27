import os
import urllib.request
import urllib.error
import json
import ssl
import psycopg2

ctx = ssl.create_default_context()

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

# Find users who own paths
cur.execute("""
    SELECT u.id, u.email, lp.id, lp.goal_description 
    FROM users u 
    JOIN learner_profiles p ON u.id = p.user_id 
    JOIN learning_paths lp ON p.id = lp.learner_profile_id
""")
user_paths = cur.fetchall()
print("Found user learning paths:")
for up in user_paths:
    print(f"  User: {up[1]} | Path ID: {up[2]} | Goal: '{up[3]}'")

cur.close()
conn.close()
