"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type TerminalTheme = "dark" | "light"

const STORAGE_KEY = "investments-terminal-theme"

interface TerminalThemeContextValue {
  theme: TerminalTheme
  toggleTheme: () => void
  setTheme: (theme: TerminalTheme) => void
}

const TerminalThemeContext = createContext<TerminalThemeContextValue | null>(null)

export function InvestmentsThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<TerminalTheme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "dark" || stored === "light") setThemeState(stored)
    setMounted(true)
  }, [])

  const setTheme = (next: TerminalTheme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <TerminalThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={cn("investments-terminal", theme, !mounted && "invisible")} suppressHydrationWarning>
        {children}
      </div>
    </TerminalThemeContext.Provider>
  )
}

export function useInvestmentsTheme() {
  const ctx = useContext(TerminalThemeContext)
  if (!ctx) throw new Error("useInvestmentsTheme must be used within InvestmentsThemeProvider")
  return ctx
}
