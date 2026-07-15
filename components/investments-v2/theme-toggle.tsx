'use client'

import { Moon, Sun } from 'lucide-react'
import { useInvestmentsTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useInvestmentsTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:opacity-80"
      style={{
        background: 'var(--secondary)',
        color: 'var(--muted-foreground)',
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
