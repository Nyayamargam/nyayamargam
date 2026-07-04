from __future__ import annotations

import json
import logging

from groq import AsyncGroq

from app.config import get_settings
from app.services.rag import get_rag_context

logger = logging.getLogger(__name__)

# ── Domain configuration ──────────────────────────────────────────────────────

DOMAIN_CONFIG: dict[str, dict] = {
    "vehicle_traffic": {
        "display": "Vehicle / Traffic",
        "context": "vehicle or traffic legal matter (challan, accident, vehicle seizure, licence or RC issue)",
        "slots_definition": """\
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
(values: pay_and_close / contest / understand / other)""",
        "empty_slots": {
            "incident_type": None,
            "incident_date": None,
            "incident_location": None,
            "rc_number": None,
            "dl_status": None,
            "fine_amount": None,
            "offence_section": None,
            "documents_at_hand": [],
            "desired_outcome": None,
        },
    },

    "pension_welfare": {
        "display": "Pension / Welfare",
        "context": "government pension or welfare scheme matter (old-age pension, widow pension, disability pension, Ayushman Bharat, or other state welfare scheme)",
        "slots_definition": """\
1. scheme_type    — Which scheme or benefit? \
(values: old_age_pension / widow_pension / disability_pension / pmjay / state_scheme / other)
2. issue_type     — What is the problem? \
(values: not_applied / applied_waiting / payment_stopped / application_rejected / understand)
3. applicant_age  — Applicant's age in years (number)
4. location       — State and district
5. aadhaar_linked — Is Aadhaar linked to a bank account? (values: yes / no / unknown)
6. has_bank_account — Does the applicant have a bank account? (values: yes / no)
7. incident_date  — When did the issue start? (YYYY-MM-DD; approximate is fine)
8. documents_at_hand — Which documents are available? \
(list any of: aadhaar / ration_card / income_certificate / disability_certificate / bank_passbook / death_certificate / none)
9. desired_outcome — What does the user want? \
(values: apply_fresh / follow_up_existing / reactivate_stopped / understand / other)""",
        "empty_slots": {
            "scheme_type": None,
            "issue_type": None,
            "applicant_age": None,
            "location": None,
            "aadhaar_linked": None,
            "has_bank_account": None,
            "incident_date": None,
            "documents_at_hand": [],
            "desired_outcome": None,
        },
    },

    "utility_consumer": {
        "display": "Consumer / Utility",
        "context": "consumer complaint or utility service matter (electricity billing, power outage, water supply, defective product, or service deficiency)",
        "slots_definition": """\
1. complaint_type   — What is the issue? \
(values: electricity_billing / power_outage / water_supply / meter_issue / defective_product / service_deficiency / other)
2. provider_name    — Name of the company, utility provider, or service
3. incident_date    — When did the problem start? (YYYY-MM-DD)
4. location         — City and state
5. complaint_registered — Has a complaint already been filed with the company? (values: yes / no)
6. complaint_reference  — If yes, the complaint or ticket reference number ("none" if not applicable)
7. amount_disputed  — Amount in dispute in rupees (number; 0 if not a billing dispute)
8. documents_at_hand — Which documents are available? \
(list any of: bill / receipt / meter_photo / correspondence / warranty_card / none)
9. desired_outcome  — What does the user want? \
(values: refund / billing_correction / repair_restoration / compensation / escalate / understand)""",
        "empty_slots": {
            "complaint_type": None,
            "provider_name": None,
            "incident_date": None,
            "location": None,
            "complaint_registered": None,
            "complaint_reference": None,
            "amount_disputed": None,
            "documents_at_hand": [],
            "desired_outcome": None,
        },
    },
}

# ── Opening messages ──────────────────────────────────────────────────────────

