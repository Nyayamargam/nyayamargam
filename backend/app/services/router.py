"""
NavyaSathi — Intake Router
==========================
Classifies a citizen's free-text problem into ONE route, then dispatches.

Design rules baked in:
  1. The LLM CLASSIFIES ONLY. It never answers, advises, or reassures — a later
     stage does that. This keeps the "never guess procedure" guarantee intact.
  2. EMERGENCY is detected first and fast-pathed straight to a helpline. No intake
     funnel for time-critical or safety situations.
  3. Legal DISPUTES (criminal/civil merits) are separated from procedural SERVICES.
     The legal route connects people to FREE legal aid, never to AI legal strategy.
  4. Amber (SERVICE_GROUNDED) answers must be backed by an ALLOWLISTED official
     source or they degrade to OUT_OF_SCOPE. A blog citation counts as no citation.
"""

from __future__ import annotations
from enum import Enum
from typing import Optional
from urllib.parse import urlparse

from groq import AsyncGroq
from pydantic import BaseModel, Field

from app.config import get_settings


# ---------------------------------------------------------------------------
# 1. THE CLASSIFIER SYSTEM PROMPT
# ---------------------------------------------------------------------------

ROUTER_SYSTEM_PROMPT = """\
You are the intake router for NavyaSathi, an assistant that helps Indian citizens \
navigate government processes. Your ONLY job is to CLASSIFY a citizen's problem \
into one route. You do NOT answer the problem, give procedure or steps, give legal \
advice, predict outcomes, or reassure — a later stage handles that. You output one \
JSON object and nothing else.

## What you receive
A citizen's problem in their own words. It may be in English, Hindi, Telugu, or a \
natural code-switched mix (e.g. Telugu-English). Understand all of these equally.

## Route types — choose EXACTLY ONE

EMERGENCY
  The situation is time-critical or involves safety. These must reach a helpline \
  NOW, not a question funnel. Use EMERGENCY when the message indicates any of:
    - Financial fraud that is happening now or just happened (money debited, \
      account drained, UPI/OTP/link scam, just shared an OTP) — funds can still be \
      frozen, so speed is protective.
    - A threat to physical safety (violence, domestic abuse, threats to life, \
      someone in immediate danger).
    - A child being harmed or in danger.
    - The person expressing intent to harm themselves, or in acute distress/crisis.
    - Any other life-safety emergency.
  Also set "emergency_type" (one of: financial_fraud, physical_safety, \
  domestic_violence, child_safety, self_harm_or_crisis, other).

SERVICE_VERIFIED
  A routine government service or process in one of the three fully-supported \
  domains: vehicle/traffic, pension/welfare, utility/consumer. Set "domain".

SERVICE_GROUNDED
  A government service or process OUTSIDE the three verified domains, but still a \
  procedural "how do I apply / report / obtain X" matter that an official source \
  can ground. Examples: scholarships, government scheme discovery or eligibility, \
  obtaining a certificate, formally reporting a past scam, filing a consumer \
  complaint about a purchase. Set "domain" to a short label (e.g. "scholarship").

LEGAL_NAVIGATOR
  A criminal or civil legal DISPUTE where the person needs legal help, not a \
  government form. Examples: charged with or accused of an offence, arrested, an \
  ongoing court case, a property/inheritance/contract dispute, being sued. Route \
  here so the next stage can give the procedural on-ramp (e.g. how to obtain an \
  FIR copy, which forum has jurisdiction) AND connect them to FREE legal aid \
  (NALSA / District Legal Services Authority). The next stage must NEVER give legal \
  strategy, assess the merits, or predict who will win — you only route.

OUT_OF_SCOPE
  Not a government/civic matter at all, or a civic matter with no groundable \
  official source. The next stage states uncertainty and gives a general helpline.

## Distinguishing the confusable cases (read carefully)
  - "Report a crime / file a complaint / get a document" = a SERVICE (procedural). \
    "Defend me / will I win / what is my defence / should I plead guilty" = \
    LEGAL_NAVIGATOR (a dispute). If a message contains both, choose LEGAL_NAVIGATOR.
  - Financial fraud happening now or just now = EMERGENCY (act fast). A past scam \
    the person now wants to formally report = SERVICE_GROUNDED. If you cannot tell \
    whether it is live, prefer EMERGENCY — speed protects the citizen.
  - Widow pension, disability pension, ration card = SERVICE_VERIFIED (welfare). \
    "Which scheme am I eligible for?" in general = SERVICE_GROUNDED.
  - A consumer being cheated by a seller = SERVICE_GROUNDED (consumer complaint), \
    NOT LEGAL_NAVIGATOR, unless it has become an actual court case.

## Confidence and clarification
Give "confidence" from 0.0 to 1.0 for your chosen route. If the problem is \
genuinely ambiguous between routes AND it is not an emergency, set \
"needs_clarification" to true and put ONE short, plain-language question in \
"clarifying_question" that would resolve the ambiguity. NEVER ask a clarifying \
question for an EMERGENCY — route it immediately.

## Hard rules
  - Classify only. Never write steps, procedure, advice, legal opinion, or \
    reassurance in any field. "reasoning" is a brief internal note, not user-facing.
  - Never invent a domain to force a match. If it is not groundable, use \
    OUT_OF_SCOPE.
  - If a message mixes an emergency with anything else, EMERGENCY wins.
  - Detect the citizen's language and return it in "language" (en, hi, te, or mixed).
  - Output ONLY the JSON object — no preface, no explanation, no markdown fences.

## Output JSON schema
{
  "route": "EMERGENCY | SERVICE_VERIFIED | SERVICE_GROUNDED | LEGAL_NAVIGATOR | OUT_OF_SCOPE",
  "domain": "short label or null",
  "emergency_type": "financial_fraud | physical_safety | domestic_violence | child_safety | self_harm_or_crisis | other | null",
  "confidence": 0.0,
  "needs_clarification": false,
  "clarifying_question": "string or null",
  "language": "en | hi | te | mixed",
  "reasoning": "one short internal sentence, never shown to the user"
}

## Examples

Input: "Someone just took 40000 from my account, I clicked a link and shared OTP"
Output: {"route":"EMERGENCY","domain":null,"emergency_type":"financial_fraud","confidence":0.97,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Live financial fraud, funds may still be recoverable."}

Input: "Naa bike ni traffic police seize chesaru, ela release cheyyali"
Output: {"route":"SERVICE_VERIFIED","domain":"vehicle_traffic","emergency_type":null,"confidence":0.9,"needs_clarification":false,"clarifying_question":null,"language":"mixed","reasoning":"Vehicle seizure, a verified domain."}

Input: "How do I apply for the post-matric scholarship for my son"
Output: {"route":"SERVICE_GROUNDED","domain":"scholarship","emergency_type":null,"confidence":0.88,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Scholarship application, groundable via official portal."}

Input: "An online shop took my money and never sent the product"
Output: {"route":"SERVICE_GROUNDED","domain":"consumer_complaint","emergency_type":null,"confidence":0.85,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Consumer grievance, procedural complaint path."}

Input: "Police have filed a case against me for theft, what should I do"
Output: {"route":"LEGAL_NAVIGATOR","domain":"criminal","emergency_type":null,"confidence":0.9,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Criminal dispute; route to legal aid, not advice."}

Input: "My brother took the whole property and gave me nothing"
Output: {"route":"LEGAL_NAVIGATOR","domain":"civil_property","emergency_type":null,"confidence":0.8,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Civil property dispute; needs legal aid, not a form."}

Input: "I need help"
Output: {"route":"OUT_OF_SCOPE","domain":null,"emergency_type":null,"confidence":0.3,"needs_clarification":true,"clarifying_question":"What is the problem you need help with — for example a fine, a pension, a scholarship, or a complaint?","language":"en","reasoning":"Too vague to route; ask one clarifier."}

Input: "Write me a poem about the sea"
Output: {"route":"OUT_OF_SCOPE","domain":null,"emergency_type":null,"confidence":0.95,"needs_clarification":false,"clarifying_question":null,"language":"en","reasoning":"Not a government/civic matter."}
"""


