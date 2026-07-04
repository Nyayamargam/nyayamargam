from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class DocumentRecord(BaseModel):
    id: str
    document_type: str
    extracted_fields: dict[str, Any]
    validity_status: str
    expiry_date: date | None
    uploaded_at: datetime
    rejection_explanation: dict[str, Any] | None = None
