-- NavyaSathi — initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- The pgvector extension MUST be first.

CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- Cases
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT        NOT NULL UNIQUE,
    domain      TEXT,
    status      TEXT        NOT NULL DEFAULT 'intake'
                                CHECK (status IN ('intake','pending_docs','ready','closed')),
    language    TEXT        NOT NULL DEFAULT 'en'
                                CHECK (language IN ('en','hi','te')),
    slots       JSONB       NOT NULL DEFAULT '{}',
    messages    JSONB       NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_code   ON cases (code);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_domain ON cases (domain);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at ON cases;
CREATE TRIGGER cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Document records (Phase 2 — schema created now, used later)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_records (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_type    TEXT        NOT NULL,
    extracted_fields JSONB       NOT NULL DEFAULT '{}',
    validity_status  TEXT        NOT NULL DEFAULT 'pending'
                                     CHECK (validity_status IN ('pending','valid','expired','invalid','needs_review')),
    expiry_date      DATE,
    uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_case_id ON document_records (case_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Knowledge base (Phase 4 RAG — vector index left commented until data loaded)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    domain        TEXT    NOT NULL,
    content       TEXT    NOT NULL,
    source_url    TEXT,
    last_verified DATE,
    embedding     vector(1536),
    metadata      JSONB   NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_knowledge_domain ON knowledge_chunks (domain);

-- Uncomment after Phase 4 data is loaded:
-- CREATE INDEX idx_knowledge_embedding
--     ON knowledge_chunks
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (defence-in-depth — backend uses SERVICE_ROLE)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