# ---------------------------------------------------------------------------
# 2. STRUCTURED OUTPUT SCHEMA
# ---------------------------------------------------------------------------

class Route(str, Enum):
    EMERGENCY = "EMERGENCY"
    SERVICE_VERIFIED = "SERVICE_VERIFIED"
    SERVICE_GROUNDED = "SERVICE_GROUNDED"
    LEGAL_NAVIGATOR = "LEGAL_NAVIGATOR"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


class EmergencyType(str, Enum):
    financial_fraud = "financial_fraud"
    physical_safety = "physical_safety"
    domestic_violence = "domestic_violence"
    child_safety = "child_safety"
    self_harm_or_crisis = "self_harm_or_crisis"
    other = "other"


class RouterResult(BaseModel):
    route: Route
    domain: Optional[str] = None
    emergency_type: Optional[EmergencyType] = None
    confidence: float = Field(ge=0.0, le=1.0)
    needs_clarification: bool = False
    clarifying_question: Optional[str] = None
    language: str = "en"
    reasoning: str = ""  # internal only — never surface to the user


# ---------------------------------------------------------------------------
# 3. HELPLINES + OFFICIAL-SOURCE ALLOWLIST
# ---------------------------------------------------------------------------

HELPLINES = {
    EmergencyType.financial_fraud:     {"number": "1930",  "name": "Cyber Crime / Financial Fraud Helpline"},
    EmergencyType.physical_safety:     {"number": "112",   "name": "National Emergency Number"},
    EmergencyType.domestic_violence:   {"number": "181",   "name": "Women Helpline"},
    EmergencyType.child_safety:        {"number": "1098",  "name": "Childline"},
    EmergencyType.self_harm_or_crisis: {"number": "14416", "name": "Tele-MANAS Mental Health Helpline"},
    EmergencyType.other:               {"number": "112",   "name": "National Emergency Number"},
}

