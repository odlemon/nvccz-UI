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

export const MANDATES: MandateRow[] = [
  {
    id: "m1",
    name: "NSSA Global Equity Mandate",
    mandateType: "Pension Fund",
    organization: "NSSA",
    assetClass: "Equities",
    geography: "Global",
    mandateSize: "US$50M – US$100M",
    stage: "rfp",
    rfpDueDate: "26 May 2025",
    nextStep: "Submit RFP",
    score: 92,
    orgType: "Pension Fund",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "NSSA",
    logoBg: "#7c3aed",
    logoText: "#ffffff",
  },
  {
    id: "m2",
    name: "ZIMDEF Infrastructure Mandate",
    mandateType: "Fund of Funds",
    organization: "ZIMDEF",
    assetClass: "Infrastructure",
    geography: "Africa",
    mandateSize: "US$100M – US$250M",
    stage: "mandate_live",
    rfpDueDate: "02 Jun 2025",
    nextStep: "Due Diligence",
    score: 88,
    orgType: "Fund of Funds",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "Z",
    logoBg: "#dbeafe",
    logoText: "#1d4ed8",
  },
  {
    id: "m3",
    name: "FBC Bank Private Debt Mandate",
    mandateType: "Bank",
    organization: "FBC Bank",
    assetClass: "Private Debt",
    geography: "Africa",
    mandateSize: "US$25M – US$50M",
    stage: "rfp",
    rfpDueDate: "30 May 2025",
    nextStep: "Submit RFP",
    score: 85,
    orgType: "Bank",
    detailGeography: "Africa",
    geographyFlag: "",
    logoLabel: "F",
    logoBg: "#dcfce7",
    logoText: "#15803d",
  },
  {
    id: "m4",
    name: "Old Mutual Zimbabwe Balanced",
    mandateType: "Insurance",
    organization: "Old Mutual Zimbabwe",
    assetClass: "Multi-Asset",
    geography: "Zimbabwe",
    mandateSize: "US$50M – US$100M",
    stage: "mandate_live",
    rfpDueDate: "—",
    nextStep: "Manager Meeting",
    score: 83,
    orgType: "Insurance",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "OM",
    logoBg: "#e0e7ff",
    logoText: "#4338ca",
  },
  {
    id: "m5",
    name: "Stanbic Real Assets Mandate",
    mandateType: "Bank",
    organization: "Stanbic Bank",
    assetClass: "Real Assets",
    geography: "Zimbabwe",
    mandateSize: "US$50M – US$100M",
    stage: "shortlist",
    rfpDueDate: "18 Jun 2025",
    nextStep: "Follow-up DD call",
    score: 78,
    orgType: "Bank",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "S",
    logoBg: "#dbeafe",
    logoText: "#1d4ed8",
  },
  {
    id: "m6",
    name: "Sanlam Balanced Mandate",
    mandateType: "Insurance",
    organization: "Sanlam Private Wealth",
    assetClass: "Balanced",
    geography: "South Africa",
    mandateSize: "US$25M – US$50M",
    stage: "evaluation",
    rfpDueDate: "12 Jun 2025",
    nextStep: "Final presentation",
    score: 72,
    orgType: "Insurance",
    detailGeography: "South Africa",
    geographyFlag: "🇿🇦",
    logoLabel: "SA",
    logoBg: "#fce7f3",
    logoText: "#be185d",
  },
  {
    id: "m7",
    name: "ZIMNAT Fixed Income Mandate",
    mandateType: "Insurance",
    organization: "ZIMNAT Life Assurance",
    assetClass: "Fixed Income",
    geography: "Zimbabwe",
    mandateSize: "US$25M – US$50M",
    stage: "rfp",
    rfpDueDate: "25 Jun 2025",
    nextStep: "Await clarification",
    score: 70,
    orgType: "Insurer",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "ZI",
    logoBg: "#ffedd5",
    logoText: "#c2410c",
  },
  {
    id: "m8",
    name: "CBZ Emerging Markets Mandate",
    mandateType: "Bank",
    organization: "CBZ Asset Management",
    assetClass: "Emerging Markets",
    geography: "Africa",
    mandateSize: "US$10M – US$25M",
    stage: "shortlist",
    rfpDueDate: "10 Jun 2025",
    nextStep: "Send updated fees",
    score: 68,
    orgType: "Asset Manager",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "C",
    logoBg: "#fef3c7",
    logoText: "#b45309",
  },
  {
    id: "m9",
    name: "African Alliance Equity Mandate",
    mandateType: "Pension Fund",
    organization: "African Alliance",
    assetClass: "Equities",
    geography: "Africa",
    mandateSize: "US$50M – US$100M",
    stage: "evaluation",
    rfpDueDate: "05 Jun 2025",
    nextStep: "Prepare DD pack",
    score: 65,
    orgType: "Pension Fund",
    detailGeography: "South Africa",
    geographyFlag: "🇿🇦",
    logoLabel: "AA",
    logoBg: "#ede9fe",
    logoText: "#6d28d9",
  },
  {
    id: "m10",
    name: "First Mutual Infrastructure Mandate",
    mandateType: "Insurance",
    organization: "First Mutual Wealth",
    assetClass: "Infrastructure",
    geography: "Zimbabwe",
    mandateSize: "US$50M – US$100M",
    stage: "mandate_live",
    rfpDueDate: "—",
    nextStep: "Site visit",
    score: 63,
    orgType: "Asset Manager",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "FM",
    logoBg: "#dbeafe",
    logoText: "#1d4ed8",
  },
  {
    id: "m11",
    name: "Hivos Impact Investing Mandate",
    mandateType: "Fund of Funds",
    organization: "Hivos Impact Investors",
    assetClass: "ESG / Impact",
    geography: "Africa",
    mandateSize: "US$10M – US$25M",
    stage: "shortlist",
    rfpDueDate: "03 Jun 2025",
    nextStep: "Share case studies",
    score: 61,
    orgType: "Impact Fund",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "H",
    logoBg: "#dcfce7",
    logoText: "#15803d",
  },
  {
    id: "m12",
    name: "Horizon Capital Private Credit Mandate",
    mandateType: "Bank",
    organization: "Horizon Capital",
    assetClass: "Private Credit",
    geography: "South Africa",
    mandateSize: "US$25M – US$50M",
    stage: "rfp",
    rfpDueDate: "30 Jun 2025",
    nextStep: "Draft proposal",
    score: 58,
    orgType: "Private Equity",
    detailGeography: "South Africa",
    geographyFlag: "🇿🇦",
    logoLabel: "HC",
    logoBg: "#fef3c7",
    logoText: "#b45309",
  },
  {
    id: "m13",
    name: "Granite Peak Fund of Funds Mandate",
    mandateType: "Fund of Funds",
    organization: "Granite Peak Trustees",
    assetClass: "Fund of Funds",
    geography: "Africa",
    mandateSize: "US$100M – US$250M",
    stage: "evaluation",
    rfpDueDate: "28 Jun 2025",
    nextStep: "IC review pack",
    score: 55,
    orgType: "Asset Manager",
    detailGeography: "South Africa",
    geographyFlag: "🇿🇦",
    logoLabel: "GP",
    logoBg: "#ffedd5",
    logoText: "#c2410c",
  },
  {
    id: "m14",
    name: "Delta Core Equity Mandate",
    mandateType: "Pension Fund",
    organization: "Delta Asset Management",
    assetClass: "Equities",
    geography: "Zimbabwe",
    mandateSize: "US$50M – US$100M",
    stage: "mandate_live",
    rfpDueDate: "—",
    nextStep: "Quarterly update",
    score: 53,
    orgType: "Asset Manager",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "D",
    logoBg: "#e0e7ff",
    logoText: "#4338ca",
  },
  {
    id: "m15",
    name: "EcoBank Absolute Return Mandate",
    mandateType: "Bank",
    organization: "EcoBank Wealth",
    assetClass: "Absolute Return",
    geography: "Africa",
    mandateSize: "US$10M – US$25M",
    stage: "shortlist",
    rfpDueDate: "22 Jun 2025",
    nextStep: "Fee discussion",
    score: 50,
    orgType: "Bank Wealth",
    detailGeography: "Zimbabwe",
    geographyFlag: "🇿🇼",
    logoLabel: "E",
    logoBg: "#dbeafe",
    logoText: "#1d4ed8",
  },
]

