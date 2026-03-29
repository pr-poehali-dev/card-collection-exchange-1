import json
import os
import psycopg2

SCHEMA = "t_p3509775_card_collection_exch"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_id(cur, token: str):
    if not token:
        return None
    cur.execute(
        f"SELECT user_id FROM {SCHEMA}.sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """Управление коллекцией пользователя и статистика"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(cur, token)

    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    if method == "POST" and path.endswith("/add"):
        body = json.loads(event.get("body") or "{}")
        return add_card(cur, conn, user_id, body)

    return get_stats(cur, conn, user_id)


def get_stats(cur, conn, user_id: int) -> dict:
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.cards")
    total_cards = cur.fetchone()[0]

    cur.execute(
        f"""SELECT COUNT(*), COALESCE(SUM(c.value),0), COUNT(*) FILTER (WHERE uc.for_trade)
            FROM {SCHEMA}.user_cards uc
            JOIN {SCHEMA}.cards c ON c.id=uc.card_id
            WHERE uc.user_id=%s""",
        (user_id,)
    )
    owned, total_value, for_trade = cur.fetchone()

    cur.execute(
        f"""SELECT c.rarity, COUNT(*)
            FROM {SCHEMA}.user_cards uc
            JOIN {SCHEMA}.cards c ON c.id=uc.card_id
            WHERE uc.user_id=%s
            GROUP BY c.rarity""",
        (user_id,)
    )
    rarity_owned = {r[0]: r[1] for r in cur.fetchall()}

    cur.execute(
        f"SELECT rarity, COUNT(*) FROM {SCHEMA}.cards GROUP BY rarity"
    )
    rarity_total = {r[0]: r[1] for r in cur.fetchall()}

    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "owned": owned,
            "total": total_cards,
            "totalValue": int(total_value),
            "forTrade": for_trade,
            "rarityOwned": rarity_owned,
            "rarityTotal": rarity_total,
        })
    }


def add_card(cur, conn, user_id: int, body: dict) -> dict:
    card_id = body.get("card_id")
    if not card_id:
        conn.close()
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "card_id required"})}

    cur.execute(
        f"INSERT INTO {SCHEMA}.user_cards (user_id, card_id) VALUES (%s,%s) ON CONFLICT DO NOTHING RETURNING id",
        (user_id, card_id)
    )
    conn.commit()
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}
