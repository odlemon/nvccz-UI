# Arcus Stock Picker / Investment Operations — SRD and UI Requirements

**Source:** `docs/Arcus_stock_picker_SRD_with_UI_Inspiration (1) (1).pdf`  
**Source title:** Arcus Investment Operations SRD  
**Purpose:** Canonical frontend design and implementation reference for `/investments-v2`  
**Status:** Requirements extracted; UI redesign not started  
**Last reviewed:** 2026-07-17

## 1. Product definition

The Stock Picker is not a standalone stock-price collector. It is the order-entry surface inside a complete, institutional investment operations platform.

The module must support the complete investment lifecycle:

1. Instrument setup
2. Price collection
3. Order generation
4. Compliance review and approval
5. Trade execution
6. Settlement
7. Position and cash monitoring
8. Valuation
9. Reconciliation
10. Reporting
11. Accounting integration
12. Audit and supervisory review

The target users are:

- Hedge funds
- Asset managers
- Pension funds
- Family offices
- Private wealth managers
- Institutional finance teams

Users must be able to manage multiple portfolios, asset classes, currencies, brokers, custodians and valuation dates from one interface.

The platform must support near-live market data where licensed feeds are available, and controlled manual or scheduled ingestion where they are not.

## 2. Product and design principles

The UI must feel like a modern hedge-fund operating system:

- Dark-first
- Compact
- Fast
- Data-rich
- Professional
- Operationally controlled
- Accurate at a glance

The visual system must include:

- Persistent left navigation rail
- Expandable submenus
- Blue active navigation states
- Logged-in user profile and logout control at the bottom of the sidebar
- Rounded cards
- White primary actions
- Compact financial tables
- Sortable columns
- Server-backed filters
- Portfolio tabs
- Dense financial summaries
- Valuation and allocation charts
- Order books and trade blotters
- Setup panels
- Search
- Alerts
- Light and dark mode

The module must communicate operational depth, control and audit discipline. It must not resemble a retail trading app or a simple quote viewer.

Critical actions must be permission-controlled and audit-logged.

## 3. Business objectives

The module must:

- Reduce manual investment administration.
- Improve valuation accuracy.
- Strengthen operational control.
- Provide portfolio NAV, P&L, exposure, asset allocation, currency exposure and valuation summaries.
- Support portfolio creation and administration across multiple asset classes.
- Maintain a central instrument master.
- Support order creation, approval, execution, settlement and monitoring.
- Calculate positions, cost basis, market value, realized and unrealized P&L, exposure, margin, cash and NAV.
- Run compliance controls before execution.
- Maintain a complete audit trail.

Supported asset classes include:

- Equities
- Bonds
- Funds
- ETFs
- Cash
- Commodities
- Certificates
- Options
- Futures
- CFDs
- FX forwards

## 4. Users, roles and permissions

### 4.1 Portfolio Manager

Responsibilities:

- View portfolio performance.
- Review allocation, positions and risk exposure.
- Oversee investment-strategy implementation.

Permissions:

- View assigned portfolios.
- Initiate orders.
- Run portfolio valuations.
- Review P&L.
- Request rebalancing.

### 4.2 Trader / Dealing Officer

Responsibilities:

- Manage orders, executions, the order book and broker communication.

Permissions:

- Create orders.
- Submit orders for approval.
- Mark executions.
- Attach broker confirmations.
- Update execution details where authorised.

### 4.3 Compliance Officer

Responsibilities:

- Review orders against mandate and regulatory rules before execution.

Permissions:

- Approve or reject orders.
- Maintain restricted lists.
- Configure mandate rules.
- Review exceptions.

### 4.4 Fund Accountant

Responsibilities:

- Manage NAV, accounting postings, cash balances, reconciliation and ledger integration.

Permissions:

- Run valuations.
- Review cash and securities positions.
- Post journals.
- Reconcile records.
- Export reports.

### 4.5 Operations Manager

Responsibilities:

- Control setup and market-data integrity.
- Monitor settlement and operational exceptions.

Permissions:

- Configure brokers, custodians, markets, currencies and price feeds.
- Configure routing-failure queues.

### 4.6 System Administrator

Responsibilities:

- Manage users, roles, API credentials, settings and access control.

