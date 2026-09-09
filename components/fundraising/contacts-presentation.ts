/**
 * Presentation helpers for the fundraising contacts screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type ContactInfluence = "Decision Maker" | "Influencer" | "Gatekeeper" | "Analyst"

export type InvestorContact = {
  id: string
  name: string
  initials: string
  avatarBg: string
  role: string
  department: string
  organisationId: string
  organisationName: string
  email: string
  phone: string
  influence: ContactInfluence
  consent: boolean
  lastInteraction: string
  nextAction: string
  owner: string
  campaigns: string[]
}

export function influenceChipClass(influence: ContactInfluence): string {
  switch (influence) {
    case "Decision Maker":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Influencer":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Gatekeeper":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}
