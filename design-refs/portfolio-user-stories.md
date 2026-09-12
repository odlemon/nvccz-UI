# Portfolio + Investee Portal — user stories

**Date:** 4 September 2026 · **Type:** discovery/documentation — no code, UI or data changes
**Grounding:** every story is tied to a real screen and a real control in the shipped UI. Names in `code` are the actual button labels and action ids, so each story can be clicked through and checked.

**Sources**
- Staff UI: `components/portfolio-v11-mock/matanho-portfolio-runtime.js`; routes under `app/portfolio/`
- Investee UI: `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js`; routes under `app/investee-portal-v8/`
- Prior implementation report: [`dd-term-investee-flow-report.md`](./dd-term-investee-flow-report.md) (28 Aug 2026) — the handoff wiring
- Entity/stage analysis: [`portfolio-workflow.md`](./portfolio-workflow.md)

---

## Who uses what

**Staff — Portfolio module.** Seven role profiles drive nav visibility, buttons, decisions, exports and drawers:

| Role | Shorthand |
|---|---|
| CEO | `ceo` |
| Administrator | `admin` |
| Chief Investment Officer | `cio` |
| Investment Analyst | `analyst` |
| Monitoring & Evaluation | `monitoring` |
| Legal | `legal` |
| Accounting | `accounting` |

CEO, Administrator and CIO hold full read/write; the others are constrained to their workspaces.

**Founder — Investee Portal V8.** One authenticated company user (plus team members they invite). Provisioned *by* the deal flow — see Epic 9.

## The two sidebars

**Portfolio (staff)**
- **INVESTMENTS** — Dashboard · Deal Flow · Funds · Capital Calls · Portfolio Companies
- **FUND OPERATIONS** — Client/Fund Accounts · Cash Overview · Cash Ledger · Reservations · Statement Imports · Reconciliations · Exceptions · Period Close & GL
- **REPORTING & RECORDS** — Reporting Schedules · Fund Performance · LP Management · Documents Vault · Reports Vault · E-Signatures · Mailer Lists
- **WORKSPACE** — Settings & Integrations

**Investee Portal (founder)**
- **Workspace** — Overview · KPI Centre · Reporting Centre · Forecast Model
- **Investment** — Term Sheet · Cap Table · Governance · Signatures
- **Collaboration** — Capital & Procurement Requests · Document Vault · Messages
- **Administration** — Team & Access · Settings

## Three journeys, not one

| Track | Whose | Starts at |
|---|---|---|
| **A — the deal** | Staff | A funding application arrives |
| **B — the founder** | Investee | Their company is provisioned partway through Track A |
| **C — fund capital** | Staff | A fund exists and LPs commit |

Track B **branches off** Track A at the handoff (Epic 9) and then runs alongside it. Track C is **independent** — it starts from a fund and its investors, and **no deal ever triggers a capital call**. A and C meet only in that both are denominated against a Fund.

---

# TRACK A — the deal journey (staff)

## Epic 1 · Intake

**1.1 — As a founder seeking funding, I want to complete a funding application without creating an account, so that I can apply without friction.**
- Screen: `/funding-application` (public, no login — deliberately outside the staff shell)
- Multi-step form; progress auto-saves to the browser so I can close the tab and come back
- I upload Business Plan, Proof of Concept, Market Research and Projected Cash Flows; files upload as I go
- On submit I get a confirmation email
- *Acceptance:* opens logged-out with empty fields; refresh restores my draft including uploaded file names

**1.2 — As an Investment Analyst, I want deals to appear on my board automatically when applications are submitted, so that I don't re-key anything.**
- Screen: Deal Flow (`/portfolio/deals`) — submitted applications arrive as cards with no staff action

**1.3 — As an Investment Analyst, I want to add a deal by hand, so that I can capture opportunities that came to us off-platform.**
- Deal Flow → `Add Deal` (`add-deal` → `submit-add-deal`)

**1.4 — As an Investment Analyst, I want to send an applicant to the application portal, so that they can complete or supplement their submission.**
- Deal Flow → `Launch applicant portal` (`open-applicant-portal`) — a launcher out to the public apply URL

## Epic 2 · Screening

**2.1 — As an Investment Analyst, I want each new application scored automatically, so that I can triage a large pipeline without reading every one.**
- *Note:* two distinct scores exist — an **AI/auto** score and my own **analyst scorecard**. The card shows mine if present, otherwise the AI one.

