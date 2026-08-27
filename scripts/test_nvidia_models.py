import os
import urllib.request
import urllib.error
import json
import ssl
import sys

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

def test_models_list(key, label):
    print(f"\n--- Testing GET /v1/models with {label} ---", flush=True)
    url = "https://integrate.api.nvidia.com/v1/models"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = [m["id"] for m in data.get("data", [])]
            print(f"  [SUCCESS] Found {len(models)} models:", flush=True)
            for m in sorted(models):
                if any(x in m for x in ["llama", "embed", "nemotron", "mistral", "qwen", "deepseek"]):
                    print(f"    - {m}", flush=True)
            return models
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [ERROR]: {e}", flush=True)
    return []

def test_embedding(key, label, model):
    print(f"\n--- Testing Embedding ({model}) with {label} ---", flush=True)
    url = "https://integrate.api.nvidia.com/v1/embeddings"
    body = json.dumps({"model": model, "input": ["test query"], "input_type": "query"}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            vec = data["data"][0]["embedding"]
            print(f"  [SUCCESS] Status {resp.status}, Dimension: {len(vec)}", flush=True)
            return True, len(vec)
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [ERROR]: {e}", flush=True)
    return False, 0

def test_chat(key, label, model):
    print(f"\n--- Testing Chat Completion ({model}) with {label} ---", flush=True)
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "Hello! Reply with only 'OK'."}],
        "temperature": 0.2,
        "max_tokens": 10
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            reply = data["choices"][0]["message"]["content"]
            print(f"  [SUCCESS] Status {resp.status}, Reply: {reply.strip()}", flush=True)
            return True
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [ERROR]: {e}", flush=True)
    return False

def main():
    print("Testing NVIDIA NIM API connectivity...", flush=True)
    # Test models list with both keys
    models_llm = test_models_list(llm_key, "LLM_API_KEY")
    models_emb = test_models_list(emb_key, "EMBEDDING_API_KEY")
    
    # Test embeddings
    test_embedding(emb_key, "EMBEDDING_API_KEY", "nvidia/nemotron-3-embed-1b")
    test_embedding(llm_key, "LLM_API_KEY", "nvidia/nemotron-3-embed-1b")

    # Candidate chat models to test
    candidates = [
        "meta/llama-3.1-8b-instruct",
        "meta/llama-3.3-70b-instruct",
        "meta/llama-3.1-70b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "mistralai/mistral-7b-instruct-v0.3",
        "qwen/qwen2.5-coder-32b-instruct",
        "meta/llama-3.2-3b-instruct",
        "meta/llama-3.2-1b-instruct"
    ]
    
    for c in candidates:
        test_chat(llm_key, "LLM_API_KEY", c)

if __name__ == "__main__":
    main()
