from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.services.router import is_official_source


class L10n(BaseModel):
    en: str
    hi: str
    te: str


class IntakeQuestion(BaseModel):
    id: str
    text: L10n
    why_asking: L10n
    required: bool = True
    input_type: str = "text"       # text | number | choice | date | document
    choices: Optional[list[str]] = None


class RequiredDocument(BaseModel):
    name: L10n
    # Human-written rule the Document Intelligence Service can evaluate.
    # e.g. "issued_within_months:6" or "not_expired"
    validity_rule: Optional[str] = None


class DomainConfig(BaseModel):
    id: str
    label: L10n
    tier: str = "GREEN"            # GREEN = verified; Amber is live-grounded, data-less
    official_sources: list[str] = Field(min_length=1)
    intake_questions: list[IntakeQuestion]
    required_documents: list[RequiredDocument] = []
    department: L10n
    timeline: L10n
    verified_by: str               # name/id of the person who checked the procedure
    verified_on: date              # when it was last checked

    @field_validator("official_sources")
    @classmethod
    def sources_must_be_official(cls, v: list[str]) -> list[str]:
        bad = [u for u in v if not is_official_source(u)]
        if bad:
            raise ValueError(f"Non-official source(s) not allowed for a Green area: {bad}")
        return v

    @property
    def is_stale(self) -> bool:
        """True if verified more than 12 months ago — flag for re-check."""
        return self.verified_on < date.today() - timedelta(days=365)


# ---------------------------------------------------------------------------
# Verified Green domains
# ---------------------------------------------------------------------------

POST_MATRIC_SCHOLARSHIP = DomainConfig(
    id="post_matric_scholarship",
    label=L10n(
        en="Post-Matric Scholarship",
        hi="पोस्ट-मैट्रिक छात्रवृत्ति",
        te="పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్",
    ),
    official_sources=["https://scholarships.gov.in"],
    intake_questions=[
        IntakeQuestion(
            id="student_class",
            text=L10n(
                en="Which class or year is the student in?",
                hi="छात्र किस कक्षा या वर्ष में है?",
                te="విద్యార్థి ఏ తరగతి లేదా సంవత్సరంలో ఉన్నారు?",
            ),
            why_asking=L10n(
                en="Eligibility differs by level of study.",
                hi="पात्रता अध्ययन स्तर के अनुसार बदलती है।",
                te="అర్హత చదువు స్థాయిని బట్టి మారుతుంది.",
            ),
            input_type="text",
        ),
        IntakeQuestion(
            id="income_bracket",
            text=L10n(
                en="What is the family's yearly income range?",
                hi="परिवार की वार्षिक आय सीमा क्या है?",
                te="కుటుంబ వార్షిక ఆదాయ శ్రేణి ఎంత?",
            ),
            why_asking=L10n(
                en="Most scholarships have an income limit.",
                hi="अधिकांश छात्रवृत्तियों की एक आय सीमा होती है।",
                te="చాలా స్కాలర్‌షిప్‌లకు ఆదాయ పరిమితి ఉంటుంది.",
            ),
            input_type="choice",
            choices=["below 1L", "1L–2.5L", "above 2.5L"],
        ),
    ],
    required_documents=[
        RequiredDocument(
            name=L10n(en="Income certificate", hi="आय प्रमाण पत्र", te="ఆదాయ ధృవీకరణ పత్రం"),
            validity_rule="issued_within_months:12",
        ),
        RequiredDocument(
            name=L10n(en="Previous marksheet", hi="पिछली मार्कशीट", te="గత మార్క్‌షీట్"),
            validity_rule=None,
        ),
    ],
    department=L10n(
        en="National Scholarship Portal / State welfare dept",
        hi="राष्ट्रीय छात्रवृत्ति पोर्टल / राज्य कल्याण विभाग",
        te="నేషనల్ స్కాలర్‌షిప్ పోర్టల్ / రాష్ట్ర సంక్షేమ శాఖ",
    ),
    timeline=L10n(
        en="Applications usually open once a year; verification takes a few weeks.",
        hi="आवेदन आमतौर पर साल में एक बार खुलते हैं; सत्यापन में कुछ सप्ताह लगते हैं।",
        te="దరఖాస్తులు సాధారణంగా ఏడాదికి ఒకసారి తెరుస్తారు; ధృవీకరణకు కొన్ని వారాలు పడుతుంది.",
    ),
    verified_by="team_member_name",
    verified_on=date(2026, 7, 1),
)

INCOME_CERTIFICATE = DomainConfig(
    id="income_certificate",
    label=L10n(
        en="Income Certificate",
        hi="आय प्रमाण पत्र",
        te="ఆదాయ ధృవీకరణ పత్రం",
    ),
    official_sources=["https://www.india.gov.in"],
    intake_questions=[
        IntakeQuestion(
            id="state",
            text=L10n(
                en="Which state do you live in?",
                hi="आप किस राज्य में रहते हैं?",
                te="మీరు ఏ రాష్ట్రంలో నివసిస్తున్నారు?",
            ),
            why_asking=L10n(
                en="The issuing office and portal differ by state.",
                hi="जारी करने वाला कार्यालय और पोर्टल राज्य के अनुसार भिन्न होते हैं।",
                te="జారీ చేసే కార్యాలయం మరియు పోర్టల్ రాష్ట్రాన్ని బట్టి మారతాయి.",
            ),
        ),
    ],
    required_documents=[
        RequiredDocument(
            name=L10n(en="Aadhaar", hi="आधार", te="ఆధార్"),
            validity_rule="not_expired",
        ),
        RequiredDocument(
            name=L10n(en="Ration card", hi="राशन कार्ड", te="రేషన్ కార్డు"),
            validity_rule=None,
        ),
    ],
    department=L10n(
        en="Tahsildar / MeeSeva or state e-district portal",
        hi="तहसीलदार / राज्य ई-डिस्ट्रिक्ट पोर्टल",
        te="తహసీల్దార్ / మీసేవా లేదా రాష్ట్ర ఈ-డిస్ట్రిక్ట్ పోర్టల్",
    ),
    timeline=L10n(
        en="Typically issued within 1–2 weeks of applying.",
        hi="आमतौर पर आवेदन के 1-2 सप्ताह के भीतर जारी किया जाता है।",
        te="సాధారణంగా దరఖాస్తు చేసిన 1-2 వారాల్లో జారీ చేస్తారు.",
    ),
    verified_by="team_member_name",
    verified_on=date(2026, 7, 1),
)


# ---------------------------------------------------------------------------
# Registry — Case Officer engine loads domains from here (or from Supabase).
# Adding a domain = append a DomainConfig. No engine code changes needed.
# ---------------------------------------------------------------------------

DOMAIN_REGISTRY: dict[str, DomainConfig] = {
    POST_MATRIC_SCHOLARSHIP.id: POST_MATRIC_SCHOLARSHIP,
    INCOME_CERTIFICATE.id: INCOME_CERTIFICATE,
}


def get_domain(domain_id: str) -> Optional[DomainConfig]:
    return DOMAIN_REGISTRY.get(domain_id)


def stale_domains() -> list[str]:
    """IDs whose verification is >12 months old — re-check before trusting."""
    return [d.id for d in DOMAIN_REGISTRY.values() if d.is_stale]
