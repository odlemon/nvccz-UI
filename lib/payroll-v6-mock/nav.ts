/** Payroll V6 page id → Next path */
export const PR6_PAGE_TO_PATH: Record<string, string> = {
  'overview': '/payroll-v6',
  'employees': '/payroll-v6/employees',
  'onboarding': '/payroll-v6/onboarding',
  'runs': '/payroll-v6/runs',
  'inputs': '/payroll-v6/inputs',
  'exceptions': '/payroll-v6/exceptions',
  'approvals': '/payroll-v6/approvals',
  'close': '/payroll-v6/close',
  'components': '/payroll-v6/components',
  'calendar': '/payroll-v6/calendar',
  'tax': '/payroll-v6/tax',
  'training': '/payroll-v6/training',
  'leave': '/payroll-v6/leave',
  'vendors': '/payroll-v6/vendors',
  'vault': '/payroll-v6/vault',
  'reports': '/payroll-v6/reports',
  'audit': '/payroll-v6/audit',
  'access': '/payroll-v6/access',
  'settings': '/payroll-v6/settings',
  'mypay': '/payroll-v6/mypay',
}

export const PR6_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR6_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr6Page(pathname: string): string {
  if (pathname in PR6_PATH_TO_PAGE) return PR6_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/payroll-v6/')) {
    const seg = pathname.replace('/payroll-v6/', '').split('/')[0]
    if (seg && PR6_PAGE_TO_PATH[seg]) return seg
  }
  return 'overview'
}

export const PR6_NAV_PAGES = [
  { id: 'pr6-overview', page: 'overview', path: '/payroll-v6', name: 'Command Centre' },
  { id: 'pr6-employees', page: 'employees', path: '/payroll-v6/employees', name: 'Employees' },
  { id: 'pr6-onboarding', page: 'onboarding', path: '/payroll-v6/onboarding', name: 'Onboarding' },
  { id: 'pr6-runs', page: 'runs', path: '/payroll-v6/runs', name: 'Payroll Runs' },
  { id: 'pr6-inputs', page: 'inputs', path: '/payroll-v6/inputs', name: 'Inputs & Validation' },
  { id: 'pr6-exceptions', page: 'exceptions', path: '/payroll-v6/exceptions', name: 'Exception Workbench' },
  { id: 'pr6-approvals', page: 'approvals', path: '/payroll-v6/approvals', name: 'Maker-Checker Review' },
  { id: 'pr6-close', page: 'close', path: '/payroll-v6/close', name: 'Close & Distribution' },
  { id: 'pr6-components', page: 'components', path: '/payroll-v6/components', name: 'Earnings & Deductions' },
  { id: 'pr6-calendar', page: 'calendar', path: '/payroll-v6/calendar', name: 'Pay Groups & Calendar' },
  { id: 'pr6-tax', page: 'tax', path: '/payroll-v6/tax', name: 'Tax & Statutory Rules' },
  { id: 'pr6-training', page: 'training', path: '/payroll-v6/training', name: 'Training & Compliance' },
  { id: 'pr6-leave', page: 'leave', path: '/payroll-v6/leave', name: 'Leave & Benefits' },
  { id: 'pr6-vendors', page: 'vendors', path: '/payroll-v6/vendors', name: 'Vendors & Quotations' },
  { id: 'pr6-vault', page: 'vault', path: '/payroll-v6/vault', name: 'Document Vault' },
  { id: 'pr6-reports', page: 'reports', path: '/payroll-v6/reports', name: 'Compliance Reports' },
  { id: 'pr6-audit', page: 'audit', path: '/payroll-v6/audit', name: 'Audit Trail' },
  { id: 'pr6-access', page: 'access', path: '/payroll-v6/access', name: 'Roles & Access Control' },
  { id: 'pr6-settings', page: 'settings', path: '/payroll-v6/settings', name: 'Settings & Integrations' },
  { id: 'pr6-mypay', page: 'mypay', path: '/payroll-v6/mypay', name: 'My Pay' },
] as const
