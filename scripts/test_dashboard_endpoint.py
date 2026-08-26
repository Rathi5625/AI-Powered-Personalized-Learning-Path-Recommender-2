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
db_url = env.get("DB_URL", "").replace("jdbc:", "")
db_user = env.get("DB_USERNAME", "")
db_pass = env.get("DB_PASSWORD", "")

conn = psycopg2.connect(db_url, user=db_user, password=db_pass)
cur = conn.cursor()

# Test queries executed by ProgressService.getDashboard:
# 1. Profile query
print("Testing ProgressService queries for user 'parthrathi5625@gmail.com'...")
cur.execute("""
    SELECT p.id, p.experience_level, p.preferred_learning_style, p.career_goal, u.email 
    FROM learner_profiles p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.email = 'parthrathi5625@gmail.com';
""")
prof = cur.fetchone()
print(f"Profile: {prof}")
profile_id = prof[0]

# 2. Count completed milestones
cur.execute("""
    SELECT COUNT(*) FROM milestones m 
    JOIN learning_paths lp ON m.learning_path_id = lp.id 
    WHERE lp.learner_profile_id = %s AND m.status = 'COMPLETED';
""", (profile_id,))
print(f"Completed milestones count: {cur.fetchone()[0]}")

# 3. Count in_progress milestones
cur.execute("""
    SELECT COUNT(*) FROM milestones m 
    JOIN learning_paths lp ON m.learning_path_id = lp.id 
    WHERE lp.learner_profile_id = %s AND m.status = 'IN_PROGRESS';
""", (profile_id,))
print(f"In progress count: {cur.fetchone()[0]}")

# 4. Count total milestones
cur.execute("""
    SELECT COUNT(*) FROM milestones m 
    JOIN learning_paths lp ON m.learning_path_id = lp.id 
    WHERE lp.learner_profile_id = %s;
""", (profile_id,))
print(f"Total milestones: {cur.fetchone()[0]}")

# 5. findDistinctCompletedSkillsByProfileId
print("Testing findDistinctCompletedSkillsByProfileId...")
try:
    cur.execute("""
        SELECT DISTINCT s.name 
        FROM progress_logs pl 
        JOIN milestones m ON pl.milestone_id = m.id 
        JOIN courses c ON m.course_id = c.id 
        JOIN course_skills cs ON cs.course_id = c.id
        JOIN skills s ON cs.skill_id = s.id 
        WHERE pl.learner_profile_id = %s AND pl.event = 'COMPLETED';
    """, (profile_id,))
    print(f"Skills gained: {cur.fetchall()}")
except Exception as e:
    print(f"Error in progress_logs query: {e}")

# 6. Active learning paths query
print("Testing active learning paths query...")
cur.execute("""
    SELECT lp.id, lp.goal_description, lp.status, lp.generated_at 
    FROM learning_paths lp 
    WHERE lp.learner_profile_id = %s AND lp.status = 'ACTIVE' 
    ORDER BY lp.generated_at DESC;
""", (profile_id,))
paths = cur.fetchall()
print(f"Active paths: {paths}")

conn.close()
