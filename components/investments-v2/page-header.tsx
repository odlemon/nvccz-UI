'use client'

import { ThemeToggle } from './theme-toggle'

interface PageHeaderProps {
  title: string
  actions?: React.ReactNode
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <h1 className="font-semibold" style={{ fontSize: '15px', color: 'var(--foreground)' }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </div>
  )
}
