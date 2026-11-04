# Browser execution evidence log

## Day 6 visible browser evidence — 17 Oct 2026

| Evidence | Route / action | Result |
|---|---|---|
| BR-D6-01 | `/fundraising/pipeline` → Add Opportunity | Created the synthetic LP opportunity under `UAT Campaign 1788968706685`; USD 1,250,000 indicative / USD 1,000,000 soft circle; close `2026-12-31`; refreshed pipeline showed 23 opportunities and a visible creation toast. |
| BR-D6-02 | `/fundraising/commitments` → Add Commitment → refresh | Recorded USD 1,250,000 SOFT CIRCLED commitment; refreshed list showed 7 investors, US$1.3M for the synthetic LP, and the selected-investor checklist. |
| BR-D6-03 | `/portfolio/capital-calls` → New Capital Call → Review/Create | Review showed synthetic fund, call `2026-10-17`, due `2026-11-17`, USD 25,000, New investments; API returned controlled denial for missing eligible commitments. |
| BR-D6-04 | `/forecasting`, `/forecasting/workflow` | FP&A shell loaded, but data was zero/empty and no budget cycle was selectable. Classified PARTIAL/STUB-DATA. |
| BR-D6-05 | `/forecasting/model-builder/cmuife29y0001und8unhyig36` | Visible UI created `UAT bridge model Working Version`; synthetic line item `Synthetic Revenue 20261017` persisted after refresh. Validation showed 0 errors and warnings `MISSING_SCOPE`, `MISSING_COA`, `NO_MODULES`. Publish remained controlled/disabled until scope and COA bindings are supplied. |
| BR-D6-05 | `/portfolio/distributions` | Local 404; classified NOT AVAILABLE. |

**Browser:** Codex in-app browser (real signed-in web UI). Automated browser client connection was unavailable in this environment; interactive browser actions used the available UI-control surface. Screenshots from this run were displayed for inspection but no persistent local image/trace export was available; this is an evidence-capture gap, not an assumed pass. Prior local screenshots under `test-artifacts/uat-access/` belong to a separate environment and are not substituted for dev evidence.

| Evidence ID | Date/time CAT | Environment / role | Route / action | Observed result | Toast / capture | Result |
|---|---|---|---|---|---|---|
| BR-DEV-01 | 2026-10-15 | Dev / Admin NTS | Opened `https://dev.matanho.com/home/news` in signed-in session | Publisher article cards showed covers, source badges, and `Page 1 of 2` with Next; prior session also verified page 2/2. | Visual inspected in browser; screenshot not persisted this run. | PASS for News display only |
| BR-DEV-02 | 2026-10-15 | Dev / Admin NTS | Clicked visible Home from News | Home rendered with greeting, date, assistant panel, portfolio signal; AUM panel said unavailable and priority/schedule sections displayed empty states. | Toast not visible at observation. | PARTIAL |
| BR-DEV-03 | 2026-10-15 | Dev / Admin NTS | Opened **Modules** → **Portfolio Management** → **Funds** | Funds route loaded after initial “Loading live data…”; list displayed 0 funds and **Create fund** action. | No definitive error toast during Funds load. | PARTIAL |
| BR-DEV-04 | 2026-10-15 | Dev / Admin NTS | **Create fund** → Details / Ownership / Review; entered synthetic fund and submitted once | Summary displayed expected synthetic fields. UI remained at “Saving…” for >30 seconds; no definitive success/error/ID. No retry performed. | Saving indicator observed; screenshot not persisted. | BLOCKED |
| BR-DEV-05 | Previous live dev report | Signed-in user | Home People directory load | Top-right toast observed: “Couldn't load the people directory — Unauthorized”. | Exact visible text recorded; no screenshot file available in current workspace. | DEFECT OPEN |
| BR-LOCAL-01 | 2026-10-15 | Local / synthetic Investment Analyst session | Reloaded `http://localhost:3001/home` after defensive null handling in role module permissions | Home rendered after initial load; Portfolio → Funds also rendered with 0 funds and no runtime-error overlay. | No top-right error toast visible during these observations; local app only. | PARTIAL; automated retest pending |
| BR-LOCAL-02 | 2026-10-15 | Local / same session | Opened People from Home, then navigated directly to `/people` | People content first showed 0 colleagues / 0 departments without the prior Unauthorized toast; direct route then displayed a Reset Password page. No password was entered or changed. | No error toast visible; forced reset prevents a clean directory retest. | BLOCKED |
| BR-LOCAL-03 | 2026-10-15 | Local / same session | Funds → Create fund | Create-fund form opened. Backend `127.0.0.1:3009` was not listening, so no data was submitted. | No error toast visible while opening form. | UI-only partial; save untested |

