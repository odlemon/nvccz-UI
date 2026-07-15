export type DdDocStatus =
  | "Reviewed"
  | "Uploaded"
  | "Requested"
  | "Follow-up"
  | "Completed"

export type DdPriority = "High" | "Medium" | "Low"

export type DdKpi = {
  id: string
  label: string
  value: string
  icon: "users" | "file-pen" | "ban" | "trending-up" | "files" | "calendar"
  iconColor: string
  iconBg: string
  trend?: {
    text: string
    tone: "amber" | "red" | "green" | "purple"
  }
}

export type DdInvestor = {
  id: string
  name: string
  lead: string
  logoLabel: string
  logoBg: string
  logoText: string
  completion: number
  open: number
  overdue: number
  daysInDd: number
}

export type DdMatrixCategory =
  | "Legal"
  | "Fund Terms"
  | "Team"
  | "Track Record"
  | "Compliance"
  | "ESG"
  | "Financials"

export type DdMatrixRow = {
  id: string
  category: DdMatrixCategory
  document: string
  /** Status keyed by investor id */
  statusByInvestor: Record<string, DdDocStatus>
  lastUpdated: string
  owner: string
}

export type DdRequest = {
  id: string
  title: string
  investorId: string
  investorName: string
  logoLabel: string
  logoBg: string
  priority: DdPriority
  dueDate: string
  resolved: boolean
}

export type DdThreadMessage = {
  id: string
  author: string
  initials: string
  avatarBg: string
  online?: boolean
  timestamp: string
  body: string
  side: "left" | "right"
}

export const DD_AS_AT = "20 May 2025"

export const DD_KPIS: DdKpi[] = [
  {
    id: "active",
    label: "Active Investors in DD",
    value: "5",
    icon: "users",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    id: "open",
    label: "Open Requests",
    value: "18",
    icon: "file-pen",
    iconColor: "#d97706",
    iconBg: "#fef3c7",
    trend: { text: "5 from last week", tone: "amber" },
  },
  {
    id: "overdue",
    label: "Overdue Items",
    value: "4",
    icon: "ban",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
    trend: { text: "2 from last week", tone: "red" },
  },
  {
    id: "completion",
    label: "Avg. Completion",
    value: "62%",
    icon: "trending-up",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    trend: { text: "6% from last week", tone: "green" },
  },
  {
    id: "docs",
    label: "Documents Uploaded",
    value: "48",
    icon: "files",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    trend: { text: "7 this week", tone: "green" },
  },
  {
    id: "days",
    label: "Days in Diligence (avg.)",
    value: "24",
    icon: "calendar",
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
    trend: { text: "4 days", tone: "purple" },
  },
]

export const DD_INVESTORS: DdInvestor[] = [
  {
    id: "nyasha",
    name: "Nyasha Pension Fund",
    lead: "Tawanda Chirwa",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    logoText: "#fff",
    completion: 75,
    open: 6,
    overdue: 1,
    daysInDd: 27,
  },
  {
    id: "granite",
    name: "Granite Peak Trustees",
    lead: "Kudakwashe Mlambo",
    logoLabel: "GP",
    logoBg: "#0f766e",
    logoText: "#fff",
    completion: 58,
    open: 5,
    overdue: 2,
    daysInDd: 19,
  },
  {
    id: "horizon",
    name: "Horizon Capital",
    lead: "Chipo Dube",
    logoLabel: "H",
    logoBg: "#2563eb",
    logoText: "#fff",
    completion: 48,
    open: 4,
    overdue: 1,
    daysInDd: 16,
  },
  {
    id: "chiedza",
    name: "Chiedza Ventures",
    lead: "Rumbidzai Chikore",
    logoLabel: "CV",
    logoBg: "#ea580c",
    logoText: "#fff",
    completion: 63,
    open: 2,
    overdue: 0,
    daysInDd: 22,
  },
  {
    id: "mhufu",
    name: "Mhufu Holdings",
    lead: "Nkululeko Manjengwa",
    logoLabel: "MH",
    logoBg: "#64748b",
    logoText: "#fff",
    completion: 40,
    open: 1,
    overdue: 0,
    daysInDd: 12,
  },
]

const statusMap = (
  nyasha: DdDocStatus,
  granite: DdDocStatus,
  horizon: DdDocStatus,
  chiedza: DdDocStatus,
  mhufu: DdDocStatus,
): Record<string, DdDocStatus> => ({
  nyasha,
  granite,
  horizon,
  chiedza,
  mhufu,
})

