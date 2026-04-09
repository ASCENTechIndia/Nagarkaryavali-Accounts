-- ============================================
-- Database Setup - Create Token Management Tables
-- ============================================
-- Run these SQL commands in your PostgreSQL database
-- Connection: postgresql://prop:prop@192.168.1.17:5432/ASCNSKDB
--
-- Method 1: Run all commands at once in pgAdmin or psql
-- Method 2: Execute the initTables.js script (requires DB to be running)

-- ============================================
-- 1. Create REFRESH_TOKENS table
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
  ON refresh_tokens(token);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
  ON refresh_tokens(user_id);

-- ============================================
-- 2. Create TOKEN_BLACKLIST table  
-- ============================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  blacklisted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create index for fast blacklist lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token 
  ON token_blacklist(token);

-- ============================================
-- Verification Queries (Run after creation)
-- ============================================
-- Check if tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname='public';

-- See refresh tokens:
-- SELECT * FROM refresh_tokens;

-- See blacklisted tokens:
-- SELECT * FROM token_blacklist;

-- ============================================
-- Optional: Cleanup Expired Tokens (Periodic)
-- ============================================
-- DELETE FROM refresh_tokens WHERE expires_at < NOW();
-- DELETE FROM token_blacklist WHERE expires_at < NOW();
