import os
import urllib.request
import urllib.error
import json
import ssl
import time

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

def test_chat(model):
    print(f"\n---> Testing Chat: {model}...", flush=True)
    t0 = time.time()
    req_body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a specialized AI mentor in software engineering and computer science."},
            {"role": "user", "content": "Explain what a REST API is in 2 concise sentences."}
        ],
        "temperature": 0.2,
        "max_tokens": 150
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            dt = round(time.time() - t0, 2)
            print(f"  [SUCCESS 200] in {dt}s:\n{content.strip()}", flush=True)
            return True
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [EXCEPTION]: {e}", flush=True)
    return False

def test_embed(model, inp_type):
    print(f"\n---> Testing Embedding: {model} (input_type={inp_type})...", flush=True)
    t0 = time.time()
    req_body = json.dumps({
        "model": model,
        "input": ["Full Stack Web Development with Spring Boot and React"],
        "input_type": inp_type
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/embeddings",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            dim = len(data["data"][0]["embedding"])
            dt = round(time.time() - t0, 2)
            print(f"  [SUCCESS 200] in {dt}s, Dimension: {dim}", flush=True)
            return True
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [EXCEPTION]: {e}", flush=True)
    return False

def main():
    print("=== TESTING CHOSEN ACTIVE NVIDIA NIM MODELS ===", flush=True)
    test_chat("nvidia/nemotron-3-nano-30b-a3b")
    test_chat("nvidia/nemotron-3-super-120b-a12b")
    test_embed("nvidia/llama-nemotron-embed-vl-1b-v2", "query")
    test_embed("nvidia/llama-nemotron-embed-vl-1b-v2", "passage")

if __name__ == "__main__":
    main()
