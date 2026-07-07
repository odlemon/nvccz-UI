'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function InvestmentsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('investments-v2-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('investments-v2-theme', newTheme)
  }

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
