export type AlertSeverity = "Critical" | "High" | "Medium" | "Low"
export type AlertStatus = "Open" | "Escalated" | "Investigating" | "Resolved" | "Auto-Resolved"

export type AlertRow = {
  id: string
  title: string
  subtitle: string
  dotTone: "danger" | "warning" | "success"
  source: string
  sourceMeta: string
  sourceDept: string
  severity: AlertSeverity
  ownerInitials: string
  ownerName: string
  ownerRole: string
  ownerSrc: string
  escalationLevel: number
  elapsed: string
  elapsedUrgent: boolean
  status: AlertStatus
  ruleName: string
}

export const alertMetrics = [
  { id: "critical", label: "Critical Alerts", value: "18", trend: "↓ 12% vs Jun 2026", trendPositive: true, color: "#EF4444", bg: "#FEE2E2", data: [4, 6, 5, 8, 6, 7, 5] },
  { id: "escalated", label: "Escalated Items", value: "27", trend: "↑ 8% vs Jun 2026", trendPositive: false, color: "#F59E0B", bg: "#FEF3C7", data: [5, 4, 6, 7, 6, 8, 9] },
  { id: "sla", label: "SLA Breaches", value: "14", trend: "↑ 5% vs Jun 2026", trendPositive: false, color: "#8B5CF6", bg: "#F3E8FF", data: [3, 4, 3, 5, 4, 6, 5] },
  { id: "resolved", label: "Auto-Resolved", value: "46", trend: "↑ 15% vs Jun 2026", trendPositive: true, color: "#10B981", bg: "#D1FAE5", data: [6, 7, 8, 7, 9, 10, 12] },
]

export const alertRules = ["All Alert Rules", "KPI Below Threshold", "Missed Update", "SLA Breach", "Failed Integration", "Overdue Action", "Data Anomaly", "Workflow Delay"]
export const alertSeverities: AlertSeverity[] = ["Critical", "High", "Medium", "Low"]
export const alertStatuses: AlertStatus[] = ["Open", "Escalated", "Investigating", "Resolved", "Auto-Resolved"]