Permissions:

- Manage users, roles and permissions.
- Manage system and security settings.
- Access audit information.

## 5. Required navigation and screens

### 5.1 Dashboard

- Portfolio summary
- Asset allocation
- Currency exposure
- Funds table
- Recalculation controls

### 5.2 Portfolios

- Overview
- Instruments
- Prices
- Positions
- Transactions
- Folder Setup
- Setup

### 5.3 Orders

- Trade Blotter
- Orderbook
- Trading
- Compliance
- Simulation
- Models
- Setup

### 5.4 Reconciliation

- Cash Reconciliation
- Holdings Reconciliation
- Trade Reconciliation
- Exceptions

### 5.5 Valuation

- NAV Runs
- P&L Runs
- Price Validation
- FX Conversion
- Valuation Exceptions

### 5.6 Reporting

- Portfolio Reports
- P&L Reports
- Allocation Reports
- Compliance Reports
- Trade Reports
- Reconciliation Reports
- Investor Reports

### 5.7 Documentation

- Broker Confirmations
- Custodian Statements
- Approvals
- Mandates
- Audit Documents

### 5.8 Accounting

- Accounting Events
- Journals
- Posting Statuses
- Reversals
- Ledger Exports

### 5.9 Setup / Administration

- Brokers
- Counterparties
- Commissions
- Countries
- Currencies
- Instrument Types
- Issuers
- Markets
- Price APIs

## 6. Dashboard requirements

The dashboard must provide an executive view of all portfolios without requiring the user to open each portfolio.

### 6.1 Portfolio summary

Display:

- Portfolio name
- NAV
- Valuation date
- P&L
- P&L percentage
- Base currency
- Status
- Last recalculation date

### 6.2 Asset allocation

Display allocations for:

- Bonds
- Equities
- Cash
- Crypto
- Funds
- Commodities
- Alternatives
- Other assets

### 6.3 Currency exposure

Display exposure for all configured currencies, including:

- USD
- ZiG
- EUR
- GBP
- JPY
- CHF
- ZAR

### 6.4 Funds overview

Display:

- Fund name
- NAV
- Value date
- Shares or units
- Currency
- Latest valuation status

### 6.5 Recalculate

The Recalculate action must initiate a controlled valuation run and update:

- NAV
- Market values
- P&L
- Cash
- FX conversions
- Exposure charts
- Fund-level summaries

### 6.6 Period selector

Supported periods:

- Daily
- Weekly
- Monthly
- Quarterly
- Year-to-date
- Custom date range

Changing the period must refresh values and charts while preserving the active portfolio or fund context.

## 7. Portfolio management requirements

### 7.1 Portfolio tabs

Use folder-style tabs for configured portfolios.

Examples:

- Equity World
- New Portfolio
- Multi Asset
- Fixed Income
- Asia Select

Selecting a tab must change the active portfolio without navigating away from the Portfolio module.

### 7.2 Portfolio header

Display:

- Portfolio name
- NAV
- P&L
- Start date
- Valuation date
- Base currency
- Portfolio manager
- Status

Only users with valuation permission may use Recalculate.

### 7.3 Portfolio composition

Show:

- Securities
- Cash
- Archive
- Derivatives
- Funds
- Bonds
- Other assets

Composition and valuation metrics:

- Total value
- Percentage of portfolio
- Interest
- Dividend
- Positions
- Exposure
- Margin
- Valuation date

### 7.4 Portfolio analytics

Provide:

- Country exposure
- Sector exposure
- Currency exposure
- Asset-class allocation
- Concentration
- Top holdings
- P&L by instrument

### 7.5 Positions

Show current holdings and cash positions.

### 7.6 Transactions

Show:

- Purchases
- Sales
- Dividends
- Interest
- Corporate actions
- Fees
- Manual adjustments

Applicable rows must link to supporting trade, valuation, accounting and document records.

## 8. Instrument Master requirements

An instrument cannot be traded, valued, reported or reconciled unless it exists in the Instrument Master and is active.

### 8.1 Supported instrument types

- Equity
- Fund
- Cash
- ETF
- Options
- FX / forwards
- Futures
- CFD
- Certificate
- Commodity
- Bond
- Preference shares
- ADRs
- GDRs
- REITs
- Coupons
- Money-market instruments
- Treasury bills
- Corporate bonds
- Government bonds

