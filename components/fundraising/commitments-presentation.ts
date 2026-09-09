/**
 * Presentation helpers for the fundraising commitments screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type DocsStatus = "In Progress" | "Complete" | "Not Started"
export type KycStatus = "Approved" | "In Review" | "Not Started"
export type SignatureStatus = "Signed" | "Pending"
export type FundingStatus =
  | "Ready to Fund"
  | "Funding Confirmed"
  | "Scheduled"
  | "Not Scheduled"

export type CommitmentKpi = {
  id: string
  label: string
  amount: string
  pctOfTarget: number
  icon: "target" | "shield" | "file-pen" | "coins" | "badge-check"
  iconColor: string
  iconBg: string
  barColor: string
}

export type CommitmentInvestor = {
  id: string
  name: string
  /** Domain used for logo lookup (Google favicons / local asset). */
  logoDomain: string
  /** Optional local override under /fundraising/logos */
  logoSrc?: string
  logoLabel: string
  logoBg: string
  logoText: string
  softCircled: boolean
  hardCircled: boolean
  commitmentAmount: string
  docsStatus: DocsStatus
  kycStatus: KycStatus
  signatureStatus: SignatureStatus
  fundingStatus: FundingStatus
  closeDate: string | null
  owner: {
    name: string
    initials: string
    avatarBg: string
  }
}

export type ChecklistItem = {
  id: string
  label: string
  status: "Completed" | "Pending" | "Not Started"
  date: string | null
}

export type ClosingEvent = {
  title: string
  amount: string
  expectedCloseDate: string
  commitmentsCount: number
  targetAmount: string
  committedAmount: string
  committedPct: number
}

export type TimelineStep = {
  id: string
  label: string
  date: string
  state: "done" | "current" | "upcoming"
}

/**
 * Card chrome only — label, icon and colours. `amount` and `pctOfTarget` are placeholders
 * that fundraising-commitments.tsx replaces with live totals for every id in this list.
 */
export const COMMITMENT_KPIS: CommitmentKpi[] = [
  {
    id: "soft",
    label: "Soft Circled",
    amount: "",
    pctOfTarget: 0,
    icon: "target",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
    barColor: "#7c3aed",
  },
  {
    id: "hard",
    label: "Hard Circled",
    amount: "",
    pctOfTarget: 0,
    icon: "shield",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    barColor: "#2563eb",
  },
  {
    id: "signed",
    label: "Signed Commitments",
    amount: "",
    pctOfTarget: 0,
    icon: "file-pen",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    barColor: "#22c55e",
  },
  {
    id: "funded",
    label: "Funded",
    amount: "",
    pctOfTarget: 0,
    icon: "coins",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    barColor: "#4ade80",
  },
  {
    id: "ready",
    label: "Ready for Close",
    amount: "",
    pctOfTarget: 0,
    icon: "badge-check",
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
    barColor: "#a78bfa",
  },
]

/** Per-investor closing checklists keyed by investor id. */

export const FUNDING_STATUS_OPTIONS: FundingStatus[] = [
  "Ready to Fund",
  "Funding Confirmed",
  "Scheduled",
  "Not Scheduled",
]

export function investorLogoUrl(investor: CommitmentInvestor, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(investor.logoDomain)}&sz=${size}`
}
