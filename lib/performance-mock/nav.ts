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
  /** Default landing when group row is clicked while collapsed */
  href?: string
}

/**
 * Flat primary nav from client follow-up shell (Dashboard inspo).
 * Reports + Configuration stay expandable for nested tools.
 */
export const PM_NAV_ITEMS: PmNavItem[] = [
  { id: "performance-dashboard", label: "Dashboard", href: "/performance", icon: "LayoutGrid" },
  { id: "config-strategy", label: "Company Strategy", href: "/performance/configuration/strategy", icon: "FileText" },
  { id: "config-themes", label: "Themes", href: "/performance/configuration/themes", icon: "Layers" },
  { id: "performance-contracts", label: "Performance Contracts", href: "/performance/contracts", icon: "Medal" },
  { id: "goals-management", label: "Goals", href: "/performance/goals", icon: "Target" },
  { id: "tasks-management", label: "Tasks & Projects", href: "/performance/tasks", icon: "ClipboardList" },
  { id: "timesheets", label: "Timesheets", href: "/performance/timesheets", icon: "Clock" },
  { id: "performance-reviews", label: "Reviews", href: "/performance/reviews", icon: "ClipboardCheck" },
  { id: "org-bsc", label: "Scorecards", href: "/performance/org-bsc", icon: "BarChart3" },
]

export const PM_NAV_GROUPS: PmNavGroup[] = [
  {
    id: "perf-reports",
    title: "Reports",
    icon: "FileBarChart",
    href: "/performance/reports",
    items: [
      { id: "performance-reports", label: "Performance Reports", href: "/performance/reports", icon: "FileText" },
      { id: "adhoc-reports", label: "Ad-hoc Reports", href: "/performance/reports?view=adhoc", icon: "Clock" },
      { id: "scheduled-reports", label: "Scheduled Reports", href: "/performance/reports?view=scheduled", icon: "Calendar" },
      { id: "report-history", label: "Report History", href: "/performance/reports?view=history", icon: "History" },
    ],
  },
  {
    id: "perf-configuration",
    title: "Configuration",
    icon: "Settings",
    href: "/performance/settings",
    items: [
      { id: "kpi-analytics", label: "KPI Analytics", href: "/performance/kpi-analytics", icon: "PieChart" },
      { id: "kpi-management", label: "KPI Management", href: "/performance/kpis", icon: "LineChart" },
      { id: "corrective-actions", label: "Corrective Actions", href: "/performance/corrective-actions", icon: "AlertTriangle" },
      { id: "departments-management", label: "Departments", href: "/performance/departments", icon: "Building" },
      { id: "config-pillars", label: "BSC Pillars", href: "/performance/configuration/pillars", icon: "Columns3" },
      { id: "integrations", label: "Integrations", href: "/performance/configuration/integrations", icon: "Network" },
      { id: "settings", label: "Settings", href: "/performance/settings", icon: "SlidersHorizontal" },
    ],
  },
]

/** Scorecard deep-links still available from Org BSC / in-app nav */
export const PM_SCORECARD_LINKS: PmNavItem[] = [
  { id: "org-bsc", label: "Org BSC", href: "/performance/org-bsc", icon: "LayoutDashboard" },
  { id: "department-scorecards", label: "Department", href: "/performance/department-scorecards", icon: "Building2" },
  { id: "board-scorecards", label: "Board", href: "/performance/board-scorecards", icon: "Users" },
  { id: "ceo-scorecards", label: "CEO", href: "/performance/ceo-scorecards", icon: "Trophy" },
  { id: "user-scorecards", label: "Employee", href: "/performance/user-scorecards", icon: "User" },
]