Every instrument type must support:

- Subcategories
- API filters
- Valuation method
- Pricing method
- Accounting treatment

The central Instrument Master must also maintain broker mappings.

### 8.2 Instrument fields

Identifiers:

- Instrument code
- Short name
- Full name
- Ticker
- ISIN
- Bloomberg code
- Reuters / Refinitiv code
- Internal reference

Classification:

- Exchange
- Market
- Country
- Issuer
- Instrument type
- Subcategory
- Sector
- Industry
- Liquidity classification
- Risk classification

Pricing:

- Currency
- Pricing source
- API filter
- Valuation method
- Stale-price threshold
- Decimal precision

Fixed income:

- Maturity date
- Coupon rate
- Coupon frequency
- Day-count convention
- Amortisation method
- Accrued-interest rule

Controls:

- Status
- Compliance restriction
- Created by
- Approved by
- Last updated date
- Audit version

## 9. Market data and price controls

The Market Data module must ingest, validate, store and distribute prices used for valuation.

### 9.1 Sources

- ZSE
- VFEX
- SECZIM
- Broker uploads
- Custodian files
- Licensed Bloomberg feeds
- Licensed Refinitiv feeds
- Other approved APIs
- CSV uploads
- Excel uploads
- Manual valuation committee prices

### 9.2 Collection methods

- Scheduled scraping from approved public sources
- Licensed near-live APIs
- Controlled file upload
- Manual entry with four-eye approval
- Fallback to the last confirmed price
- Stale-price detection
- Price-deviation detection
- Price-validation queue

### 9.3 Validation rules

Flag a price when:

- Movement exceeds the configured threshold from the previous close.
- The source is unavailable.
- The price is stale.
- The currency differs from the instrument currency.
- The price date differs from the valuation date.
- Multiple sources provide conflicting prices.

Require approval for:

- Manual prices
- Zero prices
- Negative prices
- Prices causing abnormal NAV movement

Statuses:

- Pending
- Validated
- Approved
- Rejected
- Stale
- Estimated
- Manual Override
- API Confirmed

## 10. Stock Picker and New Order screen

The Stock Picker is the New Order creation experience within the institutional OMS.

### 10.1 Required fields

- Portfolio
- Instrument
- Side
- Quantity
- Order type
- Limit price
- Broker
- Custodian
- Settlement account
- Trade currency
- Settlement currency
- Value date
- Notes
- Documents
- Approval route

### 10.2 Supported order types

- Market
- Limit
- Stop
- Stop-limit
- Fill-or-kill
- Good-till-cancelled
- Day order
- Manual instruction
- Model-generated rebalance order

### 10.3 Required pre-submission calculations

Before submission, show:

- Estimated gross consideration
- Fees
- Taxes
- Settlement amount
- Portfolio weight after trade
- Cash impact
- Exposure impact
- Compliance result

### 10.4 Required Stock Picker actions

- Search and select a portfolio.
- Search and select an active Instrument Master record.
- Select Buy or Sell.
- Select order type.
- Enter and validate quantity.
- Enter a limit or trigger price when required by the order type.
- Select broker and custodian.
- Select settlement account and currencies.
- Select value date.
- Add notes.
- Attach documents.
- Select or display the approval route.
- Review calculated financial impact.
- Review compliance outcomes.
- Save as Draft.
- Submit for approval.

### 10.5 Validation and control rules

- Only active Instrument Master records may be selected.
- Required fields depend on order type.
- The user must not execute an order without permission.
- Compliance must run before approval and execution.
- Four-eye approval must be applied when configured.
- The order must retain portfolio-level authorisation.
- Every material state transition must be audit-logged.
- Documents and notes must remain linked to the order.

## 11. Orderbook requirements

### 11.1 Tabs

- Orderbook
- New
- Pending
- Executed
- Cancelled
- Failed
- Rejected
- Settled

### 11.2 Order fields

- Status
- Portfolio or fund
- Ticker
- Instrument
- Instrument Master reference
- Quantity
- Execution price
- Limit price
- Consideration
- Order type
- Broker
- Trader
- Trade date
- Value date
- Approval status
- Routing status
- Reference

