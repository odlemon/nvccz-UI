/** Portfolio V11 page id → Next path */
export const PV11_PAGE_TO_PATH: Record<string, string> = {
  dashboard: '/portfolio-v11',
  deals: '/portfolio-v11/deals',
  funds: '/portfolio-v11/funds',
  'capital-calls': '/portfolio-v11/capital-calls',
  companies: '/portfolio-v11/companies',
  'cash-accounts': '/portfolio-v11/cash-accounts',
  'cash-overview': '/portfolio-v11/cash-overview',
  'cash-ledger': '/portfolio-v11/cash-ledger',
  'cash-reservations': '/portfolio-v11/cash-reservations',
  'statement-imports': '/portfolio-v11/statement-imports',
  reconciliations: '/portfolio-v11/reconciliations',
  exceptions: '/portfolio-v11/exceptions',
  'period-close': '/portfolio-v11/period-close',
  reporting: '/portfolio-v11/reporting',
  'fund-performance': '/portfolio-v11/fund-performance',
  lps: '/portfolio-v11/lps',
  'documents-vault': '/portfolio-v11/documents',
  'reports-vault': '/portfolio-v11/reports-vault',
  'e-signatures': '/portfolio-v11/e-signatures',
  'mailer-lists': '/portfolio-v11/mailer-lists',
  settings: '/portfolio-v11/settings',
  // details
  'deal-detail': '/portfolio-v11/deals/detail',
  'company-detail': '/portfolio-v11/companies/detail',
  'fund-detail': '/portfolio-v11/funds/detail',
  'lp-detail': '/portfolio-v11/lps/detail',
  'capital-call-detail': '/portfolio-v11/capital-calls/detail',
  'reconciliation-workspace': '/portfolio-v11/reconciliations/workspace',
  'report-builder': '/portfolio-v11/reports-vault/builder',
  'applicant-portal': '/portfolio-v11/applicant-portal',
  'analytics-detail': '/portfolio-v11/analytics',
}

export const PV11_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PV11_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPv11Page(pathname: string): string {
  const clean = String(pathname || '').replace(/\/+$/, '') || '/portfolio-v11'
  if (clean in PV11_PATH_TO_PAGE) return PV11_PATH_TO_PAGE[clean]
  if (clean.startsWith('/portfolio-v11/deals/detail')) return 'deal-detail'
  if (clean.startsWith('/portfolio-v11/deals')) return 'deals'
  if (clean.startsWith('/portfolio-v11/funds/detail')) return 'fund-detail'
  if (clean.startsWith('/portfolio-v11/funds')) return 'funds'
  if (clean.startsWith('/portfolio-v11/companies/detail')) return 'company-detail'
  if (clean.startsWith('/portfolio-v11/companies')) return 'companies'
  if (clean.startsWith('/portfolio-v11/lps/detail')) return 'lp-detail'
  if (clean.startsWith('/portfolio-v11/lps')) return 'lps'
  if (clean.startsWith('/portfolio-v11/capital-calls/detail')) return 'capital-call-detail'
  if (clean.startsWith('/portfolio-v11/capital-calls')) return 'capital-calls'
  if (clean.startsWith('/portfolio-v11/reconciliations/workspace')) return 'reconciliation-workspace'
  if (clean.startsWith('/portfolio-v11/reconciliations')) return 'reconciliations'
  if (clean.startsWith('/portfolio-v11/reports-vault/builder')) return 'report-builder'
  if (clean.startsWith('/portfolio-v11/reports-vault')) return 'reports-vault'
  return 'dashboard'
}

export const PV11_NAV_PAGES = [
  { id: 'pv11-dashboard', page: 'dashboard', path: '/portfolio-v11', name: 'Dashboard' },
  { id: 'pv11-deals', page: 'deals', path: '/portfolio-v11/deals', name: 'Deal Flow' },
  { id: 'pv11-funds', page: 'funds', path: '/portfolio-v11/funds', name: 'Funds' },
  { id: 'pv11-capital-calls', page: 'capital-calls', path: '/portfolio-v11/capital-calls', name: 'Capital Calls' },
  { id: 'pv11-companies', page: 'companies', path: '/portfolio-v11/companies', name: 'Portfolio Companies' },
  { id: 'pv11-cash-accounts', page: 'cash-accounts', path: '/portfolio-v11/cash-accounts', name: 'Client / Fund Accounts' },
  { id: 'pv11-cash-overview', page: 'cash-overview', path: '/portfolio-v11/cash-overview', name: 'Cash Overview' },
  { id: 'pv11-cash-ledger', page: 'cash-ledger', path: '/portfolio-v11/cash-ledger', name: 'Cash Ledger' },
  { id: 'pv11-cash-reservations', page: 'cash-reservations', path: '/portfolio-v11/cash-reservations', name: 'Reservations' },
  { id: 'pv11-statement-imports', page: 'statement-imports', path: '/portfolio-v11/statement-imports', name: 'Statement Imports' },
  { id: 'pv11-reconciliations', page: 'reconciliations', path: '/portfolio-v11/reconciliations', name: 'Reconciliations' },
  { id: 'pv11-exceptions', page: 'exceptions', path: '/portfolio-v11/exceptions', name: 'Exceptions' },
  { id: 'pv11-period-close', page: 'period-close', path: '/portfolio-v11/period-close', name: 'Period Close & GL' },
  { id: 'pv11-reporting', page: 'reporting', path: '/portfolio-v11/reporting', name: 'Reporting Schedules' },
  { id: 'pv11-fund-performance', page: 'fund-performance', path: '/portfolio-v11/fund-performance', name: 'Fund Performance' },
  { id: 'pv11-lps', page: 'lps', path: '/portfolio-v11/lps', name: 'LP Management' },
  { id: 'pv11-documents', page: 'documents-vault', path: '/portfolio-v11/documents', name: 'Documents Vault' },
  { id: 'pv11-reports-vault', page: 'reports-vault', path: '/portfolio-v11/reports-vault', name: 'Reports Vault' },
  { id: 'pv11-e-signatures', page: 'e-signatures', path: '/portfolio-v11/e-signatures', name: 'E-Signatures' },
  { id: 'pv11-mailer-lists', page: 'mailer-lists', path: '/portfolio-v11/mailer-lists', name: 'Mailer Lists' },
  { id: 'pv11-settings', page: 'settings', path: '/portfolio-v11/settings', name: 'Settings & Integrations' },
] as const
