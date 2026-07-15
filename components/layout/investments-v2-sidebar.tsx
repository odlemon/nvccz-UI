"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import { useInvestmentsTheme } from '@/components/investments-v2/theme-provider'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Scale,
  TrendingUp,
  BarChart2,
  ChevronDown,
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
    ],
  },
  {
    label: 'Reconciliation',
    icon: Scale,
    href: '/investments-v2/reconciliation',
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
  }
]

export function InvestmentsV2Sidebar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { theme } = useInvestmentsTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success("Logged out successfully!")
      window.location.href = '/login'
    } catch (error) {
      toast.error("Logout failed. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return "U"
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getUserName = () => {
    if (!user) return "User"
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }

  const sidebarStyles = theme === 'dark'
    ? { background: '#1a1d24' }
    : { background: '#ffffff' }

  const logoBoxStyles = theme === 'dark'
    ? { background: '#3b82f6' }
    : { background: '#2563eb' }

  const navItemStyles = (isActive: boolean) => {
    if (theme === 'dark') {
      return isActive
        ? { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }
        : { color: '#64748b' }
    } else {
      return isActive
        ? { color: '#2563eb', background: 'rgba(37,99,235,0.08)' }
        : { color: '#64748b' }
    }
  }

  const childItemStyles = (isActive: boolean) => {
    if (theme === 'dark') {
      return isActive ? { color: '#3b82f6', fontWeight: 500 } : { color: '#64748b' }
    } else {
      return isActive ? { color: '#2563eb', fontWeight: 500 } : { color: '#64748b' }
    }
  }

  const userCardBg = theme === 'dark' ? '#14161e' : '#f8fafc'
  const userCardBorder = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col overflow-hidden" style={sidebarStyles}>
      {/* Logo */}


      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isRootActive(item.href)
          const isExp = expanded.includes(item.label)

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={navItemStyles(isActive)}
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={navItemStyles(isActive)}
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
                        className="flex items-center px-3 py-1.5 text-[12.5px] rounded-md transition-colors"
                        style={childItemStyles(active)}
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
      <div className="flex-shrink-0 p-3" style={{ borderTop: `1px solid ${userCardBorder}` }}>
        <div className="rounded-xl p-3" style={{ background: userCardBg }}>
          <div className="flex items-center gap-2.5 mb-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb' }}>
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: theme === 'dark' ? '#3b82f6' : '#2563eb',
                    color: '#ffffff'
                  }}
                >
                  {getUserInitials()}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold leading-tight truncate" style={{ color: theme === 'dark' ? '#e2e8f0' : '#1a2233' }}>
                {getUserName()}
              </div>
              <div className="text-[11px] truncate" style={{ color: '#64748b' }}>
                {user?.role || 'User'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-[12px] py-1.5 font-semibold rounded-full transition-colors disabled:opacity-50"
            style={{
              background: theme === 'dark' ? '#3b82f6' : '#2563eb',
              color: '#ffffff'
            }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  )
}
