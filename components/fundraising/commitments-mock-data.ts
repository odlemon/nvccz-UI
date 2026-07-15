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

export const COMMITMENT_KPIS: CommitmentKpi[] = [
  {
    id: "soft",
    label: "Soft Circled",
    amount: "US$33.21M",
    pctOfTarget: 74,
    icon: "target",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
    barColor: "#7c3aed",
  },
  {
    id: "hard",
    label: "Hard Circled",
    amount: "US$28.40M",
    pctOfTarget: 63,
    icon: "shield",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    barColor: "#2563eb",
  },
  {
    id: "signed",
    label: "Signed Commitments",
    amount: "US$22.60M",
    pctOfTarget: 45,
    icon: "file-pen",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    barColor: "#22c55e",
  },
  {
    id: "funded",
    label: "Funded",
    amount: "US$16.90M",
    pctOfTarget: 34,
    icon: "coins",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    barColor: "#4ade80",
  },
  {
    id: "ready",
    label: "Ready for Close",
    amount: "US$5.85M",
    pctOfTarget: 12,
    icon: "badge-check",
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
    barColor: "#a78bfa",
  },
]

const owners = {
  tariro: { name: "Tariro Moyo", initials: "TM", avatarBg: "#c4b5fd" },
  farai: { name: "Farai Ncube", initials: "FN", avatarBg: "#93c5fd" },
  grace: { name: "Grace Chirwa", initials: "GC", avatarBg: "#f9a8d4" },
  tendai: { name: "Tendai Banda", initials: "TB", avatarBg: "#86efac" },
  rudo: { name: "Rudo Dube", initials: "RD", avatarBg: "#fdba74" },
  tawanda: { name: "Tawanda C.", initials: "TC", avatarBg: "#67e8f9" },
} as const

