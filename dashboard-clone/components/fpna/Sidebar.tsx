'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Box, DollarSign, TrendingUp, GitBranch, Settings2,
  Users, BarChart2, Receipt, Wallet, ArrowUpDown, FileText,
  Workflow, Layers, Settings, ChevronLeft
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Models', href: '/models', icon: Box },
  { label: 'Budgeting', href: '/budgeting', icon: DollarSign },
  { label: 'Forecasting', href: '/planning-worksheet', icon: TrendingUp },
  { label: 'Scenarios', href: '/scenario-comparison', icon: GitBranch },
  { label: 'Assumptions', href: '/assumptions', icon: Settings2 },
  { label: 'Workforce', href: '/workforce', icon: Users },
  { label: 'Revenue', href: '/revenue', icon: BarChart2 },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Cash Flow', href: '/cash-flow', icon: Wallet },
  { label: 'Variance', href: '/variance', icon: ArrowUpDown },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Workflow', href: '/workflow', icon: Workflow },
  { label: 'Model Builder', href: '/model-builder', icon: Layers },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col h-full w-[148px] shrink-0"
      style={{ backgroundColor: '#0d1b4b', color: '#c8d6f5' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-4 py-4 border-b border-white/10">
        <div className="w-6 h-6 rounded bg-blue-400 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">A</span>
        </div>
        <span className="font-bold text-white text-sm leading-tight">
          Arcus <span className="text-blue-300">FP&A</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-4 py-2 text-xs transition-colors"
              style={{
                backgroundColor: active ? '#1e3a8a' : 'transparent',
                color: active ? '#ffffff' : '#a8c0f0',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#172d6e'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
              }}
            >
              <Icon size={13} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Collapse */}
      <div
        className="flex items-center gap-2 px-4 py-3 text-xs cursor-pointer border-t border-white/10"
        style={{ color: '#a8c0f0' }}
      >
        <ChevronLeft size={13} />
        <span>Collapse</span>
      </div>
    </aside>
  )
}
