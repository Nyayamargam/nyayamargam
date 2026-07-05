from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.router import classify, dispatch

logger = logging.getLogger(__name__)
router = APIRouter(tags=["classify"])


class ClassifyRequest(BaseModel):
    problem: str
    language: str = "en"


@router.post("/classify")
async def classify_problem(body: ClassifyRequest) -> dict:
    """
    Classify a free-text citizen problem and return a dispatch action.
    The response tells the frontend what to render next — never contains
    procedural advice or legal opinion.
    """
    if not body.problem.strip():
        raise HTTPException(400, "problem must not be empty")

    try:
        result = await classify(body.problem)
    except Exception as exc:
        logger.error("[Router] classification failed: %s", exc)
        raise HTTPException(502, "Classification service unavailable") from exc

    logger.info(
        "[Router] route=%s domain=%s confidence=%.2f lang=%s",
        result.route, result.domain, result.confidence, result.language,
    )
    return dispatch(result)