OPENING_MESSAGES: dict[str, dict[str, str]] = {
    "vehicle_traffic": {
        "en": (
            "Hello! I'm NavyaSathi, your legal companion. I'll help you with your vehicle or traffic matter. "
            "To start, could you tell me what happened — for example, did you receive a challan, "
            "was your vehicle seized, or is there something else going on?"
        ),
        "hi": (
            "नमस्ते! मैं NavyaSathi हूँ, आपका कानूनी साथी। मैं आपकी वाहन या यातायात संबंधी समस्या में मदद करूँगा। "
            "शुरुआत करने के लिए, क्या आप बता सकते हैं कि क्या हुआ — उदाहरण के लिए, क्या आपको चालान मिला, "
            "वाहन जब्त हुआ, या कुछ और?"
        ),
        "te": (
            "నమస్కారం! నేను NavyaSathi, మీ చట్టపరమైన సహచరుడిని. మీ వాహన లేదా ట్రాఫిక్ సమస్యలో నేను సహాయం చేస్తాను. "
            "మొదలు పెట్టడానికి, ఏమి జరిగిందో చెప్పగలరా — ఉదాహరణకు, చలాన్ వచ్చిందా, వాహనం జప్తు చేయబడిందా, "
            "లేదా మరేదైనా జరిగిందా?"
        ),
    },
    "pension_welfare": {
        "en": (
            "Hello! I'm NavyaSathi, your legal companion. I'll help you with your pension or welfare scheme matter. "
            "To start, could you tell me which scheme or benefit you're dealing with — "
            "for example, old age pension, widow pension, disability pension, or Ayushman Bharat health cover?"
        ),
        "hi": (
            "नमस्ते! मैं NavyaSathi हूँ, आपका कानूनी साथी। मैं आपकी पेंशन या कल्याण योजना संबंधी समस्या में मदद करूँगा। "
            "शुरुआत करने के लिए, बताइए आप किस योजना के बारे में जानना चाहते हैं — "
            "जैसे कि वृद्धावस्था पेंशन, विधवा पेंशन, विकलांग पेंशन, या आयुष्मान भारत?"
        ),
        "te": (
            "నమస్కారం! నేను NavyaSathi, మీ చట్టపరమైన సహచరుడిని. మీ పెన్షన్ లేదా సంక్షేమ పథకం విషయంలో నేను సహాయం చేస్తాను. "
            "మొదలు పెట్టడానికి, మీరు ఏ పథకం గురించి అడగాలనుకుంటున్నారో చెప్పగలరా — "
            "ఉదాహరణకు వృద్ధాప్య పెన్షన్, వితంతు పెన్షన్, వికలాంగ పెన్షన్, లేదా ఆయుష్మాన్ భారత్?"
        ),
    },
    "utility_consumer": {
        "en": (
            "Hello! I'm NavyaSathi, your legal companion. I'll help you with your consumer or utility complaint. "
            "To start, could you tell me what kind of issue you're facing — for example, an electricity billing "
            "problem, a power outage, a water supply issue, or a complaint about a product or service?"
        ),
        "hi": (
            "नमस्ते! मैं NavyaSathi हूँ, आपका कानूनी साथी। मैं आपकी उपभोक्ता या उपयोगिता शिकायत में मदद करूँगा। "
            "शुरुआत करने के लिए, बताइए आपको किस तरह की समस्या है — जैसे कि बिजली बिल की गड़बड़ी, "
            "बिजली कटौती, पानी की समस्या, या किसी उत्पाद/सेवा की शिकायत?"
        ),
        "te": (
            "నమస్కారం! నేను NavyaSathi, మీ చట్టపరమైన సహచరుడిని. మీ వినియోగదారు లేదా యుటిలిటీ ఫిర్యాదులో నేను సహాయం చేస్తాను. "
            "మొదలు పెట్టడానికి, మీకు ఏ రకమైన సమస్య ఉందో చెప్పగలరా — ఉదాహరణకు విద్యుత్ బిల్లు సమస్య, "
            "కరెంటు అంతరాయం, నీటి సరఫరా సమస్య, లేదా ఒక ఉత్పత్తి/సేవ గురించి ఫిర్యాదు?"
        ),
    },
}

# ── System prompt ─────────────────────────────────────────────────────────────

