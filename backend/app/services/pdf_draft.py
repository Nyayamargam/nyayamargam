from __future__ import annotations

import html
from datetime import date

_CSS = """\
@page { margin: 2.5cm 2cm; size: A4; }
body { font-family: "Liberation Serif", Georgia, serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 0.4em; }
.subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 2em; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; }
td { padding: 4px 8px; vertical-align: top; }
td:first-child { font-weight: bold; width: 38%; }
hr { border: none; border-top: 1px solid #bbb; margin: 1.5em 0; }
.sh { font-weight: bold; margin-top: 1.4em; margin-bottom: 0.3em; text-decoration: underline; }
.body-text { text-align: justify; }
.sign-block { margin-top: 3em; }
.footer { font-size: 9pt; color: #888; text-align: center; }
"""

_DOMAIN_META: dict[str, dict[str, str]] = {
    "vehicle_traffic": {
        "title": "Representation / Grievance Letter",
        "authority": "The Concerned Traffic Authority / Regional Transport Office",
    },
    "pension_welfare": {
        "title": "Application / Appeal Letter",
        "authority": "The District Social Welfare Officer / Competent Authority",
    },
    "utility_consumer": {
        "title": "Consumer Complaint Letter",
        "authority": "The Grievance Officer / Consumer Forum",
    },
}


def _e(v: object) -> str:
    return html.escape(str(v)) if (v is not None and v != "" and v != []) else "—"


def _slot_rows(slots: dict) -> str:
    rows = []
    for k, v in slots.items():
        if v is None or v == [] or v == "":
            continue
        label = k.replace("_", " ").title()
        value = ", ".join(v) if isinstance(v, list) else str(v)
        rows.append(f"<tr><td>{_e(label)}</td><td>{_e(value)}</td></tr>")
    return "\n".join(rows) if rows else "<tr><td colspan='2'>No details recorded.</td></tr>"


def _body_paragraph(domain: str, slots: dict) -> str:
    if domain == "vehicle_traffic":
        incident = slots.get("incident_type") or "an incident"
        location = slots.get("incident_location") or "the stated location"
        rc = slots.get("rc_number")
        outcome = slots.get("desired_outcome") or "a fair resolution"
        rc_part = f"The vehicle involved bears registration number {_e(rc)}. " if rc else ""
        return (
            f"I am writing to bring to your kind attention a matter concerning {_e(incident)} "
            f"that occurred at {_e(location)}. {rc_part}"
            f"I respectfully request your office to look into this matter and assist me in "
            f"achieving {_e(outcome)}. I have attached relevant documents for your reference "
            "and seek appropriate relief at the earliest."
        )
    elif domain == "pension_welfare":
        scheme = slots.get("scheme_type") or "the scheme"
        issue = slots.get("issue_type") or "an issue"
        outcome = slots.get("desired_outcome") or "resolution"
        return (
            f"I am writing regarding my {_e(issue)} with the {_e(scheme)} scheme administered "
            "by your office. I meet all eligibility criteria and have been unable to receive "
            "the benefits to which I am entitled. I respectfully request your office to take "
            f"necessary action and {_e(outcome)}. Please find the supporting documents attached."
        )
    else:
        complaint = slots.get("complaint_type") or "my complaint"
        provider = slots.get("provider_name") or "the service provider"
        amount = slots.get("amount_disputed")
        outcome = slots.get("desired_outcome") or "a fair resolution"
        amount_part = f" amounting to ₹{_e(amount)}" if amount and str(amount) != "0" else ""
        return (
            f"I am writing to file a formal complaint against {_e(provider)} regarding "
            f"{_e(complaint)}{amount_part}. Despite my efforts to resolve this matter "
            "directly, the issue remains unresolved. I respectfully request that this "
            f"complaint be taken up and {_e(outcome)} be provided at the earliest. "
            "Supporting documents and correspondence are attached."
        )


def generate_draft_pdf(case: dict) -> bytes:
    from weasyprint import HTML  # noqa: PLC0415 — lazy import; system libs required

    domain: str = case.get("domain") or "vehicle_traffic"
    slots: dict = case.get("slots") or {}
    code: str = case.get("code", "")
    meta = _DOMAIN_META.get(domain, _DOMAIN_META["vehicle_traffic"])
    today = date.today().strftime("%d %B %Y")

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><style>{_CSS}</style></head>
<body>
  <p style="text-align:right;font-size:10pt;color:#666;">Case #{_e(code)}&nbsp;|&nbsp;Date: {_e(today)}</p>
  <h1>{_e(meta["title"])}</h1>
  <p class="subtitle">Prepared by NavyaSathi &mdash; Legal Companion</p>
  <hr>

  <p class="sh">To</p>
  <p>{_e(meta["authority"])}</p>

  <p class="sh">Subject: Request for assistance — {_e(meta["title"])}</p>

  <p class="sh">Respectfully submitted,</p>
  <p class="body-text">{_body_paragraph(domain, slots)}</p>

  <p class="sh">Case Details</p>
  <table>
    {_slot_rows(slots)}
  </table>

  <div class="sign-block">
    <p>Yours faithfully,</p>
    <br><br>
    <p>________________________</p>
    <p><strong>Applicant&rsquo;s Signature</strong></p>
    <p>Date: {_e(today)}</p>
  </div>

  <hr>
  <p class="footer">
    This draft was auto-generated by NavyaSathi and is meant as a starting point.
    Please review and edit as needed before submission.
  </p>
</body>
</html>"""

    return HTML(string=doc).write_pdf()
