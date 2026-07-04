from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from supabase import Client

from app.config import get_settings
from app.db.supabase import get_supabase
from app.services.case_watch import rescan_all_cases

router = APIRouter(tags=["watch"])


# ── Internal: rescan endpoint called by GitHub Actions cron ──────────────────

@router.post("/internal/rescan")
async def trigger_rescan(
    request: Request,  # noqa: ARG001
    authorization: str | None = Header(default=None),
):
    s = get_settings()
    if not s.rescan_secret or authorization != f"Bearer {s.rescan_secret}":
        raise HTTPException(401, "Unauthorized")
    results = await rescan_all_cases()
    return results


# ── Case-level watch endpoints ────────────────────────────────────────────────

@router.post("/case/{code}/push-subscription", status_code=204)
async def save_push_subscription(
    code: str,
    body: dict,
    db: Client = Depends(get_supabase),
):
    result = db.table("cases").select("id").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    db.table("cases").update({"push_subscription": body}).eq("code", code.upper()).execute()


@router.post("/case/{code}/close")
async def close_case(code: str, db: Client = Depends(get_supabase)):
    result = db.table("cases").select("id").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    db.table("cases").update({"status": "closed"}).eq("code", code.upper()).execute()
    return {"status": "closed"}


@router.post("/case/{code}/alerts/{alert_id}/dismiss")
async def dismiss_alert(code: str, alert_id: str, db: Client = Depends(get_supabase)):
    result = db.table("cases").select("id", "alerts").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    case = result.data[0]
    updated = [
        {**a, "dismissed": True} if a.get("id") == alert_id else a
        for a in (case.get("alerts") or [])
    ]
    db.table("cases").update({"alerts": updated}).eq("code", code.upper()).execute()
    return {"status": "ok"}
