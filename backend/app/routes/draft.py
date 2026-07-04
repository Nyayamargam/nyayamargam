from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from supabase import Client

from app.db.supabase import get_supabase
from app.services.pdf_draft import generate_draft_pdf

router = APIRouter(prefix="/case", tags=["draft"])


@router.get("/{code}/draft.pdf")
async def download_draft(code: str, db: Client = Depends(get_supabase)):
    result = db.table("cases").select("*").eq("code", code.upper()).execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    case = result.data[0]

    if case.get("status") == "intake":
        raise HTTPException(400, "Draft is not available until intake is complete")

    try:
        pdf_bytes = generate_draft_pdf(case)
    except Exception as exc:
        raise HTTPException(500, f"PDF generation failed: {exc}") from exc

    filename = f"navyasathi-{code.lower()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