**2.2 — As an Investment Analyst, I want to review the AI's reasoning beside the deal, so that I can accept or override it.**
- Deal detail → **Screening** tab: AI summary, weighted criteria table, reasons for shortlist, review flags

**2.3 — As an Investment Analyst, I want to confirm a shortlist decision, so that the deal advances.** — `Confirm shortlist` (`confirm-shortlist`)

**2.4 — As an Investment Analyst, I want to re-run screening after new information arrives.** — `Re-run screening` (`rerun-screening`)

**2.5 — As an Investment Analyst, I want to ask the applicant for clarification, so that I can unblock screening without rejecting.**
- `Request clarification` (`request-clarification` → `submit-clarification`) — sends a real email → **crosses to Track B**

**2.6 — As an Investment Analyst, I want to mark a deal as not meeting criteria, so that it leaves my active pipeline.**
- The board carries a **Rejected** column; screening rejection reasons are held internally and are **not** sent to the applicant

## Epic 3 · Due diligence

**3.1 — As an Investment Analyst, I want to start due diligence from the deal.** — Deal detail → **Diligence** tab → `start-due-diligence`

**3.2 — As an Investment Analyst, I want to break DD into workstreams and assign them, so that the team can work in parallel.** — `submit-dd-task`, `complete-dd-task`, `reopen-dd-task`

**3.3 — As an Investment Analyst, I want to record my DD assessment.** — `submit-dd-assessment`

**3.4 — As a CIO, I want DD completion blocked until the assessment is genuinely finished, so that deals can't skip diligence.**
- Complete DD (`complete-due-diligence`) renders **disabled with a tooltip** until four required criteria *and* task completion are satisfied — not merely a score and comments
- *Acceptance:* incomplete assessment → disabled; fill all four criteria and save → enabled

**3.5 — As an Investment Analyst, I want DD to lock once complete, so that the record can't be altered after the fact.**
- *Add workstream* disappears; the API refuses late assignment with *"Cannot assign workstreams after due diligence is completed"*

**3.6 — As an Investment Analyst, I want to land on the next step automatically when DD completes.**
- The UI switches to the **Term Sheet** tab; applicant and DD reviewer are both emailed

## Epic 4 · Term sheet

**4.1 — As a CIO, I want to create a term sheet on a diligenced deal.**
- Deal detail → **Term** tab → `submit-create-term-sheet`
- Equity and valuation are **required** — the form enforces it because the API rejects without them
- **Crosses to Track B:** creating the term sheet also (idempotently) ensures the portfolio company exists

**4.2 — As a CIO, I want to handle the founder's counter-offer, so that negotiation is captured rather than done over email.** — `accept-counter`, `retain-position`

**4.3 — As Legal, I want the term sheet issued for signature, so that execution is tracked.**
- E-Signatures (`/portfolio/e-signatures`) → `New envelope` (`new-signature-envelope`), `Signature templates`, `Open`
- *Handoff:* envelopes are backed by the Fundraising module's agreements

## Epic 5 · Board / Investment Committee

**5.1 — As a CIO, I want to start a board review and attach the investment memo.** — Deal detail → **Board** tab → `submit-start-board-review`

**5.2 — As a board member, I want to cast a vote with a conditional option, so that approval-with-conditions is a first-class outcome.**
- `Approve` (`vote-approve`), `Approve with conditions` (`vote-conditions`), `Reject` (`vote-reject`); final decision `final-vote` / `ic-vote-submit`

**5.3 — As a CEO, I want a board rejection to close the deal cleanly, so that no downstream provisioning happens.**
- Rejection is re-checked before any company/user is created, and drives rejection-flavoured emails

## Epic 6 · Implementation & disbursement

**6.1 — As Accounting, I want to initiate implementation on an approved deal.**
- Deal detail → **Disbursement** tab → `start-implementation`
- *Precondition surfaced in the UI:* the portfolio company must already exist

**6.2 — As Accounting, I want to release funds in tranches with approval, so that disbursement is controlled rather than lump-sum.** — `confirm-release-tranche` (`api-release-tranche`)

**6.3 — As a Compliance/Legal reviewer, I want disbursement blocked until compliance is cleared, so that we meet exchange-control and KYC obligations.**
- Enforced backend-side (RBZ Exchange Control + KYC)

## Epic 7 · The deal's own records

