'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'

/** Module root selectors that should receive the dark class for full-module theming */
const MODULE_ROOT_SELECTORS = [
  '#app',
  '.app',
  '.performance-v22-root',
  '.portfolio-v11-root',
  '.payroll-v6-root',
  '.procurement-v23-root',
  '.accounting-v52-root',
  '.home-v3-root',
  '.investments-terminal',
  '.events-root',
  '.street-rates-root',
  '.forecasting-root',
  '.fundraising-root',
  '.fundraising-kyc-root',
].join(', ')

function propagateDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
  document.querySelectorAll(MODULE_ROOT_SELECTORS).forEach((el) => {
    el.classList.toggle('dark', isDark)
  })
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function InvestmentsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Sync with the global arcus-theme preference
    const savedGlobal = localStorage.getItem('arcus-theme') as Theme | null
    const savedLocal = localStorage.getItem('investments-v2-theme') as Theme | null
    const initial = savedLocal || savedGlobal || 'dark'
    setTheme(initial)
    localStorage.setItem('investments-v2-theme', initial)
    propagateDarkClass(initial === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('investments-v2-theme', next)
      localStorage.setItem('arcus-theme', next)
      propagateDarkClass(next === 'dark')
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`investments-terminal ${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useInvestmentsTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useInvestmentsTheme must be used within InvestmentsThemeProvider')
  }
  return context
}
