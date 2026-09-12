/**
 * Presentation helpers for the fundraising placement-agents screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type CommissionStatus = "Accruing" | "Paid" | "On Hold"

export type AgentOpportunity = {
  id: string
  investor: string
  amount: string
  eligible: boolean
}

export type PlacementAgent = {
  id: string
  name: string
  geography: string
  feePct: number
  retainer: string
  period: string
  introducedCount: number
  commissionStatus: CommissionStatus
  exclusions: string[]
  opportunities: AgentOpportunity[]
  appointedAt: string
  owner: string
}

export type PlacementAgentKpi = {
  id: string
  label: string
  value: string
  sublabel: string
  icon: "users" | "coins" | "clock" | "ban"
  iconColor: string
  iconBg: string
}

export const GEOGRAPHY_OPTIONS = [
  "Southern Africa",
  "UK & Europe",
  "Zimbabwe — Local",
  "Middle East & North Africa",
  "East Africa",
  "Global",
]

export function commissionStatusClass(status: CommissionStatus): string {
  switch (status) {
    case "Paid":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Accruing":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "On Hold":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}
