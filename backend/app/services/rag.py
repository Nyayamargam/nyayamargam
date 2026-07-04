from __future__ import annotations

import logging

from google import genai
from google.genai import types

from app.config import get_settings
from app.db.supabase import get_supabase

logger = logging.getLogger(__name__)

_FALLBACK = (
    "No specific procedural information is available for this query. "
    "Do NOT fabricate procedures, amounts, or timelines. "
    "If the user asks a procedural question you cannot answer from your own knowledge, "
    "use the grounding fallback stated in the hard rules."
)


async def _embed(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    s = get_settings()
    try:
        client = genai.Client(api_key=s.gemini_api_key)
        response = await client.aio.models.embed_content(
            model="text-embedding-004",
            contents=text,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        return list(response.embeddings[0].values)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        return []


async def get_rag_context(query: str, domain: str, match_count: int = 5) -> str:
    """Return formatted knowledge context for the system prompt, or fallback string."""
    embedding = await _embed(query)
    if not embedding:
        return _FALLBACK

    db = get_supabase()
    try:
        result = db.rpc(
            "match_knowledge",
            {
                "query_embedding": embedding,
                "match_domain": domain,
                "match_count": match_count,
            },
        ).execute()
        chunks = result.data or []
    except Exception as exc:
        logger.error("RAG retrieval failed: %s", exc)
        return _FALLBACK

    if not chunks:
        return _FALLBACK

    parts = []
    for chunk in chunks:
        line = chunk["content"]
        if chunk.get("source_url"):
            line += f" (Source: {chunk['source_url']})"
        parts.append(line)

    return "\n\n".join(parts)


async def embed_document(text: str) -> list[float]:
    """Embed a knowledge chunk for indexing (used by the seed script)."""
    return await _embed(text, task_type="RETRIEVAL_DOCUMENT")
