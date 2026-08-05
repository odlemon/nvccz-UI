'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Scale,
  TrendingUp,
  BarChart2,
  FileText,
  Calculator,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'investments-v2-sidebar-collapsed'

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/investments-v2',
  },
  {
    label: 'Portfolios',
    icon: Briefcase,
    href: '/investments-v2/portfolios',
    children: [
      { label: 'Overview', href: '/investments-v2/portfolios' },
      { label: 'Instruments', href: '/investments-v2/portfolios/instruments' },
      { label: 'Prices', href: '/investments-v2/portfolios/prices' },
      { label: 'Positions', href: '/investments-v2/portfolios/positions' },
      { label: 'Transactions', href: '/investments-v2/portfolios/transactions' },
      { label: 'Folder Setup', href: '/investments-v2/portfolios/folder-setup' },
      { label: 'Setup', href: '/investments-v2/portfolios/setup' },
    ],
  },
  {
    label: 'Orders',
    icon: ClipboardList,
    href: '/investments-v2/orders',
    children: [
      { label: 'Trade Blotter', href: '/investments-v2/orders/blotter' },
      { label: 'Orderbook', href: '/investments-v2/orders/orderbook' },
      { label: 'Trading', href: '/investments-v2/orders/trading' },
      { label: 'Compliance', href: '/investments-v2/orders/compliance' },
      { label: 'Simulation', href: '/investments-v2/orders/simulation' },
      { label: 'Models', href: '/investments-v2/orders/models' },
      { label: 'Setup', href: '/investments-v2/orders/setup' },
    ],
  },
  {
    label: 'Reconciliation',
    icon: Scale,
    href: '/investments-v2/reconciliation/trade',
    children: [
      { label: 'Trade', href: '/investments-v2/reconciliation/trade' },
      // Hidden for now — client / cash recon surfaces
      // { label: 'Client', href: '/investments-v2/reconciliation' },
      // { label: 'Cash', href: '/investments-v2/reconciliation/fund-cash' },
      // { label: 'Cash Ledger', href: '/investments-v2/reconciliation/cash-ledger' },
      // { label: 'Exceptions', href: '/investments-v2/reconciliation/exceptions' },
      // { label: 'Statements', href: '/investments-v2/reconciliation/statements' },
    ],
  },
  {
    label: 'Valuation',
    icon: TrendingUp,
    href: '/investments-v2/valuation',
  },
  {
    label: 'Reporting',
    icon: BarChart2,
    href: '/investments-v2/reporting',
  },
  {
    label: 'Documentation',
    icon: FileText,
    href: '/investments-v2/documentation',
  },
  {
    label: 'Accounting',
    icon: Calculator,
    href: '/investments-v2/accounting',
  },
]

function getDefaultExpanded(pathname: string) {
  const expanded: string[] = []
  navItems.forEach((item) => {
    if (!item.children) return
    const hasActive = item.children.some(
      (c) => pathname === c.href || (c.href !== item.href && pathname.startsWith(`${c.href}/`)),
    )
    if (
      hasActive ||
      pathname === item.href ||
      (item.href !== '/investments-v2' && pathname.startsWith(`${item.href}/`))
    ) {
      expanded.push(item.label)
    }
  })
  return expanded.length ? expanded : ['Portfolios']
}

export function InvestmentsV2Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState<string[]>(() => getDefaultExpanded(pathname))

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === '1') setCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    setExpanded((prev) => {
      const next = getDefaultExpanded(pathname)
      const merged = new Set([...prev, ...next])
      return Array.from(merged)
    })
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const toggleExpand = (label: string) => {
    if (collapsed) {
      setCollapsed(false)
      try {
        localStorage.setItem(STORAGE_KEY, '0')
      } catch {
        /* ignore */
      }
      setExpanded((prev) => (prev.includes(label) ? prev : [...prev, label]))
      return
    }
    setExpanded((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  const isRootActive = (href: string, children?: { href: string }[]) => {
    if (href === '/investments-v2') return pathname === href
    if (children?.length) {
      return children.some(
        (c) => pathname === c.href || (c.href !== href && pathname.startsWith(`${c.href}/`)),
      ) || pathname === href || pathname.startsWith(`${href}/`)
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isChildActive = (href: string, parentHref: string) => {
    if (href === parentHref) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-[220px]',
      )}
    >
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isRootActive(item.href, item.children)
          const isExp = expanded.includes(item.label)

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-10 items-center gap-2.5 rounded-full px-3 text-[12px] font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-sidebar-primary' : 'opacity-70')} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                title={collapsed ? item.label : undefined}
                onClick={() => toggleExpand(item.label)}
                className={cn(
                  'flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-[12px] font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'justify-between',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-sidebar-primary' : 'opacity-70')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', isExp && 'rotate-180')}
                  />
                )}
              </button>

              {!collapsed && isExp && (
                <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.children.map((child) => {
                    const childActive = isChildActive(child.href, item.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center rounded-full px-3 py-1.5 text-[11.5px] transition-colors',
                          childActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-full px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
