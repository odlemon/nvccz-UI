# Demo pack B — client presentation files

**Locked to:** Arcus Income Mandate · INN BUY **500** @ **42.10** ZWG · trade date **2026-08-20** · net cash **21092.10** (gross 21050 + 20bps 42.10).

| File | Use when |
|------|----------|
| `broker-statement.csv` | Trade match → Ingest broker |
| `custodian-statement.csv` | Trade match → Ingest custodian |
| `bank-statement-settlement.csv` | Cash match → Import Statements |
| `upload-trade-confirmation.pdf` | Documentation → TRADE_CONFIRMATION |
| `upload-custodian-statement.pdf` | Documentation → CUSTODIAN_STATEMENT |
| `upload-mandate-excerpt.pdf` | Documentation → INVESTMENT_MANDATE (optional) |

Full script + recon tab blurbs: `design-refs/demo-pack-B-client-demo.md`

If demo day ≠ 20 Aug 2026, update `trade_date` / `value_date` in all three CSVs to that day before the meeting.
