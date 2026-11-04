# Fixed Asset Depreciation Audit

Audit target: production `nvccz_prod` on `nvccz-prod-api-1`. Read-only audit; no records were changed.

## Results

| Check | Actual | Status |
|---|---:|---|
| Imported assets | 33 | PASS |
| Depreciation records | 323 | PASS |
| Posted depreciation records | 323 | PASS |
| Distinct asset-period records | 323 | PASS |
| Journal headers | 323 | PASS |
| Journal lines | 646 | PASS |
| Balanced journals | 323 | PASS |
| Depreciation expense account | 5130 | PASS |
| Accumulated depreciation account | 1550 | PASS |
| Missing journal links by DEP reference | 0 | PASS |
| Duplicate asset-periods | 0 | PASS |
| Total depreciation | ZIG 1,574,104.08 numerically | REVIEW |
| Journal currency | USD for all 323 journals | FAIL |

## Material finding

All imported assets have recorded currency ZIG. The depreciation service selected the active default currency when posting, and all 323 depreciation journal headers contain USD. The posted numerical amounts match the depreciation calculations based on the ZIG asset costs, but the journal currency is USD. This is a currency-integrity issue requiring accounting review. No corrective journals or reversals were created.

## Period coverage

The database contains posted periods from 2024-09 through 2025-12. Each record is not earlier than its asset purchase month. Journal transaction dates range from 2024-09-26 through 2025-12-31.

## Architecture

The ERP uses posted `journal_entries` and `journal_entry_lines` as its accounting ledger representation; no separate General Ledger transaction table was identified. Every depreciation journal has two lines: debit account 5130 and credit account 1550.
