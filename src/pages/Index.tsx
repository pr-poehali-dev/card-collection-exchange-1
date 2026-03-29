import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "collection" | "exchange" | "profile";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface Card {
  id: number;
  name: string;
  series: string;
  rarity: Rarity;
  value: number;
  image: string;
  owned: boolean;
  forTrade: boolean;
}

const CARD_IMAGE = "https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg";

const MOCK_CARDS: Card[] = [
  { id: 1, name: "Страж Огня", series: "Серия «Элементы»", rarity: "legendary", value: 4500, image: CARD_IMAGE, owned: true, forTrade: false },
  { id: 2, name: "Теневой Клинок", series: "Серия «Элементы»", rarity: "epic", value: 1800, image: CARD_IMAGE, owned: true, forTrade: true },
  { id: 3, name: "Водный Маг", series: "Серия «Элементы»", rarity: "rare", value: 650, image: CARD_IMAGE, owned: true, forTrade: false },
  { id: 4, name: "Лесной Страж", series: "Серия «Элементы»", rarity: "common", value: 120, image: CARD_IMAGE, owned: false, forTrade: false },
  { id: 5, name: "Дракон Бури", series: "Серия «Драконы»", rarity: "legendary", value: 7200, image: CARD_IMAGE, owned: false, forTrade: false },
  { id: 6, name: "Ледяной Арбалет", series: "Серия «Драконы»", rarity: "epic", value: 2100, image: CARD_IMAGE, owned: true, forTrade: true },
  { id: 7, name: "Призрак Ночи", series: "Серия «Тени»", rarity: "rare", value: 890, image: CARD_IMAGE, owned: false, forTrade: false },
  { id: 8, name: "Каменный Голем", series: "Серия «Тени»", rarity: "common", value: 95, image: CARD_IMAGE, owned: true, forTrade: false },
];

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Обычная",
  rare: "Редкая",
  epic: "Эпическая",
  legendary: "Легендарная",
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: "text-gray-400",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-amber-500",
};

const RARITY_BAR_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#f59e0b",
};

const RARITY_BORDER: Record<Rarity, string> = {
  common: "border-gray-300",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-amber-400",
};

const EXCHANGE_OFFERS = [
  { id: 1, user: "Алексей М.", avatar: "АМ", offerCard: "Ледяной Арбалет", wantCard: "Страж Огня", rarity: "epic" as Rarity },
  { id: 2, user: "Мария К.", avatar: "МК", offerCard: "Дракон Бури", wantCard: "Теневой Клинок", rarity: "legendary" as Rarity },
  { id: 3, user: "Денис В.", avatar: "ДВ", offerCard: "Водный Маг", wantCard: "Лесной Страж", rarity: "rare" as Rarity },
];

