/** Performance V22 page id → Next path */
export const PM22_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/performance-v22',
  'strategy': '/performance-v22/strategy',
  'themes': '/performance-v22/themes',
  'risks': '/performance-v22/risks',
  'scorecards': '/performance-v22/scorecards',
  'objectives': '/performance-v22/objectives',
  'tasks': '/performance-v22/tasks',
  'contracts': '/performance-v22/contracts',
  'reviews': '/performance-v22/reviews',
  'corrective': '/performance-v22/corrective',
  'reports': '/performance-v22/reports',
  'vault': '/performance-v22/vault',
  'alerts': '/performance-v22/alerts',
  'access': '/performance-v22/access',
  'departments': '/performance-v22/departments',
  'integrations': '/performance-v22/integrations',
  'kpiAnalytics': '/performance-v22/kpi-analytics',
  'kpiManagement': '/performance-v22/kpi-management',
  'bscPillars': '/performance-v22/bsc-pillars',
  'performanceReports': '/performance-v22/performance-reports',
  'adHocReports': '/performance-v22/ad-hoc-reports',
  'scheduledReports': '/performance-v22/scheduled-reports',
  'reportHistory': '/performance-v22/report-history',
  'settings': '/performance-v22/settings',
  'timesheets': '/performance-v22/timesheets',
}

export const PM22_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PM22_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPm22Page(pathname: string): string {
  if (pathname in PM22_PATH_TO_PAGE) return PM22_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/performance-v22/')) {
    const seg = pathname.replace('/performance-v22/', '').split('/')[0]
    if (seg === 'kpi-analytics') return 'kpiAnalytics'
    const directMatch = Object.entries(PM22_PAGE_TO_PATH).find(([, path]) => path === `/performance-v22/${seg}`)
    if (directMatch) return directMatch[0]
  }
  return 'dashboard'
}

export const PM22_NAV_PAGES = [
  { id: 'pm22-dashboard', page: 'dashboard', path: '/performance-v22', name: 'Command Centre' },
  { id: 'pm22-strategy', page: 'strategy', path: '/performance-v22/strategy', name: 'Company Strategy' },
  { id: 'pm22-themes', page: 'themes', path: '/performance-v22/themes', name: 'Strategic Themes' },
  { id: 'pm22-risks', page: 'risks', path: '/performance-v22/risks', name: 'Risks & Assumptions' },
  { id: 'pm22-scorecards', page: 'scorecards', path: '/performance-v22/scorecards', name: 'Scorecards' },
  { id: 'pm22-objectives', page: 'objectives', path: '/performance-v22/objectives', name: 'Objectives & KPIs' },
  { id: 'pm22-tasks', page: 'tasks', path: '/performance-v22/tasks', name: 'Tasks & Projects' },
  { id: 'pm22-contracts', page: 'contracts', path: '/performance-v22/contracts', name: 'Performance Contracts' },
  { id: 'pm22-reviews', page: 'reviews', path: '/performance-v22/reviews', name: 'Performance Reviews' },
  { id: 'pm22-corrective', page: 'corrective', path: '/performance-v22/corrective', name: 'Corrective Actions' },
  { id: 'pm22-reports', page: 'reports', path: '/performance-v22/reports', name: 'Reports & Compliance' },
  { id: 'pm22-vault', page: 'vault', path: '/performance-v22/vault', name: 'Document Vault' },
  { id: 'pm22-alerts', page: 'alerts', path: '/performance-v22/alerts', name: 'Alerts & Audit' },
  { id: 'pm22-access', page: 'access', path: '/performance-v22/access', name: 'Access & Settings' },
  { id: 'pm22-departments', page: 'departments', path: '/performance-v22/departments', name: 'Departments' },
  { id: 'pm22-integrations', page: 'integrations', path: '/performance-v22/integrations', name: 'Integrations' },
  { id: 'pm22-kpiAnalytics', page: 'kpiAnalytics', path: '/performance-v22/kpi-analytics', name: 'KPI Analytics' },
  { id: 'pm22-kpiManagement', page: 'kpiManagement', path: '/performance-v22/kpi-management', name: 'KPI Management' },
  { id: 'pm22-bscPillars', page: 'bscPillars', path: '/performance-v22/bsc-pillars', name: 'BSC Pillars' },
  { id: 'pm22-performanceReports', page: 'performanceReports', path: '/performance-v22/performance-reports', name: 'Performance Reports' },
  { id: 'pm22-adHocReports', page: 'adHocReports', path: '/performance-v22/ad-hoc-reports', name: 'Ad-hoc Reports' },
  { id: 'pm22-scheduledReports', page: 'scheduledReports', path: '/performance-v22/scheduled-reports', name: 'Scheduled Reports' },
  { id: 'pm22-reportHistory', page: 'reportHistory', path: '/performance-v22/report-history', name: 'Report History' },
  { id: 'pm22-settings', page: 'settings', path: '/performance-v22/settings', name: 'Settings' },
  { id: 'pm22-timesheets', page: 'timesheets', path: '/performance-v22/timesheets', name: 'Timesheets' },
] as const
