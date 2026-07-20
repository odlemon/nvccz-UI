# ARCUS Investor & Limited Partner Portal
## Detailed Developer Software Requirements Document

| Field | Value |
|---|---|
| Document Type | Developer Software Requirements Document |
| Module | Investor & Limited Partner Portal |
| System Area | Investment Management ERP |
| Audience | Backend, frontend, QA, product design and technical project teams |
| Design Direction | White-background, institutional, high-density interface optimised for 13.5-inch laptop screens |
| Status | Detailed functional specification for design and development |
| Date | July 2026 |

**Development principle:** The portal presents approved, investor-scoped financial records. It does not replace Portfolio Management, Stock Picker, Accounting, Client Accounts, Valuation or Reporting.

---

## Document Control

| Field | Requirement |
|---|---|
| Document name | Arcus Investor & Limited Partner Portal - Detailed SRD |
| Primary operating models | Private-capital funds and open-ended / NAV-based funds |
| Primary portal users | Investors, authorised signatories and institutional investor administrators |
| Internal users | Investor relations, fund operations, compliance, accounting and portal administrators |
| Security classification | Confidential investor financial information |
| Design standard | White and light-grey surfaces, strong blue actions, compact tables and contextual side drawers |
| Core control | Every value and document must be filtered by active investor-to-fund entitlement |

---

## 1. Purpose of This Document

This document defines the functional, calculation, workflow, security, data and user-interface requirements for the Arcus Investor & Limited Partner Portal. The portal gives investors a secure workspace through which they can view investments, analyse performance, reconcile investor account activity, receive statements and notices, submit requests and communicate with the investment manager.

The system must support both closed-end private-capital structures and open-ended, unitised or NAV-based investment vehicles. These structures must share a common portal shell while preserving their different accounting, transactional and investor-reporting logic.

## 2. Core Product Philosophy

The portal is the investor-facing operating layer of the investment management system. It is **not** merely a document repository and it is **not** an independent accounting engine.

**Investor questions the portal must answer:**
1. What have I invested?
2. What is my current position?
3. How has my investment performed?
4. What money has moved in or out?
5. What action does the fund require from me?
6. What information has the fund shared with me?

**System relationship (data flow):**

```
PORTFOLIO MANAGEMENT / STOCK PICKER / ACCOUNTING / CLIENT ACCOUNTS / REPORTING
                              |
                              v
                INVESTOR-SCOPED APPROVED DATA
                              |
                              v
                     INVESTOR & LP PORTAL
```

Portfolio valuation, investment accounting, securities positions and report generation remain owned by their source modules. The portal consumes approved snapshots and displays only records authorised for the logged-in investor.

## 3. Mandatory Separation of Fund Operating Models

Each fund must carry an operating-model classification. The portal uses this classification to select the correct terminology, screens, widgets, formulas and workflows.

| Operating Model | Used For | Primary Investor Concepts |
|---|---|---|
| PRIVATE_CAPITAL | VC funds, PE funds, closed-end partnerships | Commitment, called capital, paid-in capital, unfunded commitment, distributions, NAV |
| OPEN_ENDED | Hedge funds, securities funds and unitised NAV vehicles | Subscription, units, NAV per unit, investor NAV, redemption, income distribution, fees |

### 3.1 Private Capital Mode — Lifecycle

```
LP COMMITS CAPITAL
        |
        v
FUND ISSUES CAPITAL CALL
        |
        v
LP FUNDS CALL -> PAID-IN CAPITAL
        |
        v
FUND INVESTS -> PORTFOLIO VALUE CHANGES
        |
        v
DISTRIBUTIONS -> IRR / DPI / RVPI / TVPI UPDATED
```

### 3.2 Open-Ended Fund Mode — Lifecycle

```
INVESTOR SUBSCRIBES
        |
        v
FUNDS RECEIVED -> DEALING DATE -> NAV FINALISED
        |
        v
UNITS ALLOCATED
        |
        v
ACCOUNT VALUE CHANGES WITH NAV
        |
        v
REDEMPTION REQUEST -> UNITS CANCELLED -> SETTLEMENT
```

> **Guardrail:** Do not show commitment, DPI or TVPI concepts to an open-ended fund unless explicitly configured. Do not show unit-accounting concepts to a traditional closed-end fund unless that structure uses unit accounting.

## 4. Fund Context Engine

After authentication, the portal must resolve the investor organisation, active user relationship, authorised investor accounts and available funds. The **selected fund context controls the visible widgets and navigation** — this is the mechanism by which one codebase serves both operating models.

| Selected Fund | Operating Model | Required Dashboard Metrics |
|---|---|---|
| Arcus Growth Fund I | PRIVATE_CAPITAL | Commitment, paid-in, unfunded, distributions, NAV, IRR, TVPI, DPI and RVPI |
| Arcus Equity Opportunities Fund | OPEN_ENDED | Account value, units held, NAV per unit, subscriptions, redemptions and investor return |

> **Architectural rule:** Develop one configurable portal application. Do not hard-code separate frontend applications for different fund structures.

## 5. Primary User Roles