### Infrastructure evidence (read-only, not browser workflow proof)

- `https://dev.matanho.com/login`, `https://dev-api.matanho.com/health`, and News feed HTTP 200.
- Health response reported database connected.
- Singapore dev Compose status reported API, MySQL, upload and all six portal containers healthy at observation time.
- Dev root cron showed the News ingestion schedule only; bounded backup/dump path check found no usable backup artifact. No restore was attempted.

**Fund-save follow-up:** after the long Saving state, the modal became actionable again without a visible toast. Closing it showed `0 funds`; no retry or screenshot export was made. Server-side persistence still needs a safe read-only check.

Do not include authorization headers, cookies, query tokens, passwords, sensitive data, or raw client API responses in evidence.
### 15 Oct 2026 local UAT addendum

The current restricted synthetic browser session opened `/payroll/employees` and received the expected access-denied state requiring `employee.view`. This confirms the negative Payroll administration boundary in the browser; it does not substitute for named client-persona provisioning or the pending Ropa administrator browser check.

## Day 2 document-library checkpoint — 15 October 2026

The authorized local admin session re-opened the fundraising Documents page and visibly confirmed the 40-record library, metadata/detail retrieval, and the Upload Document form with title, category, campaign, confidentiality, and file controls. No file was selected or submitted; upload persistence, retrieval, and access-control behavior remain open pending an approved synthetic artifact and controlled upload test.

## Due diligence workflow checkpoint — 15 October 2026

The authorized local admin session opened `/fundraising/due-diligence` and visibly loaded three active investor cases, the DDQ matrix, 24 open items, 24 overdue items, and existing Upload actions. Opening **New DDQ Case** rendered the investor, case-title, campaign, and template fields, but the investor and campaign controls remained disabled in `Loading investors…` state after the reference-data wait. No case was submitted; case creation and persistence remain open pending resolution of the reference-data loading state.

The reference-loading blocker was fixed by adding an eight-second fallback around the investor/campaign reference requests and deriving safe options from already-loaded DDQ cases when a reference request does not settle. A fresh browser run then enabled the controls, created synthetic `UAT Day 2 DDQ Review` for the existing Harare Municipal Employees Fund record, showed `DDQ case created`, and reloaded the page with 4 active investor cases. The new case displayed with no items yet, so item completion and evidence upload remain separate open steps.

## Data-room workflow checkpoint — 15 October 2026

The authorized local admin session opened the selected UAT campaign's Data Rooms page. The New Data Room wizard completed its Room details, Security, and Review steps with MFA required, then created synthetic `UAT Day 2 Secure Data Room`. The page returned to the room list with `Active rooms 1`, `Documents 0`, and a visible `Data room "UAT Day 2 Secure Data Room" created` confirmation. Document attachment, invitation, expiry, and access/activity verification remain open.

## Day 2 agreement workflow checkpoint — 15 October 2026

The Agreements & Signatures page completed its visible three-step New Agreement wizard. Synthetic `UAT Day 2 Subscription Agreement` was created as an NDA, linked to `UAT Day 2 Investor Organisation` and `UAT Campaign 1788968706685`, and returned to the agreement list with 5 agreements. The new record appeared as Draft with its detail panel open and an `Agreement created` confirmation. Signature sending was not performed.

The Windows local media mock was started on `127.0.0.1:3050` because neither the local fallback port nor the configured remote upload port was reachable from this workstation. A synthetic `BUSINESS_PLAN.pdf` was attached through the visible data-room upload control. The browser showed `Documents 1` and `Document uploaded`; the file was present under the local `fundraising-documents` media directory and the API public-media proxy returned HTTP 200 with `application/pdf`. Dev/production remote media configuration was not changed; production remains read-only.

The Arcus Dev VPS was also checked read-only: `arcus-dev-upload-1` is healthy, `/health` returned `{\"ok\":true}`, and a synthetic multipart upload to its internal `:3050/upload` endpoint returned `success:true` under `fundraising-documents`. The supplied production SSH access was then used to verify `nvccz-prod-upload-1` and its API configuration. A synthetic fundraising upload succeeded and retrieval through the production public-media endpoint returned HTTP 200 with `text/plain`. No production service change was required because the upload stack was already configured and healthy.

## DDQ evidence persistence fix — 15 October 2026

