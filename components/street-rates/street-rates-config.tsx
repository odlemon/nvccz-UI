"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchConfigs, setConfigDrawerOpen, setConfigDrawerTarget,
  setConfigViewOpen, setConfigViewTarget, runIngest, postManualQuote,
} from "@/lib/store/slices/streetRatesSlice"
import { ConfigEditDrawer } from "./config-edit-drawer"
import { ConfigViewDrawer } from "./config-view-drawer"
import { EmptyState } from "./empty-state"
import type { ExchangeRateDisplayConfig } from "@/lib/api/exchange-rate-display-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CURRENCIES } from "./format"
import { RefreshCw, SlidersHorizontal, ArrowLeftRight, Search, Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { toast } from "sonner"

const PAGE_SIZE = 15

type SortKey = "contextCode" | "pair" | "primarySourceCode" | "comparisonSourceCode" | "decimals" | "sortOrder" | "isActive"

const COLUMNS: { label: string; key: SortKey }[] = [
  { label: "Context", key: "contextCode" },
  { label: "Pair", key: "pair" },
  { label: "Primary Source", key: "primarySourceCode" },
  { label: "Comparison Source", key: "comparisonSourceCode" },
  { label: "Decimals", key: "decimals" },
  { label: "Order", key: "sortOrder" },
  { label: "Active", key: "isActive" },
]

const SORT_ACCESSORS: Record<SortKey, (c: ExchangeRateDisplayConfig) => string | number | boolean> = {
  contextCode: (c) => c.contextCode,
  pair: (c) => `${c.fromCurrencyCode}/${c.toCurrencyCode}`,
  primarySourceCode: (c) => c.primarySourceCode,
  comparisonSourceCode: (c) => c.comparisonSourceCode,
  decimals: (c) => c.displayFormat?.decimals ?? 0,
  sortOrder: (c) => c.sortOrder,
  isActive: (c) => c.isActive,
}

function ManualQuoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const dispatch = useAppDispatch()
  const { manualQuoteSubmitting } = useAppSelector((s) => s.streetRates)
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("ZWG")
  const [avg, setAvg] = useState("")
  const [bid, setBid] = useState("")
  const [ask, setAsk] = useState("")
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10))

  const handleSubmit = async () => {
    try {
      await dispatch(postManualQuote({
        fromCurrencyCode: from,
        toCurrencyCode: to,
        avg: Number(avg),
        bid: Number(bid || avg),
        ask: Number(ask || avg),
        asOfDate,
      })).unwrap()
      toast.success("Manual quote posted")
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to post quote", { description: err.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Quote Override</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">From Currency</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-8 font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Currency</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-8 font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Avg</Label>
              <Input type="number" value={avg} onChange={(e) => setAvg(e.target.value)} className="h-8 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bid</Label>
              <Input type="number" value={bid} onChange={(e) => setBid(e.target.value)} className="h-8 font-mono" placeholder={avg} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ask</Label>
              <Input type="number" value={ask} onChange={(e) => setAsk(e.target.value)} className="h-8 font-mono" placeholder={avg} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">As Of Date</Label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="h-8" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={!avg || manualQuoteSubmitting}>
            {manualQuoteSubmitting ? "Posting…" : "Post Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActivePill({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  )
}

export function StreetRatesConfig() {
  const dispatch = useAppDispatch()
  const { configs, configsLoading, ingestRunning } = useAppSelector((s) => s.streetRates)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("street-rates", "street-rates-config")
  const [manualQuoteOpen, setManualQuoteOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null)

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null
      }
      return { key, direction: "asc" }
    })
  }

  useEffect(() => {
    dispatch(fetchConfigs())
  }, [dispatch])

  const openCreate = () => {
    dispatch(setConfigDrawerTarget(null))
    dispatch(setConfigDrawerOpen(true))
  }

  const openView = (config: ExchangeRateDisplayConfig) => {
    dispatch(setConfigViewTarget(config))
    dispatch(setConfigViewOpen(true))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return configs
    return configs.filter((c) =>
      c.contextCode.toLowerCase().includes(q) ||
      c.primarySourceCode.toLowerCase().includes(q) ||
      c.comparisonSourceCode.toLowerCase().includes(q) ||
      `${c.fromCurrencyCode}/${c.toCurrencyCode}`.toLowerCase().includes(q)
    )
  }, [configs, search])

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered
    const accessor = SORT_ACCESSORS[sortConfig.key]
    return [...filtered].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, sortConfig])

  const pageNumbers = useMemo(() => {
    const delta = 2
    const start = Math.max(1, safePage - delta)
    const end = Math.min(totalPages, safePage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Street Rates Configuration</h1>
          <p className="text-sm text-muted-foreground">
            {configs.length} configurations · {filtered.length} shown
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full h-9 bg-white" onClick={() => setManualQuoteOpen(true)}>
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> Manual Quote
            </Button>
            <Button
              variant="outline" size="sm" className="rounded-full h-9 bg-white"
              onClick={() => dispatch(runIngest())}
              disabled={ingestRunning}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${ingestRunning ? "animate-spin" : ""}`} />
              {ingestRunning ? "Running…" : "Force Ingest Run"}
            </Button>
            <Button size="sm" className="rounded-full h-9 gradient-primary text-white shadow" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Configuration
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search context, source, pair…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
        />
      </div>

      {/* Table */}
      {configsLoading ? (
        <Card className="bg-white border border-gray-200 shadow-none p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={search ? "No configurations match your search" : "No Exchange Rate Configurations Found"}
          description={
            search
              ? "Try adjusting your search terms."
              : "Create your first configuration to begin displaying street exchange rates throughout the application."
          }
          actionLabel={!search && isAdmin ? "Create Configuration" : undefined}
          onAction={!search && isAdmin ? openCreate : undefined}
        />
      ) : (
        <Card className="bg-white border border-gray-200 shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortConfig?.key === col.key && (
                          sortConfig.direction === "asc"
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/20 cursor-pointer transition-colors"
                    onClick={() => openView(c)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900">{c.contextCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700">{c.fromCurrencyCode}/{c.toCurrencyCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600">{c.primarySourceCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600">{c.comparisonSourceCode}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.displayFormat?.decimals ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{c.sortOrder}</td>
                    <td className="px-4 py-3"><ActivePill active={c.isActive} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {filtered.length} configurations
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
                    className={`h-7 w-7 p-0 rounded-full text-xs ${safePage === n ? "gradient-primary text-white" : "bg-white"}`}
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

      <ConfigViewDrawer />
      <ConfigEditDrawer />
      <ManualQuoteDialog open={manualQuoteOpen} onOpenChange={setManualQuoteOpen} />
    </div>
  )
}
