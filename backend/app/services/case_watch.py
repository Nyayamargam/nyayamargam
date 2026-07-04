from __future__ import annotations

import json
import logging
from datetime import date, datetime
from uuid import uuid4

from app.config import get_settings
from app.db.supabase import get_supabase

logger = logging.getLogger(__name__)

_DOC_LABELS = {
    "rc_book": "RC Book",
    "insurance": "Insurance Certificate",
    "dl": "Driving Licence",
    "puc": "PUC Certificate",
    "challan_receipt": "Challan Receipt",
}

_EXPIRY_FIELD = {
    "rc_book": "validity_upto",
    "insurance": "policy_expiry",
    "dl": "valid_to",
    "puc": "valid_upto",
}

_EXPIRY_SOON_DAYS = 30


def _existing_alert_keys(alerts: list[dict]) -> set[tuple[str, str]]:
    """Return (document_id, type) pairs for all undismissed alerts."""
    return {
        (a["document_id"], a["type"])
        for a in alerts
        if not a.get("dismissed") and "document_id" in a
    }


def _evaluate_case(case: dict, docs: list[dict]) -> list[dict]:
    existing = _existing_alert_keys(case.get("alerts") or [])
    new_alerts: list[dict] = []
    today = date.today()

    for doc in docs:
        doc_id = doc["id"]
        doc_type = doc.get("document_type", "")
        label = _DOC_LABELS.get(doc_type, doc_type.replace("_", " ").title())

        raw_expiry = None
        # Try the extracted_fields expiry first, then the stored expiry_date
        expiry_field = _EXPIRY_FIELD.get(doc_type)
        if expiry_field:
            raw_expiry = (doc.get("extracted_fields") or {}).get(expiry_field)
        if not raw_expiry:
            raw_expiry = doc.get("expiry_date")

        if not raw_expiry:
            continue

        try:
            expiry = date.fromisoformat(str(raw_expiry))
        except ValueError:
            continue

        if expiry < today:
            key = (doc_id, "document_expired")
            if key not in existing:
                new_alerts.append({
                    "id": str(uuid4()),
                    "type": "document_expired",
                    "document_id": doc_id,
                    "message": (
                        f"Your {label} expired on {expiry.strftime('%d %B %Y')}. "
                        "Please renew it before driving or submitting any application."
                    ),
                    "created_at": datetime.utcnow().isoformat(),
                    "dismissed": False,
                })
        elif (expiry - today).days <= _EXPIRY_SOON_DAYS:
            key = (doc_id, "document_expiring_soon")
            if key not in existing:
                days_left = (expiry - today).days
                new_alerts.append({
                    "id": str(uuid4()),
                    "type": "document_expiring_soon",
                    "document_id": doc_id,
                    "message": (
                        f"Your {label} will expire on {expiry.strftime('%d %B %Y')} "
                        f"({days_left} day{'s' if days_left != 1 else ''} from now). "
                        "Renew it before it lapses."
                    ),
                    "created_at": datetime.utcnow().isoformat(),
                    "dismissed": False,
                })

    return new_alerts


def _send_push(subscription: dict, case_code: str, alerts: list[dict]) -> None:
    s = get_settings()
    if not s.vapid_private_key or not s.vapid_public_key:
        return
    try:
        from pywebpush import WebPushException, webpush  # type: ignore[import]

        body = alerts[0]["message"] if len(alerts) == 1 else f"{len(alerts)} new alerts for case #{case_code}"
        webpush(
            subscription_info=subscription,
            data=json.dumps({
                "title": "NavyaSathi Alert",
                "body": body,
                "case_code": case_code,
            }),
            vapid_private_key=s.vapid_private_key,
            vapid_claims={"sub": "mailto:info@navyasathi.in"},
        )
    except Exception as exc:
        logger.warning("Push failed for case %s: %s", case_code, exc)


async def rescan_all_cases() -> dict:
    db = get_supabase()
    cases = db.table("cases").select("*").neq("status", "closed").execute().data or []

    scanned = alerted = errors = 0

    for case in cases:
        try:
            docs = (
                db.table("document_records")
                .select("*")
                .eq("case_id", case["id"])
                .execute()
                .data or []
            )
            new_alerts = _evaluate_case(case, docs)

            update: dict = {"last_rescanned_at": datetime.utcnow().isoformat()}
            if new_alerts:
                update["alerts"] = (case.get("alerts") or []) + new_alerts
                db.table("cases").update(update).eq("id", case["id"]).execute()

                if case.get("push_subscription"):
                    _send_push(case["push_subscription"], case["code"], new_alerts)
                alerted += 1
            else:
                db.table("cases").update(update).eq("id", case["id"]).execute()

            scanned += 1
        except Exception as exc:
            logger.error("Rescan error for case %s: %s", case.get("code"), exc)
            errors += 1

    return {"scanned": scanned, "alerted": alerted, "errors": errors}
