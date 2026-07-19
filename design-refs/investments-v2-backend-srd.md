# Investments V2 Backend SRD and API Contract

**Module:** Investments V2 / Investment Operations  
**Frontend route:** `/investments-v2`  
**Canonical API namespace:** `/api/investment-ops`  
**Requirements source:** `design-refs/investments-v2-srd-ui-requirements.md`  
**Purpose:** Backend implementation source of truth for the Investments V2 workflows already represented in the frontend  
**Status:** Proposed backend contract  
**Last reviewed:** 2026-07-17

## 1. Executive summary

Investments V2 is an institutional investment-operations platform, not a retail stock-price screen. The backend must support the complete controlled lifecycle:

1. Configure reference data, portfolios, instruments, counterparties and operating rules.
2. Ingest and approve prices and FX rates.
3. Calculate holdings, cash, exposure, NAV and P&L.
4. Create and preview an order.
5. Run pre-trade calculations and compliance.   
6. Route the order through approval.
7. Send the approved order to a broker.
8. Capture partial or complete executions.
9. Confirm and settle trades.
10. Update positions and cash.
11. Generate balanced accounting events.
12. Reconcile internal records with external records.
13. Produce reports and controlled documents.
14. Preserve an immutable supervisory audit trail.

Most `/investments-v2` screens currently use local prototype data. Reporting already consumes the `/investment-ops/reports/*` contract. Backend implementation must extend the existing `investment-ops` API instead of creating a third overlapping investment API.

Primary existing frontend contracts to retain and extend:

- `lib/api/investment-ops-api.ts`
- `lib/store/slices/investmentOpsSlice.ts`
- `lib/api/investments-api.ts` for legacy compatibility only
- `lib/api/api-client.ts`

## 2. Product rules

- Only authorised users may access a portfolio or any linked order, trade, valuation, document, reconciliation item or accounting record.
- Only active Instrument Master records may be traded or valued.
- Financial calculations must be authoritative on the backend. Frontend calculations are previews only.
- Prices and FX rates used in valuation must be approved and traceable.
- Positions are derived from trades, transactions, corporate actions, cash movements and approved adjustments. They must not be freely created or edited.
- Material actions must support four-eye approval where configured.
- Completed valuations, posted journals, settled trades and approved document versions are immutable.
- Corrections use superseding records, reversals or compensating entries.
- Large tables require server-side search, filters, sorting and pagination.
- Long-running work must execute asynchronously.
- Every critical transition must be audit-logged.

## 3. Users and backend permissions

### 3.1 Portfolio Manager

Typical capabilities:

- View assigned portfolios and performance.
- Run authorised valuations and simulations.
- Create and submit orders.
- Review model drift and rebalance recommendations.
- Generate portfolio reports.

### 3.2 Trader / Dealing Officer

Typical capabilities:

- Create and edit draft orders.
- Route approved orders.
- Capture executions and fills.
- Confirm broker records.
- Monitor the Trade Blotter.

### 3.3 Compliance Officer

Typical capabilities:

- View compliance checks.
- Approve or reject orders.
- Maintain mandate rules and restricted lists.
- Approve or reject compliance overrides.

### 3.4 Fund Accountant

Typical capabilities:

- Run valuations.
- Review cash, positions and P&L.
- Run reconciliation.
- Review and post journals.
- Request or approve reversals.
- Generate ledger exports.

### 3.5 Operations Manager

Typical capabilities:

- Manage brokers, custodians, markets, currencies and price sources.
- Upload operational files.
- Resolve settlement and reconciliation exceptions.
- Manage order-routing and settlement defaults.

### 3.6 System Administrator

Typical capabilities:

- Manage roles, permissions and access.
- Manage system configuration and API credentials.
- View audit records.

### 3.7 Recommended permission codes

Portfolio and dashboard:

- `investments.dashboard.view`
- `investments.portfolio.view`
- `investments.portfolio.create`
- `investments.portfolio.configure`
- `investments.portfolio.value`

Instrument and market data:

- `investments.instrument.view`
- `investments.instrument.create`
- `investments.instrument.edit`
- `investments.instrument.approve`
- `investments.price.view`
- `investments.price.ingest`
- `investments.price.manual`
- `investments.price.approve`

Orders and trades:

- `investments.orders.view`
- `investments.orders.create`
- `investments.orders.edit_draft`
- `investments.orders.submit`
- `investments.orders.approve`
- `investments.orders.reject`
- `investments.orders.cancel`
- `investments.orders.route`
- `investments.orders.execute`
- `investments.trades.confirm`
- `investments.trades.settle`

Compliance and models:

- `investments.compliance.view`
- `investments.compliance.manage_rules`
- `investments.compliance.request_override`
- `investments.compliance.approve_override`
- `investments.simulation.run`
- `investments.models.manage`

Operations:

- `investments.reconciliation.view`
- `investments.reconciliation.run`
- `investments.reconciliation.resolve`
- `investments.reconciliation.approve_writeoff`
- `investments.valuation.view`
- `investments.valuation.run`
- `investments.valuation.resolve_exception`
- `investments.valuation.approve_override`
- `investments.accounting.view`
- `investments.accounting.post`
- `investments.accounting.request_reversal`
- `investments.accounting.approve_reversal`
- `investments.accounting.export`

Documents and reports:

- `investments.documents.view`
- `investments.documents.upload`
- `investments.documents.download`
- `investments.documents.approve`
- `investments.documents.manage_access`
- `investments.reports.view`
- `investments.reports.generate`
- `investments.reports.download`
- `investments.audit.view`

The backend must enforce role permission, portfolio assignment and object-level access. Hiding a frontend button is not an authorisation control.

## 4. API conventions

### 4.1 Success envelope

```json
{
  "success": true,
  "message": "Order submitted",
  "data": {},
  "meta": {
    "requestId": "req_01JABC",
    "serverTime": "2026-07-17T18:00:00Z"
  }
}
```