export const COMMITMENT_INVESTORS: CommitmentInvestor[] = [
  {
    id: "inv-1",
    name: "NMBZ Holdings Limited",
    logoDomain: "nmbbank.co.zw",
    logoSrc: "/fundraising/logos/nmbz.png",
    logoLabel: "N",
    logoBg: "#f97316",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$7.50M",
    docsStatus: "In Progress",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Ready to Fund",
    closeDate: "21 May 2025",
    owner: owners.tariro,
  },
  {
    id: "inv-2",
    name: "Delta Corporation Limited",
    logoDomain: "delta.co.zw",
    logoSrc: "/fundraising/logos/delta.png",
    logoLabel: "D",
    logoBg: "#b45309",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$5.00M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Funding Confirmed",
    closeDate: "21 May 2025",
    owner: owners.tariro,
  },
  {
    id: "inv-3",
    name: "Stanbic Bank Zimbabwe",
    logoDomain: "standardbank.com",
    logoSrc: "/fundraising/logos/stanbic.png",
    logoLabel: "S",
    logoBg: "#1d4ed8",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$3.00M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Funding Confirmed",
    closeDate: "21 May 2025",
    owner: owners.farai,
  },
  {
    id: "inv-4",
    name: "Cassava Smartech",
    logoDomain: "cassavasmartech.com",
    logoSrc: "/fundraising/logos/cassava.png",
    logoLabel: "C",
    logoBg: "#111827",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$2.50M",
    docsStatus: "In Progress",
    kycStatus: "In Review",
    signatureStatus: "Pending",
    fundingStatus: "Scheduled",
    closeDate: null,
    owner: owners.grace,
  },
  {
    id: "inv-5",
    name: "SeedCo International",
    logoDomain: "seedcogroup.com",
    logoSrc: "/fundraising/logos/seedco.png",
    logoLabel: "SC",
    logoBg: "#16a34a",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$2.00M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Ready to Fund",
    closeDate: "28 May 2025",
    owner: owners.tendai,
  },
  {
    id: "inv-6",
    name: "Old Mutual Life Assurance",
    logoDomain: "oldmutual.com",
    logoSrc: "/fundraising/logos/oldmutual.png",
    logoLabel: "OM",
    logoBg: "#15803d",
    logoText: "#fff",
    softCircled: true,
    hardCircled: false,
    commitmentAmount: "US$1.75M",
    docsStatus: "In Progress",
    kycStatus: "In Review",
    signatureStatus: "Pending",
    fundingStatus: "Not Scheduled",
    closeDate: null,
    owner: owners.rudo,
  },
  {
    id: "inv-7",
    name: "Afreximbank",
    logoDomain: "afreximbank.com",
    logoSrc: "/fundraising/logos/afreximbank.png",
    logoLabel: "A",
    logoBg: "#111827",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$1.50M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Funding Confirmed",
    closeDate: "15 Jun 2025",
    owner: owners.farai,
  },
  {
    id: "inv-8",
    name: "ZB Financial Holdings",
    logoDomain: "zb.co.zw",
    logoSrc: "/fundraising/logos/zb.png",
    logoLabel: "ZB",
    logoBg: "#0f172a",
    logoText: "#fff",
    softCircled: true,
    hardCircled: false,
    commitmentAmount: "US$1.25M",
    docsStatus: "Not Started",
    kycStatus: "Not Started",
    signatureStatus: "Pending",
    fundingStatus: "Not Scheduled",
    closeDate: null,
    owner: owners.grace,
  },
  {
    id: "inv-9",
    name: "CABS (Pvt) Limited",
    logoDomain: "cabs.co.zw",
    logoSrc: "/fundraising/logos/cabs.png",
    logoLabel: "CA",
    logoBg: "#111827",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$1.20M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Scheduled",
    closeDate: "30 Jun 2025",
    owner: owners.tariro,
  },
  {
    id: "inv-10",
    name: "Dairibord Holdings",
    logoDomain: "dairibord.com",
    logoSrc: "/fundraising/logos/dairibord.png",
    logoLabel: "DB",
    logoBg: "#15803d",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$1.00M",
    docsStatus: "In Progress",
    kycStatus: "Approved",
    signatureStatus: "Pending",
    fundingStatus: "Scheduled",
    closeDate: null,
    owner: owners.tendai,
  },
  {
    id: "inv-11",
    name: "Econet Wireless Zimbabwe",
    logoDomain: "econetwireless.com",
    logoSrc: "/fundraising/logos/econet.png",
    logoLabel: "E",
    logoBg: "#dc2626",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.95M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Ready to Fund",
    closeDate: "21 May 2025",
    owner: owners.tawanda,
  },
  {
    id: "inv-12",
    name: "CBZ Asset Management",
    logoDomain: "cbz.co.zw",
    logoSrc: "/fundraising/logos/cbz.png",
    logoLabel: "CB",
    logoBg: "#1d4ed8",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.90M",
    docsStatus: "In Progress",
    kycStatus: "In Review",
    signatureStatus: "Pending",
    fundingStatus: "Scheduled",
    closeDate: null,
    owner: owners.grace,
  },
  {
    id: "inv-13",
    name: "FBC Holdings Limited",
    logoDomain: "fbc.co.zw",
    logoSrc: "/fundraising/logos/fbc.png",
    logoLabel: "F",
    logoBg: "#0f766e",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.85M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Funding Confirmed",
    closeDate: "12 Jul 2025",
    owner: owners.farai,
  },
  {
    id: "inv-14",
    name: "Innscor Africa Limited",
    logoDomain: "innscorafrica.com",
    logoSrc: "/fundraising/logos/innscor.png",
    logoLabel: "I",
    logoBg: "#ea580c",
    logoText: "#fff",
    softCircled: true,
    hardCircled: false,
    commitmentAmount: "US$0.75M",
    docsStatus: "Not Started",
    kycStatus: "Not Started",
    signatureStatus: "Pending",
    fundingStatus: "Not Scheduled",
    closeDate: null,
    owner: owners.rudo,
  },
  {
    id: "inv-15",
    name: "OK Zimbabwe Limited",
    logoDomain: "ok.co.zw",
    logoSrc: "/fundraising/logos/ok.png",
    logoLabel: "OK",
    logoBg: "#db2777",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.70M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Ready to Fund",
    closeDate: "21 May 2025",
    owner: owners.tariro,
  },
  {
    id: "inv-16",
    name: "Axia Corporation",
    logoDomain: "axiacorporation.com",
    logoSrc: "/fundraising/logos/axia.png",
    logoLabel: "A",
    logoBg: "#2563eb",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.65M",
    docsStatus: "In Progress",
    kycStatus: "In Review",
    signatureStatus: "Pending",
    fundingStatus: "Not Scheduled",
    closeDate: null,
    owner: owners.tendai,
  },
  {
    id: "inv-17",
    name: "First Mutual Holdings",
    logoDomain: "firstmutual.co.zw",
    logoSrc: "/fundraising/logos/firstmutual.png",
    logoLabel: "FM",
    logoBg: "#9333ea",
    logoText: "#fff",
    softCircled: false,
    hardCircled: false,
    commitmentAmount: "US$0.55M",
    docsStatus: "Not Started",
    kycStatus: "Not Started",
    signatureStatus: "Pending",
    fundingStatus: "Not Scheduled",
    closeDate: null,
    owner: owners.grace,
  },
  {
    id: "inv-18",
    name: "Padenga Holdings",
    logoDomain: "padenga.com",
    logoSrc: "/fundraising/logos/padenga.png",
    logoLabel: "P",
    logoBg: "#15803d",
    logoText: "#fff",
    softCircled: true,
    hardCircled: true,
    commitmentAmount: "US$0.50M",
    docsStatus: "Complete",
    kycStatus: "Approved",
    signatureStatus: "Signed",
    fundingStatus: "Ready to Fund",
    closeDate: "28 May 2025",
    owner: owners.tawanda,
  },
]

