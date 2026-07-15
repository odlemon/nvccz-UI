export type PipelineStage = {
  id: string
  name: string
  probability: number
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

export const PE_STAGES: PipelineStage[] = [
  { id: "pe-1", name: "Prospect", probability: 10 },
  { id: "pe-2", name: "Qualified", probability: 25 },
  { id: "pe-3", name: "Management Meeting", probability: 40 },
  { id: "pe-4", name: "DD / Data Room", probability: 55 },
  { id: "pe-5", name: "IC Review", probability: 70 },
  { id: "pe-6", name: "Commitment", probability: 85 },
  { id: "pe-7", name: "Closed", probability: 100 },
]

export const AM_STAGES: PipelineStage[] = [
  { id: "am-1", name: "Target Client", probability: 8 },
  { id: "am-2", name: "Qualified", probability: 20 },
  { id: "am-3", name: "RFI / RFP", probability: 35 },
  { id: "am-4", name: "Proposal", probability: 50 },
  { id: "am-5", name: "Due Diligence", probability: 65 },
  { id: "am-6", name: "Awarded", probability: 80 },
  { id: "am-7", name: "Activated", probability: 100 },
]

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

/** SRD amount type labels — read-only in settings UI */
export const AMOUNT_TYPES = [
  "Indicative",
  "Soft circle",
  "Signed",
  "Admitted",
  "Funded",
  "Expected AUM",
  "Activated AUM",
] as const

export type AmountType = (typeof AMOUNT_TYPES)[number]

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

export function probabilityColor(value: number): string {
  if (value >= 80) return "#16a34a"
  if (value >= 60) return "#2563eb"
  if (value >= 40) return "#0284c7"
  if (value >= 25) return "#7c3aed"
  return "#94a3b8"
}