export const alertRows: AlertRow[] = [
  {
    id: "AL-001",
    title: "KPI below threshold",
    subtitle: "Actual 6.2% below target 10%",
    dotTone: "danger",
    source: "Revenue Growth",
    sourceMeta: "KPI-001",
    sourceDept: "Finance Department",
    severity: "Critical",
    ownerInitials: "TN",
    ownerName: "Tendai Nyathi",
    ownerRole: "Finance Manager",
    ownerSrc: "https://randomuser.me/api/portraits/men/75.jpg",
    escalationLevel: 2,
    elapsed: "2h 45m",
    elapsedUrgent: true,
    status: "Open",
    ruleName: "KPI Below Threshold",
  },
  {
    id: "AL-002",
    title: "Missed update",
    subtitle: "No update for 10+ days",
    dotTone: "warning",
    source: "Customer Satisfaction",
    sourceMeta: "KPI-023",
    sourceDept: "Operations Department",
    severity: "High",
    ownerInitials: "RN",
    ownerName: "Rumbidzai Nyathi",
    ownerRole: "Operations Manager",
    ownerSrc: "https://randomuser.me/api/portraits/women/33.jpg",
    escalationLevel: 1,
    elapsed: "1d 6h",
    elapsedUrgent: true,
    status: "Escalated",
    ruleName: "Missed Update",
  },
  {
    id: "AL-003",
    title: "SLA breach",
    subtitle: "SLA exceeded by 2 days",
    dotTone: "danger",
    source: "Financial Close",
    sourceMeta: "KPI-009",
    sourceDept: "Finance Department",
    severity: "Critical",
    ownerInitials: "TC",
    ownerName: "Tatenda Chivaura",
    ownerRole: "Finance Lead",
    ownerSrc: "https://randomuser.me/api/portraits/women/65.jpg",
    escalationLevel: 3,
    elapsed: "2d 3h",
    elapsedUrgent: true,
    status: "Open",
    ruleName: "SLA Breach",
  },
  {
    id: "AL-004",
    title: "Failed integration",
    subtitle: "Last sync failed on 13 Jul 2026",
    dotTone: "warning",
    source: "SAP ERP Sync",
    sourceMeta: "INT-SAP",
    sourceDept: "IT Department",
    severity: "Medium",
    ownerInitials: "KS",
    ownerName: "Kudakwashe Sibanda",
    ownerRole: "IT Manager",
    ownerSrc: "https://randomuser.me/api/portraits/men/52.jpg",
    escalationLevel: 1,
    elapsed: "8h 12m",
    elapsedUrgent: false,
    status: "Investigating",
    ruleName: "Failed Integration",
  },
  {
    id: "AL-005",
    title: "Overdue action",
    subtitle: "Action overdue by 2 days",
    dotTone: "warning",
    source: "Approve Q2 Report",
    sourceMeta: "ACT-044",
    sourceDept: "Operations Department",
    severity: "High",
    ownerInitials: "KC",
    ownerName: "Kundai Chikore",
    ownerRole: "Operations Director",
    ownerSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    escalationLevel: 2,
    elapsed: "2d 5h",
    elapsedUrgent: true,
    status: "Escalated",
    ruleName: "Overdue Action",
  },
  {
    id: "AL-006",
    title: "KPI below threshold",
    subtitle: "Actual 15% vs target 20%",
    dotTone: "warning",
    source: "Cost Optimization",
    sourceMeta: "KPI-015",
    sourceDept: "Finance Department",
    severity: "Medium",
    ownerInitials: "TM",
    ownerName: "Tinashe Manyo",
    ownerRole: "Finance Analyst",
    ownerSrc: "https://randomuser.me/api/portraits/men/11.jpg",
    escalationLevel: 1,
    elapsed: "5h 32m",
    elapsedUrgent: false,
    status: "Open",
    ruleName: "KPI Below Threshold",
  },
  {
    id: "AL-007",
    title: "Missed update",
    subtitle: "No update for 7+ days",
    dotTone: "warning",
    source: "Employee Engagement",
    sourceMeta: "KPI-031",
    sourceDept: "HR Department",
    severity: "Medium",
    ownerInitials: "NB",
    ownerName: "Nyasha Bhebhe",
    ownerRole: "HR Manager",
    ownerSrc: "https://randomuser.me/api/portraits/women/68.jpg",
    escalationLevel: 1,
    elapsed: "1d 1h",
    elapsedUrgent: false,
    status: "Open",
    ruleName: "Missed Update",
  },
  {
    id: "AL-008",
    title: "Data anomaly detected",
    subtitle: "Unusual variance detected in data",
    dotTone: "success",
    source: "Inventory Turnover",
    sourceMeta: "KPI-012",
    sourceDept: "Operations Department",
    severity: "Low",
    ownerInitials: "RZ",
    ownerName: "Reginald Zulu",
    ownerRole: "Operations Analyst",
    ownerSrc: "https://randomuser.me/api/portraits/men/45.jpg",
    escalationLevel: 0,
    elapsed: "2h 10m",
    elapsedUrgent: false,
    status: "Resolved",
    ruleName: "Data Anomaly",
  },
  {
    id: "AL-009",
    title: "Workflow delay",
    subtitle: "Pending for more than 3 days",
    dotTone: "warning",
    source: "Budget Approval",
    sourceMeta: "WF-012",
    sourceDept: "Finance Department",
    severity: "Medium",
    ownerInitials: "FM",
    ownerName: "Farai Muchengeti",
    ownerRole: "CFO",
    ownerSrc: "https://randomuser.me/api/portraits/men/52.jpg",
    escalationLevel: 3,
    elapsed: "3d 4h",
    elapsedUrgent: true,
    status: "Escalated",
    ruleName: "Workflow Delay",
  },
  {
    id: "AL-010",
    title: "Auto-resolved: threshold restored",
    subtitle: "Revenue Growth is now above target",
    dotTone: "success",
    source: "Revenue Growth",
    sourceMeta: "KPI-001",
    sourceDept: "Finance Department",
    severity: "Low",
    ownerInitials: "TN",
    ownerName: "Tendai Nyathi",
    ownerRole: "Finance Manager",
    ownerSrc: "https://randomuser.me/api/portraits/men/75.jpg",
    escalationLevel: 0,
    elapsed: "—",
    elapsedUrgent: false,
    status: "Auto-Resolved",
    ruleName: "KPI Below Threshold",
  },
]

