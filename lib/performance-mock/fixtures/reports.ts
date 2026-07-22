export type ReportRow = {
  id: string
  title: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  owner: string
  ownerSrc: string
  previewCharts: ("line" | "bar" | "donut")[]
  previewChartData: number[]
  previewChartColor: string
  scheduleFreq: string
  scheduleTime: string
  scheduleActive: boolean
  formats: ("PDF" | "PPTX" | "XLSX")[]
  recipientEmails: string
  recipientSrcs: string[]
  recipientsExtra: number
  lastRun: string
  runStatus: "Success" | "Failed" | "Running"
  status: "Active" | "Paused" | "Draft"
  category: string
}

export const reportCategories = ["All Categories", "Executive", "Department", "Board", "KPI", "Reviews", "Strategy"]
export const reportOwners = ["All Owners", "Tenashe Muchengeti", "Rumbidzai Nyathi", "Farai Muchengeti", "Kudzai Chikore", "Tatenda Chivaura", "Tinashe Moyo"]
export const reportStatuses = ["All Status", "Active", "Paused", "Draft"]

const A = "https://randomuser.me/api/portraits/men/32.jpg"
const B = "https://randomuser.me/api/portraits/women/44.jpg"
const C = "https://randomuser.me/api/portraits/men/52.jpg"
const D = "https://randomuser.me/api/portraits/women/68.jpg"
const E = "https://randomuser.me/api/portraits/men/75.jpg"
const F = "https://randomuser.me/api/portraits/women/33.jpg"

export const reportLibrary: ReportRow[] = [
  {
    id: "RPT-001",
    title: "Monthly Executive Pack",
    description: "Executive view of performance across the organization",
    icon: "FileBarChart",
    iconBg: "#F3E8FF",
    iconColor: "#8B5CF6",
    owner: "Tenashe Muchengeti",
    ownerSrc: A,
    previewCharts: ["donut", "bar"],
    previewChartData: [76, 60, 64, 68, 72, 76],
    previewChartColor: "#8B5CF6",
    scheduleFreq: "Monthly",
    scheduleTime: "Day 5, 08:00 AM",
    scheduleActive: true,
    formats: ["PDF", "PPTX"],
    recipientEmails: "exec@arcus.co.zw",
    recipientSrcs: [A, B, C],
    recipientsExtra: 7,
    lastRun: "05 Jul 2026, 08:02 AM",
    runStatus: "Success",
    status: "Active",
    category: "Executive",
  },
  {
    id: "RPT-002",
    title: "Department Scorecards",
    description: "Performance overview by department",
    icon: "Building2",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    owner: "Rumbidzai Nyathi",
    ownerSrc: F,
    previewCharts: ["bar", "line"],
    previewChartData: [68, 70, 69, 72, 71, 74],
    previewChartColor: "#2563EB",
    scheduleFreq: "Monthly",
    scheduleTime: "Day 7, 09:00 AM",
    scheduleActive: true,
    formats: ["XLSX", "PDF"],
    recipientEmails: "ops@arcus.co.zw",
    recipientSrcs: [F, D, E],
    recipientsExtra: 5,
    lastRun: "07 Jul 2026, 09:03 AM",
    runStatus: "Success",
    status: "Active",
    category: "Department",
  },
  {
    id: "RPT-003",
    title: "Board Pack",
    description: "Strategic performance for board review",
    icon: "Shield",
    iconBg: "#D1FAE5",
    iconColor: "#10B981",
    owner: "Farai Muchengeti",
    ownerSrc: C,
    previewCharts: ["donut", "line"],
    previewChartData: [82, 70, 74, 76, 80, 82],
    previewChartColor: "#10B981",
    scheduleFreq: "Quarterly",
    scheduleTime: "Day 10, 08:00 AM",
    scheduleActive: true,
    formats: ["PDF", "PPTX"],
    recipientEmails: "board@arcus.co.zw",
    recipientSrcs: [C, A, B, D],
    recipientsExtra: 8,
    lastRun: "10 Jul 2026, 08:01 AM",
    runStatus: "Success",
    status: "Active",
    category: "Board",
  },
  {
    id: "RPT-004",
    title: "KPI Variance Report",
    description: "KPI performance vs targets with variances",
    icon: "LineChart",
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    owner: "Kudzai Chikore",
    ownerSrc: E,
    previewCharts: ["bar", "donut"],
    previewChartData: [8, 5, 9, 4, 7, 6],
    previewChartColor: "#EF4444",
    scheduleFreq: "Monthly",
    scheduleTime: "Day 6, 08:30 AM",
    scheduleActive: true,
    formats: ["XLSX", "PDF"],
    recipientEmails: "kpi@arcus.co.zw",
    recipientSrcs: [E, F],
    recipientsExtra: 4,
    lastRun: "06 Jul 2026, 08:31 AM",
    runStatus: "Success",
    status: "Active",
    category: "KPI",
  },
  {
    id: "RPT-005",
    title: "Review Cycle Summary",
    description: "Summary of review progress and completions",
    icon: "ClipboardCheck",
    iconBg: "#F3E8FF",
    iconColor: "#8B5CF6",
    owner: "Tatenda Chivaura",
    ownerSrc: B,
    previewCharts: ["donut", "bar"],
    previewChartData: [82, 40, 55, 70, 78, 82],
    previewChartColor: "#8B5CF6",
    scheduleFreq: "Monthly",
    scheduleTime: "Day 8, 10:00 AM",
    scheduleActive: true,
    formats: ["PDF", "XLSX"],
    recipientEmails: "hr@arcus.co.zw",
    recipientSrcs: [B, D, A],
    recipientsExtra: 3,
    lastRun: "08 Jul 2026, 10:02 AM",
    runStatus: "Success",
    status: "Active",
    category: "Reviews",
  },
  {
    id: "RPT-006",
    title: "Strategic Progress Report",
    description: "Progress on strategic objectives and initiatives",
    icon: "Target",
    iconBg: "#FFEDD5",
    iconColor: "#F97316",
    owner: "Tinashe Moyo",
    ownerSrc: A,
    previewCharts: ["line", "donut"],
    previewChartData: [70, 72, 74, 75, 77, 78],
    previewChartColor: "#F97316",
    scheduleFreq: "Monthly",
    scheduleTime: "Day 12, 09:00 AM",
    scheduleActive: true,
    formats: ["PDF", "PPTX"],
    recipientEmails: "strategy@arcus.co.zw",
    recipientSrcs: [A, C, E],
    recipientsExtra: 6,
    lastRun: "12 Jul 2026, 09:15 AM",
    runStatus: "Success",
    status: "Active",
    category: "Strategy",
  },
]