**7.1 — As an Investment Analyst, I want the deal to keep its own document room, so that diligence materials stay attached to the deal.**
- Deal detail → **Documents** tab; upload via `api-upload-application-document`

**7.2 — As an Investment Analyst, I want to open the investee's portal from the deal, so that I can see what the founder sees.**
- `open-investee-portal` → `/investee-portal-v8` (honours `NEXT_PUBLIC_INVESTEE_PORTAL_URL`)

## Epic 8 · Working the board

**8.1 — As an Investment Analyst, I want to drag a deal between columns, so that I can correct the stage manually.**
- Kanban drag → `change-deal-stage`
- Columns: Sourcing · Screening · Initial Review · Due Diligence · Investment Committee · Term Sheet · Portfolio · Rejected

> **🐞 Defect.** Three stages the backend actually writes — term-sheet-created, term-sheet-approved and portfolio-company-created — are missing from the UI's stage map, and the fallback is *Screening*. So a deal whose **term sheet was just approved appears to jump backwards into Screening**. Display-only; the stored stage is correct. Reported, not fixed.

**8.2 — As an Investment Analyst, I want to filter, sort and export the pipeline.** — `Filters` (`deal-filters`), `Columns` (`deal-list-columns`), `Export` (`export-deals`), `Add milestone` (`add-deal-milestone`)

---

# TRACK B — the founder's journey (Investee Portal V8)

> **Maturity warning.** Only the Term Sheet screen is genuinely wired to live data today. The Overview is partly hydrated. **Every other screen below still renders prototype fixtures even in live mode** — the stories describe intended behaviour and are marked accordingly. The live loader fetches exactly five things: profile, application, company, term sheets, dashboard.

Legend: **[LIVE]** wired · **[PARTIAL]** partly hydrated · **[PROTOTYPE]** fixture data, not wired

## Epic 9 · Getting access

**9.1 — As a founder, I want an account created for me when my deal progresses, so that I don't have to register separately.** **[LIVE]**
- A portfolio company **and** its user are provisioned, and credentials are emailed
- *Known ambiguity:* this fires both on **DD completion** and (idempotently) on **term-sheet creation**. Which is canonical is an open product question already flagged in the repo's own docs — worth settling.

**9.2 — As a founder, I want to sign in to my own workspace, so that I can see my investment.** **[LIVE]**
- `/investee-portal-v8`; staff cannot log into this portal and founders cannot log into staff

**9.3 — As a founder, I want my company name to appear in my workspace, so that it's clearly mine.** **[PARTIAL]**
- Overview hydrates company name from `GET /applicant/company`; the surrounding dashboard metrics are still fixtures

## Epic 10 · Seeing the investment

**10.1 — As a founder, I want to read my term sheet in my own portal, so that I have a durable copy rather than an email attachment.** **[LIVE]**
- Screen: **Term Sheet** (`/investee-portal-v8/terms`) — rendered from `GET /term-sheets/my`
- *Alternative route:* the legacy `/application-portal/term-sheets` React page is also fully wired

**10.2 — As a founder, I want to sign documents sent to me, so that execution doesn't require email round-trips.** **[PROTOTYPE]**
- Screen: **Signatures** → `open-signature`
- *Intended counterpart:* staff E-Signatures envelopes (4.3). Not verified as connected end-to-end.

**10.3 — As a founder, I want to see my cap table, so that I understand dilution.** **[PROTOTYPE]**
- Screen: **Cap Table** → `shareholder-detail`

**10.4 — As a founder, I want to see governance obligations and reserved matters, so that I know what needs investor consent.** **[PROTOTYPE]**
- Screen: **Governance** → `governance-approval`, `approval-detail`, `add-board-action`, `reserved-matter`

## Epic 11 · Reporting back to the investor

**11.1 — As a founder, I want to see what reporting is due and when, so that I stay compliant with my obligations.** **[PROTOTYPE]**
- Screen: **Reporting Centre** → `report-tab`, `report-detail`, `download-template`

**11.2 — As a founder, I want to complete and submit a periodic report, so that I meet my reporting covenant.** **[PROTOTYPE]**
- Controls: `edit-report-section`, `save-structured-report`, `submit-structured-report`, `submit-report`, `download-report`
- *Intended counterpart:* staff **Reporting Schedules** and the Monitoring & Evaluation role. Not verified as connected.

**11.3 — As a founder, I want to report KPIs against an agreed library, so that the investor sees consistent metrics.** **[PROTOTYPE]**
- Screen: **KPI Centre** → `kpi-detail`, `view-kpi-library`, `download-kpi`

