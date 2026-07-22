export type PmNavItem = {
  id: string
  label: string
  href: string
  icon: string
}

export type PmNavGroup = {
  id: string
  title: string
  icon: string
  items: PmNavItem[]
}

/** White-shell nav aligned to PDF pages 4–13 + plan routes. */
export const PM_NAV_ITEMS: PmNavItem[] = [
  { id: "performance-dashboard", label: "Dashboard", href: "/performance", icon: "LayoutGrid" },
  { id: "config-strategy", label: "Company Strategy", href: "/performance/configuration/strategy", icon: "FileText" },
  { id: "config-themes", label: "Themes", href: "/performance/configuration/themes", icon: "Layers" },
  { id: "performance-contracts", label: "Performance Contracts", href: "/performance/contracts", icon: "Medal" },
  { id: "goals-management", label: "Goals", href: "/performance/goals", icon: "Target" },
  { id: "tasks-management", label: "Tasks", href: "/performance/tasks", icon: "ClipboardList" },
  { id: "performance-reviews", label: "Reviews", href: "/performance/reviews", icon: "ClipboardCheck" },
]

export const PM_NAV_GROUPS: PmNavGroup[] = [
  {
    id: "scorecards",
    title: "Scorecards",
    icon: "BarChart3",
    items: [
      { id: "org-bsc", label: "Org BSC", href: "/performance/org-bsc", icon: "LayoutDashboard" },
      { id: "department-scorecards", label: "Department Scorecards", href: "/performance/department-scorecards", icon: "Building2" },
      { id: "board-scorecards", label: "Board Scorecards", href: "/performance/board-scorecards", icon: "Users" },
      { id: "ceo-scorecards", label: "CEO Scorecards", href: "/performance/ceo-scorecards", icon: "Trophy" },
      { id: "user-scorecards", label: "Employee Scorecards", href: "/performance/user-scorecards", icon: "User" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: "Activity",
    items: [
      { id: "corrective-actions", label: "Corrective Actions", href: "/performance/corrective-actions", icon: "AlertTriangle" },
      { id: "alerts", label: "Alerts & Escalations", href: "/performance/alerts", icon: "Bell" },
      { id: "timesheets", label: "Timesheets", href: "/performance/timesheets", icon: "Clock" },
      { id: "check-ins", label: "Check-ins", href: "/performance/check-ins", icon: "MessageSquare" },
      { id: "calibration", label: "Calibration", href: "/performance/calibration", icon: "Scale" },
      { id: "reports", label: "Reports", href: "/performance/reports", icon: "FileBarChart" },
    ],
  },
  {
    id: "perf-configuration",
    title: "Configuration",
    icon: "Settings",
    items: [
      { id: "kpi-analytics", label: "KPI Analytics", href: "/performance/kpi-analytics", icon: "PieChart" },
      { id: "kpi-management", label: "KPI Management", href: "/performance/kpis", icon: "LineChart" },
      { id: "bsc-entry", label: "BSC Entry", href: "/performance/tasks?tab=bsc-entry", icon: "Coins" },
      { id: "workflow-history", label: "Workflow History", href: "/performance/tasks?tab=workflow", icon: "GitBranch" },
      { id: "departments-management", label: "Departments", href: "/performance/departments", icon: "Building" },
      { id: "config-pillars", label: "BSC Pillars", href: "/performance/configuration/pillars", icon: "Columns3" },
      { id: "integrations", label: "Integration Mapping", href: "/performance/configuration/integrations", icon: "Network" },
      { id: "settings", label: "Settings", href: "/performance/settings", icon: "SlidersHorizontal" },
    ],
  },
]
