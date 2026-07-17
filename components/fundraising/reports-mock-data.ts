export type ReportSchedule = "Daily" | "Weekly" | "Monthly" | "On demand"

export type FrReport = {
  id: string
  name: string
  description: string
  schedule: ReportSchedule
  owner: string
  category: "Progress" | "Conversion" | "Concentration" | "Compliance"
  /** API report key — GET /fundraising/reports/:reportKey */
  reportKey: string
  requiresCampaign?: boolean
}

export const FR_REPORTS: FrReport[] = [
  {
    id: "r1",
    name: "Fundraising Progress",
    description: "Signed vs target by campaign, with coverage ratio — pipeline summary.",
    schedule: "Weekly",
    owner: "Tariro Moyo",
    category: "Progress",
    reportKey: "pipeline-summary",
    requiresCampaign: true,
  },
  {
    id: "r2",
    name: "Stage Conversion",
    description: "Funnel conversion rates by stage across the selected campaign's pipeline.",
    schedule: "Monthly",
    owner: "Kudakwashe Mlambo",
    category: "Conversion",
    reportKey: "funnel",
  },
  {
    id: "r3",
    name: "Source Breakdown",
    description: "Pipeline and investor source mix — direct, referral, conference, placement agent.",
    schedule: "Monthly",
    owner: "Tawanda Chirwa",
    category: "Concentration",
    reportKey: "source",
  },
  {
    id: "r4",
    name: "Campaign Metrics",
    description: "Weighted pipeline, gross pipeline and fee forecast for the selected campaign.",
    schedule: "Weekly",
    owner: "Tariro Moyo",
    category: "Progress",
    reportKey: "campaign-metrics",
    requiresCampaign: true,
  },
  {
    id: "r5",
    name: "Owner Performance",
    description: "Deal owner leaderboard — open opportunities, activity and conversion by owner.",
    schedule: "Daily",
    owner: "Farai Kumbirai",
    category: "Conversion",
    reportKey: "owner-performance",
  },
  {
    id: "r6",
    name: "Stage Ageing",
    description: "Days-in-stage heatmap — flags stalled DD/KYC and other compliance turnaround.",
    schedule: "On demand",
    owner: "Patience Gumbo",
    category: "Compliance",
    reportKey: "stage-ageing",
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