**11.4 — As a founder, I want to maintain a forecast model with scenarios, so that the investor can see my plan.** **[PROTOTYPE]**
- Screen: **Forecast Model** → `forecast-sheet`, `forecast-new-sheet`, `forecast-add-row`, `forecast-save`, `forecast-undo`, `forecast-export`, `scenario`
- Has a close-day setting and a lock-past-periods toggle (`matanho-forecast-close-day`, `matanho-forecast-lock-past`)

## Epic 12 · Collaboration with the investor

**12.1 — As a founder, I want to raise capital and procurement requests, so that I can draw funds or get approvals.** **[PROTOTYPE]**
- Screen: **Capital & Procurement Requests** → `open-request`
- ⚠ **No staff-side inbox identified.** I could not find where these requests surface for staff in the Portfolio nav. Either the counterpart lives in another module or it isn't built. **Unverified — do not assume a round trip exists.**

**12.2 — As a founder, I want a document vault, so that I can share and retrieve deal and reporting documents.** **[PROTOTYPE]**
- Screen: **Document Vault** → `open-folder`, `upload-docs`, `vault-view`, `document`
- *Intended counterpart:* staff Documents Vault `Request document`. Not verified as connected.

**12.3 — As a founder, I want to message the investment team, so that questions don't get lost in email.** **[PROTOTYPE]**
- Screen: **Messages** → `thread`, `attach`, `conversation-info`, `message-reviewer`
- ⚠ **No staff-side inbox identified.** Same caveat as 12.1.

## Epic 13 · Administration

**13.1 — As a founder, I want to invite my team and control their access, so that colleagues can contribute.** **[PROTOTYPE]** — **Team & Access** → `user-detail`

**13.2 — As a founder, I want to manage my settings.** **[PROTOTYPE]** — **Settings**

---

# TRACK C — fund & LP capital (staff)

> Independent of Tracks A and B. Starts from a fund, not a deal.

## Epic 14 · Funds and LPs

**14.1 — As a CIO, I want to create a fund, so that commitments and investments have a vehicle.** — Funds (`/portfolio/funds`) → `Create fund` (`submit-create-fund`)

**14.2 — As an Administrator, I want to onboard an LP, so that they can commit capital.** — LP Management (`/portfolio/lps`) → `Add LP` (`submit-add-lp`), `Start onboarding` (`submit-lp`)

**14.3 — As a CIO, I want to see fund performance at a glance, so that I can answer LP questions.**
- Funds — commitment, called, NAV, distributed, Gross/Net IRR, TVPI, DPI, status
- *Caveat:* several performance columns aren't supplied by the API today and fall back to illustrative values

## Epic 15 · Capital calls

**15.1 — As Accounting, I want to raise a capital call against a fund, so that we can draw committed capital from LPs.**
- Capital Calls (`/portfolio/capital-calls`) → `New Capital Call` (`submit-create-capital-call`)
- Defined by a **call percentage**, payment due date, bank instructions and transaction date — **not** by any deal

**15.2 — As Accounting, I want each LP's share calculated from their commitment, so that allocations are right without manual maths.**
- One allocation line per LP, snapshotted at initiation; payments then update paid amount and status

**15.3 — As Accounting, I want to send call notices to LPs.** — `send-capital-call-notices` / `send-notices`

**15.4 — As Accounting, I want to track collection progress, so that I can chase shortfalls.** — Capital Calls register: total vs collected

**15.5 — As an Administrator, I want to message LPs, so that communication is logged against the fund.** — `send-communication` (`api-send-lp-communication`); lists in Mailer Lists

---

# Supporting workspaces (staff)

## Epic 16 · Fund operations (Accounting)

| # | Story | Controls |
|---|---|---|
| 16.1 | Open and manage client/fund cash accounts | `Create account` (`create-cash-account`), `Export accounts` |
| 16.2 | Understand the cash position | Cash Overview, `Explain` (`explain-cash-position`) |
| 16.3 | Post and trace journals | `Create manual journal`, `Trace source`, `Export approved journals` |
| 16.4 | Ring-fence cash | `Request reservation`, `approve-reservation`, `release-reservation`, `Lifecycle policy` |
| 16.5 | Import bank statements | `Upload statement`, `Provider layouts`, `Download error template`, reject batch |
| 16.6 | Reconcile | `Start batch`, `Confirm suggested match`, `Split / combine`, `Raise exception`, `Export evidence pack` |
| 16.7 | Work exceptions | `Create exception`, `SLA view`, `Export exceptions` |
| 16.8 | Close the period | `Run close pre-check`, `Request approval`, `Create GL export`, `Download evidence pack` |

