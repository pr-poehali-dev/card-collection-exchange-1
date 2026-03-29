import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2

SCHEMA = "t_p3509775_card_collection_exch"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def handler(event: dict, context) -> dict:
    """Регистрация, вход и выход пользователей"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")

    token = event.get("headers", {}).get("X-Session-Token", "")

    if path.endswith("/register"):
        return register(body)
    if path.endswith("/login"):
        return login(body)
    if path.endswith("/logout"):
        return logout(token)

    return get_me(token)


def register(body: dict) -> dict:
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not username or not email or not password:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
    if len(password) < 6:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email=%s OR username=%s", (email, username))
    if cur.fetchone():
        conn.close()
        return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email или имя уже используется"})}

    pw_hash = hash_password(password)
    cur.execute(
        f"INSERT INTO {SCHEMA}.users (username, email, password_hash) VALUES (%s,%s,%s) RETURNING id",
        (username, email, pw_hash)
    )
    user_id = cur.fetchone()[0]

    token = make_token()
    expires = datetime.now() + timedelta(days=30)
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s,%s,%s)",
        (user_id, token, expires)
    )
    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"token": token, "user": {"id": user_id, "username": username, "email": email}})
    }


def login(body: dict) -> dict:
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, username, email FROM {SCHEMA}.users WHERE email=%s AND password_hash=%s",
        (email, hash_password(password))
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}

    user_id, username, user_email = row
    token = make_token()
    expires = datetime.now() + timedelta(days=30)
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s,%s,%s)",
        (user_id, token, expires)
    )
    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"token": token, "user": {"id": user_id, "username": username, "email": user_email}})
    }


def get_me(token: str) -> dict:
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.username, u.email FROM {SCHEMA}.users u
            JOIN {SCHEMA}.sessions s ON s.user_id = u.id
            WHERE s.token=%s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

    user_id, username, email = row
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"user": {"id": user_id, "username": username, "email": email}})
    }


def logout(token: str) -> dict:
    if token:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
        conn.commit()
        conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}