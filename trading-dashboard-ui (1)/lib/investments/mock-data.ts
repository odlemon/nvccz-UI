// ─────────────────────────────────────────────────────────────────────────────
// Mock data + types for the Market Terminal demo.
// Shapes mirror the real `@/lib/api/investments-api` contracts so the JSX/Tailwind
// in these components can be copy-pasted straight into the production module.
// ─────────────────────────────────────────────────────────────────────────────

export type ExchangeCode = "ZSE" | "VFEX" | "SECZIM" | "NYSE" | "NASDAQ" | "LSE"
export type Direction = "UP" | "DOWN" | "FLAT"
export type TickFrequency = "LIVE" | "DELAYED_15M" | "EOD"
export type ValidationStatus = "APPROVED" | "PENDING_REVIEW" | "REJECTED"
export type SourceStatus = "OK" | "FALLBACK"

export interface Security {
  id: string
  symbol: string
  name: string
  exchangeCode: ExchangeCode
  listingCurrencyCode: string
  isin?: string
  isActive: boolean
}

export interface PriceTick {
  price: number
  previousClose: number
  direction: Direction
  changePct: number
  validationStatus: ValidationStatus
  sourceStatus: SourceStatus
  tickFrequency: TickFrequency
}

export interface Holding {
  id: string
  securityId: string
  security: { symbol: string; exchangeCode: ExchangeCode }
  quantity: number
  wac: number
  marketValue: number | null
  unrealizedPnl: number | null
}

export interface Fund {
  id: string
  name: string
  base_currency: string
  nav: number
}

export interface Pnl {
  unrealized: { usd: number; zig: number; fxRateUsed: number }
  realized: { usd: number }
}

export type RoutingTarget = "BROKER" | "CUSTODIAN" | "CORE_BANKING" | "ACCOUNTING_GL"
export type RoutingStatus = "STAGED" | "DISPATCHED" | "CONFIRMED" | "RETRYING" | "FAILED"

export interface RoutingHop {
  id: string
  target: RoutingTarget
  status: RoutingStatus
  attemptCount: number
  dispatchedAt?: string
  confirmedAt?: string
  externalRef?: string
  lastError?: string
  payloadRef?: string
}

export type TradeStatus =
  | "DRAFT" | "EXECUTED" | "ROUTING" | "SETTLED" | "SETTLEMENT_FAILED" | "CANCELLED"

export interface Trade {
  id: string
  tradeRef: string
  securityId: string
  security: { symbol: string; name: string; exchangeCode: ExchangeCode }
  side: "BUY" | "SELL"
  quantity: number
  executionPrice: number
  executionCurrencyCode: string
  fees: number
  status: TradeStatus
  routingHops: RoutingHop[]
  executedAt?: string
  settledAt?: string
}

export interface ValidationTick {
  tick_id: string
  ticker: string
  exchange: ExchangeCode
  price_date: string
  proposed_price: number
  previous_close: number
  deviation_percent: number
}

export interface IngestBatch {
  batch_id: string
  source_code: ExchangeCode
  ingest_date: string
  record_count: number
  sha256_hash: string
  source_status: SourceStatus
  checksum_valid?: boolean
}

// helper
export function isSkippedInternal(hop: RoutingHop) {
  return hop.target === "CUSTODIAN" && hop.externalRef === "SKIPPED_INTERNAL"
}

// ─── Funds ──────────────────────────────────────────────────────────────────
export const FUNDS: Fund[] = [
  { id: "fund-1", name: "Imara Absolute Return", base_currency: "USD", nav: 2841920.5 },
  { id: "fund-2", name: "Old Mutual Balanced", base_currency: "USD", nav: 5120445.0 },
  { id: "fund-3", name: "ZSE Growth Equity", base_currency: "USD", nav: 1204880.75 },
]

