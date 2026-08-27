import os
import urllib.request
import urllib.error
import json
import ssl
import time
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

def test_request(label, payload):
    print(f"\n--- Testing: {label} ---", flush=True)
    t0 = time.time()
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            dt = time.time() - t0
            data = json.loads(resp.read().decode("utf-8"))
            usage = data.get("usage", {})
            choice = data["choices"][0]
            content = choice["message"]["content"]
            print(f"  [SUCCESS 200] in {dt:.2f}s", flush=True)
            print(f"  Tokens: prompt={usage.get('prompt_tokens')}, completion={usage.get('completion_tokens')}, total={usage.get('total_tokens')}", flush=True)
            print(f"  Response Preview ({len(content)} chars):\n{content[:200]}...", flush=True)
            return dt, True
    except urllib.error.HTTPError as e:
        dt = time.time() - t0
        print(f"  [HTTP ERROR {e.code}] in {dt:.2f}s: {e.read().decode('utf-8')}", flush=True)
        return dt, False
    except Exception as e:
        dt = time.time() - t0
        print(f"  [EXCEPTION] in {dt:.2f}s: {e}", flush=True)
        return dt, False

def main():
    # Prompt mimicking MentorService
    system_prompt = """
    You are an expert AI Career and Study Mentor for software engineers and technology learners.
    Learner Context:
    - Experience Level: BEGINNER
    - Career Goal: Full Stack Web Development
    - Preferred Learning Style: VIDEO
    - Interests: Java, Spring Boot, React
    Provide personalized guidance on roadmaps, learning strategies, interview preparation.
    Be inspiring, practical, concise, and actionable. Keep responses concise (3-4 paragraphs max).
    """
    user_prompt = "User: How do I get started with Spring Boot as a beginner?\nAssistant:"

    # Test 1: EXACT payload that OpenAiCompatibleLlmClient currently sends (NO max_tokens!)
    payload_current = {
        "model": LLM_MODEL,
        "temperature": 0.3,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    test_request("Current Backend Payload (WITHOUT max_tokens)", payload_current)

    # Test 2: Payload WITH max_tokens: 500
    payload_with_max_tokens = {
        "model": LLM_MODEL,
        "temperature": 0.3,
        "max_tokens": 500,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    test_request("Payload WITH max_tokens: 500", payload_with_max_tokens)

    # Test 3: Payload WITH max_tokens: 800 & top_p: 0.95
    payload_with_top_p = {
        "model": LLM_MODEL,
        "temperature": 0.3,
        "top_p": 0.95,
        "max_tokens": 800,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    test_request("Payload WITH max_tokens: 800 & top_p: 0.95", payload_with_top_p)

if __name__ == "__main__":
    main()
