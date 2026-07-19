# Stock Picker Cash, Ledgers and Reconciliations — Backend SRD and API Contract

| Field | Value |
|---|---|
| Module | Arcus Stock Picker — Client Accounts, Cash, Ledgers and Reconciliations |
| Frontend home (active) | `/investments-v2/reconciliation` (to expand into sub-routes) |
| Canonical API namespace | `/api/v1/stock-picker` |
| Related (do not replace) | `/api/investment-ops/reconciliation/*` for portfolio holdings/trade recon (§22 of investments-v2-backend-srd.md) |
| Requirements source | Client Accounts, Cash, Ledgers and Reconciliations SRD 2.0 (19 July 2026) + UI design screenshots |
| Companion UI | Dark Stock Picker workspace (Investments V2 visual language) |
| Purpose | Backend implementation source of truth before FE redesign |
| Status | Proposed backend contract |
| Last reviewed | 2026-07-19 |

---

## 1. Executive summary

This capability is a **controlled cash subledger and reconciliation system** embedded in Stock Picker. It proves:

1. Whose cash is held (client / pooled vehicle / portfolio / legal entity).
2. Where it is held (bank / broker / custodian account + currency).
3. What the immutable double-entry ledger says.
4. What is settled, reserved, blocked, expected and available.
5. Whether external provider records agree.
6. Whether an account/period may close without unexplained differences.

It is **not** a separate Treasury product, **not** editable spreadsheet balances, and **not** Portfolio Management / VC / PE / LP capital-call tooling.

Current frontend at [`app/investments-v2/reconciliation/page.tsx`](app/investments-v2/reconciliation/page.tsx) is a thin Cash / Holdings / Trade / Exceptions mock. Backend must implement the full cash-control domain below; FE will later expand routes to match the design screenshots (see §20).

**Product definition in 60 seconds:** Arcus keeps an internal cash story (ledger) and stores the external story (bank/broker/custodian statements). Reconciliation links them and explains every difference. The feature is complete only when ownership, ledger history and external evidence agree.

---

## 2. Product rules (non-negotiable)

1. **Never let a user type over a cash balance.** Calculate from posted ledger lines.
2. **Never use binary floating-point for money.** Persist `NUMERIC`/`DECIMAL`; API amounts as decimal strings.
3. **Never delete or edit** a posted journal, confirmed match or closed period. Reverse, reopen or restate.
4. **Never let the same user create and approve** a controlled financial record (maker-checker).
5. **Never use a bank statement balance as available trading cash.** Availability is internal ledger + reservations + policy.
6. **Never mix** clients, portfolios, legal entities, accounts or currencies because totals “look” equal.
7. **Never auto-match** when two candidates compete or a hard compatibility rule fails.
8. **Never hard-code** settlement cycles, tolerances, sign maps, account maps or approval thresholds — use effective-dated configuration.
9. **External import does not silently post cash.** Commit creates immutable statement evidence; journals follow posting policy + approval.
10. **Do not confuse Balanced vs Fully reconciled.** Timing items can balance a batch while unmatched items remain.
11. **Idempotency** on every mutating write that can be retried (`Idempotency-Key` + domain keys).
12. **Dual currency display** where UI shows USD and ZWL: return both amounts when available; never net USD+ZWL without an approved FX event.

---

## 3. Screenshot → screen → API map

| Design screen | Planned FE route | Primary APIs |
|---|---|---|
| Client Accounts Overview | `/investments-v2/reconciliation` | `GET .../client-cash-accounts`, `GET .../cash-overview`, alerts |
| Trading Cash Ledger | `/investments-v2/reconciliation/cash-ledger` | `GET .../cash-ledger`, journals, movements |
| Fund Cash Ledger | `/investments-v2/reconciliation/fund-cash-ledger` | Same ledger APIs with fund/account filters + analytics |
| Fund Cash Reconciliation | `/investments-v2/reconciliation/fund-cash` | Batches, workspace panes, matches, breaks, rules |
| Broker & Custodian Reconciliation | `/investments-v2/reconciliation/broker-custodian` | Three-way workspace (internal / broker / custodian) |
| Reconciliation Exceptions & Approvals | `/investments-v2/reconciliation/exceptions` | Exceptions CRUD + approval actions |
| Investor / Client Statements | `/investments-v2/reconciliation/statements` | Statement generate / approve / deliver / preview |
| (Existing mock tabs) | Temporary on hub | Holdings/trade recon continues via `/api/investment-ops/reconciliation/*` until folded in |

---

## 4. Roles and permissions

### 4.1 Roles

| Role | Typical capabilities |
|---|---|
| Cash Operations Maker | Import review submit, propose journals/matches, investigate exceptions, request reservations |
| Cash Operations Checker | Approve journals, commits, matches, write-offs, period close, bank-mapping changes |
| Portfolio Manager / Dealing | Read available cash; request reservations linked to orders (no self-approve of journals) |
| Finance / Fund Accounting | Journal templates, GL mappings, close, GL export, write-off approval |
| Compliance / Risk | Holds, restricted accounts, unusual movements, evidence review |
| Technology / Platform | Provider adapters, parser versions; no monetary bypass |

### 4.2 Permission codes

```
sp.cash.access
sp.cash.accounts.view
sp.cash.accounts.manage
sp.cash.accounts.approve
sp.cash.position.view
sp.cash.position.explain
sp.cash.reservations.request
sp.cash.reservations.approve
sp.cash.reservations.release
sp.cash.ledger.view
sp.cash.journals.create
sp.cash.journals.approve
sp.cash.journals.reverse
sp.cash.imports.upload
sp.cash.imports.validate
sp.cash.imports.commit
sp.cash.reconciliation.view
sp.cash.reconciliation.run
sp.cash.reconciliation.match
sp.cash.reconciliation.unmatch
sp.cash.exceptions.view
sp.cash.exceptions.assign
sp.cash.exceptions.propose
sp.cash.exceptions.approve
sp.cash.close.precheck
sp.cash.close.execute
sp.cash.close.reopen
sp.cash.gl.export
sp.cash.setup.manage
sp.cash.statements.view
sp.cash.statements.generate
sp.cash.statements.approve
sp.cash.statements.deliver
sp.cash.audit.view
```

