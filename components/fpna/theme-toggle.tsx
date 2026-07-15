'use client'

import { Sun, Moon } from 'lucide-react'
import { useForecastingTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useForecastingTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
      style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
