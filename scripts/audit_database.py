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

db_url = env.get("DB_URL", "")
db_user = env.get("DB_USERNAME", "")
db_pass = env.get("DB_PASSWORD", "")

clean_url = db_url.replace("jdbc:", "")

def main():
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(
        clean_url,
        user=db_user,
        password=db_pass
    )
    cur = conn.cursor()
    print("Connected successfully!")

    # 1. Check Flyway migrations
    print("\n--- 1. FLYWAY SCHEMA HISTORY ---")
    try:
        cur.execute("SELECT installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success FROM flyway_schema_history ORDER BY installed_rank")
        rows = cur.fetchall()
        for r in rows:
            print(f"Rank {r[0]}: v{r[1]} ({r[2]}) script={r[4]} success={r[9]} installed_on={r[7]}")
    except Exception as e:
        print(f"Error querying flyway_schema_history: {e}")
        conn.rollback()

    # 2. Check all tables
    print("\n--- 2. ALL DATABASE TABLES ---")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [t[0] for t in cur.fetchall()]
    print(f"Total public tables ({len(tables)}): {', '.join(tables)}")

    # 3. Row counts for all tables
    print("\n--- 3. TABLE ROW COUNTS ---")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM \"{t}\";")
        cnt = cur.fetchone()[0]
        print(f"  {t}: {cnt} rows")

    # 4. Check users & profiles
    print("\n--- 4. USERS & PROFILES ---")
    cur.execute("SELECT id, email, full_name, role, created_at FROM users;")
    users = cur.fetchall()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"  User id={u[0]}, email={u[1]}, name={u[2]}, role={u[3]}")
        cur.execute("SELECT id, experience_level, preferred_learning_style, career_goal, goal_embedding IS NOT NULL FROM learner_profiles WHERE user_id = %s;", (u[0],))
        profs = cur.fetchall()
        if not profs:
            print(f"    ⚠️ WARNING: NO LEARNER PROFILE FOUND FOR USER {u[1]}!")
        else:
            for p in profs:
                print(f"    Profile id={p[0]}, level={p[1]}, style={p[2]}, goal={p[3]}, has_goal_embedding={p[4]}")

    # 5. Check schema of assessment tables
    print("\n--- 5. ASSESSMENT SCHEMA ---")
    for t in ["assessments", "assessment_questions", "assessment_attempts"]:
        if t in tables:
            cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}';")
            cols = cur.fetchall()
            print(f"Columns for {t}: {cols}")

    conn.close()

if __name__ == "__main__":
    main()
