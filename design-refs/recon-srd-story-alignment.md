# Cash Reconciliation & Statement Ingestion — SRD Story Alignment (2026-07-20)

**Source:** Client Accounts / Cash / Ledgers / Reconciliations SRD §§11–15  
**Scope:** Incoming bank/broker/custodian files + recon engine (not outgoing investor statements)  
**Primary screen:** `/investments-v2/reconciliation/fund-cash`

---

## Short answer for today’s demo

**Before:** Import auto-chained create → validate → submit → commit in one drop; matching showed a single confidence %; confirm sent `matchedAmount: '0.00'`; no Balanced vs Fully reconciled; no manual match / unmatch.

**After FE pass:** Import follows **RECEIVED → Validate → Submit (maker) → Commit (checker)** with hash, errors, reject; matching shows **score bands** + optional component scores; confirm uses real amounts; **manual match** + **unmatch (reversal)**; **Balanced / Fully reconciled** labels; batch picker for scoped batches.

**Still BE-dependent:** period close (C1 / BA-R4), split/net match topologies (BA-R3).  
**BE DONE for demo:** control-total gate + maker≠checker (BA-R1), OPEN exception seed (BA-R5), CBZ_CSV_V1 + line errors + dup hash (BA-R6), score components on suggestions (BA-R2 partial).

---

## Story scorecard

| Story | Grade | FE now | Needs BE |
| --- | --- | --- | --- |
| **A1** RECEIVED first | Matches | File create + SHA-256 hash; status chip RECEIVED; no silent post | Async parse job statuses (nice-to-have) |
| **A2** Parse / normalise | Matches for demo | Validate; line/field errors from validate + GET `/errors` | Rich staging preview (10 lines) |
| **A3** Maker review | Matches for demo | Control opening/closing inputs; Commit sends controls; 409 codes surfaced | — (admins bypass maker≠checker) |
| **A4** Duplicates | Matches for demo | `DUPLICATE_SOURCE` messaging; hash sent | — |
| **B1** Scoped batch | Matches | New batch = account + currency + period; batch picker | — |
| **B2** Scoring 50/20/20/10 | Matches for demo | Nested `scoreComponents` + weights + weighted display | Always populate on every suggestion |
| **B3** Hard rules + bands | Matches for demo | Hard-rule blocks confirm; hardFailures list; bands | — |
| **B4** Confirm / split / unmatch | Partial | Confirm + manual match + reverse | Split/net topologies (BA-R3) |
| **B5** Balanced vs Fully Rec. + exceptions | Partial → closer | Distinct labels; OPEN seed for resolve | Full exception verb UI polish |
| **C1** Period close | Missing | — | cash-periods APIs (BA-R4) |

---

## Demo script (Fund Cash)

1. **Import Statements** → pick account/provider → select CSV → status **RECEIVED** + hash  
2. **Validate** → review errors / control totals  
3. **Submit for approval** (maker)  
4. **Commit** (checker user if required)  
5. **New batch** → account / currency / period  
6. **Run Reconciliation** (+ Auto-match)  
7. Review suggestions by band → **Confirm** or investigate weak  
8. Or select internal + bank → **Confirm manual match**  
9. **Unmatch** with reason if needed  
10. Read **Balanced** vs **Fully reconciled** chips  

Outgoing client statements remain under `/reconciliation/statements` (Reporting SRD), not this ingestion flow.

---

## Files touched

- `app/investments-v2/reconciliation/fund-cash/page.tsx`
- `lib/investments-v2/adapters/cash-recon-adapter.ts`
- `lib/api/stock-picker-cash-api.ts` (`listExternalStatementImportErrors`)
- `backend_asks.md` (BA-R*)
