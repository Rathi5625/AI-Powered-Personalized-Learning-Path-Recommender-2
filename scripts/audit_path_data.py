import os
import psycopg2
import json

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

print("--- 1. Checking learning_paths table ---")
cur.execute("SELECT id, learner_profile_id, goal_description, status, created_at FROM learning_paths")
paths = cur.fetchall()
print(f"Total learning_paths: {len(paths)}")
for p in paths:
    print(f"  Path ID: {p[0]} | Profile: {p[1]} | Goal: {p[2]} | Status: {p[3]} | Created: {p[4]}")

target_id = "d08e66b7-bb41-4704-942f-fa0986df5552"
print(f"\n--- 2. Checking specific path {target_id} ---")
cur.execute("SELECT * FROM learning_paths WHERE id = %s", (target_id,))
target_path = cur.fetchall()
print(f"Found target path: {target_path}")

print("\n--- 3. Checking milestones table ---")
cur.execute("SELECT id, learning_path_id, course_id, sequence_order, status, explanation FROM milestones")
milestones = cur.fetchall()
print(f"Total milestones: {len(milestones)}")
for m in milestones:
    print(f"  Milestone ID: {m[0]} | Path ID: {m[1]} | Course ID: {m[2]} | Step: {m[3]} | Status: {m[4]} | Explanation: {m[5][:40] if m[5] else 'None'}")

# Group milestones by learning_path_id
cur.execute("""
    SELECT lp.id, lp.goal_description, count(m.id) 
    FROM learning_paths lp 
    LEFT JOIN milestones m ON lp.id = m.learning_path_id 
    GROUP BY lp.id, lp.goal_description
""")
grouped = cur.fetchall()
print("\n--- 4. Milestones count per Learning Path ---")
for g in grouped:
    print(f"  Path: {g[0]} | Goal: '{g[1]}' | Milestones Count: {g[2]}")

cur.close()
conn.close()
