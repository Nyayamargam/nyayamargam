from __future__ import annotations

import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.db.supabase import get_supabase
from app.models.case import (
    CaseStatus,
    CreateCaseRequest,
    CreateCaseResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.orchestration import get_opening_message, process_message

router = APIRouter(prefix="/case", tags=["cases"])

_ALPHABET = string.ascii_uppercase + string.digits


def _generate_code(length: int = 6) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


@router.post("", response_model=CreateCaseResponse, status_code=201)
async def create_case(body: CreateCaseRequest, db: Client = Depends(get_supabase)):
    # Collision-safe: retry up to 5 times (36^6 ≈ 2.18B combos; collisions are negligible)
    code = ""
    for _ in range(5):
        candidate = _generate_code()
        existing = db.table("cases").select("code").eq("code", candidate).execute()
        if not existing.data:
            code = candidate
            break
    if not code:
        raise HTTPException(500, "Could not generate a unique case code")

    opening = get_opening_message(body.language)
    row = {
        "code": code,
        "domain": "vehicle_traffic",
        "language": body.language,
        "status": CaseStatus.INTAKE,
        "slots": {},
        "messages": [
            {
                "role": "assistant",
                "content": opening,
                "timestamp": datetime.utcnow().isoformat(),
            }
        ],
    }
    db.table("cases").insert(row).execute()
    return CreateCaseResponse(code=code, status=CaseStatus.INTAKE, first_message=opening)


@router.get("/{code}")
async def get_case(code: str, db: Client = Depends(get_supabase)):
    result = db.table("cases").select("*").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    return result.data[0]


@router.post("/{code}/message", response_model=SendMessageResponse)
async def send_message(
    code: str,
    body: SendMessageRequest,
    db: Client = Depends(get_supabase),
):
    result = db.table("cases").select("*").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    case = result.data[0]

    if case["status"] not in (CaseStatus.INTAKE, "intake"):
        raise HTTPException(409, "Case intake is already complete")

    user_msg = {
        "role": "user",
        "content": body.content,
        "timestamp": datetime.utcnow().isoformat(),
    }
    messages = list(case["messages"]) + [user_msg]

    reply, updated_slots, intake_complete = await process_message(
        messages=messages,
        current_slots=case["slots"],
        language=body.language or case["language"],
    )

    assistant_msg = {
        "role": "assistant",
        "content": reply,
        "timestamp": datetime.utcnow().isoformat(),
    }
    messages.append(assistant_msg)

    new_status = CaseStatus.PENDING_DOCS if intake_complete else CaseStatus.INTAKE

    db.table("cases").update(
        {"messages": messages, "slots": updated_slots, "status": new_status}
    ).eq("code", code.upper()).execute()

    return SendMessageResponse(
        reply=reply,
        status=new_status,
        slots_filled=updated_slots,
        intake_complete=intake_complete,
    )
