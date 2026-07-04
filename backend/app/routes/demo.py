"""
Demo reset endpoint — re-seeds the DEMO01 case to a known state between pitches.

Protected by Authorization: Bearer <DEMO_SECRET>.
Returns 404 when DEMO_SECRET is not set so the endpoint is invisible in prod.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client

from app.config import get_settings
from app.db.supabase import get_supabase

router = APIRouter(prefix="/demo", tags=["demo"])

_DEMO_CODE = "DEMO01"

_SLOTS = {
    "incident_type": "challan",
    "incident_date": "2026-05-15",
    "incident_location": "Banjara Hills, Hyderabad, Telangana",
    "rc_number": "TS09EA1234",
    "dl_status": "valid",
    "fine_amount": 1000,
    "offence_section": "MV Act Section 183 (Speeding)",
    "documents_at_hand": ["challan_receipt"],
    "desired_outcome": "contest",
}

_MESSAGES = [
    {"role": "assistant", "content": "Hello! I'm NavyaSathi, your legal companion. I'll help you with your vehicle or traffic matter. To start, could you tell me what happened?", "timestamp": "2026-05-15T10:00:00Z"},
    {"role": "user", "content": "I got a challan for speeding near Banjara Hills, Hyderabad", "timestamp": "2026-05-15T10:01:00Z"},
    {"role": "assistant", "content": "Could you share your vehicle's registration number?", "timestamp": "2026-05-15T10:01:15Z"},
    {"role": "user", "content": "TS09EA1234", "timestamp": "2026-05-15T10:01:45Z"},
    {"role": "assistant", "content": "Is your driving licence currently valid, expired, or suspended?", "timestamp": "2026-05-15T10:02:00Z"},
    {"role": "user", "content": "It's valid", "timestamp": "2026-05-15T10:02:20Z"},
    {"role": "assistant", "content": "What is the fine amount on the challan?", "timestamp": "2026-05-15T10:02:35Z"},
    {"role": "user", "content": "1000 rupees", "timestamp": "2026-05-15T10:03:00Z"},
    {"role": "assistant", "content": "Which section or offence is mentioned?", "timestamp": "2026-05-15T10:03:15Z"},
    {"role": "user", "content": "Section 183 MV Act, speeding", "timestamp": "2026-05-15T10:03:45Z"},
    {"role": "assistant", "content": "Which documents do you have — RC book, insurance, driving licence, PUC, or the challan receipt?", "timestamp": "2026-05-15T10:04:00Z"},
    {"role": "user", "content": "I have the challan receipt", "timestamp": "2026-05-15T10:04:30Z"},
    {"role": "assistant", "content": "Would you like to pay and close it, contest the challan, or understand your options first?", "timestamp": "2026-05-15T10:04:45Z"},
    {"role": "user", "content": "I want to contest it", "timestamp": "2026-05-15T10:05:10Z"},
    {"role": "assistant", "content": "I've recorded everything. You received a speeding challan (Section 183, MV Act) near Banjara Hills for ₹1,000 and want to contest it. Vehicle: TS09EA1234, licence: valid. Your Case Workspace is ready — upload documents and download a draft representation letter.", "timestamp": "2026-05-15T10:05:25Z"},
]

_EXPIRED_DOC = {
    "policy_number": "POL2024INS99345",
    "insurer_name": "Star Health & Allied Insurance",
    "vehicle_reg": "TS09EA1234",
    "insured_name": "Ravi Kumar",
    "policy_start": "2024-01-15",
    "policy_expiry": "2024-12-31",
    "vehicle_type": "Motorcycle",
    "confidence": "high",
}


def _reset(db: Client) -> str:
    existing = db.table("cases").select("id").eq("code", _DEMO_CODE).execute()
    if existing.data:
        db.table("cases").delete().eq("code", _DEMO_CODE).execute()

    case_res = db.table("cases").insert({
        "code": _DEMO_CODE,
        "domain": "vehicle_traffic",
        "language": "en",
        "status": "pending_docs",
        "slots": _SLOTS,
        "messages": _MESSAGES,
        "alerts": [],
    }).execute()
    case_id = case_res.data[0]["id"]

    doc_res = db.table("document_records").insert({
        "case_id": case_id,
        "document_type": "insurance",
        "extracted_fields": _EXPIRED_DOC,
        "validity_status": "expired",
        "expiry_date": "2024-12-31",
    }).execute()
    doc_id = doc_res.data[0]["id"]

    alert = {
        "id": "demo-alert-001",
        "type": "document_expired",
        "message": (
            "Your vehicle insurance has expired (Policy Expiry: 31 Dec 2024). "
            "Expired insurance is an offence under the Motor Vehicles Act. "
            "Please renew immediately before driving."
        ),
        "document_id": doc_id,
        "created_at": "2026-01-15T02:00:00Z",
        "dismissed": False,
    }
    db.table("cases").update({"alerts": [alert]}).eq("code", _DEMO_CODE).execute()

    return _DEMO_CODE


@router.post("/reset")
def demo_reset(request: Request, db: Client = Depends(get_supabase)):
    s = get_settings()
    if not s.demo_secret:
        raise HTTPException(404)
    auth = request.headers.get("Authorization", "")
    if auth != f"Bearer {s.demo_secret}":
        raise HTTPException(404)

    code = _reset(db)
    return {"case_code": code, "url": f"/case/{code}"}
