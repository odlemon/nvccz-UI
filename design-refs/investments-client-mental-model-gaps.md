# Investments V2 — client mental model vs implemented (gaps)

**Date:** 2026-08-13 (updated)  
**Source:** Client walkthrough feedback (asset-manager story)  
**Related:** `walkthrough-investments-v2-end-to-end.md`, `investments-trading-recon-client-retune-backend-asks.md`

---

## Scope lock (product)

| Step | In product? |
|------|-------------|
| Client gives us money to grow | **Out of scope** — outside this system |
| Put money in the bank | **Out of scope** — outside this system |
| Give orders to stock broker | **In scope — working** (do not rebuild) |
| Create investment models → draft orders | **Parked** — models stay view-only (create/edit + drift). No activate / rebalance run / convert. |
| Bank vs us vs broker must match | **In scope — this wave** |
| Bank release instruction (Phase-2) | **Deferred** — settle remains Phase-1 |

---

## Verdict

| Area | Status |
|------|--------|
| Broker order → email → confirm → blotter → settle | **Working** |
| Investment models → rebalance run → draft orders | **Parked** — view-only models; execution UI removed |
| Trade match (us × broker × bank/custodian) | **This wave** |
| Cash match (us ledger × bank statement) | **This wave** |
| Positions (holdings × settled trades) | **This wave** |
| Funding / cash-in UI | **Out of scope** |

---

## Active closure work

### A) Models (parked)

Create / edit / drift / “recommendations · no execution” only. Do **not** reintroduce activate → rebalance run → draft orders unless product asks.

### B) Bank vs us vs broker

| Party | Surface | Meaning |
|-------|---------|---------|
| **Us** | Blotter + cash ledger | Our books |
| **Broker** | Trade recon broker ingest | Broker statements |
| **Bank** | Trade recon custodian ingest + fund-cash bank file | Custodian / bank records |

Overview hub + Trade match + Cash match + Positions (live APIs only).

---

## Smoke check (recon wave)

1. Overview shows live KPIs for Trade / Cash / Positions for the selected fund.
2. Overview CTAs open Trade / Cash / Positions with `?fundId=` applied.
3. Positions page shows breaks or healthy zero via `GET /client-account-reconciliation`.
4. Trade wizard still matches us × broker × custodian; Cash still matches ledger × bank statement.
