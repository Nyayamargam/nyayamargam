from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from groq import AsyncGroq

from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/speech", tags=["speech"])

# BCP-47 → ISO 639-1 (what Whisper expects)
_LANG_MAP = {"en-IN": "en", "hi-IN": "hi", "te-IN": "te"}


@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("en-IN"),  # BCP-47: te-IN | hi-IN | en-IN
):
    s = get_settings()
    if not s.groq_api_key:
        raise HTTPException(503, "Speech service not configured")

    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm"
    iso_lang = _LANG_MAP.get(language, language.split("-")[0])

    logger.info(
        "[STT] received audio: %d bytes, content_type=%s, language=%s → %s",
        len(audio_bytes), content_type, language, iso_lang,
    )

    try:
        client = AsyncGroq(api_key=s.groq_api_key)
        result = await client.audio.transcriptions.create(
            file=(audio.filename or "recording.webm", audio_bytes, content_type),
            model="whisper-large-v3-turbo",
            language=iso_lang,
            response_format="json",
        )
        transcript = result.text or ""
        logger.info("[STT] Groq Whisper transcript: %r", transcript[:120])
    except Exception as exc:
        logger.error("[STT] Groq Whisper error: %s", exc)
        raise HTTPException(502, f"Speech transcription failed: {exc}") from exc

    return {"transcript": transcript, "language_code": language}
