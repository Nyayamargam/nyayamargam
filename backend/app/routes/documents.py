from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from supabase import Client

from app.db.supabase import get_supabase
from app.models.document import DocumentRecord
from app.services.document_intelligence import extract_document_fields

router = APIRouter(prefix="/case", tags=["documents"])

_ALLOWED = {"rc_book", "insurance", "dl", "puc", "challan_receipt"}
_MAX_BYTES = 10 * 1024 * 1024


@router.post("/{code}/document", response_model=DocumentRecord, status_code=201)
async def upload_document(
    code: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    db: Client = Depends(get_supabase),
):
    if document_type not in _ALLOWED:
        raise HTTPException(400, f"document_type must be one of: {', '.join(sorted(_ALLOWED))}")

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_BYTES:
        raise HTTPException(413, "File exceeds 10 MB limit")

    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(415, "Only image files are accepted")

    result = db.table("cases").select("id").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    case_id = result.data[0]["id"]

    extracted_fields, validity_status, expiry_date = await extract_document_fields(
        image_bytes, content_type, document_type
    )

    row = {
        "case_id": case_id,
        "document_type": document_type,
        "extracted_fields": extracted_fields,
        "validity_status": validity_status,
        "expiry_date": expiry_date.isoformat() if expiry_date else None,
    }
    inserted = db.table("document_records").insert(row).execute()
    rec = inserted.data[0]

    return DocumentRecord(
        id=rec["id"],
        document_type=rec["document_type"],
        extracted_fields=rec["extracted_fields"],
        validity_status=rec["validity_status"],
        expiry_date=rec.get("expiry_date"),
        uploaded_at=rec["uploaded_at"],
    )


@router.get("/{code}/documents")
async def list_documents(code: str, db: Client = Depends(get_supabase)):
    result = db.table("cases").select("id").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    case_id = result.data[0]["id"]

    docs = (
        db.table("document_records")
        .select("*")
        .eq("case_id", case_id)
        .order("uploaded_at")
        .execute()
    )
    return docs.data
