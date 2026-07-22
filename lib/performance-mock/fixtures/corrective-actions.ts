export type CorrectiveActionRow = {
  id: string
  title: string
  triggerType: string
  sourceKpi: string
  actual: string
  target: string
  triggerTone: "danger" | "warning" | "info"
  linkedObjective: string
  rootCause: string
  ownerInitials: string
  ownerName: string
  ownerDept: string
  ownerSrc: string
  targetDate: string
  slaLabel: string
  slaTone: "danger" | "warning" | "success"
  progress: number
  escalation: "None" | "Level 1" | "Level 2" | "Level 3"
  status: "Open" | "In Progress" | "Escalated" | "Resolved" | "Closed"
}

export const correctiveActionMetrics = [
  {
    id: "open",
    label: "Open Actions",
    value: "68",
    trend: "+8.0%",
    trendPositive: true,
    valueColor: "#111827",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
    icon: "clipboard",
  },
  {
    id: "overdue",
    label: "Overdue",
    value: "14",
    trend: "+16.7%",
    trendPositive: false,
    valueColor: "#EF4444",
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    icon: "clock",
  },
  {
    id: "high",
    label: "High Severity",
    value: "18",
    trend: "-12.5%",
    trendPositive: true,
    valueColor: "#F59E0B",
    iconBg: "#FEF3C7",
    iconColor: "#F59E0B",
    icon: "alert",
  },
  {
    id: "resolved",
    label: "Resolved This Month",
    value: "23",
    trend: "+27.8%",
    trendPositive: true,
    valueColor: "#10B981",
    iconBg: "#D1FAE5",
    iconColor: "#10B981",
    icon: "check",
  },
  {
    id: "avg",
    label: "Avg. Resolution Time",
    value: "18.4 days",
    trend: "-2.1 days",
    trendPositive: true,
    valueColor: "#7C3AED",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
    icon: "timer",
  },
]

export const actionsByStatusOverTime = [
  { month: "Jan", open: 18, inProgress: 22, escalated: 6, resolved: 28, closed: 14 },
  { month: "Feb", open: 20, inProgress: 24, escalated: 8, resolved: 26, closed: 16 },
  { month: "Mar", open: 22, inProgress: 26, escalated: 7, resolved: 30, closed: 18 },
  { month: "Apr", open: 24, inProgress: 28, escalated: 9, resolved: 27, closed: 20 },
  { month: "May", open: 21, inProgress: 25, escalated: 8, resolved: 32, closed: 19 },
  { month: "Jun", open: 19, inProgress: 23, escalated: 6, resolved: 34, closed: 22 },
  { month: "Jul", open: 14, inProgress: 20, escalated: 5, resolved: 23, closed: 24 },
]

export const actionsBySeverity = [
  { name: "High", value: 18, pct: 26.5, color: "#EF4444" },
  { name: "Medium", value: 28, pct: 41.2, color: "#F59E0B" },
  { name: "Low", value: 22, pct: 32.4, color: "#10B981" },
]

export const topRootCauses = [
  { cause: "Process Gap", count: 20, pct: 29.4 },
  { cause: "Resource Constraint", count: 16, pct: 23.5 },
  { cause: "Skills / Competency Gap", count: 11, pct: 16.2 },
  { cause: "Policy / Procedure Gap", count: 9, pct: 13.2 },
  { cause: "System / Data Issue", count: 7, pct: 10.3 },
]

