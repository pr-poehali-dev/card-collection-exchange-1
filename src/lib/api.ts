const URLS = {
  auth: "https://functions.poehali.dev/f507c721-7671-48b0-90b7-95aee9be4579",
  cards: "https://functions.poehali.dev/fe183d6f-01a3-4985-8222-4a804e0da2c3",
  collection: "https://functions.poehali.dev/6310fa53-a1d0-4077-bd49-8691df855b3d",
  trades: "https://functions.poehali.dev/cec6986b-1fdc-4357-9ef8-7d98c34bcfde",
};

function getToken(): string {
  return localStorage.getItem("cv_token") || "";
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Session-Token": getToken(),
  };
}

async function parseBody(res: Response) {
  const text = await res.text();
  try {
    const outer = JSON.parse(text);
    if (typeof outer === "string") return JSON.parse(outer);
    return outer;
  } catch {
    return {};
  }
}

export async function apiRegister(username: string, email: string, password: string) {
  const res = await fetch(`${URLS.auth}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await parseBody(res);
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  return data as { token: string; user: { id: number; username: string; email: string } };
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${URLS.auth}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseBody(res);
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  return data as { token: string; user: { id: number; username: string; email: string } };
}

export async function apiGetMe() {
  const res = await fetch(URLS.auth, { headers: authHeaders() });
  const data = await parseBody(res);
  if (!res.ok) throw new Error("Не авторизован");
  return data.user as { id: number; username: string; email: string };
}

export async function apiLogout() {
  await fetch(`${URLS.auth}/logout`, { method: "POST", headers: authHeaders() });
  localStorage.removeItem("cv_token");
}

export async function apiGetCards() {
  const res = await fetch(URLS.cards, { headers: authHeaders() });
  const data = await parseBody(res);
  return data.cards as Array<{
    id: number; name: string; series: string; rarity: string;
    value: number; image: string; owned: boolean; forTrade: boolean;
  }>;
}

export async function apiToggleTrade(cardId: number) {
  const res = await fetch(`${URLS.cards}/toggle-trade`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ card_id: cardId }),
  });
  return parseBody(res);
}

export async function apiGetStats() {
  const res = await fetch(URLS.collection, { headers: authHeaders() });
  const data = await parseBody(res);
  return data as {
    owned: number; total: number; totalValue: number; forTrade: number;
    rarityOwned: Record<string, number>; rarityTotal: Record<string, number>;
  };
}

export async function apiAddCard(cardId: number) {
  const res = await fetch(`${URLS.collection}/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ card_id: cardId }),
  });
  return parseBody(res);
}

export async function apiGetTrades() {
  const res = await fetch(URLS.trades, { headers: authHeaders() });
  const data = await parseBody(res);
  return data as {
    incoming: TradeOffer[];
    outgoing: TradeOffer[];
  };
}

export async function apiRespondTrade(tradeId: number, action: "accept" | "decline") {
  const res = await fetch(`${URLS.trades}/respond`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ trade_id: tradeId, action }),
  });
  return parseBody(res);
}

export interface TradeOffer {
  id: number;
  status: string;
  from_username: string;
  offered_card: string;
  offered_rarity: string;
  wanted_card: string;
  wanted_rarity: string;
}

export function saveToken(token: string) {
  localStorage.setItem("cv_token", token);
}

export function clearToken() {
  localStorage.removeItem("cv_token");
}
