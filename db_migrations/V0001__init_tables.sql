CREATE TABLE IF NOT EXISTS t_p3509775_card_collection_exch.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p3509775_card_collection_exch.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.users(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p3509775_card_collection_exch.cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  series VARCHAR(100) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  value INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS t_p3509775_card_collection_exch.user_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.users(id),
  card_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.cards(id),
  for_trade BOOLEAN DEFAULT FALSE,
  obtained_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

CREATE TABLE IF NOT EXISTS t_p3509775_card_collection_exch.trade_offers (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.users(id),
  to_user_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.users(id),
  offered_card_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.cards(id),
  wanted_card_id INTEGER NOT NULL REFERENCES t_p3509775_card_collection_exch.cards(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p3509775_card_collection_exch.cards (name, series, rarity, value, image_url) VALUES
  ('Страж Огня',     'Серия «Элементы»', 'legendary', 4500, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Теневой Клинок', 'Серия «Элементы»', 'epic',      1800, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Водный Маг',     'Серия «Элементы»', 'rare',       650, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Лесной Страж',   'Серия «Элементы»', 'common',     120, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Дракон Бури',    'Серия «Драконы»',  'legendary',  7200, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Ледяной Арбалет','Серия «Драконы»',  'epic',       2100, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Призрак Ночи',   'Серия «Тени»',     'rare',        890, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg'),
  ('Каменный Голем', 'Серия «Тени»',     'common',       95, 'https://cdn.poehali.dev/projects/0c21500f-235c-409c-8b76-01640a459491/files/7d25e633-73a5-4a3a-8a90-77b14a9b5290.jpg');
