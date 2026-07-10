'use client'

import { ThemeToggle } from '@/components/investments-v2/theme-toggle'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h1 className="text-white text-[18px] font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  )
}
