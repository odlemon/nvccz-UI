export type ReportSchedule = "Daily" | "Weekly" | "Monthly" | "On demand"

export type ReportRow = Record<string, string>

export type FrReport = {
  id: string
  name: string
  description: string
  schedule: ReportSchedule
  lastRun: string
  owner: string
  category: "Progress" | "Conversion" | "Concentration" | "Compliance"
  sampleRows: ReportRow[]
}

export const FR_REPORTS: FrReport[] = [
  {
    id: "r1",
    name: "Fundraising Progress",
    description: "Signed vs target by campaign, with weekly delta and coverage ratio.",
    schedule: "Weekly",
    lastRun: "14 Jul 2026, 08:00",
    owner: "Tariro Moyo",
    category: "Progress",
    sampleRows: [
      { Campaign: "ZGF II", Target: "US$60.0M", Signed: "US$25.0M", Coverage: "2.2x", Delta: "+US$2.5M" },
      { Campaign: "ZGF I", Target: "US$45.0M", Signed: "US$45.0M", Coverage: "—", Delta: "Closed" },
      { Campaign: "AM Mandate", Target: "US$120.0M", Signed: "US$40.0M", Coverage: "2.5x", Delta: "+US$5.0M" },
    ],
  },
  {
    id: "r2",
    name: "Stage Conversion",
    description: "Funnel conversion rates and average days-in-stage by investor type.",
    schedule: "Monthly",
    lastRun: "01 Jul 2026, 06:30",
    owner: "Kudakwashe Mlambo",
    category: "Conversion",
    sampleRows: [
      { Stage: "Prospect → Qualified", Rate: "67%", "Avg days": "18", Investors: "28" },
      { Stage: "Qualified → DD", Rate: "50%", "Avg days": "24", Investors: "14" },
      { Stage: "DD → Term Sheet", Rate: "57%", "Avg days": "31", Investors: "8" },
      { Stage: "Term Sheet → Committed", Rate: "63%", "Avg days": "21", Investors: "5" },
    ],
  },
  {
    id: "r3",
    name: "Investor Concentration",
    description: "Top commitments, HHI score and long-tail exposure by fund.",
    schedule: "Monthly",
    lastRun: "01 Jul 2026, 07:00",
    owner: "Tawanda Chirwa",
    category: "Concentration",
    sampleRows: [
      { Investor: "NMBZ Holdings", Committed: "US$8.0M", "% of fund": "32%", Tier: "Anchor" },
      { Investor: "Nyasha Pension Fund", Committed: "US$5.0M", "% of fund": "20%", Tier: "Anchor" },
      { Investor: "Granite Peak Trustees", Committed: "US$4.0M", "% of fund": "16%", Tier: "Core" },
      { Investor: "HHI (fund)", Committed: "0.18", "% of fund": "—", Tier: "Low risk" },
    ],
  },
  {
    id: "r4",
    name: "Weighted Pipeline",
    description: "Probability-weighted pipeline with scenario overlays and fee forecast.",
    schedule: "Weekly",
    lastRun: "14 Jul 2026, 08:15",
    owner: "Tariro Moyo",
    category: "Progress",
    sampleRows: [
      { Scenario: "Base", Gross: "US$132.0M", Weighted: "US$52.8M", Fee: "US$1.20M" },
      { Scenario: "Downside", Gross: "US$72.0M", Weighted: "US$28.4M", Fee: "US$1.05M" },
      { Scenario: "Upside", Gross: "US$168.0M", Weighted: "US$72.0M", Fee: "US$1.35M" },
    ],
  },
  {
    id: "r5",
    name: "Meeting & Activity Log",
    description: "Investor touchpoints, follow-ups due and stale opportunities.",
    schedule: "Daily",
    lastRun: "15 Jul 2026, 07:00",
    owner: "Farai Kumbirai",
    category: "Conversion",
    sampleRows: [
      { Investor: "CBZ Insurance", Activity: "DD call", Owner: "Tariro M.", Due: "15 Jul" },
      { Investor: "Zimnat AM", Activity: "Follow-up email", Owner: "Tawanda C.", Due: "16 Jul" },
      { Investor: "Old Mutual ZW", Activity: "Stale (>30d)", Owner: "Kudakwashe M.", Due: "Overdue" },
    ],
  },
  {
    id: "r6",
    name: "Compliance & KYC",
    description: "Outstanding KYC, sanctions checks and document gaps before close.",
    schedule: "On demand",
    lastRun: "10 Jul 2026, 14:22",
    owner: "Patience Gumbo",
    category: "Compliance",
    sampleRows: [
      { Investor: "Nyasha Pension Fund", KYC: "Approved", Sanctions: "Clear", Docs: "2 pending" },
      { Investor: "NMBZ Holdings", KYC: "Approved", Sanctions: "Clear", Docs: "Complete" },
      { Investor: "Granite Peak Trustees", KYC: "In Review", Sanctions: "Clear", Docs: "1 pending" },
    ],
  },
]

export function categoryClass(category: FrReport["category"]) {
  switch (category) {
    case "Progress":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Conversion":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Concentration":
      return "bg-[#dcfce7] text-[#15803d]"
    default:
      return "bg-[#ffedd5] text-[#c2410c]"
  }
}

export function reportColumns(rows: ReportRow[]): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0])
}