export const alertRuleLogic: Record<string, {
  description: string
  conditions: string[]
  escalation: { level: string; who: string; after: string }[]
  actions: string[]
}> = {
  "KPI Below Threshold": {
    description: "Triggers an alert when a KPI's actual value falls below the defined threshold.",
    conditions: ["KPI Status is On Track or At Risk", "Actual Value < Threshold", "For more than 1 update cycle", "Applies to: All KPI Types"],
    escalation: [
      { level: "Level 1", who: "KPI Owner", after: "After 24 hours" },
      { level: "Level 2", who: "Department Manager", after: "After 48 hours" },
      { level: "Level 3", who: "Executive Sponsor", after: "After 72 hours" },
    ],
    actions: ["Create Alert", "Send Notifications", "Track Until Resolved"],
  },
  "Missed Update": {
    description: "Triggers an alert when a KPI has not received a data update within its expected cadence.",
    conditions: ["No data update within cadence window", "For more than 7 days", "Applies to: Manually updated KPIs"],
    escalation: [
      { level: "Level 1", who: "KPI Owner", after: "After 7 days" },
      { level: "Level 2", who: "Department Manager", after: "After 10 days" },
    ],
    actions: ["Create Alert", "Send Reminder", "Escalate If Unresolved"],
  },
  "SLA Breach": {
    description: "Triggers when a workflow or process step exceeds its committed SLA window.",
    conditions: ["Step duration > SLA target", "Applies to: Financial Close, Approvals"],
    escalation: [
      { level: "Level 1", who: "Process Owner", after: "Immediately" },
      { level: "Level 2", who: "Department Manager", after: "After 24 hours" },
      { level: "Level 3", who: "Executive Sponsor", after: "After 48 hours" },
    ],
    actions: ["Create Alert", "Send Notifications", "Log SLA Breach"],
  },
  "Failed Integration": {
    description: "Triggers when a scheduled data sync from a source system fails.",
    conditions: ["Sync job status = Failed", "Applies to: All integrated source systems"],
    escalation: [{ level: "Level 1", who: "Integration Owner", after: "Immediately" }],
    actions: ["Create Alert", "Retry Sync", "Notify IT"],
  },
  "Overdue Action": {
    description: "Triggers when an assigned approval or corrective action passes its due date.",
    conditions: ["Due date < today", "Status != Completed"],
    escalation: [
      { level: "Level 1", who: "Assignee", after: "On due date" },
      { level: "Level 2", who: "Department Manager", after: "After 2 days" },
    ],
    actions: ["Create Alert", "Send Reminder", "Escalate"],
  },
  "Data Anomaly": {
    description: "Triggers when statistical variance in a KPI's underlying data exceeds expected bounds.",
    conditions: ["Variance > 2 standard deviations", "Applies to: Automated data feeds"],
    escalation: [{ level: "Level 1", who: "Data Owner", after: "Immediately" }],
    actions: ["Create Alert", "Flag for Review"],
  },
  "Workflow Delay": {
    description: "Triggers when an approval workflow step remains pending beyond its expected duration.",
    conditions: ["Pending > 3 days", "Applies to: Multi-level approval workflows"],
    escalation: [
      { level: "Level 1", who: "Approver", after: "After 3 days" },
      { level: "Level 2", who: "Next Level Approver", after: "After 5 days" },
      { level: "Level 3", who: "Executive Sponsor", after: "After 7 days" },
    ],
    actions: ["Create Alert", "Escalate to Next Approver"],
  },
}

export const notificationChannels = [
  { id: "email", label: "Email", detail: "All recipients", icon: "Mail", enabled: true },
  { id: "inapp", label: "In-App", detail: "System notification", icon: "Bell", enabled: true },
  { id: "whatsapp", label: "WhatsApp", detail: "+263 78 123 4567", icon: "MessageCircle", enabled: true },
]
