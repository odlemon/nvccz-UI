# Portfolio — backend asks (staff Phase 0–2 follow-ups)

Updated: 2026-09-05  
Related: [`portfolio-investee-gap-analysis-and-plan.md`](./portfolio-investee-gap-analysis-and-plan.md), [`portfolio-funds-capital-backend-asks.md`](./portfolio-funds-capital-backend-asks.md)

## 1. Fund list IRR / DPI / TVPI (T2.6) — required for Funds performance cards

**Why:** Staff Funds register and “Top Performing” cards need real performance. FE no longer invents demoSeed IRR/DPI; missing fields render as `0` / empty.

**Endpoint:** `GET /funds` (list payload consumed by `lib/portfolio-v11/adapters.ts` → `adaptFunds`)

**Add fields (example):**

```json
{
  "id": "…",
  "name": "Matanho Growth Fund II",
  "grossIrr": 18.4,
  "netIrr": 15.2,
  "tvpi": 1.84,
  "dpi": 0.42,
  "distributed": 12500000
}
```

Alternate acceptable shape: nested `performance: { grossIrr, netIrr, tvpi, dpi }`.

**FE today:** Prefers live fields; if all absent → `0` (no illustrative seed).

**Verify:** `/portfolio/funds` after seed shows non-zero IRR/DPI only when API returns them.

Also tracked under ask §2 in `portfolio-funds-capital-backend-asks.md` — promote from optional to required for Funds page honesty.

---

## 2. Screening decisions — related APIs only (T1.4)

**No 1:1 endpoints** for `confirm-shortlist` / `rerun-screening` / `screen-reject` / `human-review`.

**FE wiring (staff):**

| UI action | FE → API |
|---|---|
| `confirm-shortlist` | `POST /applications/:id/trigger-shortlisting` |
| `rerun-screening`, `human-review` | `POST /applications/:id/analyst-screening` `{ score }` |
| `screen-reject` | same analyst-screening with low score (default 40) |

**Remaining BE asks (optional product polish):**

- Explicit `POST .../confirm-shortlist` that advances stage without re-running AI shortlist
- Explicit reject / human-review routes with reason codes (instead of score heuristics)
- Error codes: `409` when stage is not screening-pending / screening

**FE files:** `lib/portfolio-v11/actions.ts`, runtime live bridge (`scripts/portfolio-runtime-live-bridge.inc.js`)

**Verify:** On a screening-stage live deal, Confirm shortlist → stage moves; Screen reject → scorecard recorded.

---

## 3. Application intake source identifier (staff Add Deal vs applicant form) — DONE locally

**Status:** Implemented on BE + FE (no UI display yet). Column `applications.source` (`INTERNAL` | `APPLICANT_FORM`, default `APPLICANT_FORM`). Staff Add Deal sends `INTERNAL` silently; public `/funding-application` sends `APPLICANT_FORM`. UI selector / badges removed from Add Deal wizard.

**Migration:** `npm run db:migrate:application-intake-source` + `npx prisma generate`.

**FE files:** `matanho-portfolio-runtime.js`, `lib/portfolio-v11/actions.ts`, `lib/api/applications-api.ts`, `funding-application-app.tsx`.
**BE files:** `prisma/schema.prisma`, `ApplicationController.ts`, `ApplicationService.ts`, `scripts/run-application-intake-source-migration.ts`.

---

## 4. Capital-call notices — confirmed present

`capitalCallsApi.sendNotices(fundId, callId)` already used by `send-capital-call-notices`. UI trigger restored on capital-call detail. No new BE work unless list payload lacks `fundId` on the call row (then include it on `GET /funds/:id/capital-calls`).

---

## 5. Phase 4 product destinations (staff note)

| Gap | Decision for staff path |
|---|---|
| **T4.1 Requests** | Staff inbox = Procurement VC investee queue (`GET /procurement/requisitions/investee`). Portfolio module does not host a parallel inbox. Founder writes owned by investee Phase 3 agent. |
| **T4.2 Messages** | No applicant message API. Closest: deal `GET/POST /applications/:id/collaboration/messages`. Portfolio Messages workspace stays unwired until product picks collaboration reuse vs new thread API. |