export const DD_MATRIX_ROWS: DdMatrixRow[] = [
  {
    id: "m1",
    category: "Legal",
    document: "PPM",
    statusByInvestor: statusMap("Reviewed", "Uploaded", "Requested", "Reviewed", "Requested"),
    lastUpdated: "18 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m2",
    category: "Legal",
    document: "LPA",
    statusByInvestor: statusMap("Uploaded", "Reviewed", "Uploaded", "Uploaded", "Requested"),
    lastUpdated: "19 May 2025",
    owner: "Tawanda Chirwa",
  },
  {
    id: "m3",
    category: "Legal",
    document: "Side Letters",
    statusByInvestor: statusMap("Requested", "Follow-up", "Requested", "Uploaded", "Requested"),
    lastUpdated: "17 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m4",
    category: "Legal",
    document: "Legal Opinions",
    statusByInvestor: statusMap("Follow-up", "Requested", "Follow-up", "Requested", "Requested"),
    lastUpdated: "16 May 2025",
    owner: "Chipo Dube",
  },
  {
    id: "m5",
    category: "Fund Terms",
    document: "Investment Policy",
    statusByInvestor: statusMap("Reviewed", "Reviewed", "Uploaded", "Reviewed", "Uploaded"),
    lastUpdated: "15 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m6",
    category: "Fund Terms",
    document: "Subscription Agreement",
    statusByInvestor: statusMap("Uploaded", "Uploaded", "Requested", "Uploaded", "Requested"),
    lastUpdated: "18 May 2025",
    owner: "Tawanda Chirwa",
  },
  {
    id: "m7",
    category: "Fund Terms",
    document: "Fee Schedule",
    statusByInvestor: statusMap("Requested", "Requested", "Requested", "Uploaded", "Requested"),
    lastUpdated: "14 May 2025",
    owner: "Chipo Dube",
  },
  {
    id: "m8",
    category: "Team",
    document: "Team Bios",
    statusByInvestor: statusMap("Reviewed", "Reviewed", "Reviewed", "Uploaded", "Uploaded"),
    lastUpdated: "12 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m9",
    category: "Team",
    document: "Org Chart",
    statusByInvestor: statusMap("Uploaded", "Uploaded", "Requested", "Reviewed", "Requested"),
    lastUpdated: "13 May 2025",
    owner: "Rumbidzai Chikore",
  },
  {
    id: "m10",
    category: "Track Record",
    document: "Track Record Workbook",
    statusByInvestor: statusMap("Uploaded", "Follow-up", "Uploaded", "Uploaded", "Requested"),
    lastUpdated: "17 May 2025",
    owner: "Kudakwashe Mlambo",
  },
  {
    id: "m11",
    category: "Track Record",
    document: "Case Studies",
    statusByInvestor: statusMap("Follow-up", "Requested", "Follow-up", "Uploaded", "Requested"),
    lastUpdated: "16 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m12",
    category: "Compliance",
    document: "Compliance Manual",
    statusByInvestor: statusMap("Reviewed", "Reviewed", "Uploaded", "Reviewed", "Uploaded"),
    lastUpdated: "11 May 2025",
    owner: "Tawanda Chirwa",
  },
  {
    id: "m13",
    category: "Compliance",
    document: "AML/CTF Policy",
    statusByInvestor: statusMap("Uploaded", "Uploaded", "Reviewed", "Uploaded", "Requested"),
    lastUpdated: "12 May 2025",
    owner: "Chipo Dube",
  },
  {
    id: "m14",
    category: "Compliance",
    document: "Beneficial Ownership",
    statusByInvestor: statusMap("Requested", "Follow-up", "Requested", "Requested", "Requested"),
    lastUpdated: "19 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m15",
    category: "ESG",
    document: "ESG Policy",
    statusByInvestor: statusMap("Uploaded", "Requested", "Uploaded", "Reviewed", "Requested"),
    lastUpdated: "10 May 2025",
    owner: "Rumbidzai Chikore",
  },
  {
    id: "m16",
    category: "ESG",
    document: "ESG Report (Latest)",
    statusByInvestor: statusMap("Requested", "Requested", "Follow-up", "Uploaded", "Requested"),
    lastUpdated: "09 May 2025",
    owner: "Tariro Moyo",
  },
  {
    id: "m17",
    category: "Financials",
    document: "Financial Model",
    statusByInvestor: statusMap("Uploaded", "Uploaded", "Uploaded", "Uploaded", "Requested"),
    lastUpdated: "18 May 2025",
    owner: "Kudakwashe Mlambo",
  },
  {
    id: "m18",
    category: "Financials",
    document: "Audited Statements (3yrs)",
    statusByInvestor: statusMap("Uploaded", "Reviewed", "Uploaded", "Uploaded", "Uploaded"),
    lastUpdated: "15 May 2025",
    owner: "Tawanda Chirwa",
  },
  {
    id: "m19",
    category: "Financials",
    document: "Management Accounts (YTD)",
    statusByInvestor: statusMap("Uploaded", "Uploaded", "Requested", "Uploaded", "Requested"),
    lastUpdated: "19 May 2025",
    owner: "Chipo Dube",
  },
  {
    id: "m20",
    category: "Financials",
    document: "Risk Register",
    statusByInvestor: statusMap("Follow-up", "Follow-up", "Requested", "Uploaded", "Requested"),
    lastUpdated: "17 May 2025",
    owner: "Tariro Moyo",
  },
]

