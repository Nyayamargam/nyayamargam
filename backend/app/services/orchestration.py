from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

from app.config import get_settings
from app.services.knowledge import get_vehicle_traffic_context

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """\
You are NavyaSathi, a warm and trustworthy legal companion helping ordinary Indian citizens \
navigate government procedures. You are conducting an intake interview for a Vehicle / Traffic \
legal matter.

## Your one job
Collect the required case details by asking EXACTLY ONE question per turn. \
Never ask two questions in the same message. \
Never provide legal conclusions, court opinions, or definitive legal advice — \
only factual procedural information drawn from the knowledge base below.

## Language
Respond in language code: {language}
- "en" → English
- "hi" → Hindi (Devanagari script)
- "te" → Telugu (Telugu script)
If the user writes in a different language than specified, mirror their language for that reply.

## Slots already collected (JSON — DB is authoritative)
{filled_slots}

## Slots to collect, in this order
1. incident_type     — What happened? (values: challan / accident / vehicle_seized / licence_issue / rc_issue / other)
2. incident_date     — When did it happen? (store as YYYY-MM-DD)
3. incident_location — City, district, and state
4. rc_number         — Vehicle registration number (format: XX00XX0000)
5. dl_status         — Driving licence status (values: valid / expired / suspended / not_applicable)
6. fine_amount       — If a challan: fine amount in rupees (number)
7. offence_section   — Section/offence written on the challan ("unknown" is acceptable)
8. documents_at_hand — Which documents does the user currently have? \
(list any of: rc_book / insurance / dl / puc / challan_receipt / none)
9. desired_outcome   — What does the user want? \
(values: pay_and_close / contest / understand / other)

## Decision logic each turn
1. Inspect the filled_slots JSON. Find the FIRST slot whose value is null.
2. Ask only about that one slot, in plain conversational language. No bullet points in the reply.
3. Extract whatever the user answered and update ALL relevant slots — users often answer multiple at once.
4. If the user's answer is unclear, ask one clarifying sub-question before moving on.
5. When ALL 9 slots are non-null, set intake_complete to true and write a warm 2–3 sentence \
summary of what you've recorded, then tell the user you'll now prepare their Case Workspace.
6. If the user seems distressed, add one empathetic sentence before your question.

## Knowledge base (use ONLY this for procedural facts; never fabricate)
{knowledge_context}

## Hard rules
- NEVER include text marked "(INTERNAL)" or "Source note" in the reply field.
- NEVER fabricate a court date, fine amount, or legal outcome not stated by the user or knowledge base.
- NEVER ask more than one question per reply.
- NEVER use the words "slot", "intake", "JSON", "LLM", "AI", or any technical jargon with the user.
- The reply field must be warm conversational prose.

## Output format — return ONLY valid JSON, nothing else
{{
  "reply": "<your single question or summary in the correct language>",
  "slots": {{
    "incident_type": null,
    "incident_date": null,
    "incident_location": null,
    "rc_number": null,
    "dl_status": null,
    "fine_amount": null,
    "offence_section": null,
    "documents_at_hand": [],
    "desired_outcome": null
  }},
  "intake_complete": false
}}\
"""

OPENING_MESSAGES = {
    "en": "Hello! I'm NavyaSathi, your legal companion. I'll help you understand what to do about your vehicle or traffic matter. To start, could you tell me what happened — for example, did you receive a challan, was your vehicle seized, or is there something else going on?",
    "hi": "नमस्ते! मैं NavyaSathi हूँ, आपका कानूनी साथी। मैं आपकी वाहन या यातायात संबंधी समस्या में मदद करूँगा। शुरुआत करने के लिए, क्या आप बता सकते हैं कि क्या हुआ — उदाहरण के लिए, क्या आपको चालान मिला, वाहन जब्त हुआ, या कुछ और?",
    "te": "నమస్కారం! నేను NavyaSathi, మీ చట్టపరమైన సహచరుడిని. మీ వాహన లేదా ట్రాఫిక్ సమస్యలో నేను సహాయం చేస్తాను. మొదలు పెట్టడానికి, ఏమి జరిగిందో చెప్పగలరా — ఉదాహరణకు, చలాన్ వచ్చిందా, వాహనం జప్తు చేయబడిందా, లేదా మరేదైనా జరిగిందా?",
}


def _strip_markdown_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        # parts[1] is the fenced block content
        inner = parts[1] if len(parts) > 1 else raw
        if inner.startswith("json"):
            inner = inner[4:]
        return inner.strip()
    return raw


async def process_message(
    messages: list[dict],
    current_slots: dict,
    language: str,
) -> tuple[str, dict, bool]:
    s = get_settings()
    client = AsyncAnthropic(api_key=s.anthropic_api_key)

    filled_slots = json.dumps(current_slots, ensure_ascii=False, indent=2)
    knowledge_context = get_vehicle_traffic_context()

    system = SYSTEM_PROMPT_TEMPLATE.format(
        language=language,
        filled_slots=filled_slots,
        knowledge_context=knowledge_context,
    )

    claude_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m["role"] in ("user", "assistant")
    ]

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=system,
            messages=claude_messages,
        )
        raw = response.content[0].text
    except Exception as exc:
        logger.error("Claude API error: %s", exc)
        fallback = "I'm sorry, I had a technical issue. Could you please repeat what you said?"
        return fallback, current_slots, False

    raw = _strip_markdown_fence(raw)

    try:
        parsed = json.loads(raw)
        reply: str = parsed["reply"]
        new_slots: dict = parsed.get("slots", {})
        intake_complete: bool = bool(parsed.get("intake_complete", False))

        # Merge: keep existing non-null values; only update keys Claude returned
        merged = {**current_slots}
        for k, v in new_slots.items():
            if v is not None and v != [] and v != "":
                merged[k] = v

        return reply, merged, intake_complete

    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Failed to parse Claude JSON (%s). Raw: %.200s", exc, raw)
        return raw, current_slots, False


def get_opening_message(language: str) -> str:
    return OPENING_MESSAGES.get(language, OPENING_MESSAGES["en"])
