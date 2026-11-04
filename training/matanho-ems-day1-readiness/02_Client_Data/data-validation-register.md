# Data validation register

| Batch / row set | Data domain | Source owner | File/version/as-of | Checks | Exceptions | Reviewer | Status |
|---|---|---|---|---|---|---|---|
|  | Users and requested roles |  |  | Identity uniqueness; department; employment status; scope; approval; dates; no passwords. |  |  | Awaiting data |
|  | Funds/entities |  |  | Legal name; jurisdiction; relationships; currency; duplicate; approved mandate; control totals. |  |  | Awaiting data |
|  | Investors |  |  | Duplicate/legal identity; classification; KYC state; consent; secure handling. |  |  | Awaiting data |
|  | Commitments/schedules |  |  | Fund/investor links; currency/date; non-negative amounts; schedule totals; approved reconciliation. |  |  | Awaiting data |

Record exceptions as row references and coded issue descriptions, not copied sensitive values. Import only after maker/checker sign-off and backup confirmation.

## Local UAT import-surface checkpoint — 15 October 2026

The authorized local admin browser verified investor organisation and commitment entry forms, but no fundraising import/upload workflow was exposed in the available module navigation. The document library file upload is a document-registration path, not a data import. Import execution remains pending confirmation of the approved import surface, file schema, and maker/checker controls.
