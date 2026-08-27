import os
import urllib.request
import urllib.error
import json
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

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

# 1. Fetch all models from API
url = "https://integrate.api.nvidia.com/v1/models"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {llm_key}"})
resp = urllib.request.urlopen(req, context=ctx, timeout=15)
data = json.loads(resp.read().decode("utf-8"))
all_models = [m["id"] for m in data.get("data", [])]

def check_chat(m):
    req_body = json.dumps({
        "model": m,
        "messages": [{"role": "user", "content": "Return 'READY'."}],
        "max_tokens": 10
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            reply = data["choices"][0]["message"]["content"].strip()
            return m, True, 200, reply
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            detail = json.loads(body).get("detail", body[:60])
        except Exception:
            detail = body[:60]
        return m, False, e.code, detail
    except Exception as e:
        return m, False, 0, str(e)[:60]

def check_embed(m):
    req_body = json.dumps({
        "model": m,
        "input": ["test query"],
        "input_type": "query"
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/embeddings",
        data=req_body,
        headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            dim = len(data["data"][0]["embedding"])
            return m, True, 200, f"dim={dim}"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            detail = json.loads(body).get("detail", body[:60])
        except Exception:
            detail = body[:60]
        return m, False, e.code, detail
    except Exception as e:
        return m, False, 0, str(e)[:60]

print(f"Testing {len(all_models)} NVIDIA models concurrently...", flush=True)

chat_candidates = [m for m in all_models if not any(x in m for x in ["embed", "guard", "reward", "vision", "parse", "safety"])]
embed_candidates = [m for m in all_models if "embed" in m]

print(f"\n--- TESTING {len(chat_candidates)} CHAT CANDIDATES ---", flush=True)
with ThreadPoolExecutor(max_workers=15) as ex:
    futures = {ex.submit(check_chat, m): m for m in chat_candidates}
    for f in as_completed(futures):
        m, ok, code, msg = f.result()
        if ok:
            print(f"  [CHAT SUCCESS 200] {m} -> {msg}", flush=True)
        else:
            if code != 410: # Only print non-410 or interesting errors
                print(f"  [CHAT {code}] {m} -> {msg}", flush=True)

print(f"\n--- TESTING {len(embed_candidates)} EMBEDDING CANDIDATES ---", flush=True)
with ThreadPoolExecutor(max_workers=10) as ex:
    futures = {ex.submit(check_embed, m): m for m in embed_candidates}
    for f in as_completed(futures):
        m, ok, code, msg = f.result()
        if ok:
            print(f"  [EMBED SUCCESS 200] {m} -> {msg}", flush=True)
        else:
            print(f"  [EMBED {code}] {m} -> {msg}", flush=True)
