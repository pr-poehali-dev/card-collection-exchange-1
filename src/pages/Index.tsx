import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  apiRegister, apiLogin, apiLogout, apiGetMe,
  apiGetCards, apiToggleTrade,
  apiGetStats, apiGetTrades, apiRespondTrade,
  saveToken, clearToken, TradeOffer,
} from "@/lib/api";

type Tab = "collection" | "exchange" | "profile";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface User { id: number; username: string; email: string }
interface Card {
  id: number; name: string; series: string; rarity: string;
  value: number; image: string; owned: boolean; forTrade: boolean;
}

const RARITY_LABELS: Record<string, string> = {
  common: "Обычная", rare: "Редкая", epic: "Эпическая", legendary: "Легендарная",
};
const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400", rare: "text-blue-500", epic: "text-purple-500", legendary: "text-amber-500",
};
const RARITY_BORDER: Record<string, string> = {
  common: "border-gray-300", rare: "border-blue-400", epic: "border-purple-400", legendary: "border-amber-400",
};
const RARITY_BAR: Record<string, string> = {
  common: "#9ca3af", rare: "#3b82f6", epic: "#8b5cf6", legendary: "#f59e0b",
};

function AuthPage({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = mode === "login"
        ? await apiLogin(email, password)
        : await apiRegister(username, email, password);
      onAuth(result.user, result.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
            <Icon name="Layers" size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">CardVault</span>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex bg-secondary rounded-lg overflow-hidden mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-foreground text-primary-foreground" : "hover:bg-muted"}`}
            >
              Войти
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "register" ? "bg-foreground text-primary-foreground" : "hover:bg-muted"}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Имя пользователя</label>
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                  placeholder="collector123" required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Пароль</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="••••••" required
              />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-foreground text-primary-foreground font-semibold py-2.5 rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CardTile({ card, onToggleTrade, canTrade }: { card: Card; onToggleTrade?: (id: number) => void; canTrade?: boolean }) {
  return (
    <div className={`card-hover cursor-pointer rounded-lg overflow-hidden bg-white border-2 ${RARITY_BORDER[card.rarity] || "border-gray-200"}`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        {!card.owned && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Icon name="Lock" size={28} className="text-gray-400" />
          </div>
        )}
        {card.forTrade && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            ОБМЕН
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className={`text-[10px] font-medium uppercase tracking-widest ${RARITY_COLORS[card.rarity] || ""}`}>
          {RARITY_LABELS[card.rarity] || card.rarity}
        </p>
        <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">{card.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{card.series}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs font-semibold">{card.value.toLocaleString("ru")} ₽</p>
          {canTrade && card.owned && onToggleTrade && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleTrade(card.id); }}
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${card.forTrade ? "bg-amber-50 border-amber-300 text-amber-700" : "border-border text-muted-foreground hover:border-foreground"}`}
            >
              {card.forTrade ? "Снять" : "Обмен"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionPage({ user }: { user: User }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | Rarity>("all");
  const [stats, setStats] = useState({ owned: 0, total: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, s] = await Promise.all([apiGetCards(), apiGetStats()]);
    setCards(c || []);
    setStats({ owned: s.owned, total: s.total, totalValue: s.totalValue });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(cardId: number) {
    await apiToggleTrade(cardId);
    load();
  }

  const filtered = cards.filter(c => {
    if (filter === "owned" && !c.owned) return false;
    if (filter === "missing" && c.owned) return false;
    if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
    return true;
  });

  const fillPercent = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

  if (loading) return <div className="text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Карточек</p>
          <p className="text-2xl font-bold mt-1">{stats.owned}<span className="text-muted-foreground text-base font-normal">/{stats.total}</span></p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Заполнено</p>
          <p className="text-2xl font-bold mt-1">{fillPercent}%</p>
          <div className="h-1 bg-secondary rounded-full mt-2">
            <div className="h-1 bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Стоимость</p>
          <p className="text-2xl font-bold mt-1">{stats.totalValue.toLocaleString("ru")} ₽</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex bg-white border border-border rounded-lg overflow-hidden">
          {(["all", "owned", "missing"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"}`}>
              {f === "all" ? "Все" : f === "owned" ? "Есть" : "Нет"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap bg-white border border-border rounded-lg overflow-hidden">
          {(["all", "common", "rare", "epic", "legendary"] as const).map(r => (
            <button key={r} onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${rarityFilter === r ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"}`}>
              {r === "all" ? "Все" : RARITY_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map(card => (
          <CardTile key={card.id} card={card} onToggleTrade={handleToggle} canTrade />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground text-sm">Нет карточек по выбранному фильтру</p>}
    </div>
  );
}

function ExchangePage({ user }: { user: User }) {
  const [trades, setTrades] = useState<{ incoming: TradeOffer[]; outgoing: TradeOffer[] }>({ incoming: [], outgoing: [] });
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, c] = await Promise.all([apiGetTrades(), apiGetCards()]);
    setTrades(t || { incoming: [], outgoing: [] });
    setCards(c || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(tradeId: number, action: "accept" | "decline") {
    await apiRespondTrade(tradeId, action);
    load();
  }

  const tradeCards = cards.filter(c => c.forTrade);

  if (loading) return <div className="text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      {tradeCards.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl italic text-muted-foreground mb-3">Мои предложения</h2>
          <div className="space-y-3">
            {tradeCards.map((card, i) => (
              <div key={card.id} className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4 flex items-center gap-4"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
                <img src={card.image} alt={card.name} className={`w-12 h-16 object-cover rounded border-2 ${RARITY_BORDER[card.rarity]}`} />
                <div className="flex-1">
                  <p className={`text-[10px] uppercase tracking-widest font-medium ${RARITY_COLORS[card.rarity]}`}>{RARITY_LABELS[card.rarity]}</p>
                  <p className="font-semibold">{card.name}</p>
                  <p className="text-sm text-muted-foreground">{card.value.toLocaleString("ru")} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-xl italic text-muted-foreground mb-3">
          Входящие предложения {trades.incoming.length > 0 && <span className="text-sm font-normal">({trades.incoming.length})</span>}
        </h2>
        {trades.incoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">Нет входящих предложений</p>
        ) : (
          <div className="space-y-3">
            {trades.incoming.map((offer, i) => (
              <div key={offer.id} className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                    {offer.from_username.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="font-medium text-sm">{offer.from_username}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 bg-secondary rounded p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Предлагает</p>
                    <p className="font-semibold mt-0.5">{offer.offered_card}</p>
                    <p className={`text-[10px] ${RARITY_COLORS[offer.offered_rarity]}`}>{RARITY_LABELS[offer.offered_rarity]}</p>
                  </div>
                  <Icon name="ArrowLeftRight" size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 bg-secondary rounded p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Хочет</p>
                    <p className="font-semibold mt-0.5">{offer.wanted_card}</p>
                    <p className={`text-[10px] ${RARITY_COLORS[offer.wanted_rarity]}`}>{RARITY_LABELS[offer.wanted_rarity]}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respond(offer.id, "accept")}
                    className="flex-1 bg-foreground text-primary-foreground text-xs font-semibold py-2 rounded hover:opacity-90 transition-opacity">
                    Принять
                  </button>
                  <button onClick={() => respond(offer.id, "decline")}
                    className="flex-1 border border-border text-xs font-semibold py-2 rounded hover:bg-secondary transition-colors">
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [stats, setStats] = useState<{
    owned: number; total: number; totalValue: number; forTrade: number;
    rarityOwned: Record<string, number>; rarityTotal: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    apiGetStats().then(setStats).catch(() => {});
  }, []);

  const statItems = stats ? [
    { label: "Карточек собрано", value: `${stats.owned}/${stats.total}`, icon: "Layers" },
    { label: "Общая стоимость", value: `${stats.totalValue.toLocaleString("ru")} ₽`, icon: "TrendingUp" },
    { label: "Легендарных", value: String(stats.rarityOwned?.legendary || 0), icon: "Trophy" },
    { label: "На обмен", value: String(stats.forTrade), icon: "ArrowLeftRight" },
  ] : [];

  const rarityCounts = stats
    ? (["legendary", "epic", "rare", "common"] as Rarity[]).map(r => ({
        rarity: r,
        owned: stats.rarityOwned?.[r] || 0,
        total: stats.rarityTotal?.[r] || 0,
      }))
    : [];

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="bg-white border border-border rounded-lg p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-primary-foreground text-xl font-bold">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold">{user.username}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Icon name="Star" size={12} className="text-amber-500" />
              <p className="text-xs text-muted-foreground">Коллекционер</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:bg-secondary transition-colors">
          Выйти
        </button>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {statItems.map((stat, i) => (
              <div key={i} className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4"
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={stat.icon as never} size={14} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">По редкостям</p>
            <div className="space-y-3">
              {rarityCounts.map(({ rarity, owned, total }) => (
                <div key={rarity}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${RARITY_COLORS[rarity]}`}>{RARITY_LABELS[rarity]}</p>
                    <p className="text-sm font-semibold">{owned}/{total}</p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full">
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: total > 0 ? `${(owned / total) * 100}%` : "0%", backgroundColor: RARITY_BAR[rarity] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("collection");

  useEffect(() => {
    const token = localStorage.getItem("cv_token");
    if (token) {
      apiGetMe()
        .then(u => setUser(u))
        .catch(() => clearToken())
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, []);

  function handleAuth(u: User, token: string) {
    saveToken(token);
    setUser(u);
  }

  async function handleLogout() {
    await apiLogout();
    clearToken();
    setUser(null);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "collection", label: "Коллекция", icon: "Layers" },
    { key: "exchange", label: "Обмен", icon: "ArrowLeftRight" },
    { key: "profile", label: "Профиль", icon: "User" },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center">
            <Icon name="Layers" size={14} className="text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">CardVault</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center">
                <Icon name="Layers" size={14} className="text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">CardVault</span>
            </div>
            <nav className="flex items-center gap-1">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.key ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                  <Icon name={tab.icon as never} size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold italic">
            {tabs.find(t => t.key === activeTab)?.label}
          </h1>
          <div className="h-px bg-border mt-3" />
        </div>

        {activeTab === "collection" && <CollectionPage user={user} />}
        {activeTab === "exchange" && <ExchangePage user={user} />}
        {activeTab === "profile" && <ProfilePage user={user} onLogout={handleLogout} />}
      </main>
    </div>
  );
}
