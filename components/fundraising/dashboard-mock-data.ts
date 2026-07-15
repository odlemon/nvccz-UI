export type DashMode = "pe_vc" | "asset_mgmt"
export type CampaignFilter = "all" | "zgf" | "mandate"

export type DashCampaign = {
  id: CampaignFilter
  name: string
  typeLabel: string
  mode: DashMode
}

export type DashKpiSet = {
  target: { amount: string; amountM: number; helper: string }
  soft: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  signed: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  admitted: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  funded: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  weighted: { amount: string; amountM: number; helper: string }
  /** AM mode substitutes for signed/admitted/funded display */
  expectedAum?: { amount: string; amountM: number; helper: string; pctOfTarget: number }
  activatedAum?: { amount: string; amountM: number; helper: string; pctOfTarget: number }
}

export type DashProgress = {
  targetM: number
  signedM: number
  fundedM: number
  remainingM: number
  firstClose: string
  finalClose: string
  signedLabel: string
  fundedLabel: string
}

export type DashCoverage = {
  grossPipeline: string
  weightedPipeline: string
  remainingTarget: string
  coverageRatio: string
  coveragePct: number
  expectedFee: string
}

export type DashFunnelStage = {
  id: string
  label: string
  count: number
  amount: string
}

export type DashOpportunity = {
  id: string
  investor: string
  logoLabel: string
  logoBg: string
  campaignId: CampaignFilter
  campaignName: string
  stage: string
  softAmount: string
  signedAmount: string
  fundedAmount: string
  expectedAum: string
  activatedAum: string
  owner: string
  nextAction: string
  ageingDays: number
  mode: DashMode
}

export type DashTaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_ON_INVESTOR"
  | "WAITING_ON_INTERNAL_TEAM"
  | "COMPLETED"
  | "OVERDUE"

export type DashTask = {
  id: string
  title: string
  related: string
  dueDate: string
  status: DashTaskStatus
  owner: string
}

export type DashActivityKind =
  | "meeting"
  | "email"
  | "ddq"
  | "commitment"
  | "call"
  | "document"

export type DashActivity = {
  id: string
  kind: DashActivityKind
  title: string
  detail: string
  timestamp: string
  actor: string
}

export const DASH_AS_AT = "20 May 2025"

export const DASH_CAMPAIGNS: DashCampaign[] = [
  { id: "all", name: "All Campaigns", typeLabel: "Portfolio view", mode: "pe_vc" },
  { id: "zgf", name: "ZGF II", typeLabel: "PE Fundraise", mode: "pe_vc" },
  { id: "mandate", name: "Institutional Mandates FY25", typeLabel: "Asset Management", mode: "asset_mgmt" },
]

export const KPIS_BY_FILTER: Record<CampaignFilter, DashKpiSet> = {
  all: {
    target: { amount: "US$50.00M", amountM: 50, helper: "Combined targets" },
    soft: { amount: "US$33.21M", amountM: 33.21, helper: "Non-binding", pctOfTarget: 66 },
    signed: { amount: "US$22.60M", amountM: 22.6, helper: "Executed agreements", pctOfTarget: 45 },
    admitted: { amount: "US$18.40M", amountM: 18.4, helper: "Admitted at close", pctOfTarget: 37 },
    funded: { amount: "US$16.90M", amountM: 16.9, helper: "Cash received", pctOfTarget: 34 },
    weighted: { amount: "US$28.75M", amountM: 28.75, helper: "Prob × confidence" },
    expectedAum: { amount: "US$85.00M", amountM: 85, helper: "Mandate pipeline", pctOfTarget: 57 },
    activatedAum: { amount: "US$42.00M", amountM: 42, helper: "Under management", pctOfTarget: 28 },
  },
  zgf: {
    target: { amount: "US$40.00M", amountM: 40, helper: "Hard cap US$50M" },
    soft: { amount: "US$28.40M", amountM: 28.4, helper: "Non-binding", pctOfTarget: 71 },
    signed: { amount: "US$18.50M", amountM: 18.5, helper: "Executed agreements", pctOfTarget: 46 },
    admitted: { amount: "US$14.20M", amountM: 14.2, helper: "Closing #1–2", pctOfTarget: 36 },
    funded: { amount: "US$12.80M", amountM: 12.8, helper: "Cash received", pctOfTarget: 32 },
    weighted: { amount: "US$24.10M", amountM: 24.1, helper: "Prob × confidence" },
  },
  mandate: {
    target: { amount: "US$150.00M", amountM: 150, helper: "AUM target" },
    soft: { amount: "US$95.00M", amountM: 95, helper: "Qualified interest", pctOfTarget: 63 },
    signed: { amount: "US$60.00M", amountM: 60, helper: "Agreements signed", pctOfTarget: 40 },
    admitted: { amount: "US$0.00M", amountM: 0, helper: "N/A for AM", pctOfTarget: 0 },
    funded: { amount: "US$42.00M", amountM: 42, helper: "Assets received", pctOfTarget: 28 },
    weighted: { amount: "US$72.50M", amountM: 72.5, helper: "Prob × confidence" },
    expectedAum: { amount: "US$95.00M", amountM: 95, helper: "Expected AUM", pctOfTarget: 63 },
    activatedAum: { amount: "US$42.00M", amountM: 42, helper: "Activated AUM", pctOfTarget: 28 },
  },
}

