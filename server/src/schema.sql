
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  budget INTEGER NOT NULL DEFAULT 100,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SLOTS per ruolo
CREATE TABLE IF NOT EXISTS user_role_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  slots_total INTEGER NOT NULL,
  slots_used INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, role)
);

-- AUCTIONS
CREATE TABLE IF NOT EXISTS auctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_bid INTEGER NOT NULL CHECK(base_bid>=1),
  created_by INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open|closed|void|cancelled
  winner_user_id INTEGER,
  winning_bid INTEGER,
  last_bid_timestamp TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);

-- BIDS
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auction_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- PARTECIPANTI
CREATE TABLE IF NOT EXISTS auction_participants (
  auction_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- participating|excluded_constraints|left
  UNIQUE(auction_id, user_id)
);

-- ROSE
CREATE TABLE IF NOT EXISTS rosters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  role TEXT NOT NULL,
  price INTEGER NOT NULL
);

-- FASE MERCATO (un solo record)
CREATE TABLE IF NOT EXISTS market_phase (
  id INTEGER PRIMARY KEY CHECK (id=1),
  phase TEXT NOT NULL -- 'svincoli'|'aste'|'chiusa'
);
INSERT INTO market_phase(id,phase) SELECT 1,'chiusa' WHERE NOT EXISTS(SELECT 1 FROM market_phase WHERE id=1);

-- NOTIFICHE HERE WE GO
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
