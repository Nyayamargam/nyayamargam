-- NavyaSathi — Migration 003: Case Watch support
-- Run in Supabase SQL Editor after migration 002.

ALTER TABLE cases ADD COLUMN IF NOT EXISTS alerts           JSONB        NOT NULL DEFAULT '[]';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS last_rescanned_at TIMESTAMPTZ;
