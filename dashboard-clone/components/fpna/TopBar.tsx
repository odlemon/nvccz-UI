'use client'

import { Search, Bell, ChevronDown, Calendar } from 'lucide-react'

interface TopBarProps {
  title: string
  starred?: boolean
  scenario?: string
  version?: string
  period?: string
  entity?: string
}

export default function TopBar({
  title,
  scenario = 'Base Case',
  version = 'Working',
  period = 'May 2025',
  entity,
}: TopBarProps) {
  return (
    <header
      className="flex items-center h-11 px-4 border-b shrink-0 gap-3"
      style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-sm text-slate-800 truncate">{title}</span>
        <span className="text-slate-400 text-sm">☆</span>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs flex-1 max-w-xs"
        style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}
      >
        <Search size={12} />
        <span>Search models, reports, sheets...</span>
        <span className="ml-auto text-slate-300 text-xs">⌘ K</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Entity */}
        {entity && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
            style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
          >
            <span className="text-slate-400 text-xs">Entity</span>
            <span className="font-medium ml-1">{entity}</span>
            <ChevronDown size={10} />
          </div>
        )}

        {/* Scenario */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          <span className="text-slate-400 text-xs">Scenario</span>
          <span className="font-medium ml-1">{scenario}</span>
          <ChevronDown size={10} />
        </div>

        {/* Version */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          <span className="text-slate-400 text-xs">Version</span>
          <span className="font-medium ml-1">{version}</span>
          <ChevronDown size={10} />
        </div>

        {/* Period */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          <Calendar size={11} />
          <span className="font-medium">{period}</span>
        </div>

        {/* Bell */}
        <div className="relative cursor-pointer">
          <Bell size={16} className="text-slate-500" />
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center"
            style={{ backgroundColor: '#2563eb', fontSize: '8px' }}
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
        <ChevronDown size={12} className="text-slate-400" />
      </div>
    </header>
  )
}
