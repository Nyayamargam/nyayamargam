from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class CaseStatus(str, Enum):
    INTAKE = "intake"
    PENDING_DOCS = "pending_docs"
    READY = "ready"
    CLOSED = "closed"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Message(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CreateCaseRequest(BaseModel):
    language: str = "en"


class CreateCaseResponse(BaseModel):
    code: str
    status: CaseStatus
    first_message: str


class SendMessageRequest(BaseModel):
    content: str
    language: str | None = None


class SendMessageResponse(BaseModel):
    reply: str
    reasoning: str = ""
    status: CaseStatus
    slots_filled: dict[str, Any]
    intake_complete: bool = False