Unauthorised requests return **403 or 404** without revealing whether a restricted client/account exists.

---

## 5. Ownership hierarchy

Every cash record is scoped:

`tenant → legal_entity → client_or_vehicle → mandate → portfolio → external_cash_account / internal_ledger_account → currency`

| Ownership model | Rule |
|---|---|
| `SEGREGATED` | One external account ↔ one beneficial cash control |
| `OMNIBUS` | External balance = sum(internal allocations) + approved suspense |
| `HYBRID` | Separate populations; transfers need paired journals + evidence |

**Invariant:** No cash movement without tenant, legal entity, currency, external account or controlled suspense destination, internal ledger account, and beneficial owner or approved omnibus allocation.

---

## 6. Four dates (never merge)

| Date | Meaning |
|---|---|
| `trade_date` | When investment transaction was agreed |
| `settlement_date` | When cash/securities are contractually due |
| `value_date` | When provider applied the cash movement |
| `posting_business_date` | Arcus operational period of approval |

A Monday buy does **not** mean Monday cash movement. Reservations may apply immediately; ledger posts when policy says settlement is posted.

---

## 7. Sign and money conventions

| Field | Rule |
|---|---|
| `cash_signed_amount` | `> 0` cash asset increased; `< 0` decreased (Arcus canonical) |
| `debit_amount` / `credit_amount` | Non-negative magnitudes; exactly one side per journal line |
| Journal balance | `sum(debits) = sum(credits)` per currency-balancing model |
| Provider signs | Mapped via approved layout version; UI shows raw + canonical |

API money fields: **decimal strings** with explicit `currency` (ISO 4217; ZWG/ZWL treated as distinct from USD).

---

## 8. Cash states and formulas

### 8.1 States

| State | Changes posted ledger? | Available? |
|---|---|---|
| `POSTED_SETTLED` | Yes | Yes unless reserved/held |
| `POSTED_UNSETTLED` | Yes | Policy default: no |
| `EXPECTED_INFLOW` / `EXPECTED_OUTFLOW` | No | Projection only |
| `RESERVED` | No | No |
| `BLOCKED` | No | No |
| `SUSPENSE` | Via controlled suspense journal only | No |
| `CLEARED_SELL_PROCEEDS` | Yes | When reuse policy allows |

### 8.2 Authoritative formulas

```
internal_ledger_cash = opening_posted + inflows − outflows  (account/currency/as-of)
active_reservations = sum(remaining_amount) where ACTIVE | PARTIALLY_CONSUMED
diagnostic_available = settled_cash + eligible_additions − reservations − holds − pending_withdrawals − buffer
order_eligible_available = max(0, diagnostic_available)
omnibus_allocation_variance = external_omnibus − sum(internal_beneficial) − suspense
withdrawable_cash = settled − reservations − holds − withdrawals − buffer − provider_restrictions
  (excludes unsettled/margin-restricted)
```

**Never** derive available cash from the latest external statement closing balance.

### 8.3 Avoid double deduction

When a reserved buy settles, consume/release the reservation in the same controlled workflow as the settlement journal. Leaving the reservation active double-counts the reduction.

---

## 9. Data model (entities)

Build order: masters → accounts/mappings → journals/lines → reservations/expectations → external statements/lines → recon batches/match links → exceptions → period closes/GL exports → audit/read models.

### 9.1 `client_cash_accounts`

| Field | Type / notes |
|---|---|
| `account_id` | UUID PK |
| `tenant_id`, `legal_entity_id` | Required scope |
| `client_or_vehicle_id`, `mandate_id`, `portfolio_id` | Ownership |
| `owner_model` | `SEGREGATED \| OMNIBUS \| HYBRID` |
| `money_class` | e.g. `CLIENT_MONEY` |
| `account_type` | `CLIENT_BANK \| CUSTODY_CASH \| BROKER_SETTLEMENT \| PORTFOLIO_CASH_CONTROL \| FX_SETTLEMENT \| INCOME_RECEIPT \| FEE_COLLECTION \| SUSPENSE` |
| `provider_id` | Bank/broker/custodian |
| `external_identifier_encrypted` | Encrypted at rest |
| `masked_identifier` | e.g. `••••1001` for UI/export |
| `currency` | ISO; one operating currency per account |
| `status` | See Appendix statuses |
| `effective_from` / `effective_to` | Date range |
| `calendar_id`, `timezone` | e.g. Africa/Harare |
| `tolerance_policy_id`, `gl_mapping_id` | Effective-dated config refs |
| `version` | Optimistic concurrency |

**Uniqueness:** active (`provider_id`, external account identity fingerprint, `currency`).

### 9.2 `cash_ledger_journals` / `cash_ledger_lines`

Journal: `journal_id`, `source_system`, `source_event_id`, `posting_purpose`, `idempotency_key`, trade/value/posting dates, `status`, maker/checker, `reversal_of`, `configuration_version`, `audit_hash`.

Line: `line_id`, `journal_id`, `ledger_account_id`, `cash_account_id`, `beneficial_owner_id`, `debit`, `credit`, `signed_cash_amount`, transaction/base currency, FX fields, `description`.

**Rules:** posted immutable; correction = reversal journal + new journal; one active journal per source event + posting purpose.

### 9.3 `cash_reservations` / `cash_expectations`

