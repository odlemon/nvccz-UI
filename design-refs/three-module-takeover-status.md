# Three-module takeover — status

**Date:** 9 September 2026

Taking over LP portal, payroll and fundraising. This records what is actually verified, what was
fixed, and what is genuinely still open — so the next session starts from fact rather than from a
claim.

## Where the work lives

See `branch-topology.md`. Each module has its own branch in both repos; fixes made here are
cherry-picked onto the module branch, so `feature/payroll-v6-live` carries the payroll fix below
and `feature/lp-portal-live` carries the LP work.

## LP portal — verified complete

24 defects found and fixed, all verified against a running stack rather than by inspection:

- 30/30 screen × role combinations render with live endpoint traffic
- every on-screen number traces to an API payload or a demonstrated derivation
- all seven cross-module flows (A1–A7) observed on every module they touch
- 15/15 SRD API conformance checks pass, including cross-investor isolation (404) and fund
  entitlement

Full detail in `lp-portal-test-plan.md`.

## Payroll — the missing backends are built

### Measurement was wrong first

The module's trace script mined digits out of record ids and timestamps — the cuid
`cmtu17exj001dunw05vum616a` contributed a phantom "616" — so it reported **100** untraced numbers
where **78** were real. Fixed before anything else: you cannot fix what you cannot measure.

### Fixed: the Vendors & Quotations registry

The screen rendered a hardcoded fixture — Medsure Health Fund, VEN-001 and friends, each with an
invented rating and compliance percentage — under KPI cards asserting **26 registered vendors, 21
compliance-ready and USD 28,460 of negotiated savings**. None of it came from anywhere.

No new model was needed: `Vendor` already holds name, contact, category, rating, tax-compliance
status and blacklisting. `GET /api/payroll/vendors` now serves those rows with header figures
derived from them. `payroll.vendors.view` already existed and was already granted; only the route
was missing.

The screen now reads **Registered vendors 1 · 1 pending · Blacklisted 0 · No ratings recorded** —
the one real vendor in the database. Untraced on that page: **25 → 14**. There is deliberately no
fixture fallback; an empty registry renders as empty.

### Two mistakes I made getting there, both caught before they shipped

1. I guarded the runtime patch on the helper **name**, which the injected bridge defines, so it
   reported "already applied" and silently skipped — the exact trap the module's own patch script
   warns about in a comment. Fixed to guard on the patched call site.
2. My first regex bounded the match with `[^\n]*` on what looked like a line. These are minified
   lines carrying many statements: the vendors row assignment ends with the runtime's **entire
   page registry** (`vendors:vendorsPage,…,mypay:myPayPage}`), which the match ate. That would
   have broken every payroll page. Caught by checking the diff (`git diff --stat` showed
   deletions), the runtime restored from HEAD, and each match now bounded by its own terminator.
   Also `rows` must stay an **array** — the caller does `${rows.join('')}` — and my replacement
   had produced a string.

### Built: the four domains that had no backend

Seven tables, sixteen endpoints, two new permission pairs, and the runtime patches that put the
screens on them. `payroll-v6-backend-asks.md` §2.2, §2.4, §2.5 and §2.8 are closed.

| Domain | What it now does |
|---|---|
| **Inputs & Validation** | `PayrollInputBatch` + `PayrollInputRow`. Validation looks employees up and says why each row failed; a batch cannot be committed while any row is in error, and resolving recounts the batch from its rows rather than adjusting a counter |
| **Pay Groups & Calendar** | `PayrollPayGroup` + `PayrollCalendarPeriod`. Periods reject an end date before their start; next pay date is derived |
| **Onboarding** | `PayrollOnboardingCandidate` with the SRD lifecycle enforced |
| **RFQs and quotations** | `PayrollRfq` + `PayrollRfqBid`. An award moves every other bid to rejected in one transaction; a bid nobody has scored reports `null`, not zero |

`payroll.inputs.*` and `payroll.onboarding.*` are new permissions, added to the catalogue **and**
the grant map in the same change and applied to six roles — a guard shipped without its grant 403s
every request, which has bitten this codebase twice.

**Nothing is seeded.** The screens render empty until real data exists.

