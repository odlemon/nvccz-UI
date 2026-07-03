"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Plus, Search, Building2, Circle, Pencil } from "lucide-react"
import { money } from "@/lib/investments/format"
import { LATEST_PRICES, SECURITIES, type ExchangeCode, type Security } from "@/lib/investments/mock-data"
import { PageHeader } from "@/components/investments/page-header"
import { Delta, ExchangeTag } from "@/components/investments/status-pills"
import { SecurityDetailDrawer } from "@/components/investments/security-detail-drawer"
import { SecurityFormDialog } from "@/components/investments/security-form-dialog"

const EXCHANGES: (ExchangeCode | "ALL")[] = ["ALL", "ZSE", "VFEX", "SECZIM", "NASDAQ", "LSE"]

export function SecuritiesMaster() {
  const [search, setSearch] = useState("")
  const [exchange, setExchange] = useState<ExchangeCode | "ALL">("ALL")
  const [onlyActive, setOnlyActive] = useState(false)
  const [selected, setSelected] = useState<Security | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Security | null>(null)

  function openDrawer(s: Security) {
    setSelected(s)
    setDrawerOpen(true)
  }
  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(s: Security) {
    setEditing(s)
    setFormOpen(true)
  }

  const filtered = useMemo(() => {
    return SECURITIES.filter((s) => {
      if (exchange !== "ALL" && s.exchangeCode !== exchange) return false
      if (onlyActive && !s.isActive) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.isin ?? "").toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, exchange, onlyActive])

  const active = SECURITIES.filter((s) => s.isActive).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Securities Master"
        subtitle="Reference data for every tradable instrument across connected exchanges"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Security
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Building2} label="Total instruments" value={String(SECURITIES.length)} />
        <Stat icon={Circle} label="Active" value={String(active)} tone="gain" />
        <Stat icon={Circle} label="Inactive" value={String(SECURITIES.length - active)} tone="muted" />
        <Stat icon={Building2} label="Exchanges" value={String(new Set(SECURITIES.map((s) => s.exchangeCode)).size)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, name, ISIN…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {EXCHANGES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExchange(ex)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                exchange === ex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {ex === "ALL" ? "All venues" : ex}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--primary)]"
          />
          Active only
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Symbol</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-center font-medium">Exchange</th>
                <th className="px-4 py-3 text-center font-medium">Currency</th>
                <th className="px-4 py-3 text-left font-medium">ISIN</th>
                <th className="px-4 py-3 text-right font-medium">Last price</th>
                <th className="px-4 py-3 text-right font-medium">Chg%</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const tick = LATEST_PRICES[s.symbol]
                return (
                  <tr
                    key={s.id}
                    onClick={() => openDrawer(s)}
                    className="group cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-foreground">{s.symbol}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-center">
                      <ExchangeTag code={s.exchangeCode} />
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                      {s.listingCurrencyCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.isin ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                      {tick ? money(tick.price) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tick ? <Delta value={tick.changePct} className="text-xs" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          s.isActive ? "bg-gain-muted text-gain-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.isActive ? "bg-gain" : "bg-muted-foreground")} />
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(s)
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        aria-label={`Edit ${s.symbol}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No securities match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SecurityDetailDrawer
        security={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={openEdit}
      />
      <SecurityFormDialog open={formOpen} onOpenChange={setFormOpen} security={editing} />
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: "gain" | "muted"
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          tone === "gain" ? "bg-gain-muted text-gain-foreground" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
