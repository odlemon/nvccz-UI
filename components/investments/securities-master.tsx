"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchSecurities } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi, type Security } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Search, RefreshCw, Pencil, ChevronLeft, ChevronRight,
  Building2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15
const EXCHANGES = ["ZSE", "VFEX", "SECZIM", "NYSE", "NASDAQ", "LSE"] as const
const CURRENCIES = ["USD", "ZWG", "GBP", "EUR", "ZAR"]

// ─── Exchange badge ───────────────────────────────────────────────────────────
const EXCHANGE_COLORS: Record<string, string> = {
  ZSE:    "border-emerald-300 text-emerald-700 bg-emerald-50",
  VFEX:   "border-sky-300 text-sky-700 bg-sky-50",
  NYSE:   "border-blue-300 text-blue-700 bg-blue-50",
  NASDAQ: "border-violet-300 text-violet-700 bg-violet-50",
  LSE:    "border-rose-300 text-rose-700 bg-rose-50",
  SECZIM: "border-amber-300 text-amber-700 bg-amber-50",
}

function ExchangePill({ code }: { code: string }) {
  const cls = EXCHANGE_COLORS[code] ?? "border-gray-300 text-gray-600 bg-gray-50"
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {code}
    </span>
  )
}

// ─── Form data ────────────────────────────────────────────────────────────────
interface SecurityFormData {
  symbol: string
  name: string
  exchangeCode: string
  listingCurrencyCode: string
  isActive: boolean
}

const EMPTY_FORM: SecurityFormData = {
  symbol: "",
  name: "",
  exchangeCode: "ZSE",
  listingCurrencyCode: "USD",
  isActive: true,
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SecuritiesMaster() {
  const dispatch = useAppDispatch()
  const { securities, securitiesLoading } = useAppSelector((s) => s.investments)

  const [search, setSearch]               = useState("")
  const [exchangeFilter, setExchangeFilter] = useState("ALL")
  const [currencyFilter, setCurrencyFilter] = useState("ALL")
  const [page, setPage]                   = useState(1)

  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editTarget, setEditTarget]     = useState<Security | null>(null)
  const [form, setForm]                 = useState<SecurityFormData>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    dispatch(fetchSecurities())
  }, [dispatch])

  // Derived unique exchange list for filter dropdown
  const uniqueExchanges = useMemo(
    () => Array.from(new Set(securities.map((s) => s.exchangeCode))).sort(),
    [securities]
  )

  const uniqueCurrencies = useMemo(
    () => Array.from(new Set(securities.map((s) => s.listingCurrencyCode))).sort(),
    [securities]
  )

  // Client-side filter + paginate
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return securities.filter((s) => {
      const matchSearch =
        !q ||
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.isin ?? "").toLowerCase().includes(q)
      const matchExchange  = exchangeFilter === "ALL" || s.exchangeCode === exchangeFilter
      const matchCurrency  = currencyFilter === "ALL" || s.listingCurrencyCode === currencyFilter
      return matchSearch && matchExchange && matchCurrency
    })
  }, [securities, search, exchangeFilter, currencyFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, exchangeFilter, currencyFilter])

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (s: Security) => {
    setEditTarget(s)
    setForm({
      symbol: s.symbol,
      name: s.name,
      exchangeCode: s.exchangeCode,
      listingCurrencyCode: s.listingCurrencyCode,
      isActive: s.isActive,
    })
    setDialogOpen(true)
  }

  const field = (key: keyof SecurityFormData, value: any) =>
    setForm((p) => ({ ...p, [key]: value }))

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

  // ── Page numbers helper ─────────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    const delta = 2
    const start = Math.max(1, safePage - delta)
    const end   = Math.min(totalPages, safePage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Securities Master</h1>
          <p className="text-sm text-muted-foreground">
            {securities.length} instruments · {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="rounded-full h-9 bg-white"
            onClick={() => dispatch(fetchSecurities())}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm" className="rounded-full h-9 gradient-primary text-white shadow"
            onClick={openAdd}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Security
          </Button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search ticker, name, ISIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
          />
        </div>

        {/* Exchange filter */}
        <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs rounded-full bg-white border-gray-200">
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="Exchange" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All exchanges</SelectItem>
            {uniqueExchanges.map((ex) => (
              <SelectItem key={ex} value={ex}>{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Currency filter */}
        {uniqueCurrencies.length > 1 && (
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[110px] text-xs rounded-full bg-white border-gray-200">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All currencies</SelectItem>
              {uniqueCurrencies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {securitiesLoading ? (
        <Card className="bg-white border border-gray-200 shadow-sm p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </Card>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search || exchangeFilter !== "ALL" ? "No securities match your filters" : "No securities yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || exchangeFilter !== "ALL"
              ? "Try adjusting your search or filter criteria"
              : "Add your first security to get started"}
          </p>
          {!search && exchangeFilter === "ALL" && (
            <Button size="sm" className="mt-4 rounded-full gradient-primary text-white h-9" onClick={openAdd}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Security
            </Button>
          )}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Ticker", "Company Name", "Exchange", "ISIN", "Currency", "Active", ""].map((h) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                        h === "ISIN" ? "hidden lg:table-cell" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900">{s.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 truncate max-w-[220px]">{s.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ExchangePill code={s.exchangeCode} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-gray-500">{s.isin ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-700">{s.listingCurrencyCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-2 h-2 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {filtered.length} securities
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                {pageNumbers.map((n) => (
                  <Button
                    key={n}
                    variant={safePage === n ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full text-xs ${
                      safePage === n ? "gradient-primary text-white" : "bg-white"
                    }`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Add / Edit dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit ${editTarget.symbol}` : "Add Security"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ticker Symbol</Label>
                <Input
                  placeholder="CBZH"
                  value={form.symbol}
                  onChange={(e) => field("symbol", e.target.value.toUpperCase())}
                  className="h-8 font-mono"
                  disabled={!!editTarget}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exchange</Label>
                <Select value={form.exchangeCode} onValueChange={(v) => field("exchangeCode", v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXCHANGES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name</Label>
              <Input
                placeholder="CBZ Holdings Limited"
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                className="h-8"
              />
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
            <Button
              className="gradient-primary text-white"
              onClick={handleSave}
              disabled={saving || !form.symbol || !form.name}
            >
              {saving ? "Saving…" : editTarget ? "Update" : "Add Security"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
