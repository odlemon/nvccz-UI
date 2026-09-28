# Arcus Accounting Module: Authoritative Requirements (SRD sweep)

Derived 2026-09-27 from the accounting requirement documents only. No code was consulted or changed. Each requirement is tagged with its source doc and section so it can be traced back. Where documents disagree, both positions are recorded and the conflict is listed in §1.3 and §7. None of them are resolved here.

---

## 1. Source index

### 1.1 Documents

| Tag | Document (text extraction / original PDF) | Pages | Covers | Notes |
|---|---|---|---|---|
| **SRD2** | `SRD_2_0_Arcus_Accounting_Module_1.txt` / *SRD 2.0_ Arcus Accounting Module (1).pdf* | 12 | Main SRD. Double-entry principles, relational data model (12 tables), GL, AR (multi-currency, realized FX), AP, perpetual inventory, fixed assets, bank rec, user stories, UI/UX principles, Procurement/Payroll/Reporting integration, audit trail | **Primary SRD.** It uses **ZWL** as the example base currency. |
| **TECH** | `Arcus_supplementary_TECHNICAL_SRD_Accounting_Module_1.txt` / *Arcus supplementary TECHNICAL SRD Accounting Module (1).pdf* (Oct 2025) | 28 | **Part A** §1–6: primer, 3 core collections (COA, immutable `journal_entries`, `transactions`), USD/ZIG dual amounts, `syncRBZRate` daily job, realized FX, menu, invoice form, multi-currency input, FAM + `runDepreciationRun`, OPM `triggerDataSync`, Events. **Part B** ("Integration and Structure") §1–5: COA blueprint with IDs, FAM sub-ledger, Portfolio/Procurement/Events flows with Dr/Cr, GL viewer, payroll posting. Also a Glossary. | Technical authority on journal structure, jobs and cross-module postings. It is Firestore/Cloud-Function flavoured. Its account codes conflict with COA (see §1.3). |
| **SUPP3** | `Supplementary_accounting_3.txt` / *Supplementary accounting (3).pdf* (Nov 2025) | 31 | Sub-ledger vs JE vs GL, TB integrity, bank rec frequency, IS/BS/CFS/Statement of Equity derivation, worked Cashbook→TB→IS/CFS/BS examples, immutability & data-model advice | Teaching and worked examples. Authoritative for **financial-statement derivation rules**. |
| **CORE** | `core_accounting.txt` / *core accounting.pdf* (Oct 2025) | 25 | Endpoint-level test guide: 14 phases, about 98 curl tests (currencies, COA, customers, vendors, expense categories/expenses, invoices, JEs, IS/CFS, dashboard, inventory, assets, multi-currency, credit notes, statements, bank rec, TB) | Describes the **as-built backend API** (`/api/accounting/*`). Treat it as an acceptance baseline for existing endpoints, not as a business spec. |
| **STI** | `Accounting_Short_Term_Investment_Tracking_SRD.txt` / *Accounting Short-Term Investment Tracking SRD.pdf* (Apr 2026) | 10 | STI SRD §1–5 (instrument setup, daily accrual engine, JE automation, liquidation, audit, scalability, CFO dashboard) plus **STI UAT script Suites 01–08** (setup, accrual, JE, maturity, dashboard, negative yield, FX revaluation, stress) | **Sole authority for short-term investments.** |
| **CBN** | `Arcus_Cashbook_SRD_Narrative.txt` / *Arcus_Cashbook_SRD_Narrative.pdf* (Oct 2025) | 2 | Narrative restatement of CB | Same content as CB. Two points are phrased differently: "reconciled = permanent and immutable", and "handles discounts automatically". |
| **CB** | `arcus_cashbook_SRD_1.txt` / *arcus_cashbook_SRD[1].pdf* | 18 | Cashbook §3.1–3.7 (entity model, GL legs, VOID, receipt/payment workflow, multi-line/VAT, tick-based bank rec, Pastel UX, user stories CB-001..007, module interaction) and §4.4–4.5 (GCS batch entry → batch post, discounts, reconciliation status N/R) | **Authoritative for Cashbook and tick-based bank reconciliation.** |
| **BF** | `arcus_bankfile_feature.txt` / *arcus_bankfile_feature.pdf* | 2 | Bank (bulk payment) CSV file: field order, configurable columns/delimiter/header, generate-per-pay-period UI, security | Written for **payroll** net-pay files. UIR 18 extends the bank-file concept to supplier payment runs. |
| **COA** | `arcus_charts_of_accounts.txt` / *arcus charts of accounts.pdf* (Nov 2025) | 9 | CoA blueprint: code ranges 1000–6999, each account with increase/decrease rule and Typical Balancing Account (TBA) | **Latest CoA numbering. Treat as authoritative for account codes.** It adds a 6000–6999 "Other Income & Expense" range. |
| **UATN** | `accounting_uats.txt` / *accounting-uats.pdf* (29 Mar 2026). Same content as nvccz `docs/accounting-uats.md` | 7 | Backend developer's notes against the client UAT list: bank setup API, per-UAT endpoint notes (UAT 7, 13, 25, 28, 33, 36, 50, 54, 56, 63, 75, 77, 79, 95), unrealized FX report, reconciliation-session API | **Not a full UAT script.** It references a numbered UAT list (up to at least #95) that is **not present in any provided source** (see §7). |
| **UIR** | `Arcus_Accounting_UI_Inspiration_and_Interaction_Reference.txt` / PDF (15 Jul 2026) | 22 | Design direction, locked palette ("no green"), and 18 concept screens: Command Centre, GL Explorer, JE Maker-Checker, Cash Book, Bank Rec Workbench, 3-Way Match, AR & Collections, Inventory, Fixed Assets, STI, Financial Reports builder, Month-End Close, Expenses & Claims, CoA Governance, Tax Return Pack, FX Revaluation, Consolidation, Supplier Payment Run | Lower priority per brief. The text extraction has captions only. **The screen images were inspected** (rendered pp. 5–22), and requirements read from the mock-ups are tagged `UIR-nn`. These are the **only source** for maker-checker, period lock/close checklist, budgets-vs-actual, claims, consolidation, payment runs and recon rules. |

Supplementary material found during the sweep. It is **not in the assigned input set** but was read and is cited where it fills a gap:

| Tag | Document | Pages | Why included |
|---|---|---|---|
| **UATV1** | *arcus_UAT_script_accounting V1.docx* (Downloads, Nov 2025) | – | The **actual client UAT script** (45 test cases with a Pass/Fail run log). accounting_uats.txt contains only notes, so this is the only source of numbered accounting acceptance criteria with expected results. |
| **TAX** | *Tax Return Pack Generation SRD.pdf* (Phase 2 §3.15, 10 Jun 2026) | 13 | Only source for ZIMRA CIT/CGT/WHT tax-pack rules, formulas and tax accrual posting. UIR 15 is its UI. |
| – | *cashbook.pdf* (Oct 2025, 10 pp.) | 10 | Implementation notes, not a requirements doc. Not used. |

### 1.2 Precedence where documents overlap (recommended reading order, not a resolution)

1. **Double-entry, journal structure, immutability**: TECH §2 + SRD2 Data Model. SUPP3 Resources §2 agrees.
2. **Account codes**: COA (latest, most complete) > TECH Part B §1 > SUPP3 > SRD2 ranges. Codes in UIR mock-ups are illustrative.
3. **Cashbook & tick reconciliation**: CB > CBN. UATN reconciliation-session API is the implemented shape.
4. **Bank reconciliation with imported statements / auto-match**: SRD2 §6 > UIR 05.
5. **Multi-currency / FX**: TECH §3 (ZIG base, RBZ sync) > SRD2 §2 (ZWL example). STI Suite 07 is authoritative for FX on investments.
6. **Short-term investments**: STI only (UIR 10 adds UI detail).
7. **Fixed assets**: TECH Part B §2 ("SL only initially") vs SRD2 / TECH A §5 (SL + reducing balance). **Conflict.**
8. **Acceptance**: UATV1 (business UAT) > UATN (endpoint notes) > CORE (endpoint smoke tests) > STI UAT (STI only).
9. **Governance / close / approvals / budgets / claims / consolidation / payment runs**: UIR only (plus TAX for tax packs).

### 1.3 Contradictions between documents (explicit)

| # | Topic | Positions |
|---|---|---|
| C1 | **Base currency** | SRD2: base e.g. **ZWL** (§Data Model 3, §2). TECH §2.2/§3.1 and UATV1 GL-2.4: base **ZIG** ("chosen during initial setup"). UIR 16 FX revaluation shows **functional currency USD**, with ZiG, ZAR and EUR revalued to USD. UIR headers show USD as the reporting selector. CORE/UATN seed **ZWL** "Zimbabwean Dollar" (code ZWL, symbol Z$). |
| C2 | **Currency set** | TECH: USD, ZIG, ZAR. CORE: USD, ZWL, EUR. UIR: USD, ZiG, ZAR, EUR. STI: any ("ZAR investment"). |
| C3 | **Bank account codes** | TECH B: 1010 Cash-USD, 1020 Cash-ZIG. SUPP3/CB: 1100 Bank. COA: 1100 Bank-ZIG, 1110 Bank-USD, 1120 ST deposits/T-bills, 1200 Petty cash. CORE: 1000 Cash. |
| C4 | **Debtors Control** | TECH A JSON: 1200 AR. TECH B: 1100 AR. SUPP3/COA/CB §3.2: 1300. CB §4.4.2: "e.g. GL 1200". CORE: 1200 = Inventory Asset. |
| C5 | **Creditors Control** | TECH: 2010 AP. SUPP3/COA/CB: 2000. |
| C6 | **VAT accounts** | TECH: 2100 VAT/Sales Tax Payable. COA: 2050 VAT Payable (single account). CB: 2100 VAT Output + 2110 VAT Input. **COA uses 2110 for Unearned Revenue.** UIR: 2250-000 VAT Control Payable, 1420 Input VAT. |
| C7 | **Net Wages Payable** | TECH §5 and UATV1 INT-5.4/5.5: **2250**. COA: **2200** ("2250 usually reserved for accrued interest/debt"). TECH B also uses **2200 = Event Accrual (Clearing)**. CB uses **2200 = Loan Payable**. |
| C8 | **Fixed asset / depreciation codes** | TECH B: 1400 Vehicles cost, 1450 AccDep-Vehicles, 1500 Computer Equip, 5900 Depreciation Exp. COA: 1520 Office Equip cost, 1550 AccDep, 5130 Dep Exp, **1500 = Investment in Portfolio Companies**. SUPP3: 1500 Investment in Equity (later "Equipment"), 1550, 5130. CB: 1250 Computer Equipment. UATV1: "12xx" fixed asset. COA 1400 = Prepaid Rent vs TECH 1150 Prepaid Expenses. |
| C9 | **Revenue / FX codes** | TECH: 4010 Mgmt Fee, 4020 Perf Fee, 4900 FX Gain/Loss (revenue). COA/SUPP3: 4001, 4002, 4050 Interest Income. CB: 4000 Sales, 4500 Interest Income. STI UAT 7.3: 6060 FX G/L, 1510 ST Investments. UIR 10: 1200/1210/1220 for STI. UIR 16: 8200 FX Gain/(Loss). |
| C10 | **Equity codes** | TECH B: 3100 Retained Earnings, **3200 Current Year Net Income**. COA: 3100 Retained Earnings, **3200 Drawings/Dividends (contra-equity)**. SUPP3: closes P&L straight into **3000 Owner's Equity**. |
| C11 | **Depreciation methods** | SRD2 §5 and TECH A §5.1: Straight-Line **and** Diminishing/Reducing Balance. TECH B §2: "**Only implement Straight-Line initially**". CORE: STRAIGHT_LINE. |
| C12 | **Depreciation start** | TECH A §5.1/B §2: purchaseDate starts depreciation. UIR 09: an exception is raised for an asset "missing **in-service date**", implying depreciation starts from the in-service date. |
| C13 | **Unrealized FX frequency** | TECH Glossary: "**Do not calculate this daily** … only during period-end reporting". STI §Final check: "revaluing the portfolio **daily or monthly**". STI UAT 7.2: month-end. |
| C14 | **Realized FX journal shape** | SRD2 §2: payments post Dr Bank / Cr Debtors at payment-rate base, then a **separate final JE** Dr Debtors Control / Cr FX Gain. TECH §3.2: a **single payment JE with a third line** (Dr Bank 340,000; Cr AR 320,000; Cr FX 20,000). |
| C15 | **Invoice status model** | SRD2: Draft, Unpaid, Partially Paid, Paid, Cancelled. TECH: DRAFT/POSTED. CORE: DRAFT→SENT→PAID, any→VOID. CB §3.7: "Open"→"Paid"/"Partially Paid". UIR 07: Overdue, Part-paid, Paid, Promise to pay. |
| C16 | **Correcting a posted invoice** | CORE Test 28: "**Any status invoice can be voided**". UATV1 AUD-6.1: after POSTED, "the **only** correction mechanism allowed must be a **Credit Note**". |
| C17 | **Cashbook posting timing** | SUPP3 §2.3 and CB §3.5 step 4: JE generated **instantly** on save. CB §4.4: two stages. Save batch (journalEntryId = null), then **Update/Post Batch** generates JEs. |
| C18 | **Cashbook line amount basis** | CB §3.2: line amount is **gross, inclusive of VAT**. CB §3.4: "user should only enter the Gross/**Excl-VAT** amount", with a user setting to default entry mode to Gross or Excl-VAT. |
| C19 | **Reconciled items: reversible?** | CB §4.5.1: R is "the final state. None" (no transition). CBN: "once reconciled, becomes permanent and immutable". UATV1 CB-3.5 step 1: "**Unreconcile** the transaction", which requires an unreconcile capability. |
| C20 | **Recon finalize tolerance** | CB §3.3.4: difference must be **exactly zero**. UATN session finish: fails only if outside **±0.01**. |
| C21 | **Bank rec method** | SRD2 §6: import statement lines + auto-match (date, amount, reference) + create JE from line. CB §3.3.4: tick system cashbook items against a paper statement, with no statement import. UIR 05 combines both (import, auto-match rules, exceptions, sign-off). |
| C22 | **Exchange rate entry on documents** | TECH §4.2: rate is **read-only**, pulled from `/config/exchange_rates` for the invoice date. UATN: "**remove exchange rate field** when creating invoice". UATV1 GL-2.4 step 3 has the user **enter** the rate. UATV1 GL-2.5 allows "fetch last valid rate **or** require user to manually input". |
| C23 | **Events accrual entry** | TECH A §6.2 table: Budget Approved = Dr Prepaid Expense / **Cr Accounts Payable (Accrual)**. TECH B §3.3: Dr 1150 Prepaid / **Cr 2200 Event Accrual**, with AP credited only when the vendor invoice arrives. |
| C24 | **Inventory costing** | CORE Test 49: COGS method **FIFO**. UIR 08: valuation method **Weighted Average**, with cost layers. SRD2: perpetual, uses `cost_of_purchase`, no method named. |
| C25 | **Payroll entry completeness** | TECH §5 final check: Dr 5010 = Cr 2150+2160+2250 (employee side only). COA: separate **5020 Employer Payroll Contributions** Dr / Cr 2160. TECH §5 step 4 pays Net Wages and PAYE from **1010 Cash-USD** only. |
| C26 | **COA / depreciation access** | TECH §2.1: COA Read/Write restricted to **SysAdmin and HR Manager**. TECH B §4.3: "Run Monthly Depreciation" visible only to **SysAdmin and HR Manager**. Finance roles (Accountant, Finance Manager, CFO) are not named for either. |
| C27 | **Palette** | UIR: "**No green**, mint, teal or emerald", with cobalt for completed. TAX §6.1: Approved/Signed = "**Vibrant Emerald Green (#10B981)**" on a dark slate theme. |
| C28 | **Dashboard philosophy** | SRD2 UI #2: KPI home (cash position, outstanding invoices/bills, top-5 customers, asset values). UIR p2: "task-first home… not oversized vanity cards", led by control queue and close readiness. UATV1 SYS-1.2 still requires the SRD2 KPIs. |
| C29 | **Target business** | SRD2: "a **small business**". STI/UIR/TAX: multi-entity PE/VC fund manager with consolidation, CFO dashboards and IFRS/IAS 21. |
| C30 | **Journal entries: editable lifecycle?** | TECH §2.1: `journal_entries` are **immutable** (create-only, reverse to correct). CORE Tests 32–37 and UIR 03: draft journals are saved, validated, submitted, approved and then **posted** (Draft→Validate→Submit→Approve→Post, with version history). Implied resolution: drafts are mutable and posted JEs are immutable, but no doc states this. |
| C31 | **AR ageing buckets** | UIR 07: "Current (0–30)", "1–30 days", "31–60 days", "61+ days". Current and 1–30 overlap. |