export const DD_CATEGORY_ORDER: DdMatrixCategory[] = [
  "Legal",
  "Fund Terms",
  "Team",
  "Track Record",
  "Compliance",
  "ESG",
  "Financials",
]

export const DD_REQUESTS: DdRequest[] = [
  {
    id: "r1",
    title: "Clarify carried interest waterfalls",
    investorId: "nyasha",
    investorName: "Nyasha Pension Fund",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    priority: "High",
    dueDate: "21 May 2025",
    resolved: false,
  },
  {
    id: "r2",
    title: "Provide marked-up LPA redlines",
    investorId: "granite",
    investorName: "Granite Peak Trustees",
    logoLabel: "GP",
    logoBg: "#0f766e",
    priority: "High",
    dueDate: "22 May 2025",
    resolved: false,
  },
  {
    id: "r3",
    title: "Confirm key-person provisions",
    investorId: "horizon",
    investorName: "Horizon Capital",
    logoLabel: "H",
    logoBg: "#2563eb",
    priority: "Medium",
    dueDate: "23 May 2025",
    resolved: false,
  },
  {
    id: "r4",
    title: "Share ESG incident log (last 3yrs)",
    investorId: "chiedza",
    investorName: "Chiedza Ventures",
    logoLabel: "CV",
    logoBg: "#ea580c",
    priority: "Medium",
    dueDate: "24 May 2025",
    resolved: false,
  },
  {
    id: "r5",
    title: "Confirm beneficial ownership register",
    investorId: "nyasha",
    investorName: "Nyasha Pension Fund",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    priority: "Low",
    dueDate: "26 May 2025",
    resolved: false,
  },
  {
    id: "r6",
    title: "Upload fee schedule Annex B",
    investorId: "mhufu",
    investorName: "Mhufu Holdings",
    logoLabel: "MH",
    logoBg: "#64748b",
    priority: "Low",
    dueDate: "27 May 2025",
    resolved: false,
  },
  {
    id: "r7",
    title: "Clarify GP commitment timing",
    investorId: "granite",
    investorName: "Granite Peak Trustees",
    logoLabel: "GP",
    logoBg: "#0f766e",
    priority: "Medium",
    dueDate: "10 May 2025",
    resolved: true,
  },
  {
    id: "r8",
    title: "Confirm auditor engagement letter",
    investorId: "horizon",
    investorName: "Horizon Capital",
    logoLabel: "H",
    logoBg: "#2563eb",
    priority: "Low",
    dueDate: "08 May 2025",
    resolved: true,
  },
  {
    id: "r9",
    title: "Provide track record case study #2",
    investorId: "nyasha",
    investorName: "Nyasha Pension Fund",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    priority: "High",
    dueDate: "05 May 2025",
    resolved: true,
  },
]

export const DD_THREAD_SEED: DdThreadMessage[] = [
  {
    id: "t1",
    author: "Nyasha Pension Fund",
    initials: "NP",
    avatarBg: "#7c3aed",
    timestamp: "19 May 2025, 14:32",
    body: "Please confirm the lock-up period for investors.",
    side: "left",
  },
  {
    id: "t2",
    author: "Tariro Moyo",
    initials: "TM",
    avatarBg: "#2563eb",
    online: true,
    timestamp: "19 May 2025, 14:45",
    body: "The fund has a 3-year lock-up period from the final close date, subject to hardwired exceptions in the LPA.",
    side: "right",
  },
  {
    id: "t3",
    author: "Nyasha Pension Fund",
    initials: "NP",
    avatarBg: "#7c3aed",
    timestamp: "19 May 2025, 15:02",
    body: "Can you point us to the relevant LPA clause?",
    side: "left",
  },
  {
    id: "t4",
    author: "Tawanda Chirwa",
    initials: "TC",
    avatarBg: "#16a34a",
    online: true,
    timestamp: "19 May 2025, 15:18",
    body: "See Clause 8.2 — lock-up & transfer restrictions. We've also uploaded the marked-up LPA with that section highlighted.",
    side: "right",
  },
]

export const DD_STATUS_LEGEND: DdDocStatus[] = [
  "Requested",
  "Uploaded",
  "Reviewed",
  "Follow-up",
  "Completed",
]

export const OPEN_REQUEST_COUNT = DD_REQUESTS.filter((r) => !r.resolved).length
export const RESOLVED_REQUEST_COUNT = 32
