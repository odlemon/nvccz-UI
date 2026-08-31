/** Accounting V52 page id → Next path */
export const AC52_PAGE_TO_PATH: Record<string, string> = {
  'overview': '/accounting-v52',
  'approvals': '/accounting-v52/approvals',
  'close': '/accounting-v52/close',
  'ledger': '/accounting-v52/general-ledger',
  'journals': '/accounting-v52/journals',
  'cash': '/accounting-v52/cash-book',
  'reconciliation': '/accounting-v52/bank-reconciliation',
  'payables': '/accounting-v52/payables',
  'receivables': '/accounting-v52/receivables',
  'expenses': '/accounting-v52/expenses',
  'inventory': '/accounting-v52/inventory',
  'assets': '/accounting-v52/assets',
  'investments': '/accounting-v52/short-term-investments',
  'reports': '/accounting-v52/reports',
  'compliance': '/accounting-v52/tax',
  'fx': '/accounting-v52/fx-revaluation',
  'consolidation': '/accounting-v52/consolidation',
  'coa': '/accounting-v52/chart-governance',
  'vault': '/accounting-v52/vault',
  'audit': '/accounting-v52/audit',
  'access': '/accounting-v52/access',
  'integrations': '/accounting-v52/integrations',
  'settings': '/accounting-v52/settings',
}

export const AC52_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(AC52_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToAc52Page(pathname: string): string {
  if (pathname in AC52_PATH_TO_PAGE) return AC52_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/accounting-v52/')) {
    const seg = pathname.replace('/accounting-v52/', '').split('/')[0]
    const hit = Object.entries(AC52_PAGE_TO_PATH).find(([, p]) => p === '/accounting-v52/' + seg)
    if (hit) return hit[0]
  }
  return 'overview'
}

export const AC52_NAV_PAGES = [
  { id: 'ac52-overview', page: 'overview', path: '/accounting-v52', name: 'Command Centre' },
  { id: 'ac52-approvals', page: 'approvals', path: '/accounting-v52/approvals', name: 'Approval Queue' },
  { id: 'ac52-close', page: 'close', path: '/accounting-v52/close', name: 'Period Close' },
  { id: 'ac52-ledger', page: 'ledger', path: '/accounting-v52/general-ledger', name: 'General Ledger' },
  { id: 'ac52-journals', page: 'journals', path: '/accounting-v52/journals', name: 'Journal Entries' },
  { id: 'ac52-cash', page: 'cash', path: '/accounting-v52/cash-book', name: 'Cash & Liquidity' },
  { id: 'ac52-reconciliation', page: 'reconciliation', path: '/accounting-v52/bank-reconciliation', name: 'Bank Reconciliation' },
  { id: 'ac52-payables', page: 'payables', path: '/accounting-v52/payables', name: 'Payables & Payments' },
  { id: 'ac52-receivables', page: 'receivables', path: '/accounting-v52/receivables', name: 'Receivables' },
  { id: 'ac52-expenses', page: 'expenses', path: '/accounting-v52/expenses', name: 'Expenses & Claims' },
  { id: 'ac52-inventory', page: 'inventory', path: '/accounting-v52/inventory', name: 'Inventory Accounting' },
  { id: 'ac52-assets', page: 'assets', path: '/accounting-v52/assets', name: 'Fixed Assets' },
  { id: 'ac52-investments', page: 'investments', path: '/accounting-v52/short-term-investments', name: 'Short-Term Investments' },
  { id: 'ac52-reports', page: 'reports', path: '/accounting-v52/reports', name: 'Financial Reports' },
  { id: 'ac52-compliance', page: 'compliance', path: '/accounting-v52/tax', name: 'Compliance & Tax' },
  { id: 'ac52-fx', page: 'fx', path: '/accounting-v52/fx-revaluation', name: 'FX Revaluation' },
  { id: 'ac52-consolidation', page: 'consolidation', path: '/accounting-v52/consolidation', name: 'Group Consolidation' },
  { id: 'ac52-coa', page: 'coa', path: '/accounting-v52/chart-governance', name: 'Chart of Accounts' },
  { id: 'ac52-vault', page: 'vault', path: '/accounting-v52/vault', name: 'Document Vault' },
  { id: 'ac52-audit', page: 'audit', path: '/accounting-v52/audit', name: 'Audit Trail' },
  { id: 'ac52-access', page: 'access', path: '/accounting-v52/access', name: 'Access Control' },
  { id: 'ac52-integrations', page: 'integrations', path: '/accounting-v52/integrations', name: 'Integrations' },
  { id: 'ac52-settings', page: 'settings', path: '/accounting-v52/settings', name: 'Settings' },
] as const
