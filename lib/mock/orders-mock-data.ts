import { createAsyncThunk } from "@reduxjs/toolkit"

/**
 * Net-new Orders screens (Orderbook, Compliance, Simulation, Models) have no
 * backend support yet. These mock datasets are wrapped in createAsyncThunk so
 * the calling pages already have the exact shape/ergonomics (dispatch + unwrap)
 * they'll use once real endpoints exist — swap the body of each thunk for a
 * real investmentsApi call and nothing else in the calling components changes.
 */

// ─── Orderbook ──────────────────────────────────────────────────────────────
export interface MockOrder {
  id: string
  orderRef: string
  securitySymbol: string
  securityName: string
  side: "BUY" | "SELL"
  orderType: "MARKET" | "LIMIT"
  quantity: number
  filledQuantity: number
  limitPrice: number | null
  avgFillPrice: number | null
  status: "WORKING" | "PARTIAL" | "FILLED" | "CANCELLED" | "REJECTED"
  venue: string
  submittedAt: string
}

export const ORDERBOOK_MOCK: MockOrder[] = [
  { id: "ob-1", orderRef: "ORD-20260701-001", securitySymbol: "DELTA.ZW", securityName: "Delta Corporation", side: "BUY", orderType: "LIMIT", quantity: 50000, filledQuantity: 50000, limitPrice: 42.5, avgFillPrice: 42.31, status: "FILLED", venue: "FBC Securities (ZSE)", submittedAt: "2026-07-07T07:12:00Z" },
  { id: "ob-2", orderRef: "ORD-20260701-002", securitySymbol: "ECONET.ZW", securityName: "Econet Wireless", side: "SELL", orderType: "MARKET", quantity: 20000, filledQuantity: 12500, limitPrice: null, avgFillPrice: 118.4, status: "PARTIAL", venue: "FBC Securities (ZSE)", submittedAt: "2026-07-07T08:03:00Z" },
  { id: "ob-3", orderRef: "ORD-20260701-003", securitySymbol: "OKZIM.ZW", securityName: "OK Zimbabwe", side: "BUY", orderType: "LIMIT", quantity: 15000, filledQuantity: 0, limitPrice: 9.8, avgFillPrice: null, status: "WORKING", venue: "SECZIM Direct", submittedAt: "2026-07-07T08:41:00Z" },
  { id: "ob-4", orderRef: "ORD-20260701-004", securitySymbol: "PADENGA.ZW", securityName: "Padenga Holdings", side: "SELL", orderType: "LIMIT", quantity: 8000, filledQuantity: 0, limitPrice: 61.2, avgFillPrice: null, status: "CANCELLED", venue: "FBC Securities (ZSE)", submittedAt: "2026-07-06T13:22:00Z" },
  { id: "ob-5", orderRef: "ORD-20260701-005", securitySymbol: "SIMBISA.VX", securityName: "Simbisa Brands", side: "BUY", orderType: "MARKET", quantity: 6000, filledQuantity: 0, limitPrice: null, avgFillPrice: null, status: "REJECTED", venue: "SFC (VFEX)", submittedAt: "2026-07-06T15:55:00Z" },
  { id: "ob-6", orderRef: "ORD-20260701-006", securitySymbol: "INNSCOR.ZW", securityName: "Innscor Africa", side: "BUY", orderType: "LIMIT", quantity: 32000, filledQuantity: 32000, limitPrice: 145, avgFillPrice: 144.6, status: "FILLED", venue: "FBC Securities (ZSE)", submittedAt: "2026-07-05T09:10:00Z" },
]

export const fetchOrderbook = createAsyncThunk("ordersMock/fetchOrderbook", async () => {
  // TODO(backend): replace with investmentsApi.getOrderbook()
  return ORDERBOOK_MOCK
})

// ─── Compliance ─────────────────────────────────────────────────────────────
export interface MockComplianceCheck {
  id: string
  tradeRef: string
  checkType: "PRE_TRADE" | "POST_TRADE"
  rule: string
  status: "PASS" | "BREACH" | "WARNING"
  details: string
  checkedAt: string
}