const DETAILS: Record<string, MandateDetail> = {
  m1: {
    contacts: [
      {
        id: "c1",
        name: "Tariro Moyo",
        role: "Head of Investments",
        email: "tariro.moyo@nssa.co.zw",
        phone: "+263 77 123 4567",
        initials: "TM",
        isPrimary: true,
      },
      {
        id: "c2",
        name: "Kuda Mlambo",
        role: "Senior Portfolio Manager",
        email: "kuda.mlambo@nssa.co.zw",
        phone: "+263 77 234 5678",
        initials: "KM",
      },
      {
        id: "c3",
        name: "Simbarashe Ncube",
        role: "Compliance Officer",
        email: "simbarashe.ncube@nssa.co.zw",
        phone: "+263 77 345 6789",
        initials: "SN",
      },
    ],
    interactions: [
      {
        id: "i1",
        date: "19 May 2025",
        title: "RFP Issued",
        detail: "RFP pack shared and mandate brief provided.",
      },
      {
        id: "i2",
        date: "21 May 2025",
        title: "Introductory Call",
        detail: "Intro call with Tariro Moyo and Kuda Mlambo.",
      },
      {
        id: "i3",
        date: "23 May 2025",
        title: "RFP Clarifications",
        detail: "Clarifications provided on fee structure and reporting.",
      },
    ],
    interests: ["Global Equities", "Active Management", "ESG Integration"],
    documents: [
      { id: "d1", name: "NSSA Global Equity Mandate Brief.pdf", sharedOn: "19 May 2025" },
      { id: "d2", name: "RFP Guidelines.pdf", sharedOn: "19 May 2025" },
      { id: "d3", name: "Investment Policy Statement.pdf", sharedOn: "21 May 2025" },
    ],
    emails: [
      {
        id: "e1",
        date: "23 May 2025",
        subject: "Re: RFP Clarifications — Fee Structure",
        from: "Tariro Moyo",
      },
      {
        id: "e2",
        date: "21 May 2025",
        subject: "Introductory Call — Follow-up Materials",
        from: "Tariro Moyo",
      },
      {
        id: "e3",
        date: "19 May 2025",
        subject: "NSSA Global Equity Mandate — RFP Issued",
        from: "Tariro Moyo",
      },
    ],
    meetings: [
      {
        id: "mt1",
        date: "19 May 2025",
        title: "Introductory Call",
        detail: "With Tariro Moyo, Kuda Mlambo",
        status: "Completed",
      },
      {
        id: "mt2",
        date: "26 May 2025",
        title: "Manager Presentation",
        detail: "Virtual presentation",
        status: "Scheduled",
      },
      {
        id: "mt3",
        date: "02 Jun 2025",
        title: "Due Diligence Meeting",
        detail: "Deep dive with Investment Committee",
        status: "Upcoming",
      },
    ],
  },
}

function defaultDetail(row: MandateRow): MandateDetail {
  return {
    contacts: [
      {
        id: "c-default",
        name: "Relationship Manager",
        role: "Primary Contact",
        email: "contact@example.com",
        phone: "+263 77 000 0000",
        initials: "RM",
        isPrimary: true,
      },
    ],
    interactions: [
      { id: "i-default", date: "15 May 2025", title: "Initial outreach", detail: "First contact with organisation." },
    ],
    interests: [row.assetClass, row.mandateType],
    documents: [{ id: "d-default", name: `${row.name} Brief.pdf`, sharedOn: "15 May 2025" }],
    emails: [
      { id: "e-default", date: "15 May 2025", subject: `Re: ${row.name}`, from: row.organization },
    ],
    meetings: [{ id: "mt-default", date: "15 May 2025", title: "Introductory Call", status: "Upcoming" }],
  }
}

export function mandateDetailFor(id: string): MandateDetail | null {
  const row = MANDATES.find((m) => m.id === id)
  if (!row) return null
  return DETAILS[id] ?? defaultDetail(row)
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "High"
  if (score >= 70) return "Good"
  if (score >= 55) return "Medium"
  return "Low"
}

export const TOTAL_MANDATES = 142
