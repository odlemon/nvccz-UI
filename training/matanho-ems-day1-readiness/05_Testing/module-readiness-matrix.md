# Seven-module readiness matrix

Assessment is based on live dev observations and existing documented evidence, not page existence alone.

| Priority | Module | Status | Verified operation / evidence | Critical gap |
|---:|---|---|---|---|
| 1 | Fund & Entity Management | **PARTIALLY WORKING** | Admin opened Portfolio Management → Funds. Funds list displayed 0 funds. Real create wizard Details/Ownership/Review and its visible fields were verified. | Synthetic POST stayed “Saving…” >30s; no ID/retrieve. Legal entity workflow unverified. |
| 2 | Deal Flow Management | **PARTIALLY WORKING** | Portfolio sidebar **Deal Flow** loaded live records, filters, owners, stages, and the Add Deal wizard. Synthetic details/ownership/review were entered. | Required document upload prevented application creation; stage transition, new-record persistence, and permissions remain open. |
| 3 | Due Diligence & Investment Committee | **PARTIALLY WORKING** | Existing synthetic `NTS - Seed` opened with AI screening 62/100, Due Diligence Complete, APPROVE recommendation, and attached document records. | New opportunity/term-sheet PDF upload blocked full committee decision test; Board & IC remained disabled until term sheet exists. |
| 4 | Portfolio Management | **PARTIALLY WORKING** | Module picker and Funds route rendered. Funds screen later loaded, with zero funds and dashboard metrics zero. | Fund create pending; other portfolio/company/workflow actions untested; displayed figures must not be treated as live performance. |
| 5 | Investor Relations | **NOT VERIFIED** | Module switcher showed **Fundraising & Investor Relations**. | No investor form, save, linkage, retrieval, onboarding, or permissions tested. |
| 6 | Fund Finance & Accounting | **NOT VERIFIED** | Admin module picker included **Accounting**. | No journal/requisition/fund accounting create/approval/retrieval tested; financial calculations/reports not accepted. |
| 7 | FP&A & Reporting | **NOT VERIFIED on dev** | Admin picker included **FP&A**. Prior local-only role-gate API test is recorded separately. | Dev page, forecasts, scenario, report/export, access and persistence not retested. |

### Classifications

- **WORKING** requires a representative end-to-end create/submit/save, expected feedback, refresh/retrieval, and permission test.
- **PARTIALLY WORKING** means some live operation was observed but acceptance is incomplete.
- **UNAVAILABLE** means direct observable failure prevents access/use, not merely a route not yet tested.
- **NOT VERIFIED** means no sufficient live evidence yet.

No module is rated WORKING. Do not use the shell's appearance, seeded counts, or health status as business-function evidence.

## Local UAT addendum — 15 Oct 2026

The separate local ERP execution queue now provides browser/API evidence for Payroll self-service and denial, shared Procurement requisitions, Events creation/persistence, Home navigation, and FP&A denial. These local synthetic results supplement this historical dev matrix; they do not close the unresolved dev fund, investor, upload, recovery, or client-provisioning gaps above.

### Local UAT evidence consolidation — 15 Oct 2026

The authorized local admin UAT session added the following evidence without changing the historical dev classifications above:

| Area | Local evidence now confirmed | Remaining readiness gap |
|---|---|---|
| Investor Relations / fundraising | Synthetic investor organisation creation and reload retrieval; synthetic opportunity creation and reload retrieval; synthetic commitment creation and reload retrieval. | Real-user identity mapping, maker-checker permissions, fund/entity linkage, KYC/compliance completion, and production-safe data remain unverified. |
| Due diligence | Existing DDQ cases, matrix, counts, and item Upload actions loaded; reference controls now resolve; synthetic DDQ case creation showed confirmation and increased active-case count from 3 to 4. | New case has no items yet; item completion, evidence upload, approval workflow, and real-user permissions remain unverified. |
| Data rooms | Three-step New Data Room wizard completed; synthetic room creation showed confirmation; Windows local media mock accepted a synthetic PDF, browser showed 1 document, and the API public-media proxy returned HTTP 200. | Invitations, expiry, access/activity logs, and external investor permission checks remain unverified. Dev/production remote media health still needs environment-specific verification. |
| Fundraising documents | Existing document-library retrieval and metadata/detail display; upload dialog and required fields rendered. | File upload, persisted file retrieval, access-control verification, and document-to-opportunity/commitment linkage remain open. No upload was claimed. |
| Investor/commitment data import | Create forms were verified for controlled local UAT entry. No approved fundraising import workflow is exposed in the local navigation/source surface. | Approved schema, import endpoint or template, validation report, duplicate handling, maker-checker approval, and post-import retrieval are required before import execution. |

These are synthetic local results only. They supplement, but do not replace, the historical dev evidence and do not make any module WORKING under the matrix definition.

**Follow-up:** live dev fund create returned to an enabled button without feedback; Funds list remained at zero. See DEF-DEV-002. Local Home/Funds browser recheck later found and locally fixed a null-permission runtime crash; local API was unavailable, so no create was submitted. The People Directory source guard change is local and remains untested against a running authenticated API. See `browser-execution-evidence.md`.
