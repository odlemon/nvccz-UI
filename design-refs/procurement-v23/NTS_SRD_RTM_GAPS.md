# NTS ProcMS SRD — Requirements Traceability & Gaps

**Authoritative SRD:** `C:/Users/lysp/Downloads/NTS_SRD_DT_ProcMS_16_09_2026.pdf` (v1.1, 16 September 2026)  
**Working text extract:** [`_srd_nts_extract.txt`](./_srd_nts_extract.txt)  
**Live module:** staff portal `/procurement` (procurement-v23)  
**As of:** 21 September 2026  

**Status legend**

| Status | Meaning |
|--------|---------|
| **Aligned** | Requirement met in live UI + API; named evidence exists |
| **Partial** | Core path works; material SRD fields/controls still missing |
| **Gap** | Required for Phase 1 (or Client-confirmed P0) and not delivered |
| **Phase 2** | Explicitly deferred to SmartStream / SSO / RPA / Integration Design Matrix |
| **OOS** | Out of scope unless BRD or change control (SRD §72) |

**Priority:** P0 = mandatory for Phase 1 UAT/go-live (or formal de-scope); P1 = high, expect UAT findings; P2 = enhancement / later.

---

## 0. Phase 1 UAT readiness (one-pager)

**Milestones (SRD cover):** infrastructure 22 Sep · onboarding 23 Sep · **Phase 1 UAT 24 Sep** · Phase 1 prod 25 Sep · Phase 2 SmartStream mapping starts 25 Sep.

### Can the end-to-end journey (§78) run today?

**Yes, on the happy path:** authorised staff can raise a requisition → approve → RFQ → vendor quote → compare/score/award → PO → GRN → invoice/3-way match → pay / Accounting hand-off, with audit and RBAC. Covered by FE `scripts/_uat/procurement-v23-*.mjs` and BE Suites 01–06.

### P0 — resolve or formally de-scope before Phase 1 UAT

| # | Gap | SRD | Owner | Decision needed |
|---|-----|-----|-------|-----------------|
| P0-1 | Configurable evaluation criteria + multi-evaluator / committee scoring | §17–18 | BE + FE | **Closed** — criteria on RFQ + multi-evaluator scores |
| P0-2 | Formal award recommendation package + approval before award finalised | §20 | BE + FE | **Closed** — recommendation submit/decide; accept gated |
| P0-3 | Sealed-bid / bid-opening controls | §16 | Client BRD | **Closed** — sealed until `open-bids` (PUBLIC defaults sealed) |
| P0-4 | Finance handoff status machine (Ready→Submitted→Accepted/Rejected→Paid→Closed) without SmartStream | §25 | BE + FE | **Closed** — `financeHandoffStatus` + PATCH |
| P0-5 | Real Reports Vault (register + spend + exceptions + audit exports PDF/CSV/XLSX) | §37, §3.9 | FE (+ BE filters) | **Closed** — live register exports + builder/preview wired to same export path |
| P0-6 | Approval routing by dept / BU / cost centre / category / branch / method / risk | §12 | BE + Client process maps | **Closed** — stage `matchRules` |
| P0-7 | Approval delegation | §12 | BE + FE | **Closed** — `/approvals/delegate` |
| P0-8 | Admin-created roles & permission sets (roles not hard-coded) | §5–6 | Admin module / config | **Closed** — `POST /roles` + Admin UI |

### P1 — expect UAT noise; schedule remediation

User master fields (§7), vendor country/risk/status set + tax-clearance notifications (§8), plan-line link (§10), PR Branch/BU/Budget Code/configurable numbering (§11, §39), RFP/Tender/direct methods (§13), invitation delivery audit (§14), service receipts (§22), match tolerance config (§24), conflict declarations (§19), notification rules UI (§34), server-side pagination (§36), FX consolidation (§38), status vocabulary parity (§40), dept-scoped access probe (§70). **Closed in remaining close-out** — see [`REMAINING_GAPS_CLOSEOUT.md`](./REMAINING_GAPS_CLOSEOUT.md). NTS P0-1…P0-8 and Suite 06.2/6.7/6.8 closed earlier — see [`NTS_P0_REMEDIATION_PLAN.md`](./NTS_P0_REMEDIATION_PLAN.md) and [`UAT_GAP_CLOSEOUT_PLAN.md`](./UAT_GAP_CLOSEOUT_PLAN.md).

