# Investments V2 — BE scan answers applied on FE

**Date:** 2026-07-20  
**BE answers:** user message (BE-SCAN-1…9)  
**Source of truth:** [`investments-v2-module-completion.md`](./investments-v2-module-completion.md)

---

## Applied

| Ask | BE | FE |
| --- | --- | --- |
| **BE-SCAN-1** | `POST /portfolios` canonical | Already wired (Portfolio Setup → New portfolio) |
| **BE-SCAN-2** | `listedEquitySecurityId` on create | Already consumed by Prices manual select |
| **BE-SCAN-3** | `GET /compliance/overrides` enriched | **Wired** — Compliance history loads from API; create then reload |
| **BE-SCAN-4** | Subcategories CRUD exists | **Wired** — New Sub Category + list table on Instrument Types |
| **BE-SCAN-5** | Tags/CA PATCH + settings PUT | **Wired** — pencil Check saves via PATCH/PUT with `expectedVersion` where required |
| **BE-SCAN-6** | Transaction linked ids | **Wired** — adapter + drawer show `tradeId`/`orderId`/`journalEntryId`/`documentId`/`valuationRunId` |
| **BE-SCAN-7** | Cash seed on nts | Doc note — re-run `npm run db:seed:stock-picker-cash` if Import empty |
| **BE-SCAN-8** | send-to-broker needs version + Idempotency-Key; body optional | **Wired** — `sendOrderToBroker(id, { expectedVersion })` + idempotency headers |
| **BE-SCAN-9** | Hide Export/Columns | **Done** — dead Export/Columns removed on recon screens |

---

## API client additions

`lib/api/investment-ops-api.ts`:

- `listComplianceOverrides`, `approveComplianceOverride`, `rejectComplianceOverride`
- `updateSetupTag`, `updateCorporateActionMapping`
- `list/create/update/archiveInstrumentSubcategory`
- `sendOrderToBroker(id, body)` with idempotency headers

---

## Still open for full T1 (not in this BE answer batch)

From module-completion Part B / A17+:

- Document download UI (client method exists)
- Order→trade execution UAT path (product/BE path for fills)
- Exception file picker (still `fileId` text)
- Orderbook execute/reject / blotter routing hops (optional)
- Accounting journal multi-step if required

---

## Verify

1. Compliance → create override → refresh → row in Override audit history  
2. Setup → Instrument Types → New Sub Category → appears in table  
3. Setup → Tags/Corporate Actions pencil → edit → Check → persists  
4. Transactions drawer shows linked ids when BE sends them  
5. Orderbook → Send to broker on APPROVED order (with version)  
6. Recon pages: no Export/Columns ghost buttons  
7. Optional: `npm run db:seed:stock-picker-cash` then Fund Cash import  