// ─── Securities ───────────────────────────────────────────────────────────────
export const SECURITIES: Security[] = [
  { id: "s1", symbol: "ECO.ZW", name: "Econet Wireless Zimbabwe", exchangeCode: "ZSE", listingCurrencyCode: "USD", isin: "ZW0009011983", isActive: true },
  { id: "s2", symbol: "OMIG.VF", name: "Old Mutual Investment Group", exchangeCode: "VFEX", listingCurrencyCode: "USD", isin: "ZW0009012205", isActive: true },
  { id: "s3", symbol: "TSLA.US", name: "Tesla Inc.", exchangeCode: "NASDAQ", listingCurrencyCode: "USD", isin: "US88160R1014", isActive: true },
  { id: "s4", symbol: "LSE.LN", name: "London Stock Exchange Group", exchangeCode: "LSE", listingCurrencyCode: "GBP", isin: "GB00B0SWJX34", isActive: true },
  { id: "s5", symbol: "DLTA.ZW", name: "Delta Corporation Limited", exchangeCode: "ZSE", listingCurrencyCode: "USD", isin: "ZW0009011959", isActive: true },
  { id: "s6", symbol: "CBZ.ZW", name: "CBZ Holdings Limited", exchangeCode: "ZSE", listingCurrencyCode: "USD", isin: "ZW0009011900", isActive: true },
  { id: "s7", symbol: "AAPL.US", name: "Apple Inc.", exchangeCode: "NASDAQ", listingCurrencyCode: "USD", isin: "US0378331005", isActive: true },
  { id: "s8", symbol: "PADENGA.VF", name: "Padenga Holdings", exchangeCode: "VFEX", listingCurrencyCode: "USD", isin: "ZW0009012106", isActive: true },
  { id: "s9", symbol: "NVDA.US", name: "NVIDIA Corporation", exchangeCode: "NASDAQ", listingCurrencyCode: "USD", isin: "US67066G1040", isActive: true },
  { id: "s10", symbol: "SEED.ZW", name: "SeedCo Limited", exchangeCode: "ZSE", listingCurrencyCode: "USD", isin: "ZW0009011819", isActive: true },
  { id: "s11", symbol: "BAT.LN", name: "British American Tobacco", exchangeCode: "LSE", listingCurrencyCode: "GBP", isin: "GB0002875804", isActive: true },
  { id: "s12", symbol: "ZBFH.SZ", name: "ZB Financial Holdings", exchangeCode: "SECZIM", listingCurrencyCode: "ZWG", isin: "ZW0009011702", isActive: false },
]

// ─── Latest prices keyed by symbol ────────────────────────────────────────────
export const LATEST_PRICES: Record<string, PriceTick> = {
  "ECO.ZW":     { price: 12.85, previousClose: 12.45, direction: "UP",   changePct: 3.21,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "EOD" },
  "OMIG.VF":    { price: 1.54,  previousClose: 1.533, direction: "UP",   changePct: 0.45,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "DELAYED_15M" },
  "TSLA.US":    { price: 182.1, previousClose: 184.16,direction: "DOWN", changePct: -1.12, validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "LIVE" },
  "LSE.LN":     { price: 84.5,  previousClose: 84.5,  direction: "FLAT", changePct: 0.0,   validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "DELAYED_15M" },
  "DLTA.ZW":    { price: 145.2, previousClose: 138.9, direction: "UP",   changePct: 4.53,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "EOD" },
  "CBZ.ZW":     { price: 22.4,  previousClose: 28.1,  direction: "DOWN", changePct: -20.28,validationStatus: "PENDING_REVIEW", sourceStatus: "OK",       tickFrequency: "EOD" },
  "AAPL.US":    { price: 227.52,previousClose: 225.0, direction: "UP",   changePct: 1.12,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "LIVE" },
  "PADENGA.VF": { price: 0.32,  previousClose: 0.325, direction: "DOWN", changePct: -1.54, validationStatus: "APPROVED",       sourceStatus: "FALLBACK", tickFrequency: "EOD" },
  "NVDA.US":    { price: 138.07,previousClose: 131.2, direction: "UP",   changePct: 5.24,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "LIVE" },
  "SEED.ZW":    { price: 58.0,  previousClose: 58.0,  direction: "FLAT", changePct: 0.0,   validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "EOD" },
  "BAT.LN":     { price: 28.6,  previousClose: 27.9,  direction: "UP",   changePct: 2.51,  validationStatus: "APPROVED",       sourceStatus: "OK",       tickFrequency: "DELAYED_15M" },
}

