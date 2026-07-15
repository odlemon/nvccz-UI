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
import { Plus, Search, Pencil } from "lucide-react"
import { toast } from "sonner"
import { ExchangeTag, Delta } from "./status-pills"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { TerminalStatCard } from "@/components/investments/terminal/stat-card"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { TerminalStatusBadge } from "@/components/investments/terminal/status-badge"
import { CategoryPill } from "@/components/investments/terminal/category-pill"
import { TerminalPagination } from "@/components/investments/terminal/pagination"

const PAGE_SIZE = 15
const EXCHANGE_FILTERS = ["ALL", "ZSE", "VFEX", "SECZIM", "NYSE", "NASDAQ", "LSE"] as const
const CURRENCIES = ["USD", "ZWG", "GBP", "EUR", "ZAR"]

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
  const currencyCount = useMemo(() => new Set(securities.map((s) => s.listingCurrencyCode)).size, [securities])

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Instruments"
        subtitle="Reference data for every tradable instrument across connected exchanges"
        actions={
          <Button size="pill" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Security
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Total" value={String(securities.length)} subValue="Instruments in master" />
        <TerminalStatCard label="Active" value={String(activeCount)} subValue={`${securities.length - activeCount} inactive`} />
        <TerminalStatCard label="Exchanges Covered" value={String(exchangeCount)} subValue="Connected venues" />
        <TerminalStatCard label="Currencies Covered" value={String(currencyCount)} subValue="Listing currencies" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, name, ISIN…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {EXCHANGE_FILTERS.map((ex) => (
            <CategoryPill
              key={ex}
              label={ex === "ALL" ? "All venues" : ex}
              active={exchangeFilter === ex}
              onClick={() => setExchangeFilter(ex)}
            />
          ))}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-border accent-[var(--primary)]" />
          Active only
        </label>
      </div>

      {/* Table */}
      {securitiesLoading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable className="min-w-[900px]">
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Symbol</TerminalTh>
                <TerminalTh>Name</TerminalTh>
                <TerminalTh align="center">Exchange</TerminalTh>
                <TerminalTh align="center">Currency</TerminalTh>
                <TerminalTh className="hidden lg:table-cell">ISIN</TerminalTh>
                <TerminalTh align="right">Last price</TerminalTh>
                <TerminalTh align="right">Chg%</TerminalTh>
                <TerminalTh align="center">Status</TerminalTh>
                <TerminalTh />
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {paginated.map((s) => {
                const tick = latestPrices[s.symbol] ?? latestPrices[s.id]
                const change = priceChange(tick)
                return (
                  <TerminalTr key={s.id} clickable onClick={() => openPriceDrawer(s)} className="group">
                    <TerminalTd mono className="font-semibold">{s.symbol}</TerminalTd>
                    <TerminalTd>{s.name}</TerminalTd>
                    <TerminalTd align="center"><ExchangeTag exchange={s.exchangeCode} /></TerminalTd>
                    <TerminalTd align="center" mono className="text-muted-foreground">{s.listingCurrencyCode}</TerminalTd>
                    <TerminalTd mono className="hidden text-muted-foreground lg:table-cell">{s.isin ?? "—"}</TerminalTd>
                    <TerminalTd align="right" mono>
                      {tick ? change.price?.toFixed(4) : <span className="text-muted-foreground">—</span>}
                    </TerminalTd>
                    <TerminalTd align="right">
                      {tick ? <Delta value={change.pct} direction={change.direction} className="text-xs" /> : <span className="text-muted-foreground">—</span>}
                    </TerminalTd>
                    <TerminalTd align="center">
                      <TerminalStatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} />
                    </TerminalTd>
                    <TerminalTd align="right">
                      <button
                        onClick={(e) => openEdit(e, s)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        aria-label={`Edit ${s.symbol}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </TerminalTd>
                  </TerminalTr>
                )
              })}
              {filtered.length === 0 && <TerminalEmptyRow colSpan={9}>No securities match your filters</TerminalEmptyRow>}
            </tbody>
          </TerminalTable>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages} · {filtered.length} securities</p>
              <TerminalPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </TerminalCard>
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
            <Button onClick={handleSave} disabled={saving || !form.symbol || !form.name}>
              {saving ? "Saving…" : editTarget ? "Update" : "Add Security"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
