'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/store'
import { logoutUser } from '@/lib/store/slices/authSlice'
import { toast } from 'sonner'
import { useForecastingTheme } from './theme-provider'
import {
  Home, Layers, FileSpreadsheet, GitBranch, ArrowUpDown, Workflow
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/forecasting-v2/home', icon: Home },
  { label: 'Model Builder', href: '/forecasting-v2/model-builder', icon: Layers },
  { label: 'Planning Worksheet', href: '/forecasting-v2/planning-worksheet', icon: FileSpreadsheet },
  { label: 'Scenario Comparison', href: '/forecasting-v2/scenario-comparison', icon: GitBranch },
  { label: 'Variance', href: '/forecasting-v2/variance', icon: ArrowUpDown },
  { label: 'Workflow', href: '/forecasting-v2/workflow', icon: Workflow },
]

export default function Sidebar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { theme } = useForecastingTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success('Logged out successfully!')
      window.location.href = '/login'
    } catch (error) {
      toast.error('Logout failed. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getUserName = () => {
    if (!user) return 'User'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }

  const sidebarStyles = theme === 'dark'
    ? { background: '#1a1d24' }
    : { background: '#ffffff' }

  const navItemStyles = (active: boolean) => {
    if (theme === 'dark') {
      return active
        ? { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }
        : { color: '#64748b' }
    } else {
      return active
        ? { color: '#2563eb', background: 'rgba(37,99,235,0.08)' }
        : { color: '#64748b' }
    }
  }

  const userCardBg = theme === 'dark' ? '#14161e' : '#f8fafc'
  const userCardBorder = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col overflow-hidden" style={sidebarStyles}>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={navItemStyles(active)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User card at bottom */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: `1px solid ${userCardBorder}` }}>
        <div className="rounded-xl p-3" style={{ background: userCardBg }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb' }}>
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: theme === 'dark' ? '#3b82f6' : '#2563eb', color: '#ffffff' }}
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
            style={{ background: theme === 'dark' ? '#3b82f6' : '#2563eb', color: '#ffffff' }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  )
}