export const correctiveActions: CorrectiveActionRow[] = [
  {
    id: "CA-001",
    title: "Reduce Loan Processing Turnaround Time",
    triggerType: "KPI Underperformance",
    sourceKpi: "Loan Processing TAT (Days)",
    actual: "6.4",
    target: "≤ 3",
    triggerTone: "danger",
    linkedObjective: "Deliver Exceptional Customer Experience",
    rootCause: "Manual verification processes causing delays",
    ownerInitials: "TM",
    ownerName: "Tinashe Moyo",
    ownerDept: "Operations",
    ownerSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    targetDate: "15 Jul 2026",
    slaLabel: "-3 days Overdue",
    slaTone: "danger",
    progress: 65,
    escalation: "Level 1",
    status: "In Progress",
  },
  {
    id: "CA-002",
    title: "Improve Branch Cash Reconciliation Accuracy",
    triggerType: "KPI Underperformance",
    sourceKpi: "Cash Reconciliation Accuracy (%)",
    actual: "86%",
    target: "≥ 98%",
    triggerTone: "danger",
    linkedObjective: "Ensure Financial Integrity",
    rootCause: "Inadequate training and reconciliation checks",
    ownerInitials: "RN",
    ownerName: "Rumbidzai Nyathi",
    ownerDept: "Finance",
    ownerSrc: "https://randomuser.me/api/portraits/women/33.jpg",
    targetDate: "22 Jul 2026",
    slaLabel: "-1 day Overdue",
    slaTone: "danger",
    progress: 40,
    escalation: "Level 1",
    status: "In Progress",
  },
  {
    id: "CA-003",
    title: "Increase Active Mobile Banking Users",
    triggerType: "KPI At Risk",
    sourceKpi: "Active Mobile Users (%)",
    actual: "42%",
    target: "≥ 55%",
    triggerTone: "warning",
    linkedObjective: "Grow Digital Adoption",
    rootCause: "Low customer awareness and digital literacy",
    ownerInitials: "TN",
    ownerName: "Tendai Nyariri",
    ownerDept: "Digital Banking",
    ownerSrc: "https://randomuser.me/api/portraits/men/75.jpg",
    targetDate: "05 Aug 2026",
    slaLabel: "5 days At Risk",
    slaTone: "warning",
    progress: 25,
    escalation: "Level 2",
    status: "Escalated",
  },
  {
    id: "CA-004",
    title: "Reduce IT System Downtime",
    triggerType: "Audit Finding",
    sourceKpi: "AF-2026-137 · Critical",
    actual: "Critical",
    target: "Resolved",
    triggerTone: "danger",
    linkedObjective: "Ensure Operational Continuity",
    rootCause: "Outdated infrastructure and patching delays",
    ownerInitials: "KN",
    ownerName: "Kudzai Ncube",
    ownerDept: "IT",
    ownerSrc: "https://randomuser.me/api/portraits/men/52.jpg",
    targetDate: "18 Jul 2026",
    slaLabel: "2 days On Track",
    slaTone: "success",
    progress: 70,
    escalation: "Level 1",
    status: "In Progress",
  },
  {
    id: "CA-005",
    title: "Improve Employee Engagement Score",
    triggerType: "KPI At Risk",
    sourceKpi: "Employee Engagement Score",
    actual: "68%",
    target: "≥ 75%",
    triggerTone: "warning",
    linkedObjective: "Build a High Performing Workforce",
    rootCause: "Limited recognition and career development",
    ownerInitials: "TC",
    ownerName: "Tatenda Chiwara",
    ownerDept: "People & Culture",
    ownerSrc: "https://randomuser.me/api/portraits/women/65.jpg",
    targetDate: "30 Jul 2026",
    slaLabel: "10 days On Track",
    slaTone: "success",
    progress: 50,
    escalation: "None",
    status: "Open",
  },
  {
    id: "CA-006",
    title: "Reduce Overdraft Utilization Ratio",
    triggerType: "KPI At Risk",
    sourceKpi: "Overdraft Utilization (%)",
    actual: "72%",
    target: "≤ 60%",
    triggerTone: "warning",
    linkedObjective: "Maintain Liquidity Strength",
    rootCause: "High customer reliance on overdraft facilities",
    ownerInitials: "KC",
    ownerName: "Kudzai Chikore",
    ownerDept: "Credit Risk",
    ownerSrc: "https://randomuser.me/api/portraits/men/11.jpg",
    targetDate: "12 Aug 2026",
    slaLabel: "15 days On Track",
    slaTone: "success",
    progress: 15,
    escalation: "None",
    status: "Open",
  },
]

export const correctiveActionOwners = Array.from(new Set(correctiveActions.map((a) => a.ownerName)))
export const correctiveActionUnits = Array.from(new Set(correctiveActions.map((a) => a.ownerDept)))
