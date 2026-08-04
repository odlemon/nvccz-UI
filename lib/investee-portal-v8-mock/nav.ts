/** Investee Portal V8 page id → Next path */
export const IP8_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/investee-portal-v8',
  'kpis': '/investee-portal-v8/kpis',
  'reports': '/investee-portal-v8/reports',
  'forecasts': '/investee-portal-v8/forecasts',
  'terms': '/investee-portal-v8/terms',
  'cap-table': '/investee-portal-v8/cap-table',
  'governance': '/investee-portal-v8/governance',
  'signatures': '/investee-portal-v8/signatures',
  'requests': '/investee-portal-v8/requests',
  'data-room': '/investee-portal-v8/data-room',
  'messages': '/investee-portal-v8/messages',
  'team': '/investee-portal-v8/team',
  'settings': '/investee-portal-v8/settings',
}

export const IP8_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(IP8_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToIp8Page(pathname: string): string {
  if (pathname in IP8_PATH_TO_PAGE) return IP8_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/investee-portal-v8/')) {
    const seg = pathname.replace('/investee-portal-v8/', '').split('/')[0]
    if (seg && IP8_PAGE_TO_PATH[seg]) return seg
  }
  return 'dashboard'
}

export const IP8_NAV_PAGES = [
  { id: 'ip8-dashboard', page: 'dashboard', path: '/investee-portal-v8', name: 'Overview' },
  { id: 'ip8-kpis', page: 'kpis', path: '/investee-portal-v8/kpis', name: 'KPI Centre' },
  { id: 'ip8-reports', page: 'reports', path: '/investee-portal-v8/reports', name: 'Reporting Centre' },
  { id: 'ip8-forecasts', page: 'forecasts', path: '/investee-portal-v8/forecasts', name: 'Forecast Model' },
  { id: 'ip8-terms', page: 'terms', path: '/investee-portal-v8/terms', name: 'Term Sheet' },
  { id: 'ip8-cap-table', page: 'cap-table', path: '/investee-portal-v8/cap-table', name: 'Cap Table' },
  { id: 'ip8-governance', page: 'governance', path: '/investee-portal-v8/governance', name: 'Governance' },
  { id: 'ip8-signatures', page: 'signatures', path: '/investee-portal-v8/signatures', name: 'Signatures' },
  { id: 'ip8-requests', page: 'requests', path: '/investee-portal-v8/requests', name: 'Capital & Procurement' },
  { id: 'ip8-data-room', page: 'data-room', path: '/investee-portal-v8/data-room', name: 'Document Vault' },
  { id: 'ip8-messages', page: 'messages', path: '/investee-portal-v8/messages', name: 'Messages' },
  { id: 'ip8-team', page: 'team', path: '/investee-portal-v8/team', name: 'Team & Access' },
  { id: 'ip8-settings', page: 'settings', path: '/investee-portal-v8/settings', name: 'Settings' },
] as const
