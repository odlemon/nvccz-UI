# Investments market data — backend ops gaps (NTS dev)

**Status:** FE + API shape fixes deployed 2026-08-20. **Live ZSE daily prices blocked on dev until `MANSA_API_KEY` is set.**

## Product rule

Instrument registry and Price control centre must show:

- Identifiers (ISIN or instrument code fallback)
- Market + currency from linked `listed_equity_securities`
- Latest price with **Previous**, **Change**, and **Priced at** from approved/API-confirmed ticks
- Prices refreshed on market days via domestic scrape cron

## What was fixed (dev deploy)

| Layer | Change |
|-------|--------|
| FE switcher | LP Portal + Investee Portal open dedicated portal URL in **new tab** (`externalPortalUrl`) |
| FE adapters | `formatInstrumentIdentifiers` falls back to `instrumentCode` / ticker; `mapLatestPriceRow` reads flat `exchangeCode`; **Updated** uses `pricedAt` |
| BE `InvestmentMarketDataFacadeService.latestPrices` | Returns `{ security, latestTick }` with `previousClose`, `listingCurrencyCode`, `version` |
| BE `InvestmentInstrumentService.list` | Joins security for `isin`, `exchangeCode`, `listingCurrencyCode`, `pricedAt` |
| Ops | `MARKET_DATA_CRON_SECRET` added to `arcus/secrets/dev.env`; cron installed at `/etc/cron.d/arcus-listed-equity` |

## Still required — ops secret

~~Add to **`/var/www/projects/arcus/secrets/dev.env`** on VPS:~~

**Update (2026-08-20):** Key recovered from git history (`MansaMarketDataClient.ts` pre-2026-07-20) and set on **`/var/www/projects/arcus/secrets/dev.env`** as `MANSA_API_KEY`. Dev API recreated; manual scrape triggered.

```env
MANSA_API_KEY=<from Mansa dashboard or former hardcode in git history>
```

Then recreate API:

```bash
cd /var/www/projects/arcus
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build api
```

Trigger manual scrape:

```bash
curl -X POST "https://dev-api.arcus.co.zw/api/investments/market-data/cron/scrape-domestic" \
  -H "X-Market-Data-Cron-Secret: $MARKET_DATA_CRON_SECRET"
```

## Verify

1. **Instruments** — `GET /api/investment-ops/instruments` → rows have `instrumentCode`/`isin`, `pricedAt` recent
2. **Latest prices** — `GET /api/investment-ops/market-data/prices/latest` → `{ security: { exchangeCode, listingCurrencyCode }, latestTick: { previousClose, pricedAt } }`
3. **Cron log** — `tail /var/log/arcus-market-scrape.log` on VPS after market hours
4. **FE** — dev.arcus.co.zw/investments-v2/portfolios/instruments and `/portfolios/prices`

## FE files

- `lib/config/modules.ts`, `components/layout/arcus-app-switcher-dropdown.tsx`
- `lib/investments-v2/adapters/portfolio-adapter.ts`
- `app/investments-v2/portfolios/instruments/page.tsx`
- `app/investments-v2/portfolios/prices/page.tsx`

## BE files

- `src/services/investmentOps/InvestmentMarketDataFacadeService.ts`
- `src/services/investmentOps/InvestmentInstrumentService.ts`
- `docs/stock-price-collector-ubuntu-cron-setup.md`

## Error codes

| Condition | Behaviour |
|-----------|-----------|
| Missing `MANSA_API_KEY` | Scrape runs but ZSE ingest uses **FALLBACK** (replays last approved prices; `pricedAt` unchanged) |
| Missing cron secret header | `401` on cron routes |
| Large price move vs previous close | Tick → `PENDING_REVIEW` (validation queue) |
