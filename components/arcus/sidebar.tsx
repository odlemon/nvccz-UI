'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Scale,
  TrendingUp,
  BarChart2,
  FolderOpen,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    href: '/investments-v2/reconciliation',
    children: [
      { label: 'Overview', href: '/investments-v2/reconciliation' },
      { label: 'Trade match', href: '/investments-v2/reconciliation/trade' },
      { label: 'Cash match', href: '/investments-v2/reconciliation/fund-cash' },
      { label: 'Positions', href: '/investments-v2/reconciliation/positions' },
      { label: 'Cash ledger', href: '/investments-v2/reconciliation/cash-ledger' },
      { label: 'Exceptions', href: '/investments-v2/reconciliation/exceptions' },
      { label: 'Statements', href: '/investments-v2/reconciliation/statements' },
    ],
  },
  {
    label: 'Valuation',
    icon: TrendingUp,
    href: '/investments-v2/valuation',
    children: [
      { label: 'NAV Runs', href: '/investments-v2/valuation/nav' },
      { label: 'P&L Runs', href: '/investments-v2/valuation/pnl' },
      { label: 'Price Validation', href: '/investments-v2/valuation/prices' },
      { label: 'FX Conversion', href: '/investments-v2/valuation/fx' },
    ],
  },
  {
    label: 'Reporting',
    icon: BarChart2,
    href: '/investments-v2/reporting',
    children: [
      { label: 'Portfolio Reports', href: '/investments-v2/reporting/portfolio' },
      { label: 'P&L Reports', href: '/investments-v2/reporting/pnl' },
      { label: 'Trade Reports', href: '/investments-v2/reporting/trades' },
    ],
  }
]

export function Sidebar() {
  const pathname = usePathname()

  // Auto-expand parent whose child is active
  const getDefaultExpanded = () => {
    const expanded: string[] = []
    navItems.forEach(item => {
      if (item.children) {
        const hasActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
        if (hasActive || pathname.startsWith(item.href + '/') || (item.href !== '/' && pathname.startsWith(item.href))) {
          expanded.push(item.label)
        }
      }
    })
    return expanded.length ? expanded : ['Portfolios', 'Orders']
  }

  const [expanded, setExpanded] = useState<string[]>(getDefaultExpanded)

  const toggleExpand = (label: string) => {
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const isRootActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isChildActive = (href: string) => pathname === href

  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col overflow-hidden rounded-2xl" style={{ background: '#1a1d24' }}>
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#3b82f6' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 3.5L9 7L12 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 10.5L5.5 7L9 10.5L12 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          </svg>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">HEDGEFUND</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isRootActive(item.href)
          const isExp = expanded.includes(item.label)

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  isActive
                    ? 'text-white bg-[#252b3b]'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#20242f]'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleExpand(item.label)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  isActive
                    ? 'text-white bg-[#252b3b]'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#20242f]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExp ? 'rotate-180' : '')} />
              </button>

              {isExp && (
                <div className="mt-0.5 mb-1 ml-3">
                  {item.children.map((child) => {
                    const active = isChildActive(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center px-3 py-1.5 text-[12.5px] rounded-md transition-colors',
                          active
                            ? 'text-[#3b82f6] font-medium'
                            : 'text-[#64748b] hover:text-[#94a3b8]'
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

      {/* User card at bottom */}
      <div className="flex-shrink-0 p-3">
        <div className="rounded-xl p-3" style={{ background: '#141720' }}>
          <div className="flex items-center gap-2.5 mb-3">
            {/* Avatar with yellow circle accent */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: '#f59e0b' }}>
                <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ background: '#1e3a5f', color: '#93c5fd' }}>
                  LS
                </div>
              </div>
            </div>
            <div>
              <div className="text-white text-[13px] font-semibold leading-tight">Lucas Scott</div>
              <div className="text-[#64748b] text-[11px]">Manager</div>
            </div>
          </div>
          <button className="w-full btn-white text-[12px] py-1.5 font-semibold" style={{ borderRadius: '20px' }}>
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