---

## 2. Functional requirements

Format: **ID**: requirement *(source §)*.

### 2.1 Chart of accounts & dimensions (COA)

- **ACC-COA-01**: COA is the master list of all ledger accounts and the foundation of the system *(SRD2 Table 1; TECH §2.1)*.
- **ACC-COA-02**: Account fields: account_id (PK), account_number (string, e.g. "4000/000"), account_name, account_type (Asset/Liability/Equity/Income/Expense), is_control_account (bool) *(SRD2 Table 1)*. TECH adds `currency` (USD, ZIG) *(TECH §2.1)*. SUPP3 adds `natural_balance` (Debit/Credit) *(SUPP3 Resources §2)*. CORE uses accountNo, accountName, accountType (e.g. "Current Asset", "Current Liability", "Revenue", "Expense"), financialStatement ("Balance Sheet"/"Income Statement") and isActive *(CORE Tests 4–7)*.
- **ACC-COA-03**: Numbering scheme: 1000–1999 Assets, 2000–2999 Liabilities, 3000–3999 Equity, 4000–4999 Income/Revenue, 5000–5999 Expenses *(SRD2 Table 1; TECH B §1; SUPP3 Phase 1)*. COA adds **6000–6999 Other Income & Expense** (gain = revenue rule, loss = expense rule) *(COA)*.
- **ACC-COA-04**: account_type drives statement placement: Asset/Liability/Equity go to Balance Sheet, Income/Expense go to Income Statement *(SRD2 Table 1; TECH Glossary II)*.
- **ACC-COA-05**: The system must **prevent saving** an account whose number range conflicts with its selected type (e.g. 5xxx with type Revenue) *(UATV1 GL-2.1)*.
- **ACC-COA-06**: Account numbers must be unique *(CORE Phase 1 "Account numbers unique")*. UIR 14 governance check: "Unique code", "Code format is valid (4-4-3)" *(UIR 14)*.
- **ACC-COA-07**: Core COA structure is hard-coded at initial setup. Users may add accounts (e.g. a new bank or expense line), but the core structure and numbering scheme must be preserved *(TECH B §1)*. The COA is defined at setup and reviewed annually or when a new business activity begins *(SUPP3 §2.1)*.
- **ACC-COA-08**: Control accounts (e.g. Debtors Control, Creditors Control) aggregate sub-ledgers. **Transactions are not posted directly to a control account.** Its value is derived from sub-ledger entries *(SRD2 Table 1)*.
- **ACC-COA-09**: Minimum seeded accounts per COA blueprint (codes per COA): 1100 Bank-ZIG (base), 1110 Bank-USD (foreign), 1120 Short-Term Deposits/T-Bills (<90 days), 1200 Petty Cash/Cash Float, 1300 AR (Debtors Control), 1350 Allowance for Doubtful Debts (contra), 1400 Prepaid Expenses-Rent, 1500 Investment in Portfolio Companies, 1520 Office Equipment & Furniture (Cost), 1550 Accumulated Depreciation (contra), 2000 AP (Creditors Control), 2050 VAT/Sales Tax Payable, 2110 Unearned Revenue/Deferred Income, 2150 PAYE Payable, 2160 NSSA/Pension Payable, 2200 Net Wages Payable (Clearing), 3000 Owner's/Shareholder's Capital, 3100 Retained Earnings, 3200 Drawings/Dividends Paid (contra-equity), 4001 Management Fees Income, 4002 Performance Fees (Carried Interest), 4050 Interest Income-Bank Deposits, 5010 Gross Salaries & Wages, 5020 Employer Payroll Contributions, 5100 Office Rental, 5130 Depreciation, 5160 Professional Fees, 6000 Gain on Disposal of FA, 6050 Loss on Disposal of FA, 6100 Unrealized Gain on Investment Revaluation, 6150 Unrealized Loss on Investment Revaluation, 6200 Bad Debt Expense *(COA)*. See C3–C10 for conflicting codes.
- **ACC-COA-10**: Each account in the blueprint carries its increase/decrease rule and Typical Balancing Account (TBA), used to drive default double-entry completion *(COA preamble)*.
- **ACC-COA-11**: Additional TECH accounts: 2200 Event Accrual (Clearing), 1150 Prepaid Expenses, 5200 Marketing/IR Expense, 4900 FX Gain/Loss, 3200 Current Year Net Income *(TECH B §1)*. These conflict with COA (C7, C10).
- **ACC-COA-12**: Bulk COA import with a validation step (multipart file upload) *(UATN "uat 77")*.
- **ACC-COA-13**: CoA changes are governed as **versioned, effective-dated change sets** (e.g. "FY2026 v4", effective date, status Draft changes). Each change set covers additions, edits and deactivations, with Old value, New value, Reason, Audit note, Prepared by and Reviewer, and must be submitted for approval *(UIR 14)*.
- **ACC-COA-14**: Per-account governance attributes: Type (Posting/header), Reporting group, Normal balance, Permitted currencies (USD, ZiG), Default tax rule (e.g. WHT Services 10%, Standard VAT), Department required, Project required, Reconciliation required and Reconciliation owner, Posting allowed, Parent, Status, Effective date *(UIR 14)*.
- **ACC-COA-15**: Governance checks before submission: code format valid, unique code, parent account active, currency rule valid, tax rule valid, user permissions validated. The system shows an **impact preview** (P&L lines, tax schedule, budget model affected) and flags accounts **used by recurring journals** *(UIR 14)*.
- **ACC-COA-16**: Deactivation rather than deletion (e.g. merged duplicate account marked Inactive) *(UIR 14)*.
- **ACC-COA-17 (Dimensions)**: Journal lines carry **Department** and **Project** dimensions, and ledger/report filters include Department and Project *(UIR 02, 03, 11)*. Short-term investments are tagged with dimensions **Entity, Department, Broker, Investment Type, Currency** *(STI §2.1; UAT 1.1)*.
- **ACC-COA-18**: Hierarchical account tree with rolled-up balances (Assets > Current Assets > Cash & Cash Equivalents > leaf accounts) *(UIR 02)*.

### 2.2 General ledger & journals (GL)

- **ACC-GL-01**: Every financial action must translate into balanced debits and credits. Assets = Liabilities + Equity must hold after every transaction. Any imbalance must be **flagged and rejected** *(SRD2 Principles §1–2; TECH §1; SUPP3 Phase 1)*.
- **ACC-GL-02**: Every money-recording function (createInvoice, recordPayment, etc.) must generate JournalEntry documents satisfying DebitTotal = CreditTotal and must **automatically fail** otherwise *(TECH §1)*.
- **ACC-GL-03**: Journal header fields: journal_id, journal_date, reference_number, description, user_id, is_manual_entry, currency_id, exchange_rate *(SRD2 Table 2)*. TECH adds transactionId and sourceDocumentType (e.g. INVOICE) *(TECH §2.2)*.
- **ACC-GL-04**: Journal line fields: journal_line_id, journal_id, account_id, debit_amount, credit_amount (transaction currency), base_debit_amount, base_credit_amount *(SRD2 Table 3)*. Each line stores the foreign amount, base amount and **exchangeRate** locked at transaction date *(TECH §2.2; SUPP3 Resources §3)*.
- **ACC-GL-05**: **Dual constraint**: Σdebit = Σcredit **and** Σbase_debit = Σbase_credit per journal. If either fails, the entire transaction is rejected *(SRD2 Table 3; §GL Backend Logic)*.
- **ACC-GL-06**: Header and lines are written in **one DB transaction** (atomic). On any failure, roll back entirely *(SRD2 §1 GL)*.
- **ACC-GL-07**: Manual journal UI: form with a dynamic number of rows for multiple Dr/Cr lines. For multi-currency, show transaction-currency amount **and** calculated base equivalent *(SRD2 §1 GL; User Stories GL)*.
- **ACC-GL-08**: Posted journals are **immutable**: no update or delete. Correction is only by a new offsetting (reversing) entry *(TECH §2.1; SUPP3 Resources §2 "allow update, delete: if false")*.
- **ACC-GL-09**: Manual JE must have a meaningful **Reference or Description**. Saving is blocked if both are empty *(UATV1 GL-2.8)*. UIR 03 marks Description, Journal Date, Posting Period, Source and Currency as required *(UIR 03)*.
- **ACC-GL-10**: Unbalanced JE error message: "Double-Entry Balance Failed. Total Debits ($100.00) must equal Total Credits ($99.00)." *(UATV1 GL-2.2)*. On successful post, GL balances update immediately *(UATV1 GL-2.3)*.
- **ACC-GL-11**: JE lifecycle for manual journals: **Draft → Validate → Submit → Approve → Post** with a version history (v0.1 created, v0.2 saved, v1.0 current draft) *(UIR 03)*. CORE: create, get, filter by date range, **post** (status POSTED), void *(CORE Phase 5 Tests 32–37)*.
- **ACC-GL-12**: Pre-submission **Validation & Controls** panel: debits equal credits, period is open, all accounts active, supporting document attached, tax-treatment warnings (e.g. WHT requires reviewer confirmation) *(UIR 03)*.
- **ACC-GL-13**: **Maker-checker** on journals: approval chain Preparer → Reviewer → Final approver. "You cannot approve your own entry" *(UIR 03)*.
- **ACC-GL-14**: Journal attributes include Entity, Posting Period, Source (Manual, etc.), Department, Supporting Document attachment (drag-and-drop), per-line Department/Project/Tax code, Memo, "Import from Excel" for lines *(UIR 03)*.
- **ACC-GL-15**: Sub-ledger postings (Cashbook, Debtors, Creditors, Payroll, Depreciation, etc.) generate JEs automatically with `is_manual_entry = FALSE`. Manual GL journals are `TRUE` *(SRD2 Table 2; SUPP3 §2.3)*.
- **ACC-GL-16**: The GL is continuous and real-time. It updates running balances for every account on each JE *(SUPP3 §3.1)*. Optionally maintain a running current balance per account, updated atomically *(SUPP3 Resources §2)*.
- **ACC-GL-17**: **GL Viewer**: read-only, searchable, virtualised table of every journal entry. Columns: Date, Transaction ID, Source Document, Account ID, Account Name, Description, Debit (USD), Credit (USD), Debit (ZIG), Credit (ZIG). Permanent Total Debit / Total Credit footer that must always match. If they do not, show an **error banner to SysAdmin** (DB integrity issue) *(TECH B §4.1)*.
- **ACC-GL-18**: GL Explorer: account tree, filters (account, source, department, project, date range, status, search reference/description), per-account opening balance, **running balance**, source, status, and account side panel (account summary, bank details, audit trail, last reconciled, reconciliation ref) *(UIR 02)*.
- **ACC-GL-19**: GL Detail report must show a **running balance after every transaction** *(UATV1 AUD-6.6; CB-006)*.
- **ACC-GL-20**: Reversing entries: void/reversal generates the exact opposite Dr/Cr *(CB §3.3.1; STI §4.1)*. Recurring journals exist ("Recurring Journals" quick link, accounts "used by 3 recurring journals") but **no behaviour is specified** *(UIR 11, 14)*.
- **ACC-GL-21**: **Draft/unposted** transactions must be excluded from Balance Sheet and P&L. Only POSTED transactions affect statements *(UATV1 REP-7.6; TECH §2.1 status DRAFT/POSTED)*.
- **ACC-GL-22**: `transactions` collection (user-facing documents: INVOICE, PAYMENT, BILL) with userId and status DRAFT/POSTED triggers JEs. Access is by role and department *(TECH §2.1)*.

### 2.3 Fiscal calendar, periods, locks, close & year-end (PER)

- **ACC-PER-01**: Fiscal Period is typically a month or year and is used to filter IS/BS reports *(TECH Glossary I)*.
- **ACC-PER-02**: Posting validation checks that the **selected period is open** before posting (Cashbook batch post) *(CB §4.4.2 step 2; CBN)*. The JE control panel shows "Period is open" *(UIR 03)*.
- **ACC-PER-03**: Journals carry a **Posting Period** distinct from Journal Date *(UIR 03)*.
- **ACC-PER-04**: After bank reconciliation is finalized, posting a JE dated in the reconciled period should warn, or preferably be **prevented entirely** *(UATV1 REC-4.4)*.
- **ACC-PER-05**: **Month-End Close Control Centre**: per period, close owner, target close date, status (Open), overall completion %, controls complete (n of m), unposted journals count, unreconciled accounts count, tax packs due *(UIR 12)*.
- **ACC-PER-06**: Close checklist by workstream, with Dependency, Owner, Due, Evidence (attachments) and Status (Complete / In review / Exception / Blocked). Workstreams: Bank & Cash (sign-off per bank reconciliation, petty cash), AP (reconcile supplier statements, review and post AP accruals from GRNI listing), AR (reconcile debtor accounts, review doubtful debts provision from ageing), Payroll (post payroll journal), Fixed Assets (run depreciation), Short-Term Investments (accrue investment interest), Tax (prepare VAT return pack, PAYE & WHT returns), Financial Statements (review TB, **Lock period**, dependent on "All tasks complete") *(UIR 12)*.
- **ACC-PER-07**: **Period lock** is the final close task and is blocked until all dependencies are complete. The sidebar shows "Period lock: Locked/Unlocked" and days remaining *(UIR 12, 02)*.
- **ACC-PER-08**: The close pack is sent for review/approval with a reviewer/approver assignment, comments, approval timeline and audit trail ("All actions captured") *(UIR 12)*.
- **ACC-PER-09**: The TB is formally generated at period end (monthly/quarterly/annual). **TB must balance before financial statements can be published** *(SUPP3 §3.2)*.
- **ACC-PER-10**: Year-end closing: temporary (IS) accounts are closed to equity. Retained Earnings is credited on closing profit and debited on loss/dividend (TBA = 4xxx/5xxx year-end closing entries) *(COA 3100; SUPP3 BS drill-down §3 "Post-Closing" TB)*. The target equity account conflicts (C10).
- **ACC-PER-11**: Depreciation run **locks the accounts until complete** *(TECH B §4.3)*.
- **ACC-PER-12**: Tax pack initialization is blocked if the period contains unclosed journals, and the pending transactions are listed *(TAX §2.1)*.

### 2.4 Multi-currency & FX (FX)

