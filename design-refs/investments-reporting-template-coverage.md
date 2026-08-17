# Investments reporting — template coverage

**Generated:** 2026-08-05  
**Runtime templates:** `nvccz/storage/report-templates/investment-ops/`  
**Source packs:** `nvccz/reports/investments/`  
**Fill path:** DOCX → `InvestmentReportDataBuilderRegistry` → `PerformanceReportDataBuilder` (performance) or `ArcusPlaceholderFillEngine` + `finalizeReportContext` → `DocxTemplateRenderService` → `docxClientReleaseCleanup`

## Yellow / blue authoring rules

Templates keep yellow-highlighted placeholders and blue `INSTRUCTION:` / `EDITOR NOTE:` boxes for authors.
On client download (`docxClientReleaseCleanup`):

1. **Fill** — Docxtemplater merges `{placeholders}` from the report data builders (per-template instructions are what those builders implement).
2. **Strip yellow** — remove `<w:highlight w:val="yellow"/>` and whitene `FFF2CC` / `FFFF00` fills.
3. **Delete blue instruction boxes** — nested-aware removal of tables/short paragraphs matching `INSTRUCTION:`, “Delete all blue…”, “Blue instruction boxes”, `EDITOR NOTE:`, etc.
4. **Remove internal sections** — “Arcus Audit, Version and Publication Controls” and “Final Release Checklist” (precise `<w:p` matching so OOXML stays valid).

Verify: `node scripts/smoke-docx-client-release-cleanup.js` → **ALL_PASS 16**.


## DOCX catalog (16)

| Code | Template file | Scope | Fund | Client | Placeholders |
|------|---------------|-------|------|--------|--------------|
| PERFORMANCE_REPORT | performance-report.docx | FUND | yes | no | 312 |
| HOLDINGS_REPORT | holdings-report.docx | FUND | yes | no | 263 |
| TRANSACTION_REPORT | transaction-report.docx | FUND | yes | no | 304 |
| ASSET_ALLOCATION_REPORT | asset-allocation-report.docx | FUND | yes | no | 240 |
| INCOME_REPORT | income-report.docx | FUND | yes | no | 281 |
| FEE_REPORT | fee-report.docx | FUND | yes | no | 284 |
| CLIENT_PORTFOLIO_VALUATION | client-portfolio-valuation.docx | CLIENT_MANDATE | yes | yes | 219 |
| RECONCILIATION_EXCEPTION_REPORT | reconciliation-exception-report.docx | FUND | yes | no | 170 |
| CUSTODIAN_TRUSTEE_RECONCILIATION | custodian-trustee-reconciliation.docx | FUND | yes | no | 288 |
| SUBSCRIPTIONS_REDEMPTIONS_REPORT | subscriptions-redemptions-report.docx | FUND | yes | no | 233 |
| AUM_FUM_MOVEMENT_REPORT | aum-fum-movement-report.docx | FIRM | no | no | 486 |
| TRUSTEE_QUARTERLY_PACK | trustee-quarterly-pack.docx | CIS_SCHEME | yes | no | 178 |
| CIS_MONTHLY_RETURN_PACK | cis-monthly-return-pack.docx | CIS_SCHEME | yes | no | 414 |
| AML_CFT_CPF_RETURN_PACK | aml-cft-cpf-return-pack.docx | FIRM | no | no | 362 |
| SECZIM_CAPITAL_ADEQUACY_PACK | seczim-capital-adequacy-pack.docx | FIRM | no | no | 303 |
| SECZIM_PRUDENTIAL_RETURN_PACK | seczim-prudential-return-pack.docx | REGULATOR_PACK | no | no | 173 |

Placeholders use `{snake_case}` tags. Any key not explicitly mapped by the fill engine is defaulted by `finalizeReportContext` (money → 0, pct → 0%, dates → today, names → ops user, else `—`). Missing DB metrics therefore show zeros/dashes rather than leaving `{tags}` or yellow instruction text.

**Supported format for these 16:** `DOCX` only (production Word path).

## Flat / non-DOCX (5)

| Code | Formats |
|------|---------|
| PORTFOLIO_VALUATION | PDF, EXCEL, XLSX, CSV, JSON |
| TRADE_BLOTTER | PDF, EXCEL, XLSX, CSV, JSON |
| HOLDINGS_SUMMARY | PDF, EXCEL, XLSX, CSV, JSON |
| COMPLIANCE_SUMMARY | PDF, EXCEL, XLSX, CSV, JSON |
| RECONCILIATION_SUMMARY | PDF, EXCEL, XLSX, CSV, JSON |

## Parameters (API `parameterSchema`)

Common optional fields on templated reports: `periodStart`, `periodEnd`, `valuationDate`, `asOf` (alias), `benchmarkName`, `assetManagerName`, plus `fundId` / `clientId` when required.

## Verify

```bash
# Local API on :3009
cd nvccz
npx ts-node --transpile-only scripts/smoke-investment-ops-reports-local.ts
```

**Local smoke (2026-08-05):** 16/16 DOCX + 1 flat `PORTFOLIO_VALUATION` PDF — **17 passed, 0 failed**. Assertions: file size ≥ 3KB, zero leftover `{placeholders}`, no yellow highlights, no blue instruction boxes.

Or remote UAT: `npm run uat:investment-ops:all-reports-verify` (if scripted in package.json).

## Frontend

[`app/investments-v2/reporting/page.tsx`](../app/investments-v2/reporting/page.tsx):
- Params driven from API `parameterSchema`
- Defaults format to **DOCX** when `hasDocxTemplate`
- Generate uses idempotency headers; download surfaces toast errors

- Income / dividend accruals may be zero until income feed is wired.
- Firm AUM movement uses snapshot NAV rollups; opening AUM is approximated when historical firm NAV is missing.
- Regulatory packs fill from available ops data + safe defaults — not a certified SECZIM filing engine.
