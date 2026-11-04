# General Ledger Posting Verification

Read-only production verification for the 323 depreciation postings.

- Journal headers: 323, all `POSTED`.
- Journal lines: 646, exactly two per journal.
- Debit total: 1,574,104.080.
- Credit total: 1,574,104.080.
- Debit account: 5130 — Depreciation Expense.
- Credit account: 1550 — Accumulated Depreciation.
- Unbalanced journals: 0.
- Orphaned depreciation records by deterministic `DEP-{period}-{record-id suffix}` reference: 0.
- Currency: all journal headers are USD.

The journal-line tables are the ledger posting surface used by the reporting services. The critical unresolved issue is that the imported assets are ZIG-denominated while depreciation journals are labeled USD, despite the numeric amounts being calculated from ZIG asset costs.

Recommended action: obtain accounting direction on whether the depreciation postings should be reversed and reposted in ZIG, or whether the assets should have been recorded in USD. No production correction was performed during this audit.
