/**
 * Presentation helpers for the fundraising investors screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type InvestorType =
  | "Pension Fund"
  | "Insurer"
  | "DFI"
  | "Family Office"
  | "Sovereign"
  | "Corporate"
  | "Bank"
  | "Fund of Funds"

export type KycStatus =
  | "NOT_STARTED"
  | "DOCUMENTS_REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "APPROVED_WITH_CONDITIONS"
  | "REJECTED"

export type InvestorOrg = {
  id: string
  legalName: string
  tradingName?: string
  type: InvestorType
  country: string
  jurisdiction: string
  estimatedAum: string
  ticketRange: string
  owner: string
  status: "Active" | "Prospect" | "Inactive"
  kycStatus: KycStatus
  sanctionsStatus: "Clear" | "Not Screened" | "Flagged"
  lastInteraction: string
  nextAction: string
  openOpportunities: number
  commitments: string
  logoLabel: string
  logoBg: string
  assetPreferences: string[]
  score: number
}

export function kycChipClass(status: KycStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "APPROVED_WITH_CONDITIONS":
      return "bg-[#e0f2fe] text-[#0369a1]"
    case "UNDER_REVIEW":
    case "DOCUMENTS_REQUESTED":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "REJECTED":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}

export function kycLabel(status: KycStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}
