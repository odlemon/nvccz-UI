# Trading SRD User-Story Alignment — 2026-07-20

**Source:** Client user stories (SRD §8 Order Management, §9 Compliance/Simulation)  
**App:** Investments V2 `/investments-v2/orders/*`

---

## Short answer

**Before today:** the trading flow was only **partially** like the SRD story (collapsed statuses, weak pre-trade gate, no transition timeline UI).

**After FE pass:** the UI now **follows the SRD lifecycle shape**. Remaining gaps are mostly **backend** (6 compliance outcomes, PARTIALLY_EXECUTED, archive, valuation/accounting auto-post guarantees).

---

## Story checklist

| Story | Status | FE now | Still needs BE |
| --- | --- | --- | --- |
| **0** Instrument + price | Partial | ACTIVE instruments only; MARKET blocked without mark; warning shown | Validated/Approved price status field |
| **1** New order + pre-trade | Partial → closer | Review **required** before Place; gross/fees/taxes/settlement/weight/cash/exposure/compliance; broker + custodian; Save as Draft | Stop/FOK types, settlement account, docs, approval route |
| **2** Compliance review | Partial | Preview + Compliance tab (PASSED/WARNING/BREACH) | Full 6 outcomes + auto Submitted→Compliance Review |
| **3** Approved → Broker | Partial → closer | Distinct **Approved** / **Sent to Broker** tabs + Send action + timeline from `getOrder.approvals` | Richer transition history if approvals sparse |
| **4** Execute / blotter | Partial → closer | Execute dialog (qty/price) for partial fills; blotter columns | Native `PARTIALLY_EXECUTED` status |
| **5** Settlement | Partial | Blotter **Pending Settlement** / Settled labels + Mark settled | Order-level Pending Settlement if required |
| **6** Cancel/Reject/Fail | Partial | Cancel/Reject + tabs; Failed/Archived tabs ready | Fail + Archive endpoints |
| **7** Valuation | Partial | Manual Recalculate / valuation module | Auto feed from settled trades |
| **8** Accounting | Partial | Mark posted / settle on blotter | Guaranteed balanced event on settle |
| **9** Simulation | Match | Separate Simulation page, what-if only | Rebalance/stress modes optional |

---

## Lifecycle UI (Orderbook tabs)

```
Draft → Submitted → Approved → Sent to Broker → Partially Executed → Executed → Pending Settlement → Settled
Branches: Cancelled | Failed | Rejected | Archived
```

Mapped from API: `DRAFT`, `SUBMITTED`, `APPROVED`, `SENT_TO_BROKER`, `*PARTIAL*`, `EXECUTED`, `*SETTLE*`, etc.

---

## Files changed

- `lib/investments-v2/adapters/orders-adapter.ts` — SRD status labels + tabs helper
- `app/investments-v2/orders/orderbook/page.tsx` — tabs, Status column, Filled, timeline, execute dialog
- `components/investments-v2/place-equity-order-modal.tsx` — review gate, broker/custodian, draft, pre-trade split
- `app/investments-v2/orders/blotter/page.tsx` — Pending Settlement filter

Backend asks for remaining gaps: see root `backend_asks.md` (BA-2, BA-6 + new BA-T* entries).
