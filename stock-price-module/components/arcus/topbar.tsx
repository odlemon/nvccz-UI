'use client'

import { Bell, Settings, Moon, Search } from 'lucide-react'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h1 className="text-white text-[18px] font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search here..."
            className="bg-transparent outline-none text-[#94a3b8] w-36 placeholder:text-[#64748b]"
            style={{ fontSize: '12px' }}
          />
        </div>
        {/* Bell */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center relative" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Bell className="w-4 h-4" style={{ color: '#94a3b8' }} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
        </button>
        {/* Settings */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Settings className="w-4 h-4" style={{ color: '#94a3b8' }} />
        </button>
        {/* Dark mode toggle */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1e2330' }}>
          <Moon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