## Epic 17 · Reporting & records

| # | Story | Controls |
|---|---|---|
| 17.1 | Schedule recurring reports | `Add schedule` / `New schedule`, `Preview`, `Today` |
| 17.2 | Produce fund performance reports | `Generate Report`, `Submit for approval`, `Export` |
| 17.3 | Build a report pack | `Open report builder` / `Build report pack` |
| 17.4 | Keep documents | Documents Vault: `Upload files`, `Request document`, `Preview`, `E-sign`, `Download` |
| 17.5 | Keep published reports | Reports Vault: `Preview`, `Edit ledger`, `Download` |
| 17.6 | Run distribution lists and campaigns | Mailer Lists: `Create mailer list`, `New campaign` |

## Epic 18 · Workspace

**18.1 — As an Administrator, I want role permissions to control what each profile can see and do.**
- Settings & Integrations (`/portfolio/settings`)
- *Caveat:* in the live-wired build the settings tabs largely defer to Admin ("manage in Admin"); the rich in-module role matrix is prototype

---

## Where the two sides meet

The touchpoints between staff and founder, and how solid each one is:

| # | Touchpoint | Staff side | Founder side | Status |
|---|---|---|---|---|
| 1 | Application submitted | Deal appears on Deal Flow (1.2) | Public form (1.1) | **Live** |
| 2 | Clarification requested | `request-clarification` (2.5) | Email | **Live** (email only — no in-portal thread) |
| 3 | DD completed | `complete-due-diligence` (3.4) | Company + user provisioned, credentials emailed (9.1) | **Live** |
| 4 | Term sheet created | `submit-create-term-sheet` (4.1) | Term Sheet screen (10.1) | **Live** |
| 5 | Term sheet negotiated | `accept-counter` / `retain-position` (4.2) | — | ⚠ No founder-side counter UI found |
| 6 | Signature requested | E-Signatures envelope (4.3) | Signatures screen (10.2) | ⚠ Prototype — not verified connected |
| 7 | Document requested | `Request document` (17.4) | Document Vault (12.2) | ⚠ Prototype — not verified connected |
| 8 | Periodic reporting | Reporting Schedules (17.1) | Reporting Centre (11.1–11.2) | ⚠ Prototype — not verified connected |
| 9 | KPI monitoring | Monitoring & Evaluation role | KPI Centre (11.3) | ⚠ Prototype — not verified connected |
| 10 | Capital/procurement request | **none found** | Requests (12.1) | ⚠ **No staff inbox identified** |
| 11 | Messaging | **none found** | Messages (12.3) | ⚠ **No staff inbox identified** |
| 12 | Staff views founder's portal | `open-investee-portal` (7.2) | — | **Live** |

**Read this table as the honest summary:** exactly four of the twelve touchpoints are genuinely wired end-to-end today (1, 3, 4, 12), plus email-only for 2. Everything else is UI on one or both sides without a confirmed connection.

---

## Where these stories are weakest (verify before building on them)

1. **No stage specification exists.** The pipeline stage list was reconstructed from backend write-sites — the stage field is an unconstrained string whose own schema comment trails off mid-list. If a real spec exists outside the repo, it wins.
2. **Company/credential creation timing is contested** (9.1) — the repo's own docs flag it as unresolved, and both paths currently create it.
3. **Stage-map defect** (8.1) is confirmed by inspection but has no ticket.
4. **Fund assignment is untraced** — a deal may or may not have a fund, and I did not establish who sets it or when. Any story implying a deal is always fund-linked is unsafe.
5. **Most of Track B is prototype.** Only Term Sheet is live; Overview is partial. Treat Epics 10.2–13 as intended behaviour, not current behaviour.
6. **Two founder features have no staff counterpart I could find** — Capital & Procurement Requests and Messages (touchpoints 10 and 11). Either the counterpart is in another module or the loop isn't closed. Worth confirming before promising founders a response path.
7. **Several staff screens are wired but thin** — Fund Performance attribution/benchmarks, Reports Vault metadata, Company deep tabs and the reconciliation match workspace have no backing API and will stay empty however much data is seeded.
