"use client"

import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchSecurities, setPriceDrawerTarget, setPriceDrawerOpen } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi, priceChange, type Security } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Building2, Circle, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "./page-header"
import { ExchangeTag, Delta } from "./status-pills"

const PAGE_SIZE = 15
const EXCHANGE_FILTERS = ["ALL", "ZSE", "VFEX", "SECZIM", "NYSE", "NASDAQ", "LSE"] as const
const CURRENCIES = ["USD", "ZWG", "GBP", "EUR", "ZAR"]

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "gain" | "muted" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone === "gain" ? "bg-gain-muted text-gain-foreground" : "bg-accent text-accent-foreground")}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

interface SecurityFormData {
  symbol: string
  name: string
  exchangeCode: string
  listingCurrencyCode: string
  isActive: boolean
}

const EMPTY_FORM: SecurityFormData = { symbol: "", name: "", exchangeCode: "ZSE", listingCurrencyCode: "USD", isActive: true }

export function SecuritiesMaster() {
  const dispatch = useAppDispatch()
  const { securities, securitiesLoading, latestPrices } = useAppSelector((s) => s.investments)

  const [search, setSearch] = useState("")
  const [exchangeFilter, setExchangeFilter] = useState<(typeof EXCHANGE_FILTERS)[number]>("ALL")
  const [onlyActive, setOnlyActive] = useState(false)
  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Security | null>(null)
  const [form, setForm] = useState<SecurityFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchSecurities())
  }, [dispatch])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return securities.filter((s) => {
      if (exchangeFilter !== "ALL" && s.exchangeCode !== exchangeFilter) return false
      if (onlyActive && !s.isActive) return false
      if (!q) return true
      return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.isin ?? "").toLowerCase().includes(q)
    })
  }, [securities, search, exchangeFilter, onlyActive])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, exchangeFilter, onlyActive])

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, safePage + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  const openEdit = (e: React.MouseEvent, s: Security) => {
    e.stopPropagation()
    setEditTarget(s)
    setForm({ symbol: s.symbol, name: s.name, exchangeCode: s.exchangeCode, listingCurrencyCode: s.listingCurrencyCode, isActive: s.isActive })
    setDialogOpen(true)
  }
  const openPriceDrawer = (s: Security) => { dispatch(setPriceDrawerTarget(s)); dispatch(setPriceDrawerOpen(true)) }
  const field = (key: keyof SecurityFormData, value: any) => setForm((p) => ({ ...p, [key]: value }))

  const handleSave = async () => {
    if (!form.symbol || !form.name) return
    setSaving(true)
    try {
      if (editTarget) {
        await investmentsApi.updateSecurity(editTarget.id, form)
        toast.success(`${form.symbol} updated`)
      } else {
        await investmentsApi.createSecurity(form)
        toast.success(`${form.symbol} added to securities master`)
      }
      dispatch(fetchSecurities())
      setDialogOpen(false)
    } catch (err: any) {
      toast.error("Save failed", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const activeCount = useMemo(() => securities.filter((s) => s.isActive).length, [securities])
  const exchangeCount = useMemo(() => new Set(securities.map((s) => s.exchangeCode)).size, [securities])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Securities Master"
        subtitle="Reference data for every tradable instrument across connected exchanges"
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Security
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Building2} label="Total instruments" value={String(securities.length)} />
        <Stat icon={Circle} label="Active" value={String(activeCount)} tone="gain" />
        <Stat icon={Circle} label="Inactive" value={String(securities.length - activeCount)} />
        <Stat icon={Building2} label="Exchanges" value={String(exchangeCount)} />
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
          {EXCHANGE_FILTERS.map((ex) => (
            <button
              key={ex}
              onClick={() => setExchangeFilter(ex)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                exchangeFilter === ex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {ex === "ALL" ? "All venues" : ex}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-border accent-[var(--primary)]" />
          Active only
        </label>
      </div>

      {/* Table */}
      {securitiesLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-center font-medium">Exchange</th>
                  <th className="px-4 py-3 text-center font-medium">Currency</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">ISIN</th>
                  <th className="px-4 py-3 text-right font-medium">Last price</th>
                  <th className="px-4 py-3 text-right font-medium">Chg%</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => {
                  const tick = latestPrices[s.symbol] ?? latestPrices[s.id]
                  const change = priceChange(tick)
                  return (
                    <tr key={s.id} onClick={() => openPriceDrawer(s)} className="group cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-foreground">{s.symbol}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-center">
                        <ExchangeTag exchange={s.exchangeCode} />
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{s.listingCurrencyCode}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{s.isin ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                        {tick ? change.price?.toFixed(4) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {tick ? <Delta value={change.pct} direction={change.direction} className="text-xs" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", s.isActive ? "bg-gain-muted text-gain-foreground" : "bg-muted text-muted-foreground")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.isActive ? "bg-gain" : "bg-muted-foreground")} />
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => openEdit(e, s)}
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
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">No securities match your filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages} · {filtered.length} securities</p>
              <div className="flex items-center gap-1">
                <button disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs", safePage === n ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground")}
                  >
                    {n}
                  </button>
                ))}
                <button disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit ${editTarget.symbol}` : "Add Security"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ticker Symbol</Label>
                <Input placeholder="CBZH" value={form.symbol} onChange={(e) => field("symbol", e.target.value.toUpperCase())} className="h-8 font-mono" disabled={!!editTarget} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exchange</Label>
                <Select value={form.exchangeCode} onValueChange={(v) => field("exchangeCode", v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXCHANGE_FILTERS.filter((e) => e !== "ALL").map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name</Label>
              <Input placeholder="CBZ Holdings Limited" value={form.name} onChange={(e) => field("name", e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Listing Currency</Label>
              <Select value={form.listingCurrencyCode} onValueChange={(v) => field("listingCurrencyCode", v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => field("isActive", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" onClick={handleSave} disabled={saving || !form.symbol || !form.name}>
              {saving ? "Saving…" : editTarget ? "Update" : "Add Security"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
