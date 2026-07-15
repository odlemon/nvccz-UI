export type ScenarioId = "downside" | "base" | "upside"

export type ForecastKpi = {
  id: "target" | "signed" | "gross" | "weighted" | "coverage" | "fee"
  label: string
  value: string
  meta: string
  pct: number
  accent: string
  bar: string
}

export type MonthlyClose = {
  month: string
  amount: number
}

export type FunnelStage = {
  id: string
  stage: string
  count: number
  gross: string
  grossNum: number
  weighted: string
  weightedNum: number
  conversion: number
}

export type InvestorConcentration = {
  id: string
  investor: string
  committed: string
  committedNum: number
  pct: number
  tier: "Anchor" | "Core" | "Long tail"
}

export type ScenarioAssumptions = {
  closeVelocity: number
  winRate: number
  avgTicketM: number
  feeRatePct: number
  pipelineDecay: number
}

export type ForecastScenario = {
  id: ScenarioId
  label: string
  description: string
  kpis: ForecastKpi[]
  monthlyCloses: MonthlyClose[]
  assumptions: ScenarioAssumptions
}

const BASE_FUNNEL: FunnelStage[] = [
  { id: "f1", stage: "Prospect", count: 42, gross: "US$84.0M", grossNum: 84, weighted: "US$16.8M", weightedNum: 16.8, conversion: 20 },
  { id: "f2", stage: "Qualified", count: 28, gross: "US$56.0M", grossNum: 56, weighted: "US$22.4M", weightedNum: 22.4, conversion: 40 },
  { id: "f3", stage: "Due Diligence", count: 14, gross: "US$35.0M", grossNum: 35, weighted: "US$24.5M", weightedNum: 24.5, conversion: 70 },
  { id: "f4", stage: "Term Sheet", count: 8, gross: "US$22.0M", grossNum: 22, weighted: "US$17.6M", weightedNum: 17.6, conversion: 80 },
  { id: "f5", stage: "Committed", count: 5, gross: "US$15.0M", grossNum: 15, weighted: "US$15.0M", weightedNum: 15, conversion: 100 },
]

const BASE_CONCENTRATION: InvestorConcentration[] = [
  { id: "c1", investor: "NMBZ Holdings Limited", committed: "US$8.0M", committedNum: 8, pct: 32, tier: "Anchor" },
  { id: "c2", investor: "Nyasha Pension Fund", committed: "US$5.0M", committedNum: 5, pct: 20, tier: "Anchor" },
  { id: "c3", investor: "Granite Peak Trustees", committed: "US$4.0M", committedNum: 4, pct: 16, tier: "Core" },
  { id: "c4", investor: "Zimnat Asset Managers", committed: "US$3.0M", committedNum: 3, pct: 12, tier: "Core" },
  { id: "c5", investor: "CBZ Insurance", committed: "US$2.5M", committedNum: 2.5, pct: 10, tier: "Core" },
  { id: "c6", investor: "Other (6 investors)", committed: "US$2.5M", committedNum: 2.5, pct: 10, tier: "Long tail" },
]

