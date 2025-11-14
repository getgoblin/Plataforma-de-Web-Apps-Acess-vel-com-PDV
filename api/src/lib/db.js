const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/pdv.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// schema (simple)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  document TEXT,
  anonymous INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unique indexes to avoid duplicates while allowing NULLs
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_document ON clients(document);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_email ON clients(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_phone ON clients(phone);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number_seq INTEGER,
  client_id INTEGER,
  client_snapshot TEXT, -- JSON with client basic fields
  payment_method TEXT NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  subtotal_cents INTEGER NOT NULL,
  unit_discounts_cents INTEGER NOT NULL,
  order_discount_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  code_snapshot TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  unit_discount_pct REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL
);
INSERT OR IGNORE INTO order_sequence(id, last_number) VALUES (1, 0);
`);

module.exports = { db };
