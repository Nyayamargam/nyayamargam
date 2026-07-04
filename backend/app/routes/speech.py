from __future__ import annotations

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import get_settings

router = APIRouter(prefix="/speech", tags=["speech"])

SARVAM_STT_URL = "https://api.sarvam.ai/v1/speech-to-text"


@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("te-IN"),  # BCP-47: te-IN | hi-IN | en-IN
):
    s = get_settings()
    if not s.sarvam_api_key:
        raise HTTPException(503, "Speech service not configured")

    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm"

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": s.sarvam_api_key},
                files={"file": (audio.filename or "recording.webm", audio_bytes, content_type)},
                data={"language_code": language, "model": "saarika:v2"},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(502, f"Speech service error: {exc.response.status_code}") from exc
        except httpx.RequestError as exc:
            raise HTTPException(502, f"Speech service unreachable: {exc}") from exc

    return resp.json()
