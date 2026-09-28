# NTS P0 product remediation plan

**Scope:** Close Phase 1 P0 gaps in [`NTS_SRD_RTM_GAPS.md`](./NTS_SRD_RTM_GAPS.md) §0 plus Suite 06.2 / 6.8 so they are **working** for UAT (not formal CR de-scope).

**Repos:** `C:/Users/lysp/Downloads/nvccz`  
**FE:** `c:/Users/lysp/Downloads/nvccz-new` (procurement-v23)

| ID | Gap | Approach (shippable) | Status |
|----|-----|----------------------|--------|
| **P0-1** | Multi-evaluator / criteria (§17–18) | RFQ `scoringConfig.criteria[]`; evaluation accepts criterion scores + `evaluators[]`; matrix averages | **Closed** |
| **P0-2** | Award recommendation (§20) | `POST …/recommendation` → `PENDING_APPROVAL`; decide endpoint; accept blocked while pending | **Closed** |
| **P0-3** | Sealed bid opening (§16) | `sealedBidding` + `open-bids` stamp; prices sealed until open; **comparison matrix also redacts** | **Closed** |
| **P0-4** | Finance handoff (§25) | `financeHandoffStatus` + PATCH; sync PAID on payment | **Closed** |
| **P0-5** | Reports vault (§37) | Live register export + spend/exception title maps | **Working** (templates builder still refused) |
| **6.2** | Line-index match | Fuzzy pairing in `ProcurementInvoiceMatchService` **and** `ThreeWayMatchService` | **Closed** |
| **P0-6** | Multi-dimension routing (§12) | Stage `matchRules` JSON filtered in ApprovalService | **Closed** |
| **P0-7** | Delegation (§12) | `POST /approvals/delegate` + FE confirm | **Closed** |
| **P0-8** | Dynamic roles (§5–6) | `POST /roles` wired from `create-role-confirm`; Admin `/admin/roles` | **Closed** |
| **6.8** | Bitmap OCR | `extract-invoice` / `run-ocr` → Suite 06 extract (tesseract images) | **Closed** |

**Migration:** `npx ts-node scripts/run-nts-p0-migration.ts` then `npx prisma generate`
