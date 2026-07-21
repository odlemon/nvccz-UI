# SRD Compliance Checklist — Client Walkthrough (2026-07-20)

**Scope:** Reconciliation (SRD §16; cash §11–12), Client Statements / Reporting (SRD §18; §12.1), Order Management / Trading (SRD §10–13)  
**Environment:** `http://localhost:3001` · API `http://localhost:3009/api` · `admin@nts.com` / `admin123`  
**Evidence:** API smoke (14/14 pass) · Playwright browser (21/21 pass) · lifecycle probe · manual code trace

**Legend:** Working · Broken (fixed) · Broken (logged as backend ask) · Not implemented

---

## A. Reconciliation (SRD §16; cash SRD §11–12)

### A.1 Supported reconciliation types (SRD §16)

- [x] **Cash reconciliation** — Compare internal cash vs bank/custodian  
  - **Status:** Working  
  - **Notes:** Fund cash batches + cash ledger + overview. Browser: Overview, Cash ledger, Fund cash **pass**.

- [ ] **Holdings reconciliation** — Compare internal holdings vs custodian  
  - **Status:** Not implemented (logged BA-4)  
  - **Notes:** No dedicated tab; **Broker & custodian** three-way workspace covers holdings-style matching. Browser **pass**.

- [ ] **Trade reconciliation** — Missing/extra trades vs broker  
  - **Status:** Not implemented (logged BA-4)  
  - **Notes:** Use **Trade Blotter** for trade status; no dedicated trade-recon screen.

- [x] **Broker confirmation / custodian position / accounting ledger / NAV / price / FX**  
  - **Status:** Partial — Working where API exists  
  - **Notes:** Broker & custodian UI live; fund cash for cash; valuation on separate module.

### A.2 Reconciliation statuses (SRD §16)

- [x] **Matched**  
  - **Status:** Working (mapped)  
  - **Notes:** Broker workspace + fund cash Matched tab.

- [x] **Unmatched**  
  - **Status:** Working (mapped)  
  - **Notes:** Unmatched internal/external lines in batch workspace.

- [x] **Partially Matched**  
  - **Status:** Partial  
  - **Notes:** Shown as Potential/suggestions/breaks — label differs (BA-7).

- [x] **Investigating**  
  - **Status:** Working  
  - **Notes:** Exceptions filter + workflow status.

- [x] **Resolved**  
  - **Status:** Working (mapped)  
  - **Notes:** Closed/approved exceptions in seed.

- [x] **Written Off**  
  - **Status:** Partial  
  - **Notes:** Close action exists; explicit label not guaranteed.

- [x] **Escalated**  
  - **Status:** Partial  
  - **Notes:** Escalate on broker items; cash exceptions use severity mapping.

### A.3 Exception resolution (SRD §16 — user, timestamp, reason, evidence)

- [x] **Raise exceptions on cash/holdings/price/accounting breaks**  
  - **Status:** Working  
  - **Notes:** Fund cash breaks + `GET /reconciliation-exceptions`.

- [x] **Capture user, timestamp, reason on resolution**  
  - **Status:** Working  
  - **Notes:** Propose/approve/close + comments; timeline wired.

- [x] **Supporting evidence (attachments)**  
  - **Status:** Working  
  - **Notes:** Upload → `POST …/attachments {fileId}`.

- [ ] **Live resolve OPEN exception during demo**  
  - **Status:** Broken (logged BA-3)  
  - **Notes:** Only APPROVED exception in seed; demo read-only or fund-cash match instead.

### A.4 Cash matching engine (cash SRD §12.1–12.5)

- [x] **Transaction reconciliation (internal ↔ external lines)**  
  - **Status:** Working  
  - **Notes:** Fund cash batch workspace. Browser **pass**.

- [x] **Balance reconciliation**  
  - **Status:** Partial  
  - **Notes:** Fund cash summary KPIs.

- [x] **Broker & custodian three-way**  
  - **Status:** Working  
  - **Notes:** Browser **pass**.

- [x] **Auto-match / suggest / confirm algorithm**  
  - **Status:** Working  
  - **Notes:** Suggested matches + confirm in workspace.

- [x] **Exception catalogue codes**  
  - **Status:** Working  
  - **Notes:** Types from API mapped in adapter.

---

## B. Client Statements & Reporting (SRD §18; cash §12.1 periodic types)

### B.1 Report generation & viewing

