export type AcNavItem = {
  id: string
  label: string
  href: string
  icon: string
}

/** Sidebar IA retained from live Accounting + PDF Command Centre shell */
export const AC_NAV_ITEMS: AcNavItem[] = [
  { id: "ac-dashboard", label: "Dashboard", href: "/accounting-v2", icon: "LayoutDashboard" },
  { id: "ac-gl", label: "General Ledger", href: "/accounting-v2/general-ledger", icon: "BookOpen" },
  { id: "ac-cash", label: "Cash Book", href: "/accounting-v2/cash-book", icon: "Wallet" },
  { id: "ac-sales", label: "Sales", href: "/accounting-v2/receivables", icon: "Receipt" },
  { id: "ac-purchases", label: "Purchases", href: "/accounting-v2/payables/match", icon: "ShoppingCart" },
  { id: "ac-recon", label: "Bank Reconciliation", href: "/accounting-v2/bank-reconciliation", icon: "ArrowLeftRight" },
  { id: "ac-expenses", label: "Expenses", href: "/accounting-v2/expenses", icon: "CreditCard" },
  { id: "ac-inventory", label: "Inventory", href: "/accounting-v2/inventory", icon: "Package" },
  { id: "ac-assets", label: "Asset Management", href: "/accounting-v2/assets", icon: "Building2" },
  { id: "ac-sti", label: "Short-Term Investments", href: "/accounting-v2/short-term-investments", icon: "Landmark" },
  { id: "ac-reports", label: "Financial Reports", href: "/accounting-v2/reports", icon: "FileBarChart" },
  { id: "ac-settings", label: "Settings", href: "/accounting-v2/chart-governance", icon: "Settings" },
]

/** Extra PDF process routes reachable from Command Centre actions */
export const AC_PROCESS_ROUTES = {
  journal: "/accounting-v2/journals/new",
  close: "/accounting-v2/close",
  tax: "/accounting-v2/tax",
  fx: "/accounting-v2/fx-revaluation",
  consolidation: "/accounting-v2/consolidation",
  paymentRun: "/accounting-v2/payment-run",
} as const