// ─── Holdings ─────────────────────────────────────────────────────────────────
export const HOLDINGS: Holding[] = [
  { id: "h1", securityId: "s2", security: { symbol: "OMIG.VF", exchangeCode: "VFEX" }, quantity: 10000, wac: 1.2,    marketValue: 15400,   unrealizedPnl: 3400 },
  { id: "h2", securityId: "s3", security: { symbol: "TSLA.US", exchangeCode: "NASDAQ" }, quantity: 150,  wac: 182.1,  marketValue: 27315,   unrealizedPnl: 0 },
  { id: "h3", securityId: "s9", security: { symbol: "NVDA.US", exchangeCode: "NASDAQ" }, quantity: 800,  wac: 118.4,  marketValue: 110456,  unrealizedPnl: 15736 },
  { id: "h4", securityId: "s1", security: { symbol: "ECO.ZW", exchangeCode: "ZSE" },    quantity: 42000, wac: 11.9,   marketValue: 539700,  unrealizedPnl: 39900 },
  { id: "h5", securityId: "s5", security: { symbol: "DLTA.ZW", exchangeCode: "ZSE" },    quantity: 8500,  wac: 152.3,  marketValue: 1234200, unrealizedPnl: -60350 },
  { id: "h6", securityId: "s7", security: { symbol: "AAPL.US", exchangeCode: "NASDAQ" }, quantity: 1200, wac: 210.5,  marketValue: 273024,  unrealizedPnl: 20424 },
  { id: "h7", securityId: "s8", security: { symbol: "PADENGA.VF", exchangeCode: "VFEX" },quantity: 55000, wac: 0.35,   marketValue: null,    unrealizedPnl: null },
]

export const PNL: Pnl = {
  unrealized: { usd: 39110, zig: 543_248.4, fxRateUsed: 13.8901 },
  realized: { usd: 1245 },
}

// ─── Trades ───────────────────────────────────────────────────────────────────
const now = Date.now()
const ago = (h: number) => new Date(now - h * 3600_000).toISOString()

function hops(config: Partial<Record<RoutingTarget, Partial<RoutingHop>>>): RoutingHop[] {
  const order: RoutingTarget[] = ["BROKER", "CUSTODIAN", "CORE_BANKING", "ACCOUNTING_GL"]
  return order.map((target, i) => ({
    id: `hop-${target}-${i}`,
    target,
    status: "STAGED",
    attemptCount: 0,
    ...config[target],
  }))
}

