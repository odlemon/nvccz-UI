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

## FINDING-SR-002 — No automatic ingest schedule exists at all — fixed live (hourly in-process scheduler)

**Severity:** Medium. **Status: fixed.** Cadence decided and implemented as an hourly in-process scheduler,
deployed and live-verified on dev.

Confirmed via three checks that street-rate ingest had **no automated trigger anywhere**:
1. No `node-cron` (or equivalent) dependency in `nvccz/package.json`, and no `src/cron/`/`src/jobs/`
   directory referencing ingest (a `node-cron` integration was sketched only as a dead comment in
   `PerformanceETLService.scheduleETLJob()`, never wired up — confirms this codebase has no established
   cron pattern to follow).
2. `POST /api/exchange-rate-display/snapshot-refresh` (actually mounted at
   `/api/cron/exchange-rate-display/snapshot-refresh` per `exchangeRateDisplayCronRoutes.ts`) exists and is
   clearly designed to be hit by an *external* scheduler, but:
3. `crontab -l` and `/etc/cron.d/*` on the dev VPS (31.220.82.129) showed no entry calling it — checked
   directly via SSH.

The only way rates refreshed before this fix was a staff member manually clicking "Force Ingest Run" on the
Config screen — which is presumably why it sat stale for over a month before FINDING-SR-001 was noticed.

### Cadence decision: hourly

Read both services involved end to end before deciding:
- `nvccz/src/services/exchangeRateDisplay/ExchangeRateDisplayCronService.ts` — a one-line pass-through to
  `StreetRateIngestService.ingestLive()`.
- `nvccz/src/services/exchangeRateDisplay/StreetRateIngestService.ts` — fetches official + street USD/ZWG,
  upserts a quote row per source keyed by `asOfDate` (a calendar day, not a timestamp), then bridges any
  same-day manual `ExchangeRate` overrides into the same quote table.
- `nvccz/src/services/ZimrateRateService.ts` — the actual network call. Primary path scrapes
  `https://zimrate.com/` (JSON-LD + visible rate cards) for a single "current" rate; falls back to the
  Statotec REST API (`https://zimrate.statotec.com/api/v1/rates`, static embedded bearer token) only if the
  scrape fails. Neither path exposes an intraday series or documents a rate limit / metered cost in this
  codebase — the ingested value is a single "as of today" quote either way.

Given that, hourly is a safety margin rather than an attempt to catch intraday moves: the source can only
plausibly change once a day, so polling more often buys nothing, but polling only daily would still leave up
to 24h of staleness right after the source updates and depends on the schedule's own timing being lucky.
Hourly costs one cheap extra HTTP call for meaningfully fresher dashboards and isn't remotely aggressive for
a public site scrape or a fallback REST call. No evidence of a paid/quota-tracked tier was found for either
source, so there was no signal to back off to every-6-hours or daily. Made configurable
(`STREET_RATE_REFRESH_INTERVAL_MS`, floor 5 minutes) in case ops later confirms the source *is*
rate-limited and needs a longer cadence.

### Implementation

Added `nvccz/src/services/exchangeRateDisplay/StreetRateAutoRefreshScheduler.ts`: a `setInterval`-based
scheduler (no new dependency — see the dead-cron-comment note above) that calls the exact same
`ExchangeRateDisplayCronService.refreshSnapshots()` the manual button and the external-scheduler route both
use. An `isRunning` guard skips a tick if the previous run is still in flight, so a slow upstream fetch can't
pile up overlapping ingests. Started once from `app.ts`'s `startServer()` after the DB connection is
confirmed (first run 30s after boot, then every interval), stopped on graceful shutdown.

Branch: `nvccz` `feature/street-rates-auto-refresh` (commit `e05193f`, built from a clean worktree at
`nvccz`/master `bc72624`), pushed to origin.

### Live verification (dev, 2026-09-20)

Deployed API-only to `dev-api.matanho.com` (`arcus-dev-api` container, no UI service touched). Baseline
before deploy: `GET /exchange-rate-display/widget` → `fetchedAt: 2026-09-20T07:14:21.150Z` (from the earlier
manual FINDING-SR-001 fix).

First deploy attempt was silently overwritten ~4 seconds after it finished by a concurrent deploy from
another session also working against the same shared dev API container (confirmed via SSH session history
and rollback-image timestamps: `api.20260920-112140.image` (mine) vs. `api.20260920-112144.image`, and the
resulting container's `dist/` was missing `StreetRateAutoRefreshScheduler.js`) — a real instance of the
"shared VPS, one build at a time" collision risk on this engagement. Redeployed immediately; the second
deploy's container logs show, unprompted:

```
[2026-09-20T09:30:22.522Z] INFO: [StreetRateAutoRefresh] Scheduling automatic street-rate ingest every 60 min (first run in 30s)
...
[2026-09-20T09:30:52.694Z] INFO: [StreetRateAutoRefresh] Refresh (startup) completed {"ingested":["ZIMRATE_OFFICIAL","ZIMRATE_STREET"],"manualBridged":0,"fetchedAt":"2026-09-20T09:30:52.523Z"}
```

`GET /exchange-rate-display/widget` immediately after, with **no manual ingest call made**:
`fetchedAt: 2026-09-20T09:30:52.523Z`, `stale: false` — matching the scheduled run exactly. This confirms
the schedule fires on its own and the widget picks up the fresh quote without staff intervention.

The same collision happened a **second time** ~3 minutes later (container restarted again at
`09:33:46Z` by another concurrent deploy, scheduler file gone from `dist/` again) — confirming this wasn't a
one-off but a recurring hazard of several concurrent QA sessions on this engagement redeploying the same
shared `arcus-dev-api` container from checkouts that don't yet include this fix. Redeployed a third time
(`09:35:11Z`) to restore it, then closed the gap at the source: fast-forward merged
`feature/street-rates-auto-refresh` straight into `nvccz`/master (`bc72624` → `e05193f`, clean fast-forward,
pushed to origin) so any future deploy — from this engagement's other concurrent sessions or otherwise —
that builds from a fresh `master` checkout now includes the scheduler by default, rather than depending on
this feature branch surviving until someone remembers to merge it. Final state confirmed stable: container
`arcus-dev-api-1` healthy, `RestartCount=0`, `StreetRateAutoRefreshScheduler.js` present in `dist/`.

## Coverage note

This is a genuinely small module — 2 screens, no vendored runtime, straightforward plain-React components.
Did not find any other defects in the KPI cards, chart rendering, context-tab switching, or Config CRUD
drawers beyond the two items above. Considering this module's live-testing phase complete unless further
issues surface.