- **ACC-FX-01**: Base (reporting) currency is chosen during initial system setup *(TECH §3.1)*. See C1 for ZWL/ZIG/USD conflict.
- **ACC-FX-02**: Every transaction specifies its transaction currency (USD, ZIG, or ZAR) *(TECH §3.1)*. Currencies are master data with code (unique), name, symbol, isActive *(CORE Tests 1–3)*.
- **ACC-FX-03**: Exchange rate table: rate_id, date, from_currency_id, to_currency_id, rate. It is historical and critical for reconciliation and reporting *(SRD2 Table 10; CORE Tests 48–49)*.
- **ACC-FX-04**: **Daily RBZ rate sync** (`syncRBZRate`): query the official RBZ public API or a reliable provider for the USD/ZIG interbank rate at a scheduled time (e.g. 09:00). Store at `/config/exchange_rates/{date}`. On failure, use the last successfully stored rate **and alert SysAdmin** *(TECH §3.1)*.
- **ACC-FX-05**: Rate used for a document = rate for the **document date**. The exchangeRate on each JE line locks the rate so history never changes when live rates move *(TECH §2.2, §4.2)*.
- **ACC-FX-06**: For a transaction date, fetch the last valid rate (or require manual entry of the rate valid on that date). **Must not use a rate that became valid later** *(UATV1 GL-2.5)*.
- **ACC-FX-07**: Multi-currency input component: Currency dropdown (USD/ZIG/ZAR), Amount (Foreign), read-only Exchange Rate Display, read-only Amount (Base) = amountForeign × exchangeRate. Changing Invoice Date must **auto-refresh** rate and base amount *(TECH B §4.2)*.
- **ACC-FX-08**: Multi-currency forms (invoices, receipts) must display transaction amount, base equivalent **and the rate used** *(SRD2 UI #5; UATV1 GL-2.4)*. Invoice form shows "Total ZIG Equivalent" auto-calculated at the invoice-date RBZ rate *(TECH §4.2)*.
- **ACC-FX-09**: Remove the exchange-rate input field when creating an invoice *(UATN)*. Conflicts with UATV1 GL-2.4 (C22).
- **ACC-FX-10**: Record the equivalent amount at creation (`equivalentAtCreation {amount, currency}`) on the document and display it *(UATN "uat 33")*. Show converted-currency data in responses *(UATN "uat 36")*.
- **ACC-FX-11**: **Realized FX gain/loss** is auto-posted when a foreign-currency invoice/bill is settled at a different rate. recordPayment must look up the original AR base value, compute the difference and post it to FX Gain/Loss *(SRD2 §2 step 3; TECH §3.2)*. JE shape conflicts (C14).
- **ACC-FX-12**: Partial settlements in another currency: each receipt credits Debtors Control with foreign amount at today's base value. When the invoice is fully settled, the difference between total base received and original base value is auto-posted *(SRD2 §2 steps 2–3)*.
- **ACC-FX-13**: Realized FX on AP: creditor bill 500 USD at 50 paid at 52 must produce a **Realized FX Loss** of 1,000 ZIG to an expense GL and close the creditor at the original base 25,000 ZIG *(UATV1 GL-2.7; SRD2 §3 "reverse of Debtors with the same reconciliation logic")*.
- **ACC-FX-14**: **Unrealized FX revaluation** routine at period end (not daily). Example: USD bank 1,000 at 50 revalued at 55 gives Dr USD Bank / Cr Unrealized FX Gain (P&L) 5,000 ZIG, and the bank base value becomes 55,000 *(UATV1 GL-2.6; TECH Glossary IV)*.
- **ACC-FX-15**: FX Revaluation workspace: entity, period end, functional currency, rate source ("Approved treasury rates"). Lists foreign-currency monetary accounts with foreign balance, book rate, closing rate, book value, revalued value, gain/(loss), proposed journal and status (Compliant / **Missing rate** / Not revalued) *(UIR 16)*.
- **ACC-FX-16**: Revaluation policy: **monetary items only**, account mappings, rounding to nearest cent, **threshold USD 10.00**, designated Gain/(Loss) account *(UIR 16)*.
- **ACC-FX-17**: Approved closing rates panel: source RBZ, rate per currency vs book rate, effective timestamp, **approved by (Treasury)**. A missing or unapproved rate is an exception ("Obtain and approve EUR/USD rate") that blocks that line *(UIR 16)*.
- **ACC-FX-18**: Revaluation journal **preview** with balance check, and **maker-checker** (Prepared by, Reviewed by, Approved by) before "Run revaluation" *(UIR 16)*.
- **ACC-FX-19**: Unrealized FX report `GET /api/accounting/multi-currency/reports/unrealized-fx?asOfDate=` (defaults to now) *(UATN)*.
- **ACC-FX-20**: Currency conversion service (amount, from, to, date) and multi-currency payment processing *(CORE Tests 50–51)*. FX gain/loss calculate and post endpoints *(CORE Tests 52–53)*.
- **ACC-FX-21**: Multi-currency Bank GL report: the transaction-currency column and base-currency column must both be accurate. Base reflects the posting-date rate (realized) or revaluation rate (unrealized) *(UATV1 REP-7.5)*.
- **ACC-FX-22**: Translation for multi-entity: a subsidiary with a different functional currency maps the delta to **Cumulative Translation Adjustment (CTA)** in Equity *(STI UAT 7.5)*. Consolidation shows FX impact per elimination *(UIR 17)*.
- **ACC-FX-23**: Global header shows the current rate (e.g. "ZiG 27.94 / 1 USD = 27.94 ZiG") with as-at date *(UIR all screens)*.

### 2.5 Accounts payable (AP)

- **ACC-AP-01**: Suppliers sub-ledger: supplier_id, name, contact_details, creditors_control_account_id *(SRD2 Table 5)*. CORE vendors add email, phone, address, taxNumber (**unique**), paymentTerms, currencyId *(CORE Tests 10–11)*.
- **ACC-AP-02**: Enter a supplier invoice (bill) to track what is owed, and pay it *(SRD2 User Stories Creditors)*. Bill recording: Dr Expense (e.g. 5100) / Cr AP *(TECH B §3.2)*.
- **ACC-AP-03**: A bill **cannot be posted without the Supplier Invoice Number** (mandatory external reference) *(UATV1 AUD-6.5)*.
- **ACC-AP-04**: AP payments: Dr AP / Cr Bank *(TECH B §3.2 step 3)*. Paying from Cashbook with a supplier selected auto-marks bills paid/partially paid and updates the A/P sub-ledger *(CB §3.3.2.A.4)*.
- **ACC-AP-05**: Creditors allocation logic must let the user apply a payment to specific bills/POs. $800 against a $1,000 bill leaves it **Partially Paid, $200 remaining** *(CB §3.7; UATV1 CB-3.6)*.
- **ACC-AP-06**: AP multi-currency follows the same realized-FX logic as AR *(SRD2 §3)*.
- **ACC-AP-07**: **Creditors age analysis** `GET /api/accounting/purchase-invoices/creditors-age-analysis?asOfDate=` *(UATN "uat 25")*.
- **ACC-AP-08**: **Batch pay** multiple purchase invoices in one call (invoiceIds[], paymentMethod BANK, bankId, paymentDate, paymentReference, notes) *(UATN "uat 95")*.
- **ACC-AP-09**: Vendor statements for **all vendors and all currencies**, each labelled with currency, with correct opening/closing balances per currency *(CORE Tests 61, 63)*.
- **ACC-AP-10**: Dashboard "Total Outstanding Bills" *(SRD2 UI #2; UATV1 SYS-1.2)*.
- **ACC-AP-11**: **Supplier Payment Run**: select invoices → validate beneficiaries → approve batch → generate bank file → confirm settlement. The bank file step is **locked until final approval** *(UIR 18)*.
- **ACC-AP-12**: Payment run controls: scheduled date, funding account, suppliers/invoices selected, batch total vs **available cash** (cash coverage), **held payments** with hold reason, **duplicate payment check**, **sanctions check**, per-supplier bank-detail validation (Verified / Review "Beneficiary name mismatch" / "Bank detail mismatch"), beneficiary confirmation document, bank-detail change history *(UIR 18)*.
- **ACC-AP-13**: Payment run shows Gross, **WHT** and Net payment per supplier. GL settlement is Dr expense / Cr AP. Approval chain is Reviewer (Finance Manager) → Final approver (Finance Director) *(UIR 18)*.
- **ACC-AP-14**: AP accruals (GRNI listing) are reviewed and posted at close *(UIR 12)*.

### 2.6 Accounts receivable (AR)

- **ACC-AR-01**: Customers sub-ledger: customer_id, name, contact_details, **credit_limit**, debtors_control_account_id *(SRD2 Table 4)*. CORE adds email (**unique**), phone, address, taxNumber, creditLimit, currencyId *(CORE Tests 8–9)*.
- **ACC-AR-02**: Invoice header: invoice_id, customer_id, invoice_date, due_date, total_amount, currency_id, status, journal_id (link to the auto-generated JE) *(SRD2 Table 6)*. Lines: item_description, quantity, unit_price, total_line_amount *(SRD2 Table 7)*. CORE lines carry taxRate (15%) and notes *(CORE Tests 24–25)*.
- **ACC-AR-03**: Invoice form: Customer (autocomplete, required, determines AR account), Invoice Date (default today, required, determines rate), Due Date (required, used for ageing and DSO), Currency (USD/ZIG/ZAR), Line Items (Description, **COA Account** that determines the credit side, Amount (Foreign), VAT), Total ZIG Equivalent (display) *(TECH §4.2)*.
- **ACC-AR-04**: Posting an invoice creates Dr AR / Cr Revenue (+ output VAT). Tax calculations must be accurate and JEs are created automatically *(TECH B §3.1; CORE Phase 4)*.
- **ACC-AR-05**: Invoice lifecycle per CORE: DRAFT → SENT (only DRAFT can be sent), SENT → PAID (only SENT can be marked paid, with payment method), any → VOID (reason recorded) *(CORE Tests 26–28)*. Conflicts with C15/C16.
- **ACC-AR-06**: **Posted invoices are not editable** (amount or GL coding). Correction is by Credit Note only *(UATV1 AUD-6.1)*.
- **ACC-AR-07**: Credit note reverses the sale: Dr Sales / Cr Debtors Control *(SRD2 §2 Credit Notes)*. CORE: created from an invoice (customer/currency auto-detected) with amount, vatAmount, totalAmount and reason. It gets a unique number and can be sent and **applied** to an invoice, with journal entries for creation and application. Reports by status and per customer *(CORE Tests 54–59)*.
- **ACC-AR-08**: Receipt against an invoice from the Cashbook: selecting a customer triggers the **Debtors allocation modal** to match the payment to specific open invoices. Status goes Open → Paid / Partially Paid. $500 on $600 leaves **Partially Paid, $100 remaining** *(CB §3.7, CB-003; UATV1 CB-3.3)*.
- **ACC-AR-09**: From an open invoice, a contextual **"Record Payment"** leads to Cashbook Receipt with customer and amount pre-filled *(UATV1 SYS-1.6)*.
- **ACC-AR-10**: Customer **statement of account** (all invoices and payments). Generate statements for **all customers × all currencies** at a statement date, labelled by currency, with correct opening/closing balances. Statement **email** functionality *(SRD2 User Stories; CORE Tests 60, 62; Phase 10 checklist)*.
- **ACC-AR-11**: AR & Collections workspace: outstanding total, ageing buckets, **DSO vs target**, filters (customer, status, currency, salesperson, due date), collection status per invoice (Overdue, Part-paid, Paid, **Promise to pay**) *(UIR 07)*.
- **ACC-AR-12**: Collections actions per invoice: **Send reminder**, **Record promise** (promise-to-pay amount and date), **Open dispute**, **Allocate receipt**, **Send statements**. Activity timeline (invoice emailed by System, invoice opened by recipient, reminder sent, promise recorded) *(UIR 07)*.
- **ACC-AR-13**: Invoice summary statistics endpoint *(CORE Test 31)*. Dashboard "Total Outstanding Invoices" and "Top 5 Customers by Sales" *(SRD2 UI #2)*.
- **ACC-AR-14**: Doubtful debts: provision is Cr 1350 Allowance / Dr 6200 Bad Debt Expense. Write-off is Dr 1350 / Cr 1300 *(COA 1350, 6200)*. The provision is reviewed at close from the ageing report *(UIR 12)*.
- **ACC-AR-15**: Unearned revenue: cash received in advance is Cr 2110. It is debited as revenue is recognized *(COA 2110)*.
- **ACC-AR-16**: Quotations: **no requirement in any source** (see §7).

### 2.7 Cashbook & bank (CB)

**Bank master**
- **ACC-CB-01**: Banks are set up under Settings: name, accountNumber (**unique**), currencyId, glAccountId, optional bankCode, branchCode, isActive. glAccountId must be **Current Asset or Fixed Asset**, **one bank per GL**. The GL dropdown lists only asset GLs not yet linked. Delete is **soft** (isActive=false, clears glAccountId). The list can include inactive banks *(UATN "Add Banks under settings")*.
- **ACC-CB-02**: Each bank account is a separate cashbook. One CashbookAccount links to many entries *(CB §4.4.1)*.

**Cashbook transactions**
- **ACC-CB-03**: Cashbook records all non-debtor/non-creditor receipts and payments, and **must also** accept debtor/creditor receipts/payments, calling the Debtors/Creditors functions to settle balances. It is the **single entry point for cash movements** *(CB §3.1, 3.1.1)*.
- **ACC-CB-04**: CashbookTransaction header: transactionId (auto), transactionDate (req), transactionType RECEIPT/PAYMENT (req), glAccountId (bank GL, must be Asset), amount (>0, = Σ lines), reference (optional, max 50; e.g. cheque no., transfer ref, **ZIMRA payment code**), description (required, max 100), isReconciled (default false), reconciliationDate, systemStatus POSTED/VOIDED (default POSTED), creatorUserId *(CB §3.2)*.
- **ACC-CB-05**: Line item: lineId, transactionId, contraGlAccountId, amount (>0, gross incl. VAT), vatCodeId (e.g. ZIM_STD_15%, ZIM_EXEMPT_0%), vatAmount (auto), netAmount = amount − vatAmount (auto, posted to contra), debtorCreditorId (optional). **If debtorCreditorId is set, the contra must be the corresponding control account** (1300 / 2000 range) *(CB §3.2)*.
- **ACC-CB-06**: **VAT code must be validated against contra account type** (e.g. Revenue accounts cannot use Input VAT codes) *(CB §3.2)*.
- **ACC-CB-07**: DB integrity: Σ line.amount = transaction.amount *(CB §3.2)*.
- **ACC-CB-08**: GL legs per transaction: **Bank leg** (opposite side to the contra, full amount), **Contra leg(s)** (net), **VAT leg(s)** (VAT control 2100/2110). At least 2 and often 3 JEs *(CB §3.2.1)*.
- **ACC-CB-09**: Payment: Cr Bank (total), Dr Contra (net) + Dr VAT Input 2110 (VAT). Receipt: Dr Bank (total), Cr Contra (net) + Cr VAT Output 2100 (VAT). "Double-Entry Balance Failed" error if not balanced, which prevents save *(CB §3.3.2, §3.5)*.
- **ACC-CB-10**: Multi-line allocation: running total and **Remaining to Allocate**. The transaction **cannot be saved until remaining = 0** *(CB §3.3.3; CB-007; UATV1 CB-3.1/3.2)*.
- **ACC-CB-11**: Owner's capital receipt: Dr Bank / Cr Owner's Equity contra, with a 0%/exempt VAT code. The VAT module records zero impact *(CB CB-002; UATV1 CB-3.8)*.
- **ACC-CB-12**: GCS counterparty type per line: **G** (GL, validate against COA), **C** (customer master), **S** (supplier master). For C/S, saving a line **must trigger the Match Open Item modal** and record `matchedItems [{invoiceId, amount}]` *(CB §4.4.1)*.
- **ACC-CB-13**: Two-stage entry: Stage 1 saves a batch (journalEntryId = null). Stage 2 **Update/Post Batch** validates (period open, incomplete lines such as missing Reference), then builds JEs per entry: G offsets to the user GL, C to Debtors Control, S to Creditors Control, and journalEntryId is set *(CB §4.4.2)*. Conflicts with instant posting (C17).
- **ACC-CB-14**: **Discounts**: if discountAmount > 0, auto sub-entry. Receipts: Dr Discount Allowed (Expense) / Cr Customer Control. Payments: Dr Supplier Control / Cr Discount Received (Revenue) *(CB §4.4.2 C; CBN)*.
- **ACC-CB-15**: **VOID** (not delete): only users with the **'Cashbook Void'** permission. A reconciled transaction cannot be voided (error "Transaction must be unreconciled before voiding."). Status becomes VOIDED and a reversing JE with exact opposite Dr/Cr is dated the original date **or** current date (**configurable**), with description "REVERSAL of CB Transaction [Original ID]". VOIDED items are permanently excluded from reconciliation *(CB §3.3.1, §3.2; UATV1 CB-3.4/3.5)*.
- **ACC-CB-16**: Transfers between bank accounts (Transfer action, from/to account, currency, amount, rate with refresh, estimated amount in the other currency, "Review transfer") *(UIR 04; TECH §4.1 "Banking: Bank Reconciliation, Transfers"; COA 1110 TBA "CR/DR to 1100 (Transfer)")*.
- **ACC-CB-17**: Cashbook entry search: startDate, endDate, currencyId, minAmount, maxAmount, free-text search, pagination *(UATN "uat 7")*.
- **ACC-CB-18**: **Receipt/evidence attachment** upload on a cashbook entry (multipart `file`) *(UATN "uat 75")*.
- **ACC-CB-19**: **Cashbook audit export** by year, month and bank *(UATN "uat 28")*.
- **ACC-CB-20**: Cashbook Journal (unified view/report): chronological receipts (Dr column) and payments (Cr column) with **running balance**, quick search by reference/description, printable, **CSV/Excel export** *(CB §3.4; CB-006)*.
- **ACC-CB-21**: Cash Book workspace: opening balance, inflows, outflows, closing balance, **available after commitments**, tabs (All/Receipts/Payments/Transfers/Unreconciled), value date, counterparty, category, reconciliation status (Matched/Pending/Exception), **upcoming obligations** (payroll, ZIMRA VAT, supplier batches), **liquidity by currency**, cash controls (last bank feed, unreconciled items, statement coverage, next statement) *(UIR 04)*.
- **ACC-CB-22**: Pastel-style UX: autocomplete contra accounts by code/description with keyboard trigger (F2/Tab), Receipt/Payment toggle that relabels fields ("Source of Funds" / "Purpose of Payment"), **sticky contra account and VAT code** for the next line (Ctrl+L clears), inline VAT, default entry-mode setting (Gross / Excl-VAT), and running unreconciled bank balance before/after the transaction *(CB §3.4)*.
- **ACC-CB-23**: Keyboard-only entry and post with a designated shortcut (e.g. F5 or Ctrl+S) *(UATV1 CB-3.7)*.
- **ACC-CB-24**: Petty cash / cash float: replenishment is Dr 1200 / Cr bank. Disbursement is Cr 1200 / Dr expense *(COA 1200)*. Petty cash is reconciled at close *(UIR 12)*.

**Bank reconciliation**
- **ACC-CB-25**: Tick-based reconciliation: select bank and period end. Show all unreconciled transactions up to that date with **GL Bank Balance**, **Total Un-ticked Items**, **Calculated Cleared Balance** (updates in real time as items are ticked). The user enters the statement ending balance. **Finalize** is only allowed if the cleared balance equals the statement balance. The Finalize button is disabled with the precise difference shown otherwise. Finalize sets isReconciled = true and reconciliationDate on ticked items *(CB §3.3.4; CB-004/005; UATV1 REC-4.1..4.3)*.
- **ACC-CB-26**: Reconciliation status flag N (not reconciled, default after posting, only changeable via bank rec) → R (reconciled, final, cannot be edited). Bank rec queries entries with status N for the cashbook account *(CB §4.5.1)*.
- **ACC-CB-27**: Reconciliation **sessions** API: candidates `GET …/banks/:bankId/entries?asOf=&includeReconciled=`, list sessions (CANCELLED omitted), create DRAFT (statementDate and statementEndBalance required, openingBalance, selectedEntryIds, reference optional), get session (lines, totals, `priorClosingBalanceFromLastFinalized`), PATCH draft only, **finish** (fails 400 if balance ≠ statementEndBalance ±0.01 or no line selected, then status FINALIZED with finishedById/At, closingBalance persisted, entries isReconciled = true), **discard** (draft only, then CANCELLED) *(UATN "Bank reconciliation (sessions — new)")*.
- **ACC-CB-28**: Reconciliation display endpoint `GET /api/cashbook/reconciliation/display?bankId=&periodEndDate=` *(UATN "uat 13")*.
- **ACC-CB-29**: Statement import: import a bank statement (CSV or direct feed) into `tbl_bank_statements` (statement_line_id, bank_account_id, date, description, amount, reconciled default false) *(SRD2 Table 11, §6.1)*. CORE upload carries accountId, statementDate, opening/closing balance and transactions (date, description, signed amount, reference). JSON and file are supported, and opening/closing balances are validated *(CORE Test 66)*.
- **ACC-CB-30**: **Auto-matching** of statement lines to journal entries by **date, amount, reference number** *(SRD2 §6.2)*. Potential-match suggestions and unmatched lists *(CORE Tests 67–68)*.
- **ACC-CB-31**: Manual match of statement line to JE *(SRD2 §6.3; CORE Test 69)*. **Create a JE directly from an unmatched statement line** (e.g. bank fee: Dr Bank Charges / Cr Bank) *(SRD2 §6.3; CORE Test 70)*.
- **ACC-CB-32**: On completion, system bank balance equals the statement balance and matched lines have `reconciled = TRUE` *(SRD2 §6.4)*. Reconciliation report and summary *(CORE Tests 71–72)*.
- **ACC-CB-33**: **Split-screen** reconciliation UI: statement lines on one side, system entries on the other, and a clear matched/unmatched status indicator *(SRD2 UI #7)*.
- **ACC-CB-34**: Reconciliation Workbench: steps Import statement → Auto-match → Resolve exceptions → Review → Sign off. Shows statement balance, ledger balance, difference, statement lines count, % matched, exceptions count. Suggested ledger matches with **confidence %**. Actions Match / **Split** / **Create adjustment**. Exception details carry reason, **owner**, **priority**, comments, **evidence** attachment. "Last auto-match" timestamp and user. "Send for review" *(UIR 05)*.
- **ACC-CB-35**: **Configurable reconciliation rules** (name, conditions, action auto-match, exception count). Examples: "Exact reference match"; "Amount & date tolerance: amount variance ≤ $50.00 and date within ±2 days"; "Bank charges rule: narrative contains 'bank charge' or 'fees' and amount ≤ $150.00". Match detail rule example: "Exact amount, date within 1 day" *(UIR 05)*.
- **ACC-CB-36**: Reconciliation frequency is **daily or weekly** *(SUPP3 §3.3)*. Every reconciliation action is logged in the audit trail *(SRD2 Integration "Audit Trail")*.

**Bank payment files**
- **ACC-CB-37**: Generate a **CSV** bulk payment file with fields in this exact order: Employee Name, Bank Name, Branch Code, Account Number, Payment Amount (Net Pay), Payment Reference (employee ID/payroll no.) *(BF §3.0)*.
- **ACC-CB-38**: Per-bank configuration: add/reorder columns, custom delimiter (semicolon, pipe), header row on/off *(BF §3.0)*.
- **ACC-CB-39**: UI: select pay period, click "Generate Bank File", download prompt *(BF §3.0)*.
- **ACC-CB-40**: Security: the file is stored securely and transmitted over HTTPS. Sensitive banking information must not be stored permanently in an easily accessible way *(BF §3.0)*.
- **ACC-CB-41**: Unit tests for the file generator. UAT means the client uploads to the bank portal and payments process successfully *(BF §4.0)*. The file may be named Bulk Payment / Payroll / Payment Instruction / Batch / Upload file *(BF §5.0)*.
- **ACC-CB-42**: Supplier payment runs also end in bank-file generation (locked until approval) *(UIR 18)*.

### 2.8 Short-term investments (STI)

- **ACC-STI-01**: Only users with the **Treasury Management** role create/define instruments *(STI §3.1)*.
- **ACC-STI-02**: Instrument fields: Instrument ID (auto alphanumeric), Name, Category (**Money Market, T-Bill, Commercial Paper**), Broker/Financial Institution, Principal, Currency (multi-currency, daily rate sync), **APY**, Interest Method (**Simple, Compound Daily, Compound Monthly**), Day Count (**Actual/360, Actual/365, 30/360**), **Settlement Account** (cash, **mandatory**), GL mappings (Principal Asset, Accrued Interest Receivable, Interest Income) *(STI §3.1; UAT 1.1, 1.3)*.
- **ACC-STI-03**: Day-count convention is **locked per instrument** once selected *(STI UAT 1.2)*.
- **ACC-STI-04**: Instruments tagged with dimensions Entity, Department, Broker, Investment Type, Currency *(STI §2.1)*.
- **ACC-STI-05**: **Daily accrual engine** at **23:59 tenant timezone** (not server UTC) processes all active instruments *(STI §3.2; UAT 2.1, 8.4)*.
- **ACC-STI-06**: Handles leap years per convention (Actual/365 processes day 366 without error) *(STI §3.2; UAT 2.4)*.
- **ACC-STI-07**: **Effective-dated rate tables**. The engine uses the rate active on the execution date: old rate for past days, new rate from effective date *(STI §3.2; UAT 2.5)*. A rate change mid-day must not alter an already-posted accrual *(UAT 8.1)*.
- **ACC-STI-08**: Accrual JE: Dr Accrued Interest Receivable / Cr Interest Income *(STI §3.3; UAT 3.1)*.
- **ACC-STI-09**: **CFO-configurable posting mode**: **Draft** (CFO must manually approve the batch, weekly/monthly review) or **Approved** (post to GL immediately, continuous close) *(STI §3.3; UAT 3.2)*.
- **ACC-STI-10**: Multi-currency accrual: interest computed in the source currency, translated to reporting currency at **that day's spot (mid-market) rate** *(STI UAT 3.4, 7.1)*.
- **ACC-STI-11**: **Liquidation/maturity**: the user initiates a Liquidation Action. The system computes final partial-day interest up to the exact liquidation date and posts Dr Operating Cash (principal + total accrued) / Cr ST Investment Principal / Cr Accrued Interest Receivable *(STI §3.4; UAT 4.1, 4.2)*.
- **ACC-STI-12**: Post-maturity, the settlement bank ledger reflects exactly principal + all historically accrued interest *(STI UAT 4.3)*.
- **ACC-STI-13**: Realized FX on maturity = total ZiG received − total ZiG carrying value *(STI UAT 7.4)*.
- **ACC-STI-14**: **Month-end unrealized FX revaluation** of principal + accrued at original vs month-end closing rate. The delta is posted to Unrealized FX Gain/Loss (6060) and adjusts carrying value (1510) *(STI UAT 7.2, 7.3)*.
- **ACC-STI-15**: **Negative yield** accepted, flagged "**Capital Erosion**" on dashboard. Daily accrual reduces accrued interest. GL flips to Dr Interest Expense (or contra-revenue) / Cr Accrued Interest Receivable. Liquidation can pay out less than principal (capital loss). CFO is **alerted immediately** when negative carry exceeds utility *(STI UAT 6.1–6.5; Final check 1)*.
- **ACC-STI-16**: Support **4-digit APY** (e.g. 1,500%) without overflow in DB/UI *(STI UAT 8.2)*.
- **ACC-STI-17**: **Back-dated instrument** triggers a "Catch-up Accrual" that posts all missing daily entries in one batch *(STI UAT 8.3)*.
- **ACC-STI-18**: Changes to APY, Principal or GL mappings create an **immutable audit entry** (User ID, Timestamp, Old, New) *(STI §4.1; UAT 1.4)*.
- **ACC-STI-19**: **Deleting an active instrument is prohibited**. Use **Void**, which auto-reverses all accrual JEs tied to that Instrument ID *(STI §4.1; UAT 1.5, 3.3)*.
- **ACC-STI-20**: Batch must handle **thousands of tranches** using async processing / message queues (e.g. RabbitMQ, SQS) to avoid end-of-day timeouts *(STI §4.2)*.
- **ACC-STI-21**: **Short-Term Liquidity Dashboard** for executive roles. **Total Portfolio Value** = Σ(Principal + Accrued Interest), real-time over active instruments *(STI §5.1; UAT 5.1)*.
- **ACC-STI-22**: Reports: **Daily Yield Report** (interest per instrument, filterable by broker, exportable), **Liquidity Forecast** (maturity timeline, 30/60/90-day inflows), **Variance Analysis** (expected vs actual settled yield, broker payout discrepancies), **Net yield** across mixed +/− rates *(STI §5.2; UAT 5.2, 5.3, 6.4)*.
- **ACC-STI-23**: Multi-entity funds with different functional currency: translation delta to CTA in Equity *(STI UAT 7.5)*.
- **ACC-STI-24**: STI workspace: New placement, **Record maturity**, **Run interest accrual**. KPIs: principal, accrued interest, carrying value, weighted yield, maturing in 30 days. **Maturity ladder** (principal/carrying value by month). Status Held / Maturing soon / New. Instrument types include Treasury Bill 91/182/364-day, Fixed Deposit, Money Market Fund, Commercial Paper, **Call Account** (open maturity) *(UIR 10)*.
- **ACC-STI-25**: Instrument detail: yield (annualised), trade date, maturity date, days remaining, **purchase price** (discount instruments), **interest/accretion schedule (Actual/365)** with purchase, periodic accruals and maturity. Counterparty & custody (custody account, settlement account). GL mapping incl. **Investment Premium/Discount** account. **Evidence documents** (deal confirmation, settlement advice, term sheet, custody statement) *(UIR 10)*.
- **ACC-STI-26**: **Issuer limits & concentration** monitoring: issuer limit, 30-day and 90-day maturity concentration, single-instrument limit, each with limit / current / Compliant or Attention *(UIR 10)*.
- **ACC-STI-27**: Approval history: Entered (Treasury Analyst) → Reviewed (Treasury Manager) → Approved (CFO) *(UIR 10)*.
- **ACC-STI-28**: Interest accrual is a month-end close task *(UIR 12)*.

### 2.9 Fixed assets (FA)

- **ACC-FA-01**: Asset register sub-ledger fields: asset_id, asset_name, purchase_date, cost, **salvage value**, useful_life_years, depreciation_method, accumulated depreciation, current_book_value (= cost − accumulated depreciation, display), asset/accumulated-depreciation/depreciation-expense account FKs, status (In Use, Disposed), lastDepreciationDate *(SRD2 Table 9; TECH A §5.1, B §2)*. CORE adds assetCode, description, location *(CORE Tests 42–43)*.
- **ACC-FA-02**: Register totals must equal the GL cost account and accumulated depreciation account *(TECH B §2)*.
- **ACC-FA-03**: Acquisition JE: Dr Asset / Cr Bank or Creditors Control *(SRD2 §5)*. Acquisition must link to a creditor bill or cashbook payment *(UATV1 INT-5.1; CORE "Asset acquisition journal entries created")*.
- **ACC-FA-04**: Depreciation methods: **Straight-Line** and **Diminishing/Reducing Balance** *(SRD2 §5; TECH A §5.1)*. TECH B says implement SL only initially (C11).
- **ACC-FA-05**: **Automated monthly or annual depreciation run** (`runDepreciationRun`). Monthly = Annual/12. Updates accumulatedDepreciation and posts per asset Dr Depreciation Expense / Cr Accumulated Depreciation *(SRD2 §5; TECH A §5.2; SUPP3 Resources §3)*.
- **ACC-FA-06**: Depreciation only for assets where the current date is after purchaseDate and before the end of useful life *(TECH A §5.2)*. lastDepreciationDate prevents double-posting *(TECH B §2)*.
- **ACC-FA-07**: "Run Monthly Depreciation" button is highly protected, visible only to SysAdmin and HR Manager. Pressing it **locks the accounts until complete** *(TECH B §4.3)*.
- **ACC-FA-08**: Depreciation calculable for a specific asset and period (e.g. "2024-02"). Post monthly for all assets. Asset book values update *(CORE Tests 44–45)*.
- **ACC-FA-09**: **Depreciation preview** by asset class (count, period charge, posting account, journal reference) with **exceptions** (e.g. asset missing in-service date, asset flagged for disposal review). "**Validate depreciation run**" before posting. Export preview (PDF) *(UIR 09)*.
- **ACC-FA-10**: **Disposal**: final JE clears cost and accumulated depreciation and records gain/loss *(SRD2 §5)*. Gain goes to 6000 (sold above NBV). Loss goes to 6050 (below NBV) *(COA 6000/6050)*.
- **ACC-FA-11**: **Transfers** between custodians/locations with transfer history *(UIR 09)*.
- **ACC-FA-12**: Asset master detail: serial number, asset tag, **custodian**, location, acquisition date, **in-service date**, residual value (%), monthly depreciation, documents (asset master file, purchase invoice, GRN), audit log *(UIR 09)*.
- **ACC-FA-13**: Reports: **asset register** (`GET /api/accounting/assets/register`), **depreciation schedule** *(CORE Tests 46–47; UATN "uat 56")*. List view: name, purchase date, original cost, current book value *(TECH B §4.3)*.
- **ACC-FA-14**: Net Book Value reduces correctly on the register after a depreciation run *(UATV1 INT-5.2)*.
- **ACC-FA-15**: Dashboard summary of asset values *(SRD2 UI #2)*.
- **ACC-FA-16**: Impairment and revaluation of fixed assets: **no requirement in any source**. Only investment fair-value revaluation exists (COA 6100/6150). See §7.

### 2.10 Inventory (INV)

- **ACC-INV-01**: Inventory table: item_id, item_name, sku_number (**unique**), cost_of_purchase, quantity_on_hand, inventory_asset_account_id *(SRD2 Table 8; CORE Tests 39–40)*. CORE adds description, reorderLevel, unitOfMeasure, supplierId.
- **ACC-INV-02**: **Perpetual** inventory. A sales invoice with stock items auto-creates the COGS entry Dr Cost of Sales / Cr Inventory Asset and decrements quantity_on_hand in the same operation *(SRD2 §4; User Stories Inventory; CORE Test 52)*.
- **ACC-INV-03**: Stock movements IN / OUT / ADJUSTMENT with movement history. Stock quantity update with reason. Adjustments (physical count) *(CORE Tests 41–42, 48, 50)*.
- **ACC-INV-04**: Inventory valuation, inventory value, dashboard, report, **reorder-level alerts** *(CORE Tests 43–47, 51)*.
- **ACC-INV-05**: COGS calculation method parameter (FIFO in CORE) *(CORE Test 49)* vs **Weighted Average** cost layers *(UIR 08)*. Conflict C24.
- **ACC-INV-06**: Inventory controls: **negative stock prevention** (block issuing), **obsolete item review** (not moved in 180+ days), **count variance approval**, slow-moving value, low-stock items, reserved vs available quantity, ABC classification, linked PO, GL account *(UIR 08)*.
- **ACC-INV-07**: **Month-end valuation**: Opening + Receipts − Issues ± Adjustments = Closing, per warehouse and valuation date, with "Run valuation" *(UIR 08)*.

### 2.11 Expenses & claims, corporate cards, petty cash (EXP)

- **ACC-EXP-01**: Expense categories (name, description, isActive) *(CORE Tests 16–18)*.
- **ACC-EXP-02**: Expenses (vendorId, categoryId, amount, currencyId, transactionDate, description, receiptNumber, isTaxable) with **VAT calculation** and **automatic JEs**. List, filter by category, **expense dashboard** *(CORE Tests 19–23)*.
- **ACC-EXP-03**: Expenses & Claims workspace: New claim, Record expense, **Reimbursement run**. KPIs by status (Unsubmitted, Awaiting manager, Finance review, Approved for payment, Policy exceptions). Tabs All / My team / My approvals / Awaiting my action / Exceptions *(UIR 13)*.
- **ACC-EXP-04**: Claim detail: trip dates, project, cost centre, purpose, VAT treatment. **Itemised expense lines** with receipt flag. **Receipt coverage %**. Attached receipts *(UIR 13)*.
- **ACC-EXP-05**: **Policy controls**: policy exceptions (e.g. hotel rate exceeds limit by $x, missing attendee list), **duplicate detection**, **per-diem rule** *(UIR 13)*.
- **ACC-EXP-06**: **Budget availability check** on the claim: budget (FY), spent to date, this claim, remaining *(UIR 13)*.
- **ACC-EXP-07**: Approval chain Employee → Line Manager → Finance Reviewer → Finance Manager. Actions: **Return for correction**, **Approve with exception**, **Approve** *(UIR 13)*.
- **ACC-EXP-08**: Petty cash: see ACC-CB-24.
- **ACC-EXP-09**: Corporate cards: **no requirement in any source** (see §7).

### 2.12 Budgets & budget control (BUD)

- **ACC-BUD-01**: Command Centre **Actual vs Budget** chart (monthly, per FY) with variance % *(UIR 01)*.
- **ACC-BUD-02**: Financial reports support comparative = **Budget**, with Actual, Budget, Variance and Variance % for month and YTD. **Budget vs Actual** is a standard report *(UIR 11)*.
- **ACC-BUD-03**: **Budget check** is part of supplier-invoice verification and compliance *(UIR 06)*. Budget availability is checked on claims *(UIR 13)*. CoA changes show impact on the "FY2026 Operating Budget" model *(UIR 14)*.
- **ACC-BUD-04**: Events budget approval posts an accrual (see ACC-INT-08).
- **ACC-BUD-05**: Budget creation, versions, owners, alert thresholds and hard/soft stops: **not specified in any accounting source** (see §7). OPM/FP&A may own budgets.

### 2.13 Tax: VAT, withholding, PAYE, CIT/CGT, ZIMRA (TAX)

- **ACC-TAX-01**: VAT codes (e.g. ZIM_STD_15%, ZIM_EXEMPT_0%) on lines. VAT is auto-calculated inline. Users never compute VAT manually *(CB §3.2, §3.4)*.
- **ACC-TAX-02**: Output VAT posts to VAT Output (2100), input VAT to VAT Input (2110). These postings are the raw data for the **monthly/quarterly ZIMRA VAT return** *(CB §3.7)*. COA uses a single 2050 VAT Payable (C6).
- **ACC-TAX-03**: **VAT report** aggregates all VAT-coded transactions into Input Tax (claimable) and Output Tax (payable) and computes net liability *(UATV1 AUD-6.3)*. **Drill-down** from Total Output Tax lists every contributing line *(UATV1 AUD-6.4)*. Output-tax audit endpoint `GET /api/vat/report/output-tax-audit?startDate=&endDate=&currencyId=` *(UATN "uat 50")*.
- **ACC-TAX-04**: P&L shows revenue and expense **net of VAT**. VAT is a balance-sheet liability *(UATV1 REP-7.3)*.
- **ACC-TAX-05**: Compliance with local regulations, particularly VAT and reporting. VAT returns are a statutory report fed by the module *(SRD2 Objective; Integration "Financial Reporting")*.
- **ACC-TAX-06**: **Withholding tax** codes (e.g. "WHT – Services (10%)") on journal lines, posting to a WHT Payable account. WHT treatment requires reviewer confirmation *(UIR 03)*. Payment runs deduct WHT from gross *(UIR 18)*. Supplier-invoice compliance check "Withholding Tax: Review" *(UIR 06)*. Accounts carry a default tax rule *(UIR 14)*.
- **ACC-TAX-07**: **PAYE** (2150) and **NSSA/Pension** (2160) liabilities come from payroll and are cleared on remittance to ZIMRA / fund *(TECH §5; COA 2150/2160)*.
- **ACC-TAX-08**: **Zimbabwe Tax Return Pack** (VAT, PAYE/P2, Withholding Tax, Income Tax, Transfer Pricing tabs): Compile source data → Reconcile → Resolve exceptions → Review → File. Each return box (e.g. Box 1 output VAT, 1a/1b, 4/4a/4b, 5/5a, 11, 12) shows GL amount vs tax schedule amount, difference, evidence count and status (Reconciled/Exception). **Source coverage %**. Exceptions (e.g. missing supplier tax invoices, tax code mismatch) come with recommended correcting journal, assignee, due date, priority. Review chain, working-paper versions, filing history *(UIR 15)*.
- **ACC-TAX-09**: Tax pack initialization per entity/year/period (quarterly estimated QEP_Q1–Q4 or final annual) and tax regime ZIMRA CIT. Pulls **closed** ledger actuals grouped by tax codes (deductible / non-deductible). Blocked if the period has unclosed journals *(TAX §2.1)*.
- **ACC-TAX-10**: **ITF 12C** CIT reconciliation (add back non-deductibles such as entertainment, fines, unpaid accruals, unrealized FX losses; subtract exempt income and capital allowances such as wear & tear). **CGT** schedule with inflation indexation. Liabilities split by **USD and ZiG** in proportion to income received *(TAX §2.2, §2.3, §4)*.
- **ACC-TAX-11**: Tax pack **maker-checker**: DRAFT_REVIEW until an authorized Checker, **different from the Maker**, approves. Sign-off sets SIGNED_OFF, locks schedules read-only, generates a tamper-evident PDF with **SHA-256** stored, and publishes to the LP Portal *(TAX §2.4, §7.2)*.
- **ACC-TAX-12**: On tax pack APPROVED, post Dr Corporate Tax Expense (5500) / Cr Corporate Tax Liabilities–ZIMRA (2210) *(TAX §5.1)*.
- **ACC-TAX-13**: Tax package downloads enforce per-entity access (BOLA protection, `can_read_taxation`). Unauthorized requests get a generic 404 *(TAX §7.1)*.
- **ACC-TAX-14**: Cashbook reference may hold a unique **ZIMRA payment code** *(CB §3.2)*.
- **ACC-TAX-15**: IMTT (Intermediated Money Transfer Tax): **not mentioned in any source** (see §7).

### 2.14 Payroll integration (PAY)

- **ACC-PAY-01**: The Payroll module is the source of truth for calculation. Accounting is the **sole system that receives** the financial entries *(TECH §5)*.
- **ACC-PAY-02**: Payroll Manager clicks "**Approve & Post to GL**", which calls `postPayrollToGL`, which calls `AccountingAPI.createJournalEntry(payload)`. Payload: GrossSalaryTotal, PAYETotal, NSSATotal, NetPayTotal *(TECH §5 steps 1–3)*. Posting is a batch at the end of each payroll period (file or API calls) *(SRD2 Integration "Payroll")*.
- **ACC-PAY-03**: Payroll JE is a **single multi-line document (5–8 lines)**: Dr 5010 Gross Pay / Cr 2150 PAYE / Cr 2160 NSSA/Pension / Cr 2250 Net Wages Payable. Final check: Dr 5010 = Cr (2150+2160+2250) *(TECH §5 mapping; UATV1 INT-5.3/5.4)*. COA adds Dr 5020 Employer Contributions / Cr 2160 *(COA)*.
- **ACC-PAY-04**: Net pay disbursement: `recordBulkPayment(NetPayTotal)` posts Dr Net Wages Payable / Cr Bank. The Net Wages Payable balance returns to zero after all employees are paid *(TECH §5 step 4; UATV1 INT-5.5)*.
- **ACC-PAY-05**: Statutory remittance: `recordBulkPayment(ZIMRATotal)` posts Dr 2150 PAYE / Cr Bank *(TECH §5 step 5)*.
- **ACC-PAY-06**: Payroll bank file: see ACC-CB-37..41 *(BF)*.
- **ACC-PAY-07**: "Payroll posting pending" appears in the control queue. Posting the payroll journal is a close task *(UIR 01, 12)*.

### 2.15 Procurement integration (PRC)

- **ACC-PRC-01**: Purchase Orders automatically create entries in Creditors (bill + JE) via REST API. Accounting pays and reconciles them *(SRD2 Integration "Procurement")*.
- **ACC-PRC-02**: Flow: Procurement bill approval sends vendorID, amountZIG, expenseCOA, billDate to `recordBill` (Dr Expense / Cr AP). Banking payment calls `recordPayment` (Dr AP / Cr Bank) *(TECH B §3.2)*.
- **ACC-PRC-03**: **PO → Creditor Bill**: the bill inherits **line items, quantities and total** from the PO *(UATV1 INT-5.6)*.
- **ACC-PRC-04**: **Three-way match** of Invoice vs PO vs Goods Receipt per line (qty, unit price, tax, amount), with quantity/rate **variance** and per-line result (Matched / Exception) *(UIR 06)*.
- **ACC-PRC-05**: Supplier invoice verification & compliance: **Duplicate check**, **Vendor bank details verified**, **Budget check**, **Withholding tax**, **Three-way match**. Actions: **Return to buyer**, **Approve & schedule** *(UIR 06)*.
- **ACC-PRC-06**: Supplier invoice approval chain Buyer → Finance Review → Approver. Comments, attachments (GRN, terms, warranty), invoice document viewer, audit trail (created, submitted, under finance review, match exception, pending approval) *(UIR 06)*.
- **ACC-PRC-07**: Payment scheduling on approval: pay-from account, payment method (EFT), batch date, estimated payment date, amount. "Payment will be scheduled upon final approval" *(UIR 06)*.
- **ACC-PRC-08**: Overdue indicator on supplier invoices ("28 days overdue") *(UIR 06)*.

### 2.16 FP&A / Performance (OPM) / Portfolio / Events integrations (INT)

- **ACC-INT-01**: Accounting is the **master data source for OPM financial KPIs** *(TECH §6.1)*.
- **ACC-INT-02**: Nightly `triggerDataSync` queries aggregated IS and BS totals and writes to OPM `external_data` *(TECH §6.1)*.
- **ACC-INT-03**: OPM computes ratios (e.g. Net Profit Margin from TotalRevenue and NetIncome) **outside** Accounting via the Accounting API *(TECH §6.1)*.
- **ACC-INT-04**: Synced metrics named in the docs: `TotalRevenue_Q3` = SUM(4010) for the quarter, `OpEx_MonthlyTotal` = SUM(5000–5999) for the month, `IR_EventCosts_Q3` = SUM(5200) linked to event types *(TECH B §3.1–3.3)*. Net Income feeds OPM profitability KPIs *(TECH Glossary II)*.
- **ACC-INT-05**: Due Date on invoices supports OPM goals such as "Reduce Days Sales Outstanding" *(TECH §4.2)*.
- **ACC-INT-06**: **Portfolio fees**: Portfolio calculates management fees (end of quarter) and sends customerID, amountUSD, invoiceDate, revenueCOA (4010). A Cloud Function calls `createInvoice`, which posts Dr AR / Cr 4010. A bank feed detecting the client payment calls `recordPayment` (Dr ZIG bank / Cr AR ± 4900 FX) *(TECH B §3.1)*. Performance fees go to 4020/4002 *(TECH Glossary D; COA 4002)*.
- **ACC-INT-07**: Investments in portfolio companies: Dr 1500 on capital deployment, Cr on disposal. Fair-value revaluation goes to 6100 (gain) / 6150 (loss) *(COA 1500, 6100, 6150)*.
- **ACC-INT-08**: **Events**: budget approval posts Dr 1150 Prepaid / Cr 2200 Event Accrual. The vendor invoice posts Dr 2200 / Cr 2010 AP. Post-event actual cost posts Dr 5200 Marketing/IR / Cr 1150 Prepaid, with Dr/Cr 2200 to clear the remainder *(TECH B §3.3; TECH A §6.2 differs, C23)*.
- **ACC-INT-09**: Tax pack integrates with Cap Table (share transfers for CGT) and publishes to **LP Portal** *(TAX §5)*.
- **ACC-INT-10**: **Group consolidation**: import trial balances per entity, entity status matrix, **intercompany matching** by counterparty pair and account (Matched/Exception/Review, owner). **Elimination journals** with source invoices, reciprocal accounts, FX impact, evidence, comments and approval chain Preparer → Reviewer → Approver. "Request counterparty correction". **Consolidated TB preview** (local TB + adjustments + eliminations = consolidated). Generate statements *(UIR 17)*.
- **ACC-INT-11**: Financial reports support entity, **consolidation (Consolidated)** and **include eliminations** settings *(UIR 11)*.

### 2.17 Financial statements, reports, dashboards & KPIs (REP)

- **ACC-REP-01**: Accounting is the **sole source of truth** for financial data. Reports query journal lines **in real time** *(SRD2 Integration "Financial Reporting")*.
- **ACC-REP-02**: **Trial Balance**: sum base Dr and base Cr per account from journal lines. Two columns. Grand totals must be equal. A non-zero net balance **triggers an alert** *(SRD2 §1 GL Reporting; UATV1 REP-7.1)*. TB for current date or specific date, summary, **grouped by account type**. Handles no-transaction dates and rejects invalid dates *(CORE Tests 90–98)*.
- **ACC-REP-03**: **Income Statement (P&L)**: Revenue and Expense accounts within the period. Net Income = Total Revenue − Total Expenses (before dividends). Monthly standard *(TECH Glossary II; SUPP3 Phase 4; CORE Test 36)*.
- **ACC-REP-04**: **Balance Sheet**: Asset/Liability/Equity balances as of report date. Must prove A = L + E on the final line *(TECH Glossary II; UATV1 SYS-1.5)*. Generate with asOfDate (+ optional currencyId) and `hideZeroBalances` *(UATN "uat 54")*. The balance sheet date must be selectable. UATV1 noted it was "fixed to 31 December" *(UATV1 SYS-1.5 note)*.
- **ACC-REP-05**: BS balances for Bank (1100), Debtors Control (1300) and Creditors Control (2000) must equal the reconciled totals of the Cashbook, Debtors and Creditors sub-ledgers *(UATV1 REP-7.4)*.
- **ACC-REP-06**: **Cash Flow Statement**: operating / investing / financing activities from JEs impacting cash (1100). Cash at end of period **must equal** the TB cash balance, or there is a data-integrity error. Indirect method is typical for operating activities *(SUPP3 CFS drill-downs; TECH Glossary II; CORE Test 37)*.
- **ACC-REP-07**: **Statement of Equity** (monthly): Net Income from IS plus contributions less distributions *(SUPP3 Phase 4)*.
- **ACC-REP-08**: Statements are generated monthly by slicing the TB by CoA range. They are generated only after the monthly TB is confirmed balanced *(SUPP3 Phase 4)*.
- **ACC-REP-09**: **Drill-down everywhere**: any report number or dashboard figure opens the underlying transactions (e.g. Outstanding Invoices opens the Debtors Ageing report, Cash Position opens GL detail, a TB balance opens GL detail including Cashbook/Payroll/Depreciation JEs, and a VAT total opens the lines) *(SRD2 UI #3; UATV1 SYS-1.3, REP-7.2, AUD-6.4)*.
- **ACC-REP-10**: **Dashboard** (SRD2): cash position, total outstanding invoices, total outstanding bills, **top 5 customers by sales**, summary of asset values, using real-time data from sub-ledgers *(SRD2 UI #2; UATV1 SYS-1.2)*. TECH: Cash Balance, AR/AP Summary *(TECH §4.1)*. Financial dashboard endpoint *(CORE Test 38)*.
- **ACC-REP-11**: **Command Centre** (UIR): KPI tiles Cash & Bank, Receivables, Payables, Revenue YTD, Net Income (each vs prior period %). Actual vs Budget chart. **Cash position by currency** (% of total, change). **Control queue** (unreconciled bank items, journals awaiting approval, supplier invoices with exceptions, VAT return pack due, payroll posting pending, each with owner, age/due and action). **Recent postings** (module, status Posted/Pending Approval). **Close readiness** % by area with target close date. "Customise". Footer with audit trail and data integrity links and last data refresh *(UIR 01)*.
- **ACC-REP-12**: **Financial Reports statement builder**: report set (Management Accounts, period), reports P&L, Balance Sheet, Cash Flow, Trial Balance, Budget vs Actual, GL Detail, Tax Schedules, **custom reports**. Settings: entity, period (MTD & YTD), currency, comparative, departments, projects, rounding, notes, consolidation, eliminations. **Report controls**: TB agrees, missing variance comments on material variances, approval pending. Reviewer/Approver, version, generated timestamp. **Generate PDF**, **Export Excel**, **Submit for approval** *(UIR 11)*.
- **ACC-REP-13**: Management accounts P&L layout: Revenue, Cost of Goods Sold, **Gross Profit**, Operating Expenses, **Operating Profit**, Finance Income/Costs, **Profit Before Tax**, Income Tax Expense, **Net Income** *(UIR 11)*.
- **ACC-REP-14**: Aged reports: Debtors Ageing *(UATV1 SYS-1.3)*, Creditors age analysis *(UATN "uat 25")*, AR ageing buckets *(UIR 07)*.
- **ACC-REP-15**: **Personalized reporting / saved filter favourites** per user (name, routeKey, arbitrary filters JSON, sortOrder, CRUD) *(UATN "uat 79")*.
- **ACC-REP-16**: Other named reports: Cashbook Journal *(CB-006)*, reconciliation report/summary *(CORE 71–72)*, credit note report *(CORE 58)*, inventory valuation/report *(CORE 43–46)*, asset register and depreciation schedule *(CORE 46–47)*, expense dashboard *(CORE 23)*, invoice summary *(CORE 31)*, STI Daily Yield / Liquidity Forecast / Variance *(STI §5.2)*, unrealized FX *(UATN)*, VAT output-tax audit *(UATN)*.
- **ACC-REP-17**: Performance: dashboard endpoints within acceptable limits *(CORE Test 76)*.

### 2.18 Audit trail, approvals/workflow, RBAC & SoD (AUD)

- **ACC-AUD-01**: AuditTrail table: audit_id, user_id, action_type (Create/Update/Delete), table_name, record_id, timestamp, details (JSON old/new) *(SRD2 Table 12)*.
- **ACC-AUD-02**: Log every significant action, including creating a journal, editing an account and reconciling a bank line *(SRD2 Integration "Audit Trail")*.
- **ACC-AUD-03**: Void log records original transaction details, void date/time, voiding user ID and **reference to the reversing journal ID** *(UATV1 AUD-6.2)*.
- **ACC-AUD-04**: System audit log view, e.g. last 24 hours across scopes `GET /api/system-audit-log/last-24-hours?scope=all` *(UATN "uat 63")*.
- **ACC-AUD-05**: Financial records are **create-only** (journal_entries, gl_transactions). Update/delete is denied at the data layer *(TECH §2.1; SUPP3 Resources §2)*.
- **ACC-AUD-06**: Every material action shows **owner + timestamp**. Every approval is **maker-checker**. Every exception needs **reason + evidence** *(UIR p3 Governance)*.
- **ACC-AUD-07**: Maker-checker is required on: manual journals *(UIR 03)*, FX revaluation *(UIR 16)*, supplier invoices *(UIR 06)*, payment runs *(UIR 18)*, claims *(UIR 13)*, CoA change sets *(UIR 14)*, close pack *(UIR 12)*, financial report packs *(UIR 11)*, consolidation eliminations *(UIR 17)*, STI placements *(UIR 10)*, STI draft accrual batches (CFO) *(STI §3.3)*, tax packs *(TAX §2.4)*. **Self-approval is blocked** *(UIR 03; TAX §7.2)*.
- **ACC-AUD-08**: Permission-gated actions: 'View Reports' without 'Post Transactions' hides/disables Post/Save on transactional screens *(UATV1 SYS-1.7)*. 'Cashbook Void' permission *(CB §3.3.1)*. COA read/write *(TECH §2.1)*. Depreciation run *(TECH B §4.3)*. STI creation (Treasury Management) *(STI §3.1)*. `transactions` read/write by role and **department** *(TECH §2.1)*.
- **ACC-AUD-09**: Posting-time controls: period open, accounts active, supporting documents attached *(UIR 03)*. Supplier invoice external reference mandatory *(UATV1 AUD-6.5)*.
- **ACC-AUD-10**: Record versioning (journal versions, working-paper versions, CoA versions, report versions) *(UIR 03, 11, 14, 15)*.
- **ACC-AUD-11**: Custom modal pop-ups for confirmations, warnings and quick entry. **No native alert()/confirm()** *(SRD2 UI #6; UATV1 SYS-1.4)*.

### 2.19 Notifications & alerts (NOT)

- **ACC-NOT-01**: RBZ rate fetch failure alerts **SysAdmin** *(TECH §3.1)*.
- **ACC-NOT-02**: TB imbalance alerts the user *(SRD2 §1 GL)*. GL viewer total mismatch shows an error banner to SysAdmin *(TECH B §4.1)*.
- **ACC-NOT-03**: Negative-yield / capital-erosion instruments are flagged on the dashboard and the CFO is alerted immediately *(STI UAT 6.1; Final check 1)*.
- **ACC-NOT-04**: Inventory reorder-level alerts *(CORE Tests 44, 51)* and inventory control alerts (negative stock, obsolete items, count variances) *(UIR 08)*.
- **ACC-NOT-05**: Customer reminders for overdue invoices, invoice email, statement email *(UIR 07; CORE Phase 10)*.
- **ACC-NOT-06**: In-app notification bell with counts. The control queue serves as the actionable notification list *(UIR 01)*.
- **ACC-NOT-07**: STI "Maturing in 30 days" / "Maturing soon" indicators *(UIR 10)*.
- **ACC-NOT-08**: Tax pack published to LP Portal updates the investor dashboard *(TAX §5.2)*.

### 2.20 Data import / export (DATA)

- **ACC-DATA-01**: Bank statement import (CSV or direct feed; JSON or file upload) *(SRD2 §6; CORE Test 66)*.
- **ACC-DATA-02**: COA bulk import with a validate endpoint *(UATN "uat 77")*. "Import mapping" *(UIR 14)*.
- **ACC-DATA-03**: Journal lines "Import from Excel" *(UIR 03)*. Import trial balances for consolidation *(UIR 17)*.
- **ACC-DATA-04**: Exports: Cashbook journal CSV/Excel *(CB-006)*, cashbook audit export by year/month/bank *(UATN "uat 28")*, reports as PDF/Excel *(UIR 11)*, GL export *(UIR 02)*, STI daily yield export *(STI UAT 5.2)*, depreciation preview PDF *(UIR 09)*, FX revaluation download *(UIR 16)*, tax working papers *(UIR 15)*, inventory export *(UIR 08)*.
- **ACC-DATA-05**: Bank payment file CSV (configurable) *(BF)*.
- **ACC-DATA-06**: Payroll data enters as a batch file or API calls per payroll period *(SRD2 Integration "Payroll")*.
- **ACC-DATA-07**: Document attachments: cashbook receipts *(UATN "uat 75")*, JE supporting documents *(UIR 03)*, reconciliation evidence *(UIR 05)*, supplier invoices/GRNs *(UIR 06)*, STI evidence *(UIR 10)*, asset documents *(UIR 09)*, claim receipts *(UIR 13)*, close evidence *(UIR 12)*.

### 2.21 General UI/UX (UI)

- **ACC-UI-01**: Persistent, **collapsible sidebar** (Dashboard, Debtors, Creditors, General Ledger, Reports, Asset Management, etc.) without layout shift *(SRD2 UI #1; UATV1 SYS-1.1)*. TECH menu: Dashboard, Customers (Invoices, Receipts, Directory), Vendors (Bills, Payments, Directory), Banking (Bank Rec, Transfers), Fixed Assets (Register, Depreciation Run), Reports (P&L, BS, GL) *(TECH §4.1)*. UIR sidebar: Dashboard, General Ledger, Cash Book, Sales, Purchases, Bank Reconciliation, Expenses, Inventory, Asset Management, Short-Term Investments, Financial Reports, Settings *(UIR)*.
- **ACC-UI-02**: UI abstracts double-entry. Users work with business documents *(SRD2 UI; TECH §4)*.
- **ACC-UI-03**: Global context bar: entity, period, reporting currency, current rate, search (Ctrl+K), notifications, user *(UIR all)*.
- **ACC-UI-04**: Locked palette: midnight navy #0B1739, cobalt #2563EB, pale sky #D8E8FF, canvas #F5F8FC, pending amber #F59E0B, exception red #DC2626. Blue means completed/approved/posted, amber means pending/review, red means exception/blocked/overdue. **No green/mint/teal/emerald** anywhere *(UIR p2–3)*. Conflicts with TAX §6.1 (C27).
- **ACC-UI-05**: Dense tables before decorative charts. Right drawer for selected record. Process stepper for cross-step workflows *(UIR p3)*.

---

## 3. Scheduled / automated jobs

| # | Job | Trigger / frequency | What it does | GL impact | Idempotency / controls stated | Source |
|---|---|---|---|---|---|---|
| J1 | **syncRBZRate** | Daily at a scheduled time (e.g. **09:00**) | Fetch official RBZ (or reliable provider) USD/ZIG interbank rate. Store in `/config/exchange_rates/{date}` | None | One rate per date (keyed by date). On API failure, reuse **last successfully stored rate** and **alert SysAdmin** | TECH §3.1; STI §3.1 "daily exchange rate sync" |
| J2 | **STI daily accrual engine** | Daily **23:59 tenant timezone** | Compute daily appreciation for all active instruments per method (simple/compound daily/compound monthly) and day count, using effective-dated rate. Translate foreign interest at day's spot rate | Dr Accrued Interest Receivable / Cr Interest Income. Negative yield: Dr Interest Expense (or contra-revenue) / Cr AIR. Posted as **Draft** (CFO approves batch) or **Approved** (direct) per CFO config | Must not be re-affected by later rate edits (8.1). Async queue for thousands of tranches. Leap-year safe. Tenant-TZ fiscal date | STI §2.2, §3.2, §3.3, §4.2; UAT 2.1–2.5, 3.1–3.4, 6.2–6.3, 8.1–8.4 |
| J3 | **STI catch-up accrual** | On back-dated instrument entry (offered to user) | Post all missing daily accruals in a single batch | As J2 | Must fill only missing days (no duplicates implied) | STI UAT 8.3 |
| J4 | **STI month-end unrealized FX revaluation** | Month end | Compare principal + accrued at original rate vs month-end closing rate | Dr/Cr 6060 Unrealized FX G/L, Cr/Dr 1510 ST Investment (carrying value). Multi-entity: delta to CTA (Equity) | Not stated | STI UAT 7.2, 7.3, 7.5 |
| J5 | **Period-end FX revaluation (monetary items)** | Period end (monthly/quarterly). **Not daily** | Revalue foreign-currency monetary accounts at approved closing rates. Build preview journal | Dr/Cr foreign-currency account, Cr/Dr Unrealized FX Gain/Loss (P&L), e.g. Dr USD Bank / Cr Unrealized FX Gain | Maker-checker. Missing/unapproved rates block the line. Threshold USD 10.00. Round to cent. Balanced preview | TECH Glossary IV; UATV1 GL-2.6; UIR 16 |
| J6 | **runDepreciationRun** | Automatically **monthly** (or annually per policy). Also a protected manual button | For each asset in life, compute period depreciation (annual/12 monthly), update accumulatedDepreciation and NBV | Per asset: Dr Depreciation Expense / Cr Accumulated Depreciation | `lastDepreciationDate` prevents double-posting. Only after purchaseDate and before end of useful life. **Locks accounts** while running. UIR requires preview + "Validate depreciation run" with exceptions | SRD2 §5; TECH A §5.2, B §2, B §4.3; SUPP3 Resources §3; UIR 09 |
| J7 | **triggerDataSync (OPM ETL)** | **Nightly** | Aggregate IS/BS totals (e.g. SUM 4010 per quarter, SUM 5000–5999 per month, SUM 5200 per event type). Write to OPM `external_data` | None | Not stated (overwrite of period aggregates implied) | TECH §6.1, B §3.1–3.3 |
| J8 | **Portfolio fee invoicing** | Portfolio signal, e.g. **end of quarter** | Cloud Function calls `createInvoice(payload)` with fee data | Dr AR (1100/1300) / Cr 4010 Management Fee Revenue | Not stated | TECH B §3.1 |
| J9 | **Bank feed ingestion / matching** | Continuous or polled ("bank feed detects incoming payment"; "direct feed"; "Last bank feed" timestamp) | Import statement lines. Auto-match to ledger by date/amount/reference and rules. Detected client payments call `recordPayment` | recordPayment: Dr Bank / Cr AR ± FX Gain/Loss. Matching itself has no GL impact | Frequency not specified. Duplicate-line handling not specified | SRD2 §6; TECH B §3.1 step 3; UIR 04, 05 |
| J10 | **Payroll posting** | End of each payroll period (batch), on "Approve & Post to GL" | Create single multi-line payroll JE | Dr 5010 / Cr 2150, 2160, 2250 (± Dr 5020 / Cr 2160) | Balanced check. Duplicate-post protection not stated | SRD2 Integration; TECH §5 |
| J11 | **Realized FX gain/loss auto-post** | Event: invoice/bill settlement in a different rate/currency | Compute base difference vs original booking | Gain: Dr Debtors Control (or Bank) / Cr FX Gain. Loss: Dr FX Loss / Cr control | Runs once per settlement. JE shape conflicts (C14) | SRD2 §2; TECH §3.2; UATV1 GL-2.7 |
| J12 | **Events accrual postings** | Events signals (budget approved, vendor invoice, event closed) | Accrual, AP recognition, expense recognition | See ACC-INT-08 | Not stated | TECH A §6.2, B §3.3 |
| J13 | **Tax accrual posting** | Tax pack status → APPROVED | Post tax accrual | Dr 5500 Corporate Tax Expense / Cr 2210 Tax Liabilities–ZIMRA | Checker ≠ Maker. Pack locked (SHA-256) | TAX §5.1, §2.4 |
| J14 | **Prepaid amortisation** (implied) | Monthly | Amortise prepaid rent to expense | Dr 5100 Rent Expense / Cr 1400 Prepaid Rent | Not stated. Implied by "Upon monthly amortization" | COA 1400 |
| J15 | **Recurring journals** (implied) | Not stated | Referenced only ("Recurring Journals", "Used by 3 recurring journals", "Monthly accruals") | Per template | Not specified | UIR 11, 14 |
| J16 | **AR reminders / statements** (partly implied) | Not stated (UIR shows "Reminder sent (Overdue – 7 days)") | Send overdue reminders, invoice emails ("by System"), customer statements | None | Not specified | UIR 07; CORE Phase 10 |
| J17 | **Inventory reorder / obsolescence checks** | Not stated (on-demand endpoint in CORE) | Reorder-level alerts. Items not moved in 180+ days flagged | None | Not specified | CORE Tests 44, 51; UIR 08 |
| J18 | **Integrity monitors** | Continuous / on report | TB Dr ≠ Cr triggers alert. GL viewer total mismatch shows SysAdmin banner. CFS cash end ≠ TB cash raises an integrity error | None | n/a | SRD2 §1; TECH B §4.1; SUPP3 CFS |
| J19 | **Liquidity forecast / maturity alerts** | Real-time dashboard | Maturities in 30/60/90 days. "Maturing in 30 days" | None | n/a. Maturity **settlement is user-initiated** (not automatic) | STI §3.4, §5.2; UAT 5.3; UIR 10 |

Jobs that are **absent** from the documents but were asked about: period-close reminders (only a checklist with due dates, UIR 12), budget alerts (none), STI rollovers (none), bank statement polling schedule (frequency unspecified).

---

## 4. Calculations and formulas (as written in the sources)

**Double-entry and statements**
- Accounting equation: Assets = Liabilities + Owner's Equity *(SRD2 §1)*.
- Debit increases Asset/Expense and decreases Liability/Equity/Income. Credit is the reverse *(SRD2 §2; TECH §1; SUPP3 Phase 1)*.
- Per journal: Σdebit_amount = Σcredit_amount **and** Σbase_debit_amount = Σbase_credit_amount *(SRD2 Table 3)*. "DebitTotal = CreditTotal" *(TECH §1)*.
- Base amount = amountForeign × exchangeRate *(TECH B §4.2)*. Example: 5,000 USD × 320.00 = 1,600,000 ZIG *(TECH §2.2)*.
- Trial Balance = Σ base_debit and Σ base_credit per account. Total Dr = Total Cr *(SRD2 §1 GL)*.
- Net Income = Total Revenue − Total Expenses (before dividends) *(TECH Glossary II; SUPP3 IS)*.
- Equity end = Equity start + Net Income (+ contributions − distributions) *(SUPP3 BS §2; Phase 4)*.
- CFS: Net increase in cash = A (Operating) + B (Investing) + C (Financing). Cash end = Cash begin + Net increase, which must equal the TB cash balance *(SUPP3 CFS D)*.
- Consolidated = Local TB (sum) + Adjustments + Eliminations. Variance must be 0.00 *(UIR 17)*.

**FX**
- Realized (AR, SRD2): Forex Gain/Loss = Σ base received − original invoice base value. E.g. (1,000×27 + 1,000×30) − 2,000×27 = 57,000 − 54,000 = **3,000 ZWL gain**, posted Dr Debtors Control / Cr FX Gain/Loss *(SRD2 §2 step 3)*.
- Realized (TECH): difference = received ZIG − expected ZIG = 340,000 − 320,000 = +20,000. JE Dr Bank 340,000 / Cr AR 320,000 / Cr FX 20,000 *(TECH §3.2)*.
- Realized (AP): 500 USD × (52 − 50) = 1,000 ZIG loss. Creditor closed at 25,000 *(UATV1 GL-2.7)*.
- Unrealized: 1,000 USD × (55 − 50) = 5,000 ZIG gain. Bank base becomes 55,000 *(UATV1 GL-2.6)*.
- FX revaluation line: gain/(loss) = revalued value (foreign balance at closing rate) − book value (foreign balance at book rate). Post only if |gain/(loss)| ≥ threshold USD 10.00. Round to nearest cent *(UIR 16)*.
- STI: unrealized = (Principal + Accrued) at month-end closing rate − same at original rate *(STI UAT 7.2)*. Realized on maturity = total ZiG received − total ZiG carrying value *(STI UAT 7.4)*.

**Short-term investments**
- Simple daily accrual: "Principal × (APY / Day Count Convention)" *(STI UAT 2.2, verbatim; the denominator is the convention's year basis 360/365)*.
- Compound daily: interest on (principal + previously accrued balance) *(STI UAT 2.3)*.
- Day counts: Actual/360, Actual/365 (leap day 366 handled), 30/360 *(STI §3.1, UAT 2.4)*.
- Final interest on liquidation: partial-day interest up to the exact liquidation date *(STI §3.4)*.
- Settlement cash = Principal + Total Accrued Interest *(STI §3.4)*.
- **Total Portfolio Value = Σ(Principal + Accrued Interest)** over active instruments *(STI §5.1)*.
- Net Yield = aggregate of positive and negative appreciation across the fund *(STI UAT 6.4)*.
- Accretion (UIR 10 example, Actual/365): carrying value = purchase price + accumulated accretion. At maturity it equals face (e.g. 1,188,750 → 1,261,640). Discount/premium goes to account 1220 *(UIR 10)*.
- Concentration limits (UIR 10 example values): issuer limit 20%, 30-day maturity concentration 25%, 90-day maturity concentration 60%, single-instrument limit 20% of portfolio *(UIR 10)*.

**Fixed assets**
- Straight-Line: Depreciation = (Cost − Salvage Value) / Useful Life *(SRD2 §5; TECH A §5.2)*. Monthly = Annual / 12 *(TECH A §5.2)*. Check: (48,900 − 4,890) / 5 / 12 = 733.50/month *(UIR 09)*.
- Diminishing Balance: Depreciation = Book Value × Depreciation Rate *(SRD2 §5)*.
- Current Book Value (NBV) = Cost − Accumulated Depreciation *(TECH A §5.1, B §2)*.
- Disposal: gain if proceeds > NBV (Cr 6000). Loss if proceeds < NBV (Dr 6050). Clear cost (Cr asset) and accumulated depreciation (Dr 1550) *(COA; SRD2 §5)*.

**Cashbook & reconciliation**
- netAmount = amount (gross) − vatAmount *(CB §3.2)*. With VAT-inclusive gross, VAT = gross × r / (1 + r). Example: 690 at 15% gives VAT 90, net 600 *(UATV1 CB-3.1, derived from the example)*.
- Remaining to Allocate = Total Amount − Σ(line gross). Must be 0 to save *(CB §3.3.3, §3.5)*.
- Receipt: Dr Bank = Total. Cr = Σ net + Σ VAT. Payment is the mirror *(CB §3.5)*.
- Tick recon: **Calculated Cleared Balance = GL Bank Balance − Total Un-ticked Items**. Finalize iff Cleared Balance = User-entered Statement Ending Balance (difference must be 0) *(CB §3.3.4)*.
- Session recon: reconciledBalance = openingBalance + totalSelectedReceived − totalSelectedPaid. difference = statementEndBalance − reconciledBalance. Finish allowed iff |difference| ≤ 0.01 and ≥1 line selected *(UATN; example 0 + 100 − 40 = 60)*.
- Recon auto-match rules (examples): exact reference. |amount variance| ≤ $50 and |date diff| ≤ 2 days. Narrative contains "bank charge"/"fees" and amount ≤ $150. Suggestion confidence % *(UIR 05)*.

**AR/AP, tax, payroll**
- Invoice line total = quantity × unit_price *(SRD2 Table 7)*. Line tax = line total × taxRate% (15%) *(CORE Test 24)*.
- Credit note total = amount + vatAmount (e.g. 100 + 15 = 115) *(CORE Test 54)*.
- Payment run: Net payment = Gross − WHT (31,126.00 − 3,150.00 = 27,976.00). The WHT base is not stated. 3,150 is 10% of 31,500 in UIR 03 but about 10.1% of the 31,126 gross in UIR 18 *(UIR 18, UIR 03)*.
- VAT: Net VAT payable = Output VAT − Input VAT (76,420 − 38,000 = 38,420). Imports VAT 1,250 is shown but not deducted in the example *(UIR 12, 15)*.
- Payroll: Dr 5010 Gross = Cr 2150 PAYE + Cr 2160 NSSA/Pension + Cr 2250 Net Pay *(TECH §5)*.
- CIT: I_taxable = P_accounting + ΣD_i − ΣE_j. L_CIT = I_taxable × 24.0% *(TAX §4.1)*.
- CGT: C_adjusted = C_original × (1 + 0.025 × t_years). G = max(0, S_price − C_adjusted). L_CGT = G × 20.0% (unlisted securities) *(TAX §4.2)*.
- ETR_weighted = (T_USD × R_closing + T_ZiG) / (I_USD × R_closing + I_ZiG) × 100% *(TAX §4.3)*.

**Ageing & KPIs**
- AR ageing buckets: Current (0–30), 1–30 days, 31–60 days, 61+ days *(UIR 07, overlapping as written, C31)*. Days overdue = today − due date *(UIR 06/07)*.
- DSO: shown with target ("38 days, Above target"). **No formula given** *(UIR 07; TECH §4.2)*.
- Net Profit Margin = NetIncome / TotalRevenue. Computed in OPM, not Accounting *(TECH §6.1)*.
- KPI tiles: Cash & Bank, Receivables, Payables, Revenue YTD, Net Income, each with % change vs prior month or prior-year YTD *(UIR 01)*. Cash position by currency % of total *(UIR 01)*.
- Budget remaining = Budget − Spent to date − This claim (120,000 − 78,430.20 − 1,842.60 = 39,727.20) *(UIR 13)*.
- Variance = Actual − Budget. Variance % = Variance / Budget (YTD column example: 4,722,840 vs 4,320,000 gives +9.32%) *(UIR 11)*.
- Inventory: Closing = Opening + Receipts − Issues + Adjustments (1,196,220 + 224,860 − 123,560 − 12,860 = 1,284,660). Weighted-average unit cost from cost layers *(UIR 08)*.
- Available after commitments = closing balance − upcoming obligations. **Not reproducible from the mock numbers** *(UIR 04)*.
- Close readiness % / completion % = completed controls / total (e.g. 11 of 15). The exact weighting is unclear (74% shown vs 73%) *(UIR 01, 12)*.
- Receipt coverage % = receipted lines / total lines (definition implied) *(UIR 13)*.

---

## 5. Acceptance criteria

### 5.1 From `accounting_uats.txt` (UATN)

The file references a numbered UAT list that is not in any provided source. Expected results below are taken from the note text. Where the note gives only an endpoint, the expected result is "the endpoint returns the described data and the UI uses it".

| ID | Subject | Expected result |
|---|---|---|
| UAT-00a | Add Banks under Settings | Banks can be listed (incl. inactive), created (name, unique accountNumber, currency, asset GL), read, updated and soft-deleted (isActive=false, GL unlinked). GL dropdown shows only asset GLs not already linked. One bank per GL |
| UAT-00b | Invoice creation | The exchange-rate field is **removed** from the invoice creation form (rate derived by the system) |
| UAT-07 | Cashbook entry search | Cashbook entries filter by date range, currency, min/max amount, free-text search, with pagination |
| UAT-13 | Bank reconciliation display & sessions | Recon display for bank + period-end date. Session lifecycle list → create draft → get/patch → finish (only when balanced ±0.01 with ≥1 line) or discard. Finished entries become reconciled |
| UAT-25 | Creditors age analysis | Creditors ageing report available as of a chosen date |
| UAT-28 | Cashbook audit export | Export of cashbook audit data by year, month and bank |
| UAT-33 | Equivalent amount | Document shows the **equivalent amount at creation** in the other currency (amount + currency) |
| UAT-36 | Currency conversion | Response/UI shows the converted-currency data |
| UAT-50 | VAT output-tax audit | Output tax audit report by date range and currency |
| UAT-54 | Balance sheet | Balance sheet generated for a chosen as-of date (and optional currency) with option to hide zero balances |
| UAT-56 | Asset register | Asset register report available |
| UAT-63 | System audit log | Audit log of the last 24 hours across all scopes is viewable |
| UAT-75 | Receipt attachment | A receipt/document file can be attached to a cashbook entry |
| UAT-77 | COA bulk import | COA file can be uploaded and validated before import |
| UAT-79 | Personalized reporting | Users can save, list, open, update, reorder and delete **saved filter favourites** per screen (routeKey). Opening one replays its filters |
| UAT-95 | Batch pay | Multiple purchase invoices are paid in one batch (method, bank, date, reference, notes) |
| UAT-00c | Unrealized FX report | Unrealized FX gains/losses report as of a date (default today) |

### 5.2 Client UAT script V1 (UATV1)

Status is from the run log in the docx, dated around Nov 2025. It is historical and is kept here for triage only.

| ID | Test | Expected result | V1 status |
|---|---|---|---|
| SYS-UAT-1.1 | Consistent navigation | Persistent sidebar on all screens. Collapse/expand works without layout shift | Fail (no AP; collapse broken) |
| SYS-UAT-1.2 | Dashboard KPIs | Cash Position, Total Outstanding Invoices, Total Outstanding Bills, Top 5 Customers by Sales, accurate and real-time from sub-ledgers | Fail |
| SYS-UAT-1.3 | Drill-down (dashboard) | Clicking summary figures opens the underlying sub-ledger/GL detail (e.g. Debtors Ageing) for every figure | Fail |
| SYS-UAT-1.4 | Modal pop-ups | Custom modals for confirmations/warnings. No native alert()/confirm() | Pass |
| SYS-UAT-1.5 | Core equation | Balance Sheet final line shows A = L + E | Pass (date fixed to 31 Dec) |
| SYS-UAT-1.6 | Workflow guidance | Open invoice has "Record Payment" that goes to Cashbook Receipt with customer and amount pre-filled | Fail |
| SYS-UAT-1.7 | Role restriction | 'View Reports' / 'No Post' user cannot Post/Save transactions and can only view/run reports | Fail (roles needed) |
| GL-UAT-2.1 | COA type constraint | Save is blocked when account number range conflicts with type | Fail |
| GL-UAT-2.2 | JE unbalanced | Immediate failure with "Double-Entry Balance Failed. Total Debits ($100.00) must equal Total Credits ($99.00)." | Pass (message not shown) |
| GL-UAT-2.3 | JE balanced | Posts. GL balances for 5100 and 1100 update immediately | Pass |
| GL-UAT-2.4 | Multi-currency display | Shows USD 100.00, rate 50.00 and ZIG 5,000.00 | Fail |
| GL-UAT-2.5 | FX rate date | Uses last valid rate as of transaction date or requires the valid rate. Later rates are not used | Fail |
| GL-UAT-2.6 | Unrealized FX | Revaluation at 55 posts Dr USD Bank / Cr Unrealized FX Gain 5,000. Bank base becomes 55,000 | Fail |
| GL-UAT-2.7 | Realized FX | Bill 500 USD at 50 paid at 52 gives Realized FX Loss 1,000 ZIG (expense). Creditor closed at 25,000 | Fail |
| GL-UAT-2.8 | Mandatory reference | JE cannot save with both Reference and Description empty | Pass |
| CB-UAT-3.1 | Multi-line allocation | Posting blocked while Remaining to Allocate ≠ 0. Outstanding shown | Fail |
| CB-UAT-3.2 | Final allocation & post | Posts. Cr Bank 1,150. Dr lines (net + VAT) total 1,150 | Fail |
| CB-UAT-3.3 | Receipt vs AR | Allocation modal. $500 on $600 invoice leaves Partially Paid, $100 remaining | Fail |
| CB-UAT-3.4 | VOID restriction | Reconciled item cannot be voided: "Transaction must be unreconciled before voiding." | Fail |
| CB-UAT-3.5 | VOID execution | After unreconcile, void sets status VOIDED and auto-reversing JE restores GL, with history preserved | Fail |
| CB-UAT-3.6 | Payment vs AP | Allocation. $800 on $1,000 bill leaves Partially Paid, $200 remaining | Fail |
| CB-UAT-3.7 | Keyboard posting | Full entry and post via keyboard shortcut (F5/Ctrl+S) without mouse | (blank) |
| CB-UAT-3.8 | Owner's equity receipt | Dr Bank / Cr Equity 20,000 with exempt VAT. VAT module shows zero impact | Fail |
| REC-UAT-4.1 | Recon display | GL Bank Balance, Total Un-ticked, Calculated Cleared Balance, updated in real time | Fail |
| REC-UAT-4.2 | Finalize mismatch | $0.01 difference means Finalize is disabled/blocked with the exact difference shown | Fail |
| REC-UAT-4.3 | Finalize success | Exact match finalizes. Ticked items get isReconciled=true and reconciliationDate | Fail |
| REC-UAT-4.4 | Post-recon lock | Back-dated JE into reconciled period is warned, preferably prevented | Fail |
| INT-UAT-5.1 | Asset acquisition | Balanced JE Dr Fixed Asset (12xx) / Cr Creditors Control or Bank, linked to bill or payment | Fail |
| INT-UAT-5.2 | Depreciation posting | Balanced JE Dr Dep Exp (5xxx) / Cr Acc Dep (1xxx). NBV reduced on register | Fail |
| INT-UAT-5.3 | Payroll gross | Full gross pay debited to 5010 | Fail |
| INT-UAT-5.4 | Payroll liabilities | Credits split to 2150, 2160, 2250 | Fail |
| INT-UAT-5.5 | Wages clearing | Dr 2250 / Cr Bank. 2250 returns to zero | Fail |
| INT-UAT-5.6 | PO → Bill | Bill inherits PO lines, quantities and total ($500) | Fail |
| AUD-UAT-6.1 | Post-posting edit | Posted invoice cannot be edited. Only Credit Note corrects it | Pass |
| AUD-UAT-6.2 | Void audit log | Log holds original details, void timestamp, user and reversing JE ID | Fail |
| AUD-UAT-6.3 | VAT report | Input vs Output totals and net liability over the quarter | Fail |
| AUD-UAT-6.4 | VAT drill-down | Total Output Tax opens every contributing line | Fail |
| AUD-UAT-6.5 | Supplier invoice no. | Bill cannot post without Supplier Invoice Number | Pass |
| AUD-UAT-6.6 | GL running balance | GL Detail for 1100 shows running balance per transaction | Fail (partial) |
| REP-UAT-7.1 | TB accuracy | Dr total = Cr total | Pass |
| REP-UAT-7.2 | TB drill-down | Account balance opens GL detail with all source JEs | Fail |
| REP-UAT-7.3 | P&L excl. VAT | P&L shows net amounts. VAT sits on BS | Fail |
| REP-UAT-7.4 | BS integrity | BS 1100/1300/2000 equal reconciled Cashbook/Debtors/Creditors totals | Fail |
| REP-UAT-7.5 | Multi-currency reporting | Transaction and base columns are accurate (posting rate or revaluation rate) | (blank) |
| REP-UAT-7.6 | Draft exclusion | Draft/unposted docs are excluded from BS and P&L | (blank) |

### 5.3 STI UAT suites (STI)

| ID | Expected result |
|---|---|
| STI-1.1 | Money Market instrument saved with dimensions and auto alphanumeric ID |
| STI-1.2 | Day-count convention locked per instrument |
| STI-1.3 | Save blocked without Settlement Cash Account (flagged mandatory) |
| STI-1.4 | APY update saved with immutable audit (user, old, new, timestamp) |
| STI-1.5 | Delete of active instrument hard-blocked. Must use Void |
| STI-2.1 | 23:59 cron processes all active instruments |
| STI-2.2 | Simple accrual = Principal × (APY / day-count basis) |
| STI-2.3 | Compound daily over 3 days accrues on principal + accrued |
| STI-2.4 | Actual/365 leap-year day 366 processed without error |
| STI-2.5 | Effective-dated rate change: old rate before, new rate from effective date |
| STI-3.1 | Accrual drafts Dr Accrued Interest Receivable / Cr Interest Income |
| STI-3.2 | Draft mode needs CFO batch approval. Approved mode posts immediately |
| STI-3.3 | Void auto-reverses all posted interest |
| STI-3.4 | ZAR instrument: interest in ZAR, translated at daily spot |
| STI-4.1 | Early liquidation: partial-day interest to exact date |
| STI-4.2 | Maturity JE: Dr Operating Cash / Cr ST Investment Principal / Cr Accrued Interest |
| STI-4.3 | Settlement bank ledger = principal + all accrued |
| STI-5.1 | Total Portfolio Value = Σ active principal + unsettled accrued, real-time |
| STI-5.2 | Daily Yield Report filtered by broker, exportable |
| STI-5.3 | Liquidity Forecast maps maturities to 30/60/90-day inflows |
| STI-6.1 | Negative APY accepted and flagged "Capital Erosion" |
| STI-6.2 | Negative accrual reduces accrued balance |
| STI-6.3 | GL flips: Dr Interest Expense (or negative revenue) / Cr AIR |
| STI-6.4 | Net yield aggregates mixed +/− across the fund |
| STI-6.5 | Liquidation payout < principal recognised (capital loss) |
| STI-7.1 | USD interest translated to ZiG at that day's mid-market spot |
| STI-7.2 | Month-end revaluation compares original vs closing rate on P + AI |
| STI-7.3 | Posts delta Dr/Cr 6060 FX G/L, Cr/Dr 1510 ST Inv (carrying value adjusted) |
| STI-7.4 | Realized FX on maturity = ZiG received − ZiG carrying value |
| STI-7.5 | Subsidiary with different functional currency: delta to CTA (Equity) |
| STI-8.1 | 12:00 APY override does not change previous 23:59 accrual |
| STI-8.2 | 1,500% APY without numeric overflow (DB/UI) |
| STI-8.3 | Back-dated entry offers Catch-up Accrual in one batch |
| STI-8.4 | Cron runs on tenant timezone, not server UTC |

### 5.4 Endpoint smoke acceptance (CORE)

These are phase-level expected results of the backend test guide:

| Phase | Expected results |
|---|---|
| 1 Setup | Models/relations valid. Currencies created with **unique codes** and symbols. COA accounts created, typed, **unique numbers** |
| 2 Customers/Vendors | Created. **Unique customer email**. Credit limits stored. Vendor payment terms stored. **Unique vendor tax numbers**. List/get/update work |
| 3 Expenses | Categories with active status. Expenses created with **VAT calc** and **automatic JEs**. Category filter. Accurate dashboard |
| 4 Invoices | Created with accurate tax and auto JEs. DRAFT→SENT only from DRAFT. SENT→PAID only from SENT with method. Any→VOID with reason. Summary accurate |
| 5 JEs & reports | Manual JEs created/retrieved/date-filtered/posted. Auto JEs from expenses and invoices visible. IS, CFS and dashboard correct |
| 6 Inventory | **Unique SKU**. CRUD, filter/paginate. IN/OUT movements update qty with history. Valuation, reorder alerts, COGS, adjustments. Sales invoice reduces stock and posts COGS JEs |
| 7 Assets | Created with acquisition JEs. Per-asset and monthly depreciation JEs. Book values updated. Register and schedule |
| 8 Multi-currency | Historical rates. Conversion. Multi-currency payment. Forex G/L calculated and posted |
| 9 Credit notes | Unique numbers. JEs. Send. Apply to invoice with JEs. Reports, per customer |
| 10 Statements | All customers/vendors × all currencies, labelled, correct opening/closing. **Email** operational |
| 11 Bank rec | Upload (JSON/file) with balances validated. Unmatched and suggestions. Manual reconcile. JE from statement line. Reports/summary. Audit trail |
| 12 TB | Current/specific date. Summary. By account type. Empty-date and invalid-date handling |
| 12–14 Integration/Errors/Final | End-to-end cycle works. Data consistency. Graceful errors and validation. Acceptable performance. All endpoints accessible |

---

## 6. Roles & permissions defined in the documents

| Role (as named) | Source | Can do / owns |
|---|---|---|
| **Bookkeeper** | SRD2 User Stories | Manual JEs, AR receipts (incl. cross-currency), customer statements, supplier invoices & payments, asset disposal, bank statement import/match, JE from statement line |
| **Accountant** | SRD2; CB user stories; UIR header | Trial Balance. Cashbook entries (rent, multi-line). Reconciliation. Cashbook journal |
| **Finance Manager** | SRD2; UIR 06/13/18 | Wants auto FX G/L. Creates assets. Auto depreciation. Finance review of supplier invoices/claims. Payment-run reviewer |
| **Sales Administrator** | SRD2 | Create USD invoices. Issue credit notes |
| **Warehouse Manager** | SRD2 | Real-time stock counts |
| **Business owner** | CB CB-002 | Record capital contributions |
| **Cashier** | CB CB-003 | Record customer payments in Cashbook |
| **Financial manager** | CB CB-006 | View cashbook journal / running balance |
| **SysAdmin** | TECH §2.1, §3.1, B §4.1, B §4.3 | COA read/write. Receives RBZ-failure alerts and GL integrity banners. Runs depreciation |
| **HR Manager** | TECH §2.1, B §4.3 | COA read/write. Runs depreciation (as written, C26) |
| **Payroll Manager** | TECH §5 | Runs payroll calc. "Approve & Post to GL" |
| **Payroll administrator** | BF §2.0 | Generates payroll bank file |
| **Treasury Management** (role) | STI §3.1 | Only role that creates/defines short-term investments |
| **CFO** | STI §3.3, §5; UIR 10; TAX §2.4 | Configures STI Draft/Approved posting. Approves Draft accrual batches. Approves placements. Receives capital-erosion alerts. Tax-pack final sign-off |
| **Executive roles** | STI §5 | Access Short-Term Liquidity Dashboard |
| **Treasury Analyst / Treasury Manager** | UIR 10 | Enter / review STI placements |
| **Treasury** (rate approver) | UIR 16 | Approves closing FX rates |
| **Preparer / Reviewer / Final approver** | UIR 03 | Journal maker-checker chain |
| **Close owner**, task owners | UIR 12 | Own the period close and workstream tasks |
| **Reconciliation owner** | UIR 14, 05 | Per-account recon ownership. Exception owner |
| **Buyer / Finance Review / Approver** | UIR 06 | Supplier invoice chain |
| **Employee / Line Manager / Finance Reviewer / Finance Manager** | UIR 13 | Claims chain |
| **Finance Manager (Reviewer) / Finance Director (Final approver)** | UIR 18 | Payment run chain |
| **Operations Tax Manager / Institutional Tax Accountant / Fund Controller** | TAX §2 | Initialise tax packs. Compute schedules. Dual-currency cost basis |
| **Maker / Checker** | TAX §2.4, §7.2; UIR | Checker must differ from Maker |

**Permissions / segregation-of-duties rules stated**
- SoD-1: A user **cannot approve their own entry** (journals) *(UIR 03)*. Tax pack Checker ≠ Maker *(TAX §7.2)*.
- SoD-2: 'View Reports' without 'Post Transactions' cannot post or save transactional records *(UATV1 SYS-1.7)*.
- SoD-3: Voiding cashbook items requires the **'Cashbook Void'** permission *(CB §3.3.1)*.
- SoD-4: COA write limited (SysAdmin, HR Manager) *(TECH §2.1)*. CoA changes go through change-set approval *(UIR 14)*.
- SoD-5: Depreciation run limited to SysAdmin and HR Manager *(TECH B §4.3)*.
- SoD-6: Only Treasury Management creates STIs. CFO approves draft accrual batches *(STI §3.1, §3.3)*.
- SoD-7: `transactions` access is by role **and department** *(TECH §2.1)*.
- SoD-8: Tax pack access is scoped per legal entity (`can_read_taxation`) *(TAX §7.1)*.
- SoD-9: Bank-file generation is locked until final payment-run approval *(UIR 18)*.

---

## 7. Ambiguities and gaps (not resolved)

1. **Missing master UAT list.** accounting_uats.txt refers to UATs 7…95 by number, but no source contains that numbered list. UATV1 uses different IDs (SYS/GL/CB/REC/INT/AUD/REP). Mapping UATN numbers to business test cases is impossible from the documents.
2. **Base/functional currency** is undecided across ZWL, ZIG and USD (C1). ZWL is also obsolete naming for ZiG, yet it is still seeded and returned by the API (UATN `code: "ZWL"`).
3. **Account codes conflict** across TECH, COA, SUPP3, CB, STI and UIR (C3–C10). There is no single mapping table for system-posted accounts (FX gain/loss, VAT input/output, net wages, AR/AP control).
4. **Realized FX JE shape** (separate JE vs third line) and whether the gain is posted per receipt or only at full settlement (C14).
5. **Unrealized FX**: which accounts count as monetary. Whether revaluation auto-reverses next period (not stated). Daily vs period-end (C13). Posting to "Unrealized FX Gain (P&L)" vs a separate unrealized account.
6. **Rate direction and source hierarchy**: RBZ interbank vs "approved treasury rates" vs manual entry (C22). Behaviour when no rate exists for a date (UIR shows a "Missing rate" exception but no fallback rule besides TECH's last-stored rate).
7. **Journal lifecycle**: drafts editable vs immutable posted JEs (C30). Void semantics for manual JEs (CORE "void" vs reversal-only). Reversal dating for non-cashbook voids is unspecified.
8. **Recurring journals and reversing (auto-reverse) journals**: referenced in UIR only, with no behaviour, frequency or approval rules.
9. **Period management**: no spec for the fiscal-year definition, period creation, open/close/reopen, who can lock/unlock, soft vs hard close, or year-end close entries (target 3000 vs 3100 vs 3200, C10). No spec for opening-balance migration.
10. **Bank reconciliation model**: statement-import/auto-match (SRD2/UIR) vs tick-based (CB) vs session API (UATN) (C21). Zero vs ±0.01 tolerance (C20). Unreconcile capability (C19). Duplicate statement-line detection is unspecified.
11. **Cashbook posting**: instant vs batch post (C17). Gross vs Excl-VAT entry (C18). Discount field (discountAmount) appears only in §4.4 and is not in the §3.2 entity.
12. **Invoice statuses and void rules** (C15, C16). Credit-note VAT handling (SRD2 JE ignores VAT, CORE includes it). Whether a credit note can exist without an invoice.
13. **Quotations / sales orders**: requested in the brief but **absent from all sources**.
14. **Customer credit-limit enforcement**: the field exists, but blocking or warning behaviour is not specified.
15. **Ageing buckets**: overlap (C31). No AP bucket definition. **DSO formula and target** not defined.
16. **Fixed assets**: method scope (C11). Start date (purchase vs in-service, C12). Partial-month convention. Salvage-value rules. **Impairment, revaluation, componentisation and asset categories/default lives** are not specified. Disposal proceeds flow is not specified.
17. **Inventory**: FIFO vs weighted average (C24). Whether inventory is in scope for a fund manager at all (SRD2 small-business origin, C29).
18. **Budgets**: no requirements for creation, versions, periods, dimensions, thresholds, alerts or hard/soft stops. Only UI references exist. Ownership between Accounting and FP&A/OPM is unclear.
19. **Expenses & claims**: only UIR mock-up. No policy rule definitions (limits, per-diem rates), no reimbursement posting accounts, and no link to payroll or AP. **Corporate cards**: absent entirely.
20. **Tax**: statutory VAT rate is hard-coded at 15% in examples and should be verified and configurable. **IMTT, AIDS levy, VAT on imports treatment (UIR shows imports VAT not netted)**, VAT apportionment and fiscal-device rules are not mentioned. WHT rate table and certificates are only illustrated. CIT 24% / CGT 20% / 2.5% indexation come only from TAX (supplementary).
21. **Multi-entity**: STI, UIR and TAX assume multiple entities and consolidation, but the core data model (SRD2/TECH) has no entity dimension. Intercompany posting rules are unspecified.
22. **Dimensions**: Department/Project are on journal lines in UIR, but they are absent from the SRD2/TECH data models. There is no master-data spec for them.
23. **Roles**: TECH assigns COA and depreciation to "HR Manager" (C26), which is likely an error. There is no consolidated RBAC matrix. 'View Reports'/'Post Transactions' permission names come only from UATV1.
24. **STI**: rollovers/reinvestment are **not specified**. Maturity settlement is user-initiated even though "automate the settlement process" is stated. Compound Monthly math is undefined. Discount-instrument accretion (UIR 10) is not in the STI SRD. Accrual journal granularity (per instrument vs one batch JE) is unspecified. The STI simple-interest formula as written divides APY by the convention name.
25. **Events accrual** credit account conflicts (C23).
26. **Payroll**: employer contributions (5020) are missing from TECH's balance check (C25). Other deductions (pension vs NSSA split, medical aid, loans) are unspecified. Only NSSA/Pension is a combined account.
27. **Bank file**: specified for payroll only. Supplier payment-file format, bank-specific templates and settlement confirmation (UIR 18 step 5) are unspecified.
28. **Notifications**: no channel (email/in-app), recipients or schedule defined except the RBZ-failure alert and CFO capital-erosion alert. Reminder cadence for overdue invoices is not defined.
29. **Scheduled-job idempotency**: only depreciation (lastDepreciationDate) and STI (rate-change timestamp integrity, catch-up) state protection. Nightly OPM sync, fee invoicing, payroll posting and FX revaluation have no duplicate-run rules.
30. **"Available after commitments"**, close-readiness %, receipt coverage % and weighted yield are shown in UIR without definitions, and mock numbers do not reconcile.
31. **Dashboard content** conflicts between SRD2 KPI cards and UIR task-first design (C28).
32. **UI palette** conflicts between UIR "no green" and TAX emerald (C27).
33. **Security of bank data**: BF forbids easily accessible permanent storage of sensitive banking info, but supplier/employee bank details must be stored for payment runs. Encryption and masking rules are unspecified.
34. **Audit trail scope**: SRD2 lists Create/Update/Delete only. Voids, approvals, logins, exports and rate approvals are not enumerated as action types.