Supported statuses:

- Confirmed
- New
- Checked
- Pending
- Approved
- Executed
- Rejected
- Cancelled
- Failed
- Settled

### 11.3 Lifecycle

Standard workflow:

1. Draft
2. Submitted
3. Compliance Review
4. Approved
5. Sent to Broker
6. Partially Executed
7. Executed
8. Pending Settlement
9. Settled

Alternative outcomes:

- Cancelled
- Rejected
- Failed
- Archived

Every transition must record:

- User
- Timestamp
- Reason
- Old status
- New status

## 12. Trade Blotter requirements

The Trade Blotter must show executed and pending trades and allow operations teams to monitor confirmation, settlement, accounting and custody status.

Required fields:

- Trade ID
- Portfolio
- Instrument
- Side
- Quantity
- Execution price
- Gross consideration
- Fees
- Net consideration
- Broker
- Custodian
- Trade date
- Value date
- Settlement status
- Accounting status
- Confirmation status

## 13. Compliance requirements

Compliance must check every order before approval and execution.

Rules must be configurable by portfolio, fund, client mandate and instrument type.

Supported checks:

- Maximum single-security exposure
- Maximum issuer exposure
- Maximum country exposure
- Maximum sector exposure
- Maximum currency exposure
- Minimum cash balance
- Maximum illiquid asset exposure
- Restricted securities
- Restricted markets
- Restricted brokers
- Minimum credit rating
- Maximum maturity
- Leverage limits
- Derivative exposure limits
- ESG restrictions
- Client-specific mandate restrictions

Outcomes:

- Passed
- Warning
- Failed
- Requires Override
- Approved with Exception
- Rejected

Overrides require:

- Reason
- Approver
- Timestamp
- Supporting document
- Permanent audit-log entry

## 14. Simulation and Model Portfolios

### 14.1 Simulation

Allow portfolio managers to simulate:

- Buy and sell orders
- Portfolio rebalancing
- Currency impact
- NAV impact
- P&L impact
- Exposure impact
- Cash impact
- Compliance impact
- Fee impact
- Tax impact

### 14.2 Model Portfolios

Models must support target weights for:

- Asset class
- Security
- Sector
- Currency

Models must also support:

- Risk category
- Client mandate
- Strategy

The system must compare live portfolios against models and generate rebalance recommendations.

## 15. Valuation and P&L

Valuation runs must be traceable, reproducible and linked to approved prices and FX rates.

### 15.1 Inputs

- Holdings
- Cash balances
- Latest approved prices
- Approved FX rates
- Accrued income
- Fees
- Taxes
- Settled trades
- Configured pending trades
- Corporate actions
- Manual valuation adjustments
- Portfolio valuation method
- Instrument pricing method
- Valuation date

### 15.2 Outputs

- Gross asset value
- Net asset value
- Market value
- Cost value
- Realized P&L
- Unrealized P&L
- Total return
- Income return
- Capital return
- Cash balance
- Accrued interest
- Dividends receivable
- Tax liabilities
- Currency exposure
- Asset allocation
- Portfolio performance
- Valuation exception list

### 15.3 Methodologies

Cost basis:

- Weighted Average Cost
- FIFO
- Specific identification

Pricing and valuation:

- Mark-to-market
- Amortised cost
- Manual valuation committee price
- Last traded price
- Closing price
- Bid price
- Mid price
- Ask price

Defaults must be configurable per portfolio and instrument type.

Weighted Average Cost is the default unless portfolio configuration specifies otherwise.

Unrealized P&L is quantity held multiplied by current price, less cost basis.

Realized P&L is sold quantity multiplied by net sale price, less cost basis.

Multi-currency values must use the approved valuation-date FX rate and be converted to the portfolio base currency.

## 16. Reconciliation

Compare Arcus records with:

- Broker records
- Custodian records
- Bank records
- Accounting records

Supported reconciliation types:

- Cash
- Holdings
- Trade
- Broker confirmation
- Custodian position
- Accounting ledger
- NAV
- Price
- FX

Statuses:

- Matched
- Unmatched
- Partially Matched
- Investigating
- Resolved
- Written Off
- Escalated

Raise exceptions when:

