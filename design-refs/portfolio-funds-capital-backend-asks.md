# Portfolio module — backend asks (funds / capital-calls cards)

Updated: 2026-09-04

## Context

Portfolio V11 FE (`/portfolio/*`) paints progressive scopes. Funds page side cards and Capital Calls allocation cards need richer list payloads than some endpoints currently return.

## Asks

### 1. Capital call list — include allocation totals

**Why:** Funds “Recent Capital Activity” and Capital Calls register need amount/collected without N+1 `GET /funds/:id/capital-calls/:callId`.

**Endpoint:** `GET /funds/{fundId}/capital-calls`

**Add to each summary row (example):**

```json
{
  "id": "…",
  "callPercent": "5.000000",
  "status": "NOTICES_SENT",
  "statusLabel": "Notices sent",
  "paymentDueDate": "2026-09-25",
  "transactionDate": "2026-09-04",
  "_count": { "allocations": 3 },
  "totalCallAmount": 2275000,
  "totalCollected": 1593750,
  "purpose": "Follow-on investments"
}
```

**FE today:** `lib/portfolio-v11/bootstrap.ts` `loadCapitalCallsScope` fetches `detail()` for up to 12 calls per fund as a workaround.

**Verify:** `/portfolio/capital-calls` shows non-zero Total Amount / Collection Progress from list alone (no detail flood in network tab).

### 2. Fund performance fields on fund list (optional)

**Why:** “Top Performing Funds” currently uses deterministic illustrative IRR/TVPI when API omits performance.

**Endpoint:** `GET /funds` (or portfolio fund list)

**Nice-to-have fields:** `grossIrr`, `netIrr`, `tvpi`, `dpi`, `distributed`

**FE today:** `adaptFunds` in `lib/portfolio-v11/adapters.ts` falls back to stable demo metrics per fund id.

### 3. Report vault run metadata (optional)

**Why:** Live Reports Vault cards are richer with title/pages/classification.

**Endpoint:** `GET` fund report runs

**Nice-to-have:** `title` / `periodLabel`, `pageCount`, `classification`

**FE today:** Adapts `periodStart`/`periodEnd`/`deliveredCount`; pages/UI hardcode fixtures remain when runs empty.

## Not asked (resolved FE-side)

- Reports Vault / E-Signatures: live hydrate kept; v25 fixtures retained when live arrays empty.
- Reporting schedules: seeded with relative `nextRunAt` via `scripts/seed-portfolio-v11-full-demo.ts`.
