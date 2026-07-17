'use client'

import { Moon, Sun } from 'lucide-react'
import { useInvestmentsTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useInvestmentsTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:bg-accent hover:text-accent-foreground"
      style={{
        background: 'var(--secondary)',
        color: 'var(--muted-foreground)',
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'light'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
