
from __future__ import annotations

import json
import logging
from datetime import date

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

_EXTRACT_PROMPT: dict[str, str] = {
    "rc_book": (
        "Extract every readable field from this RC (Registration Certificate) document image. "
        "Return ONLY valid JSON with this exact schema — use null for fields you cannot read:\n"
        '{"vehicle_reg_number":null,"owner_name":null,"registration_date":null,'
        '"validity_upto":null,"vehicle_class":null,"engine_number":null,'
        '"chassis_number":null,"confidence":"high"}\n'
        "Dates as YYYY-MM-DD. confidence: high=all key fields clear, medium=some unclear, low=image unreadable."
    ),
    "insurance": (
        "Extract every readable field from this vehicle insurance certificate image. "
        "Return ONLY valid JSON with this exact schema — use null for fields you cannot read:\n"
        '{"policy_number":null,"insurer_name":null,"vehicle_reg":null,"insured_name":null,'
        '"policy_start":null,"policy_expiry":null,"vehicle_type":null,"confidence":"high"}\n'
        "Dates as YYYY-MM-DD."
    ),
    "dl": (
        "Extract every readable field from this Driving Licence image. "
        "Return ONLY valid JSON with this exact schema — use null for fields you cannot read:\n"
        '{"dl_number":null,"holder_name":null,"dob":null,"valid_from":null,"valid_to":null,'
        '"vehicle_classes":null,"issuing_authority":null,"confidence":"high"}\n'
        "Dates as YYYY-MM-DD."
    ),
    "puc": (
        "Extract every readable field from this PUC (Pollution Under Control) certificate image. "
        "Return ONLY valid JSON with this exact schema — use null for fields you cannot read:\n"
        '{"vehicle_reg":null,"certificate_number":null,"test_date":null,"valid_upto":null,'
        '"testing_centre":null,"confidence":"high"}\n'
        "Dates as YYYY-MM-DD."
    ),
    "challan_receipt": (
        "Extract every readable field from this traffic challan receipt image. "
        "Return ONLY valid JSON with this exact schema — use null for fields you cannot read:\n"
        '{"vehicle_reg":null,"challan_number":null,"offence_date":null,"offence_section":null,'
        '"fine_amount":null,"court_date":null,"issuing_authority":null,"confidence":"high"}\n'
        "Dates as YYYY-MM-DD. fine_amount as a number."
    ),
}

# Field that carries the expiry date for each document type; None = no expiry concept
_EXPIRY_FIELD: dict[str, str | None] = {
    "rc_book": "validity_upto",
    "insurance": "policy_expiry",
    "dl": "valid_to",
    "puc": "valid_upto",
    "challan_receipt": None,
}


def _assess_validity(document_type: str, fields: dict) -> tuple[str, date | None]:
    if fields.get("confidence") == "low":
        return "needs_review", None

    expiry_field = _EXPIRY_FIELD.get(document_type)
    if not expiry_field:
        return "valid", None

    raw = fields.get(expiry_field)
    if not raw:
        return "needs_review", None

    try:
        expiry = date.fromisoformat(str(raw))
    except ValueError:
        return "needs_review", None

    return ("expired" if expiry < date.today() else "valid"), expiry


async def extract_document_fields(
    image_bytes: bytes,
    content_type: str,
    document_type: str,
) -> tuple[dict, str, date | None]:
    """Return (extracted_fields, validity_status, expiry_date)."""
    s = get_settings()
    prompt = _EXTRACT_PROMPT.get(document_type, _EXTRACT_PROMPT["rc_book"])

    try:
        client = genai.Client(api_key=s.gemini_api_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                types.Part(text=prompt),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        fields: dict = json.loads(response.text)
    except Exception as exc:
        logger.error("Document extraction failed: %s", exc)
        return {}, "needs_review", None

    validity_status, expiry_date = _assess_validity(document_type, fields)
    return fields, validity_status, expiry_date