### 4.2 List envelope

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 50,
    "total": 0,
    "totalPages": 0
  },
  "meta": {
    "requestId": "req_01JABC"
  }
}
```

### 4.3 Error envelope

```json
{
  "success": false,
  "message": "The order was changed by another user.",
  "error": {
    "code": "ORDER_VERSION_CONFLICT",
    "message": "The order was changed by another user.",
    "fieldErrors": {},
    "details": {
      "expectedVersion": 7,
      "actualVersion": 8
    },
    "retryable": false
  },
  "meta": {
    "requestId": "req_01JABC"
  }
}
```

### 4.4 Data formatting

- IDs are opaque UUIDs or stable opaque strings.
- Dates use `YYYY-MM-DD`.
- Timestamps use ISO-8601 UTC.
- Monetary, quantity, price, percentage and FX values use decimal strings.
- Currency uses ISO codes such as `USD`, `ZWG`, `ZAR` and `GBP`.
- Do not return formatted financial strings as the only value.
- Mutable records return `version`, `createdAt`, `createdBy`, `updatedAt` and `updatedBy`.

### 4.5 List parameters

All large registers must support:

- `page`
- `pageSize`, maximum `200`
- `search`
- `sortBy`
- `sortDirection=asc|desc`
- `from`
- `to`
- Domain-specific filters

### 4.6 Idempotency and concurrency

- Require `Idempotency-Key` for create, submit, approve, reject, cancel, post, reverse, settle, upload-finalise, run and generate actions.
- Same key plus same payload returns the original response.
- Same key plus different payload returns `409 IDEMPOTENCY_KEY_REUSED`.
- Require `If-Match` or `expectedVersion` for audited mutable records.
- Stale updates return `409 VERSION_CONFLICT`.

## 5. Cross-module business workflow

### 5.1 Setup to valuation

1. Configure countries, currencies, markets, issuers, instrument types and counterparties.
2. Configure portfolio currency, valuation method, cost-basis method, settlement and controls.
3. Create an instrument as `DRAFT`.
4. Approve and activate the instrument.
5. Ingest a price from an approved source or controlled manual workflow.
6. Approve the price when required.
7. Run valuation against an immutable holdings, price and FX snapshot.
8. Publish the completed valuation snapshot to dashboard and portfolio views.

### 5.2 Order to settlement

1. User selects an authorised portfolio and active instrument.
2. Backend returns market context, current holding, cash, settlement defaults and approved price.
3. User enters side, order type, quantity, time in force and settlement details.
4. Frontend requests an authoritative preview.
5. Backend calculates fees, taxes, cash, exposure, P&L and compliance.
6. User saves a draft or submits the order.
7. Backend reruns validation and compliance.
8. Required approval steps are completed.
9. Trader sends the order to the broker.
10. One or more fills create executions and trades.
11. Broker confirmation and custodian settlement are recorded.
12. Positions, cash and accounting events update atomically.

### 5.3 Valuation to reporting

1. Valuation worker snapshots approved operational inputs.
2. Exceptions are resolved or approved.
3. Completed snapshot updates NAV, P&L and exposure.
4. Reporting jobs use immutable snapshot IDs.
5. Generated files retain template version, parameters, checksum and audit records.

### 5.4 Reconciliation to correction

1. User uploads or selects an external source.
2. Worker compares external records with immutable internal snapshots.
3. Differences become reconciliation items.
4. User investigates, assigns, escalates, resolves or requests write-off.
5. Approved correction creates a transaction, accounting event or other linked compensating record.
6. Original history remains unchanged.

## 6. Required entities

User and access:

- `users`
- `roles`
- `permissions`
- `user_portfolio_access`
- `audit_events`
- `approval_requests`
- `approval_steps`

Portfolio and reference data:

- `portfolios`
- `portfolio_folders`
- `portfolio_folder_assignments`
- `portfolio_configuration`
- `portfolio_limits`
- `countries`
- `currencies`
- `markets`
- `issuers`
- `stakeholder_profiles`
- `commission_rates`
- `settlement_accounts`
- `standing_settlement_instructions`

Instruments and market data:

- `instruments`
- `instrument_types`
- `instrument_subcategories`
- `instrument_api_mappings`
- `price_sources`
- `price_ticks`
- `fx_rates`
- `price_ingest_batches`
- `price_validation_items`

Orders and trades:

- `orders`
- `order_status_events`
- `order_approvals`
- `approval_routes`
- `blotters`
- `executions`
- `trades`
- `trade_allocations`
- `routing_dispatches`
- `routing_hops`

Portfolio calculations:

- `portfolio_holdings`
- `portfolio_cash_balances`
- `position_lots`
- `transactions`
- `valuation_runs`
- `valuation_items`
- `valuation_exceptions`
- `simulation_runs`
- `model_portfolios`
- `model_allocations`
- `rebalance_recommendations`

Operations and finance:

- `compliance_rules`
- `compliance_runs`
- `compliance_results`
- `compliance_overrides`
- `reconciliation_batches`
- `reconciliation_items`
- `reconciliation_resolutions`
- `accounting_events`
- `accounting_journals`
- `accounting_journal_lines`
- `accounting_reversals`
- `ledger_exports`

Files and reporting:

- `files`
- `documents`
- `document_versions`
- `document_links`
- `document_acl_entries`
- `report_templates`
- `report_runs`
- `background_jobs`

## 7. Dashboard APIs

### 7.1 Endpoints

- `GET /api/investment-ops/dashboard/summary`
- `GET /api/investment-ops/dashboard/allocation`
- `GET /api/investment-ops/dashboard/currency-exposure`
- `GET /api/investment-ops/dashboard/funds`
- `POST /api/investment-ops/dashboard/recalculate`
- `GET /api/investment-ops/jobs/{jobId}`

Summary query:

- `period=DAILY|WEEKLY|MONTHLY|QUARTERLY|YTD|CUSTOM`
- `startDate`
- `endDate`
- `fundId`
- `currencyCode`
- `search`
- Pagination and sorting

`CUSTOM` requires both dates and `startDate <= endDate`.

### 7.2 Summary response

```json
{
  "success": true,
  "data": {
    "period": "MONTHLY",
    "periodStart": "2026-07-01",
    "periodEnd": "2026-07-17",
    "generatedAt": "2026-07-17T18:00:00Z",
    "portfolios": [
      {
        "fundId": "fund_equity_world",
        "name": "Equity World",
        "nav": "9346467.46",
        "valuationDate": "2026-07-17",
        "pnl": "70518.92",
        "pnlPct": "0.0076",
        "baseCurrency": "USD",
        "status": "CURRENT",
        "latestValuationRunId": "val_01JABC",
        "lastRecalculation": "2026-07-17T17:45:12Z"
      }
    ]
  }
}
```

Portfolio summary statuses:

- `CURRENT`
- `STALE`
- `VALUATION_RUNNING`
- `COMPLETED_WITH_EXCEPTIONS`
- `UNAVAILABLE`
- `FAILED`

### 7.3 Recalculation request

```json
{
  "fundIds": ["fund_equity_world"],
  "asOf": "2026-07-17",
  "reason": "Dashboard refresh"
}
```

Return `202 Accepted` with valuation run and job IDs.

## 8. Portfolio APIs

### 8.1 Endpoints

- `GET /api/investment-ops/portfolios`
- `POST /api/investment-ops/portfolios`
- `GET /api/investment-ops/portfolios/{fundId}`
- `PATCH /api/investment-ops/portfolios/{fundId}`
- `GET /api/investment-ops/portfolios/{fundId}/overview`
- `GET /api/investment-ops/portfolios/{fundId}/holdings`
- `GET /api/investment-ops/portfolios/{fundId}/positions`
- `GET /api/investment-ops/portfolios/{fundId}/positions/{positionId}`
- `GET /api/investment-ops/portfolios/{fundId}/transactions`
- `GET /api/investment-ops/portfolios/{fundId}/exposure`
- `POST /api/investment-ops/portfolios/{fundId}/recalculate`

Portfolio statuses:

- `DRAFT`
- `ACTIVE`
- `RESTRICTED`
- `CLOSED`
- `ARCHIVED`

### 8.2 Overview requirements

Return:

- Portfolio name and manager
- NAV and P&L
- Start and valuation dates
- Base currency
- Status
- Latest valuation run
- Composition by securities, cash, archive, derivatives, funds, bonds and other
- Country, sector, currency, asset-class and issuer exposure
- Related orders

### 8.3 Positions rule

Do not expose an unrestricted `POST /positions`. Opening positions must result from:

- Executed trades
- Opening-balance migration
- Corporate actions
- Cash movements
- Controlled manual adjustments

Position details must identify the valuation run, approved price tick and approved FX rate used.

### 8.4 Transaction endpoints

- `GET /api/investment-ops/transactions/{transactionId}`
- `POST /api/investment-ops/portfolios/{fundId}/transactions/manual-adjustments`
- `POST /api/investment-ops/transactions/{transactionId}/reverse`

Transaction types:

- `PURCHASE`
- `SALE`
- `DIVIDEND`
- `INTEREST`
- `CORPORATE_ACTION`
- `FEE`
- `MANUAL_ADJUSTMENT`

Posted transactions are immutable. Reversal creates a linked compensating transaction.

## 9. Portfolio folder APIs

- `GET /api/investment-ops/portfolio-folders`
- `POST /api/investment-ops/portfolio-folders`
- `GET /api/investment-ops/portfolio-folders/{folderId}`
- `PATCH /api/investment-ops/portfolio-folders/{folderId}`
- `POST /api/investment-ops/portfolio-folders/{folderId}/archive`
- `POST /api/investment-ops/portfolio-folders/{folderId}/restore`
- `PUT /api/investment-ops/portfolio-folders/reorder`
- `POST /api/investment-ops/portfolio-folders/{folderId}/portfolio-assignments`
- `DELETE /api/investment-ops/portfolio-folders/{folderId}/portfolio-assignments/{fundId}`

Rules:

- Folder code is unique and uppercase.
- Hierarchy cycles are prohibited.
- Reordering siblings is atomic.
- Active children prevent archive unless moved or archived.
- Folder assignment does not automatically grant portfolio access.

## 10. Portfolio configuration APIs

- `GET /api/investment-ops/setup/funds/{fundId}/config`
- `PUT /api/investment-ops/setup/funds/{fundId}/config`
- `GET /api/investment-ops/setup/funds/{fundId}/limits`
- `POST /api/investment-ops/setup/funds/{fundId}/limits`
- `PATCH /api/investment-ops/setup/funds/{fundId}/limits/{limitId}`
- `POST /api/investment-ops/setup/funds/{fundId}/limits/{limitId}/archive`

Required configuration:

```json
{
  "managerUserId": "usr_42",
  "status": "ACTIVE",
  "baseCurrencyCode": "USD",
  "valuationMethod": "MARK_TO_MARKET",
  "costBasisMethod": "WEIGHTED_AVERAGE",
  "pricingSourceCode": "PRIMARY_MARKET_CLOSE",
  "valuationCutoffTime": "17:00:00",
  "valuationTimezone": "Africa/Harare",
  "settlementCycle": "T_PLUS_2",
  "settlementAccountId": "acct_cabs_usd",
  "fourEyeEnabled": true,
  "blockHardLimitBreaches": true,
  "enforcePositiveCash": true,
  "expectedVersion": 7
}
```

Base-currency changes after posted activity require controlled migration or rejection.

## 11. Instrument Master APIs

### 11.1 Endpoints

- `GET /api/investment-ops/instruments`
- `POST /api/investment-ops/instruments`
- `GET /api/investment-ops/instruments/{instrumentId}`
- `PATCH /api/investment-ops/instruments/{instrumentId}`
- `POST /api/investment-ops/instruments/{instrumentId}/submit`
- `POST /api/investment-ops/instruments/{instrumentId}/approve`
- `POST /api/investment-ops/instruments/{instrumentId}/reject`
- `POST /api/investment-ops/instruments/{instrumentId}/restrict`
- `POST /api/investment-ops/instruments/{instrumentId}/archive`
- `GET /api/investment-ops/instruments/types`

### 11.2 Instrument statuses

- `DRAFT`
- `PENDING_APPROVAL`
- `ACTIVE`
- `INACTIVE`
- `RESTRICTED`
- `SUSPENDED`
- `REJECTED`
- `ARCHIVED`

### 11.3 Instrument request

```json
{
  "instrumentCode": "TB30",
  "shortName": "Govt Treasury Bond 2030",
  "fullName": "Government of Zimbabwe Treasury Bond 2030",
  "ticker": "TB30",
  "isin": "ZW000TB20308",
  "marketCode": "OTC-ZW",
  "countryCode": "ZW",
  "issuerId": "issuer_goz",
  "instrumentTypeCode": "BOND",
  "subCategoryCode": "SOVEREIGN_BOND",
  "sectorCode": "SOVEREIGN",
  "listingCurrencyCode": "USD",
  "pricingSourceCode": "MANUAL_COMMITTEE",
  "valuationMethod": "MARK_TO_MARKET",
  "pricingMethod": "CLOSING_PRICE",
  "stalePriceThresholdHours": 24,
  "decimalPrecision": 6,
  "maturityDate": "2030-06-30",
  "couponRate": "0.085",
  "couponFrequencyCode": "SEMI_ANNUAL",
  "dayCountConvention": "ACT_365",
  "complianceRestriction": "RESTRICTED"
}
```

Rules:

- Instrument code is unique.
- Non-null ISIN is unique.
- Ticker uniqueness is market-scoped.
- Referenced setup records must be active.
- Fixed-income fields are subtype-dependent.
- Maker cannot approve own instrument where four-eye is enabled.
- Identity changes after trading begins require elevated approval.

## 12. Price and market-data APIs

### 12.1 Endpoints

- `GET /api/investment-ops/market-data/prices/latest`
- `GET /api/investment-ops/market-data/instruments/{instrumentId}/prices`
- `GET /api/investment-ops/market-data/validation-queue`
- `POST /api/investment-ops/market-data/prices/manual`
- `POST /api/investment-ops/market-data/ingest/uploads`
- `POST /api/investment-ops/market-data/ingest/run`
- `GET /api/investment-ops/market-data/ingest/batches`
- `GET /api/investment-ops/market-data/ingest/batches/{batchId}`
- `POST /api/investment-ops/market-data/validation-queue/{tickId}/approve`
- `POST /api/investment-ops/market-data/validation-queue/{tickId}/reject`
- `GET /api/investment-ops/market-data/price-sources/health`
- `GET /api/investment-ops/market-data/fx-rates`

### 12.2 Statuses

Validation:

- `PENDING`
- `VALIDATED`
- `APPROVED`
- `REJECTED`
- `STALE`
- `ESTIMATED`

Source:

- `API_CONFIRMED`
- `VENDOR_FEED`
- `FILE_UPLOAD`
- `MANUAL_OVERRIDE`
- `FALLBACK`

Batch:

- `QUEUED`
- `PROCESSING`
- `COMPLETED`
- `PARTIAL`
- `FAILED`

### 12.3 Manual price

```json
{
  "instrumentId": "inst_tb30",
  "priceType": "CLOSE",
  "price": "96.425000",
  "currencyCode": "USD",
  "pricedAt": "2026-07-17T12:46:00Z",
  "sourceCode": "MANUAL_COMMITTEE",
  "reason": "Valuation committee approved illiquid bond mark",
  "documentId": "doc_minutes_0717"
}
```

Manual, zero, negative, stale, conflicting and abnormal-NAV prices require controlled review.

## 13. Order Management System

### 13.1 Canonical order lifecycle

Main path:

1. `DRAFT`
2. `SUBMITTED`
3. `COMPLIANCE_REVIEW`
4. `APPROVAL_PENDING`
5. `APPROVED`
6. `SENT_TO_BROKER`
7. `PARTIALLY_EXECUTED`
8. `EXECUTED`
9. `PENDING_SETTLEMENT`
10. `SETTLED`
11. `ARCHIVED`

Alternative terminal outcomes:

- `REJECTED`
- `CANCELLED`
- `FAILED`

`CHECKED` is a compliance state. `CONFIRMED` is a broker-confirmation state. They must not compete with `orderStatus`.

### 13.2 New order context endpoints

- `GET /api/investment-ops/portfolios?permission=ORDER_CREATE`
- `GET /api/investment-ops/instruments?status=ACTIVE`
- `GET /api/investment-ops/instruments/{instrumentId}/market-context?fundId={fundId}`
- `GET /api/investment-ops/setup/brokers?status=ACTIVE`
- `GET /api/investment-ops/setup/custodians?status=ACTIVE`
- `GET /api/investment-ops/setup/settlement-accounts`
- `GET /api/investment-ops/approval-routes/applicable`

Market context returns:

- Approved current price
- Bid, ask, volume and history when licensed
- Current holding
- Average cost
- Unrealised P&L
- Portfolio weight
- Available holdings
- Settled, reserved, pending and available cash
- Price and FX source IDs
- Staleness warnings

Unavailable market data must be returned as unavailable, not fabricated.

### 13.3 Order endpoints

- `POST /api/investment-ops/orders/preview`
- `POST /api/investment-ops/orders`
- `GET /api/investment-ops/orders`
- `GET /api/investment-ops/orders/{orderId}`
- `PATCH /api/investment-ops/orders/{orderId}`
- `POST /api/investment-ops/orders/{orderId}/submit`
- `POST /api/investment-ops/orders/{orderId}/approve`
- `POST /api/investment-ops/orders/{orderId}/reject`
- `POST /api/investment-ops/orders/{orderId}/cancel`
- `POST /api/investment-ops/orders/{orderId}/send-to-broker`
- `GET /api/investment-ops/orders/{orderId}/history`
- `GET /api/investment-ops/orders/{orderId}/fills`
- `POST /api/investment-ops/orders/{orderId}/fills`
- `POST /api/investment-ops/orders/{orderId}/documents`

### 13.4 Preview request

```json
{
  "fundId": "fund_123",
  "instrumentId": "ins_delta",
  "side": "BUY",
  "quantity": "10000",
  "orderType": "MARKET",
  "limitPrice": null,
  "stopPrice": null,
  "timeInForce": "DAY",
  "validUntil": "2026-07-21",
  "brokerProfileId": "broker_imara",
  "custodianProfileId": "cust_stanbic",
  "settlementAccountId": "sa_zwl_01",
  "tradeCurrency": "ZWL",
  "settlementCurrency": "ZWL",
  "valueDate": "2026-07-21",
  "approvalRouteId": "route_standard"
}
```

### 13.5 Preview response

```json
{
  "success": true,
  "data": {
    "previewId": "opv_01JABC",
    "expiresAt": "2026-07-17T20:00:00Z",
    "inputHash": "sha256:abc",
    "snapshots": {
      "portfolioVersion": 148,
      "holdingVersion": 31,
      "priceTickId": "tick_901",
      "price": "322.5000",
      "priceStatus": "APPROVED",
      "pricedAt": "2026-07-17T19:45:00Z",
      "fxRateId": "fx_88"
    },
    "existingHolding": {
      "quantity": "50000",
      "averageCost": "295.1200",
      "marketValue": "16125000.00",
      "unrealizedPnl": "1369000.00",
      "unrealizedPnlPct": "0.0928",
      "portfolioWeightPct": "0.0420"
    },
    "calculation": {
      "grossConsideration": "3225000.00",
      "fees": [
        {
          "type": "BROKERAGE",
          "rateBps": "15",
          "amount": "4837.50"
        },
        {
          "type": "EXCHANGE_FEE",
          "rateBps": "4",
          "amount": "1290.00"
        }
      ],
      "taxes": [],
      "totalFees": "6127.50",
      "settlementAmount": "3231127.50",
      "cashImpact": "-3231127.50",
      "availableCashBefore": "42458320.45",
      "projectedCashAfter": "39227192.95",
      "projectedQuantity": "60000",
      "projectedAverageCost": "299.6933",
      "projectedMarketValue": "19350000.00",
      "projectedUnrealizedPnl": "1368400.00",
      "portfolioWeightAfterPct": "0.0561",
      "exposureImpactPct": "0.0141"
    },
    "compliance": {
      "outcome": "PASSED",
      "blocking": false,
      "checks": []
    },
    "approvalRoute": {
      "id": "route_standard",
      "name": "Standard dealing",
      "steps": ["PORTFOLIO_MANAGER", "DEALER"]
    },
    "warnings": []
  }
}
```

Order creation accepts `previewId` and `inputHash`. Submission recalculates and rejects an expired or mismatched preview.

### 13.6 Buy and sell calculation rules

Buy:

- Adds quantity.
- Reduces available cash.
- Settlement amount is gross plus fees and taxes.
- Increases exposure and weight.
- Recalculates average cost under the configured cost-basis method.

Sell:

- Must not exceed unencumbered available holdings unless shorting is explicitly allowed.
- Reduces quantity and exposure.
- Adds net proceeds to cash.
- Settlement amount is gross less fees and taxes.
- Realised P&L uses the configured cost-basis method.

The backend must derive fees, taxes, holidays, settlement cycle, price, FX and limits from effective-dated configuration.

## 14. Blotter and execution APIs

Blotters:

- `GET /api/investment-ops/blotters`
- `POST /api/investment-ops/blotters`
- `GET /api/investment-ops/blotters/{blotterId}`
- `PATCH /api/investment-ops/blotters/{blotterId}`
- `POST /api/investment-ops/blotters/{blotterId}/orders`
- `DELETE /api/investment-ops/blotters/{blotterId}/orders/{orderId}`

Trade Blotter:

- `GET /api/investment-ops/trades`
- `GET /api/investment-ops/trades/{tradeId}`
- `POST /api/investment-ops/trades/{tradeId}/confirm`
- `POST /api/investment-ops/trades/{tradeId}/settle`
- `GET /api/investment-ops/trades/{tradeId}/routing-hops`
- `POST /api/investment-ops/trades/{tradeId}/routing-hops/{hopId}/confirm`
- `POST /api/investment-ops/trades/{tradeId}/routing-hops/{hopId}/retry`
- `POST /api/investment-ops/trades/{tradeId}/routing-hops/{hopId}/cancel`
- `GET /api/investment-ops/trades/{tradeId}/settlement-document`

An order may have multiple immutable fills. Cumulative filled quantity and average execution price are derived.

Accounting status comes from the accounting workflow. It must not be a free-form “mark posted” flag.

## 15. Trading workspace APIs

- `GET /api/investment-ops/trading/positions`
- `GET /api/investment-ops/trading/summary`
- `POST /api/investment-ops/trading/recalculate`
- `GET /api/investment-ops/trading/saved-views`
- `POST /api/investment-ops/trading/saved-views`
- `PATCH /api/investment-ops/trading/saved-views/{viewId}`
- `DELETE /api/investment-ops/trading/saved-views/{viewId}`

Summary returns:

- NAV
- Securities value
- Settled cash
- Reserved cash
- Pending cash movements
- Available-to-trade cash
- Cash-check timestamp and status

Positions support portfolio, folder, instrument type, currency, industry, maturity, quantity and closed-position filters.

## 16. Compliance APIs

### 16.1 Endpoints

- `GET /api/investment-ops/compliance/results`
- `GET /api/investment-ops/orders/{orderId}/compliance-runs`
- `POST /api/investment-ops/orders/{orderId}/compliance-check`
- `GET /api/investment-ops/compliance/rules`
- `POST /api/investment-ops/compliance/rules`
- `PATCH /api/investment-ops/compliance/rules/{ruleId}`
- `POST /api/investment-ops/compliance/overrides`
- `GET /api/investment-ops/compliance/overrides`
- `POST /api/investment-ops/compliance/overrides/{overrideId}/approve`
- `POST /api/investment-ops/compliance/overrides/{overrideId}/reject`

### 16.2 Outcomes

- `PASSED`
- `WARNING`
- `FAILED`
- `REQUIRES_OVERRIDE`
- `APPROVED_WITH_EXCEPTION`
- `REJECTED`

### 16.3 Required checks

- Security exposure
- Issuer exposure
- Country exposure
- Sector exposure
- Currency exposure
- Minimum cash
- Illiquid asset exposure
- Restricted securities, markets and brokers
- Credit rating
- Maturity
- Leverage
- Derivatives
- ESG
- Client mandate

Each result returns threshold, current value, projected value, unit, outcome, blocking flag and explanation.

Overrides bind to the exact order version, result and rule-set version. Editing the order invalidates the override.

## 17. Simulation APIs

- `POST /api/investment-ops/simulation/runs`
- `GET /api/investment-ops/simulation/runs/{runId}`
- `GET /api/investment-ops/simulation/runs`

Simulation must not create, reserve, route or execute an order.

It returns before, after and delta values for:

- NAV
- P&L
- Cash
- Asset, issuer, sector, country and currency exposure
- Fees and taxes
- Compliance

Liquidity or slippage estimates must be omitted or marked unavailable unless backed by real data.

## 18. Model portfolio APIs

- `GET /api/investment-ops/model-portfolios`
- `POST /api/investment-ops/model-portfolios`
- `GET /api/investment-ops/model-portfolios/{modelId}`
- `PATCH /api/investment-ops/model-portfolios/{modelId}`
- `POST /api/investment-ops/model-portfolios/{modelId}/activate`
- `POST /api/investment-ops/model-portfolios/{modelId}/archive`
- `GET /api/investment-ops/model-portfolios/{modelId}/drift`
- `POST /api/investment-ops/model-portfolios/{modelId}/rebalance-recommendations`
- `POST /api/investment-ops/rebalance-recommendations/{runId}/create-draft-orders`

Models support targets by asset class, security, sector and currency.

Rebalance conversion creates draft orders only. It must not bypass compliance or approval.

## 19. Orders Setup APIs

- `GET /api/investment-ops/orders/configuration`
- `PUT /api/investment-ops/orders/configuration`
- `GET /api/investment-ops/approval-routes`
- `POST /api/investment-ops/approval-routes`
- `GET /api/investment-ops/approval-routes/{routeId}`
- `PATCH /api/investment-ops/approval-routes/{routeId}`
- `POST /api/investment-ops/approval-routes/{routeId}/activate`
- `POST /api/investment-ops/approval-routes/{routeId}/archive`
- `GET /api/investment-ops/setup/settlement-accounts`
- `POST /api/investment-ops/setup/settlement-accounts`
- `PATCH /api/investment-ops/setup/settlement-accounts/{accountId}`
- `GET /api/investment-ops/setup/standing-settlement-instructions`
- `POST /api/investment-ops/setup/standing-settlement-instructions`
- `PATCH /api/investment-ops/setup/standing-settlement-instructions/{instructionId}`

Configuration includes default broker, custodian, account, routing channel, settlement cycle, signing rule, cutoff, SWIFT BIC, four-eye, cash check and auto-route settings.

## 20. Module and reference Setup APIs

Global settings:

- `GET /api/investment-ops/setup/settings`
- `PUT /api/investment-ops/setup/settings`
- `GET /api/investment-ops/setup/price-sources`

Stakeholders:

- `GET /api/investment-ops/setup/stakeholders`
- `POST /api/investment-ops/setup/stakeholders`
- `GET /api/investment-ops/setup/stakeholders/{id}`
- `PATCH /api/investment-ops/setup/stakeholders/{id}`
- `POST /api/investment-ops/setup/stakeholders/{id}/archive`

Commissions:

- `GET /api/investment-ops/setup/commissions`
- `POST /api/investment-ops/setup/commissions`
- `PATCH /api/investment-ops/setup/commissions/{id}`
- `POST /api/investment-ops/setup/commissions/{id}/archive`

Reference registers:

- `/api/investment-ops/setup/countries`
- `/api/investment-ops/setup/currencies`
- `/api/investment-ops/setup/issuers`
- `/api/investment-ops/setup/markets`

Each register requires list, create, detail, update and archive operations.

Instrument types:

- `POST /api/investment-ops/setup/instrument-types`
- `PATCH /api/investment-ops/setup/instrument-types/{typeCode}`
- `POST /api/investment-ops/setup/instrument-types/{typeCode}/subcategories`
- `PATCH /api/investment-ops/setup/instrument-types/{typeCode}/subcategories/{subcategoryCode}`

Other required configuration:

- `GET/PUT /api/investment-ops/setup/corporate-action-mappings`
- `GET/PUT /api/investment-ops/setup/tag-definitions`
- `GET/POST /api/investment-ops/setup/coupon-frequencies`
- `PATCH /api/investment-ops/setup/coupon-frequencies/{id}`

Reference codes become immutable after use. Archive instead of delete.

## 21. Valuation APIs

### 21.1 Endpoints

- `POST /api/investment-ops/valuation/runs`
- `GET /api/investment-ops/valuation/runs`
- `GET /api/investment-ops/valuation/runs/{runId}`
- `GET /api/investment-ops/valuation/runs/{runId}/inputs`
- `GET /api/investment-ops/valuation/runs/{runId}/items`
- `GET /api/investment-ops/valuation/runs/{runId}/summary`
- `POST /api/investment-ops/valuation/runs/{runId}/cancel`
- `POST /api/investment-ops/valuation/runs/{runId}/rerun`
- `GET /api/investment-ops/valuation/exceptions`
- `GET /api/investment-ops/valuation/exceptions/{exceptionId}`
- `POST /api/investment-ops/valuation/exceptions/{exceptionId}/resolve`
- `POST /api/investment-ops/valuation/exceptions/{exceptionId}/override`
- `POST /api/investment-ops/valuation/exceptions/{exceptionId}/approve-override`
- `POST /api/investment-ops/valuation/exceptions/{exceptionId}/reject-override`
- `POST /api/investment-ops/valuation/exceptions/{exceptionId}/escalate`
- `GET /api/investment-ops/valuation/price-validation`
- `GET /api/investment-ops/valuation/fx-validation`

### 21.2 Run statuses

- `DRAFT`
- `VALIDATING_INPUTS`
- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `COMPLETED_WITH_EXCEPTIONS`
- `REJECTED`
- `FAILED`
- `CANCELLED`

### 21.3 Required controls

- Snapshot holdings, cash, trades, prices, FX, income, fees, taxes and corporate actions.
- Store input checksum.
- Store item-level formula version and source IDs.
- Completed runs are immutable.
- Input changes require a superseding run.
- Missing or unapproved prices block completion unless an authorised override exists.
- Weighted average is the default cost basis.
- Support FIFO and specific identification when configured.

## 22. Reconciliation APIs

### 22.1 Endpoints

- `POST /api/investment-ops/reconciliation/uploads`
- `POST /api/investment-ops/reconciliation/run`
- `GET /api/investment-ops/reconciliation/batches`
- `GET /api/investment-ops/reconciliation/batches/{batchId}`
- `GET /api/investment-ops/reconciliation/items`
- `GET /api/investment-ops/reconciliation/items/{itemId}`
- `POST /api/investment-ops/reconciliation/items/{itemId}/assign`
- `POST /api/investment-ops/reconciliation/items/{itemId}/investigate`
- `POST /api/investment-ops/reconciliation/items/{itemId}/resolve`
- `POST /api/investment-ops/reconciliation/items/{itemId}/escalate`
- `POST /api/investment-ops/reconciliation/items/{itemId}/write-off`
- `POST /api/investment-ops/reconciliation/items/{itemId}/approve-write-off`
- `POST /api/investment-ops/reconciliation/items/{itemId}/reject-write-off`
- `POST /api/investment-ops/reconciliation/items/{itemId}/reopen`
- `GET /api/investment-ops/reconciliation/items/{itemId}/history`
- `GET /api/investment-ops/reconciliation/summary`

### 22.2 Types

- `CASH`
- `HOLDINGS`
- `TRADE`
- `BROKER_CONFIRMATION`
- `CUSTODIAN_POSITION`
- `ACCOUNTING_LEDGER`
- `NAV`
- `PRICE`
- `FX`

### 22.3 Item statuses

- `MATCHED`
- `UNMATCHED`
- `PARTIALLY_MATCHED`
- `INVESTIGATING`
- `ESCALATED`
- `WRITE_OFF_PENDING`
- `RESOLVED`
- `WRITTEN_OFF`
- `REOPENED`

Resolution requires reason, user, timestamp and supporting evidence. Material write-off requires independent approval.

## 23. Accounting APIs

### 23.1 Endpoints

- `GET /api/investment-ops/accounting/events`
- `GET /api/investment-ops/accounting/events/{eventId}`
- `POST /api/investment-ops/accounting/events/{eventId}/retry`
- `GET /api/investment-ops/accounting/journals`
- `GET /api/investment-ops/accounting/journals/{journalId}`
- `POST /api/investment-ops/accounting/journals/{journalId}/submit`
- `POST /api/investment-ops/accounting/journals/{journalId}/approve`
- `POST /api/investment-ops/accounting/journals/{journalId}/reject`
- `POST /api/investment-ops/accounting/journals/{journalId}/post`
- `GET /api/investment-ops/accounting/reversals`
- `POST /api/investment-ops/accounting/events/{eventId}/reverse`
- `POST /api/investment-ops/accounting/reversals/{reversalId}/approve`
- `POST /api/investment-ops/accounting/reversals/{reversalId}/reject`
- `POST /api/investment-ops/accounting/ledger-exports`
- `GET /api/investment-ops/accounting/ledger-exports`
- `GET /api/investment-ops/accounting/ledger-exports/{exportId}`
- `GET /api/investment-ops/accounting/ledger-exports/{exportId}/download`

### 23.2 Rules

- Backend recalculates debit and credit totals.
- Unbalanced journals cannot post.
- Posted journals cannot be edited.
- Reversal creates a balanced counter-entry.
- Locked accounting periods reject posting or reversal.
- Posting, reversal and export are idempotent.

## 24. Documentation APIs

### 24.1 File workflow

1. Create upload session.
2. Upload file.
3. Verify checksum, type, size and malware scan.
4. Create metadata and links.
5. Approve or request changes.
6. Add immutable versions.
7. Enforce access on preview and download.

### 24.2 Endpoints

- `POST /api/investment-ops/files/upload-sessions`
- `POST /api/investment-ops/files`
- `POST /api/investment-ops/files/{fileId}/complete`
- `GET /api/investment-ops/files/{fileId}/status`
- `GET /api/investment-ops/documents`
- `POST /api/investment-ops/documents`
- `GET /api/investment-ops/documents/{documentId}`
- `PATCH /api/investment-ops/documents/{documentId}`
- `GET /api/investment-ops/documents/{documentId}/versions`
- `POST /api/investment-ops/documents/{documentId}/versions`
- `GET /api/investment-ops/documents/{documentId}/versions/{versionId}/preview`
- `GET /api/investment-ops/documents/{documentId}/versions/{versionId}/download`
- `POST /api/investment-ops/documents/{documentId}/versions/{versionId}/approve`
- `POST /api/investment-ops/documents/{documentId}/versions/{versionId}/request-changes`
- `POST /api/investment-ops/documents/{documentId}/versions/{versionId}/reject`
- `GET /api/investment-ops/documents/{documentId}/access`
- `PUT /api/investment-ops/documents/{documentId}/access`
- `GET /api/investment-ops/documents/{documentId}/audit`
- `POST /api/investment-ops/documents/{documentId}/archive`

Approval states:

- `PENDING_REVIEW`
- `APPROVED`
- `CHANGES_REQUESTED`
- `REJECTED`

## 25. Reporting APIs

Existing endpoints must remain compatible:

- `GET /api/investment-ops/reports/templates`
- `POST /api/investment-ops/reports/generate`
- `GET /api/investment-ops/reports`
- `GET /api/investment-ops/reports/{reportId}/download`

Add:

- `GET /api/investment-ops/reports/{reportId}`
- `POST /api/investment-ops/reports/{reportId}/retry`
- `POST /api/investment-ops/reports/{reportId}/cancel`
- `GET /api/investment-ops/reports/{reportId}/audit`

Templates must provide a machine-readable `parameterSchema`.

```json
{
  "code": "PORTFOLIO_VALUATION",
  "name": "Portfolio Valuation",
  "scopeType": "FUND",
  "supportedFormats": ["PDF", "EXCEL", "CSV"],
  "requiresFundId": true,
  "requiresClientId": false,
  "parameterSchema": {
    "type": "object",
    "required": ["valuationDate"],
    "properties": {
      "valuationDate": {
        "type": "string",
        "format": "date",
        "title": "Valuation Date"
      }
    }
  },
  "version": 3
}
```

Run statuses:

- `QUEUED`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

Keep `/fund-reporting/*`, portfolio-company reporting schedules and accounting report APIs unchanged.

## 26. Async jobs and events

Long-running operations:

- Valuation
- Dashboard recalculation
- Reconciliation
- Price ingest
- Broker routing and retries
- Large simulations
- Rebalance recommendations
- Accounting posting integration
- Ledger exports
- Report generation

Job response:

```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "resourceId": "val_123",
    "status": "QUEUED",
    "statusUrl": "/api/investment-ops/jobs/job_123"
  }
}
```

Job statuses:

- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `COMPLETED_WITH_EXCEPTIONS`
- `FAILED`
- `CANCELLED`

Required:

- `GET /api/investment-ops/jobs/{jobId}`

Initial frontend may poll every 2–5 seconds. SSE is an optional improvement.

Suggested events:

- `valuation.completed`
- `price.validation_changed`
- `order.status_changed`
- `order.compliance_completed`
- `order.approval_changed`
- `order.fill_received`
- `trade.confirmation_changed`
- `trade.settlement_changed`
- `trade.accounting_changed`
- `reconciliation.item_changed`
- `report.completed`

## 27. Four-eye and audit requirements

Configurable four-eye actions:

- Instrument activation
- Manual price approval
- Price override
- Order approval
- Trade execution
- Compliance override
- Valuation override
- Reconciliation write-off
- Accounting posting
- Journal reversal
- Material setup change

Rules:

- Requester cannot approve their own request.
- Approver requires action permission and portfolio access.
- Approval binds to the exact resource version.
- Changed resources invalidate stale approval.
- Service accounts may route but cannot approve.

Audit record:

```json
{
  "id": "aud_01JABC",
  "sequence": 18422,
  "entityType": "ORDER",
  "entityId": "ord_123",
  "fundId": "fund_123",
  "action": "APPROVED",
  "actor": {
    "id": "usr_42",
    "name": "J. Moyo"
  },
  "occurredAt": "2026-07-17T18:42:10Z",
  "reason": "Approved after compliance review",
  "oldValues": {
    "status": "APPROVAL_PENDING"
  },
  "newValues": {
    "status": "APPROVED"
  },
  "evidenceDocumentIds": [],
  "requestId": "req_01JABC"
}
```

Required:

- `GET /api/investment-ops/audit-events`
- `GET /api/investment-ops/capabilities?fundId={fundId}`

Audit records are immutable.

## 28. Required error codes

Authentication and access:

- `AUTHENTICATION_REQUIRED`
- `PERMISSION_DENIED`
- `PORTFOLIO_ACCESS_DENIED`
- `FOUR_EYE_SELF_APPROVAL`

Concurrency:

- `VERSION_CONFLICT`
- `IDEMPOTENCY_KEY_REUSED`
- `RECORD_LOCKED`
- `APPROVAL_STALE`

Portfolio and valuation:

- `PORTFOLIO_NOT_FOUND`
- `VALUATION_ALREADY_RUNNING`
- `MISSING_APPROVED_PRICE`
- `MISSING_APPROVED_FX_RATE`
- `STALE_PRICE_BLOCKED`
- `UNRESOLVED_BLOCKING_EXCEPTIONS`

Instrument and price:

- `INSTRUMENT_NOT_FOUND`
- `INSTRUMENT_INACTIVE`
- `DUPLICATE_INSTRUMENT_CODE`
- `DUPLICATE_ISIN`
- `DUPLICATE_PRICE`
- `PRICE_REQUIRES_APPROVAL`
- `MARKET_DATA_SOURCE_UNAVAILABLE`

Orders and compliance:

- `ORDER_NOT_FOUND`
- `ORDER_VERSION_CONFLICT`
- `INVALID_ORDER_TRANSITION`
- `INVALID_ORDER_TYPE_FIELDS`
- `INSUFFICIENT_CASH`
- `INSUFFICIENT_HOLDINGS`
- `PRICE_STALE`
- `COMPLIANCE_BLOCKED`
- `OVERRIDE_REQUIRED`
- `APPROVAL_INCOMPLETE`
- `APPROVAL_ROUTE_NOT_APPLICABLE`
- `BROKER_ROUTING_FAILED`

Reconciliation and accounting:

- `INVALID_SOURCE_FILE`
- `DUPLICATE_RECONCILIATION_BATCH`
- `EVIDENCE_REQUIRED`
- `WRITE_OFF_EXCEEDS_AUTHORITY`
- `JOURNAL_OUT_OF_BALANCE`
- `PERIOD_LOCKED`
- `JOURNAL_ALREADY_POSTED`
- `EVENT_ALREADY_REVERSED`

Files and reports:

- `UNSUPPORTED_FILE_TYPE`
- `FILE_TOO_LARGE`
- `MALWARE_DETECTED`
- `FILE_SCAN_PENDING`
- `DOCUMENT_ACCESS_DENIED`
- `REPORT_NOT_READY`
- `REPORT_EXPIRED`

Use HTTP:

- `400` malformed request
- `401` unauthenticated
- `403` unauthorised
- `404` absent or concealed
- `409` duplicate, stale version or invalid state
- `413` file too large
- `415` unsupported media type
- `422` business-rule failure
- `423` locked
- `429` rate limited
- `500` unexpected failure
- `502` integration failure
- `503` unavailable dependency

## 29. Non-functional requirements

Performance:

- Dashboard under three seconds under normal load.
- Interactive previews should normally complete within two seconds.
- Large table endpoints use indexes and server pagination.

Integrity:

- Prevent duplicate prices, orders, fills, trades, settlements and postings.
- Prevent unbalanced journals.
- Prevent unauthorised execution.
- Prevent settlement without a valid trade and account.
- Use database transactions around critical state changes.

Security:

- Authentication on every endpoint.
- Object-level authorisation.
- Encryption in transit and at rest.
- Signed or authenticated file download.
- Malware scanning.
- Secret and API credential encryption.

Resilience:

- Market-data failure must not take down portfolio administration.
- Integration retries retain attempt count, error and next retry time.
- Workers must be idempotent.
- Dead-letter failed jobs for operations review.

Observability:

- Request correlation IDs.
- Worker duration and queue-delay metrics.
- Valuation and reconciliation failure metrics.
- Routing and settlement integration health.
- Report-generation duration.
- Unauthorised-access alerts.

## 30. Delivery priorities

### Phase 1 — Core reference and portfolio truth

- Portfolio and folder APIs
- Instrument Master
- Reference Setup
- Approved prices and FX
- Positions and transactions
- Dashboard from completed valuation snapshots

### Phase 2 — Orders and compliance

- Authoritative order preview
- Draft and submission
- Compliance rules and results
- Approval routes
- Orderbook and history
- Broker routing and fills

### Phase 3 — Operations and finance

- Trade confirmation and settlement
- Reconciliation
- Valuation exceptions
- Accounting posting and reversal
- Documents and evidence

### Phase 4 — Reporting and optimisation

- Parameter-schema-driven reports
- Model portfolios
- Rebalance recommendations
- Realtime events
- Advanced market data

## 31. Backend acceptance criteria

Backend delivery is ready for frontend wiring when:

- Every list endpoint supports server filters, sorting and pagination.
- Response and error envelopes match this document.
- Dashboard uses authorised completed valuation snapshots.
- An instrument can move from draft to approved active state.
- Automated and manual prices can enter controlled validation.
- Portfolio positions are derived from operational records.
- Order preview returns authoritative financial and compliance impact.
- An order can move from draft through settlement.
- Buy and sell calculations produce correct cash, holding, P&L and exposure effects.
- Four-eye controls prevent self-approval.
- Trades generate balanced accounting events.
- Reconciliation supports external files and evidence-backed resolution.
- Valuation stores reproducible source snapshots.
- Documents support real upload, versioning, access and audit.
- Reports generate asynchronously and download from existing compatible endpoints.
- Critical actions are idempotent, version-controlled and audit-logged.
- Backend tests verify forbidden access, invalid transitions and duplicate submission.

## 32. Frontend verification map

Dashboard:

- `app/investments-v2/page.tsx`

Portfolio:

- `app/investments-v2/portfolios/page.tsx`
- `app/investments-v2/portfolios/instruments/page.tsx`
- `app/investments-v2/portfolios/prices/page.tsx`
- `app/investments-v2/portfolios/positions/page.tsx`
- `app/investments-v2/portfolios/transactions/page.tsx`
- `app/investments-v2/portfolios/setup/page.tsx`
- `app/investments-v2/portfolios/folder-setup/page.tsx`

Orders:

- `app/investments-v2/orders/blotter/page.tsx`
- `app/investments-v2/orders/orderbook/page.tsx`
- `app/investments-v2/orders/trading/page.tsx`
- `app/investments-v2/orders/compliance/page.tsx`
- `app/investments-v2/orders/simulation/page.tsx`
- `app/investments-v2/orders/models/page.tsx`
- `app/investments-v2/orders/setup/page.tsx`
- `components/investments-v2/place-equity-order-modal.tsx`

Operations:

- `app/investments-v2/reconciliation/page.tsx`
- `app/investments-v2/valuation/page.tsx`
- `app/investments-v2/accounting/page.tsx`
- `app/investments-v2/documentation/page.tsx`
- `app/investments-v2/reporting/page.tsx`

Shared contracts:

- `lib/api/investment-ops-api.ts`
- `lib/store/slices/investmentOpsSlice.ts`
- `lib/api/api-client.ts`

## 33. Important implementation note

The current frontend intentionally contains prototype data for UI design. It must not be treated as financial truth or copied into backend seed logic without explicit product review.

When the backend ships these contracts, frontend wiring should replace local arrays and calculations with:

1. API loading states.
2. Honest empty states.
3. Visible errors.
4. Permission-aware actions.
5. Backend `permittedActions`.
6. Polling or events for asynchronous work.
7. Backend-calculated financial values.
8. Immutable linked audit and document records.