_PROMPT_PREAMBLE = """\
You are NavyaSathi, a warm and trustworthy legal companion helping ordinary Indian citizens \
navigate government procedures. You are conducting an intake interview for a {domain_display} matter.

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
{slots_definition}

## Decision logic each turn
1. Inspect the filled_slots JSON. Find the FIRST slot whose value is null.
2. Ask only about that one slot, in plain conversational language. No bullet points in the reply.
3. Extract whatever the user answered and update ALL relevant slots — users often answer multiple at once.
4. If the user's answer is unclear, ask one clarifying sub-question before moving on.
5. When ALL slots are non-null, set intake_complete to true and write a warm 2–3 sentence \
summary of what you've recorded, then tell the user you'll now prepare their Case Workspace.
6. If the user seems distressed, add one empathetic sentence before your question.

## Knowledge base (use ONLY this for procedural facts)
{knowledge_context}

## Hard grounding rule
If the knowledge base above does not contain information relevant to a specific procedural \
question the user asks, respond with: "I want to give you accurate information, but I need \
to verify the specific details for your situation. For authoritative guidance, please check \
the relevant official government portal or visit your nearest government office." \
Do NOT fabricate procedures, amounts, timelines, or court dates not stated above.

## Hard rules
- NEVER include text marked "(INTERNAL)" or "Source note" in the reply field.
- NEVER ask more than one question per reply.
- NEVER use the words "slot", "intake", "JSON", "LLM", "AI", or any technical jargon with the user.
- The reply field must be warm conversational prose.
- The reasoning field must be plain language the user can understand; no jargon. Set it to "" when intake_complete is true.\
"""

_OUTPUT_FORMAT_TEMPLATE = """

## Output format — return ONLY valid JSON, nothing else
{{
  "reply": "<your single question or summary in the correct language>",
  "reasoning": "<one sentence in plain language: why this information is procedurally needed; empty string when intake_complete is true>",
  "slots": {slots_json},
  "intake_complete": false
}}"""


def _build_system_prompt(
    domain: str,
    language: str,
    filled_slots: str,
    knowledge_context: str,
) -> str:
    cfg = DOMAIN_CONFIG.get(domain, DOMAIN_CONFIG["vehicle_traffic"])
    slots_json = json.dumps(cfg["empty_slots"], indent=2, ensure_ascii=False)

    preamble = _PROMPT_PREAMBLE.format(
        domain_display=cfg["display"],
        language=language,
        filled_slots=filled_slots,
        slots_definition=cfg["slots_definition"],
        knowledge_context=knowledge_context,
    )
    output_section = _OUTPUT_FORMAT_TEMPLATE.format(slots_json=slots_json)
    return preamble + output_section


# ── Message history helpers ───────────────────────────────────────────────────

def _build_history(messages: list[dict]) -> list[dict]:
    history = []
    for m in messages:
        if m["role"] not in ("user", "assistant"):
            continue
        history.append({"role": m["role"], "content": m["content"]})
    return history


# ── Public interface ──────────────────────────────────────────────────────────

def get_opening_message(language: str, domain: str = "vehicle_traffic") -> str:
    domain_messages = OPENING_MESSAGES.get(domain, OPENING_MESSAGES["vehicle_traffic"])
    return domain_messages.get(language, domain_messages["en"])


async def process_message(
    messages: list[dict],
    current_slots: dict,
    language: str,
    domain: str = "vehicle_traffic",
) -> tuple[str, dict, bool, str]:
    s = get_settings()

    # RAG: use the last user message as the retrieval query
    last_user_content = messages[-1]["content"] if messages else ""
    knowledge_context = await get_rag_context(last_user_content, domain)

    filled_slots = json.dumps(current_slots, ensure_ascii=False, indent=2)
    system = _build_system_prompt(domain, language, filled_slots, knowledge_context)

    history = _build_history(messages[:-1])
    last_content = messages[-1]["content"]

    try:
        client = AsyncGroq(api_key=s.groq_api_key)
        msgs = (
            [{"role": "system", "content": system}]
            + history
            + [{"role": "user", "content": last_content}]
        )
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=msgs,
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw = response.choices[0].message.content
    except Exception as exc:
        logger.error("Groq API error: %s", exc)
        return (
            "I'm sorry, I had a technical issue. Could you please repeat what you said?",
            current_slots,
            False,
            "",
        )

    try:
        parsed = json.loads(raw)
        reply: str = parsed["reply"]
        reasoning: str = parsed.get("reasoning", "")
        new_slots: dict = parsed.get("slots", {})
        intake_complete: bool = bool(parsed.get("intake_complete", False))

        merged = {**current_slots}
        for k, v in new_slots.items():
            if v is not None and v != [] and v != "":
                merged[k] = v

        return reply, merged, intake_complete, reasoning

    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Failed to parse Groq JSON (%s). Raw: %.200s", exc, raw)
        return raw, current_slots, False, ""
