'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Layers, FileSpreadsheet, GitBranch, ArrowUpDown, Workflow, ChevronLeft
} from 'lucide-react'
import { useForecastingTheme } from './theme-provider'

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
  const { theme } = useForecastingTheme()
  const isDark = theme === 'dark'

  const logoBg = isDark ? '#0d1b4b' : '#ffffff'
  const logoBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
  const textMuted = isDark ? '#a8c0f0' : '#64748b'
  const textActive = isDark ? '#ffffff' : '#1e293b'
  const bgActive = isDark ? '#1e3a8a' : '#eef2ff'
  const bgHover = isDark ? '#172d6e' : '#f1f5f9'

  return (
    <aside
      className="flex flex-col h-full w-[160px] shrink-0"
      style={{ backgroundColor: logoBg, color: textMuted, borderRight: `1px solid ${logoBorder}` }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-4 py-4 border-b" style={{ borderColor: logoBorder }}>
        <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">A</span>
        </div>
        <span className="font-bold text-sm leading-tight" style={{ color: textActive }}>
          Arcus <span className="text-blue-400">FP&A</span>
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
                backgroundColor: active ? bgActive : 'transparent',
                color: active ? textActive : textMuted,
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = bgHover
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
        className="flex items-center gap-2 px-4 py-3 text-xs cursor-pointer border-t"
        style={{ color: textMuted, borderColor: logoBorder }}
      >
        <ChevronLeft size={13} />
        <span>Collapse</span>
      </div>
    </aside>
  )
}