| Role | Core Permissions | Restrictions |
|---|---|---|
| Investor Viewer | View authorised investments, performance, activity, statements, documents and notices | No transaction submission, bank changes or colleague administration |
| Investor Authorised Signatory | Viewer rights plus acknowledgements, subscription/redemption submissions and service requests | Cannot approve internal fund records |
| Institutional Investor Administrator | Invite, suspend and role-manage colleagues within the organisation | Cannot grant access outside organisation fund entitlements |
| Investor Relations / Fund Operations | Manage portal profiles, notices, shared documents and investor requests | Financial access must be separately permissioned |
| Fund Operations Approver | Approve capital activity, subscription/redemption processing and statement publication | Maker-checker controls apply |
| Compliance User | Review KYC, restrictions and audit trails | Cannot alter posted investment accounting records |
| Portal Administrator | Configure authentication, security and platform settings | Does not automatically receive economic access to all investor accounts |

---

## 6. Navigation Structure

This section defines exactly how the portal's left-hand navigation is organised, and is the backbone that Appendix A's mockups implement.

**Base navigation (always present, for every investor regardless of operating model):**

```
Investor Portal
 |- Dashboard
 |- My Investments
 |- Performance
 |- Account Activity
 |- Statements & Reports
 |- Documents
 |- Requests
 |- Messages
 |- Notices
 |- My Organisation
 `- Settings
```

**"My Investments" expands differently depending on the operating model of the fund currently in context:**

### 6.1 Private-Capital Additions (sub-navigation under My Investments)
```
My Investments
 |- Fund Overview
 |- Commitment
 |- Capital Calls
 |- Distributions
 `- Capital Account
```

### 6.2 Open-Ended Additions (sub-navigation under My Investments)
```
My Investments
 |- Fund Overview
 |- Investor Account
 |- Subscriptions
 |- Redemptions
 `- Account Holdings
```

**Implementation note:** the navigation shell (the outer list in 6) is a single, shared component. Only the "My Investments" sub-tree changes shape, and it changes based on the operating-model flag resolved by the Fund Context Engine (Section 4) — not based on separate routes or separate builds. An investor holding both a private-capital fund and an open-ended fund (as shown in the mockups) sees a consolidated dashboard, but drilling into a specific fund switches the sub-navigation to match that fund's model.

---

## 7. Dashboard

The dashboard must answer: **what is my position and what requires my attention?** Every metric must be investor-scoped and carry an as-of date and valuation status.

### 7.1 Private-Capital Dashboard

| KPI | Example |
|---|---|
| Total Commitment | US$5,000,000 |
| Paid-In Capital | US$3,750,000 |
| Unfunded Commitment | US$1,250,000 |
| Total Distributions | US$1,820,000 |
| Current NAV | US$4,420,000 |
| Net IRR / TVPI / DPI | 18.4% / 1.66x / 0.49x |

### 7.2 Open-Ended Dashboard

| KPI | Example |
|---|---|
| Current Account Value | US$2,845,390 |
| Units Held | 184,233.4821 |
| NAV Per Unit | US$15.4448 |
| YTD Return | +12.82% |
| Net Contributions / Redemptions | US$2,150,000 / US$350,000 |

Supported valuation statuses are **ESTIMATED, PROVISIONAL, FINAL** and **RESTATED**. Never show an unlabeled provisional value.

## 8. My Investments

This workspace presents every investment account available to the investor and distinguishes private-capital and open-ended structures.

| Fund | Structure | Investor Position | Current Value | Performance |
|---|---|---|---|---|
| Growth Fund I | Private Capital | US$5.0m Commitment | US$4.42m NAV | 18.4% Net IRR |
| Equity Opportunities Fund | Open-Ended | 184,233 Units | US$2.85m | +12.82% YTD |

Rules:
- Display only funds authorised through the investor-to-fund entitlement model.
- Display the operating model explicitly.
- Allow the user to drill into the fund workspace and investor account.
- Never display total fund assets as the investor account value unless the investor owns 100 percent of the fund.

## 9. Private-Capital Commitment Workspace

The commitment workspace must separate called capital, paid-in capital, outstanding calls and unfunded commitment.

| Measure | Example | Meaning |
|---|---|---|
| Total Commitment | US$5,000,000 | Investor contractual commitment |
| Called Capital | US$3,900,000 | Amount formally called to date |
| Paid-In Capital | US$3,750,000 | Cash contributions received and posted |
| Outstanding Call | US$150,000 | Called but not yet paid |
| Unfunded Commitment | US$1,100,000 | Commitment not yet called |

> **Formula:** Unfunded Commitment = Total Commitment − Called Capital. Do not calculate unfunded commitment using paid-in capital only.

## 10. Capital Calls

| Call No. | Issue Date | Due Date | Amount | Paid | Outstanding | Status |
|---|---|---|---|---|---|---|
| CC-012 | 01 Jun 2026 | 20 Jun 2026 | 250,000 | 250,000 | 0 | PAID |
| CC-013 | 01 Jul 2026 | 20 Jul 2026 | 150,000 | 0 | 150,000 | ISSUED |

- Statuses: DRAFT, ISSUED, ACKNOWLEDGED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED.
- Investor actions: view notice, download notice, acknowledge, submit payment confirmation.
- Portal acknowledgement is **not** confirmation of payment.
- The investor cannot change the capital-call amount or due date.

**Capital-call workflow:**

```
FUND OPERATIONS CREATES CALL
        v
MAKER-CHECKER APPROVAL
        v
