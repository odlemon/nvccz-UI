/**
 * Presentation helpers for the fundraising reports screen.
 *
 * The runnable report catalogue comes from GET /fundraising/reports; schedules come from
 * GET /fundraising/reports/schedules. Nothing here fabricates values — REPORT_COPY only
 * carries the descriptive blurb and grouping colour for report keys the API returns, and a
 * key the API does not return is never rendered.
 */

export type ReportSchedule = "Daily" | "Weekly" | "Monthly" | "On demand"

export type ReportCategory = "Progress" | "Conversion" | "Concentration" | "Compliance"

export type FrReport = {
  /** Same as reportKey — the API catalogue has no separate id. */
  id: string
  name: string
  description: string
  /** Cadence of the live schedule for this report, or null when it is not scheduled. */
  schedule: ReportSchedule | null
  /** Owner of the live schedule, or null when it is not scheduled. */
  owner: string | null
  category: ReportCategory
  /** API report key — GET /fundraising/reports/:reportKey */
  reportKey: string
  requiresCampaign?: boolean
}

/** Descriptive copy and grouping per report key. UI text only — carries no data. */
export const REPORT_COPY: Record<string, { description: string; category: ReportCategory }> = {
  "pipeline-summary": {
    description: "Signed vs target by campaign, with coverage ratio.",
    category: "Progress",
  },
  "campaign-metrics": {
    description: "Target, signed, admitted and funded totals for the selected campaign.",
    category: "Progress",
  },
  funnel: {
    description: "Conversion rates between pipeline stages.",
    category: "Conversion",
  },
  "pipeline-funnel": {
    description: "Conversion rates between pipeline stages.",
    category: "Conversion",
  },
  source: {
    description: "Where opportunities originate, by volume and value.",
    category: "Conversion",
  },
  "source-analysis": {
    description: "Where opportunities originate, by volume and value.",
    category: "Conversion",
  },
  "owner-performance": {
    description: "Pipeline and signed value by relationship owner.",
    category: "Conversion",
  },
  "stage-ageing": {
    description: "How long open opportunities have been sitting in each stage.",
    category: "Conversion",
  },
  "ddq-export": {
    description: "Full question and answer export for a due-diligence case.",
    category: "Compliance",
  },
  concentration: {
    description: "Exposure concentration by investor, type and geography.",
    category: "Concentration",
  },
  geography: {
    description: "Pipeline and commitments split by investor geography.",
    category: "Concentration",
  },
}

const DEFAULT_COPY = {
  description: "Runnable fundraising report.",
  category: "Progress" as ReportCategory,
}

/** Map one API catalogue entry to the shape the cards render. */
export function toFrReport(
  entry: { reportKey?: string; label?: string; requiresCampaignId?: boolean },
  schedule?: { cadence?: string; owner?: string | null } | null,
): FrReport {
  const key = String(entry.reportKey ?? "")
  const copy = REPORT_COPY[key] ?? DEFAULT_COPY
  return {
    id: key,
    reportKey: key,
    name: entry.label ?? key,
    description: copy.description,
    category: copy.category,
    requiresCampaign: Boolean(entry.requiresCampaignId),
    schedule: cadenceToSchedule(schedule?.cadence),
    owner: schedule?.owner ?? null,
  }
}

function cadenceToSchedule(cadence?: string): ReportSchedule | null {
  switch (String(cadence ?? "").toUpperCase()) {
    case "DAILY":
      return "Daily"
    case "WEEKLY":
      return "Weekly"
    case "MONTHLY":
      return "Monthly"
    case "ON_DEMAND":
      return "On demand"
    default:
      return null
  }
}

export function scheduleToCadence(schedule: ReportSchedule): string {
  switch (schedule) {
    case "Daily":
      return "DAILY"
    case "Weekly":
      return "WEEKLY"
    case "Monthly":
      return "MONTHLY"
    default:
      return "ON_DEMAND"
  }
}

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
