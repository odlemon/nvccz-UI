export type RatingScale = { id: string; name: string; min: string; max: string; type: string; status: "Active" | "Inactive" }
export type ApprovalRule = { id: string; name: string; condition: string; level: string; status: "Active" | "Inactive" }
export type PermissionRow = { role: string; view: boolean; edit: boolean; approve: boolean; admin: boolean }
export type AuditEntry = {
  id: string
  name: string
  role: string
  initials: string
  color: string
  photo?: string
  action: string
  detail?: string
  at: string
}

export const generalSettingsDefaults = {
  organizationName: "Arcus Group (Pvt) Ltd",
  defaultLanguage: "English (Zimbabwe)",
  defaultTimezone: "(UTC+02:00) Harare, Pretoria",
  dateFormat: "DD MM YYYY (13 Jul 2026)",
  weekStartsOn: "Monday",
  enableObjectivesCascade: true,
}

export const workflowSettingsDefaults = {
  performanceCycle: "Annual Performance Cycle",
  kpiApprovalWorkflow: "2-Level Approval",
  defaultReviewType: "Annual Review",
  reviewApprovalWorkflow: "3-Level Approval",
  allowSelfAppraisal: true,
  lockReviewedKpis: true,
}

export const notificationPreferencesDefaults = [
  { id: "reviewReminders", label: "Review Reminders", detail: "Remind users of upcoming reviews", cadence: "Weekly", enabled: true },
  { id: "approvalAlerts", label: "Approval Alerts", detail: "Notify approvers of pending approvals", cadence: "Instant", enabled: true },
  { id: "kpiThresholdAlerts", label: "KPI Threshold Alerts", detail: "Alert when a KPI is at risk or off track", cadence: "Instant", enabled: true },
  { id: "systemAnnouncements", label: "System Announcements", detail: "Product updates and announcements", cadence: "Weekly", enabled: false },
  { id: "weeklySummaries", label: "Weekly Summaries", detail: "Summary of tasks and KPIs", cadence: "Weekly", enabled: true },
]

export const ratingScalesDefaults: RatingScale[] = [
  { id: "rs-1", name: "5 Point Scale", min: "1", max: "5", type: "Numeric", status: "Active" },
  { id: "rs-2", name: "7 Point Scale", min: "1", max: "7", type: "Numeric", status: "Active" },
  { id: "rs-3", name: "Percentage Scale", min: "0%", max: "100%", type: "Percentage", status: "Active" },
  { id: "rs-4", name: "Grade Scale (A–E)", min: "A", max: "E", type: "Alphabetic", status: "Active" },
]

export const permissionsDefaults: PermissionRow[] = [
  { role: "Super Administrator", view: true, edit: true, approve: true, admin: true },
  { role: "HR Manager", view: true, edit: true, approve: true, admin: false },
  { role: "Department Manager", view: true, edit: true, approve: true, admin: false },
  { role: "Team Lead", view: true, edit: true, approve: false, admin: false },
  { role: "Employee", view: true, edit: false, approve: false, admin: false },
]

export const brandingDefaults = {
  logoFile: "arcus-logo.png",
  faviconFile: "arcus-favicon.ico",
  primaryColor: "#7C3AED",
  secondaryColor: "#A855F7",
  accentColor: "#F97316",
}

export const financialYearDefaults = {
  fyStart: "01 January",
  fyEnd: "31 December",
  reviewStartWindow: "01 November",
  reviewEndWindow: "31 January",
  calibrationMeetingStart: "01 February",
  resultsPublishStart: "15 February",
}

export const approvalRulesDefaults: ApprovalRule[] = [
  { id: "ar-1", name: "Budget > $250K", condition: "Budget Utilization > 70% AND Amount > $250,000", level: "2-Level Approval", status: "Active" },
  { id: "ar-2", name: "KPI Off Track", condition: "On Track Status = Off Track", level: "2-Level Approval", status: "Active" },
  { id: "ar-3", name: "Strategic Initiative", condition: "KPI Category = Strategic", level: "3-Level Approval", status: "Active" },
  { id: "ar-4", name: "All Others", condition: "All other conditions", level: "1-Level Approval", status: "Active" },
]

export const auditTrailDefaults: AuditEntry[] = [
  {
    id: "aud-1",
    name: "Tendai Nyathi",
    role: "Super Administrator",
    initials: "TN",
    color: "#7C3AED",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
    action: "Updated Workflow Settings",
    detail: "Changed KPI Approval Workflow to 2-Level Approval",
    at: "Today, 09:01 AM",
  },
  {
    id: "aud-2",
    name: "Rumbidzai Nyathi",
    role: "HR Business Partner",
    initials: "RN",
    color: "#2563EB",
    photo: "https://randomuser.me/api/portraits/women/33.jpg",
    action: "Updated Rating Scale",
    detail: "Added 7 Point Scale",
    at: "Today, 08:47 AM",
  },
  {
    id: "aud-3",
    name: "Farai Muchengeti",
    role: "Finance Manager",
    initials: "FM",
    color: "#0D9488",
    photo: "https://randomuser.me/api/portraits/men/52.jpg",
    action: "Updated Notification Preferences",
    detail: "Enabled weekly summaries",
    at: "Today, 08:20 AM",
  },
  {
    id: "aud-4",
    name: "Kudzai Chikore",
    role: "Operations Manager",
    initials: "KC",
    color: "#F97316",
    photo: "https://randomuser.me/api/portraits/men/36.jpg",
    action: "Updated Approval Rules",
    detail: "Added rule: Budget > $250K",
    at: "Yesterday, 04:12 PM",
  },
  {
    id: "aud-5",
    name: "Tatenda Chivaura",
    role: "Finance Lead",
    initials: "TC",
    color: "#DB2777",
    photo: "https://randomuser.me/api/portraits/women/47.jpg",
    action: "Updated Permissions",
    detail: "Modified manager permissions",
    at: "Yesterday, 02:35 PM",
  },
  {
    id: "aud-6",
    name: "Memory Sibanda",
    role: "HR Manager",
    initials: "MS",
    color: "#DB2777",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
    action: "Updated Review Calendar",
    detail: "Set review start date to 01 November",
    at: "Yesterday, 12:08 PM",
  },
  {
    id: "aud-7",
    name: "Kudzanai Ncube",
    role: "IT Lead",
    initials: "KN",
    color: "#0284C7",
    photo: "https://randomuser.me/api/portraits/men/22.jpg",
    action: "Updated Branding Settings",
    detail: "Updated logo and primary color",
    at: "11 Jul 2026, 03:22 PM",
  },
]