The DDQ upload action returned a visible media URL (`/api/public-media/fundraising-documents/...`) and an `Evidence uploaded` confirmation, but a fresh case fetch did not expose the saved evidence because the backend `listDdqCases`/`getDdqCase` responses included items without their `evidence` relation. The backend now includes newest-first evidence history on both responses. A final browser reload against the restarted local API returned an empty case list, so post-restart retrieval remains pending a stable local fixture; the code fix is recorded but not marked browser-PASS.

The authorized local admin browser opened `/fundraising/documents` and displayed the fundraising document library with 40 records, folders, status labels, campaign associations, and a selected document detail panel including version/status metadata. The visible Upload Document dialog also exposed title, category, optional campaign, confidentiality, and file controls. No upload was claimed because the synthetic file chooser step was not completed.

## 17 Oct 2026 local synthetic continuation

| Evidence ID | Date/time CAT | Environment / role | Route / action | Observed result | Toast / capture | Result |
|---|---|---|---|---|---|---|
| BR-LOCAL-04 | 2026-10-17 | Local / Admin NTS | `/portfolio/funds` create and refresh | Synthetic `LOCAL-P03-NEXT-FUND-20261017` appeared after refresh and opened in detail; no duplicate observed. | Visible creation confirmation and live retrieval. | PASS local only |
| BR-LOCAL-05 | 2026-10-17 | Local / Admin NTS | `/fundraising/investors` create and refresh | Synthetic `LOCAL P05 Synthetic Investor 20261017` appeared in the directory and its detail panel opened. | Visible creation confirmation and live retrieval. | PASS local only |
| BR-LOCAL-06 | 2026-10-17 | Local / restricted synthetic persona | Direct navigation to `/fundraising/campaigns` and `/fundraising/settings` | `/home` allowed; both restricted routes returned controlled access denial. | No credentials recorded. | PASS local only |
| BR-LOCAL-07 | 2026-10-17 | Local / Admin NTS | `/home/people` | Directory loaded with 2,246 colleagues, 7 departments, and Admin NTS; no current Unauthorized toast reproduced. | Initial loading state resolved to data. | PASS locally; dev not tested |
| BR-LOCAL-08 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` on-demand exports | Pipeline summary, campaign metrics, pipeline funnel, source analysis, owner performance, stage ageing, DDQ export, documents index, and audit log all downloaded CSV on demand. DDQ/documents index had no preview rows; audit log returned timestamped local synthetic activity. | Success confirmations observed. | PASS with noted data limitations |

| BR-LOCAL-09 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Pipeline summary → Configure & run | Changed cadence to Daily, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download and `Scheduled "Pipeline summary" daily`, then closed the result and confirmed the card persisted `Schedule: Daily` and the fresh last-run timestamp. | Visible success and schedule confirmations. | PASS local synthetic; other report schedules remain unconfigured |
| BR-LOCAL-10 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Campaign metrics → Configure & run | Changed cadence to Weekly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download and `Scheduled "Campaign metrics" weekly`, then closed the result and confirmed the card persisted `Schedule: Weekly` and the fresh last-run timestamp. | Visible success and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-11 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Pipeline funnel → Configure & run | Changed cadence to Monthly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with `QUALIFIED` and `TARGET_CLIENT` rows and `Scheduled "Pipeline funnel" monthly`, then closed the result and confirmed the card persisted `Schedule: Monthly` and the fresh last-run timestamp. | Visible success, data rows, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-12 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Pipeline funnel (alias) → Configure & run | Changed cadence to Daily, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with `QUALIFIED` and `TARGET_CLIENT` rows and `Scheduled "Pipeline funnel (alias)" daily`, then closed the result and confirmed the alias card persisted `Schedule: Daily` and the fresh last-run timestamp. | Visible success, data rows, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-13 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Source analysis → Configure & run | Changed cadence to Weekly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with `DIRECT` count 2 and `Scheduled "Source analysis" weekly`, then closed the result and confirmed the card persisted `Schedule: Weekly` and the fresh last-run timestamp. | Visible success, data rows, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-14 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Source analysis (alias) → Configure & run | Changed cadence to Monthly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with `DIRECT` count 2 and `Scheduled "Source analysis (alias)" monthly`, then closed the result and confirmed the alias card persisted `Schedule: Monthly` and the fresh last-run timestamp. | Visible success, data rows, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-15 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Owner performance → Configure & run | Changed cadence to Daily, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with owner `Admin NTS`, open 2, won 0, lost 0, and `Scheduled "Owner performance" daily`, then closed the result and confirmed the card persisted `Schedule: Daily` and the fresh last-run timestamp. | Visible success, owner row, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-16 | 2026-10-18 | Local / CFO synthetic persona | `/forecasting/budget/.../workspace` → View by `Finance` | Selected the authorised Finance department scope. The visible UI enabled `Submit my plan` and changed forecast cells from locked (`Locked — writes rejected`) to editable. Entered synthetic `1,250`, submitted with local change notes, refreshed the same workspace URL, and confirmed the value remained visible while submission became unavailable. | Visible scope change, edit, submit, and refresh persistence. | PASS owner-input portion; variance and remaining incomplete categories remain open |
| BR-LOCAL-17 | 2026-10-18 | Local / restricted synthetic analyst | `/forecasting/budget` | Signed in visibly as the seeded local Investment Analyst persona. Direct navigation returned the controlled `/access-denied?module=forecasting...` surface. | No write attempted; no credentials or tokens recorded. | PASS denial |
| BR-LOCAL-16 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Stage ageing → Configure & run | Changed cadence to Weekly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download with `QUALIFIED` (37 days) and `TARGET_CLIENT` (1 day) rows, then saw `Scheduled "Stage ageing" weekly`; after closing the result, the card persisted `Schedule: Weekly` and the fresh last-run timestamp. | Visible success, data rows, and schedule confirmations. | PASS local synthetic; remaining report schedules remain unconfigured |
| BR-LOCAL-17 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → DDQ case export → Configure & run | Changed cadence to Monthly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download and `Scheduled "DDQ case export" monthly`; the result explicitly reported no preview rows. After closing it, the card persisted `Schedule: Monthly` and the fresh last-run timestamp. | Visible success, schedule confirmation, and empty-preview limitation. | PASS execution/scheduling; limitation: no preview rows returned |
| BR-LOCAL-18 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Documents index export → Configure & run | Changed cadence to Daily, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download and `Scheduled "Documents index export" daily`; the result explicitly reported no preview rows. After closing it, the card persisted `Schedule: Daily` and the fresh last-run timestamp. | Visible success, schedule confirmation, and empty-preview limitation. | PASS execution/scheduling; limitation: no preview rows returned |
| BR-LOCAL-19 | 2026-10-17 | Local / Admin NTS | `/fundraising/reports` → Audit log export → Configure & run | Changed cadence to Weekly, replaced the recipient with a synthetic `.invalid` address, ran once, observed successful CSV download and `Scheduled "Audit log export" weekly`; the result displayed timestamped local rows including `CREATE_REPORT_SCHEDULE` with acting user `cmtbohusn0001un80m3zh8h3z` and source `127.0.0.1`. After closing it, the card persisted `Schedule: Weekly` and the fresh last-run timestamp. | Visible success, audit rows, acting user, timestamps, and schedule confirmation. | PASS local synthetic |

### R3 — Investment state integrity (local)

- **Implementation:** Detail API now exposes `workflowIntegrity` for inconsistent `ACTIVE_DD`/due-diligence and `DISBURSED`/transaction combinations.
- **Visible browser verification:** Pending after API reload; final evidence must use the existing local portfolio/deal detail route and synthetic records.
- **Safety:** No synthetic review, payment, or stage repair is fabricated by the read path.

### R4 — Board & IC quorum (local)

- **Verified in source:** authorization, voting power, duplicate-vote protection, tie handling, and quorum completion rules.
- **Pending evidence:** genuine board-member actions in the local browser; no votes were fabricated.

### R5 — Capital-call/distribution eligibility (local)

- **Verified:** Existing local fund had three eligible ACTIVE/PENDING LP commitments. A 1% synthetic capital call persisted in `INITIATED` status with three allocations totaling USD 455,000; outbound mail guard was active.
- **Fix:** Guarded Gross IRR snapshot calculation for unpaid calls; no fabricated performance value is written.
- **Pending:** Distribution creation/payment and visible browser evidence.

### R6 — Approval queue visible verification (local)

- **Observed:** Finance Owner session opened `/accounting/approvals` and visibly received “Access unavailable”; no unauthorized data or action controls were exposed.
- **Pending:** authorized approval-user session to verify the fixed action column and detail modal.

### R3 retest result

- **PASS:** Local investment detail projection surfaced the inconsistent `ACTIVE_DD` state and explicit missing-review warning; no misleading workflow completion was reported.

### R5 distribution result

- **PASS:** Local synthetic distribution persisted with three eligible LP allocations and a structured posted journal. No external notice or payment was executed.

### R2 accounting evidence follow-up

- **PASS (local API/UAT):** synthetic ZiG expense payment persisted to the bank register and posted a balanced journal (Dr 5200 / Cr 116348).
- **Pending:** visible attachment → approval → journal browser chain.

