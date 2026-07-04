VEHICLE_TRAFFIC_KNOWLEDGE = """
## Motor Vehicles Act 1988 — Key Provisions (Phase 1 static stub; replaced by pgvector RAG in Phase 4)

### Common Challan Offences (MV Amendment Act 2019 rates)
- Section 177: General violation — ₹500 (first), ₹1,500 (repeat)
- Section 183: Speeding — ₹1,000–₹2,000 (first), ₹2,000–₹4,000 (repeat)
- Section 184: Dangerous driving — ₹1,000–₹5,000 or imprisonment up to 6 months
- Section 185: Drunk driving — ₹10,000 (first), ₹15,000 + imprisonment (repeat)
- Section 194: Overloading — ₹20,000 + ₹2,000 per extra tonne
- Section 196: No valid insurance — ₹2,000 (first), ₹4,000 (repeat) + 3-month imprisonment
- Section 197: Driving without valid licence — ₹5,000
- Section 206: Not wearing seatbelt/helmet — ₹1,000

### Challan Payment Options
1. **Online**: echallan.parivahan.gov.in (search by vehicle registration number or DL number)
2. **Court**: appear on the hearing date printed on the challan (typically within 60 days)
3. **RTO office**: some states allow in-person payment

### Court jurisdiction
The competent court is the one in the district where the offence occurred (as printed on the challan).

### Documents required to contest a challan in court
- Original challan receipt
- RC Book (Registration Certificate)
- Valid Driving Licence
- Valid Insurance Certificate
- PUC (Pollution Under Control) Certificate

### Contesting a challan
- File a petition in the competent court before the hearing date.
- Grounds for contestation: incorrect vehicle details, proof of offence not committed, technical defects in the challan.
- If you miss the court date, the court may impose ex-parte penalties.

### Seized vehicle recovery
1. Obtain the seizure receipt from the seizing authority (Traffic Police / RTO).
2. Pay all dues and produce: RC Book, valid Insurance, valid DL, PUC.
3. Collect a release order from the competent authority.
4. Present the release order at the vehicle pound.
- Typical processing time: 7–30 working days (varies by state).
- Storage charges may accrue per day.

### Licence-related issues
- Expired DL: Renew at the nearest RTO (apply online via parivahan.gov.in → Driving Licence Services).
- Suspended DL: Apply for reinstatement at the RTO that issued the suspension order.
- DL mismatch on RC: Update records at the RTO; both documents must be consistent.

### Source note (INTERNAL — do NOT include in any user-facing reply)
Static reference compiled from echallan.parivahan.gov.in and the MV Act text.
Last verified: 2025-12. Subject to state-level amendments.
"""


def get_vehicle_traffic_context() -> str:
    return VEHICLE_TRAFFIC_KNOWLEDGE