function CardTile({ card, delay = 0 }: { card: Card; delay?: number }) {
  return (
    <div
      className={`animate-slide-up opacity-0 card-hover cursor-pointer rounded-lg overflow-hidden bg-white border-2 ${RARITY_BORDER[card.rarity]}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
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
        <p className={`text-[10px] font-medium uppercase tracking-widest ${RARITY_COLORS[card.rarity]}`}>
          {RARITY_LABELS[card.rarity]}
        </p>
        <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">{card.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{card.series}</p>
        <p className="text-xs font-semibold mt-1.5">{card.value.toLocaleString("ru")} ₽</p>
      </div>
    </div>
  );
}

function CollectionPage() {
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | Rarity>("all");

  const owned = MOCK_CARDS.filter((c) => c.owned).length;
  const total = MOCK_CARDS.length;
  const totalValue = MOCK_CARDS.filter((c) => c.owned).reduce((s, c) => s + c.value, 0);
  const fillPercent = Math.round((owned / total) * 100);

  const filtered = MOCK_CARDS.filter((c) => {
    if (filter === "owned" && !c.owned) return false;
    if (filter === "missing" && c.owned) return false;
    if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Карточек</p>
          <p className="text-2xl font-bold mt-1">
            {owned}
            <span className="text-muted-foreground text-base font-normal">/{total}</span>
          </p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Заполнено</p>
          <p className="text-2xl font-bold mt-1">{fillPercent}%</p>
          <div className="h-1 bg-secondary rounded-full mt-2">
            <div
              className="h-1 bg-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Стоимость</p>
          <p className="text-2xl font-bold mt-1">{totalValue.toLocaleString("ru")} ₽</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex bg-white border border-border rounded-lg overflow-hidden">
          {(["all", "owned", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {f === "all" ? "Все" : f === "owned" ? "Есть" : "Нет"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap bg-white border border-border rounded-lg overflow-hidden">
          {(["all", "common", "rare", "epic", "legendary"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                rarityFilter === r ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {r === "all" ? "Все" : RARITY_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((card, i) => (
          <CardTile key={card.id} card={card} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function ExchangePage() {
  const tradeCards = MOCK_CARDS.filter((c) => c.forTrade);

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-xl italic text-muted-foreground mb-3">Мои предложения</h2>
        <div className="space-y-3">
          {tradeCards.map((card, i) => (
            <div
              key={card.id}
              className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4 flex items-center gap-4"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              <img
                src={card.image}
                alt={card.name}
                className={`w-12 h-16 object-cover rounded border-2 ${RARITY_BORDER[card.rarity]}`}
              />
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-widest font-medium ${RARITY_COLORS[card.rarity]}`}>
                  {RARITY_LABELS[card.rarity]}
                </p>
                <p className="font-semibold">{card.name}</p>
                <p className="text-sm text-muted-foreground">{card.value.toLocaleString("ru")} ₽</p>
              </div>
              <button className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:bg-secondary transition-colors">
                Убрать
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl italic text-muted-foreground mb-3">Входящие предложения</h2>
        <div className="space-y-3">
          {EXCHANGE_OFFERS.map((offer, i) => (
            <div
              key={offer.id}
              className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4"
              style={{ animationDelay: `${(i + 3) * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                  {offer.avatar}
                </div>
                <p className="font-medium text-sm">{offer.user}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 bg-secondary rounded p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Предлагает</p>
                  <p className="font-semibold mt-0.5">{offer.offerCard}</p>
                </div>
                <Icon name="ArrowLeftRight" size={16} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 bg-secondary rounded p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Хочет</p>
                  <p className="font-semibold mt-0.5">{offer.wantCard}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-foreground text-primary-foreground text-xs font-semibold py-2 rounded hover:opacity-90 transition-opacity">
                  Принять
                </button>
                <button className="flex-1 border border-border text-xs font-semibold py-2 rounded hover:bg-secondary transition-colors">
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const owned = MOCK_CARDS.filter((c) => c.owned).length;
  const total = MOCK_CARDS.length;
  const totalValue = MOCK_CARDS.filter((c) => c.owned).reduce((s, c) => s + c.value, 0);
  const legendaryCount = MOCK_CARDS.filter((c) => c.owned && c.rarity === "legendary").length;
  const forTradeCount = MOCK_CARDS.filter((c) => c.forTrade).length;

  const rarityCounts = (["legendary", "epic", "rare", "common"] as Rarity[]).map((r) => ({
    rarity: r,
    owned: MOCK_CARDS.filter((c) => c.owned && c.rarity === r).length,
    total: MOCK_CARDS.filter((c) => c.rarity === r).length,
  }));

  const stats = [
    { label: "Карточек собрано", value: `${owned}/${total}`, icon: "Layers" },
    { label: "Общая стоимость", value: `${totalValue.toLocaleString("ru")} ₽`, icon: "TrendingUp" },
    { label: "Легендарных", value: String(legendaryCount), icon: "Trophy" },
    { label: "На обмен", value: String(forTradeCount), icon: "ArrowLeftRight" },
  ];

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="bg-white border border-border rounded-lg p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-primary-foreground text-xl font-bold">
          КМ
        </div>
        <div>
          <p className="text-xl font-bold">Коллекционер</p>
          <p className="text-muted-foreground text-sm">@collector · Участник с 2024</p>
          <div className="flex items-center gap-1 mt-1">
            <Icon name="Star" size={12} className="text-amber-500" />
            <p className="text-xs text-muted-foreground">Уровень 7 · Мастер-коллекционер</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="animate-slide-up opacity-0 bg-white border border-border rounded-lg p-4"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
          >
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
                <p className="text-sm font-semibold">
                  {owned}/{total}
                </p>
              </div>
              <div className="h-1.5 bg-secondary rounded-full">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: total > 0 ? `${(owned / total) * 100}%` : "0%",
                    backgroundColor: RARITY_BAR_COLORS[rarity],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("collection");

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "collection", label: "Коллекция", icon: "Layers" },
    { key: "exchange", label: "Обмен", icon: "ArrowLeftRight" },
    { key: "profile", label: "Профиль", icon: "User" },
  ];

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
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-foreground text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
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
            {tabs.find((t) => t.key === activeTab)?.label}
          </h1>
          <div className="h-px bg-border mt-3" />
        </div>

        {activeTab === "collection" && <CollectionPage />}
        {activeTab === "exchange" && <ExchangePage />}
        {activeTab === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}
