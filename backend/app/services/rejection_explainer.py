from __future__ import annotations

import json
import logging

from groq import AsyncGroq

from app.config import get_settings
from app.services.rag import get_rag_context

logger = logging.getLogger(__name__)

_EXPLAIN_PROMPT = """\
You are NavyaSathi, a legal aid assistant helping an Indian citizen understand why their \
government application was rejected and what they should do next.

## Rejection slip fields (extracted via OCR)
{extracted_fields}

## Case context (what the user told us)
{slots}

## Relevant procedural knowledge
{knowledge_context}

## Your task
Produce a plain-language explanation that:
1. Explains in simple terms WHY the application was rejected (one short paragraph, no jargon).
2. Gives a clear, numbered action plan of 3-5 concrete steps the person can take to correct or \
   appeal the rejection.
3. If a specific rule/section is cited in the rejection, name it in plain language.

## Hard rules
- Write at the level of someone with a 10th-grade education.
- Do NOT fabricate legal citations not present in the OCR data or knowledge base.
- If the knowledge base says nothing specific about this rejection reason, say so honestly \
  and recommend visiting the issuing office.

## Output — return ONLY valid JSON
{{
  "reason_plain": "<1-2 sentence plain-language explanation of the rejection reason>",
  "action_plan": "<numbered list of 3-5 concrete next steps, separated by newlines>",
  "relevant_section": "<rule or section cited, or empty string if none>"
}}"""


async def explain_rejection(
    extracted_fields: dict,
    domain: str,
    slots: dict,
) -> dict:
    """Return {reason_plain, action_plan, relevant_section} for a rejection slip."""
    s = get_settings()

    rejection_reason = extracted_fields.get("rejection_reason") or "unspecified reason"
    knowledge_context = await get_rag_context(
        f"rejection reason: {rejection_reason}", domain
    )

    prompt = _EXPLAIN_PROMPT.format(
        extracted_fields=json.dumps(extracted_fields, ensure_ascii=False, indent=2),
        slots=json.dumps(slots, ensure_ascii=False, indent=2),
        knowledge_context=knowledge_context,
    )

    try:
        client = AsyncGroq(api_key=s.groq_api_key)
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        result = json.loads(response.choices[0].message.content)
        return {
            "reason_plain": result.get("reason_plain", ""),
            "action_plan": result.get("action_plan", ""),
            "relevant_section": result.get("relevant_section", ""),
        }
    except Exception as exc:
        logger.error("Rejection explainer failed: %s", exc)
        return {
            "reason_plain": (
                "We could not automatically analyse the rejection reason. "
                "Please read the slip carefully and visit the issuing office for clarification."
            ),
            "action_plan": (
                "1. Visit the office that issued the rejection.\n"
                "2. Ask for a written explanation of the rejection reason.\n"
                "3. Find out what documents or corrections are needed.\n"
                "4. Re-submit with the required corrections."
            ),
            "relevant_section": "",
        }