export const TRADES: Trade[] = [
  {
    id: "t1", tradeRef: "TXN-8a31e24c", securityId: "s2",
    security: { symbol: "OMIG.VF", name: "Old Mutual Investment Group", exchangeCode: "VFEX" },
    side: "BUY", quantity: 25000, executionPrice: 1.25, executionCurrencyCode: "USD", fees: 43.75,
    status: "SETTLED", executedAt: ago(2), settledAt: ago(1.9),
    routingHops: hops({
      BROKER:        { status: "DISPATCHED", attemptCount: 1, dispatchedAt: ago(2), externalRef: "BRK-99213", payloadRef: '{"tradeId":"t1","qty":25000}' },
      CUSTODIAN:     { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(1.95), externalRef: "SKIPPED_INTERNAL" },
      CORE_BANKING:  { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(1.93), externalRef: "CB-771020" },
      ACCOUNTING_GL: { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(1.9), externalRef: "JE-2024-8841" },
    }),
  },
  {
    id: "t2", tradeRef: "TXN-4f7b91a0", securityId: "s3",
    security: { symbol: "TSLA.US", name: "Tesla Inc.", exchangeCode: "NASDAQ" },
    side: "SELL", quantity: 150, executionPrice: 182.1, executionCurrencyCode: "USD", fees: 12.5,
    status: "ROUTING", executedAt: ago(0.5),
    routingHops: hops({
      BROKER:        { status: "DISPATCHED", attemptCount: 1, dispatchedAt: ago(0.5), externalRef: "BRK-99214" },
      CUSTODIAN:     { status: "RETRYING", attemptCount: 3, dispatchedAt: ago(0.4), lastError: "Custodian SFTP timeout" },
      CORE_BANKING:  { status: "STAGED", attemptCount: 0 },
      ACCOUNTING_GL: { status: "STAGED", attemptCount: 0 },
    }),
  },
  {
    id: "t3", tradeRef: "TXN-2c9d55e1", securityId: "s9",
    security: { symbol: "NVDA.US", name: "NVIDIA Corporation", exchangeCode: "NASDAQ" },
    side: "BUY", quantity: 400, executionPrice: 131.2, executionCurrencyCode: "USD", fees: 21.0,
    status: "SETTLEMENT_FAILED", executedAt: ago(6),
    routingHops: hops({
      BROKER:        { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(6), externalRef: "BRK-99190" },
      CUSTODIAN:     { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(5.9), externalRef: "SKIPPED_INTERNAL" },
      CORE_BANKING:  { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(5.8), externalRef: "CB-770980" },
      ACCOUNTING_GL: { status: "FAILED", attemptCount: 5, lastError: "LISTED_EQUITY_JE_IMBALANCED — debit/credit mismatch of 0.02" },
    }),
  },
  {
    id: "t4", tradeRef: "TXN-91ee7b34", securityId: "s1",
    security: { symbol: "ECO.ZW", name: "Econet Wireless Zimbabwe", exchangeCode: "ZSE" },
    side: "BUY", quantity: 12000, executionPrice: 12.85, executionCurrencyCode: "USD", fees: 154.2,
    status: "SETTLED", executedAt: ago(26), settledAt: ago(25.9),
    routingHops: hops({
      BROKER:        { status: "DISPATCHED", attemptCount: 1, dispatchedAt: ago(26), externalRef: "BRK-99101" },
      CUSTODIAN:     { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(25.95), externalRef: "SKIPPED_INTERNAL" },
      CORE_BANKING:  { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(25.93), externalRef: "CB-770510" },
      ACCOUNTING_GL: { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(25.9), externalRef: "JE-2024-8790" },
    }),
  },
  {
    id: "t5", tradeRef: "TXN-70ab12ff", securityId: "s5",
    security: { symbol: "DLTA.ZW", name: "Delta Corporation Limited", exchangeCode: "ZSE" },
    side: "SELL", quantity: 3000, executionPrice: 145.2, executionCurrencyCode: "USD", fees: 87.1,
    status: "DRAFT",
    routingHops: [],
  },
  {
    id: "t6", tradeRef: "TXN-55c0d8a2", securityId: "s7",
    security: { symbol: "AAPL.US", name: "Apple Inc.", exchangeCode: "NASDAQ" },
    side: "BUY", quantity: 500, executionPrice: 225.0, executionCurrencyCode: "USD", fees: 33.0,
    status: "SETTLED", executedAt: ago(50), settledAt: ago(49.9),
    routingHops: hops({
      BROKER:        { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(50), externalRef: "BRK-98800" },
      CUSTODIAN:     { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(49.95), externalRef: "SKIPPED_INTERNAL" },
      CORE_BANKING:  { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(49.93), externalRef: "CB-769900" },
      ACCOUNTING_GL: { status: "CONFIRMED", attemptCount: 1, confirmedAt: ago(49.9), externalRef: "JE-2024-8501" },
    }),
  },
]

