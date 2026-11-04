# Fund and entity data collection template

**Use:** collect proposed setup for review; this is not an approved bulk-import schema. **Verified UI fields** are only those visible in the dev Portfolio Management → Funds → Create fund wizard. Do not treat unverified fields as mandatory API columns.

| Field | Type / example | Required in observed wizard? | Validation / source |
|---|---|---|---|
| Fund name | Text — `TRAINING DEMO — Matanho Growth Fund I` | Yes | Unique, approved name; source: fund owner. |
| Strategy | Choice — Growth Equity / Early Stage / Buyout / Climate Infrastructure / SME Growth / Private Equity | Yes | Select an available UI option; confirm mandate classification. |
| Vintage | Whole year — `2026` | No (observed) | Confirm inception/vintage definition. |
| Currency | Choice — USD / ZAR / ZWG / EUR | No (observed) | Select from displayed options; reconcile source amounts. |
| Target commitment | Amount — `5000000` | Yes | Positive amount; currency must be explicit. Synthetic example only. |
| Primary geography | Text — `Zimbabwe` | No (observed) | Use agreed country/region vocabulary. |
| Description | Text | No (observed) | State approved thesis/mandate; avoid confidential detail in dev. |
| Management fee | Optional text/input shown in Ownership step | Not marked required in observed UI | Confirm percentage/base/calculation convention. |
| Carry terms | Optional text/input shown in Ownership step | Not marked required in observed UI | Confirm hurdle/catch-up/carry basis with authorized owner. |
| Minimum / maximum investment | Optional numeric inputs shown in Ownership step | Not marked required in observed UI | Confirm currency and whether limits are inclusive. |
| Focus industries | Optional text input shown in Ownership step | Not marked required in observed UI | Use client-approved taxonomy. |
| Legal entity name, jurisdiction, registration, relationship | Client-requested fields | Not exposed in the observed Fund wizard | Confirm actual entity workflow/API before import; no mapping assumed. |

## Entity request rows

| Proposed legal name | Jurisdiction | Entity type | Relationship to fund | Base currency | Effective date | Source owner | Approval / status |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

Validate legal identifiers in the approved secure source. No legal/tax determination is made by this template.
