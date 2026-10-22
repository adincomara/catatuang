-- Cloudflare D1 Database Schema for CatatUang
-- Supports multi-tenant Google users with offline-first synchronization

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_balance REAL NOT NULL DEFAULT 0,
  icon TEXT,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_email, updated_at);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  target_wallet_id TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  note TEXT,
  date TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_email, updated_at);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_batches_user ON batches(user_email, updated_at);
