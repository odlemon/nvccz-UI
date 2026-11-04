# Investor and commitments data collection template

These are **collection prompts**, not confirmed import/API columns. The live investor and commitment create forms are now verified in local UAT, but no import workflow has been exposed; confirm the approved import surface and schema before importing anything.

| Investor / commitment item | Suggested type and validation | Source owner | Status |
|---|---|---|---|
| Investor legal name | Text; match approved legal/KYC record; preserve source spelling | IR / Compliance | Awaiting client |
| Investor type / classification | Client-defined controlled vocabulary | IR / Compliance | Awaiting definition |
| Jurisdiction / country | Country name or agreed code | Compliance | Awaiting client |
| Primary contact and role | Business contact; validate consent and access scope | IR | Awaiting client |
| Contact email / phone | Validate format; store only in approved location | IR | Awaiting client |
| KYC / onboarding status | Use actual system states after UI verification; do not infer | Compliance | Workflow unverified |
| Fund link | Must reference an approved existing fund ID/name | Fund admin | Fund record unresolved |
| Commitment amount / currency | Decimal amount plus ISO/display currency | Fund admin / Finance | Awaiting client |
| Commitment effective date | ISO date `YYYY-MM-DD` | Fund admin | Awaiting client |
| Drawdown schedule | Date, amount, currency, notice/status per client-approved source | Fund admin / Finance | Workflow unverified |
| Distribution schedule | Date, amount, currency, type/status per approved source | Fund admin / Finance | Workflow unverified |
| Reconciliation reference | Source-system identifier and control total | Finance | Awaiting client |

## Validation controls

1. Reconcile each investor's commitment total to source agreements and each fund total to an independently approved control total.
2. Validate currency, dates, duplicates, investor-to-fund links, and status vocabulary before import.
3. Require source owner and approval evidence; retain an untouched source copy securely.
4. Mask or replace personal/financial data for dev. This repository is not an approved client-data exchange.
5. Test import in an isolated non-production environment and reconcile counts/totals before any client-approved live load.