Reservation: source event, account/portfolio/currency, original/consumed/released/remaining amounts, required/expiry dates, status, approvals, version.

Expectation: direction, amount, currency, due date, status, linked reservation/journal.

### 9.4 `external_statements` / `external_statement_lines`

Statement: provider, account, period, opening/closing, currency, `file_hash`, parser/mapping version, control totals, status, evidence URI.

Line: raw payload + canonical dates/sign/amount/currency/reference/counterparty, `fingerprint`, match status.

### 9.5 `reconciliation_batches` / `reconciliation_match_links`

Batch: account, currency, period, opening/internal/external/adjusted balances, variance, tolerance, config version, status, approvals.

Match link: `internal_line_id`, `external_line_id` (and optional third-leg refs for three-way), `matched_amount`, topology, score components, method, status, maker/checker, `reversal_of`.

### 9.6 `reconciliation_exceptions`

`exception_id`, batch/account/client scope, `category`, `severity`, amounts (transaction + reporting currency), owner, SLA dates, status, resolution, evidence, approvals.

### 9.7 `cash_period_closes` / `cash_gl_exports` / `cash_audit_events`

Close versioning, reopen/restate; export control totals + external posting refs; append-only audit.

### 9.8 Client statements (design screens)

| Entity | Purpose |
|---|---|
| `client_statement_runs` | Period, client, account, type (Monthly), currency, status |
| `client_statements` | Generated statement artefact, opening/closing sections, checksum |
| `client_statement_deliveries` | Channel (Email/Portal), status Delivered/Failed, timestamps |

---

## 10. Status catalogues

