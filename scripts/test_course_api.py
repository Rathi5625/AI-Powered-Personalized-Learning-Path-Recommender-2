import urllib.request
import urllib.error
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://ai-powered-personalized-learning-path-do6n.onrender.com/api"

# 1. Login to get JWT
login_url = BASE_URL + "/auth/login"
login_payload = json.dumps({
    "email": "testuser123@gmail.com",
    "password": "Password123!"
}).encode("utf-8")

req = urllib.request.Request(
    login_url,
    data=login_payload,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
)
with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
    login_data = json.loads(resp.read().decode("utf-8"))
    token = login_data.get("token")
    print(f"Logged in successfully! Token: {token[:20]}...")

auth_headers = {
    "Authorization": f"Bearer {token}",
    "User-Agent": "Mozilla/5.0"
}

endpoints = [
    "/courses",
    "/courses?resourceType=VIDEO",
    "/courses?resourceType=COURSE",
    "/courses?level=BEGINNER",
    "/courses?resourceType=VIDEO&level=BEGINNER",
    "/courses?resourceType=VIDEO&level=EASY",
    "/courses?resourceType=VIDEO&level=MEDIUM",
    "/courses?resourceType=VIDEO&level=HIGH",
    "/courses?page=0&size=12",
    "/courses?resourceType=VIDEO&page=0&size=12",
    "/courses/search?query=react&limit=5",
]

for ep in endpoints:
    url = BASE_URL + ep
    print(f"\n--- Testing GET {url} ---")
    try:
        req = urllib.request.Request(url, headers=auth_headers)
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, dict) and "content" in data:
                print(f"  Status: {resp.status} | totalElements: {data.get('totalElements')} | totalPages: {data.get('totalPages')} | content length: {len(data.get('content', []))}")
                for sample in data.get("content", [])[:3]:
                    print(f"    - '{sample.get('title')}' | type='{sample.get('resourceType')}' | level='{sample.get('level')}' | platform='{sample.get('platform')}'")
            elif isinstance(data, list):
                print(f"  Status: {resp.status} | List count: {len(data)}")
                for sample in data[:3]:
                    print(f"    - '{sample.get('title')}' | type='{sample.get('resourceType')}'")
            else:
                print(f"  Status: {resp.status} | Data: {data}")
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"  Error: {e}")
