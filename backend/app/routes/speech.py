from __future__ import annotations

import base64
import logging

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from groq import AsyncGroq
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/speech", tags=["speech"])

# BCP-47 → ISO 639-1 (what Whisper expects)
_LANG_MAP = {"en-IN": "en", "hi-IN": "hi", "te-IN": "te"}

_SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
# Sarvam bulbul:v1 speaker per language — meera is cross-lingual female
_TTS_SPEAKER = {"hi-IN": "meera", "te-IN": "arvind", "en-IN": "meera"}


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


class TTSRequest(BaseModel):
    text: str
    language: str = "hi-IN"  # BCP-47


@router.post("/tts", response_class=Response)
async def text_to_speech(body: TTSRequest):
    """Convert text to speech via Sarvam TTS and return WAV audio bytes."""
    s = get_settings()
    if not s.sarvam_api_key:
        raise HTTPException(503, "TTS service not configured")

    text = body.text[:500].strip()
    if not text:
        raise HTTPException(400, "text must not be empty")

    speaker = _TTS_SPEAKER.get(body.language, "meera")
    logger.info("[TTS] lang=%s speaker=%s len=%d", body.language, speaker, len(text))

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                _SARVAM_TTS_URL,
                json={
                    "inputs": [text],
                    "target_language_code": body.language,
                    "speaker": speaker,
                    "model": "bulbul:v1",
                },
                headers={
                    "api-subscription-key": s.sarvam_api_key,
                    "Content-Type": "application/json",
                },
            )
    except httpx.RequestError as exc:
        logger.error("[TTS] request error: %s", exc)
        raise HTTPException(502, "TTS service unavailable") from exc

    if not res.is_success:
        logger.error("[TTS] Sarvam %d: %s", res.status_code, res.text[:200])
        raise HTTPException(502, "TTS service unavailable")

    try:
        audio_b64: str = res.json()["audios"][0]
        audio_bytes = base64.b64decode(audio_b64)
    except Exception as exc:
        logger.error("[TTS] unexpected response shape: %s", exc)
        raise HTTPException(502, "TTS response parse error") from exc

    return Response(content=audio_bytes, media_type="audio/wav")