STATUS = ISSUED -> PORTAL NOTIFICATION
        v
INVESTOR ACKNOWLEDGES / UPLOADS PAYMENT CONFIRMATION
        v
ACCOUNTING MATCHES CASH RECEIPT
        v
CALL STATUS UPDATED AND PORTAL REFRESHED
```

## 11. Distributions

| Reference | Date | Type | Gross | Adjustments | Net Paid |
|---|---|---|---|---|---|
| DIST-008 | 20 Mar 2026 | Exit Proceeds | 500,000 | 10,000 | 490,000 |

- Supported types: return of capital, realisation proceeds, dividend, interest, income, other.
- The detail drawer must display fund, reference, gross amount, adjustments, net amount, date, currency, masked bank destination and supporting document.
- Bank account numbers must be masked.

## 12. Investor Capital Account

| Date | Transaction | Reference | Money Invested | Money Returned | Balance |
|---|---|---|---|---|---|
| 01 Jan | Opening Balance | OPEN-2026 | – | – | 3,420,000 |
| 15 Feb | Capital Contribution | CC-011 | 500,000 | – | 3,920,000 |
| 20 Mar | Distribution | DIST-008 | – | 490,000 | 3,430,000 |

The portal may use plain-language columns while retaining the underlying journal and transaction references for audit and reconciliation.

## 13. Subscriptions

**Workflow:**

```
INVESTOR CREATES SUBSCRIPTION
        v
SUBMITTED -> KYC / COMPLIANCE REVIEW
        v
BANK DETAILS VALIDATED -> FUNDS RECEIVED
        v
DEALING DATE ASSIGNED -> NAV FINALISED
        v
UNITS ALLOCATED -> INVESTOR STATEMENT UPDATED
```

- Statuses: DRAFT, SUBMITTED, COMPLIANCE_REVIEW, AWAITING_FUNDS, FUNDS_RECEIVED, AWAITING_NAV, ALLOCATED, REJECTED, CANCELLED.
- Inputs: fund, share class, amount, currency, expected funding date, source bank account, documents, investor notes.
- Final units are published only after authoritative NAV approval.

> **Unit formula:** Units Allocated = Net Subscription Amount / NAV Per Unit. Fees and charges must be applied according to the approved share-class rules.

## 14. Redemptions

- Support redemption by amount, by units, and full redemption.
- Show current units, estimated account value and units available to redeem.
- Label all pre-dealing values as estimates subject to the final dealing NAV.
- Validate notice period, dealing calendar, minimum balance, available units, compliance restrictions and required documents.

### 14.1 Redemption Validation

| Validation | Required Behaviour |
|---|---|
| Active investor account | Block request when the account is inactive or restricted |
| Notice period | Show the earliest eligible dealing date and require confirmation |
| Available position | Requested amount or units cannot exceed the available position |
| Minimum balance | Prevent residual holdings below the configured minimum unless full redemption |
| Compliance / legal hold | Block submission and route the issue to the responsible team |

## 15. Investor Account Holdings

| Share Class | Units | NAV Per Unit | Market Value | Allocation |
|---|---|---|---|---|
| Class A USD | 184,233.4821 | 15.4448 | 2,845,390 | 100% |

> **Multi-class formula:** Investor Value = Σ(Units by Class × NAV per Unit by Class). Never aggregate share classes before applying their respective NAVs.

## 16. Performance Workspace

### 16.1 Private-Capital Measures

| Metric | Formula / Basis |
|---|---|
| DPI | Cumulative Distributions / Paid-In Capital |
| RVPI | Residual NAV / Paid-In Capital |
| TVPI | (Cumulative Distributions + Residual NAV) / Paid-In Capital |
| Net IRR | Dated investor cash flows with ending NAV as terminal value |

### 16.2 Open-Ended Measures

- Display 1-month, 3-month, YTD, 1-year and since-inception returns.
- NAV return = Ending NAV per Unit / Beginning NAV per Unit − 1.
- Where distributions occur, use the fund-approved total-return methodology.
- The browser must not independently invent reinvestment assumptions.

### 16.3 Calculation Snapshots

- The portal reads approved backend calculation snapshots.
- Required metadata: calculation date, as-of date, version, source module, valuation status, approver.
- Historic statements must continue to display historic approved figures after later valuations change.

## 17. Account Activity

Account Activity is the consolidated investor ledger for contributions, distributions, subscriptions, redemptions, fees, taxes, income, unit allocations and adjustments.

| Required Field | Description |
|---|---|
| Transaction Date / Effective Date | Both dates must be retained where settlement and accounting dates differ |
| Transaction Type | Approved type from the controlled transaction dictionary |
| Fund / Reference | Public fund and transaction reference |
| Original Currency / Amount | Unmodified transaction amount |
| Reporting Amount / Exchange Rate | Historical conversion used for investor reporting |
| Status / Document | Posting state and linked evidence |

## 18. Multi-Currency Logic

The platform must distinguish transaction currency, fund base currency, investor reporting currency and temporary display currency.

| Currency Concept | Example |
|---|---|
| Transaction Currency | ZAR |
| Fund Base Currency | USD |
| Investor Reporting Currency | GBP |
| Current Display Currency | USD |

- Preserve the original amount and currency.
- Preserve the historical fund-base conversion rate and date.
- Do not overwrite historical FX rates.
- Changing display currency must not change accounting records.

## 19. Statements & Reports

| Private-Capital Reports | Open-Ended Reports |
|---|---|
| Capital account statement | Monthly investor statement |
| Quarterly investor report | Quarterly investor statement |
| Capital call statement | Transaction statement |
| Distribution statement | NAV statement |
| Schedule of Investments | Subscription / redemption confirmation |
| Fund annual report | Fee and tax statement |

- Filters: fund, statement type, year, period, status.
- Statuses: PUBLISHED, SUPERSEDED, RESTATED, WITHDRAWN.
- Superseded and restated statements remain visible with clear version labels.

## 20. Secure Document Centre

- Categories: statements, capital calls, distributions, fund reports, financial statements, tax, legal, governance, notices, subscription documents, redemption documents, other.
- Metadata: document name, fund, category, period, published date, version, status, access scope, checksum.
- Every view and download writes an audit event.
- The document preview drawer must show details, permissions and download history.

## 21. Investor Requests

Investor Requests is a controlled service-management workspace, **not** an unstructured email substitute.

| Request Type | Examples |
|---|---|
| Account / Statement | Statement query, account query, tax document request |
| Capital Activity | Capital-call query, distribution query |
| Open-Ended Activity | Subscription request, redemption request |
| Profile / Access | Bank-detail change, access request, document request |

**Workflow:**

```
INVESTOR SUBMITS REQUEST
        v