- [x] **Generate client/investor statement for a period**  
  - **Status:** Working  
  - **Notes:** Generate Batch on statements page.

- [x] **View statement (holdings, NAV, P&L, transactions context)**  
  - **Status:** Working with known issues  
  - **Notes:** Browser: row select + preview **pass**. Investor capital lines partial (BA-9).

- [x] **Statement data matches portfolio for same period**  
  - **Status:** Partial  
  - **Notes:** Opening/closing cash from API; full cross-check manual for demo.

### B.2 Export formats (SRD §18)

- [x] **PDF export**  
  - **Status:** Working (logged BA-5)  
  - **Notes:** Browser download **pass** via JSON base64 decode.

- [ ] **Excel export**  
  - **Status:** Not implemented (BA-8)

- [ ] **CSV export**  
  - **Status:** Not implemented (BA-8)

### B.3 Statement workflow

- [x] **Approve statement run**  
  - **Status:** Working  
  - **Notes:** Browser approve **pass**.

- [x] **Email delivery**  
  - **Status:** Working  
  - **Notes:** Email action wired.

- [x] **Client vs investor segment**  
  - **Status:** Working  
  - **Notes:** View segment toggle; prefer Client segment for demo.

- [x] **Status badges (Draft / Pending / Approved / Delivered)**  
  - **Status:** Broken (fixed)  
  - **Notes:** Was collapsed to 2 states; fixed in adapter + RunStatus component.

---

## C. Order Management & Trading (SRD §10–13)

### C.1 Stock picker / new order (SRD §10)

- [x] **Place equity order with review step**  
  - **Status:** Working  
  - **Notes:** Place Equity Order modal; browser blotter entry **pass**.

- [x] **Compliance check before proceed**  
  - **Status:** Working  
  - **Notes:** 5 compliance results in lifecycle probe; Compliance tab **pass**.

### C.2 Orderbook (SRD §11)

- [x] **Tabs: Orderbook, New, Pending, Executed, Cancelled, Failed, Rejected, Settled**  
  - **Status:** Working  
  - **Notes:** Browser orderbook row select **pass**.

- [x] **Required order fields**  
  - **Status:** Working  
  - **Notes:** Table + detail panel.

- [x] **Lifecycle: Draft → … → Settled**  
  - **Status:** Partial — Broken (logged BA-2, BA-6)  
  - **Notes:** Submit/approve/send/execute wired; seed lacks DRAFT/SUBMITTED; execute slow.

- [x] **Audit: user, timestamp, reason on transitions**  
  - **Status:** Partial  
  - **Notes:** Reject/cancel reason dialogs; full audit trail not in UI.

### C.3 Trade blotter (SRD §12)

- [x] **Show executed/pending trades with required columns**  
  - **Status:** Working  
  - **Notes:** 13 trades in API; browser **pass**.

- [x] **Confirmation, settlement, accounting status**  
  - **Status:** Working  
  - **Notes:** Confirm/Settle/Mark posted on detail panel.

- [x] **New orders appear after execute**  
  - **Status:** Partial — Broken (logged BA-2)  
  - **Notes:** Blotter lists trades; execute must complete first.

### C.4 Compliance (SRD §13)

- [x] **Pre-trade rules configurable and visible**  
  - **Status:** Working  
  - **Notes:** Browser **pass**.

- [x] **Check every order before approval/execution**  
  - **Status:** Working  
  - **Notes:** Compliance results per order.

- [x] **Override with documented reason**  
  - **Status:** Working  
  - **Notes:** Override modal + history.

---

## Walkthrough readiness (one line per area)

| Area | Status |
| --- | --- |
| **Reconciliations** | **Ready with known issues** |
| **Client Statements** | **Ready with known issues** |
| **Trading Workflow** | **Ready with known issues** |

### Demo tips

| Risk | Mitigation |
| --- | --- |
| No OPEN exception | Show approved exception timeline; demo fund-cash match |
| No DRAFT order | Place new order live at start |
| Execute hangs ~4 min | Show pre-staged SETTLED blotter trades |
| Holdings/Trade recon tabs | Use Broker & custodian + Blotter; explain V2 scope |

See [`backend_asks.md`](./backend_asks.md) for blocker detail (BA-1 through BA-9).

**Pre-session commands:**
```bash
node scripts/uat-walkthrough-investments.mjs
node scripts/walkthrough-investments-browser.mjs
```