- Internal holdings differ from custodian holdings.
- Internal cash differs from bank records.
- Trades are missing.
- Prices differ from approved sources.
- Accounting entries are missing.

Resolution requires:

- User
- Timestamp
- Reason
- Supporting evidence

## 17. Accounting integration

Every accounting event must produce balanced debit and credit lines before posting.

Supported events:

- Purchases
- Sales
- Dividends
- Interest income
- Coupon payments
- Realized gains and losses
- Unrealized gains and losses
- Fees
- Taxes
- FX gains and losses
- Cash transfers
- Settlement movements
- Corporate actions

Purchase posting:

1. Debit the investment asset account.
2. Debit transaction costs.
3. Credit custodian cash or the bank clearing account.

Sale posting:

1. Debit cash.
2. Credit the investment asset account.
3. Post the realized gain or loss.
4. Record transaction costs separately.

Statuses:

- Not Posted
- Pending Review
- Posted
- Failed
- Reversed
- Manually Adjusted

## 18. Reporting

Supported formats:

- PDF
- Excel
- CSV
- Word where required
- API payload

Required reports:

- Portfolio valuation
- Holdings
- NAV
- P&L
- Realized gain or loss
- Unrealized gain or loss
- Trade blotter
- Cash balance
- Asset allocation
- Currency exposure
- Sector exposure
- Compliance breach
- Reconciliation exception
- Broker activity
- Custodian settlement
- Investor
- Board
- Audit trail

## 19. Documentation

Store:

- Broker confirmations
- Custodian statements
- Bank statements
- Investment committee approvals
- Compliance approvals
- Mandates
- Investor reports
- Valuation committee minutes
- Board approvals
- Trade instructions
- Settlement instructions
- Signed documents
- Audit files

Every document must track:

- Type
- Portfolio
- Linked trade where applicable
- Uploaded by
- Upload date
- Approval status
- Version number
- Access permissions
- Audit log

## 20. Setup requirements

Required tabs:

- Setup
- Broker / Counterparties
- Commissions
- Countries
- Currencies
- Instrument Types
- Issuer
- Markets

### 20.1 Price API status

Display:

- Heartbeat
- Latest day
- API status
- Message
- Ticks today
- Last successful run
- Failed requests
- Retry count

### 20.2 System settings

- Four-eye principle
- Default currency
- P&L start date
- Stale-price counter
- Default valuation method
- Default pricing source
- Settlement cycle
- Accounting method

## 21. Data model requirements

The backend must use a normalised, auditable PostgreSQL schema suitable for institutional investment workflows.

Minimum entities:

User and access:

- `users`
- `roles`
- `user_portfolio_access`
- `audit_logs`
- `system_settings`

Portfolio and instruments:

- `portfolios`
- `funds`
- `instruments`
- `instrument_types`
- `issuers`
- `markets`
- `countries`
- `currencies`

Market data:

- `price_sources`
- `price_ticks`
- `fx_rates`
- `price_validation_queue`

Orders and trades:

- `orders`
- `order_approvals`
- `trades`
- `trade_allocations`
- `settlement_instructions`
- `routing_dispatches`

Valuation and positions:

- `portfolio_holdings`
- `portfolio_cash_balances`
- `valuation_runs`
- `valuation_items`
- `valuation_exceptions`

Operations and finance:

- `accounting_events`
- `accounting_journal_lines`
- `reconciliation_batches`
- `reconciliation_items`
- `compliance_rules`
- `compliance_results`
- `documents`

## 22. Required API capabilities

The SRD defines operation groups, not literal URL paths.

Portfolio:

- List and create portfolios.
- Retrieve overview, holdings, positions and performance.
- Recalculate a portfolio.

Instrument:

- List and create instruments.
- Update an instrument.
- List and create instrument types.

Market data:

- Retrieve prices and security price history.
- Upload prices.
- Enter manual prices.
- Approve prices.
- List stale prices.

Orders:

- Create, update and submit orders.
- Approve and reject orders.
- Execute and cancel orders.

Trades:

- Retrieve trades.
- Settle and route trades.
- Retrieve routing status.

Valuation:

- Run and retrieve valuations.
- Retrieve portfolio valuation.
- List valuation exceptions.

Reconciliation:

