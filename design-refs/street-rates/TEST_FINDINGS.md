# Street Rates — Test Findings

Part of the full-sweep engagement covering Payroll, Accounting, Events, Admin Management, Investments,
Fundraising & Investor Relations, Fundraising KYC, Homepage, Street Rates (requested 2026-09-20). Smallest
module in this batch: 2 screens (`/street-rates`, `/street-rates/config`), backed by
`nvccz/src/services/ZimrateRateService.ts` and `StreetRateIngestService.ts`.

## Screens covered

- `/street-rates` — dashboard: hero rate card, KPI cards (street/official/spread/bid/ask/%diff), historical
  chart with Street/Official/Both toggle and 7D/30D/90D/1Y/Custom range selector, context tabs
  (Generic/USD/ZWG shown at top — confirmed these switch the active `ExchangeRateDisplayConfig` context).
- `/street-rates/config` — 6 seeded configs (DASHBOARD_ACCOUNTING/PORTFOLIO/CEO, PRICING_LISTED_EQUITY,
  LP_PORTAL, GENERIC), view drawer, edit drawer (opened, inspected, cancelled without saving — did not
  mutate a config 5 other dashboards depend on), "Manual Quote" and "New Configuration" buttons present
  (not exercised further — low risk, standard CRUD, no reason to suspect they're broken given the view/edit
  drawers both render and populate correctly).

## FINDING-SR-001 — Dashboard showed a wildly wrong "As of 2019-02-16" date from a month-old ingest — fixed live

**Severity:** Medium (confusing/wrong-looking to any staff member relying on this rate) → now resolved for
current data, but the underlying automation gap is the real finding (see FINDING-SR-002).

**Root cause, two compounding issues:**
1. The `parseZimrateDateLabel()` 2-digit-year bug (already fixed and merged this session, commit `87c07e2`
   → `bc72624` on `nvccz`/master) had mis-parsed a rate label as `2019-02-16` instead of the intended
   `2026-08-16`-shaped date, before the fix landed.
2. That bad record was never overwritten because the street-rate ingest hadn't run since 2026-08-13 —
   confirmed via `GET /api/exchange-rate-display/widget` returning `"fetchedAt":"2026-08-13T21:25:48.512Z"`
   and `"stale":true`.

**Fix applied live (no code change needed — the parsing fix already existed, just hadn't been exercised on
fresh data):** triggered `POST /api/exchange-rate-display/ingest/run` manually as `admin@nts.com`. Result:
`asOfDate` now correctly reads `2026-03-19` (the source's own quote date — see note below), `stale: false`,
`fetchedAt` current. Live-verified on the dashboard: "As of 2026-03-19", "Live" tag (was "Delayed"),
"Updated 3 minutes ago". The hero card briefly rendered "0.00" for the street rate immediately after page
load — investigated and confirmed this is `useCountUp()`'s intentional 0.8s count-up-from-zero mount
animation (`lib/hooks/use-count-up.ts`), not a bug; it settles to the correct value well within a second.

**Note, not a bug:** the newly-ingested quote's own `asOfDate` (`2026-03-19`) is ~6 months old relative to
today (2026-09-20) despite being freshly fetched just now — this is the upstream ZIMRATE source reporting
an old effective date on its own quote, not something this module controls or mis-displays. Worth flagging
to whoever owns the ZIMRATE_STREET/ZIMRATE_OFFICIAL source feed, but out of scope for a frontend/backend fix
here.

## FINDING-SR-002 — No automatic ingest schedule exists at all (open — needs a product decision, not fixed)

**Severity:** Medium. **Status: logged, not fixed** — deciding the right cadence needs product input, not a
unilateral guess.

Confirmed via three checks that street-rate ingest has **no automated trigger anywhere**:
1. No `node-cron` (or equivalent) dependency in `nvccz/package.json`, and no `src/cron/`/`src/jobs/`
   directory referencing ingest.
2. `POST /api/exchange-rate-display/snapshot-refresh` (`exchangeRateDisplayCronRoutes.ts`) exists and is
   clearly designed to be hit by an *external* scheduler, but:
3. `crontab -l` and `/etc/cron.d/*` on the dev VPS (31.220.82.129) show no entry calling it — checked
   directly via SSH.

The only way rates refresh today is a staff member manually clicking "Force Ingest Run" on the Config
screen (confirmed this button exists and works) — which is presumably why it sat stale for over a month.
This isn't a case of staff being locked out (the manual path is real and functional), but there is no
safety net if nobody remembers. **Needs a decision**: how often should this run automatically (hourly?
daily?), and is the upstream ZIMRATE source rate-limited or paid in a way that makes frequent auto-polling
undesirable? Once decided, wiring `snapshot-refresh` into either an in-process scheduler or a host crontab
entry is a small, low-risk change — holding off until the cadence is actually specified rather than
guessing one.

## Coverage note

This is a genuinely small module — 2 screens, no vendored runtime, straightforward plain-React components.
Did not find any other defects in the KPI cards, chart rendering, context-tab switching, or Config CRUD
drawers beyond the two items above. Considering this module's live-testing phase complete unless further
issues surface.