export const scheduledReports = [
  { id: "SCH-001", name: "Monthly Executive Pack", cadence: "Monthly", nextRun: "05 Aug 2026, 08:00 AM", recipients: 7, format: "PDF, PPTX" },
  { id: "SCH-002", name: "Department Scorecards", cadence: "Monthly", nextRun: "07 Aug 2026, 09:00 AM", recipients: 5, format: "XLSX, PDF" },
  { id: "SCH-003", name: "Board Pack", cadence: "Quarterly", nextRun: "10 Oct 2026, 08:00 AM", recipients: 8, format: "PDF, PPTX" },
  { id: "SCH-004", name: "KPI Variance Report", cadence: "Monthly", nextRun: "06 Aug 2026, 08:30 AM", recipients: 4, format: "XLSX, PDF" },
]

export const reportHistory = [
  { id: "HIS-001", name: "Monthly Executive Pack", runAt: "05 Jul 2026 08:02 AM", runBy: "System", status: "Success", size: "3.2 MB" },
  { id: "HIS-002", name: "Department Scorecards", runAt: "07 Jul 2026 09:03 AM", runBy: "System", status: "Success", size: "1.8 MB" },
  { id: "HIS-003", name: "Board Pack", runAt: "10 Jul 2026 08:01 AM", runBy: "System", status: "Success", size: "5.6 MB" },
  { id: "HIS-004", name: "KPI Variance Report", runAt: "06 Jul 2026 08:31 AM", runBy: "System", status: "Success", size: "980 KB" },
  { id: "HIS-005", name: "Review Cycle Summary", runAt: "01 Jul 2026 10:02 AM", runBy: "Farai Muchengeti", status: "Failed", size: "—" },
]

export const dataExports = [
  { id: "EXP-001", name: "KPI Dataset — Q2 2026", format: "CSV", requestedBy: "Kudzai Chikore", requestedAt: "18 Jul 2026", status: "Ready", size: "4.1 MB" },
  { id: "EXP-002", name: "Review Ratings — FY2026 Mid-Year", format: "XLSX", requestedBy: "Tatenda Chivaura", requestedAt: "17 Jul 2026", status: "Ready", size: "2.3 MB" },
  { id: "EXP-003", name: "Goals & Progress — All Departments", format: "CSV", requestedBy: "Farai Muchengeti", requestedAt: "16 Jul 2026", status: "Processing", size: "—" },
]

export const reportingScheduleDots: Record<number, ("monthly" | "quarterly" | "weekly" | "adhoc")[]> = {
  5: ["monthly"],
  6: ["weekly"],
  7: ["monthly"],
  8: ["monthly"],
  10: ["quarterly"],
  12: ["monthly"],
  13: ["adhoc"],
  20: ["weekly"],
  27: ["adhoc"],
}

export const reportInsights = [
  { label: "Reports generated this month", value: "28", trend: "↑ 27% vs last month", tone: "success" as const },
  { label: "Scheduled reports", value: "18", trend: "Active schedules", tone: "neutral" as const },
  { label: "Data sources connected", value: "12", trend: "All sources healthy", tone: "success" as const },
]
