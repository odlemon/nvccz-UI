/** Performance V22 page id → Next path */
export const PM22_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/performance-v22',
  'strategy': '/performance-v22/strategy',
  'scorecards': '/performance-v22/scorecards',
  'objectives': '/performance-v22/objectives',
  'tasks': '/performance-v22/tasks',
  'reviews': '/performance-v22/reviews',
  'corrective': '/performance-v22/corrective',
  'reports': '/performance-v22/reports',
  'performanceReports': '/performance-v22/reports',
  'vault': '/performance-v22/vault',
  'alerts': '/performance-v22/alerts',
  'access': '/performance-v22/access',
  'departments': '/performance-v22/departments',
  'integrations': '/performance-v22/integrations',
  'kpiAnalytics': '/performance-v22/kpi-analytics',
  'timesheets': '/performance-v22/timesheets',
  'settings': '/performance-v22/access',
  'contracts': '/performance-v22/reviews',
}

export const PM22_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PM22_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPm22Page(pathname: string): string {
  if (pathname === '/performance-v22' || pathname === '/performance-v22/') return 'dashboard'
  if (pathname.startsWith('/performance-v22/')) {
    const seg = pathname.replace('/performance-v22/', '').split('/')[0]
    // Prefer route segment over reversed alias collisions (reports/access/reviews).
    if (seg === 'kpi-analytics') return 'kpiAnalytics'
    if (seg === 'reports') return 'reports'
    if (seg === 'access') return 'access'
    if (seg === 'reviews') return 'reviews'
    if (seg && PM22_PAGE_TO_PATH[seg]) return seg
  }
  return PM22_PATH_TO_PAGE[pathname] || 'dashboard'
}

export const PM22_NAV_PAGES = [
  { id: 'pm22-dashboard', page: 'dashboard', path: '/performance-v22', name: 'Command Centre' },
  { id: 'pm22-strategy', page: 'strategy', path: '/performance-v22/strategy', name: 'Company Strategy' },
  { id: 'pm22-scorecards', page: 'scorecards', path: '/performance-v22/scorecards', name: 'Scorecards' },
  { id: 'pm22-objectives', page: 'objectives', path: '/performance-v22/objectives', name: 'Objectives & KPIs' },
  { id: 'pm22-tasks', page: 'tasks', path: '/performance-v22/tasks', name: 'Tasks & Projects' },
  { id: 'pm22-reviews', page: 'reviews', path: '/performance-v22/reviews', name: 'Performance Reviews' },
  { id: 'pm22-corrective', page: 'corrective', path: '/performance-v22/corrective', name: 'Corrective Actions' },
  { id: 'pm22-reports', page: 'reports', path: '/performance-v22/reports', name: 'Reports & Compliance' },
  { id: 'pm22-vault', page: 'vault', path: '/performance-v22/vault', name: 'Document Vault' },
  { id: 'pm22-alerts', page: 'alerts', path: '/performance-v22/alerts', name: 'Alerts & Audit' },
  { id: 'pm22-access', page: 'access', path: '/performance-v22/access', name: 'Access & Settings' },
  { id: 'pm22-departments', page: 'departments', path: '/performance-v22/departments', name: 'Departments' },
  { id: 'pm22-integrations', page: 'integrations', path: '/performance-v22/integrations', name: 'Integrations' },
  { id: 'pm22-kpiAnalytics', page: 'kpiAnalytics', path: '/performance-v22/kpi-analytics', name: 'KPI Analytics' },
  { id: 'pm22-timesheets', page: 'timesheets', path: '/performance-v22/timesheets', name: 'Timesheets' },
] as const
