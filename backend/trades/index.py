import json
import os
import psycopg2

SCHEMA = "t_p3509775_card_collection_exch"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
    """Управление предложениями обмена карточками"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(cur, token)

    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    if method == "GET":
        return get_trades(cur, conn, user_id)
    if method == "POST" and path.endswith("/create"):
        return create_trade(cur, conn, user_id, body)
    if method == "PUT" and path.endswith("/respond"):
        return respond_trade(cur, conn, user_id, body)

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}


def get_trades(cur, conn, user_id: int) -> dict:
    cur.execute(
        f"""SELECT
              t.id, t.status, t.created_at,
              u.username as from_username,
              oc.name as offered_name, oc.rarity as offered_rarity,
              wc.name as wanted_name, wc.rarity as wanted_rarity,
              t.from_user_id
            FROM {SCHEMA}.trade_offers t
            JOIN {SCHEMA}.users u ON u.id = t.from_user_id
            JOIN {SCHEMA}.cards oc ON oc.id = t.offered_card_id
            JOIN {SCHEMA}.cards wc ON wc.id = t.wanted_card_id
            WHERE (t.to_user_id=%s OR t.from_user_id=%s)
              AND t.status='pending'
            ORDER BY t.created_at DESC""",
        (user_id, user_id)
    )
    rows = cur.fetchall()
    conn.close()

    incoming = []
    outgoing = []
    for r in rows:
        item = {
            "id": r[0], "status": r[1],
            "from_username": r[3],
            "offered_card": r[4], "offered_rarity": r[5],
            "wanted_card": r[6], "wanted_rarity": r[7],
        }
        if r[8] == user_id:
            outgoing.append(item)
        else:
            incoming.append(item)

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"incoming": incoming, "outgoing": outgoing})
    }


def create_trade(cur, conn, user_id: int, body: dict) -> dict:
    offered_card_id = body.get("offered_card_id")
    wanted_card_id = body.get("wanted_card_id")
    to_user_id = body.get("to_user_id")

    cur.execute(
        f"SELECT id FROM {SCHEMA}.user_cards WHERE user_id=%s AND card_id=%s",
        (user_id, offered_card_id)
    )
    if not cur.fetchone():
        conn.close()
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "У вас нет этой карточки"})}

    cur.execute(
        f"""INSERT INTO {SCHEMA}.trade_offers
            (from_user_id, to_user_id, offered_card_id, wanted_card_id)
            VALUES (%s,%s,%s,%s) RETURNING id""",
        (user_id, to_user_id, offered_card_id, wanted_card_id)
    )
    trade_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": trade_id})}


def respond_trade(cur, conn, user_id: int, body: dict) -> dict:
    trade_id = body.get("trade_id")
    action = body.get("action")

    cur.execute(
        f"SELECT id, from_user_id, to_user_id, offered_card_id, wanted_card_id FROM {SCHEMA}.trade_offers WHERE id=%s AND status='pending'",
        (trade_id,)
    )
    trade = cur.fetchone()
    if not trade or trade[2] != user_id:
        conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

    if action == "accept":
        _, from_uid, to_uid, offered_id, wanted_id = trade
        cur.execute(
            f"INSERT INTO {SCHEMA}.user_cards (user_id, card_id) VALUES (%s,%s) ON CONFLICT DO NOTHING",
            (to_uid, offered_id)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.user_cards (user_id, card_id) VALUES (%s,%s) ON CONFLICT DO NOTHING",
            (from_uid, wanted_id)
        )
        cur.execute(f"UPDATE {SCHEMA}.trade_offers SET status='accepted' WHERE id=%s", (trade_id,))
    else:
        cur.execute(f"UPDATE {SCHEMA}.trade_offers SET status='declined' WHERE id=%s", (trade_id,))

    conn.commit()
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}
