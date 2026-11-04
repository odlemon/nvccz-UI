# Friday Quality Gate — Visible Browser Milestones

Environment: local synthetic browser at `http://127.0.0.1:3011`  
Rule: each milestone is verified through visible in-app browser navigation; no headless-only claim is accepted.

## Milestones

- [x] M1 — Fund and investor records: visibly opened the Fundraising dashboard and confirmed synthetic campaign, investor, opportunity, and totals data.
- [x] M2 — Campaigns and opportunities: visibly opened Campaigns and Pipeline; confirmed rows, actions, stages, and metrics.
- [x] M3 — Mandates and commitments: visibly opened both routes and confirmed lists plus detail/checklist panels.
- [x] M4 — Approvals and reports: visibly opened both routes; confirmed approval rows and selected-campaign report data.
- [x] M5 — Portfolio monitoring: visibly opened `/portfolio/companies` in the authenticated local staff browser, confirmed 10 live synthetic portfolio-company rows and KPI summary cards, opened the first row's Company activity menu, and opened Record Metadata for `UAT Day4 Analytics Co`. The visible metadata showed record id `cmvaktxv4000bun9k6qq6edzy`, stage `APPROVED`, entry `16 Oct 2026`, master record source `company service`, read-model version `18 · 31 Jul 2026`, and tenant + fund + role-scoped access policy.
- [x] M6 — Role access: visibly inspected four configured local synthetic role summaries (Head of Fundraising, Investor Relations Officer, Business Development, Compliance), signed in as a synthetic Investment Analyst, confirmed the restricted home surface loaded, and navigated directly to `/fundraising/campaigns`, which visibly redirected to `/access-denied?module=fundraising&from=%2Ffundraising%2Fcampaigns` with “Your account is not authorized to open fundraising.”
- [ ] M7 — Final gate: record screenshots/routes/results and only mark PASS after all blockers are closed.

The empty-role configuration blocker is fixed in the local synthetic database. M6 is now visibly verified for role summaries, an allowed home surface, and a denied fundraising route. M7 remains pending until the final gate evidence is consolidated.

M6 visible evidence:

- Restricted synthetic persona: `UAT Restricted` / `Investment Analyst` (local only)
- Allowed route: `/home`
- Denied route: `/fundraising/campaigns`
- Denial route/message: `/access-denied?module=fundraising&from=%2Ffundraising%2Fcampaigns` / “Your account is not authorized to open fundraising.”

Visible evidence captured during this pass:

- Portfolio route: `http://127.0.0.1:3011/portfolio/companies`
- Synthetic company: `UAT Day4 Analytics Co`
- Metadata view: source identifiers, ownership, timestamps, data lineage, and access policy were visible in the browser.
- M5 result: PASS for visible portfolio monitoring/read-model evidence; KPI write/refresh persistence remains a separate check if a writable KPI control is required by the gate.

## Local blocker recovery — 17 October 2026

- Existing local MySQL for `arcus_dev` was restored from `C:\mysql-local-data\data`; no new database, migration, seed, or production action was performed.
- `GET http://127.0.0.1:3009/health` returned `status=OK`, `environment=development`, and `database=connected`.
- The browser/API blocker was an unset development loopback-CORS flag. The local backend was restarted with `ALLOW_LOOPBACK_CORS=1`.
- Visible verification after recovery: authenticated admin loaded `/portfolio/companies` and rendered 10 records, including `UAT Day4 Analytics Co` with stage `APPROVED` and entry date `16 Oct 2026`.