### Phase 2 — do not block Phase 1

**SmartStream only remains deferred:** §26–27, §75. RPA (§28), staff MFA enroll/verify path (§44–45 when TOTP enrolled), AI usage admin (§31) are **Closed** at a minimal working level (see remaining close-out). Full SSO Identity Provider mapping and Integration Design Matrix remain client/Phase 2.

### OOS unless BRD/CR (§72)

Replacing SmartStream, executing bank payments as ProcMS core, full inventory, payroll, full GL, reverse auctions, public marketplace, advanced supplier financing. Asset capitalisation / GRNI (backend-ask #9) → **OOS** unless BRD demands.

---

## 1. Document tensions (read first)

### 1.1 Arcus RTM vs this NTS SRD

| Doc | What it is |
|------|------------|
| [`SRD_TRACEABILITY.md`](./SRD_TRACEABILITY.md) | Maps **older** `Arcus (SRD)_ Procurement Module` (v1.0, 15 Sep 2025). Rows R1–R14 marked **Works** with `_uat` evidence. |
| **This file** | Maps **NTS** `NTS_SRD_DT_ProcMS_16_09_2026.pdf` (v1.1). Adds many controls never in the Arcus RTM (sealed bids, multi-evaluator, handoff states, report suite, delegation, configurable numbering, dynamic roles). |

**Do not treat Arcus “Works” as NTS complete.** Keep Arcus RTM as historical evidence; this RTM is the Phase 1 delivery checklist for NTS.
0jjm
### 1.2 FE refuse-list vs Suite 06 / Arcus “AI Works”

| Claim | Reality |
|-------|---------|
| Arcus R7 / Suite 06 / `procurement-v23-ai-capture.mjs` | **Works:** AI Invoice Capture reads PDF/photo → editable fields → human confirm |
| [`actions.ts`](../../lib/procurement-v23/actions.ts) `extract-invoice*`, `run-ocr`, `flag-invoice`, `approve-match-v5`, fixture OCR queue | Still in `UNCONNECTED_TERMINAL_STEPS` — **alternate/fixture buttons**, not the live capture path |
| backend-asks “OCR upload not connected” on Invoices row | Stale wording relative to AI Capture screen; manual capture + AI Capture are live |

**Rule for UAT:** exercise **AI Invoice Capture** and Approval Centre invoice approve/reject — not refused alternate action names.

### 1.3 BRD not yet supplied (SRD §2)

Client BRD has not been given to the Implementation Partner. Avoid irreversible assumptions (especially §16 sealed bid, §12 routing dimensions). Record BRD-dependent items as **Client decision** in the P0 table.

---

## 2. Requirements Traceability Matrix (NTS SRD §§)

### Platform & access

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 1 | Phase 1 standalone then Phase 2 integration | Partial | P0 | App runs standalone; Client infra deploy dates are programme, not code |
| 3 | System objectives (digitise, approvals, vendor, docs, comparison, audit, RBAC, reporting, policy, AI optional, easy UX) | Partial | P0 | Core P2P + AI optional ok; reporting/policy/delegation thin |
| 4 | High-level workflow Plan→…→Close | Aligned | — | Spine live; see §78 |
| 5 | Roles listed; **roles not hard-coded**; admins create roles/permission sets | Aligned | P0 | `POST /roles` + Admin; `create-role-confirm` live |
| 6 | Granular RBAC (view/create/edit/submit/approve/…); by role/dept/BU/branch/category/ownership/authority; **SoD**; configurable approval limits | Partial | P0 | `GET /procurement/me/access`, amount + `matchRules` matrix; SoD editor still thin |
| 7 | User master field set (approval limit, delegated approver, branch, BU, cost centre, …) | Aligned | P1 | User columns + schema; Admin/profile can store |
| 43–46 | Security, local auth Phase 1, MFA architecture, sessions | Partial | P1 | HTTPS, JWT; **MFA enroll/verify for staff when TOTP enrolled**; full SSO IdP = Phase 2 |
| 47 | Relational DB (not browser storage) | Aligned | — | MySQL via Prisma |
| 70 | Critical security tests (dept isolation, no self-approve, supplier isolation, …) | Aligned | P1 | Authz probe + `GET /procurement/authz/dept-isolation-probe` |

### Vendor & portal

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 8.1 | Vendor record fields (code, legal/trading, TIN/VAT, category, address, **country**, contacts, terms, currency, tax clearance, risk, bank, docs, notes) | Aligned | P1 | `country` / `tradingName` / `riskRating` on create/update |
| 8.2 | Statuses Draft→…→Inactive | Aligned | P1 | `lifecycleStatus` + `registrationStatus` |
| 8.3 | Vendor docs + expiry + **expiry notifications** | Aligned | P1 | `POST /procurement/compliance-reminders/run` + FE `run-compliance-reminders-v6` |
| 9 | Vendor portal: only own opportunities; no competitor data; quote upload; structured pricing; deadline lock; reopen audited | Partial | P0 | `vendor-self-registration` + portal quote; clarifications / ack receipt / reopen audit = verify/partial |

### Planning & requisitions

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 10 | Annual plan fields; **link actuals to plan** | Aligned | P1 | Plan CRUD + PR `planItemId` |
| 11 | PR fields (branch, BU, cost centre, category, justification, lines, budget code, delivery location, suggested vendor, attachments); **configurable numbering** | Aligned | P1 | branch/BU/budget/delivery + settings `prNumberFormat` |
| 12 | Configurable routing (amount, dept, BU, CC, category, branch, method, risk, exception); approve/reject/**return**/comments/**delegate**; decision audit | Aligned | P0 | amount + `matchRules` + delegate |

### Sourcing, evaluation, award

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 13 | RFQ / RFP / Tender / Direct; event fields (criteria, T&Cs, instructions, invited suppliers, …) | Aligned | P1 | `procurementMethod` on create; RFQ drafts still send-creates |
| 14 | Invite suppliers; attach docs; closing; **invitation delivery status** | Aligned | P1 | Invite `deliveryStatus` SENT/FAILED on send |
| 15 | Quotes via portal or staff capture; retain originals | Aligned | — | Portal + staff paths; Suite 03 |
| 16 | Sealed bid / controlled opening | Aligned | P0 | `open-bids` + sealed PUBLIC default |
| 17 | Comparison view (amount, VAT, delivery, terms, validity, compliance, tech/commercial/total scores); drill to docs; no auto-award | Aligned | P0 | Comparison + multi-evaluator criteria |
| 18 | Configurable criteria, weights, pass/fail, **per-evaluator**, consolidation, comments, recommendation | Aligned | P0 | scoringConfig + evaluators[] |
| 19 | Conflict / participation declarations | Aligned | P1 | `POST /rfqs/:id/conflict-declarations` + FE |
| 20 | Award recommendation package + approval before award | Aligned | P0 | recommendation submit/decide |

### P2P control

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 21 | PO from award; fields; branded PDF | Aligned | P1 | PO create/send/PDF + QR verify |
| 22 | Goods + **service** receipt; partial receipts | Aligned | P1 | GRN + `lineType=SERVICE` / milestone |
| 23 | Invoice link vendor/PO/receipt; duplicate detection | Aligned | — | Capture + duplicates suites |
| 24 | 3-way match highlights; **configurable tolerances** | Aligned | P1 | `matchPriceVariancePct` from settings (fallback env) |
| 25 | Phase 1 finance handoff statuses | Aligned | P0 | `financeHandoffStatus` + PATCH |
| 29–30 | Optional AI assist; human confirm; never auto-award/approve | Aligned | — | AI Capture + safety rules; product works without AI |
| 31 | AI usage admin monitoring/limits | Aligned | P2 | `GET /procurement/ai-usage` + FE |

### Documents, audit, notify, UX

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 32 | Central docs PDF/Office/images; upload/preview/download/version/metadata | Partial | P1 | Vault live; eSign still OOS-ish |
| 33 | Mandatory audit event types + immutable history | Partial | P1 | `audit-events` + Audit page |
| 34 | In-app + email notifications; configurable rules | Aligned | P1 | Workflow emails + settings `notificationRulesJson` |
| 35 | Role dashboards + charts with drill-down | Partial | P1 | Command Centre + analytics suites |
| 36 | Search/filter/sort/**pagination**/export | Aligned | P1 | List `limit`/`offset` + register exports |
| 37 | Minimum report catalogue + PDF/CSV/XLSX | Aligned | P0 | Register exports + builder wired to live export |
| 38 | Multi-currency; no silent mix; explicit FX for consolidation | Aligned | P1 | `GET /consolidation-fx` + settings currency |
| 39 | Configurable unique numbering | Aligned | P1 | settings `pr/po/rfqNumberFormat` |
| 40 | Controlled status vocabularies | Aligned | P1 | settings `statusVocabularyJson` |
| 41–42 | Client+server validation; friendly errors | Partial | P1 | Largely aligned; keep hardening |

### Integration & ops (mostly Phase 2)

| § | Requirement (summary) | Status | Pri | Evidence / notes |
|---|----------------------|--------|-----|------------------|
| 26–27 | SmartStream I/O + integration tech requirements | Phase 2 | — | [`SMARTSTREAM_INTEGRATION_DISCOVERY.md`](./SMARTSTREAM_INTEGRATION_DISCOVERY.md) |
| 28 | RPA job ledger | Aligned | — | `GET/POST /procurement/rpa-jobs` |
| 44–45 | SSO / MFA | Partial | — | MFA path live when enrolled; **SSO IdP = Phase 2** |
| 55–56 | Perf / environments / deployment | Partial | P1 | Dev/prod exist; Client infra dates programme-owned |
| 72 | Scope boundaries | OOS | — | See §0 |
| 73 | Implementation priority order | — | — | Platform→Core→P2P→Reports→AI→Integrations — follow for remediation |
| 75 | Integration resilience (queue, retry, no data loss) | Phase 2 | — | Design when SmartStream mapped |
| 76 | Delivery package | Partial | P1 | Source, schema, UAT scripts exist; formal handover pack TBD |
| 78 | End-to-end acceptance journey | Aligned | — | Happy path live |

---

## 3. UAT suite cross-walk

### Suite index → SRD → gaps

| Suite | Doc | Maps to SRD | Status vs NTS | Open items / scripts |
|-------|-----|-------------|---------------|----------------------|
| **01** Vendor / KYC | `nvccz/docs/procurement-uat.md` | §8–9 | Partial | Rating from GRN live; country/risk/expiry notify still P1. FE: `procurement-v23-vendor-master.mjs`, `vendor-self-registration.mjs`, `vendor-history.mjs` |
| **02** Investee drawdown PR | same | §11 (investee path) | Partial | Investee GRN GP review → Suite 05 **5.7 closed** |
| **03** RFQ & bidding | `procurement-uat-suites-03-05.md` | §13–17 | Partial | Competitive bidding live; sealed opening (§16) **no UAT**. FE: workflows / actions |
| **04** PO & sign-off | same | §21 | Partial | **4.3** QR+verify closed; **4.6** amend endpoint closed. FE: `po-filters.mjs`, workflows |
| **05** GRN & QC | same | §22 | Partial | **5.7** GP approval hook closed; **5.9** RTV posting closed; service receipt still thin |
| **06** AI intake / 3-way / match dashboard | `procurement-uat-suite-06.md` | §23–24, §29–30 | Partial | **6.7** tax matrix expanded; **6.2** line-index match / **6.8** no bitmap OCR remain known limits. FE: `ai-capture`, `invoice-*`, `accounting-v52-payables` |

### FE `_uat` scripts (evidence index)

| Script | Covers |
|--------|--------|
| `procurement-v23-vendor-master.mjs` | §8.1 fields / edit |
| `procurement-v23-vendor-self-registration.mjs` | §8–9 portal registration |
| `procurement-v23-vendor-history.mjs` | Vendor history |
| `procurement-v23-requisition-assist.mjs` | §11 project + line suggestions |
| `procurement-v23-approval-route.mjs` | §12 amount routing + notify |
| `procurement-v23-po-filters.mjs` | §21 / §36 PO filters |
| `procurement-v23-ai-capture.mjs` | §29 AI extract |
| `procurement-v23-invoice-reading.mjs` / `invoice-processing.mjs` / `invoice-documents.mjs` / `invoice-auto-approval.mjs` | §23–24, §7–8 Arcus |
| `procurement-v23-analytics.mjs` / `dashboard.mjs` | §35 |
| `procurement-v23-workflows.mjs` / `actions.mjs` / `storyline.mjs` | E2E spine §4/§78 |
| `procurement-v23-explore.mjs` / `sidebar-nav.mjs` / `responsive.mjs` | Census / nav / mobile |
| `procurement-authz-probe.mjs` (BE) | §6 / §70 permission negatives |

### Gaps with **no** dedicated UAT script yet

| Gap | Suggested evidence |
|-----|-------------------|
| §16 Sealed bid opening | New suite after BRD |
| §18 Multi-evaluator criteria | Extend comparison-matrix / evaluation UAT |
| §19 Conflict declarations | New |
| §20 Award recommendation approval | New (wire then script) |
| §25 Finance handoff states | New status assertions |
| §37 Report catalogue | Export smoke per report name |
| §12 Delegation | New |
| §70 Dept-scoped record isolation | Extend authz probe |
| §8.3 Expiry notifications | Scheduler + mail-guard assert |
| UAT 4.6 / 5.7 / 5.9 | **Closed** — amend / GP hook / RTV posting |

---

## 4. Known FE refusals mapped to SRD (not double-count Gaps)

From [`lib/procurement-v23/actions.ts`](../../lib/procurement-v23/actions.ts):

| Cluster | Examples | SRD impact |
|---------|----------|------------|
| RFQ drafts | `save-tender`, `save-tender-v13`, `create-tender-confirm` | §13 Partial (send-creates by design) |
| eSign | `save-and-esign-contract-v6`, `esign-*`, `send-esign*` | §32 / contracts — OOS-ish for Phase 1 unless BRD |
| Assets | `confirm-asset-transfer`, `capitalise-asset` | §72 OOS / ask #9 |
| Vendor messaging | `send-vendor-message*`, `request-vendor-docs-v6` | §9 messaging — not required for Phase 1 core |
| RBAC editors (alt) | `duplicate-role-v6`, `toggle-permission`, `add-sod-rule-v6` | Prefer Admin `POST /roles` |
| Report schedules | `schedule-report-v5` | §37 schedule not stored; Run/export live |
| Alternate OCR buttons | `extract-invoice*`, `run-ocr`, fixture OCR | §29 — use AI Capture instead |
| Invoice approve alternate | `approve-invoice`, `approve-match-v5` | Prefer Approval Centre live path |

---

## 5. Backend-asks still open (cross-ref)

| Ask | State | NTS mapping |
|-----|-------|-------------|
| #2 Budget enforce warn/block | PARTIAL | §11 / policy — P1 |
| #3 Plan line link | **Closed** | §10 — `planItemId` |
| #4 Per-criterion / per-evaluator scores | **Closed** | §17–18 |
| #9 GRNI / asset capitalisation | PARTIAL | §72 OOS unless BRD |
| #10 RFQ invitation/clarification counts | LOW | §14 — P2 |
| #11 Vendor country / rating fill | **Closed** | §8 |
| #12 Tax-clearance reminder scheduler | **Closed** | §8.3 — run endpoint |
| #13 Access-request workflow | LOW | §6 — P2 |
| #14 Local upload URL for payment proof | LOW | Ops |

---

## 6. Recommended remediation order (SRD §73)

1. **Remaining open for Phase 1:** SmartStream is explicitly deferred (§26–27, §75). OOS items stay OOS unless BRD/CR.
2. **Client decisions (optional polish):** full SSO IdP, report schedules, vendor messaging, eSign.
3. **Evidence:** exercise FE `_uat` scripts + new remaining endpoints after deploy.

---

## 7. Related docs (do not overwrite)

| Path | Role |
|------|------|
| [`SRD_TRACEABILITY.md`](./SRD_TRACEABILITY.md) | Old Arcus evidence (R1–R14 Works) |
| [`../procurement-v23-backend-asks.md`](../procurement-v23-backend-asks.md) | Connected matrix + open asks |
| [`HOW_PROCUREMENT_WORKS.md`](./HOW_PROCUREMENT_WORKS.md) | User journeys |
| [`PROCUREMENT_SCREEN_BY_SCREEN.md`](./PROCUREMENT_SCREEN_BY_SCREEN.md) | Screen inventory |
| [`SMARTSTREAM_INTEGRATION_DISCOVERY.md`](./SMARTSTREAM_INTEGRATION_DISCOVERY.md) | Phase 2 discovery |
| `C:/Users/lysp/Downloads/nvccz/docs/procurement-uat*.md` | Backend UAT suites 01–06 |

---

*Generated for Phase 1 readiness against NTS SRD v1.1. Update statuses only when UI/API evidence is named (script or signed UAT).*
