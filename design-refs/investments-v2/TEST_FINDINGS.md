# Investments — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). Module id `investments` (path `/investments-v2`), by far the
largest module in this batch — ~40 sub-screens across 7 groups (Portfolios, Orders, Reconciliation,
Valuation, Reporting, Documentation, Accounting). No code changes this pass — the one real defect found
traces to bad seed data, not application code (see FINDING-INV-001).

## Screens covered this pass

Dashboard, Trade Blotter, Reconciliation Overview, Valuation control centre. Given the module's size and the
remaining scope of this sweep (Accounting still to go), prioritized the screens most likely to surface
data-integrity issues in core NAV/trade data over an exhaustive 40-screen pass. Dashboard, Trade Blotter and
Reconciliation Overview all showed real, internally-consistent data (trade counts matching KPI totals,
recent trades matching a coherent settlement lifecycle, reconciliation exceptions that looked like genuine
test scenarios) — no defects found there.

## FINDING-INV-001 — NAV valuation runs produce wildly inflated results — root cause is bad dev seed data, not a code bug (not fixed — needs sign-off before touching ledger rows)

**Severity:** Critical in appearance (NAV off by 270x–1600x is about as serious as a financial figure can be
wrong) — but root-caused conclusively to three garbage test rows in the dev database, not application logic.
**Status: root cause fully confirmed, not fixed — cleaning up ledger data needs explicit sign-off, unlike a
demo dataset.**

Live on `/investments-v2/valuation`, "Arcus Listed Portfolio"'s 15 Aug 2026 NAV run showed
**NAV Output: $406,493,110.00** while every other run for the same portfolio (13 Aug 2026, and the
Dashboard's own current NAV) shows **$1,489,900.00** — a ~273× discrepancy. Confirmed live-reproducible, not
a stale one-off: triggered a fresh "Run valuation" for the same portfolio and got **$2,406,486,878.00** — an
even larger, ~1,615× inflated figure. In both bad runs, `unrealizedPnl` (`$130,300.00`/`$133,510.00`)
matched the correct, real P&L shown elsewhere — only the NAV total is affected.

Traced `InvestmentValuationService.ts`'s NAV computation
(`nav = nav.plus(marketValue)` per holding, then `nav = nav.plus(cash.balance)` per cash account, where
`cash.balance` is `SUM(investmentCashLedgerEntry.amount)` for the account with **no date/type filter**) and
confirmed via a direct database check that the calculation code itself is correct — it faithfully sums
what's actually in the ledger. The USD cash account backing this fund has exactly 3 rows, all
`entryType: MANUAL_ADJUSTMENT`:

| Date | Amount |
|---|---|
| 2026-08-13 | 5,000,000 |
| 2026-08-14 | 100,000,000 |
| 2026-08-20 | 999,999,999 |

These are unmistakably placeholder/test values (the round-number-plus-"999999999" pattern), not real cash
transactions — summing to **$1,104,999,999** of fake "cash" alone, before even adding real holdings market
value. The other three currency accounts on this same fund (ZAR, ZiG, ZWG) each carry a matching
`100,000,000` `MANUAL_ADJUSTMENT` row, and ZWG also carries its own `999,999,999` row alongside a few small,
plausibly-real `CREDIT`/`DEBIT` entries (480, -2500, -1000) — so the contamination is fund-wide across
currencies, not isolated to one account.

**Not fixed this pass.** Unlike the earlier-authorized Procurement demo-data cleanup, these are literal
`InvestmentCashLedgerEntry` financial ledger rows — deleting or correcting them without sign-off crosses
into the kind of change that should be confirmed first, even on a dev database, given how directly it
represents money. Recommending: confirm these three (or more — I only sampled the 4 accounts backing this
one fund; other funds' cash accounts weren't checked) `MANUAL_ADJUSTMENT` rows are indeed test artifacts,
then either delete them or replace with realistic seed values, and re-run the affected valuations. The
calculation code needs no change.

## Not exercised

Orders (Orderbook, Trading, Compliance, Simulation, Models, Setup), Reconciliation's other tabs (Trade
match, Cash match, Positions, Cash ledger, Exceptions, Statements), Reporting (7 sub-screens), Documentation
(5 sub-screens), Accounting (3 sub-screens), Portfolios' other tabs (Instruments, Prices, Positions,
Transactions, Folder Setup, Setup) — none of these were opened this pass. Given this module's real size and
apparent maturity (genuine trade/settlement/reconciliation data already in place), a dedicated follow-up
sweep is warranted rather than treating this pass as complete coverage.
