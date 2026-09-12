/** Accounting V52 page id → Next path */
export const AC52_PAGE_TO_PATH: Record<string, string> = {
  'overview': '/accounting',
  'ceo': '/accounting/ceo',
  'approvals': '/accounting/approvals',
  'close': '/accounting/close',
  'ledger': '/accounting/general-ledger',
  'journals': '/accounting/journals',
  'cash': '/accounting/cash-book',
  'reconciliation': '/accounting/bank-reconciliation',
  'payables': '/accounting/payables',
  'receivables': '/accounting/receivables',
  'expenses': '/accounting/expenses',
  'timesheets': '/accounting/timesheets',
  'recurring': '/accounting/recurring',
  'inventory': '/accounting/inventory',
  'assets': '/accounting/assets',
  'investments': '/accounting/short-term-investments',
  'reports': '/accounting/reports',
  'trialbalance': '/accounting/trial-balance',
  'compliance': '/accounting/tax',
  'fx': '/accounting/fx-revaluation',
  'consolidation': '/accounting/consolidation',
  'coa': '/accounting/chart-governance',
  'vault': '/accounting/vault',
  'audit': '/accounting/audit',
  'access': '/accounting/access',
  'integrations': '/accounting/integrations',
  'settings': '/accounting/settings',
}

export const AC52_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(AC52_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToAc52Page(pathname: string): string {
  if (pathname in AC52_PATH_TO_PAGE) return AC52_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/accounting/')) {
    const seg = pathname.replace('/accounting/', '').split('/')[0]
    const hit = Object.entries(AC52_PAGE_TO_PATH).find(([, p]) => p === '/accounting/' + seg)
    if (hit) return hit[0]
  }
  return 'overview'
}

export const AC52_NAV_PAGES = [
  { id: 'ac52-overview', page: 'overview', path: '/accounting', name: 'Command Centre' },
  { id: 'ac52-ceo', page: 'ceo', path: '/accounting/ceo', name: 'CEO View' },
  { id: 'ac52-approvals', page: 'approvals', path: '/accounting/approvals', name: 'Approval Queue' },
  { id: 'ac52-close', page: 'close', path: '/accounting/close', name: 'Period Close' },
  { id: 'ac52-ledger', page: 'ledger', path: '/accounting/general-ledger', name: 'General Ledger' },
  { id: 'ac52-journals', page: 'journals', path: '/accounting/journals', name: 'Journal Entries' },
  { id: 'ac52-cash', page: 'cash', path: '/accounting/cash-book', name: 'Cash & Liquidity' },
  { id: 'ac52-reconciliation', page: 'reconciliation', path: '/accounting/bank-reconciliation', name: 'Bank Reconciliation' },
  { id: 'ac52-payables', page: 'payables', path: '/accounting/payables', name: 'Payables & Payments' },
  { id: 'ac52-receivables', page: 'receivables', path: '/accounting/receivables', name: 'Receivables' },
  { id: 'ac52-expenses', page: 'expenses', path: '/accounting/expenses', name: 'Expenses & Claims' },
  { id: 'ac52-timesheets', page: 'timesheets', path: '/accounting/timesheets', name: 'Timesheets & Projects' },
  { id: 'ac52-recurring', page: 'recurring', path: '/accounting/recurring', name: 'Recurring Schedules' },
  { id: 'ac52-inventory', page: 'inventory', path: '/accounting/inventory', name: 'Inventory Accounting' },
  { id: 'ac52-assets', page: 'assets', path: '/accounting/assets', name: 'Fixed Assets' },
  { id: 'ac52-investments', page: 'investments', path: '/accounting/short-term-investments', name: 'Short-Term Investments' },
  { id: 'ac52-reports', page: 'reports', path: '/accounting/reports', name: 'Financial Reports' },
  { id: 'ac52-trialbalance', page: 'trialbalance', path: '/accounting/trial-balance', name: 'Trial Balance' },
  { id: 'ac52-compliance', page: 'compliance', path: '/accounting/tax', name: 'Compliance & Tax' },
  { id: 'ac52-fx', page: 'fx', path: '/accounting/fx-revaluation', name: 'FX Revaluation' },
  { id: 'ac52-consolidation', page: 'consolidation', path: '/accounting/consolidation', name: 'Group Consolidation' },
  { id: 'ac52-coa', page: 'coa', path: '/accounting/chart-governance', name: 'Chart of Accounts' },
  { id: 'ac52-vault', page: 'vault', path: '/accounting/vault', name: 'Document Vault' },
  { id: 'ac52-audit', page: 'audit', path: '/accounting/audit', name: 'Audit Trail' },
  { id: 'ac52-access', page: 'access', path: '/accounting/access', name: 'Access Control' },
  { id: 'ac52-integrations', page: 'integrations', path: '/accounting/integrations', name: 'Integrations' },
  { id: 'ac52-settings', page: 'settings', path: '/accounting/settings', name: 'Settings' },
] as const
