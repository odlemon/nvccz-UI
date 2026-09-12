/**
 * Presentation helpers for the fundraising dashboard screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type DashMode = "pe_vc" | "asset_mgmt"
export type CampaignFilter = "all" | "zgf" | "mandate"

export type DashCampaign = {
  id: CampaignFilter
  name: string
  typeLabel: string
  mode: DashMode
}

export type DashKpiSet = {
  target: { amount: string; amountM: number; helper: string }
  soft: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  signed: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  admitted: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  funded: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  weighted: { amount: string; amountM: number; helper: string }
  /** AM mode substitutes for signed/admitted/funded display */
  expectedAum?: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  activatedAum?: { amount: string; amountM: number; helper: string; pctOfTarget: number }
}

export type DashProgress = {
  targetM: number
  signedM: number
  fundedM: number
  remainingM: number
  firstClose: string
  finalClose: string
  signedLabel: string
  fundedLabel: string
}

export type DashCoverage = {
  grossPipeline: string
  weightedPipeline: string
  remainingTarget: string
  coverageRatio: string
  coveragePct: number
  expectedFee: string
}

export type DashFunnelStage = {
  id: string
  label: string
  count: number
  amount: string
}

export type DashOpportunity = {
  id: string
  investor: string
  logoLabel: string
  logoBg: string
  campaignId: CampaignFilter
  campaignName: string
  stage: string
  softAmount: string
  signedAmount: string
  fundedAmount: string
  expectedAum: string
  activatedAum: string
  owner: string
  nextAction: string
  ageingDays: number
  mode: DashMode
}

export type DashTaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_ON_INVESTOR"
  | "WAITING_ON_INTERNAL_TEAM"
  | "COMPLETED"
  | "OVERDUE"

export type DashTask = {
  id: string
  title: string
  related: string
  dueDate: string
  status: DashTaskStatus
  owner: string
}

export type DashActivityKind =
  | "meeting"
  | "email"
  | "ddq"
  | "commitment"
  | "call"
  | "document"

export type DashActivity = {
  id: string
  kind: DashActivityKind
  title: string
  detail: string
  timestamp: string
  actor: string
}

export function stageChipClass(stage: string): string {
  const s = stage.toLowerCase()
  if (s.includes("fund") || s.includes("activat")) return "bg-[#dcfce7] text-[#15803d]"
  if (s.includes("sign") || s.includes("admit") || s.includes("award"))
    return "bg-[#ede9fe] text-[#6d28d9]"
  if (s.includes("due") || s.includes("negot") || s.includes("prefer"))
    return "bg-[#ffedd5] text-[#c2410c]"
  if (s.includes("data") || s.includes("propos") || s.includes("rfi") || s.includes("rfp"))
    return "bg-[#dbeafe] text-[#1d4ed8]"
  return "bg-[#f1f5f9] text-[#111111]"
}

export function taskStatusClass(status: DashTaskStatus): string {
  switch (status) {
    case "OVERDUE":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "IN_PROGRESS":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "WAITING_ON_INVESTOR":
    case "WAITING_ON_INTERNAL_TEAM":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}

export function taskStatusLabel(status: DashTaskStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Not started"
    case "IN_PROGRESS":
      return "In progress"
    case "WAITING_ON_INVESTOR":
      return "Waiting on investor"
    case "WAITING_ON_INTERNAL_TEAM":
      return "Waiting internal"
    case "COMPLETED":
      return "Completed"
    case "OVERDUE":
      return "Overdue"
  }
}
