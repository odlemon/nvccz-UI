# Trading demo packs — index

Two self-contained demo sets for **orderbook → settle → reconciliation**.

| Pack | Audience | Walkthrough | Upload files |
|------|----------|-------------|--------------|
| **A — Test** | You (dry-run before client) | [demo-pack-A-test-run.md](./demo-pack-A-test-run.md) | [demo-pack-test/](../public/demo-templates/demo-pack-test/) |
| **B — Client** | Live client presentation | [demo-pack-B-client-demo.md](./demo-pack-B-client-demo.md) | [demo-pack-client/](../public/demo-templates/demo-pack-client/) |

## Quick comparison

| | Pack A | Pack B |
|--|--------|--------|
| Portfolio | Arcus Listed Portfolio | Arcus Income Mandate |
| Cash | Large ZWG/USD on portfolio config (DB top-up) | Same |
| Trade | CBZ BUY 2,000 @ 12.50 ZWG | **INN BUY 500 @ 42.10 ZWG** |
| Net settle | ~25,050 (gross + 20bps) | **21,092.10** (locked in CSVs) |
| Broker | Imara Capital | Imara Edwards Securities |

**Client recon match:** Pack B CSVs are locked to INN / 500 / 42.10 / ZWG / net 21092.10 — see the “Locked match contract” in Pack B.

## Environment

- **URL:** https://dev.arcus.co.zw  
- **Login:** `admin@nts.com` / `admin123`  
- **Module:** App Switcher → Investments V2  

## File download (on dev, after UI deploy)

- Pack A: `/demo-templates/demo-pack-test/`
- Pack B: `/demo-templates/demo-pack-client/`

Or copy from repo: `public/demo-templates/demo-pack-test/` and `demo-pack-client/`.

## Related docs

- [walkthrough-order-to-recon.md](./walkthrough-order-to-recon.md) — generic recon deep-dive  
- [walkthrough-trading-retune-user-flow.md](./walkthrough-trading-retune-user-flow.md) — broker-outside-system flow  