REFERENCE CREATED -> ROUTING RULE SELECTS TEAM
        v
ASSIGNED -> UNDER REVIEW
        v
AWAITING INVESTOR / AWAITING INTERNAL
        v
RESOLVED -> CLOSED
```

## 22. Secure Messages

- Use thread-based communication linked to a fund, capital call, distribution, subscription, redemption, statement, request or document.
- Preserve sender, recipients, timestamp, message body, attachments, linked record and read status.
- Messages form part of the auditable investor-service record.
- Do not implement the workspace as a generic social chat.

## 23. Notices and Announcements

- Notices may target all investors, a fund, a share class, a specific investor, or an investor organisation.
- Examples: report available, AGM notice, valuation update, redemption suspension, capital call and distribution completion.
- Track published, delivered, opened and acknowledged states where acknowledgement is required.

## 24. My Organisation

| User | Role | Funds | MFA | Status |
|---|---|---|---|---|
| Tawanda Moyo | Investor Admin | 3 | Enabled | Active |
| Rudo Maposa | Viewer | 2 | Enabled | Active |
| Nyasha Chikore | Signatory | 1 | Enabled | Active |

> **Validation rule:** requested fund access must be a subset of the organisation fund entitlement.

## 25. Bank Instruction Controls

```
INVESTOR REQUESTS BANK CHANGE
        v
OLD DETAILS REMAIN ACTIVE
        v
MFA CHALLENGE -> REQUEST SUBMITTED
        v
COMPLIANCE / FUND OPS VERIFICATION
        v
OPTIONAL CALLBACK VERIFICATION
        v
APPROVAL -> NEW DETAILS ACTIVATED -> OLD DETAILS ARCHIVED
```

- Bank changes must never become active immediately after editing.
- Mask full bank account numbers after submission.
- Statuses: DRAFT, SUBMITTED, UNDER_VERIFICATION, APPROVED, REJECTED, ACTIVATED.

## 26. System Data Ownership

| Data | Authoritative Module |
|---|---|
| VC/PE funds, portfolio companies and valuations | Portfolio Management |
| Securities positions, prices and fund NAV inputs | Stock Picker / Valuation |
| Investor cash ledger, subscriptions and redemptions | Client Accounts / Accounting |
| Capital calls and distributions | Portfolio Management / Fund Operations / Accounting |
| Approved statements and reports | Reporting |
| Portal access, requests, messages and preferences | Investor Portal |

> The Investor Portal must not become a shadow accounting system.

## 27. Core Data Model

Recommended entities:

```
investor_organisations
investor_portal_users
investor_user_organisation_relations
investor_fund_entitlements
investor_accounts
investor_commitment_snapshots
investor_position_snapshots
investor_performance_snapshots
investor_transaction_views
investor_portal_documents
investor_document_entitlements
investor_requests
investor_request_messages
investor_messages
investor_notices
investor_notice_recipients
investor_acknowledgements
investor_bank_change_requests
investor_portal_sessions
investor_portal_audit_events
```

## 28. Snapshot Architecture

Investor balances and performance must be served from immutable, approved snapshots. Historic statements cannot be recalculated using current valuations.

| Snapshot Field Group | Examples |
|---|---|
| Identity | snapshot_id, investor_account_id, fund_id, as_of_date, calculation_version |
| Private Capital | paid_in_capital, distributions, residual_nav, net_irr, dpi, rvpi, tvpi |
| Open-Ended | units_held, nav_per_unit, investor_nav, MTD/YTD/since-inception return |
| Controls | valuation_status, approved_at, approved_by, source-system reference |

## 29. API Requirements

```
GET  /api/v1/investor/dashboard
GET  /api/v1/investor/investments
GET  /api/v1/investor/funds/{fundRef}
GET  /api/v1/investor/accounts/{accountRef}
GET  /api/v1/investor/account-activity
GET  /api/v1/investor/performance
GET  /api/v1/investor/capital-calls
POST /api/v1/investor/capital-calls/{reference}/acknowledge
GET  /api/v1/investor/distributions
GET  /api/v1/investor/subscriptions
POST /api/v1/investor/subscriptions
GET  /api/v1/investor/redemptions
POST /api/v1/investor/redemptions
GET  /api/v1/investor/statements
GET  /api/v1/investor/documents
GET  /api/v1/investor/requests
POST /api/v1/investor/requests
GET  /api/v1/investor/messages
POST /api/v1/investor/messages
GET  /api/v1/investor/notices
```

> Externally exposed URLs must use public references rather than sequential database IDs. The server must resolve each public reference through the authenticated entitlement chain.

## 30. Security Architecture

```
AUTHENTICATED USER
        v