OFFICIAL_ALLOWLIST = (
    ".gov.in",
    ".nic.in",
    "india.gov.in",
    "myscheme.gov.in",
    "scholarships.gov.in",
    "cybercrime.gov.in",
    "consumerhelpline.gov.in",
    "nalsa.gov.in",
    "ecourts.gov.in",
)

LEGAL_AID = {
    "name": "Free legal aid via NALSA / District Legal Services Authority (DLSA)",
    "portal": "https://nalsa.gov.in",
    "note": "Eligible citizens (incl. women, children, SC/ST, low-income) get a free lawyer.",
}

# Maps LLM domain labels → case domain codes used by the DB
_DOMAIN_MAP = {
    "vehicle": "vehicle_traffic",
    "vehicle_traffic": "vehicle_traffic",
    "traffic": "vehicle_traffic",
    "challan": "vehicle_traffic",
    "pension": "pension_welfare",
    "pension_welfare": "pension_welfare",
    "welfare": "pension_welfare",
    "consumer": "utility_consumer",
    "utility_consumer": "utility_consumer",
    "utility": "utility_consumer",
    "electricity": "utility_consumer",
}


def is_official_source(url: str) -> bool:
    """True only if the URL's host is on the government allowlist."""
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return any(host == s.lstrip(".") or host.endswith(s) for s in OFFICIAL_ALLOWLIST)


# ---------------------------------------------------------------------------
# 4. CLASSIFY  (async, Groq-native)
# ---------------------------------------------------------------------------

async def classify(problem_text: str) -> RouterResult:
    """Send the free-text problem to Groq and return a validated RouterResult."""
    s = get_settings()
    client = AsyncGroq(api_key=s.groq_api_key)
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
            {"role": "user", "content": problem_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    raw = response.choices[0].message.content or "{}"
    return RouterResult.model_validate_json(raw)


# ---------------------------------------------------------------------------
# 5. DISPATCH  (turn a RouterResult into the next action)
# ---------------------------------------------------------------------------

def dispatch(result: RouterResult) -> dict:
    """
    Returns a dict describing what the app should do next.
    The app layer renders this; the answer stage only runs for grounded routes.
    """
    if result.route is Route.EMERGENCY:
        etype = result.emergency_type or EmergencyType.other
        return {
            "action": "SHOW_HELPLINE_NOW",
            "skip_intake": True,
            "helpline": HELPLINES[etype],
            "emergency_type": etype.value,
            "language": result.language,
            "message_key": f"emergency.{etype.value}",
        }

    if result.needs_clarification and result.clarifying_question:
        return {
            "action": "ASK_CLARIFYING_QUESTION",
            "question": result.clarifying_question,
            "language": result.language,
        }

    if result.route is Route.SERVICE_VERIFIED:
        normalized = _DOMAIN_MAP.get(result.domain or "", result.domain)
        return {
            "action": "START_INTAKE",
            "tier": "GREEN",
            "domain": normalized,
            "language": result.language,
        }

    if result.route is Route.SERVICE_GROUNDED:
        return {
            "action": "START_GROUNDED_INTAKE",
            "tier": "AMBER",
            "domain": result.domain,
            "require_official_source": True,
            "unverified_disclaimer": True,
            "language": result.language,
        }

    if result.route is Route.LEGAL_NAVIGATOR:
        return {
            "action": "LEGAL_NAVIGATOR",
            "domain": result.domain,
            "legal_aid": LEGAL_AID,
            "no_advice": True,
            "language": result.language,
        }

    return {
        "action": "OUT_OF_SCOPE_FALLBACK",
        "general_helpline": {"number": "112", "name": "National Emergency Number"},
        "log_for_prioritisation": True,
        "language": result.language,
    }