export const PROGRESS_BY_FILTER: Record<CampaignFilter, DashProgress> = {
  all: {
    targetM: 50,
    signedM: 22.6,
    fundedM: 16.9,
    remainingM: 27.4,
    firstClose: "21 May 2025",
    finalClose: "30 Nov 2025",
    signedLabel: "Signed commitments",
    fundedLabel: "Funded capital",
  },
  zgf: {
    targetM: 40,
    signedM: 18.5,
    fundedM: 12.8,
    remainingM: 21.5,
    firstClose: "21 May 2025",
    finalClose: "30 Nov 2025",
    signedLabel: "Signed commitments",
    fundedLabel: "Funded capital",
  },
  mandate: {
    targetM: 150,
    signedM: 60,
    fundedM: 42,
    remainingM: 90,
    firstClose: "15 Jun 2025",
    finalClose: "31 Mar 2026",
    signedLabel: "Agreements signed",
    fundedLabel: "Activated AUM",
  },
}

export const COVERAGE_BY_FILTER: Record<CampaignFilter, DashCoverage> = {
  all: {
    grossPipeline: "US$41.20M",
    weightedPipeline: "US$28.75M",
    remainingTarget: "US$27.40M",
    coverageRatio: "1.05×",
    coveragePct: 105,
    expectedFee: "US$1.15M / yr",
  },
  zgf: {
    grossPipeline: "US$32.80M",
    weightedPipeline: "US$24.10M",
    remainingTarget: "US$21.50M",
    coverageRatio: "1.12×",
    coveragePct: 112,
    expectedFee: "US$0.96M / yr",
  },
  mandate: {
    grossPipeline: "US$118.00M",
    weightedPipeline: "US$72.50M",
    remainingTarget: "US$90.00M",
    coverageRatio: "0.81×",
    coveragePct: 81,
    expectedFee: "US$2.40M / yr",
  },
}

export const FUNNEL_PE: DashFunnelStage[] = [
  { id: "qualified", label: "Qualified", count: 12, amount: "US$9.2M" },
  { id: "engaged", label: "Engaged", count: 9, amount: "US$7.8M" },
  { id: "data_room", label: "Data Room", count: 7, amount: "US$6.5M" },
  { id: "due_diligence", label: "Due Diligence", count: 5, amount: "US$5.1M" },
  { id: "negotiation", label: "Negotiation", count: 4, amount: "US$4.2M" },
  { id: "signed", label: "Signed", count: 6, amount: "US$18.5M" },
  { id: "funded", label: "Funded", count: 4, amount: "US$12.8M" },
]

export const FUNNEL_AM: DashFunnelStage[] = [
  { id: "discovery", label: "Discovery", count: 8, amount: "US$22M" },
  { id: "rfp", label: "RFI / RFP", count: 6, amount: "US$35M" },
  { id: "proposal", label: "Proposal", count: 5, amount: "US$28M" },
  { id: "due_diligence", label: "Due Diligence", count: 4, amount: "US$18M" },
  { id: "preferred", label: "Preferred", count: 3, amount: "US$15M" },
  { id: "awarded", label: "Awarded", count: 2, amount: "US$60M" },
  { id: "activated", label: "Activated", count: 2, amount: "US$42M" },
]

export const FUNNEL_BY_FILTER: Record<CampaignFilter, DashFunnelStage[]> = {
  all: FUNNEL_PE,
  zgf: FUNNEL_PE,
  mandate: FUNNEL_AM,
}