### Verified end to end

Input validation rejects an unknown employee number and a missing amount **by name**; commit is
refused with two rows in error and accepted once resolved. A period ending before it starts is
refused. An unknown candidate status is refused. An RFQ award rejects the other bids atomically.

### Untraced numbers: 78 → 27

Measured after fixing the trace script, which had been mining digits out of record ids and
timestamps and reporting 100.

Ten of twenty screens are now at **zero**: onboarding, runs, inputs, tax, training, vendors, vault,
approvals, audit, settings. No screen falls back to a fixture — empty renders empty, and a role
without the permission is told so.

### What the remaining 27 are

| Screen | Count | What they are |
|---|---|---|
| leave | 11 | **sound** — `liability = (basic / 22) × days` from real salary and balances |
| employees | 5 | ZiG salary components, derived from real pay |
| mypay | 3 | masked bank tail `**** 8461`, and real payslip figures |
| overview | 3 | derived averages and chart ticks |
| close, components, calendar, reports, exceptions, access | 1 each | a mix of derivations and a few small asserted figures on cards nothing yet measures |

The last group is worth a further pass; each is a single figure on one card, not a fabricated
screen.

Checked and found **sound**, contrary to my first suspicion:

- **Leave liability** (11 untraced money values) is a genuine client-side derivation:
  `liability = (basic / 22) × days`, from real salary and real balances. The live path is active;
  the fixture arrays only fire when live data is absent.
- **Overview chart** values (8415k, 16850k, 25285k…) are Y-axis tick labels, not a fabricated
  series. The trend itself reads `dashboard.monthlyTrend` and returns empty when absent.

## Fundraising — verified, and it holds up

Re-run rather than trusted, and it survived the re-run. Fixed the measurement first, as with
payroll: the trace mined digits out of ids and timestamps.

| Check | Result |
|---|---|
| Number trace, 20 screens as sysadmin | **all 20 render**; every untraced value explained |
| End-to-end round trips | **24 passed, 0 failed**, with 5 real writes observed (investor, contact, opportunity, commitment, approval decision) |
| Role matrix, 5 roles | only SYSADMIN may write; CEO, HR_MGR, OPS_MGR and OPS_MEM all **403** with a visible message, not a silent no-op |

Every untraced number resolves and none is fabricated:

- compact money — `US$52.0M`, `US$129.9M`, `US$291.0M`, `US$79.00M`
- `127.0` and `0.1` — the `127.0.0.1` in the audit trail's IP column
- the rest were **records the probe scripts left in the database**

### Finding: the probes pollute the data they verify

`fundraising-role-matrix.mjs` and `fundraising-e2e-roundtrips.mjs` create real records and leave
them — the role matrix says so outright, because `/investors` has no delete route. They accumulate
every run and show up on the fundraising screens as genuine pipeline; the audit screen was listing
`E2E Close 363542` and `BEHAVIOUR close 875180` among real activity.

Removed 4 closings and 2 investor organisations (with their commitments, opportunities and
contacts, which hold required references and must go first). `scripts/_uat/clean-fundraising-probes.js`
does this and is matched only against the names the probes give themselves.

**The audit-trail entries stay.** `FundraisingAuditLog` has no delete route and should not have
one — an append-only audit is correct, and deleting rows to tidy a test run would be exactly the
wrong instinct. The right fix is for the probes to clean up their own records, which they now can.

## Honest position

**LP portal** — done to the standard asked.

**Fundraising** — verified and sound. All 20 screens live, 24/24 end-to-end, role refusals real,
no fabricated data. The previous agent's work held up under re-verification; the only things I
changed were the measurement and the test-data hygiene.

**Payroll** — the four screens that had no backend now have one, and the module's fabricated data
is gone: 78 untraced numbers down to 27, ten screens at zero, and nothing falling back to a
fixture. What remains is a handful of single figures on individual cards, itemised above, plus the
leave block which is a real derivation.

All three modules are now on live data. Payroll still has the smaller items above worth a further
pass, and `edit-employee` and the client-side payslip PDF remain unwired — both recorded in
`payroll-v6-backend-asks.md` as wiring rather than missing capability.
