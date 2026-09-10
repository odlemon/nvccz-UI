/** Payroll V6 page id → Next path */
export const PR6_PAGE_TO_PATH: Record<string, string> = {
  'overview': '/payroll',
  'employees': '/payroll/employees',
  'onboarding': '/payroll/onboarding',
  'runs': '/payroll/runs',
  'inputs': '/payroll/inputs',
  'exceptions': '/payroll/exceptions',
  'approvals': '/payroll/approvals',
  'close': '/payroll/close',
  'components': '/payroll/components',
  'calendar': '/payroll/calendar',
  'tax': '/payroll/tax',
  'training': '/payroll/training',
  'leave': '/payroll/leave',
  'vendors': '/payroll/vendors',
  'vault': '/payroll/vault',
  'reports': '/payroll/reports',
  'audit': '/payroll/audit',
  'access': '/payroll/access',
  'settings': '/payroll/settings',
  'mypay': '/payroll/mypay',
}

export const PR6_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR6_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr6Page(pathname: string): string {
  if (pathname in PR6_PATH_TO_PAGE) return PR6_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/payroll/')) {
    const seg = pathname.replace('/payroll/', '').split('/')[0]
    if (seg && PR6_PAGE_TO_PATH[seg]) return seg
  }
  return 'overview'
}

export const PR6_NAV_PAGES = [
  { id: 'pr6-overview', page: 'overview', path: '/payroll', name: 'Command Centre' },
  { id: 'pr6-employees', page: 'employees', path: '/payroll/employees', name: 'Employees' },
  { id: 'pr6-onboarding', page: 'onboarding', path: '/payroll/onboarding', name: 'Onboarding' },
  { id: 'pr6-runs', page: 'runs', path: '/payroll/runs', name: 'Payroll Runs' },
  { id: 'pr6-inputs', page: 'inputs', path: '/payroll/inputs', name: 'Inputs & Validation' },
  { id: 'pr6-exceptions', page: 'exceptions', path: '/payroll/exceptions', name: 'Exception Workbench' },
  { id: 'pr6-approvals', page: 'approvals', path: '/payroll/approvals', name: 'Maker-Checker Review' },
  { id: 'pr6-close', page: 'close', path: '/payroll/close', name: 'Close & Distribution' },
  { id: 'pr6-components', page: 'components', path: '/payroll/components', name: 'Earnings & Deductions' },
  { id: 'pr6-calendar', page: 'calendar', path: '/payroll/calendar', name: 'Pay Groups & Calendar' },
  { id: 'pr6-tax', page: 'tax', path: '/payroll/tax', name: 'Tax & Statutory Rules' },
  { id: 'pr6-training', page: 'training', path: '/payroll/training', name: 'Training & Compliance' },
  { id: 'pr6-leave', page: 'leave', path: '/payroll/leave', name: 'Leave & Benefits' },
  { id: 'pr6-vendors', page: 'vendors', path: '/payroll/vendors', name: 'Vendors & Quotations' },
  { id: 'pr6-vault', page: 'vault', path: '/payroll/vault', name: 'Document Vault' },
  { id: 'pr6-reports', page: 'reports', path: '/payroll/reports', name: 'Compliance Reports' },
  { id: 'pr6-audit', page: 'audit', path: '/payroll/audit', name: 'Audit Trail' },
  { id: 'pr6-access', page: 'access', path: '/payroll/access', name: 'Roles & Access Control' },
  { id: 'pr6-settings', page: 'settings', path: '/payroll/settings', name: 'Settings & Integrations' },
  { id: 'pr6-mypay', page: 'mypay', path: '/payroll/mypay', name: 'My Pay' },
] as const
