"""
Seed the DEMO01 demo case — run once before a demo or pitch.

Usage:
    cd backend
    python scripts/seed_demo.py

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment
(or from ./backend/.env if python-dotenv is available).
"""

from __future__ import annotations

import json
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.")

db = create_client(SUPABASE_URL, SERVICE_KEY)

DEMO_CODE = "DEMO01"

DEMO_MESSAGES = [
    {
        "role": "assistant",
        "content": (
            "Hello! I'm NavyaSathi, your legal companion. I'll help you with your vehicle "
            "or traffic matter. To start, could you tell me what happened — for example, did "
            "you receive a challan, was your vehicle seized, or is there something else going on?"
        ),
        "timestamp": "2026-05-15T10:00:00Z",
    },
    {
        "role": "user",
        "content": "I got a challan for speeding near Banjara Hills, Hyderabad",
        "timestamp": "2026-05-15T10:01:00Z",
    },
    {
        "role": "assistant",
        "content": (
            "I understand — that's stressful. Could you share your vehicle's registration number? "
            "It's usually in the format XX00XX0000."
        ),
        "timestamp": "2026-05-15T10:01:15Z",
    },
    {
        "role": "user",
        "content": "TS09EA1234",
        "timestamp": "2026-05-15T10:01:45Z",
    },
    {
        "role": "assistant",
        "content": (
            "Thank you. Is your driving licence currently valid, expired, or suspended?"
        ),
        "timestamp": "2026-05-15T10:02:00Z",
    },
    {
        "role": "user",
        "content": "It's valid",
        "timestamp": "2026-05-15T10:02:20Z",
    },
    {
        "role": "assistant",
        "content": "Good. What is the fine amount written on the challan?",
        "timestamp": "2026-05-15T10:02:35Z",
    },
    {
        "role": "user",
        "content": "1000 rupees",
        "timestamp": "2026-05-15T10:03:00Z",
    },
    {
        "role": "assistant",
        "content": (
            "₹1,000 noted. Which section or offence is mentioned on the challan? "
            "It might say something like 'Section 183 MV Act'."
        ),
        "timestamp": "2026-05-15T10:03:15Z",
    },
    {
        "role": "user",
        "content": "Section 183 MV Act, speeding",
        "timestamp": "2026-05-15T10:03:45Z",
    },
    {
        "role": "assistant",
        "content": (
            "Understood. Which documents do you currently have with you — RC book, "
            "insurance, driving licence, PUC certificate, or the challan receipt?"
        ),
        "timestamp": "2026-05-15T10:04:00Z",
    },
    {
        "role": "user",
        "content": "I have the challan receipt",
        "timestamp": "2026-05-15T10:04:30Z",
    },
    {
        "role": "assistant",
        "content": (
            "What would you like to do — pay and close the challan, contest it, "
            "or understand your options first?"
        ),
        "timestamp": "2026-05-15T10:04:45Z",
    },
    {
        "role": "user",
        "content": "I want to contest it",
        "timestamp": "2026-05-15T10:05:10Z",
    },
    {
        "role": "assistant",
        "content": (
            "I've recorded everything for your case. You received a speeding challan "
            "(Section 183, MV Act) near Banjara Hills, Hyderabad for ₹1,000, and you'd "
            "like to contest it. Your vehicle is TS09EA1234 and your driving licence is "
            "valid. Your Case Workspace is ready — you can upload supporting documents "
            "and download a draft representation letter from there."
        ),
        "timestamp": "2026-05-15T10:05:25Z",
    },
]

DEMO_SLOTS = {
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

EXPIRED_DOC_FIELDS = {
    "policy_number": "POL2024INS99345",
    "insurer_name": "Star Health & Allied Insurance",
    "vehicle_reg": "TS09EA1234",
    "insured_name": "Ravi Kumar",
    "policy_start": "2024-01-15",
    "policy_expiry": "2024-12-31",
    "vehicle_type": "Motorcycle",
    "confidence": "high",
}


def seed() -> str:
    # ── Delete existing demo case (cascades to documents) ──────────────────────
    existing = db.table("cases").select("id").eq("code", DEMO_CODE).execute()
    if existing.data:
        db.table("cases").delete().eq("code", DEMO_CODE).execute()
        print(f"Deleted existing {DEMO_CODE} case.")

    # ── Insert demo case ───────────────────────────────────────────────────────
    case_result = db.table("cases").insert({
        "code": DEMO_CODE,
        "domain": "vehicle_traffic",
        "language": "en",
        "status": "pending_docs",
        "slots": DEMO_SLOTS,
        "messages": DEMO_MESSAGES,
        "alerts": [],
    }).execute()
    case_id = case_result.data[0]["id"]
    print(f"Created demo case: {DEMO_CODE} (id: {case_id})")

    # ── Insert expired insurance document ─────────────────────────────────────
    doc_result = db.table("document_records").insert({
        "case_id": case_id,
        "document_type": "insurance",
        "extracted_fields": EXPIRED_DOC_FIELDS,
        "validity_status": "expired",
        "expiry_date": "2024-12-31",
    }).execute()
    doc_id = doc_result.data[0]["id"]
    print(f"Inserted expired insurance doc (id: {doc_id})")

    # ── Inject the expiry alert ────────────────────────────────────────────────
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
    db.table("cases").update({"alerts": [alert]}).eq("code", DEMO_CODE).execute()
    print("Injected expiry alert.")

    return DEMO_CODE


if __name__ == "__main__":
    code = seed()
    print(f"\n✓ Demo ready — open the app and enter case code: {code}")
    print(f"  Or navigate directly to: /case/{code}")
