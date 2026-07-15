"use client"

import type { ReactNode } from "react"
import { RefreshCw, Search, Bell, Settings, Sun, Moon } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useInvestmentsTheme } from "./theme-provider"

const PERIODS = ["MTD", "QTD", "YTD"] as const

interface TerminalTopbarProps {
  title: ReactNode
  subtitle?: ReactNode
  showPeriod?: boolean
  period?: (typeof PERIODS)[number]
  onPeriodChange?: (period: (typeof PERIODS)[number]) => void
  showRecalculate?: boolean
  onRecalculate?: () => void
  recalculating?: boolean
  actions?: ReactNode
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  className?: string
}

/**
 * Page-local header rendered at the top of each page's own content.
 * This is distinct from the global SharedTopbar rendered by InvestmentsLayout.
 */
export function TerminalTopbar({
  title,
  subtitle,
  showPeriod,
  period = "MTD",
  onPeriodChange,
  showRecalculate,
  onRecalculate,
  recalculating,
  actions,
  onSearch,
  searchPlaceholder = "Search…",
  className,
}: TerminalTopbarProps) {
  const { theme, toggleTheme } = useInvestmentsTheme()
  const router = useRouter()

  return (
    <div className={cn("flex flex-col gap-3 border-b border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}

        {showPeriod && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange?.(p)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {showRecalculate && (
          <button
            type="button"
            onClick={onRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", recalculating && "animate-spin")} />
            Recalculate
          </button>
        )}

        {actions}

        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push("/investments/setup")}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </div>
  )
}
