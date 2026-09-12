/**
 * Presentation helpers for the fundraising onboarding screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type OnboardingType = "LP Commitment" | "Mandate"

export type KycOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "CLEARED"
  | "DOCUMENTS_REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "APPROVED_WITH_CONDITIONS"
  | "REJECTED"
  | "EXPIRED"

export type MandateOnboardingStatus =
  | "DRAFT"
  | "AWARDED"
  | "ONBOARDING"
  | "ASSETS_IN_TRANSITION"
  | "PARTIALLY_FUNDED"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "LOST_BEFORE_ACTIVATION"

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
  IN_PROGRESS: "In Progress",
  CLEARED: "Cleared",
  DOCUMENTS_REQUESTED: "Documents Requested",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  APPROVED_WITH_CONDITIONS: "Approved w/ Conditions",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
}

export const MANDATE_STATUS_LABEL: Record<MandateOnboardingStatus, string> = {
  DRAFT: "Draft",
  AWARDED: "Awarded",
  ONBOARDING: "Onboarding",
  ASSETS_IN_TRANSITION: "Assets in Transition",
  PARTIALLY_FUNDED: "Partially Funded",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
  LOST_BEFORE_ACTIVATION: "Lost Before Activation",
}

/**
 * Card chrome only — label, sublabel, icon and colours. `value` is a placeholder that
 * fundraising-onboarding.tsx replaces with a live count for every id in this list.
 */
export const ONBOARDING_KPIS: OnboardingKpi[] = [
  {
    id: "active",
    label: "Active Cases",
    value: "",
    sublabel: "LP + mandate onboarding",
    icon: "users",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
  },
  {
    id: "kyc-approved",
    label: "KYC Cleared",
    value: "",
    sublabel: "Ready for activation",
    icon: "shield",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
  },
  {
    id: "in-review",
    label: "In Review",
    value: "",
    sublabel: "Compliance or KYC pending",
    icon: "clock",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    id: "holds",
    label: "Compliance Holds",
    value: "",
    sublabel: "Cannot admit / fund / activate",
    icon: "alert",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
  },
]

export function kycStatusClass(status: KycOnboardingStatus): string {
  switch (status) {
    case "APPROVED":
    case "CLEARED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "APPROVED_WITH_CONDITIONS":
      return "bg-[#fef9c3] text-[#a16207]"
    case "UNDER_REVIEW":
    case "IN_PROGRESS":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "DOCUMENTS_REQUESTED":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "REJECTED":
    case "EXPIRED":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}

export function mandateStatusClass(status: MandateOnboardingStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#dcfce7] text-[#15803d]"
    case "PARTIALLY_FUNDED":
    case "ASSETS_IN_TRANSITION":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "ONBOARDING":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "AWARDED":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "SUSPENDED":
    case "TERMINATED":
    case "LOST_BEFORE_ACTIVATION":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#111111]"
  }
}
