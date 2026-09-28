# Procurement UAT gap close-out plan

**Scope:** Backend UAT Suites 03–06 leftovers called out in [`NTS_SRD_RTM_GAPS.md`](./NTS_SRD_RTM_GAPS.md) §0/§3 — **not** the full NTS P0 product list (multi-evaluator, award recommendation package, reports vault, etc.). Those remain a separate remediation track.

**Backend repo:** `C:/Users/lysp/Downloads/nvccz`  
**UAT doc:** `nvccz/docs/procurement-uat-suites-03-05.md`, `procurement-uat-suite-06.md`

| ID | Gap | Close approach | Pri |
|----|-----|----------------|-----|
| **4.3** | PO PDF QR was removed; verify URL behind staff auth | Embed real QR (`qrcode`) → public `GET …/verify?token=`; restore signature block | P0 |
| **4.6** | Version only on line cancel; `amendmentOfPoId` unused | `POST /purchase-orders/:id/amend` clones PO + lines, sets amendment link + version | P0 |
| **5.7** | Investee GRN → `PENDING_GP_REVIEW` with no ApprovalService hook | After create, `ApprovalService.createApprovalRequest({ stageType: "GRN" })` | P0 |
| **5.9** | RTV inserts row only (“posting TBD”) | Reverse PO received/pending qty; adjust GRN accepted; rematch; mark RTV `POSTED` | P0 |
| **6.7** | Tax check is one rule | Expand treatment × vendor compliance matrix | P1 |
| **6.2 / 6.8** | Line-index match; no bitmap OCR | Document as known limitation / future — not closed in this pass | Defer |

**Out of this plan:** NTS P0-1…P0-8 (evaluation criteria, award recommendation, sealed-bid BRD, finance handoff states, reports vault, multi-dimension routing, delegation, dynamic roles).

**Done when:** UAT docs updated to remove “placeholder / TBD / incomplete” wording for 4.3, 4.6, 5.7, 5.9, 6.7; RTM cross-walk notes these as closed.

## Status (21 Sep 2026)

| ID | Status | Implementation |
|----|--------|----------------|
| 4.3 | **Closed** | Public verify route; `ProcurementPoPdfService` QR via `qrcode` |
| 4.6 | **Closed** | `POST /procurement/purchase-orders/:id/amend` |
| 5.7 | **Closed** | `ApprovalService.createApprovalRequest({ stageType: "GRN" })` on investee GRN |
| 5.9 | **Closed** | RTV posts qty reverse + rematch + `POSTED` |
| 6.7 | **Closed** | Treatment × compliance matrix in `VendorInvoiceIntakeService` |
| 6.2 / 6.8 | Deferred | Documented known limits |