INVESTOR ORGANISATION
        v
ACTIVE USER RELATIONSHIP
        v
FUND ENTITLEMENT
        v
INVESTOR ACCOUNT
        v
REQUESTED RESOURCE
        v
ALLOW OR GENERIC 404
```

- Every query must filter through the investor relationship and active entitlement.
- Do not trust fund identifiers supplied by the frontend.
- Use generic not-found responses where necessary to avoid disclosing other investors' records.
- MFA is mandatory for signatories, administrators and bank-detail changes.

## 31. Immediate Revocation

```
USER OR ENTITLEMENT SUSPENDED
        v
SESSION REVOCATION EVENT
        v
REFRESH TOKENS INVALIDATED
        v
PORTAL ACCESS CACHE PURGED
        v
ACTIVE CLIENT SESSION TERMINATED
        v
LOGIN REQUIRED
```

Target revocation propagation: 60 seconds or less, with near-immediate revocation for high-risk security actions.

## 32. Audit Events

| Category | Events |
|---|---|
| Authentication | LOGIN_SUCCESS, LOGIN_FAILED, MFA_CHALLENGE_SUCCESS, MFA_CHALLENGE_FAILED |
| Financial Views | FUND_VIEWED, ACCOUNT_VIEWED, TRANSACTION_VIEWED |
| Documents | DOCUMENT_VIEWED, DOCUMENT_DOWNLOADED |
| Capital Activity | CAPITAL_CALL_ACKNOWLEDGED, SUBSCRIPTION_SUBMITTED, REDEMPTION_SUBMITTED |
| Service | REQUEST_CREATED, MESSAGE_SENT, NOTICE_ACKNOWLEDGED |
| Administration | USER_INVITED, USER_SUSPENDED, BANK_CHANGE_REQUESTED |

Audit records are append-only and must not be deleted by normal application users.

---

## 33. UI Design Direction

| Design Element | Requirement |
|---|---|
| Background | White and very light grey workspace surfaces |
| Primary Actions | Arcus blue with restrained cyan accents |
| Cards | Compact rounded cards with subtle borders and minimal shadow |
| Tables | High-density, sticky headers, clear status chips and contextual detail drawers |
| Screen Fit | Optimised for 13.5-inch laptops without oversized decorative cards |
| Financial Data | Tables receive more space than decorative charts |

| Colour | Meaning |
|---|---|
| Green | Completed, paid or approved |
| Blue | Active or submitted |
| Amber | Due or awaiting action |
| Red | Overdue, rejected or critical |
| Purple | Under review |

## 34. Private-Capital Dashboard Wireframe

```
+--------------------------------------------------------------+
| Growth Fund I                              As of 30 Jun 2026 |
| Investor: Tawanda Institutional Trust                        |
+--------------------------------------------------------------+
| Commitment | Paid-In | Unfunded | Distributed | Current NAV  |
| $5.00m     | $3.75m  | $1.25m   | $1.82m       | $4.42m       |
+--------------------------------------------------------------+
| Net IRR 18.4% | TVPI 1.66x | DPI 0.49x | RVPI 1.18x           |
+------------------------------+-------------------------------+
| Investment Value             | Capital Position               |
| LINE CHART                   | DONUT                          |
+------------------------------+-------------------------------+
| Recent Capital Activity      | Actions Required                |
+------------------------------+-------------------------------+
```

## 35. Open-Ended Fund Dashboard Wireframe

```
+--------------------------------------------------------------+
| Equity Opportunities Fund                  As of 30 Jun 2026 |
| Class A USD                                                  |
+--------------------------------------------------------------+
| Account Value | Units Held | NAV/Unit | YTD Return | Cash    |
| $2.845m        | 184,233    | $15.4448 | +12.82%    | $0      |
+--------------------------------------------------------------+
| ACCOUNT VALUE LINE CHART                                      |
+------------------------------+-------------------------------+
| Recent Activity               | Pending Requests               |
| Subscription $500k            | Redemption RDM-016              |
| NAV Adjustment                 | Under Review                    |
+--------------------------------------------------------------+
| [ New Subscription ]     [ Request Redemption ]              |
+--------------------------------------------------------------+
```

---

## 36. Critical User Stories and Acceptance Criteria

**Consolidated Investment View**
As an institutional investor, I want to see all authorised funds so that I understand our total relationship.
- Display only entitled funds.
- Identify the operating model.
- Display investor-specific value and the correct performance metric.
- Allow fund drill-down.

**Capital Call Management**
As a private-equity LP, I want to see outstanding capital calls and due dates so that I can meet funding obligations.
- Show call number, dates, amount, currency, paid amount, outstanding amount and status.
- Allow notice download, acknowledgement and payment-confirmation upload.

**Redemption Request**
As a hedge-fund investor, I want to request a partial redemption so that I can withdraw part of my investment.
- Show available units.
- Validate minimum balances and notice period.
- Calculate indicative units and label them as estimates.
- Route the request for review without changing the ledger.

**Statement Reconciliation**
As an investor finance officer, I want account activity and statements so that I can reconcile internal records.
- Support dates, transaction types, fund and currency filters.
- Provide transaction drill-down and permitted exports.

**Institutional Access**
As an investor administrator, I want to grant colleagues selected access so that our teams can perform their duties.
- Prevent access beyond organisation entitlements.
- Support suspension and access history.
- Do not permit assignment of portal-administrator rights.

## 37. Developer Guardrails

- Never show fund-wide LP data to an individual investor unless specifically authorised.
- Never calculate TVPI using committed capital instead of paid-in capital.
- Never treat called capital and paid-in capital as the same value.
- Never use current FX rates for historic transactions.
- Never recalculate published historic statements using current valuations.
- Never show provisional NAV without a valuation-status label.
- Never allow the portal to create portfolio valuations or execute securities trades.
- Never allow an investor to directly edit a posted transaction.
- Never activate changed bank instructions without verification and approval.
- Never accept a redemption above available units or below minimum residual-balance rules.
- Never confirm subscription units before funds and dealing NAV requirements are satisfied.
- Never display DPI, RVPI or TVPI for every fund regardless of operating model.
- Never expose a document or account by ID without validating the entitlement chain.
- Never use portal display calculations as authoritative accounting values.

## 38. Required QA Scenarios

- Investor A cannot access Investor B's statements, documents or account activity.
- An investor entitled to Fund A cannot access Fund B.
- Revoked sessions terminate within the defined propagation target.
- Historic FX conversions do not use the current live rate.
- Private-capital multiples match approved fund-accounting records.
- Subscription units match approved NAV calculations.
- Redemptions respect notice periods, available units and minimum balances.
- Capital-call acknowledgement does not mark a call as paid.
- Provisional and restated values are visibly labelled.
- Restatement does not delete the original statement.
- Document downloads and bank changes generate audit records.
- Organisation administrators cannot expand fund entitlements.
- All PRIVATE_CAPITAL and OPEN_ENDED screens render correctly.

## 39. Final Product Definition

The completed Arcus Investor & Limited Partner Portal must operate as a secure investor-servicing platform connected to the investment management operating system.

```
PRIVATE CAPITAL
Commitment -> Capital Call -> Paid-In Capital -> Fund Value
                                  -> Distributions -> IRR / TVPI / DPI / RVPI