export const FORECAST_SCENARIOS: Record<ScenarioId, ForecastScenario> = {
  downside: {
    id: "downside",
    label: "Downside",
    description: "Slower closes, lower win rate — conservative fee outlook",
    assumptions: {
      closeVelocity: 35,
      winRate: 28,
      avgTicketM: 2.8,
      feeRatePct: 1.75,
      pipelineDecay: 18,
    },
    kpis: [
      { id: "target", label: "Target Raise", value: "US$60.0M", meta: "100% of target", pct: 100, accent: "#7c3aed", bar: "#8b5cf6" },
      { id: "signed", label: "Signed", value: "US$18.5M", meta: "31% of target", pct: 31, accent: "#16a34a", bar: "#22c55e" },
      { id: "gross", label: "Gross Pipeline", value: "US$72.0M", meta: "1.2x coverage", pct: 60, accent: "#2563eb", bar: "#3b82f6" },
      { id: "weighted", label: "Weighted Pipeline", value: "US$28.4M", meta: "47% of target", pct: 47, accent: "#0ea5e9", bar: "#38bdf8" },
      { id: "coverage", label: "Coverage Ratio", value: "1.2x", meta: "vs target", pct: 40, accent: "#d97706", bar: "#f59e0b" },
      { id: "fee", label: "Expected Fee Revenue", value: "US$1.05M", meta: "1.75% blended", pct: 35, accent: "#6d28d9", bar: "#7c3aed" },
    ],
    monthlyCloses: [
      { month: "Jul", amount: 1.2 },
      { month: "Aug", amount: 2.0 },
      { month: "Sep", amount: 2.8 },
      { month: "Oct", amount: 3.5 },
      { month: "Nov", amount: 4.2 },
      { month: "Dec", amount: 4.8 },
    ],
  },
  base: {
    id: "base",
    label: "Base",
    description: "Current velocity and conversion — management plan",
    assumptions: {
      closeVelocity: 55,
      winRate: 42,
      avgTicketM: 3.2,
      feeRatePct: 2.0,
      pipelineDecay: 10,
    },
    kpis: [
      { id: "target", label: "Target Raise", value: "US$60.0M", meta: "100% of target", pct: 100, accent: "#7c3aed", bar: "#8b5cf6" },
      { id: "signed", label: "Signed", value: "US$25.0M", meta: "42% of target", pct: 42, accent: "#16a34a", bar: "#22c55e" },
      { id: "gross", label: "Gross Pipeline", value: "US$132.0M", meta: "2.2x coverage", pct: 88, accent: "#2563eb", bar: "#3b82f6" },
      { id: "weighted", label: "Weighted Pipeline", value: "US$52.8M", meta: "88% of target", pct: 88, accent: "#0ea5e9", bar: "#38bdf8" },
      { id: "coverage", label: "Coverage Ratio", value: "2.2x", meta: "vs target", pct: 88, accent: "#7c3aed", bar: "#a78bfa" },
      { id: "fee", label: "Expected Fee Revenue", value: "US$1.20M", meta: "2.0% blended", pct: 60, accent: "#6d28d9", bar: "#7c3aed" },
    ],
    monthlyCloses: [
      { month: "Jul", amount: 2.5 },
      { month: "Aug", amount: 4.0 },
      { month: "Sep", amount: 5.5 },
      { month: "Oct", amount: 7.0 },
      { month: "Nov", amount: 8.5 },
      { month: "Dec", amount: 10.0 },
    ],
  },
  upside: {
    id: "upside",
    label: "Upside",
    description: "Accelerated closes with anchor re-ups and co-invest interest",
    assumptions: {
      closeVelocity: 78,
      winRate: 58,
      avgTicketM: 4.0,
      feeRatePct: 2.25,
      pipelineDecay: 5,
    },
    kpis: [
      { id: "target", label: "Target Raise", value: "US$60.0M", meta: "100% of target", pct: 100, accent: "#7c3aed", bar: "#8b5cf6" },
      { id: "signed", label: "Signed", value: "US$32.0M", meta: "53% of target", pct: 53, accent: "#16a34a", bar: "#22c55e" },
      { id: "gross", label: "Gross Pipeline", value: "US$168.0M", meta: "2.8x coverage", pct: 100, accent: "#2563eb", bar: "#3b82f6" },
      { id: "weighted", label: "Weighted Pipeline", value: "US$72.0M", meta: "120% of target", pct: 100, accent: "#0ea5e9", bar: "#38bdf8" },
      { id: "coverage", label: "Coverage Ratio", value: "2.8x", meta: "vs target", pct: 100, accent: "#16a34a", bar: "#22c55e" },
      { id: "fee", label: "Expected Fee Revenue", value: "US$1.35M", meta: "2.25% blended", pct: 85, accent: "#6d28d9", bar: "#7c3aed" },
    ],
    monthlyCloses: [
      { month: "Jul", amount: 4.0 },
      { month: "Aug", amount: 6.5 },
      { month: "Sep", amount: 9.0 },
      { month: "Oct", amount: 11.5 },
      { month: "Nov", amount: 14.0 },
      { month: "Dec", amount: 16.5 },
    ],
  },
}

export const FORECAST_FUNNEL: FunnelStage[] = BASE_FUNNEL

export const FORECAST_CONCENTRATION: InvestorConcentration[] = BASE_CONCENTRATION

export const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "downside", label: "Downside" },
  { id: "base", label: "Base" },
  { id: "upside", label: "Upside" },
]

export function tierClass(tier: InvestorConcentration["tier"]) {
  switch (tier) {
    case "Anchor":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Core":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
