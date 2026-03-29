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
        f"""SELECT user_id FROM {SCHEMA}.sessions
            WHERE token=%s AND expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """Список всех карточек с пометкой о наличии у текущего пользователя"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    path = event.get("path", "/")

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(cur, token)

    if path.endswith("/toggle-trade"):
        return toggle_trade(cur, conn, user_id, json.loads(event.get("body") or "{}"))

    cards = get_all_cards(cur, user_id)
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"cards": cards})
    }


def get_all_cards(cur, user_id) -> list:
    if user_id:
        cur.execute(
            f"""SELECT c.id, c.name, c.series, c.rarity, c.value, c.image_url,
                       (uc.id IS NOT NULL) as owned,
                       COALESCE(uc.for_trade, false) as for_trade
                FROM {SCHEMA}.cards c
                LEFT JOIN {SCHEMA}.user_cards uc ON uc.card_id=c.id AND uc.user_id=%s
                ORDER BY
                  CASE c.rarity WHEN 'legendary' THEN 1 WHEN 'epic' THEN 2 WHEN 'rare' THEN 3 ELSE 4 END,
                  c.value DESC""",
            (user_id,)
        )
    else:
        cur.execute(
            f"""SELECT c.id, c.name, c.series, c.rarity, c.value, c.image_url,
                       false as owned, false as for_trade
                FROM {SCHEMA}.cards c
                ORDER BY
                  CASE c.rarity WHEN 'legendary' THEN 1 WHEN 'epic' THEN 2 WHEN 'rare' THEN 3 ELSE 4 END,
                  c.value DESC"""
        )

    rows = cur.fetchall()
    return [
        {
            "id": r[0], "name": r[1], "series": r[2],
            "rarity": r[3], "value": r[4], "image": r[5] or "",
            "owned": bool(r[6]), "forTrade": bool(r[7])
        }
        for r in rows
    ]


def toggle_trade(cur, conn, user_id, body: dict) -> dict:
    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    card_id = body.get("card_id")
    cur.execute(
        f"SELECT id, for_trade FROM {SCHEMA}.user_cards WHERE user_id=%s AND card_id=%s",
        (user_id, card_id)
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Карточка не найдена"})}

    new_val = not row[1]
    cur.execute(
        f"UPDATE {SCHEMA}.user_cards SET for_trade=%s WHERE id=%s",
        (new_val, row[0])
    )
    conn.commit()
    conn.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"forTrade": new_val})}
