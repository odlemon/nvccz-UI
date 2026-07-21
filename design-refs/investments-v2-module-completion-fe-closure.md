# Investments V2 — Module-completion FE closure

**Date:** 2026-07-20  
**Source of truth:** [`investments-v2-module-completion.md`](./investments-v2-module-completion.md)  
**Applies BE filled responses A1–A17 + P1–P5.**

---

## What FE changed in this batch

| Ask | Change | Call sites |
| --- | --- | --- |
| **A17 / F5** | `executeOrder(id, { expectedVersion, quantity?, price? })` + Idempotency-Key; orderbook **Execute (create trade)** + **Reject** | `lib/api/investment-ops-api.ts`, `app/investments-v2/orders/orderbook/page.tsx`, slice thunks |
| **A12 / F4** | Documentation drawer + row download via `downloadDocument` | `app/investments-v2/documentation/page.tsx` |
| **A13 / F7** | Journal submit / approve / reject / post with `expectedVersion`; `createLedgerExport` + UI | `investment-ops-api.ts`, `app/investments-v2/accounting/page.tsx` |
| **A16 / F9** | Exception attachment file picker → `uploadBinaryFile` → `postExceptionAttachment` | `app/investments-v2/reconciliation/exceptions/page.tsx` |
| **F8** | Valuation escalate / approve-override / reject-override buttons | `app/investments-v2/valuation/page.tsx` |
| **P4 / F10** | Already hidden in prior BE-SCAN closure | recon toolbars |

## Explicitly not built (BE WONT for T1)

- P1 Manual position UI  
- P2 Holdings recon in V2 sidebar  
- P3 Cash period / GL screens  
- P5 Instrument restrict/archive UI (F11 optional)  

## Still optional polish

- F6 blotter routing hops / settlement document  
- F12 approval-route edit/delete  
- F13 client cash account create form (seed covers T0)  

## UX polish (2026-07-20 batch)

| Ask | Change |
| --- | --- |
| Nested `instrument` on holdings | `Holding.instrument`; adapters use `instrument ?? security` |
| `createdByName` | `displayPersonName` in `mapInstrumentRow` |
| Import `canSubmit` | Fund-cash GET import detail before submit |
| Overview / exposure / reviewable | Already wired; confirmed against BE UAT script |

**UAT:** `npm run uat:investments-v2:ux-polish` · **Seed:** `npm run db:reset:investments-v2-demo`
