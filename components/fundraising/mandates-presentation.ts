/**
 * Presentation helpers for the fundraising mandates screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type MandateStage = "rfp" | "mandate_live" | "shortlist" | "evaluation"

export type MandateRow = {
  id: string
  name: string
  mandateType: string
  organization: string
  assetClass: string
  geography: string
  mandateSize: string
  stage: MandateStage
  rfpDueDate: string
  nextStep: string
  score: number
  orgType: string
  /** Detail panel subtitle geography */
  detailGeography: string
  geographyFlag: string
  /** Square org tile in the Mandate column */
  logoLabel: string
  logoBg: string
  logoText: string
}

export type MandateContact = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  initials: string
  isPrimary?: boolean
}

export type MandateInteraction = {
  id: string
  date: string
  title: string
  detail?: string
}

export type MandateDocument = {
  id: string
  name: string
  sharedOn: string
}

export type MandateEmail = {
  id: string
  date: string
  subject: string
  from: string
}

export type MandateMeeting = {
  id: string
  date: string
  title: string
  detail?: string
  status: "Completed" | "Scheduled" | "Upcoming"
}

export type MandateDetail = {
  contacts: MandateContact[]
  interactions: MandateInteraction[]
  interests: string[]
  documents: MandateDocument[]
  emails: MandateEmail[]
  meetings: MandateMeeting[]
}

export const MANDATE_STAGES: { id: MandateStage; label: string }[] = [
  { id: "rfp", label: "RFP" },
  { id: "mandate_live", label: "Mandate Live" },
  { id: "shortlist", label: "Shortlist" },
  { id: "evaluation", label: "Evaluation" },
]

export function scoreLabel(score: number): string {
  if (score >= 85) return "High"
  if (score >= 70) return "Good"
  if (score >= 55) return "Medium"
  return "Low"
}