// ─── Validation queue ─────────────────────────────────────────────────────────
export const VALIDATION_QUEUE: ValidationTick[] = [
  { tick_id: "v1", ticker: "CBZ.ZW",  exchange: "ZSE",    price_date: ago(1),  proposed_price: 22.4,  previous_close: 28.1,  deviation_percent: -20.28 },
  { tick_id: "v2", ticker: "SEED.ZW", exchange: "ZSE",    price_date: ago(1),  proposed_price: 71.5,  previous_close: 58.0,  deviation_percent: 23.28 },
  { tick_id: "v3", ticker: "ZBFH.SZ", exchange: "SECZIM", price_date: ago(2),  proposed_price: 4.1,   previous_close: 3.85,  deviation_percent: 6.49 },
  { tick_id: "v4", ticker: "DLTA.ZW", exchange: "ZSE",    price_date: ago(2),  proposed_price: 172.0, previous_close: 138.9, deviation_percent: 23.83 },
  { tick_id: "v5", ticker: "PADENGA.VF", exchange: "VFEX",price_date: ago(3),  proposed_price: 0.27,  previous_close: 0.325, deviation_percent: -16.92 },
]

// ─── Ingest batches ───────────────────────────────────────────────────────────
export const INGEST_BATCHES: IngestBatch[] = [
  { batch_id: "b1", source_code: "ZSE",    ingest_date: ago(2),  record_count: 64,  sha256_hash: "9f2c4e1a8b7d6f3e5c0a1b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", source_status: "OK",       checksum_valid: undefined },
  { batch_id: "b2", source_code: "VFEX",   ingest_date: ago(2),  record_count: 12,  sha256_hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", source_status: "OK",       checksum_valid: undefined },
  { batch_id: "b3", source_code: "NASDAQ", ingest_date: ago(9),  record_count: 512, sha256_hash: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789", source_status: "OK",       checksum_valid: undefined },
  { batch_id: "b4", source_code: "SECZIM", ingest_date: ago(26), record_count: 8,   sha256_hash: "deadbeefcafebabe0011223344556677deadbeefcafebabe0011223344556677", source_status: "FALLBACK", checksum_valid: undefined },
  { batch_id: "b5", source_code: "ZSE",    ingest_date: ago(26), record_count: 63,  sha256_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", source_status: "OK",       checksum_valid: undefined },
  { batch_id: "b6", source_code: "LSE",    ingest_date: ago(33), record_count: 220, sha256_hash: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210", source_status: "OK",       checksum_valid: undefined },
]

// ─── Terminal chart series (NAV vs benchmark) ─────────────────────────────────
export const NAV_SERIES = [
  { t: "09:00", nav: 2789000, bench: 2789000 },
  { t: "10:00", nav: 2802400, bench: 2795300 },
  { t: "11:00", nav: 2796800, bench: 2798100 },
  { t: "12:00", nav: 2815200, bench: 2803400 },
  { t: "13:00", nav: 2829900, bench: 2811200 },
  { t: "14:00", nav: 2822100, bench: 2815600 },
  { t: "15:00", nav: 2838700, bench: 2822900 },
  { t: "16:00", nav: 2841920, bench: 2826100 },
]

// ─── Terminal alerts / notifications feed ─────────────────────────────────────
export interface TerminalAlert {
  id: string
  time: string
  type: "OUTLIER" | "ROUTING" | "SETTLEMENT" | "FX" | "NAV"
  message: string
  severity: "info" | "warn" | "error" | "success"
}

export const TERMINAL_ALERTS: TerminalAlert[] = [
  { id: "a1", time: "2m ago",  type: "OUTLIER",    message: "CBZ.ZW price -20.28% flagged for manual review", severity: "warn" },
  { id: "a2", time: "8m ago",  type: "ROUTING",    message: "TXN-4f7b91a0 custodian hop retrying (3/5)", severity: "warn" },
  { id: "a3", time: "14m ago", type: "SETTLEMENT", message: "TXN-2c9d55e1 GL posting failed — JE imbalanced", severity: "error" },
  { id: "a4", time: "31m ago", type: "NAV",        message: "Fund NAV revalued to $2,841,920.50", severity: "success" },
  { id: "a5", time: "1h ago",  type: "FX",         message: "ZiG FX rate refreshed to 13.8901", severity: "info" },
  { id: "a6", time: "2h ago",  type: "SETTLEMENT", message: "TXN-8a31e24c executed and settled — GL posted", severity: "success" },
]
