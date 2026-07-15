'use client'

import { useState } from 'react'
import { Search, Bell, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from './theme-toggle'
import { useThemeContainer } from './use-theme-container'

interface TopBarProps {
  title: string
  starred?: boolean
  scenario?: string
  version?: string
  period?: string
  entity?: string
}

const SCENARIO_OPTIONS = ['Base Case', 'Upside Case', 'Downside Case', 'FX Shock', 'Hiring Freeze']
const VERSION_OPTIONS = ['Working', 'Submitted', 'Approved', 'Locked']
const PERIOD_OPTIONS = ['Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025']

export default function TopBar({
  title,
  scenario = 'Base Case',
  version = 'Working',
  period = 'May 2025',
  entity,
}: TopBarProps) {
  const [scenarioVal, setScenarioVal] = useState(scenario)
  const [versionVal, setVersionVal] = useState(version)
  const [periodVal, setPeriodVal] = useState(period)
  const [search, setSearch] = useState('')
  const { ref: themeRef, container: themeContainer } = useThemeContainer()

  return (
    <header
      ref={themeRef}
      className="flex items-center h-11 px-4 border-b shrink-0 gap-3 bg-card"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{title}</span>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>☆</span>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs flex-1 max-w-xs"
        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <Search size={12} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models, reports, sheets..."
          className="bg-transparent outline-none flex-1 min-w-0"
          style={{ color: 'var(--foreground)' }}
        />
        <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>⌘ K</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Entity */}
        {entity && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--secondary-foreground)' }}
          >
            <span style={{ color: 'var(--muted-foreground)' }}>Entity</span>
            <span className="font-medium ml-1">{entity}</span>
          </div>
        )}

        {/* Scenario */}
        <Select value={scenarioVal} onValueChange={setScenarioVal}>
          <SelectTrigger className="h-7 rounded-full text-xs" size="sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Scenario&nbsp;</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={themeContainer}>
            {SCENARIO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Version */}
        <Select value={versionVal} onValueChange={setVersionVal}>
          <SelectTrigger className="h-7 rounded-full text-xs" size="sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Version&nbsp;</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={themeContainer}>
            {VERSION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Period */}
        <Select value={periodVal} onValueChange={setPeriodVal}>
          <SelectTrigger className="h-7 rounded-full text-xs" size="sm">
            <Calendar size={11} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={themeContainer}>
            {PERIOD_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>

        <ThemeToggle />

        {/* Bell */}
        <div className="relative cursor-pointer">
          <Bell size={16} style={{ color: 'var(--muted-foreground)' }} />
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary)', fontSize: '8px' }}
          >
            2
          </span>
        </div>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
          style={{ backgroundColor: '#6366f1' }}
        >
          JC
        </div>
      </div>
    </header>
  )
}
