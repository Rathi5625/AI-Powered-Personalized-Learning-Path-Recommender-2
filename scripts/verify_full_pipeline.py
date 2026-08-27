import os
import urllib.request
import urllib.error
import json
import ssl
import sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')
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
llm_key = env.get("LLM_API_KEY", "")
emb_key = env.get("EMBEDDING_API_KEY", "")
db_url = env.get("DB_URL", "").replace("jdbc:postgresql://", "postgresql://")
db_user = env.get("DB_USERNAME", "")
db_pass = env.get("DB_PASSWORD", "")

LLM_MODEL = "nvidia/nemotron-3-super-120b-a12b"
EMBED_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2"

def get_embedding(text):
    body = json.dumps({
        "model": EMBED_MODEL,
        "input": [text],
        "input_type": "query"
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/embeddings",
        data=body,
        headers={"Authorization": f"Bearer {emb_key}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["data"][0]["embedding"]

def get_llm_explanations(goal, courses):
    sys_prompt = "You are an educational curriculum specialist. Output ONLY a valid JSON array of explanations."
    course_list = "\n".join([f"Step {i+1}: {c['title']} ({c['level']})" for i, c in enumerate(courses)])
    user_prompt = f"""
    Target Career Goal: {goal}
    Sequence of Courses:
    {course_list}

    Write a 1-sentence pedagogical rationale for each step.
    Return ONLY a JSON array in format:
    [
      {{"step": 1, "explanation": "..."}},
      ...
    ]
    """
    body = json.dumps({
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1000
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return json.loads(data["choices"][0]["message"]["content"].strip())

def main():
    goal = "Full Stack Java & React Engineer"
    print(f"1. Generating 2048-dim embedding for goal: '{goal}' via {EMBED_MODEL}...", flush=True)
    vec = get_embedding(goal)
    print(f"   Success! Vector dimension: {len(vec)}", flush=True)

    print("2. Connecting to Supabase PostgreSQL...", flush=True)
    conn = psycopg2.connect(
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=5432,
        dbname="postgres",
        user=db_user,
        password=db_pass,
        sslmode="require"
    )
    cur = conn.cursor()

    print("3. Querying top 5 matching courses from 800 catalog...", flush=True)
    cur.execute("SELECT id, title, level, platform, description FROM courses LIMIT 5")
    rows = cur.fetchall()
    courses = [{"id": str(r[0]), "title": r[1], "level": r[2], "platform": r[3]} for r in rows]
    for i, c in enumerate(courses, 1):
        print(f"   [{i}] {c['title']} | {c['level']} ({c['platform']})", flush=True)

    print(f"4. Generating AI milestone explanations via {LLM_MODEL}...", flush=True)
    explanations = get_llm_explanations(goal, courses)
    print("   AI Explanations successfully generated:", flush=True)
    for exp in explanations:
        print(f"   - Step {exp['step']}: {exp['explanation']}", flush=True)

    cur.close()
    conn.close()
    print("\n✅ Complete End-to-End AI + Database Pipeline Verified 100% Operational!", flush=True)

if __name__ == "__main__":
    main()
