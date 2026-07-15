export type InvestorType =
  | "Pension Fund"
  | "Insurer"
  | "DFI"
  | "Family Office"
  | "Sovereign"
  | "Corporate"
  | "Bank"
  | "Fund of Funds"

export type KycStatus =
  | "NOT_STARTED"
  | "DOCUMENTS_REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "APPROVED_WITH_CONDITIONS"
  | "REJECTED"

export type InvestorOrg = {
  id: string
  legalName: string
  tradingName?: string
  type: InvestorType
  country: string
  jurisdiction: string
  estimatedAum: string
  ticketRange: string
  owner: string
  status: "Active" | "Prospect" | "Inactive"
  kycStatus: KycStatus
  sanctionsStatus: "Clear" | "Not Screened" | "Flagged"
  lastInteraction: string
  nextAction: string
  openOpportunities: number
  commitments: string
  logoLabel: string
  logoBg: string
  assetPreferences: string[]
  score: number
}

export const INVESTOR_ORGS: InvestorOrg[] = [
  {
    id: "io-1",
    legalName: "Nyasha Pension Fund",
    type: "Pension Fund",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$420M",
    ticketRange: "US$2–8M",
    owner: "Tawanda Chirwa",
    status: "Active",
    kycStatus: "UNDER_REVIEW",
    sanctionsStatus: "Clear",
    lastInteraction: "19 May 2025",
    nextAction: "Respond to DDQ waterfall Q",
    openOpportunities: 2,
    commitments: "US$4.00M soft",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    assetPreferences: ["PE", "Private Credit"],
    score: 86,
  },
  {
    id: "io-2",
    legalName: "NMBZ Holdings Limited",
    type: "Bank",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$1.2B",
    ticketRange: "US$5–15M",
    owner: "Tariro Moyo",
    status: "Active",
    kycStatus: "APPROVED",
    sanctionsStatus: "Clear",
    lastInteraction: "20 May 2025",
    nextAction: "Closing pack review",
    openOpportunities: 1,
    commitments: "US$7.50M signed",
    logoLabel: "N",
    logoBg: "#f97316",
    assetPreferences: ["PE", "Infrastructure"],
    score: 92,
  },
  {
    id: "io-3",
    legalName: "Old Mutual Life Assurance",
    type: "Insurer",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$2.8B",
    ticketRange: "US$3–10M",
    owner: "Tariro Moyo",
    status: "Active",
    kycStatus: "APPROVED",
    sanctionsStatus: "Clear",
    lastInteraction: "16 May 2025",
    nextAction: "Portal provisioning",
    openOpportunities: 1,
    commitments: "US$5.00M funded",
    logoLabel: "OM",
    logoBg: "#16a34a",
    assetPreferences: ["PE", "Listed Equity"],
    score: 90,
  },
  {
    id: "io-4",
    legalName: "Granite Peak Trustees",
    type: "Pension Fund",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$180M",
    ticketRange: "US$1–5M",
    owner: "Kudakwashe Mlambo",
    status: "Prospect",
    kycStatus: "DOCUMENTS_REQUESTED",
    sanctionsStatus: "Clear",
    lastInteraction: "18 May 2025",
    nextAction: "Share marked-up LPA",
    openOpportunities: 1,
    commitments: "US$2.50M soft",
    logoLabel: "GP",
    logoBg: "#0f766e",
    assetPreferences: ["PE"],
    score: 74,
  },
  {
    id: "io-5",
    legalName: "Horizon Capital",
    type: "Family Office",
    country: "Mauritius",
    jurisdiction: "MU",
    estimatedAum: "US$95M",
    ticketRange: "US$0.5–3M",
    owner: "Chipo Dube",
    status: "Prospect",
    kycStatus: "NOT_STARTED",
    sanctionsStatus: "Not Screened",
    lastInteraction: "14 May 2025",
    nextAction: "Confirm decision maker",
    openOpportunities: 1,
    commitments: "US$2.00M indicative",
    logoLabel: "H",
    logoBg: "#2563eb",
    assetPreferences: ["VC", "PE"],
    score: 68,
  },
  {
    id: "io-6",
    legalName: "Afreximbank",
    type: "DFI",
    country: "Egypt",
    jurisdiction: "EG",
    estimatedAum: "US$11B",
    ticketRange: "US$5–25M",
    owner: "Tariro Moyo",
    status: "Active",
    kycStatus: "APPROVED_WITH_CONDITIONS",
    sanctionsStatus: "Clear",
    lastInteraction: "15 May 2025",
    nextAction: "IC briefing 22 May",
    openOpportunities: 1,
    commitments: "US$6.00M soft",
    logoLabel: "A",
    logoBg: "#111827",
    assetPreferences: ["PE", "Trade Finance"],
    score: 88,
  },
  {
    id: "io-7",
    legalName: "National Social Security Authority",
    tradingName: "NSSA",
    type: "Pension Fund",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$1.5B",
    ticketRange: "US$20–60M",
    owner: "Grace Chirwa",
    status: "Active",
    kycStatus: "APPROVED",
    sanctionsStatus: "Clear",
    lastInteraction: "17 May 2025",
    nextAction: "Custody transition",
    openOpportunities: 1,
    commitments: "US$45M mandate",
    logoLabel: "NS",
    logoBg: "#0e7490",
    assetPreferences: ["Multi-asset", "Fixed Income"],
    score: 84,
  },
  {
    id: "io-8",
    legalName: "Stanbic Bank Zimbabwe",
    type: "Bank",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$900M",
    ticketRange: "US$2–6M",
    owner: "Farai Ncube",
    status: "Active",
    kycStatus: "UNDER_REVIEW",
    sanctionsStatus: "Clear",
    lastInteraction: "19 May 2025",
    nextAction: "Fee discount approval",
    openOpportunities: 1,
    commitments: "US$3.00M soft",
    logoLabel: "S",
    logoBg: "#1d4ed8",
    assetPreferences: ["PE", "Credit"],
    score: 79,
  },
  {
    id: "io-9",
    legalName: "First Mutual Holdings",
    type: "Insurer",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$650M",
    ticketRange: "US$10–40M",
    owner: "Tendai Banda",
    status: "Prospect",
    kycStatus: "NOT_STARTED",
    sanctionsStatus: "Not Screened",
    lastInteraction: "12 May 2025",
    nextAction: "Submit fee schedule",
    openOpportunities: 1,
    commitments: "US$30M expected AUM",
    logoLabel: "FM",
    logoBg: "#9333ea",
    assetPreferences: ["Balanced", "Equity"],
    score: 71,
  },
  {
    id: "io-10",
    legalName: "Chiedza Ventures",
    type: "Family Office",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$40M",
    ticketRange: "US$0.5–2M",
    owner: "Rumbidzai Chikore",
    status: "Active",
    kycStatus: "APPROVED",
    sanctionsStatus: "Clear",
    lastInteraction: "11 May 2025",
    nextAction: "Capital call contact setup",
    openOpportunities: 1,
    commitments: "US$1.50M admitted",
    logoLabel: "CV",
    logoBg: "#ea580c",
    assetPreferences: ["VC", "Growth"],
    score: 77,
  },
  {
    id: "io-11",
    legalName: "CBZ Asset Management",
    type: "Fund of Funds",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$320M",
    ticketRange: "US$15–40M",
    owner: "Rudo Dube",
    status: "Prospect",
    kycStatus: "DOCUMENTS_REQUESTED",
    sanctionsStatus: "Clear",
    lastInteraction: "13 May 2025",
    nextAction: "Answer tender questions",
    openOpportunities: 1,
    commitments: "US$25M expected AUM",
    logoLabel: "CB",
    logoBg: "#1d4ed8",
    assetPreferences: ["Multi-manager"],
    score: 73,
  },
  {
    id: "io-12",
    legalName: "Mhufu Holdings",
    type: "Corporate",
    country: "Zimbabwe",
    jurisdiction: "ZW",
    estimatedAum: "US$55M",
    ticketRange: "US$0.5–2M",
    owner: "Nkululeko Manjengwa",
    status: "Prospect",
    kycStatus: "NOT_STARTED",
    sanctionsStatus: "Not Screened",
    lastInteraction: "08 May 2025",
    nextAction: "Send NDA",
    openOpportunities: 1,
    commitments: "—",
    logoLabel: "MH",
    logoBg: "#64748b",
    assetPreferences: ["PE"],
    score: 58,
  },
]

export const INVESTOR_TYPES = Array.from(new Set(INVESTOR_ORGS.map((i) => i.type))).sort()
export const INVESTOR_OWNERS = Array.from(new Set(INVESTOR_ORGS.map((i) => i.owner))).sort()

export function kycChipClass(status: KycStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "APPROVED_WITH_CONDITIONS":
      return "bg-[#e0f2fe] text-[#0369a1]"
    case "UNDER_REVIEW":
    case "DOCUMENTS_REQUESTED":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "REJECTED":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function kycLabel(status: KycStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}
