export type OnboardingType = "LP Commitment" | "Mandate"

export type KycOnboardingStatus =
  | "NOT_STARTED"
  | "DOCUMENTS_REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "APPROVED_WITH_CONDITIONS"
  | "REJECTED"

export type MandateOnboardingStatus =
  | "AWARDED"
  | "ONBOARDING"
  | "ASSETS_IN_TRANSITION"
  | "ACTIVE"

export type OnboardingChecklistItem = {
  id: string
  label: string
  done: boolean
}

export type OnboardingCase = {
  id: string
  investor: string
  type: OnboardingType
  kycStatus: KycOnboardingStatus
  mandateStatus?: MandateOnboardingStatus
  complianceHold: boolean
  owner: string
  checklist: OnboardingChecklistItem[]
  progress: number
  startedAt: string
  campaign: string
}

export type OnboardingKpi = {
  id: string
  label: string
  value: string
  sublabel: string
  icon: "users" | "shield" | "clock" | "alert"
  iconColor: string
  iconBg: string
}

export const KYC_STATUS_LABEL: Record<KycOnboardingStatus, string> = {
  NOT_STARTED: "Not Started",
  DOCUMENTS_REQUESTED: "Documents Requested",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  APPROVED_WITH_CONDITIONS: "Approved w/ Conditions",
  REJECTED: "Rejected",
}

export const MANDATE_STATUS_LABEL: Record<MandateOnboardingStatus, string> = {
  AWARDED: "Awarded",
  ONBOARDING: "Onboarding",
  ASSETS_IN_TRANSITION: "Assets in Transition",
  ACTIVE: "Active",
}

export const ONBOARDING_KPIS: OnboardingKpi[] = [
  {
    id: "active",
    label: "Active Cases",
    value: "6",
    sublabel: "LP + mandate onboarding",
    icon: "users",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
  },
  {
    id: "kyc-approved",
    label: "KYC Cleared",
    value: "2",
    sublabel: "Ready for activation",
    icon: "shield",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
  },
  {
    id: "in-review",
    label: "In Review",
    value: "2",
    sublabel: "Compliance or KYC pending",
    icon: "clock",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    id: "holds",
    label: "Compliance Holds",
    value: "1",
    sublabel: "Cannot admit / fund / activate",
    icon: "alert",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
  },
]

export const ONBOARDING_CASES: OnboardingCase[] = [
  {
    id: "ob-nyasha",
    investor: "Nyasha Capital Partners",
    type: "LP Commitment",
    kycStatus: "UNDER_REVIEW",
    complianceHold: true,
    owner: "Tendai M.",
    progress: 42,
    startedAt: "28 Jun 2026",
    campaign: "ZGF II",
    checklist: [
      { id: "c1", label: "Investor profile & UBO declaration", done: true },
      { id: "c2", label: "Source of funds attestation", done: true },
      { id: "c3", label: "AML / sanctions screening", done: false },
      { id: "c4", label: "Subscription agreement executed", done: false },
      { id: "c5", label: "Custodian account opened", done: false },
      { id: "c6", label: "Capital call readiness confirmed", done: false },
    ],
  },
  {
    id: "ob-nmbz",
    investor: "NMBZ Holdings Limited",
    type: "LP Commitment",
    kycStatus: "APPROVED",
    complianceHold: false,
    owner: "Rudo K.",
    progress: 78,
    startedAt: "12 Jun 2026",
    campaign: "ZGF II",
    checklist: [
      { id: "c1", label: "Investor profile & UBO declaration", done: true },
      { id: "c2", label: "Source of funds attestation", done: true },
      { id: "c3", label: "AML / sanctions screening", done: true },
      { id: "c4", label: "Subscription agreement executed", done: true },
      { id: "c5", label: "Custodian account opened", done: false },
      { id: "c6", label: "Capital call readiness confirmed", done: false },
    ],
  },
  {
    id: "ob-old-mutual",
    investor: "Old Mutual Investment Group",
    type: "LP Commitment",
    kycStatus: "APPROVED_WITH_CONDITIONS",
    complianceHold: false,
    owner: "Farai N.",
    progress: 65,
    startedAt: "05 Jul 2026",
    campaign: "ZGF II",
    checklist: [
      { id: "c1", label: "Investor profile & UBO declaration", done: true },
      { id: "c2", label: "Source of funds attestation", done: true },
      { id: "c3", label: "AML / sanctions screening", done: true },
      { id: "c4", label: "Subscription agreement executed", done: false },
      { id: "c5", label: "Side letter — fee rebate (condition)", done: false },
      { id: "c6", label: "Custodian account opened", done: false },
    ],
  },
  {
    id: "ob-nssa",
    investor: "National Social Security Authority (NSSA)",
    type: "Mandate",
    kycStatus: "DOCUMENTS_REQUESTED",
    mandateStatus: "ONBOARDING",
    complianceHold: false,
    owner: "Chipo D.",
    progress: 35,
    startedAt: "01 Jul 2026",
    campaign: "Institutional Mandates FY25",
    checklist: [
      { id: "c1", label: "Mandate award letter acknowledged", done: true },
      { id: "c2", label: "IMA draft circulated", done: true },
      { id: "c3", label: "Custodian onboarding pack submitted", done: false },
      { id: "c4", label: "Board resolution received", done: false },
      { id: "c5", label: "Asset transition plan signed off", done: false },
      { id: "c6", label: "Go-live readiness review", done: false },
    ],
  },
  {
    id: "ob-stanbic",
    investor: "Stanbic Bank Zimbabwe",
    type: "LP Commitment",
    kycStatus: "NOT_STARTED",
    complianceHold: false,
    owner: "Tendai M.",
    progress: 12,
    startedAt: "14 Jul 2026",
    campaign: "ZGF II",
    checklist: [
      { id: "c1", label: "Investor profile & UBO declaration", done: false },
      { id: "c2", label: "Source of funds attestation", done: false },
      { id: "c3", label: "AML / sanctions screening", done: false },
      { id: "c4", label: "Subscription agreement executed", done: false },
      { id: "c5", label: "Custodian account opened", done: false },
      { id: "c6", label: "Capital call readiness confirmed", done: false },
    ],
  },
  {
    id: "ob-cabs",
    investor: "CABS Building Society",
    type: "Mandate",
    kycStatus: "UNDER_REVIEW",
    mandateStatus: "ASSETS_IN_TRANSITION",
    complianceHold: false,
    owner: "Rudo K.",
    progress: 58,
    startedAt: "18 Jun 2026",
    campaign: "Institutional Mandates FY25",
    checklist: [
      { id: "c1", label: "Mandate award letter acknowledged", done: true },
      { id: "c2", label: "IMA executed", done: true },
      { id: "c3", label: "Custodian onboarding complete", done: true },
      { id: "c4", label: "Board resolution received", done: true },
      { id: "c5", label: "Asset transition plan signed off", done: false },
      { id: "c6", label: "Go-live readiness review", done: false },
    ],
  },
]

export const OWNER_OPTIONS = ["Tendai M.", "Rudo K.", "Farai N.", "Chipo D."]

export const CAMPAIGN_OPTIONS = ["ZGF II", "Institutional Mandates FY25"]

export function kycStatusClass(status: KycOnboardingStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "APPROVED_WITH_CONDITIONS":
      return "bg-[#fef9c3] text-[#a16207]"
    case "UNDER_REVIEW":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "DOCUMENTS_REQUESTED":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "REJECTED":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function mandateStatusClass(status: MandateOnboardingStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#dcfce7] text-[#15803d]"
    case "ASSETS_IN_TRANSITION":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "ONBOARDING":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "AWARDED":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
