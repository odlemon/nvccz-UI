export type CommissionStatus = "Accruing" | "Paid" | "On Hold"

export type AgentOpportunity = {
  id: string
  investor: string
  amount: string
  eligible: boolean
}

export type PlacementAgent = {
  id: string
  name: string
  geography: string
  feePct: number
  retainer: string
  period: string
  introducedCount: number
  commissionStatus: CommissionStatus
  exclusions: string[]
  opportunities: AgentOpportunity[]
  appointedAt: string
  owner: string
}

export type PlacementAgentKpi = {
  id: string
  label: string
  value: string
  sublabel: string
  icon: "users" | "coins" | "clock" | "ban"
  iconColor: string
  iconBg: string
}

export const PLACEMENT_AGENT_KPIS: PlacementAgentKpi[] = [
  {
    id: "agents",
    label: "Active Appointments",
    value: "4",
    sublabel: "Across SADC & global",
    icon: "users",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
  },
  {
    id: "introduced",
    label: "Introduced LPs",
    value: "18",
    sublabel: "Commission-eligible pipeline",
    icon: "coins",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    id: "accruing",
    label: "Accruing Commissions",
    value: "US$142K",
    sublabel: "Pending close & funding",
    icon: "clock",
    iconColor: "#d97706",
    iconBg: "#ffedd5",
  },
  {
    id: "exclusions",
    label: "Exclusion Conflicts",
    value: "3",
    sublabel: "Requires fee carve-out review",
    icon: "ban",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
  },
]

export const PLACEMENT_AGENTS: PlacementAgent[] = [
  {
    id: "pa-emerging",
    name: "Emerging Markets Capital Ltd",
    geography: "Southern Africa",
    feePct: 1.25,
    retainer: "US$15,000 / quarter",
    period: "Jan 2026 – Dec 2027",
    introducedCount: 6,
    commissionStatus: "Accruing",
    appointedAt: "15 Jan 2026",
    owner: "Farai N.",
    exclusions: ["Existing NMBZ relationship", "NSSA direct mandate"],
    opportunities: [
      { id: "o1", investor: "NMBZ Holdings Limited", amount: "US$5.0M", eligible: false },
      { id: "o2", investor: "Old Mutual Investment Group", amount: "US$8.5M", eligible: true },
      { id: "o3", investor: "Stanbic Bank Zimbabwe", amount: "US$3.2M", eligible: true },
      { id: "o4", investor: "CABS Building Society", amount: "US$4.0M", eligible: true },
      { id: "o5", investor: "Nyasha Capital Partners", amount: "US$2.1M", eligible: true },
      { id: "o6", investor: "First Capital Asset Management", amount: "US$1.8M", eligible: true },
    ],
  },
  {
    id: "pa-atlantic",
    name: "Atlantic Placement Partners",
    geography: "UK & Europe",
    feePct: 1.5,
    retainer: "US$25,000 / quarter",
    period: "Mar 2026 – Mar 2028",
    introducedCount: 4,
    commissionStatus: "Accruing",
    appointedAt: "01 Mar 2026",
    owner: "Rudo K.",
    exclusions: ["UK pension schemes under existing IMA"],
    opportunities: [
      { id: "o1", investor: "CDC Group (British International Investment)", amount: "US$12.0M", eligible: true },
      { id: "o2", investor: "Norfund", amount: "US$6.5M", eligible: true },
      { id: "o3", investor: "Proparco", amount: "US$4.0M", eligible: false },
      { id: "o4", investor: "FMO", amount: "US$3.5M", eligible: true },
    ],
  },
  {
    id: "pa-harare",
    name: "Harare Advisory Group",
    geography: "Zimbabwe — Local",
    feePct: 0.75,
    retainer: "None",
    period: "Apr 2026 – Apr 2027",
    introducedCount: 5,
    commissionStatus: "Paid",
    appointedAt: "10 Apr 2026",
    owner: "Tendai M.",
    exclusions: [],
    opportunities: [
      { id: "o1", investor: "Ecobank Zimbabwe", amount: "US$2.5M", eligible: true },
      { id: "o2", investor: "ZB Financial Holdings", amount: "US$1.9M", eligible: true },
      { id: "o3", investor: "FBC Holdings", amount: "US$2.2M", eligible: true },
      { id: "o4", investor: "Seed Co International", amount: "US$1.0M", eligible: true },
      { id: "o5", investor: "Delta Corporation", amount: "US$1.5M", eligible: true },
    ],
  },
  {
    id: "pa-gulf",
    name: "Gulf Sovereign Advisory",
    geography: "Middle East & North Africa",
    feePct: 1.0,
    retainer: "US$10,000 / quarter",
    period: "Feb 2026 – Feb 2028",
    introducedCount: 3,
    commissionStatus: "On Hold",
    appointedAt: "20 Feb 2026",
    owner: "Chipo D.",
    exclusions: ["Existing sovereign direct relationships", "ADIA co-investments"],
    opportunities: [
      { id: "o1", investor: "Mubadala Capital", amount: "US$10.0M", eligible: false },
      { id: "o2", investor: "ADIA Sub-Saharan Africa Desk", amount: "US$7.5M", eligible: false },
      { id: "o3", investor: "Qatar Investment Authority — Africa", amount: "US$5.0M", eligible: true },
    ],
  },
]

export const GEOGRAPHY_OPTIONS = [
  "Southern Africa",
  "UK & Europe",
  "Zimbabwe — Local",
  "Middle East & North Africa",
  "East Africa",
  "Global",
]

export function commissionStatusClass(status: CommissionStatus): string {
  switch (status) {
    case "Paid":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Accruing":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "On Hold":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
