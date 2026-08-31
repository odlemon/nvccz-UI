/** Procurement V23 page id → Next path */
export const PR23_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/procurement-v23',
  'plan': '/procurement-v23/plan',
  'approvals': '/procurement-v23/approvals',
  'requisitions': '/procurement-v23/requisitions',
  'tenders': '/procurement-v23/tenders',
  'evaluation': '/procurement-v23/evaluation',
  'vendors': '/procurement-v23/vendors',
  'contracts': '/procurement-v23/contracts',
  'orders': '/procurement-v23/purchase-orders',
  'receiving': '/procurement-v23/goods-received',
  'invoices': '/procurement-v23/invoices',
  'accounts': '/procurement-v23/accounts',
  'documents': '/procurement-v23/documents',
  'reports': '/procurement-v23/reports',
  'audit': '/procurement-v23/audit',
  'settings': '/procurement-v23/settings',
  'analytics': '/procurement-v23/analytics',
}

export const PR23_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR23_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr23Page(pathname: string): string {
  if (pathname in PR23_PATH_TO_PAGE) return PR23_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/procurement-v23/')) {
    const seg = pathname.replace('/procurement-v23/', '').split('/')[0]
    const hit = Object.entries(PR23_PAGE_TO_PATH).find(([, p]) => p === '/procurement-v23/' + seg)
    if (hit) return hit[0]
  }
  return 'dashboard'
}

export const PR23_NAV_PAGES = [
  { id: 'pr23-dashboard', page: 'dashboard', path: '/procurement-v23', name: 'Command Centre' },
  { id: 'pr23-plan', page: 'plan', path: '/procurement-v23/plan', name: 'Annual Procurement Plan' },
  { id: 'pr23-approvals', page: 'approvals', path: '/procurement-v23/approvals', name: 'Approval Centre' },
  { id: 'pr23-requisitions', page: 'requisitions', path: '/procurement-v23/requisitions', name: 'Purchase Requisitions' },
  { id: 'pr23-tenders', page: 'tenders', path: '/procurement-v23/tenders', name: 'Tenders & RFx' },
  { id: 'pr23-evaluation', page: 'evaluation', path: '/procurement-v23/evaluation', name: 'Bid Evaluation' },
  { id: 'pr23-vendors', page: 'vendors', path: '/procurement-v23/vendors', name: 'Vendor Registry' },
  { id: 'pr23-contracts', page: 'contracts', path: '/procurement-v23/contracts', name: 'Contracts & Awards' },
  { id: 'pr23-orders', page: 'orders', path: '/procurement-v23/purchase-orders', name: 'Purchase Orders' },
  { id: 'pr23-receiving', page: 'receiving', path: '/procurement-v23/goods-received', name: 'Receiving & Inspection' },
  { id: 'pr23-invoices', page: 'invoices', path: '/procurement-v23/invoices', name: 'Invoices & 3-Way Match' },
  { id: 'pr23-accounts', page: 'accounts', path: '/procurement-v23/accounts', name: 'Accounts & Asset Transfers' },
  { id: 'pr23-documents', page: 'documents', path: '/procurement-v23/documents', name: 'Document Vault' },
  { id: 'pr23-reports', page: 'reports', path: '/procurement-v23/reports', name: 'Reports Vault' },
  { id: 'pr23-audit', page: 'audit', path: '/procurement-v23/audit', name: 'Audit & Compliance' },
  { id: 'pr23-settings', page: 'settings', path: '/procurement-v23/settings', name: 'Configuration & RBAC' },
  { id: 'pr23-analytics', page: 'analytics', path: '/procurement-v23/analytics', name: 'Analytics' },
] as const
