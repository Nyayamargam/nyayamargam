"""
Seed knowledge_chunks for all three domains.

Run once after migration 002:
    cd backend
    source .venv/bin/activate
    python scripts/seed_knowledge.py
"""
from __future__ import annotations

import sys
import os

# Allow imports from the app package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()  # reads backend/.env

from google import genai
from google.genai import types
from supabase import create_client

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

KNOWLEDGE: dict[str, list[dict]] = {
    "vehicle_traffic": [
        {
            "content": (
                "Traffic challans can be paid online at echallan.parivahan.gov.in using the vehicle "
                "registration number or driving licence number. Payment can also be made at authorised "
                "banks, post offices, or in person at the traffic police office. Challans should be "
                "settled within 60 days to avoid court proceedings."
            ),
            "source_url": "https://echallan.parivahan.gov.in",
            "metadata": {"category": "challan_payment"},
        },
        {
            "content": (
                "Challans for major violations — drunk driving (Section 185), dangerous driving "
                "(Section 184), or racing — cannot be paid online. The offender must appear before "
                "the Judicial Magistrate on the date printed on the challan. Missing the date can "
                "result in an ex-parte penalty order."
            ),
            "source_url": "https://echallan.parivahan.gov.in",
            "metadata": {"category": "challan_court"},
        },
        {
            "content": (
                "Common MV Act 2019 fine amounts: Section 177 (general violation) ₹500/₹1,500 repeat; "
                "Section 183 (speeding) ₹1,000–₹2,000; Section 185 (drunk driving) ₹10,000 first, "
                "₹15,000 + 2 years imprisonment repeat; Section 196 (no insurance) ₹2,000/₹4,000; "
                "Section 197 (no licence) ₹5,000; Section 206 (no helmet/seatbelt) ₹1,000."
            ),
            "source_url": "https://parivahan.gov.in",
            "metadata": {"category": "fine_amounts"},
        },
        {
            "content": (
                "To contest a challan in court, file a petition in the Judicial Magistrate court of "
                "the district where the offence occurred, before the hearing date. Grounds include: "
                "incorrect vehicle details on the challan, evidence the offence was not committed, "
                "or technical defects in the challan issuance. Bring RC, DL, insurance, PUC, and the original challan."
            ),
            "source_url": "https://echallan.parivahan.gov.in",
            "metadata": {"category": "challan_contest"},
        },
        {
            "content": (
                "To recover a seized vehicle: obtain the seizure receipt from the seizing authority "
                "(traffic police or RTO), pay all outstanding challans, and produce valid RC, insurance, "
                "DL, and PUC. Get a release order from the competent authority and present it at the "
                "vehicle pound. Daily storage charges may apply. Processing typically takes 7–30 working days."
            ),
            "source_url": "https://parivahan.gov.in",
            "metadata": {"category": "seizure"},
        },
        {
            "content": (
                "Driving licence renewal: Apply online at sarathi.parivahan.gov.in → Driving Licence "
                "Services → Renewal of DL. Required: existing DL, Form 9 (application), address proof, "
                "and Form 1A medical certificate (mandatory if over 40 years old). "
                "An expired DL is an offence under Section 3 of the MV Act."
            ),
            "source_url": "https://sarathi.parivahan.gov.in",
            "metadata": {"category": "dl_renewal"},
        },
        {
            "content": (
                "A suspended driving licence cannot be used for any vehicle. The suspension period and "
                "reason are stated in the suspension notice from the RTO. After the suspension period "
                "ends, visit the issuing RTO with the suspension order to apply for reinstatement."
            ),
            "source_url": "https://parivahan.gov.in",
            "metadata": {"category": "dl_suspension"},
        },
        {
            "content": (
                "RC (Registration Certificate) renewal and transfer: Apply at parivahan.gov.in → "
                "Vehicle Related Services. For renewal: Form 25, current RC, valid insurance, PUC, "
                "and applicable fee. For transfer of ownership: Form 29 signed by seller + Form 30 "
                "signed by buyer, plus ID proof of both parties."
            ),
            "source_url": "https://parivahan.gov.in",
            "metadata": {"category": "rc"},
        },
        {
            "content": (
                "Motor Accident Claims Tribunal (MACT): Accident compensation claims can be filed at "
                "the MACT in the district where the accident occurred, where the respondent resides, "
                "or where the claimant resides. There is no court fee for accident victims. Claims "
                "must typically be filed within 6 months of the accident."
            ),
            "source_url": "https://njdg.ecourts.gov.in",
            "metadata": {"category": "accident_claim"},
        },
        {
            "content": (
                "Parivahan Sewa helpline: 1800-120-1000 (toll-free) for queries about vehicle "
                "registration, driving licences, fitness certificates, and permits. "
                "Online services available at parivahan.gov.in and sarathi.parivahan.gov.in."
            ),
            "source_url": "https://parivahan.gov.in",
            "metadata": {"category": "helpline"},
        },
    ],

    "pension_welfare": [
        {
            "content": (
                "IGNOAPS (Indira Gandhi National Old Age Pension Scheme) eligibility: Indian citizen "
                "aged 60 years or above, belonging to a BPL (Below Poverty Line) household. The central "
                "government provides ₹200/month for ages 60–79 and ₹500/month for ages 80+. Most states "
                "add a top-up, bringing the total to ₹500–₹2,000 depending on the state."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "old_age_pension_eligibility"},
        },
        {
            "content": (
                "IGNOAPS application process: Collect and submit Form at the gram panchayat office "
                "(rural) or ward/municipal office (urban). Required documents: Aadhaar card, proof of "
                "age (birth certificate, school leaving certificate, or PAN card), BPL ration card or "
                "income certificate from a competent authority. Application forms are free. "
                "State offices process applications within 30–60 days."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "old_age_pension_application"},
        },
        {
            "content": (
                "IGNWPS (Widow Pension): Widows aged 40–79 from BPL households are eligible. Central "
                "contribution is ₹300/month. Apply at the gram panchayat or ward office with: husband's "
                "death certificate, applicant's Aadhaar, age proof, and BPL ration card. "
                "IGNDPS (Disability Pension): persons with 80%+ disability from BPL households aged "
                "18–79, ₹300/month central contribution. Disability certificate from a government hospital required."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "widow_disability_pension"},
        },
        {
            "content": (
                "All NSAP pensions are disbursed directly to the beneficiary's Aadhaar-linked bank "
                "account via DBT (Direct Benefit Transfer). If pension payments have stopped, the most "
                "common reasons are: Aadhaar not seeded with the bank account, bank account inactive, "
                "or beneficiary not found in the state BPL list after re-survey."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "pension_dbt"},
        },
        {
            "content": (
                "Aadhaar-bank account seeding: Visit any branch of your bank or the nearest CSC "
                "(Common Service Centre / Jan Seva Kendra) with your Aadhaar card and bank passbook. "
                "The linking is free and usually completed within 7 working days. You can verify the "
                "seeding status at uidai.gov.in → Aadhaar Services → Bank Seeding Status, or by "
                "calling UIDAI helpline 1947."
            ),
            "source_url": "https://uidai.gov.in",
            "metadata": {"category": "aadhaar_bank_seeding"},
        },
        {
            "content": (
                "Pension grievance escalation process: Step 1 — approach the village-level officer or "
                "panchayat secretary with a written complaint. Step 2 — if unresolved in 15 days, "
                "escalate to the District Social Welfare Officer (DSWO). Step 3 — if unresolved in "
                "30 days, file a grievance on the NSAP portal (nsap.nic.in) or through the state's "
                "CM Helpline. Keep written records of every interaction."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "pension_grievance"},
        },
        {
            "content": (
                "Pradhan Mantri Jan Arogya Yojana (PM-JAY / Ayushman Bharat): Provides health insurance "
                "coverage of ₹5 lakh per family per year for secondary and tertiary hospitalisation. "
                "Check eligibility at pmjay.gov.in using Aadhaar or ration card number. Treatment is "
                "cashless at any empanelled government or private hospital. The scheme is for BPL and "
                "SECC-listed families."
            ),
            "source_url": "https://pmjay.gov.in",
            "metadata": {"category": "pmjay"},
        },
        {
            "content": (
                "State-level welfare schemes: Many states run their own pension schemes with higher "
                "amounts — for example, Tamil Nadu's CMEGP, Kerala's Welfare Pension, Telangana's "
                "Aasara pension, and Andhra Pradesh's YSR Pension Kanuka. These are applied for at "
                "the same gram panchayat or municipal ward office. Eligibility criteria vary by state."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "state_pension"},
        },
        {
            "content": (
                "Documents commonly required for welfare scheme applications: Aadhaar card (mandatory), "
                "BPL ration card or income certificate, age proof (birth certificate, school certificate, "
                "or PAN), Aadhaar-linked bank passbook, passport-size photograph, "
                "caste certificate if applicable for SC/ST schemes, and disability certificate (for IGNDPS)."
            ),
            "source_url": "https://nsap.nic.in",
            "metadata": {"category": "welfare_documents"},
        },
    ],

    "utility_consumer": [
        {
            "content": (
                "Consumer Protection Act 2019: Consumers can file complaints against defective goods "
                "or deficient services. Jurisdiction by claim value: District Consumer Commission "
                "handles claims up to ₹50 lakh; State Consumer Commission up to ₹2 crore; "
                "National Consumer Disputes Redressal Commission (NCDRC) above ₹2 crore. "
                "No lawyer is required to file a complaint."
            ),
            "source_url": "https://consumerhelpline.gov.in",
            "metadata": {"category": "consumer_act"},
        },
        {
            "content": (
                "Filing a consumer complaint: Required documents — written complaint (state facts "
                "clearly), purchase receipts or invoices, copies of correspondence with the company, "
                "and ID proof. Filing fees range from ₹100 (claims up to ₹5 lakh) to ₹5,000 (claims "
                "above ₹1 crore). File at the District Consumer Commission where you reside or where "
                "the opposite party has its registered office."
            ),
            "source_url": "https://edaakhil.nic.in",
            "metadata": {"category": "consumer_filing"},
        },
        {
            "content": (
                "Time limit for consumer complaints: Must be filed within 2 years from the date the "
                "cause of action first arose. The commission may condone delay if sufficient cause is "
                "shown. File online at edaakhil.nic.in — India's e-filing portal for consumer "
                "complaints — to track status and receive notifications."
            ),
            "source_url": "https://edaakhil.nic.in",
            "metadata": {"category": "consumer_timeline"},
        },
        {
            "content": (
                "National Consumer Helpline: 1800-11-4000 (toll-free, Monday to Saturday, 9:30 AM to "
                "5:30 PM) or 14404. Also accessible at consumerhelpline.gov.in. The NCH can mediate "
                "disputes directly with companies before a formal complaint is necessary. Many cases are "
                "resolved at this stage without going to the consumer forum."
            ),
            "source_url": "https://consumerhelpline.gov.in",
            "metadata": {"category": "helpline"},
        },
        {
            "content": (
                "Electricity billing disputes: Step 1 — send a written complaint to your DISCOM "
                "(electricity distribution company) with a copy of the disputed bill. DISCOMs are "
                "required to respond within 15 days. Step 2 — if unsatisfied, approach the "
                "Electricity Ombudsman or State Electricity Regulatory Commission (SERC) consumer "
                "grievance forum. These are free and do not require a lawyer."
            ),
            "source_url": "https://cea.nic.in",
            "metadata": {"category": "electricity_billing"},
        },
        {
            "content": (
                "Power outage complaints: Call your DISCOM's 24-hour helpline immediately. If the "
                "outage exceeds the standard restoration time specified in your state's SERC standards "
                "(typically 4–12 hours for urban areas), you may be entitled to compensation under the "
                "Standards of Performance regulations. Keep records of complaint reference numbers and timestamps."
            ),
            "source_url": "https://cea.nic.in",
            "metadata": {"category": "power_outage"},
        },
        {
            "content": (
                "Central Consumer Protection Authority (CCPA): Established under the Consumer Protection "
                "Act 2019, CCPA handles complaints about misleading advertisements, unfair trade practices, "
                "and violations affecting a class of consumers. File complaints at consumerhelpline.gov.in. "
                "CCPA can order product recalls, impose penalties on manufacturers, and issue corrective advertisements."
            ),
            "source_url": "https://consumerhelpline.gov.in",
            "metadata": {"category": "ccpa"},
        },
        {
            "content": (
                "Water supply complaints: Contact your local municipal corporation or water board. "
                "If unresolved, escalate to the state's Urban Development Department or file a complaint "
                "with the State Consumer Commission if there is a service deficiency. For severe supply "
                "disruptions, approach the District Collector's office for emergency intervention."
            ),
            "source_url": "https://consumerhelpline.gov.in",
            "metadata": {"category": "water_supply"},
        },
        {
            "content": (
                "E-commerce and online shopping complaints: File at consumerhelpline.gov.in or through "
                "the platform's grievance officer (all e-commerce platforms are legally required to "
                "appoint one under the Consumer Protection (E-Commerce) Rules 2020). If unresolved in "
                "48 hours, escalate to the District Consumer Commission."
            ),
            "source_url": "https://consumerhelpline.gov.in",
            "metadata": {"category": "ecommerce"},
        },
    ],
}


def embed_text(client: genai.Client, text: str) -> list[float]:
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768,
        ),
    )
    return list(response.embeddings[0].values)


def main() -> None:
    gemini = genai.Client(api_key=GEMINI_API_KEY)
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Clear existing chunks to allow idempotent re-seeding
    db.table("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Cleared existing knowledge_chunks.")

    total = 0
    for domain, chunks in KNOWLEDGE.items():
        print(f"\nSeeding domain: {domain} ({len(chunks)} chunks)")
        for i, chunk in enumerate(chunks):
            print(f"  [{i+1}/{len(chunks)}] Embedding: {chunk['content'][:60]}…")
            embedding = embed_text(gemini, chunk["content"])
            row = {
                "domain": domain,
                "content": chunk["content"],
                "source_url": chunk.get("source_url"),
                "metadata": chunk.get("metadata", {}),
                "embedding": embedding,
                "last_verified": "2026-07-05",
            }
            db.table("knowledge_chunks").insert(row).execute()
            total += 1

    print(f"\nDone. Inserted {total} knowledge chunks.")


if __name__ == "__main__":
    main()
