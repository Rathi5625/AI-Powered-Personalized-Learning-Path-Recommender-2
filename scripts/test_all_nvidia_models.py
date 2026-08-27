import os
import urllib.request
import urllib.error
import json
import ssl

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

# 1. Fetch all models
url = "https://integrate.api.nvidia.com/v1/models"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {llm_key}"})
resp = urllib.request.urlopen(req, context=ctx, timeout=15)
data = json.loads(resp.read().decode("utf-8"))
all_models = [m["id"] for m in data.get("data", [])]

print(f"Total models available: {len(all_models)}", flush=True)

# Test chat models
working_chat = []
for m in all_models:
    # Skip embedding / vision / guard models for chat test
    if any(x in m for x in ["embed", "guard", "reward", "vision", "parse", "safety"]):
        continue
    req_body = json.dumps({
        "model": m,
        "messages": [{"role": "user", "content": "Reply with 'YES' only."}],
        "max_tokens": 10
    }).encode("utf-8")
    req = urllib.request.Request("https://integrate.api.nvidia.com/v1/chat/completions", data=req_body, headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as chat_resp:
            res = json.loads(chat_resp.read().decode("utf-8"))
            reply = res["choices"][0]["message"]["content"].strip()
            print(f"  [CHAT 200 OK] {m} -> {reply}", flush=True)
            working_chat.append(m)
    except urllib.error.HTTPError as e:
        # print first 50 chars of error
        err = e.read().decode("utf-8")[:100]
        # print(f"  [CHAT {e.code}] {m}: {err}", flush=True)
    except Exception as e:
        pass

print("\n=== WORKING CHAT MODELS ===", flush=True)
for m in working_chat:
    print(f"  -> {m}", flush=True)

# Test embedding models
working_embed = []
for m in all_models:
    if "embed" not in m:
        continue
    for inp_type in ["query", "passage"]:
        req_body = json.dumps({
            "model": m,
            "input": ["testing embedding generation"],
            "input_type": inp_type
        }).encode("utf-8")
        req = urllib.request.Request("https://integrate.api.nvidia.com/v1/embeddings", data=req_body, headers={"Authorization": f"Bearer {llm_key}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=20) as emb_resp:
                res = json.loads(emb_resp.read().decode("utf-8"))
                dim = len(res["data"][0]["embedding"])
                print(f"  [EMBED 200 OK] {m} (input_type={inp_type}) -> Dimension: {dim}", flush=True)
                if (m, dim) not in working_embed:
                    working_embed.append((m, dim))
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")[:100]
            print(f"  [EMBED {e.code}] {m} (input_type={inp_type}): {err}", flush=True)
        except Exception as e:
            print(f"  [EMBED EXCEPTION] {m}: {e}", flush=True)

print("\n=== WORKING EMBEDDING MODELS ===", flush=True)
for m, dim in working_embed:
    print(f"  -> {m} (dim={dim})", flush=True)