export const DASH_OPPORTUNITIES: DashOpportunity[] = [
  {
    id: "o1",
    investor: "NMBZ Holdings Limited",
    logoLabel: "N",
    logoBg: "#f97316",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Signed",
    softAmount: "US$7.50M",
    signedAmount: "US$7.50M",
    fundedAmount: "US$0.00M",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Tariro Moyo",
    nextAction: "Closing pack review",
    ageingDays: 4,
    mode: "pe_vc",
  },
  {
    id: "o2",
    investor: "Old Mutual Life Assurance",
    logoLabel: "OM",
    logoBg: "#16a34a",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Funded",
    softAmount: "US$5.00M",
    signedAmount: "US$5.00M",
    fundedAmount: "US$5.00M",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Tariro Moyo",
    nextAction: "Portal provisioning",
    ageingDays: 12,
    mode: "pe_vc",
  },
  {
    id: "o3",
    investor: "Nyasha Pension Fund",
    logoLabel: "NP",
    logoBg: "#7c3aed",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Due Diligence",
    softAmount: "US$4.00M",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Tawanda Chirwa",
    nextAction: "Respond to waterfall Q&A",
    ageingDays: 27,
    mode: "pe_vc",
  },
  {
    id: "o4",
    investor: "Stanbic Bank Zimbabwe",
    logoLabel: "S",
    logoBg: "#1d4ed8",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Negotiation",
    softAmount: "US$3.00M",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Farai Ncube",
    nextAction: "Fee discount approval",
    ageingDays: 9,
    mode: "pe_vc",
  },
  {
    id: "o5",
    investor: "Granite Peak Trustees",
    logoLabel: "GP",
    logoBg: "#0f766e",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Data Room",
    softAmount: "US$2.50M",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Kudakwashe Mlambo",
    nextAction: "Share marked-up LPA",
    ageingDays: 19,
    mode: "pe_vc",
  },
  {
    id: "o6",
    investor: "Afreximbank",
    logoLabel: "A",
    logoBg: "#111827",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Engaged",
    softAmount: "US$6.00M",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Tariro Moyo",
    nextAction: "Schedule IC briefing",
    ageingDays: 6,
    mode: "pe_vc",
  },
  {
    id: "o7",
    investor: "Horizon Capital",
    logoLabel: "H",
    logoBg: "#2563eb",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Qualified",
    softAmount: "US$2.00M",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Chipo Dube",
    nextAction: "Confirm decision maker",
    ageingDays: 16,
    mode: "pe_vc",
  },
  {
    id: "o8",
    investor: "NSSA",
    logoLabel: "NS",
    logoBg: "#0e7490",
    campaignId: "mandate",
    campaignName: "Institutional Mandates FY25",
    stage: "Awarded",
    softAmount: "—",
    signedAmount: "US$45.00M",
    fundedAmount: "US$28.00M",
    expectedAum: "US$45.00M",
    activatedAum: "US$28.00M",
    owner: "Grace Chirwa",
    nextAction: "Custody transition",
    ageingDays: 21,
    mode: "asset_mgmt",
  },
  {
    id: "o9",
    investor: "First Mutual Holdings",
    logoLabel: "FM",
    logoBg: "#9333ea",
    campaignId: "mandate",
    campaignName: "Institutional Mandates FY25",
    stage: "Proposal",
    softAmount: "—",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "US$30.00M",
    activatedAum: "—",
    owner: "Tendai Banda",
    nextAction: "Submit fee schedule",
    ageingDays: 11,
    mode: "asset_mgmt",
  },
  {
    id: "o10",
    investor: "CBZ Asset Management",
    logoLabel: "CB",
    logoBg: "#1d4ed8",
    campaignId: "mandate",
    campaignName: "Institutional Mandates FY25",
    stage: "RFI / RFP",
    softAmount: "—",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "US$25.00M",
    activatedAum: "—",
    owner: "Rudo Dube",
    nextAction: "Answer tender Qs",
    ageingDays: 8,
    mode: "asset_mgmt",
  },
  {
    id: "o11",
    investor: "Chiedza Ventures",
    logoLabel: "CV",
    logoBg: "#ea580c",
    campaignId: "zgf",
    campaignName: "ZGF II",
    stage: "Admitted",
    softAmount: "US$1.50M",
    signedAmount: "US$1.50M",
    fundedAmount: "US$0.50M",
    expectedAum: "—",
    activatedAum: "—",
    owner: "Farai Ncube",
    nextAction: "Capital call contact",
    ageingDays: 3,
    mode: "pe_vc",
  },
  {
    id: "o12",
    investor: "Delta Corporation",
    logoLabel: "D",
    logoBg: "#b45309",
    campaignId: "mandate",
    campaignName: "Institutional Mandates FY25",
    stage: "Preferred",
    softAmount: "—",
    signedAmount: "—",
    fundedAmount: "—",
    expectedAum: "US$18.00M",
    activatedAum: "—",
    owner: "Grace Chirwa",
    nextAction: "Final presentation",
    ageingDays: 5,
    mode: "asset_mgmt",
  },
]