OPEN-ENDED
Subscription -> Unit Allocation -> NAV -> Investor Account Value
                                              -> Performance -> Redemption
```

The portal must always enable the investor to understand what was invested, what remains due, what is currently owned, what has been returned, how the investment has performed and what action is required.

**Final architectural principle:** The Investor Portal presents approved investor-scoped records. It does not replace Portfolio Management, Stock Picker, Accounting, Client Accounts, Valuation or Reporting.

---

## Appendix A: UI Mockups — Screen-by-Screen Breakdown

**Developer instruction (from source document):** Reproduce the information hierarchy, compact density, statuses, drawers and workflow controls using reusable Arcus components and real system data.

The mockups show a single logged-in investor ("Jane Smith", Arcus Capital Partners LP) who holds **both** a private-capital fund and an open-ended fund, which is why the Dashboard screen (A.1) shows both types of KPI blocks side by side — this is the "mixed portfolio" case the Fund Context Engine (Section 4) and the Dashboard rules (Section 7) must support simultaneously, distinct from the single-fund wireframes in Sections 34–35 which show one operating model at a time.

All seven screens share the same page shell:
- **Left sidebar:** the full navigation tree from Section 6 (Dashboard, My Investments, Performance, Account Activity, Capital Calls, Distributions, Subscriptions & Redemptions, Statements & Reports, Documents, Requests, Messages, Notices, My Organisation, Settings), with a collapse control at the bottom.
- **Top bar:** global search ("Search funds, investments, documents..."), an "All Funds" fund-context selector, an "As of" date picker, a "VALUATION STATUS" badge (e.g. FINAL), a notifications bell with unread count, and the logged-in user's name/entity with an account menu.
- **Badge counts** on sidebar items (Requests, Messages, Notices) mirror unread/open counts in real time — these must be driven by live entitlement-filtered data, not static labels.

### A.1 — Consolidated Investor Dashboard
*Mixed private-capital and open-ended investor position with actions and recent documents.*

This is the landing screen after login. Layout, top to bottom:
1. **KPI strip (6 cards):** Total Commitment, Paid-In Capital, Unfunded Commitment, Current NAV, Distributions, Net IRR — this is the Section 7.1 private-capital KPI set, since the investor's largest/primary relationship in this mock is private-capital.
2. **Two side-by-side panels:**
   - *Investment Value History* — a line chart plotting NAV against Paid-In Capital over time ("Since Inception / 3Y / 1Y / YTD" toggles), reflecting Section 16.3's snapshot-driven performance history, with a "View Performance →" link into the Performance workspace.
   - *Open-Ended / Hedge Fund Account* — a compact card showing Account Value, Units Held and NAV Per Unit with its own small trend chart, plus "View Account Details →". This is where the Section 7.2 open-ended metric set surfaces on an otherwise private-capital-led dashboard, confirming the dashboard must render both KPI families concurrently for mixed-portfolio investors.
3. **Three side-by-side panels below that:**
   - *Capital Position* — a donut chart breaking Total Commitment into Paid-In Capital, Unfunded Commitment and Distributed, echoing the Section 9 commitment breakdown.
   - *Recent Capital Activity* — a running list of capital calls and distributions across funds, each row clickable, with a "View All Activity →" link into Account Activity (Section 17).
   - *Actions Required* — a prioritised list of open items needing investor action (e.g. a capital call due, a subscription document to review & sign, a KYC update), each with a due date and a link straight into the relevant workflow. This is the operational surface for everything flagged ISSUED/DUE/AWAITING in Sections 10, 13 and 21.
4. **Latest Documents & Notices** panel at the bottom, linking into the Document Centre (Section 20) and Notices (Section 23).

### A.2 — Capital Calls & Distributions
*Capital-call register, distribution ledger and contextual call-detail drawer.*

Two tabs at the top: **Capital Calls** and **Distributions** (this screen shows the Capital Calls tab active).
- A metrics strip: Outstanding Calls, Paid Calls, Upcoming Due Amount, Total Distributions, Upcoming Distribution Notices.
- The **Capital Calls table** implements Section 10 exactly: Call No., Fund, Issue Date, Due Date, Amount, Paid, Outstanding, Status (with colour-coded chips — green PAID, blue ISSUED, red OVERDUE, per Section 33's colour legend).
- Selecting a row (radio-button style) opens a **right-hand detail drawer** — "Selected Capital Call" — showing the call's status badge, issue/due dates (with days-remaining flagged in red when close), amount breakdown, an "Amount Due by [date]" callout, masked wiring instructions with a "View full details →" link, a visual timeline (Call Issued → Acknowledged → Payment Received → Call Closed) with the acknowledgement status, an **Acknowledge Call** button, and linked documents (call notice, subscription agreement, governing documents). This drawer is the concrete implementation of the capital-call workflow diagram in Section 10 and the "view notice / acknowledge / submit payment confirmation" actions.
- Below the calls table, the **Distributions table** implements Section 11: Distribution Ref, Fund, Type, Gross Amount, Adjustments, Net Paid, Payment Date, Document — with a document download icon per row and a "Download Statement" action.

### A.3 — Subscriptions & Redemptions
*Open-ended subscription and redemption forms, validation rules and request history.*

- A metrics strip: Account Value, Units Held, NAV per Unit, Available to Redeem, Pending Subscriptions, Pending Redemptions.
- Two side-by-side forms:
  - **New Subscription Request** — Fund, Share Class, Amount/Currency, Expected Funding Date, Source Bank Account, Supporting Documents upload — with a live **Allocation Estimate** panel showing estimated NAV per unit, estimated units, estimated fees and estimated total investment, explicitly labelled "Final allocation will be based on the NAV on the applicable dealing date and may differ." This directly implements the Section 13 unit formula and the rule that final units are only confirmed post-NAV.
  - **New Redemption Request** — a toggle between Amount / Units / Full Redemption, Requested Amount, and computed Estimated Units to be Cancelled / Estimated Settlement Amount, plus Notice Period, Earliest Dealing Date and Estimated Settlement Date, with a warning banner that estimates may vary. This implements Section 14's redemption rules — amount/units/full options, and all pre-dealing figures explicitly marked as estimates.
- A **Validation Rules** panel on the right shows Minimum Balance, Notice Period and Dealing Frequency rules in plain language, plus a live **Compliance Checks** list (Accredited Investor Verified, KYC Status: Approved, No Unsettled Capital Calls, No Legal Holds) — this is the UI expression of the Section 14.1 validation table; every check must reflect a real-time entitlement/compliance query, not a static checklist.
- Below the forms, a combined **Subscriptions & Redemptions History** table with filters (Type, Status) and a Download action, listing ID, Type, Fund, Share Class, Amount/Units, Status, Submitted On, Expected Settlement.

### A.4 — Performance
*Investor performance, private-capital multiples, open-ended metrics and benchmark comparison.*

- Filters: Fund/Account, Period, Benchmark, plus the persistent Valuation Status badge.
- A KPI strip of Net IRR, TVPI, DPI, RVPI, Current NAV, Paid-In Capital — the Section 16.1 private-capital measure set, each with an info icon for the underlying formula.
- A secondary strip for **Open-Ended / Hedge Fund Account Metrics** — YTD Return, NAV per Unit, Units Held, Account Value — the Section 16.2 open-ended measure set, shown alongside the private-capital metrics for this mixed-portfolio investor.
- **Performance History** chart (NAV, Cumulative Paid-In, Distributions over time with period toggles) next to a **Benchmark Comparison** bar chart (the investor's fund plotted against named benchmark indices) — implementing the requirement that performance be measured against approved methodology, not ad hoc.
- A **Capital Activity (Cash Flow)** waterfall/bar chart (Paid-In Capital, Capital Calls, Distributions, Current NAV) and a **Performance by Fund** table listing every fund with Structure, Net IRR, TVPI/Return, NAV/Account Value, Benchmark and As-Of date — giving the multi-fund comparison view implied by the Consolidated Investment View user story in Section 36.
- Footer notes on Performance Methodology and Valuation Notes, plus a Download Performance Report action — this is where the Section 16.3 snapshot metadata (methodology, valuation basis) must be surfaced to the investor for transparency.

### A.5 — Account Activity
*Consolidated transaction ledger, filters, export controls and transaction detail drawer.*

- A metrics strip: Contributions, Distributions, Subscriptions, Redemptions, Fees, Net Cash Flow — each clickable to filter the table below.
- A filter bar: Fund, Transaction Type, Date Range, Currency, Structure, Status, plus "More Filters" and "Clear All" — implementing the Section 17 requirement for a fully filterable consolidated ledger.
- The main table matches Section 17's field list: Transaction Date, Effective Date, Fund, Type, Reference, Currency, Original Amount, Reporting Amount, Exchange Rate, Status, Document — with Export CSV / Export Excel / Export PDF actions.
- Selecting a row opens a **Transaction Details** drawer: transaction type and status badge, both dates, fund, structure, investor, currency, original amount, reporting amount, exchange rate, posted date/by, linked documents (e.g. capital call notice, wire confirmation), an explicit "No FX required" indicator when applicable, and free-text notes. This drawer is where the Section 18 multi-currency rules (preserve original amount/currency, preserve historical FX rate, never overwrite it) become directly visible and auditable to the investor.

### A.6 — Document Centre
*Permissioned document register, preview, checksum details and download history.*

- Category filter chips across the top matching Section 20's category list (All Documents, Statements, Capital Calls, Distributions, Fund Reports, Tax, Legal, Governance, plus "More").
- A metrics strip: Total Documents, New This Week, Requires Signature, Secure Downloads (this year).
- The document table: Document Name, Fund, Category, Period, Published Date, Version, Access Scope, Status (chips: New, Requires Signature, Published, Active), and per-row actions (download, more).
- Selecting a document opens a **preview drawer** with a paginated document viewer (page count, zoom controls), a Details/Permissions tab set showing Document Type, Published Date, Version, File Size and **Checksum (SHA-256)** — implementing the Section 20 metadata requirement including checksum — and a **Download History** list showing who downloaded it, when, and from what IP address, which is the audit trail required by Section 20 and the DOCUMENT_VIEWED/DOCUMENT_DOWNLOADED events in Section 32.

### A.7 — Requests & Messages
*Service requests, secure conversation threads, attachments and new-request form.*

Two tabs: **Requests** and **Messages**.
- A metrics strip: Open Requests, Awaiting Investor, Under Review, Closed This Month.
- The **Requests table**: Reference, Request Type, Linked Fund, Subject, Submitted By, Last Updated, Status (chips matching the Section 21 workflow states: Under Review, Awaiting Investor, Assigned, Submitted, Resolved, Closed), Priority.
- A **Create New Request** panel on the right: Request Type, Linked Fund, Subject, Priority, Description, and a drag-and-drop attachment zone — this is the entry point into the Section 21 workflow (`INVESTOR SUBMITS REQUEST -> REFERENCE CREATED -> ROUTING RULE SELECTS TEAM -> ...`).
- Below the table, a **Messages** panel: a conversation list on the left (each thread showing subject and a preview, linked to a specific record such as "Capital Call #12 – Payment Applied"), and the active thread on the right showing sender avatars, timestamps, message bodies, attachments (e.g. a remittance confirmation PDF) and participant list. This implements Section 22's requirement that messages be thread-based, linked to a specific fund/record, and retained as part of the auditable service record — not a generic chat.
- The **Details** panel on the far right of the selected request shows Reference, Status, Priority, Linked To, Fund, Submitted By, Last Updated and Attachments — giving the investor full visibility into where their request sits in the routing/resolution workflow at all times.

---

## UI/Navigation Summary — How It All Connects

- **One shell, model-aware content:** every screen shares the same sidebar, top bar and card/table/drawer visual language (Section 33). What changes per fund is only the *content* of "My Investments," the KPI set on the Dashboard and Performance screens, and which formulas/labels are applied — never a separate app or separate route tree (Section 4, Section 6).
- **List → Drawer pattern:** every major register (Capital Calls, Distributions, Account Activity, Documents, Requests) follows the same interaction pattern — a dense table on the left/centre, a contextual detail drawer on the right that opens on row selection. This is consistent across A.2, A.5, A.6 and A.7.
- **Estimates are always explicitly labelled:** Subscriptions & Redemptions (A.3) and any pre-dealing NAV figures are visually flagged as estimates, per the Section 14/Section 37 guardrails.
- **Every action traces to a workflow diagram:** the Acknowledge Call button (A.2) maps to Section 10's workflow; the subscription/redemption forms (A.3) map to Sections 13/14; the Create New Request panel (A.7) maps to Section 21; bank-detail changes (referenced in My Organisation/Settings, Section 25) map to the bank-instruction-control workflow.
- **Audit is visible, not just logged:** Document Centre's Download History and Account Activity's transaction drawer surface the same audit trail that Section 32 requires be recorded on the backend — the UI is a window into the append-only audit log, not a separate record of it.
