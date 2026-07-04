-- NavyaSathi — Migration 002: fix vector dimension + add match_knowledge function
-- Run in Supabase SQL Editor BEFORE running the seed script.

-- Shrink embedding column from 1536 (OpenAI default) to 768 (Gemini text-embedding-004)
ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(768);

-- Similarity search function called by the RAG service
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(768),
    match_domain     text,
    match_count      int     DEFAULT 5,
    match_threshold  float   DEFAULT 0.4
)
RETURNS TABLE (
    id          uuid,
    content     text,
    source_url  text,
    metadata    jsonb,
    similarity  float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        id,
        content,
        source_url,
        metadata,
        1 - (embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks
    WHERE domain = match_domain
      AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Grant execute to the service role used by the backend
GRANT EXECUTE ON FUNCTION match_knowledge TO service_role;