export const COMPLIANCE_MOCK: MockComplianceCheck[] = [
  { id: "cc-1", tradeRef: "TRD-20260701-014", checkType: "PRE_TRADE", rule: "Single-issuer concentration limit (10%)", status: "PASS", details: "Post-trade exposure to DELTA.ZW would be 6.2% of fund NAV", checkedAt: "2026-07-07T07:11:40Z" },
  { id: "cc-2", tradeRef: "TRD-20260701-015", checkType: "PRE_TRADE", rule: "Restricted list screening", status: "BREACH", details: "ECONET.ZW is on the temporary restricted list pending insider window clearance", checkedAt: "2026-07-07T08:02:10Z" },
  { id: "cc-3", tradeRef: "TRD-20260701-016", checkType: "POST_TRADE", rule: "Best execution — price vs. VWAP", status: "WARNING", details: "Fill price 0.9% above session VWAP; within tolerance but flagged for review", checkedAt: "2026-07-07T08:45:02Z" },
  { id: "cc-4", tradeRef: "TRD-20260630-098", checkType: "PRE_TRADE", rule: "Liquidity coverage (T+3 settlement)", status: "PASS", details: "Sufficient cash and unencumbered securities to cover settlement", checkedAt: "2026-06-30T13:20:00Z" },
  { id: "cc-5", tradeRef: "TRD-20260630-101", checkType: "POST_TRADE", rule: "Wash trade detection", status: "PASS", details: "No offsetting counter-order detected within 24h window", checkedAt: "2026-06-30T16:02:00Z" },
  { id: "cc-6", tradeRef: "TRD-20260629-077", checkType: "PRE_TRADE", rule: "Sector exposure limit (Consumer, 25%)", status: "WARNING", details: "Trade would bring Consumer sector exposure to 23.8% of fund NAV", checkedAt: "2026-06-29T10:14:00Z" },
]

export const fetchComplianceChecks = createAsyncThunk("ordersMock/fetchComplianceChecks", async () => {
  // TODO(backend): replace with investmentsApi.getComplianceChecks()
  return COMPLIANCE_MOCK
})

// ─── Simulation ─────────────────────────────────────────────────────────────
export interface SimulationInput {
  securitySymbol: string
  side: "BUY" | "SELL"
  quantity: number
}

export interface SimulationResult {
  estimatedFillPrice: number
  priceImpactPct: number
  estimatedSlippageBps: number
  liquidityScore: "HIGH" | "MEDIUM" | "LOW"
  participationOfADV: number
  note: string
}

export const SIMULATION_PRESETS_MOCK: SimulationInput[] = [
  { securitySymbol: "DELTA.ZW", side: "BUY", quantity: 100000 },
  { securitySymbol: "ECONET.ZW", side: "SELL", quantity: 50000 },
  { securitySymbol: "OKZIM.ZW", side: "BUY", quantity: 25000 },
]

export const runOrderSimulation = createAsyncThunk(
  "ordersMock/runOrderSimulation",
  async (input: SimulationInput): Promise<SimulationResult> => {
    // TODO(backend): replace with investmentsApi.simulateOrderImpact(input)
    const sizeFactor = Math.min(input.quantity / 50000, 4)
    const priceImpactPct = Number((0.15 * sizeFactor).toFixed(2))
    const estimatedSlippageBps = Math.round(8 * sizeFactor)
    const liquidityScore: SimulationResult["liquidityScore"] = sizeFactor < 1 ? "HIGH" : sizeFactor < 2.5 ? "MEDIUM" : "LOW"
    return {
      estimatedFillPrice: input.side === "BUY" ? 42.5 * (1 + priceImpactPct / 100) : 42.5 * (1 - priceImpactPct / 100),
      priceImpactPct,
      estimatedSlippageBps,
      liquidityScore,
      participationOfADV: Number((sizeFactor * 6.4).toFixed(1)),
      note: "Simulated estimate — order impact modelling is not yet backed by a live liquidity engine.",
    }
  },
)

// ─── Trading Models ─────────────────────────────────────────────────────────
export interface MockTradingModel {
  id: string
  name: string
  description: string
  assetClass: string
  status: "ACTIVE" | "BACKTESTING" | "DISABLED"
  lastRunAt: string | null
  performanceYtdPct: number | null
}

export const TRADING_MODELS_MOCK: MockTradingModel[] = [
  { id: "tm-1", name: "ZSE Momentum Rotation", description: "Rotates between top-decile momentum names on the ZSE All Share on a monthly rebalance", assetClass: "Equities — ZSE", status: "ACTIVE", lastRunAt: "2026-07-01T06:00:00Z", performanceYtdPct: 14.2 },
  { id: "tm-2", name: "VFEX USD Yield Sweep", description: "Sweeps excess USD cash into short-duration VFEX-listed instruments overnight", assetClass: "Money Market — VFEX", status: "ACTIVE", lastRunAt: "2026-07-07T05:30:00Z", performanceYtdPct: 5.8 },
  { id: "tm-3", name: "Cross-Border Custody Arbitrage", description: "Flags custody-fee arbitrage opportunities between local and offshore settlement legs", assetClass: "Multi-asset", status: "BACKTESTING", lastRunAt: "2026-06-20T00:00:00Z", performanceYtdPct: null },
  { id: "tm-4", name: "Legacy Pairs Trade (ZSE/VFEX)", description: "Retired dual-listed pairs strategy, kept for reference", assetClass: "Equities", status: "DISABLED", lastRunAt: "2026-03-11T00:00:00Z", performanceYtdPct: -1.4 },
]

export const fetchTradingModels = createAsyncThunk("ordersMock/fetchTradingModels", async () => {
  // TODO(backend): replace with investmentsApi.getTradingModels()
  return TRADING_MODELS_MOCK
})