/** Per-investor closing checklists keyed by investor id. */
export const INVESTOR_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "inv-1": [
    { id: "c1", label: "Subscription Form", status: "Completed", date: "12 May 2025" },
    { id: "c2", label: "Side Letter", status: "Completed", date: "13 May 2025" },
    { id: "c3", label: "KYC / AML Pack", status: "Completed", date: "14 May 2025" },
    { id: "c4", label: "Wire Instructions", status: "Completed", date: "15 May 2025" },
    { id: "c5", label: "Beneficial Ownership", status: "Completed", date: "15 May 2025" },
    { id: "c6", label: "Tax Forms", status: "Completed", date: "16 May 2025" },
    { id: "c7", label: "Admission Notice", status: "Completed", date: "16 May 2025" },
  ],
  "inv-2": [
    { id: "c1", label: "Subscription Form", status: "Completed", date: "10 May 2025" },
    { id: "c2", label: "Side Letter", status: "Completed", date: "11 May 2025" },
    { id: "c3", label: "KYC / AML Pack", status: "Completed", date: "12 May 2025" },
    { id: "c4", label: "Wire Instructions", status: "Completed", date: "13 May 2025" },
    { id: "c5", label: "Beneficial Ownership", status: "Completed", date: "14 May 2025" },
    { id: "c6", label: "Tax Forms", status: "Completed", date: "14 May 2025" },
    { id: "c7", label: "Admission Notice", status: "Completed", date: "15 May 2025" },
  ],
  "inv-3": [
    { id: "c1", label: "Subscription Form", status: "Completed", date: "09 May 2025" },
    { id: "c2", label: "Side Letter", status: "Completed", date: "10 May 2025" },
    { id: "c3", label: "KYC / AML Pack", status: "Completed", date: "11 May 2025" },
    { id: "c4", label: "Wire Instructions", status: "Completed", date: "12 May 2025" },
    { id: "c5", label: "Beneficial Ownership", status: "Completed", date: "12 May 2025" },
    { id: "c6", label: "Tax Forms", status: "Pending", date: null },
    { id: "c7", label: "Admission Notice", status: "Not Started", date: null },
  ],
  "inv-4": [
    { id: "c1", label: "Subscription Form", status: "Completed", date: "08 May 2025" },
    { id: "c2", label: "Side Letter", status: "Completed", date: "09 May 2025" },
    { id: "c3", label: "KYC / AML Pack", status: "Pending", date: null },
    { id: "c4", label: "Wire Instructions", status: "Not Started", date: null },
    { id: "c5", label: "Beneficial Ownership", status: "Not Started", date: null },
    { id: "c6", label: "Tax Forms", status: "Not Started", date: null },
    { id: "c7", label: "Admission Notice", status: "Not Started", date: null },
  ],
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "c1", label: "Subscription Form", status: "Pending", date: null },
  { id: "c2", label: "Side Letter", status: "Not Started", date: null },
  { id: "c3", label: "KYC / AML Pack", status: "Not Started", date: null },
  { id: "c4", label: "Wire Instructions", status: "Not Started", date: null },
  { id: "c5", label: "Beneficial Ownership", status: "Not Started", date: null },
  { id: "c6", label: "Tax Forms", status: "Not Started", date: null },
  { id: "c7", label: "Admission Notice", status: "Not Started", date: null },
]

export const NEXT_CLOSING_EVENT: ClosingEvent = {
  title: "ZGF – Closing #2",
  amount: "US$5.85M",
  expectedCloseDate: "21 May 2025",
  commitmentsCount: 3,
  targetAmount: "US$5.00M",
  committedAmount: "US$5.85M",
  committedPct: 117,
}

export const CLOSING_TIMELINE: TimelineStep[] = [
  {
    id: "t1",
    label: "Final Commitments Locked",
    date: "16 May 2025",
    state: "done",
  },
  {
    id: "t2",
    label: "Funds Due",
    date: "21 May 2025",
    state: "current",
  },
  {
    id: "t3",
    label: "LP Admission & Reporting",
    date: "22 May 2025",
    state: "upcoming",
  },
  {
    id: "t4",
    label: "Capital Call / Settlement",
    date: "28 May 2025",
    state: "upcoming",
  },
]

export const FUNDING_STATUS_OPTIONS: FundingStatus[] = [
  "Ready to Fund",
  "Funding Confirmed",
  "Scheduled",
  "Not Scheduled",
]

export const OWNER_OPTIONS = Array.from(
  new Set(COMMITMENT_INVESTORS.map((i) => i.owner.name)),
).sort()

export function investorLogoUrl(investor: CommitmentInvestor, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(investor.logoDomain)}&sz=${size}`
}