export const DASH_TASKS: DashTask[] = [
  {
    id: "tk1",
    title: "Upload Closing #2 pack for legal sign-off",
    related: "ZGF II · Closing",
    dueDate: "21 May 2025",
    status: "OVERDUE",
    owner: "Tariro Moyo",
  },
  {
    id: "tk2",
    title: "Respond to Nyasha waterfall Q&A",
    related: "Nyasha Pension Fund",
    dueDate: "21 May 2025",
    status: "IN_PROGRESS",
    owner: "Tawanda Chirwa",
  },
  {
    id: "tk3",
    title: "Route fee discount approval (>15bps)",
    related: "Stanbic Bank Zimbabwe",
    dueDate: "22 May 2025",
    status: "WAITING_ON_INTERNAL_TEAM",
    owner: "Farai Ncube",
  },
  {
    id: "tk4",
    title: "Issue data-room invite (Granite Peak)",
    related: "Granite Peak Trustees",
    dueDate: "23 May 2025",
    status: "NOT_STARTED",
    owner: "Kudakwashe Mlambo",
  },
  {
    id: "tk5",
    title: "Confirm custodian onboarding (NSSA)",
    related: "NSSA Mandate",
    dueDate: "24 May 2025",
    status: "WAITING_ON_INVESTOR",
    owner: "Grace Chirwa",
  },
  {
    id: "tk6",
    title: "Prepare monthly IR update deck",
    related: "All Campaigns",
    dueDate: "26 May 2025",
    status: "IN_PROGRESS",
    owner: "Tariro Moyo",
  },
  {
    id: "tk7",
    title: "Complete First Mutual RFP checklist",
    related: "First Mutual Holdings",
    dueDate: "28 May 2025",
    status: "NOT_STARTED",
    owner: "Tendai Banda",
  },
]

export const DASH_ACTIVITY: DashActivity[] = [
  {
    id: "a1",
    kind: "commitment",
    title: "NMBZ commitment marked Signed",
    detail: "US$7.50M · ZGF II — not treated as funded",
    timestamp: "20 May 2025, 09:12",
    actor: "Tariro Moyo",
  },
  {
    id: "a2",
    kind: "ddq",
    title: "DDQ follow-up from Nyasha Pension Fund",
    detail: "Carried interest waterfall clarification",
    timestamp: "19 May 2025, 15:02",
    actor: "Nyasha Pension Fund",
  },
  {
    id: "a3",
    kind: "meeting",
    title: "Stanbic commercial negotiation",
    detail: "Fee terms + side letter discussion",
    timestamp: "19 May 2025, 11:30",
    actor: "Farai Ncube",
  },
  {
    id: "a4",
    kind: "email",
    title: "Data-room materials shared",
    detail: "Granite Peak Trustees · track record folder",
    timestamp: "18 May 2025, 16:45",
    actor: "Kudakwashe Mlambo",
  },
  {
    id: "a5",
    kind: "document",
    title: "LPA v3 uploaded",
    detail: "Clause 8.2 highlighted · supersedes v2 signatures",
    timestamp: "18 May 2025, 10:08",
    actor: "Tawanda Chirwa",
  },
  {
    id: "a6",
    kind: "call",
    title: "NSSA custody transition call",
    detail: "Assets in transition checklist review",
    timestamp: "17 May 2025, 14:20",
    actor: "Grace Chirwa",
  },
  {
    id: "a7",
    kind: "commitment",
    title: "Old Mutual funded US$5.00M",
    detail: "Receipt matched · funded amount updated",
    timestamp: "16 May 2025, 09:55",
    actor: "Finance",
  },
  {
    id: "a8",
    kind: "meeting",
    title: "Afreximbank IC briefing booked",
    detail: "Engaged stage · 22 May 2025",
    timestamp: "15 May 2025, 13:10",
    actor: "Tariro Moyo",
  },
]

export function stageChipClass(stage: string): string {
  const s = stage.toLowerCase()
  if (s.includes("fund") || s.includes("activat")) return "bg-[#dcfce7] text-[#15803d]"
  if (s.includes("sign") || s.includes("admit") || s.includes("award"))
    return "bg-[#ede9fe] text-[#6d28d9]"
  if (s.includes("due") || s.includes("negot") || s.includes("prefer"))
    return "bg-[#ffedd5] text-[#c2410c]"
  if (s.includes("data") || s.includes("propos") || s.includes("rfi") || s.includes("rfp"))
    return "bg-[#dbeafe] text-[#1d4ed8]"
  return "bg-[#f1f5f9] text-[#475569]"
}

export function taskStatusClass(status: DashTaskStatus): string {
  switch (status) {
    case "OVERDUE":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "IN_PROGRESS":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "WAITING_ON_INVESTOR":
    case "WAITING_ON_INTERNAL_TEAM":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function taskStatusLabel(status: DashTaskStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Not started"
    case "IN_PROGRESS":
      return "In progress"
    case "WAITING_ON_INVESTOR":
      return "Waiting on investor"
    case "WAITING_ON_INTERNAL_TEAM":
      return "Waiting internal"
    case "COMPLETED":
      return "Completed"
    case "OVERDUE":
      return "Overdue"
  }
}
