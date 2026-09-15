/** Procurement V23 page id → Next path */
export const PR23_PAGE_TO_PATH: Record<string, string> = {
  'dashboard': '/procurement',
  'plan': '/procurement/plan',
  'approvals': '/procurement/approvals',
  'requisitions': '/procurement/requisitions',
  'tenders': '/procurement/tenders',
  // A later runtime layer adds "Quotation Comparison" to the sidebar. Without its own path the
  // host routed it to /procurement, and the page flipped straight back to the dashboard.
  'quotations': '/procurement/quotations',
  'evaluation': '/procurement/evaluation',
  'vendors': '/procurement/vendors',
  'contracts': '/procurement/contracts',
  'orders': '/procurement/purchase-orders',
  'receiving': '/procurement/goods-received',
  'invoices': '/procurement/invoices',
  // Same trap as quotations above: AI Invoice Capture was added to the sidebar in cycle six
  // without a path, so opening it from any page other than the dashboard pushed
  // /procurement and bounced the user back to the Command Centre.
  'intake': '/procurement/intake',
  'accounts': '/procurement/accounts',
  'documents': '/procurement/documents',
  'reports': '/procurement/reports',
  'audit': '/procurement/audit',
  'settings': '/procurement/settings',
  'analytics': '/procurement/analytics',
}

export const PR23_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR23_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr23Page(pathname: string): string {
  if (pathname in PR23_PATH_TO_PAGE) return PR23_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/procurement/')) {
    const seg = pathname.replace('/procurement/', '').split('/')[0]
    const hit = Object.entries(PR23_PAGE_TO_PATH).find(([, p]) => p === '/procurement/' + seg)
    if (hit) return hit[0]
  }
  return 'dashboard'
}

export const PR23_NAV_PAGES = [
  { id: 'pr23-dashboard', page: 'dashboard', path: '/procurement', name: 'Command Centre' },
  { id: 'pr23-plan', page: 'plan', path: '/procurement/plan', name: 'Annual Procurement Plan' },
  { id: 'pr23-approvals', page: 'approvals', path: '/procurement/approvals', name: 'Approval Centre' },
  { id: 'pr23-requisitions', page: 'requisitions', path: '/procurement/requisitions', name: 'Purchase Requisitions' },
  { id: 'pr23-tenders', page: 'tenders', path: '/procurement/tenders', name: 'Tenders & RFx' },
  { id: 'pr23-quotations', page: 'quotations', path: '/procurement/quotations', name: 'Quotation Comparison' },
  { id: 'pr23-evaluation', page: 'evaluation', path: '/procurement/evaluation', name: 'Bid Evaluation' },
  { id: 'pr23-vendors', page: 'vendors', path: '/procurement/vendors', name: 'Vendor Registry' },
  { id: 'pr23-contracts', page: 'contracts', path: '/procurement/contracts', name: 'Contracts & Awards' },
  { id: 'pr23-orders', page: 'orders', path: '/procurement/purchase-orders', name: 'Purchase Orders' },
  { id: 'pr23-receiving', page: 'receiving', path: '/procurement/goods-received', name: 'Receiving & Inspection' },
  { id: 'pr23-invoices', page: 'invoices', path: '/procurement/invoices', name: 'Invoices & 3-Way Match' },
  { id: 'pr23-intake', page: 'intake', path: '/procurement/intake', name: 'AI Invoice Capture' },
  { id: 'pr23-accounts', page: 'accounts', path: '/procurement/accounts', name: 'Accounts & Asset Transfers' },
  { id: 'pr23-documents', page: 'documents', path: '/procurement/documents', name: 'Document Vault' },
  { id: 'pr23-reports', page: 'reports', path: '/procurement/reports', name: 'Reports Vault' },
  { id: 'pr23-audit', page: 'audit', path: '/procurement/audit', name: 'Audit & Compliance' },
  { id: 'pr23-settings', page: 'settings', path: '/procurement/settings', name: 'Configuration & RBAC' },
  { id: 'pr23-analytics', page: 'analytics', path: '/procurement/analytics', name: 'Analytics' },
] as const
