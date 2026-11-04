# Initial synthetic fund configuration record

**Record status: SUBMISSION OUTCOME UNRESOLVED — do not duplicate.** The wizard UI was exercised in Singapore dev as admin. The save remained “Saving…” for more than 30 seconds and no success/error toast or record ID was observed by the last check.

| Field observed in UI | Synthetic value entered | Evidence status |
|---|---|---|
| Fund name | `TRAINING DEMO — Matanho Growth Fund I` | Entered in live wizard; persistence not confirmed. |
| Strategy | Growth Equity | Selected from available choices. |
| Vintage | 2026 | Entered. |
| Currency | USD | Selected. |
| Target commitment | USD 5,000,000 | Entered; synthetic value only. |
| Primary geography | Zimbabwe | Entered. |
| Description | Synthetic training fund only; not client mandate/investment instruction. | Entered. |
| Management fee, carry, min/max ticket, focus industries | Left blank | Optional inputs shown in Ownership step; no client terms invented. |
| Returned ID / saved retrieval | None observed | BLOCKED; check the existing submission's outcome via refreshed list before any retry. |

No entity or investor is linked. This is not an approved investment mandate or offer. Do not use the amounts for financial reporting.

## Follow-up observation

The UI later returned to the review modal with the **Create fund** button enabled; no success/error toast was visible. After closing the modal, the Funds screen still showed **0 funds**. This is evidence the workflow did not report success, not conclusive proof the server never committed a delayed write. Do not repeat the request until the exact name is checked by an authorized read-only list/API query.
