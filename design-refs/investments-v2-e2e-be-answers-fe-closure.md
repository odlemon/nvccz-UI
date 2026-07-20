# Investments V2 — E2E BE answers → FE closure (2026-07-20)

Companion to BE note “Investments V2 — E2E audit BE answers”.  
Prior FE audit: [`investments-v2-end-to-end-gaps.md`](./investments-v2-end-to-end-gaps.md).

---

## Product decisions applied

| Ask | Decision | FE action |
| --- | --- | --- |
| **BE-1** New Position | No `POST /holdings`. Admin sub: `POST …/transactions/manual-adjustments` later | **Hidden/removed** New Position dialog; adjust UI deferred |
| **BE-2** P&L runs | Same `GET /valuation/runs` (+ PnL fields) | P&L tab uses same runs + PnL columns |
| **BE-4** Cash ledger Cap Calls/Dist/Fees/Docs | Not cash-owned | Deep-links to Fund Ops / LP / docs |
| **BE-6** Coupon + icons | Real catalogs | Live list/create on Setup tab |

---

## FE wire status

| Ask | Status | Evidence |
| --- | --- | --- |
| **BE-3** Exception comments/attachments/audit | **Wired** | `stockPickerCashApi.list/postExceptionComments`, attachments, `getExceptionAudit` on exceptions page |
| **BE-5** Posting statuses | **Wired** | `listAccountingPostingStatus` on accounting Posting Statuses tab |
| **BE-6** Coupon + icons | **Wired** | `listCouponFrequencies` / `createCouponFrequency`, `listSetupIcons` / `createSetupIcon` |
| **BE-7** Price history `series` | **Wired** | Order modal prefers `res.data.series` then `items` |
| **BE-8** Fund config keys | **Wired** | Portfolio setup save/load `costBasisMethod`, `pricingSource`, `settlementCycle`, `cutoffTime` via `updateSetupFundConfig` |
| **BE-9** Currency decimals | **Wired** | Currencies table `decimalPlaces ?? decimals` |
| **BE-10** Owner/trader names | **Wired** | Blotter cards `ownerName`/`createdByName`; order trader same |

---

## Deferred / not in this close

- Manual position adjustment UI (`POST /portfolios/:fundId/transactions/manual-adjustments`) — product chose hide New Position for now
- BE migrate/generate scripts — backend ops (`npm run db:migrate:investments-v2-e2e-be-gap:all-dbs`)

---

## Verify (FE smoke after BE migrate)

1. Portfolios overview — no New Position CTA  
2. Exceptions → Comments / Attachments / Audit Trail load & post against selected exception  
3. Accounting → Posting Statuses shows counts / recent failures  
4. Cash ledger Fund tabs → deep-link pills (not empty stubs)  
5. Setup → Coupon Frequency + Icons list/create  
6. Portfolio setup save persists cost basis / pricing / settlement / cutoff  
7. Currencies Decimals column populated when API sends decimals  
8. Orderbook blotter owner shows name when BE sends `ownerName`  
9. Valuation P&L tab shows Total/Realised/Unrealised from same runs  
10. Place order chart uses history `series` when present  
