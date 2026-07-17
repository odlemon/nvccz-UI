export type PipelineStage = {
  id: string
  name: string
  /** null when this is a reference stage code (no live campaign/probability configured) */
  probability: number | null
}

export type StageGate = {
  id: string
  from: string
  to: string
  requirements: string[]
}

export type FrRole = {
  id: string
  name: string
  summary: string
  permissions: string[]
}

export type FrNotification = {
  id: string
  label: string
  enabled: boolean
}

/**
 * Fallback reference stages — used only when no live campaign of that type exists yet.
 * Codes/order from design-refs/fundraising-frontend-api.md ("PE / VC stage codes (seed order)"
 * and "AM mandate stage codes"). No probability shown — that is server-configured per campaign.
 */
export const PE_STAGE_CODES: PipelineStage[] = [
  "TARGET_INVESTOR",
  "CONTACTED",
  "QUALIFIED",
  "ENGAGED",
  "DATA_ROOM",
  "DUE_DILIGENCE",
  "IC_REVIEW",
  "COMMERCIAL_NEGOTIATION",
  "SUBSCRIPTION_DOCS",
  "KYC_COMPLIANCE",
  "SIGNED",
  "ADMITTED",
  "FUNDED",
].map((code) => ({
  id: code,
  name: code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  probability: null,
}))

export const AM_STAGE_CODES: PipelineStage[] = [
  "TARGET_CLIENT",
  "INITIAL_CONTACT",
  "DISCOVERY",
  "QUALIFIED",
  "RFI_RFP",
  "PROPOSAL",
  "DUE_DILIGENCE",
  "PRESENTATION",
  "PREFERRED_BIDDER",
  "NEGOTIATION",
  "AWARDED",
  "ASSETS_IN_TRANSITION",
  "ACTIVATED",
].map((code) => ({
  id: code,
  name: code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  probability: null,
}))

/** SRD amount type labels (fundraising-frontend.md guardrails table) — read-only, independent, never overwrite each other. */
export const AMOUNT_TYPES = [
  "Indicative",
  "Qualified",
  "Soft Circle",
  "Proposed",
  "Signed",
  "Admitted",
  "Funded",
  "Expected AUM",
  "Activated AUM",
] as const

export type AmountType = (typeof AMOUNT_TYPES)[number]

export const STAGE_GATES: StageGate[] = [
  {
    id: "sg-1",
    from: "Prospect",
    to: "Qualified",
    requirements: ["Investor type confirmed", "Ticket size estimated", "Owner assigned"],
  },
  {
    id: "sg-2",
    from: "Qualified",
    to: "Management Meeting",
    requirements: ["Intro call completed", "NDA sent or on file", "Campaign linked"],
  },
  {
    id: "sg-3",
    from: "DD / Data Room",
    to: "IC Review",
    requirements: ["Data room access granted", "DD checklist ≥ 80% complete", "Signed NDA on file"],
  },
  {
    id: "sg-4",
    from: "IC Review",
    to: "Commitment",
    requirements: ["IC approval recorded", "Term sheet signed", "KYC initiated"],
  },
  {
    id: "sg-5",
    from: "Proposal",
    to: "Due Diligence",
    requirements: ["Proposal submitted", "Fee schedule attached", "Mandate scope documented"],
  },
]

export const FR_ROLES: FrRole[] = [
  {
    id: "role-1",
    name: "Fundraising Lead",
    summary: "Full module access, approvals, and settings",
    permissions: ["Pipeline", "Commitments", "Settings", "Approvals", "Audit"],
  },
  {
    id: "role-2",
    name: "Deal Manager",
    summary: "Owns opportunities, documents, and investor engagement",
    permissions: ["Pipeline", "Contacts", "Documents", "Meetings", "Communications"],
  },
  {
    id: "role-3",
    name: "Legal & Compliance",
    summary: "Agreements, data rooms, and DD oversight",
    permissions: ["Agreements", "Data Rooms", "Due Diligence", "Documents"],
  },
  {
    id: "role-4",
    name: "Read-only Analyst",
    summary: "View pipeline and reports without edit rights",
    permissions: ["Pipeline (view)", "Reports", "Dashboard"],
  },
]

export const FR_NOTIFICATIONS: FrNotification[] = [
  { id: "n-1", label: "Stage change on owned opportunities", enabled: true },
  { id: "n-2", label: "New commitment recorded", enabled: true },
  { id: "n-3", label: "Agreement sent for signature", enabled: true },
  { id: "n-4", label: "Data room access request", enabled: false },
  { id: "n-5", label: "IC approval required", enabled: true },
  { id: "n-6", label: "Weekly pipeline digest", enabled: false },
  { id: "n-7", label: "Document version superseded", enabled: true },
  { id: "n-8", label: "Closing checklist overdue", enabled: true },
]

export function probabilityColor(value: number | null): string {
  if (value == null) return "#94a3b8"
  if (value >= 80) return "#16a34a"
  if (value >= 60) return "#2563eb"
  if (value >= 40) return "#0284c7"
  if (value >= 25) return "#7c3aed"
  return "#94a3b8"
}
