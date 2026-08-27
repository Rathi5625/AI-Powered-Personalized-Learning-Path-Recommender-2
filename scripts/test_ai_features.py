import os
import urllib.request
import urllib.error
import json
import ssl
import sys

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

LLM_MODEL = "nvidia/nemotron-3-super-120b-a12b"
EMBED_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2"

def call_llm(system_prompt, user_prompt, max_tokens=1000):
    req_body = json.dumps({
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": max_tokens
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()

def call_embed(text, inp_type="query"):
    req_body = json.dumps({
        "model": EMBED_MODEL,
        "input": [text],
        "input_type": inp_type
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/embeddings",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["data"][0]["embedding"]

def main():
    print("=== 1. TESTING EMBEDDING ===", flush=True)
    vec = call_embed("Full Stack React and Spring Boot Developer", "query")
    print(f"  Embedding dimension: {len(vec)} (Expected: 2048)", flush=True)

    print("\n=== 2. TESTING LEARNING PATH EXPLANATIONS PROMPT ===", flush=True)
    system_prompt = "You are an expert educational counselor. Output valid JSON array with milestone explanations."
    user_prompt = """
    A learner wants to achieve: "Full Stack React & Spring Boot Developer".
    Here is the sequence of recommended courses:
    Step 1: Java Programming Masterclass
    Step 2: Spring Boot 3 Core & REST APIs
    Step 3: React 18 Fundamentals

    For EACH step, write a 1-2 sentence pedagogical explanation.
    Return ONLY a JSON array in format:
    [
      {"step": 1, "explanation": "..."},
      {"step": 2, "explanation": "..."},
      {"step": 3, "explanation": "..."}
    ]
    """
    res = call_llm(system_prompt, user_prompt)
    print("Response:\n" + res, flush=True)

    print("\n=== 3. TESTING AI MENTOR PROMPT ===", flush=True)
    sys_mentor = "You are AetherPath AI Mentor, a supportive computer science tutor. Keep answers concise."
    user_mentor = "I'm working on Spring Boot milestone. What is the difference between @Component and @Service?"
    reply = call_llm(sys_mentor, user_mentor, max_tokens=200)
    print("Mentor Reply:\n" + reply, flush=True)

    print("\n=== 4. TESTING ASSESSMENT GENERATION PROMPT ===", flush=True)
    sys_quiz = "You are an automated assessment generator. Output ONLY a valid JSON array of 2 multiple choice questions."
    user_quiz = """
    Generate 2 multiple choice questions for topic "Spring Boot REST APIs" at BEGINNER level.
    Format:
    [
      {
        "promptText": "What annotation marks a Spring REST controller?",
        "options": ["@RestController", "@Controller", "@Service", "@Component"],
        "correctOptionIndex": 0,
        "explanation": "@RestController combines @Controller and @ResponseBody."
      }
    ]
    """
    quiz_res = call_llm(sys_quiz, user_quiz)
    print("Quiz JSON:\n" + quiz_res, flush=True)

if __name__ == "__main__":
    main()