- Run reconciliation.
- List and retrieve batches.
- Resolve reconciliation items.

Accounting:

- List events and journals.
- Post events.
- Reverse journals.

## 23. Security and access control

The system must enforce:

- Secure authentication
- Role-based access control
- Portfolio-level authorisation
- Object-level authorisation on every request

Users must not access a portfolio, order, trade, valuation, document or accounting record without explicit permission.

Authentication must support:

- Secure email and password login
- Multi-factor authentication
- Single sign-on where required

Four-eye approval must be configurable for:

- New orders
- Trade execution
- Manual prices
- Price overrides
- Accounting postings
- Reconciliation write-offs
- Compliance overrides
- Instrument setup changes

Audit logs must capture:

- Logins and failed logins
- Portfolio access
- Order creation
- Approvals
- Executions
- Settlements
- Price uploads and overrides
- Valuation runs
- Accounting postings
- Reconciliation resolutions
- Document uploads
- Setup changes
- API failures

Audit logs must be immutable and available for supervisory review.

## 24. Non-functional requirements

### 24.1 Performance and resilience

- Dashboard summaries must load within three seconds under normal conditions.
- Large tables must use pagination, server-side filtering and server-side sorting.
- Large valuation runs must execute asynchronously through background workers.
- Market-data ingestion failures must not take down portfolio management.

### 24.2 Scalability

Support multiple:

- Funds
- Clients
- Asset classes
- Currencies
- Brokers
- Custodians
- Data sources

### 24.3 Data integrity

- Prevent duplicate trades.
- Prevent duplicate prices for the same instrument, date and source.
- Prevent unbalanced accounting journals.
- Prevent unauthorised order execution.
- Prevent valuation without approved prices unless explicitly overridden.
- Prevent settlement without a valid trade reference and settlement account.
- Use soft deletes for critical records.
- Use immutable audit logs for critical records.

## 25. UI screen and action inventory

### 25.1 Dashboard

Show:

- Portfolio summary
- Asset allocation
- Currency exposure
- Funds overview

Actions:

- Select a period.
- Select a custom date range.
- Recalculate.
- Open a portfolio.

### 25.2 Portfolio Overview

Show:

- Portfolio tabs
- Composition table
- Allocation charts
- NAV and P&L
- Date controls
- Valuation summary
- Related orders

Actions:

- Switch portfolio without leaving the module.
- Change valuation date.
- Recalculate when permitted.
- Open positions, transactions and linked records.

### 25.3 Prices and Instrument Master

Show:

- Instrument categories
- Active status
- API mappings
- Price source and validation state
- Validation queue

Actions:

- Create or update instruments.
- Configure instrument types.
- Import or enter prices.
- Review, approve or reject prices.
- Review stale and conflicting prices.

### 25.4 Stock Picker / New Order

Show:

- Portfolio and Instrument Master selectors
- Side and order type
- Quantity and conditional price fields
- Broker, custodian and settlement controls
- Trade and settlement currencies
- Value date
- Notes and documents
- Approval route
- Gross consideration, fees, taxes and settlement amount
- Cash, exposure and post-trade weight impact
- Compliance results

Actions:

- Preview.
- Save Draft.
- Submit for Approval.
- Cancel.

### 25.5 Orderbook

Show:

- Status tabs
- Dense sortable and paginated order table
- Approval and routing state

Actions:

- Search and filter.
- Open an order.
- Create a new order or blotter.
- Continue permitted lifecycle actions.

### 25.6 Trading

Show:

- Portfolio controls
- Filters
- Position table
- NAV
- Securities value
- Checked cash
- Pending cash

Actions:

- Select a portfolio.
- Filter trading and position data.
- Create or continue orders.
- Monitor available and pending cash.

### 25.7 Trade Blotter

Show:

- Executed and pending trades
- Confirmation, settlement, accounting and custody statuses

Actions:

- Open trade details.
- Monitor and update permitted operational states.
- Open linked confirmations and settlement documents.

### 25.8 Compliance

Show:

- Rule results
- Outcome status
- Breach details
- Current and projected values
- Override history

Actions:

- Approve or reject when permitted.
- Request or grant an override.
- Capture reason and supporting document.

### 25.9 Simulation

Show pre-trade:

