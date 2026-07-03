"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, ListChecks, Layers, ShieldCheck, Database,
  Hexagon, ChevronRight, Search, Bell, Settings, CircleDot,
} from "lucide-react"
import { Input } from "@/components/ui/input"

const NAV = [
  { section: "Terminal", items: [
    { href: "/", label: "Market Terminal", icon: LayoutDashboard },
    { href: "/trades", label: "Trade Blotter", icon: ListChecks },
    { href: "/securities", label: "Securities Master", icon: Layers },
  ]},
  { section: "Market Data Admin", items: [
    { href: "/market-data/validation", label: "Validation Queue", icon: ShieldCheck },
    { href: "/market-data/batches", label: "Ingest Batches", icon: Database },
  ]},
]

export function InvestmentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar sticky top-0 h-screen">
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
              <Hexagon className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">Arcus Asset</p>
              <p className="text-[11px] text-muted-foreground">Market Terminal</p>
            </div>
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account context card */}
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Desk</span>
              <span className="font-mono font-semibold text-foreground">TRADE-OPS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session</span>
              <span className="inline-flex items-center gap-1 font-medium text-gain-foreground">
                <CircleDot className="h-3 w-3 text-gain" /> Live
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-mono text-foreground">Internal Settle</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
            RN
          </span>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Rufaro Ncube</p>
            <p className="text-[11px] text-muted-foreground truncate">Global Fund Manager</p>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search securities, trades, refs…"
              className="h-9 rounded-full bg-card pl-9 text-sm"
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-loss" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
