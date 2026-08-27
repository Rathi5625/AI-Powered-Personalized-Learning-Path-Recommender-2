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
emb_key = env.get("EMBEDDING_API_KEY", "")

def test_chat_model(model_name):
    print(f"\n==========================================", flush=True)
    print(f"Testing Chat Model: {model_name}", flush=True)
    prompt = """
    You are an educational assistant. Output a valid JSON array of explanations for these 2 steps:
    1. Java Basics
    2. Spring Boot Core
    Format:
    [
      {"step": 1, "explanation": "Learn fundamentals"},
      {"step": 2, "explanation": "Learn dependency injection"}
    ]
    Return ONLY valid JSON.
    """
    req_body = json.dumps({
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful educational AI assistant. Always output valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 500
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
            print(f"  [SUCCESS 200] Response from {model_name}:", flush=True)
            print(content[:300] + "...", flush=True)
            return True
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
    except Exception as e:
        print(f"  [ERROR]: {e}", flush=True)
    return False

def test_embed_model(model_name, key, label):
    print(f"\n==========================================", flush=True)
    print(f"Testing Embed Model: {model_name} with {label}", flush=True)
    for inp_type in ["query", "passage"]:
        req_body = json.dumps({
            "model": model_name,
            "input": ["Full Stack Developer with Spring Boot and React"],
            "input_type": inp_type
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://integrate.api.nvidia.com/v1/embeddings",
            data=req_body,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                dim = len(data["data"][0]["embedding"])
                print(f"  [SUCCESS 200] input_type={inp_type} -> Dimension={dim}", flush=True)
        except urllib.error.HTTPError as e:
            print(f"  [HTTP ERROR {e.code}]: {e.read().decode('utf-8')}", flush=True)
        except Exception as e:
            print(f"  [ERROR]: {e}", flush=True)

def main():
    print("--- 1. TESTING EMBEDDINGS ---", flush=True)
    test_embed_model("nvidia/nemotron-3-embed-1b", llm_key, "LLM_API_KEY")
    test_embed_model("nvidia/llama-nemotron-embed-vl-1b-v2", llm_key, "LLM_API_KEY")

    print("\n--- 2. TESTING CHAT COMPLETIONS ---", flush=True)
    chat_candidates = [
        "nvidia/nemotron-3-nano-30b-a3b",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "nvidia/nemotron-3-super-120b-a12b",
        "nvidia/nemotron-3-ultra-550b-a55b"
    ]
    for c in chat_candidates:
        test_chat_model(c)

if __name__ == "__main__":
    main()