- NAV impact
- P&L impact
- Exposure impact
- Cash impact
- Compliance impact
- Fees and taxes

Actions:

- Configure a hypothetical trade or rebalance.
- Run simulation.
- Review impact.

### 25.10 Models

Show:

- Target weights
- Live weights
- Drift
- Rebalance recommendations

Actions:

- Create and edit models.
- Compare a portfolio with a model.
- Generate rebalance recommendations.

### 25.11 Reconciliation

Show:

- Reconciliation type tabs
- Batch status
- Internal and external values
- Difference
- Exception state
- Evidence

Actions:

- Run reconciliation.
- Upload external records.
- Investigate, resolve, escalate or write off based on permission.

### 25.12 Valuation

Show:

- NAV and P&L runs
- Inputs and methodology
- Approved price and FX references
- Exceptions

Actions:

- Run valuation.
- Review results.
- Resolve or override exceptions when authorised.

### 25.13 Accounting

Show:

- Events
- Balanced journal lines
- Posting state
- Reversal history

Actions:

- Review and post events.
- Export journals.
- Reverse a posted journal when authorised.

### 25.14 Reporting

Actions:

- Select report type and parameters.
- Generate asynchronously where appropriate.
- Download in supported formats.

### 25.15 Documentation

Actions:

- Upload a real file.
- Assign document type and portfolio.
- Link a trade where applicable.
- Manage approval, version and access.
- Open audit history.

### 25.16 Setup

Show:

- Price API health
- Reference-data tabs
- System defaults

Actions:

- Create and manage reference data.
- Configure pricing, valuation, settlement and accounting defaults.
- Configure four-eye approval.

## 26. Acceptance criteria

The redesign and implementation are complete only when:

- Users can create and manage multiple portfolios.
- Users can configure instruments, markets, currencies, issuers, brokers and custodians.
- Prices can be ingested from at least one automated source and one manual upload method.
- Holdings, market value, NAV, realized P&L and unrealized P&L are calculated.
- Orders can move through creation, approval, execution and settlement.
- Orderbook, Trade Blotter and Trading behave like institutional operations screens.
- Dashboard shows portfolio summaries, asset allocation, currency exposure and funds.
- Compliance runs before trade approval.
- Compliance exceptions are permanently audit-logged.
- Trades generate balanced accounting events.
- Reconciliation supports external files.
- Critical actions are permission-controlled and audit-logged.
- The UI follows the Appendix A dark, professional hedge-fund terminal direction.

## 27. Appendix A visual references

### Figure A.1 — Orders

- Open blotters
- Orderbook
- Dark financial table
- Active tabs
- New Blotter action
- Pagination

### Figure A.2 — Dashboard

- Portfolio summary
- Asset allocation
- Currency exposure
- Funds overview

### Figure A.3 — Portfolio Overview

- Selected portfolio tab
- Composition table
- Allocation charts
- Related orders

### Figure A.4 — Portfolio Overview

- NAV
- P&L
- Date controls
- Valuation summary
- Orders table

### Figure A.5 — Portfolio Setup

- Price API
- Settings
- Corporate actions
- Tag names
- Coupon frequency
- System icons

### Figure A.6 — Instrument Types

- Category pills
- Active instrument status badges
- API-filter mapping

### Figure A.7 — Trading

- Filters
- Portfolio controls
- Position table
- NAV
- Securities value
- Checked cash
- Pending cash

## 28. Project implementation guardrails

The following constraints come from Arcus workspace rules and frontend integrity practices. They supplement the SRD and are not additional requirements stated in the source PDF.

- Do not introduce mock values as live financial truth.
- Do not fabricate bid, ask, volume, fee or compliance values.
- Show honest loading, empty, unavailable and error states.
- Keep the selected portfolio visible and stable across actions.
- Use server pagination, filtering and sorting for large tables.
- Keep critical controls permission-aware.
- Require confirmation and a reason for destructive or exceptional actions.
- Surface audit-relevant state changes in the UI.
- Preserve links between instruments, orders, trades, valuations, accounting entries and documents.
- Follow Arcus pill-button styling for actions and button-like controls.
- Keep cards, tables and charts dense but readable.
- Light mode must remain usable; avoid hardcoded dark-only colors where tokens exist.

