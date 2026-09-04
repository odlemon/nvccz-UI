/** Performance V22 page id → Next path */
export const PM22_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/performance',
  'strategy': '/performance/strategy',
  'themes': '/performance/themes',
  'risks': '/performance/risks',
  'scorecards': '/performance/scorecards',
  'objectives': '/performance/objectives',
  'tasks': '/performance/tasks',
  'contracts': '/performance/contracts',
  'reviews': '/performance/reviews',
  'corrective': '/performance/corrective',
  'reports': '/performance/reports',
  'vault': '/performance/vault',
  'alerts': '/performance/alerts',
  'access': '/performance/access',
  'departments': '/performance/departments',
  'integrations': '/performance/integrations',
  'kpiAnalytics': '/performance/kpi-analytics',
  'kpiManagement': '/performance/kpi-management',
  'bscPillars': '/performance/bsc-pillars',
  'performanceReports': '/performance/performance-reports',
  'adHocReports': '/performance/ad-hoc-reports',
  'scheduledReports': '/performance/scheduled-reports',
  'reportHistory': '/performance/report-history',
  'settings': '/performance/settings',
  'timesheets': '/performance/timesheets',
}

export const PM22_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PM22_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPm22Page(pathname: string): string {
  if (pathname in PM22_PATH_TO_PAGE) return PM22_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/performance/')) {
    const seg = pathname.replace('/performance/', '').split('/')[0]
    if (seg === 'kpi-analytics') return 'kpiAnalytics'
    const directMatch = Object.entries(PM22_PAGE_TO_PATH).find(([, path]) => path === `/performance/${seg}`)
    if (directMatch) return directMatch[0]
  }
  return 'dashboard'
}

export const PM22_NAV_PAGES = [
  { id: 'pm22-dashboard', page: 'dashboard', path: '/performance', name: 'Command Centre' },
  { id: 'pm22-strategy', page: 'strategy', path: '/performance/strategy', name: 'Company Strategy' },
  { id: 'pm22-themes', page: 'themes', path: '/performance/themes', name: 'Strategic Themes' },
  { id: 'pm22-risks', page: 'risks', path: '/performance/risks', name: 'Risks & Assumptions' },
  { id: 'pm22-scorecards', page: 'scorecards', path: '/performance/scorecards', name: 'Scorecards' },
  { id: 'pm22-objectives', page: 'objectives', path: '/performance/objectives', name: 'Objectives & KPIs' },
  { id: 'pm22-tasks', page: 'tasks', path: '/performance/tasks', name: 'Tasks & Projects' },
  { id: 'pm22-contracts', page: 'contracts', path: '/performance/contracts', name: 'Performance Contracts' },
  { id: 'pm22-reviews', page: 'reviews', path: '/performance/reviews', name: 'Performance Reviews' },
  { id: 'pm22-corrective', page: 'corrective', path: '/performance/corrective', name: 'Corrective Actions' },
  { id: 'pm22-reports', page: 'reports', path: '/performance/reports', name: 'Reports & Compliance' },
  { id: 'pm22-vault', page: 'vault', path: '/performance/vault', name: 'Document Vault' },
  { id: 'pm22-alerts', page: 'alerts', path: '/performance/alerts', name: 'Alerts & Audit' },
  { id: 'pm22-access', page: 'access', path: '/performance/access', name: 'Access & Settings' },
  { id: 'pm22-departments', page: 'departments', path: '/performance/departments', name: 'Departments' },
  { id: 'pm22-integrations', page: 'integrations', path: '/performance/integrations', name: 'Integrations' },
  { id: 'pm22-kpiAnalytics', page: 'kpiAnalytics', path: '/performance/kpi-analytics', name: 'KPI Analytics' },
  { id: 'pm22-kpiManagement', page: 'kpiManagement', path: '/performance/kpi-management', name: 'KPI Management' },
  { id: 'pm22-bscPillars', page: 'bscPillars', path: '/performance/bsc-pillars', name: 'BSC Pillars' },
  { id: 'pm22-performanceReports', page: 'performanceReports', path: '/performance/performance-reports', name: 'Performance Reports' },
  { id: 'pm22-adHocReports', page: 'adHocReports', path: '/performance/ad-hoc-reports', name: 'Ad-hoc Reports' },
  { id: 'pm22-scheduledReports', page: 'scheduledReports', path: '/performance/scheduled-reports', name: 'Scheduled Reports' },
  { id: 'pm22-reportHistory', page: 'reportHistory', path: '/performance/report-history', name: 'Report History' },
  { id: 'pm22-settings', page: 'settings', path: '/performance/settings', name: 'Settings' },
  { id: 'pm22-timesheets', page: 'timesheets', path: '/performance/timesheets', name: 'Timesheets' },
] as const
