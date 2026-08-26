import urllib.request
import urllib.error
import json
import ssl
import time
import sys

ctx = ssl.create_default_context()

BASE_URL = "https://ai-powered-personalized-learning-path-do6n.onrender.com/api"

def request(path, method="GET", body=None, token=None):
    url = f"{BASE_URL}{path}"
    print(f"\n---> {method} {url}", flush=True)
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            status = resp.status
            res_data = resp.read().decode("utf-8")
            print(f"  [SUCCESS {status}]", flush=True)
            try:
                parsed = json.loads(res_data)
                print(f"  Body snippet: {json.dumps(parsed, indent=2)[:400]}...", flush=True)
                return status, parsed
            except Exception:
                print(f"  Raw: {res_data[:300]}", flush=True)
                return status, res_data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"  [HTTP ERROR {e.code}]: {err_body}", flush=True)
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body
    except Exception as e:
        print(f"  [EXCEPTION]: {e}", flush=True)
        return 0, str(e)

def main():
    # 1. Register a test user
    ts = int(time.time())
    email = f"prod_audit_user_{ts}@test.com"
    reg_body = {
        "email": email,
        "password": "Password123!",
        "fullName": f"Audit User {ts}"
    }
    print(f"1. Registering user {email}...", flush=True)
    status, reg_res = request("/auth/register", "POST", reg_body)
    
    if status not in (200, 201) or not isinstance(reg_res, dict) or "token" not in reg_res:
        print("Registration failed, trying login with existing user...", flush=True)
        status, login_res = request("/auth/login", "POST", {"email": "testuser123@gmail.com", "password": "Password123!"})
        if isinstance(login_res, dict) and "token" in login_res:
            token = login_res["token"]
        else:
            print("Login failed too. Exiting.", flush=True)
            return
    else:
        token = reg_res["token"]
    
    print(f"\nAcquired JWT Token: {token[:30]}...", flush=True)

    # 2. Get Profile
    print("\n2. Getting Profile /profile/me...", flush=True)
    request("/profile/me", "GET", token=token)

    # 3. Get Dashboard
    print("\n3. Getting Dashboard /progress/dashboard...", flush=True)
    st_dash, dash_res = request("/progress/dashboard", "GET", token=token)
    print(f"Dashboard status: {st_dash}", flush=True)

    # 4. Get Courses
    print("\n4. Getting Courses /courses...", flush=True)
    request("/courses?page=0&size=3", "GET", token=token)

    # 5. Generate Learning Path
    print("\n5. Generating Learning Path...", flush=True)
    gen_body = {
        "goalDescription": "Full Stack React and Spring Boot developer",
        "customPrompt": "Focus on modern REST APIs and React components"
    }
    st_path, path_res = request("/learning-paths/generate", "POST", body=gen_body, token=token)
    print(f"Path generation status: {st_path}", flush=True)

    # 6. Re-test Dashboard after generating path
    print("\n6. Re-testing Dashboard after path generation...", flush=True)
    request("/progress/dashboard", "GET", token=token)

if __name__ == "__main__":
    main()