| Object | Statuses |
|---|---|
| Account | `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `CLOSING`, `CLOSED` |
| Journal | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `POSTED`, `REJECTED`, `REVERSED`, `FAILED` |
| Accounting export | `NOT_EXPORTED`, `QUEUED`, `EXPORTED`, `ACCEPTED`, `PARTIALLY_REJECTED`, `REJECTED` |
| Reservation | `REQUESTED`, `APPROVED`, `ACTIVE`, `PARTIALLY_CONSUMED`, `CONSUMED`, `RELEASED`, `EXPIRED`, `REJECTED`, `CANCELLED`, `DISPUTED` |
| Expectation | `EXPECTED`, `DUE`, `PARTIALLY_SETTLED`, `SETTLED`, `CANCELLED`, `OVERDUE`, `DISPUTED` |
| Statement import | `RECEIVED`, `PARSING`, `VALIDATION_FAILED`, `VALIDATED`, `PENDING_APPROVAL`, `COMMITTED`, `REJECTED`, `SUPERSEDED` |
| External line | `UNMATCHED`, `SUGGESTED`, `PARTIALLY_MATCHED`, `MATCHED`, `DISPUTED`, `DUPLICATE`, `REVERSED`, `IGNORED_WITH_APPROVAL` |
| Match | `PROPOSED`, `PENDING_APPROVAL`, `CONFIRMED`, `REJECTED`, `REVERSED` |
| Exception | `OPEN`, `ASSIGNED`, `INVESTIGATING`, `PROPOSED_RESOLUTION`, `PENDING_APPROVAL`, `RESOLVED`, `CLOSED`, `REOPENED` |
| Recon batch | `DRAFT`, `RUNNING`, `BALANCED_WITH_OPEN_ITEMS`, `PENDING_APPROVAL`, `RECONCILED`, `CLOSED`, `REOPENED`, `RESTATED`, `FAILED` |
| Period close | `OPEN`, `RECONCILING`, `PENDING_APPROVAL`, `CLOSED`, `REOPEN_REQUESTED`, `REOPENED`, `RESTATED` |
| Client statement | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `DELIVERED`, `FAILED`, `SUPERSEDED` |

Each transition is an **explicit named action** — no free-form status PATCH.

---

## 11. Exception catalogue

| Code | Meaning | Default owner |
|---|---|---|
| `UNMATCHED_EXTERNAL` | External line with no acceptable internal record | Cash Operations |
| `UNMATCHED_INTERNAL` | Posted cash with no external evidence after expected date | Cash Operations |
| `AMOUNT_VARIANCE` | Same event, different amounts | Cash Ops / Finance |
| `DATE_VARIANCE` | Dates outside tolerance | Cash Ops |
| `CURRENCY_MISMATCH` | Incompatible currencies | Cash Ops / Finance |
| `DUPLICATE_SOURCE` | Repeated file/statement/line/event | Cash Ops / Technology |
| `WRONG_ACCOUNT` | Belongs to another account/mapping | Cash Ops |
| `MISSING_STATEMENT` | Expected statement absent | Cash Ops |
| `STALE_RESERVATION` | Reservation past expected lifecycle | Dealing / Cash Ops |
| `NEGATIVE_AVAILABLE_CASH` | Diagnostic available below zero | PM / Cash Ops |
| `SUSPENSE_ITEM` | Cash in suspense pending ownership | Cash Ops / Compliance |
| `GL_VARIANCE` | Subledger vs GL disagree | Finance |
| `ACCESS_OR_POLICY` | Restriction/hold/authorisation conflict | Compliance / Risk |
| `BANK_CHARGE_DIFFERENCE` | Provider charge vs internal (Fund Cash design) | Cash Ops |
| `TIMING_DIFFERENCE` | Explainable in-transit item | Cash Ops |
| `FX_VARIANCE` | FX residual under/over policy | Finance |
| `MISSING_ENTRY_INTERNAL` / `MISSING_ENTRY_BANK` | One-sided population | Cash Ops |
| `UNMATCHED_TRADE` / `PRICE_VARIANCE` / `MISSING_SETTLEMENT` | Broker/custodian three-way (Exceptions design) | Cash Ops |

---

## 12. Matching engine

### 12.1 Reconciliation types

| Type | Compares |
|---|---|
| Transaction | Internal cash lines ↔ external statement lines |
| Three-way settlement | Trade/settlement source ↔ cash journal ↔ external |
| Balance | Adjusted external close ↔ internal close |
| Omnibus | External omnibus ↔ sum(beneficial) + suspense |
| Subledger-to-GL | Cash subledger ↔ Accounting postings |
| Transfer / FX-leg | Send/receive/transit + external evidence |
| Broker & custodian (UI) | Internal ↔ broker ↔ custodian (holdings/cash lines) |

### 12.2 Topologies

`ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`, `PARTIAL` — store **matched_amount** on links; residual remains open.

### 12.3 Hard rules (before scoring)

- Compatible tenant, legal entity, account population, currency.
- Neither side fully matched, locked, reversed, cancelled or outside batch window.
- Sum of link amounts ≤ each residual magnitude.
- Competing exact candidates → **no auto-match**; ambiguity exception.
- Closed-period / compliance-hold / manual-journal gates evaluated first.

### 12.4 Scoring (default weights — effective-dated config)

```
amount_score   // 1.0 within exact tolerance; else decay by abs diff
date_score     // 1.0 on expected value date; decay per business day
reference_score
counterparty_score
total = 0.50*amount + 0.20*date + 0.20*reference + 0.10*counterparty
```

| Total | Default action |
|---|---|
| ≥ 0.95 | Auto-match only if policy allows, hard rules pass, no competitor |
| ≥ 0.85 and &lt; 0.95 | Suggested — user confirm |
| ≥ 0.65 and &lt; 0.85 | Weak suggestion — investigate only |
| &lt; 0.65 | No suggestion |

### 12.5 Confirmation algorithm order

1. Select batch / account / currency / date window.
2. Exclude ineligible residuals.
3. Build candidates with component scores + config version.
4. Apply hard rules.
5. Detect competition.
6. Auto-match / suggest / leave unmatched.
7. Lock rows, re-check versions, write links atomically.
8. Recalculate residuals, variance, exceptions, audit.

### 12.6 Balance reconciliation

```
adjusted_external = external_closing + deposits_in_transit − outstanding_payments ± approved_provider_errors
variance = adjusted_external − internal_closing
balanced = abs(variance) ≤ tolerance AND statement control totals pass
fully_reconciled = balanced AND continuity OK AND material items matched/authorised AND approvals complete AND no blocking exceptions
```

---

## 13. API conventions

**Base:** `/api/v1/stock-picker`

| Convention | Rule |
|---|---|
| Auth | Bearer session; tenant + legal-entity scope on every query |
| Money | Decimal strings + `currency` |
| Dates | Separate `trade_date`, `settlement_date`, `value_date`, `business_date`, `timestamp` (UTC) |
| Mutations | `Idempotency-Key` header where replayable |
| Concurrency | Send `expected_version` / `If-Match` |
| Errors | Stable `code` + field + plain language |
| Pagination | `page`, `pageSize`, stable sort keys |
| Async jobs | `queued \| running \| succeeded \| partially_failed \| failed` + progress |

### 13.1 Stable error codes

| Code | When |
|---|---|
| `INSUFFICIENT_AVAILABLE_CASH` | Reservation exceeds eligibility |
| `STALE_VERSION` | Object changed after read |
| `MAKER_CHECKER_CONFLICT` | Maker tries to approve own action |
| `ACCOUNT_SCOPE_MISMATCH` | Ownership identifiers disagree |
| `CLOSED_PERIOD` | Value-dated action hits locked period |
| `DUPLICATE_SOURCE` | File/event/line already processed |
| `UNBALANCED_JOURNAL` | Debits ≠ credits |
| `HARD_RULE_FAILED` | Candidate violates hard match rule |
| `COMPETING_CANDIDATES` | Ambiguous auto-match |
| `CONTROL_TOTAL_FAILED` | Statement opening + movements ≠ closing |
| `UNKNOWN_ACCOUNT_MAPPING` | Import cannot map account/currency/layout |
| `CLOSURE_BLOCKED` | Close precheck failed (list blockers) |
| `SUSPENSE_REQUIRED` | Unknown external receipt path |

---

## 14. Core API contracts

### 14.1 Client cash accounts

| Method | Path |
|---|---|
| `GET` | `/client-cash-accounts` |
| `POST` | `/client-cash-accounts` |
| `GET` | `/client-cash-accounts/{accountId}` |
| `POST` | `/client-cash-accounts/{accountId}/submit` |
| `POST` | `/client-cash-accounts/{accountId}/approve` |
| `POST` | `/client-cash-accounts/{accountId}/reject` |
| `POST` | `/client-cash-accounts/{accountId}/suspend` |
| `POST` | `/client-cash-accounts/{accountId}/close` |

**Example — list response item (Client Accounts Overview KPI feed):**

```json
{
  "accountId": "cca_1001",
  "accountNumberMasked": "ZAM-001-001",
  "clientName": "Zambezi Asset Management",
  "baseCurrency": "USD",
  "accountType": "DISCRETIONARY",
  "providerName": "CBZ Custody",
  "cashBalance": { "amount": "1284563.20", "currency": "USD" },
  "cashBalanceLocal": { "amount": "33456789.12", "currency": "ZWL" },
  "availableBalance": { "amount": "982441.10", "currency": "USD" },
  "status": "ACTIVE",
  "reconciliationHealth": "OPEN_BREAKS",
  "unreconciledCount": 3,
  "lastActivityAt": "2025-05-27T14:22:00+02:00",
  "version": 12
}
```

**Create (draft) request:**

```json
{
  "legalEntityId": "le_arcus",
  "clientOrVehicleId": "cli_sunrise",
  "mandateId": "man_zse",
  "portfolioId": "SPF-ZSE-001",
  "ownerModel": "SEGREGATED",
  "moneyClass": "CLIENT_MONEY",
  "accountType": "CUSTODY_CASH",
  "providerId": "prov_cust_zw",
  "externalAccountIdentifier": "0001001",
  "currency": "USD",
  "effectiveFrom": "2026-07-01",
  "calendarId": "cal_cust_harare",
  "timezone": "Africa/Harare",
  "tolerancePolicyId": "tol_usd_cash_std",
  "glMappingId": "glm_usd_custody"
}
```

### 14.2 Cash position and overview

| Method | Path |
|---|---|
| `GET` | `/portfolios/{portfolioId}/cash-position` |
| `GET` | `/portfolios/{portfolioId}/cash-explanation` |
| `GET` | `/portfolios/{portfolioId}/cash-projection` |
| `GET` | `/cash-overview` |

**Query:** `cashAccountId`, `currency`, `asOf` (required).

**Example — cash-position response:**

```json
{
  "portfolioId": "SPF-ZSE-001",
  "cashAccountId": "cca_1001",
  "currency": "USD",
  "asOf": "2026-07-19T10:00:00+02:00",
  "postedSettledCash": "10000.00",
  "activeReservations": "3000.00",
  "holdsAndBuffers": "0.00",
  "eligibleAdditions": "0.00",
  "diagnosticAvailableCash": "7000.00",
  "orderEligibleAvailableCash": "7000.00",
  "withdrawableCash": "7000.00",
  "calculationVersion": "AVAIL-USD-v4",
  "dataFreshness": {
    "ledger": "CURRENT",
    "lastStatementReceivedAt": "2026-07-18T17:00:00+02:00"
  },
  "explainUrl": "/api/v1/stock-picker/portfolios/SPF-ZSE-001/cash-explanation?cashAccountId=cca_1001&currency=USD&asOf=2026-07-19T10:00:00%2B02:00"
}
```

**Overview KPIs (match designs):** totals for client cash, available, pending settlements, unreconciled value/count, exceptions — with optional `localCurrency` amounts and `trendVsPrior7d`.

### 14.3 Reservations

| Method | Path |
|---|---|
| `POST` | `/cash-reservations` |
| `POST` | `/cash-reservations/{id}/approve` |
| `POST` | `/cash-reservations/{id}/consume` |
| `POST` | `/cash-reservations/{id}/release` |
| `GET` | `/cash-reservations` |

**Create request:**

```json
{
  "idempotencyKey": "order-784-reservation-v1",
  "expectedCashVersion": 143,
  "sourceEventId": "ORDER-784",
  "portfolioId": "SPF-ZSE-001",
  "cashAccountId": "cca_1001",
  "currency": "USD",
  "amount": "3000.00",
  "requiredDate": "2026-07-21",
  "expiryDate": "2026-07-23",
  "purpose": "BUY_SETTLEMENT"
}
```

### 14.4 Ledger and journals

| Method | Path |
|---|---|
| `GET` | `/cash-ledger` |
| `POST` | `/cash-journals` |
| `POST` | `/cash-journals/{id}/submit` |
| `POST` | `/cash-journals/{id}/approve` |
| `POST` | `/cash-journals/{id}/reject` |
| `POST` | `/cash-journals/{id}/reverse` |
| `GET` | `/cash-journals/{id}` |

**Ledger list filters (Trading / Fund Cash Ledger UI):** date range, fund, cash account, bank/provider, transaction type, currency, approval status, search.

**Example ledger row:**

```json
{
  "lineId": "cll_9081",
  "journalId": "clj_4401",
  "valueDate": "2025-05-27",
  "businessDate": "2025-05-27",
  "fundId": "fund_nyaradzo",
  "fundName": "Nyaradzo Pension Fund",
  "cashAccountId": "cca_op_zwl",
  "cashAccountLabel": "Nyaradzo PF Operating Account - ZWL",
  "providerName": "CBZ Bank",
  "transactionType": "RECEIPT",
  "description": "Dividend receipt",
  "debit": "0.00",
  "credit": "245870.00",
  "signedCashAmount": "245870.00",
  "runningBalance": "228734561.32",
  "currency": "ZWL",
  "approvalStatus": "APPROVED",
  "matchStatus": "MATCHED",
  "sourceEventId": "DIV-2025-0512"
}
```

**Sunrise buy-settlement journal (template):**

```json
{
  "sourceSystem": "TRADE",
  "sourceEventId": "TRD-SETTLE-8841",
  "postingPurpose": "BUY_SETTLEMENT",
  "idempotencyKey": "TRD-SETTLE-8841:BUY_SETTLEMENT",
  "valueDate": "2026-07-21",
  "currency": "USD",
  "lines": [
    { "ledgerAccountCode": "INV_SETTLEMENT_CLEARING", "debit": "3000.00", "credit": "0.00" },
    { "ledgerAccountCode": "TXN_CHARGE", "debit": "5.00", "credit": "0.00" },
    { "cashAccountId": "cca_1001", "debit": "0.00", "credit": "3005.00", "signedCashAmount": "-3005.00" }
  ]
}
```

### 14.5 External statement imports

| Method | Path |
|---|---|
| `POST` | `/external-statements/imports` |
| `POST` | `/external-statements/imports/{id}/validate` |
| `POST` | `/external-statements/imports/{id}/submit` |
| `POST` | `/external-statements/imports/{id}/commit` |
| `POST` | `/external-statements/imports/{id}/reject` |
| `GET` | `/external-statements/imports/{id}` |
| `GET` | `/external-statements/imports/{id}/errors` |

**Commit blocked when:** unreadable/duplicate unresolved file, unknown/inactive/ambiguous account mapping, control total fail, uncertain sign/date mapping, blocking line errors, maker=checker, counts changed after approval.

**Buttons semantics:** Validate = staging only; Commit = re-run controls + atomic immutable create + kick off matching.

### 14.6 Reconciliation batches and workspace

| Method | Path |
|---|---|
| `POST` | `/reconciliation-batches` |
| `POST` | `/reconciliation-batches/{id}/run` |
| `GET` | `/reconciliation-batches` |
| `GET` | `/reconciliation-batches/{id}` |
| `GET` | `/reconciliation-batches/{id}/workspace` |
| `GET` | `/reconciliation-batches/{id}/summary` |
| `POST` | `/reconciliation-batches/{id}/auto-match` |
| `GET` | `/reconciliation-rules/active` |

**Fund Cash Reconciliation summary (design KPIs):**

```json
{
  "asAt": "2025-05-27",
  "fundId": "fund_nyaradzo",
  "cashAccountId": "cca_op_zwl",
  "currency": "ZWL",
  "fundsReconciled": { "done": 18, "total": 24, "pct": 75 },
  "openBreaks": { "count": 23, "trendVsYesterday": 4 },
  "unreconciledValue": { "amount": "3245771.68", "currency": "ZWL", "trendPct": 8.6 },
  "awaitingBankStatements": { "count": 7, "value": "1287430.21" },
  "reconciledPctByValue": { "pct": 98.21, "trendPp": 0.42 },
  "lastReconciledAt": "2025-05-27T10:24:00+02:00",
  "autoMatchEnabled": true
}
```

**Workspace response (three panes):**

```json
{
  "batchId": "REC-2025-0527-01",
  "internal": {
    "sourceLabel": "Arcus Internal Ledger",
    "total": "228734561.32",
    "currency": "ZWL",
    "entries": [
      {
        "lineId": "cll_12",
        "valueDate": "2025-05-26",
        "description": "Bank charges",
        "signedCashAmount": "-1245.00"
      }
    ]
  },
  "external": {
    "sourceLabel": "CBZ Bank Statement",
    "total": "227488594.67",
    "currency": "ZWL",
    "entries": [
      {
        "lineId": "esl_44",
        "valueDate": "2025-05-26",
        "description": "Bank charge",
        "signedCashAmount": "-1315.00"
      }
    ]
  },
  "results": {
    "matchedCount": 212,
    "breaksCount": 23,
    "unmatchedCount": 7,
    "activeTab": "BREAKS",
    "items": [
      {
        "breakId": "BRK-000023",
        "valueDate": "2025-05-26",
        "type": "BANK_CHARGE_DIFFERENCE",
        "details": "Bank charge ZWL 75.00 higher than internal",
        "amount": "75.00",
        "status": "UNRECONCILED"
      }
    ]
  },
  "suggestions": [
    {
      "suggestionId": "sug_1",
      "internalLineId": "cll_9",
      "externalLineId": "esl_12",
      "reason": "Exact amount and date match",
      "confidence": 1.0,
      "scoreComponents": { "amount": 1.0, "date": 1.0, "reference": 0.95, "counterparty": 1.0 }
    }
  ]
}
```

### 14.7 Matches

| Method | Path |
|---|---|
| `POST` | `/matches/confirm` |
| `POST` | `/matches/manual` |
| `POST` | `/matches/{linkId}/reverse` |
| `GET` | `/matches/{linkId}` |

**Confirm request:**

```json
{
  "batchId": "REC-2025-0527-01",
  "topology": "ONE_TO_ONE",
  "method": "AUTO",
  "links": [
    {
      "internalLineId": "cll_8801",
      "externalLineId": "esl_9901",
      "matchedAmount": "3005.00",
      "internalExpectedVersion": 3,
      "externalExpectedVersion": 2
    }
  ],
  "scoreTotal": 0.98,
  "scoreComponents": { "amount": 1.0, "date": 1.0, "reference": 0.9, "counterparty": 1.0 },
  "evidenceRefs": ["file://statements/custodian-2026-07-21.pdf"]
}
```

### 14.8 Broker & custodian three-way

| Method | Path |
|---|---|
| `GET` | `/broker-custodian/workspace` |
| `POST` | `/broker-custodian/matches/confirm` |
| `POST` | `/broker-custodian/items/{id}/escalate` |
| `POST` | `/broker-custodian/items/{id}/clear` |

Workspace returns grouped rows with internal / broker / custodian legs, statuses `MATCHED | POTENTIAL | EXCEPTION`, and detail payload including ISIN, quantity, price, trade/settle dates, difference amount, assignee, comments.

### 14.9 Exceptions and approvals

| Method | Path |
|---|---|
| `GET` | `/reconciliation-exceptions` |
| `GET` | `/reconciliation-exceptions/{id}` |
| `POST` | `/reconciliation-exceptions/{id}/assign` |
| `POST` | `/reconciliation-exceptions/{id}/investigate` |
| `POST` | `/reconciliation-exceptions/{id}/propose-resolution` |
| `POST` | `/reconciliation-exceptions/{id}/approve` |
| `POST` | `/reconciliation-exceptions/{id}/request-info` |
| `POST` | `/reconciliation-exceptions/{id}/reject` |
| `POST` | `/reconciliation-exceptions/{id}/close` |
| `POST` | `/reconciliation-exceptions/{id}/reopen` |
| `GET` | `/reconciliation-exceptions/{id}/timeline` |
| `GET` | `/reconciliation-exceptions/summary` |

**Summary KPIs (Exceptions design):**

```json
{
  "from": "2025-05-20",
  "to": "2025-05-27",
  "criticalExceptions": { "count": 14, "valueUsd": "1285430.81", "trendPct": 27.3 },
  "overdueApprovals": { "count": 9, "valueUsd": "642178.29", "trendPct": 38.5 },
  "pendingAdjustments": { "count": 23, "valueUsd": "2145660.46", "trendPct": 15.7 },
  "straightThroughMatchRate": { "pct": 96.42, "trendPp": 1.42 }
}
```

**Exception detail (dual currency):**

```json
{
  "exceptionId": "EXC-2025-0081",
  "severity": "CRITICAL",
  "status": "PENDING_APPROVAL",
  "category": "UNMATCHED_TRADE",
  "accountCode": "ZAM-001-001",
  "clientName": "Zambezi Asset Management",
  "source": "CUSTODIAN",
  "counterparty": "Stanbic Custody",
  "instrument": { "name": "Econet Wireless", "symbol": "ECO.ZW" },
  "quantity": "250000",
  "tradeDate": "2025-05-22",
  "settleDate": "2025-05-27",
  "difference": {
    "transaction": { "amount": "124530.21", "currency": "USD" },
    "reporting": { "amount": "3245771.68", "currency": "ZWL" }
  },
  "ageDays": 5,
  "assignedTo": { "userId": "u_tmoyo", "name": "Tawanda Moyo" },
  "approver": { "userId": "u_rchikomo", "name": "Rudo Chikomo" }
}
```

**Approve & adjust request:**

```json
{
  "action": "APPROVE_AND_ADJUST",
  "notes": "Book missing commission to fee account per broker advice",
  "adjustmentJournalDraftId": "clj_draft_991",
  "expectedVersion": 7
}
```

### 14.10 Break actions (Fund Cash detail panel)

| Method | Path |
|---|---|
| `GET` | `/reconciliation-breaks/{breakId}` |
| `POST` | `/reconciliation-breaks/{breakId}/adjust-internal` |
| `POST` | `/reconciliation-breaks/{breakId}/mark-reviewed` |
| `POST` | `/reconciliation-breaks/{breakId}/create-manual-entry` |
| `POST` | `/reconciliation-breaks/{breakId}/comments` |

### 14.11 Period close and GL export

| Method | Path |
|---|---|
| `POST` | `/cash-periods/{period}/precheck` |
| `POST` | `/cash-periods/{period}/close` |
| `POST` | `/cash-periods/{period}/reopen-request` |
| `POST` | `/cash-periods/{period}/restate` |
| `POST` | `/cash-gl-exports` |
| `GET` | `/cash-gl-exports/{id}` |
| `POST` | `/cash-gl-exports/{id}/retry` |

**Precheck response must itemise blockers** (missing statement, variance, suspense age, incomplete approvals, GL mismatch) with value, owner and remediation link — never a sole `CLOSE_FAILED`.

### 14.12 Client / investor statements

| Method | Path |
|---|---|
| `GET` | `/client-statements` |
| `POST` | `/client-statements/generate` |
| `GET` | `/client-statements/{id}` |
| `GET` | `/client-statements/{id}/preview` |
| `POST` | `/client-statements/{id}/approve` |
| `POST` | `/client-statements/{id}/email` |
| `GET` | `/client-statements/{id}/download` |
| `GET` | `/client-statements/summary` |

Statement body sections (preview design): opening cash, receipts, payments, fees, realised gains/losses, closing cash — all calculated from ledger + reservations policy, not free-typed.

### 14.13 Setup / configuration

| Method | Path |
|---|---|
| `GET/POST` | `/setup/providers` |
| `GET/POST` | `/setup/file-layouts` |
| `GET/POST` | `/setup/account-mappings` |
| `GET/POST` | `/setup/tolerance-policies` |
| `GET/POST` | `/setup/match-weight-policies` |
| `POST` | `/setup/{resource}/{id}/activate` |

All config versions are effective-dated and maker-checker approved before use by historical batches.

---

## 15. Domain events

| Event | Minimum payload |
|---|---|
| `cash.account.approved` | account id, ownership scope, currency, config version, effective date |
| `cash.reservation.active` / `cash.reservation.changed` | reservation/source, amounts, version |
| `cash.journal.posted` | journal/source, dates, currency totals, accounts, audit hash |
| `cash.statement.committed` | statement/account/period, counts, balances, hash |
| `cash.match.confirmed` | batch, links, amounts, method, score, approver |
| `cash.exception.changed` | category, severity, amount, owner, state, due date |
| `cash.period.closed` | legal entity, period, close version, control totals, approvers |
| `cash.statement.delivered` | statement id, channel, status |

Publish via transactional outbox in the same DB transaction as the domain write.

---

## 16. Audit requirements

Log: create, sensitive plaintext view, export, submit, approve, reject, post, reverse, import, map, match, unmatch, assign, resolve, close, reopen, configuration change, statement generate/deliver.

Each audit row: actor/service, role, tenant/legal entity, object id/version, timestamp, correlation id, reason, before/after hash, outcome, IP when available.

---

## 17. End-to-end workflows (backend outcomes)

### 17.1 Deposit observed

External credit imported → match expected receipt or unmatched → maker proposes journal (or suspense) → checker approves → cash increases; unexplained cash never becomes available.

### 17.2 Buy settlement

Trade expectation + atomic reservation → external debit → settlement journal → three-way match → reservation consumed → balances recalculated.

### 17.3 Sell settlement

Expected inflow → external credit → settlement journal → match → cleared-proceeds reuse policy gates availability.

### 17.4 Unknown external receipt

Unmatched or suspense journal only; excluded from available/withdrawable until ownership proven; then reverse suspense + correct receipt journal + match.

---

## 18. Non-functional requirements

| Area | Target |
|---|---|
| Money storage | `NUMERIC(24,6)` or stricter; no float/double |
| Cash overview P95 | under 2s with validated snapshots |
| Ledger scale | ≥ 10M lines/tenant with as-of reproducibility |
| Import | 100k lines staged ≤ 10 minutes with resume |
| Matching | Deterministic config version; no cross-account leakage |
| Concurrency | No double reservation / post / match / close |
| Accessibility | Status never by colour alone |
| Observability | Feed lateness, parser errors, negative cash, stale reservations, unmatched ageing, GL rejection, close blockers |

---

## 19. Relationship to Investments V2 §22

[`design-refs/investments-v2-backend-srd.md`](design-refs/investments-v2-backend-srd.md) §22 defines `/api/investment-ops/reconciliation/*` for portfolio **cash / holdings / trade / broker confirmation / custodian position / NAV / price / FX** recon.

| Concern | API home |
|---|---|
| Client cash accounts, double-entry cash subledger, reservations, bank statement ingest, fund cash workspace, period close, client statements | **This document** — `/api/v1/stock-picker/*` |
| Instrument position / trade blotter vs custodian holdings & broker confirms (existing Investments V2 tabs) | Keep `/api/investment-ops/reconciliation/*`; extend three-way broker-custodian UI against that namespace or bridge via facades documented here |

Do **not** create a third parallel recon API. Facades may compose investment-ops batch APIs into Stock Picker workspace payloads for Holdings/Trade tabs.

---

## 20. Frontend verification map

| Planned FE | Must prove against BE |
|---|---|
| Client Accounts Overview | List/filter accounts; dual-currency KPIs; unreconciled + exceptions alerts |
| Trading / Fund Cash Ledger | Paginated ledger, status pills, no editable balance, Explain from KPI |
| Fund Cash Reconciliation | Filters, Auto-match toggle, Run, three panes, break detail actions, rules + suggestions |
| Broker & Custodian | Three-leg grid, queue buckets, match/adjust/escalate/clear |
| Exceptions & Approvals | Severity/age filters, dual-currency difference, timeline tabs, approval actions, Submit Decision enabled only when valid |
| Client Statements | Generate → pending approval → approve → email/download; preview sections from ledger |
| Current mock UI under [`app/investments-v2/reconciliation/*`](app/investments-v2/reconciliation) | Dark multi-screen mock (Overview, Cash Ledger, Fund Cash, Broker & Custodian, Exceptions, Statements) — bind to APIs in this doc |

---

## 21. Gaps vs current frontend (backend asks)

| Gap | Why it matters | FE touch (later) |
|---|---|---|
| No real cash account registry | Ownership hierarchy missing | Hub screen |
| No journal/reservation APIs in FE clients | Cannot compute available cash correctly | Ledger + trade integration |
| Mock recon lacks match links / residuals / scores | Cannot prove partial/net matches | Fund cash + broker-custodian |
| No import commit workflow | Statements cannot become evidence | Import / fund cash |
| Exceptions lack dual-currency + approval state machine | Approvals design cannot bind | Exceptions screen |
| No period-close / GL export UX | Close unblockers invisible | Future close checklist |
| Client statements missing entirely | Statement designs have no API | Statements screens |
| Holdings/Trade tabs not wired to investment-ops contract | Duplicate mock concepts | Bridge or tabs after cash R1 |

---

## 22. Delivery phases (backend)

| Phase | Scope |
|---|---|
| **R1 — Safe cash core** | Accounts, immutable ledger, balance explain, reservations, roles, audit |
| **R2 — External evidence** | Imports, matching, fund cash workspace, exceptions |
| **R3 — Operational close** | Omnibus, GL export, close/reopen/restate, broker-custodian three-way, statements, SLAs |

**Minimum viable institutional release:** R1 must prove ownership, decimal precision, immutable balanced history, concurrency-safe availability, maker-checker, client isolation and reproducible balances — a balance card alone is not enough.

---

## 23. Acceptance scenarios (must automate)

| ID | Expected |
|---|---|
| AT-01 | Concurrent last-dollar reservation: exactly one succeeds |
| AT-02 | Triple-delivered settlement event: one journal |
| AT-03 | Re-upload same statement different filename: no duplicate commit |
| AT-04 | Provider “Debit” = money leaving → negative canonical cash |
| AT-05 | Many-to-one net match stores component amounts |
| AT-06 | Partial match leaves residual visible |
| AT-07 | Maker cannot approve own journal/match (UI + API) |
| AT-08 | Unknown receipt does not become available cash |
| AT-09 | Sell proceeds excluded until reuse policy true |
| AT-10 | Omnibus external = three internals + suspense |
| AT-11 | Posted journal not editable; reversal + correction only |
| AT-12 | Close lists every blocker with values |
| AT-13 | Back-valued line after close → late-item/reopen, no silent rewrite |
| AT-14 | GL export retry does not double-post |
| AT-15 | Client A cannot detect Client B account via search |

---

## 24. Worked Sunrise example (regression fixture)

| Step | Result |
|---|---|
| Opening posted cash | USD `10000.00` |
| Active buy reservation | USD `3000.00` |
| Available | USD `7000.00` |
| Settle USD `3005` (3000 + 5 charge) | Journal balanced; match external −3005; reservation consumed |
| Posted cash after | USD `6995.00` |

Every step must reproduce from immutable events + effective-dated config without reading a mutable `current_balance` column.

---

## 25. Approvers (sign-off)

| Approver | Scope |
|---|---|
| Business sponsor / CIO | Scope and go-live |
| Cash Operations | Accounts, import, recon, exceptions |
| Finance / Fund Accounting | Journals, mappings, close, GL |
| Compliance / Risk | Client money, holds, access |
| Technology / Security | Architecture, resilience, no control bypass |
| QA | Traceability requirement → test evidence |

---

## Document control

- **Supersedes:** ad-hoc mock contracts implied by the current reconciliation page only.
- **Does not replace:** full Investments V2 trading lifecycle SRD; composes with §22 for positions/trades.
- **UI implementation:** blocked until product owner confirms this file; then expand `/investments-v2/reconciliation/*` to match design screenshots.
