"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { format, parseISO } from "date-fns"
import {
  ChevronDown, ChevronRight, RefreshCw, Loader2, TrendingUp, TrendingDown,
  CalendarIcon, Maximize2, Minimize2, Search, X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchScenarioGrid, editCell,
  setGridPeriodStart, setGridPeriodEnd,
  setGridIncludeVariance, setGridIncludeActuals,
} from "@/lib/store/slices/forecastingSlice"
import type { ForecastGridRow } from "@/lib/api/forecasting-api"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—"
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (abs >= 1_000)     return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// ─── Month picker ─────────────────────────────────────────────────────────────
function MonthPicker({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value + "-01") : undefined

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-gray-500 whitespace-nowrap">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline" size="sm"
            className={cn(
              "h-8 w-36 justify-start text-left text-xs font-normal rounded-lg border-gray-200 bg-white shadow-sm",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
            {value ? format(parseISO(value + "-01"), "MMM yyyy") : "Pick month"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={d => { if (d) { onChange(format(d, "yyyy-MM")); setOpen(false) } }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Cell hover detail ────────────────────────────────────────────────────────
function CellDetail({ cell, accountName, period }: { cell: any; accountName: string; period: string }) {
  return (
    <div className="text-xs space-y-1.5 w-48">
      <p className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 mb-1.5 truncate">{accountName}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <span className="text-gray-400">Period</span>      <span className="font-mono font-medium text-gray-800">{period}</span>
        <span className="text-gray-400">Forecast</span>    <span className="font-mono font-medium text-gray-800">{fmtNum(cell?.amount)}</span>
        {cell?.actual_value != null && (
          <><span className="text-gray-400">Actual</span>  <span className="font-mono font-medium text-gray-800">{fmtNum(cell.actual_value)}</span></>
        )}
        {cell?.variance != null && (
          <><span className="text-gray-400">Variance</span>
          <span className={`font-mono font-medium ${cell.variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {cell.variance >= 0 ? "+" : ""}{fmtNum(cell.variance)}
          </span></>
        )}
        {cell?.variance_pct != null && (
          <><span className="text-gray-400">Var %</span>
          <span className={`font-mono font-medium ${cell.variance_pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {cell.variance_pct >= 0 ? "+" : ""}{cell.variance_pct.toFixed(1)}%
          </span></>
        )}
        <span className="text-gray-400">Currency</span>   <span className="font-mono font-medium text-gray-800">{cell?.currency_code ?? "—"}</span>
        {cell?.is_manual_override && (
          <><span className="text-gray-400">Type</span>   <span className="text-amber-600 font-semibold">Manual Override</span></>
        )}
      </div>
    </div>
  )
}

// ─── Single grid row ──────────────────────────────────────────────────────────
interface EditingCell { accountId: string; periodKey: string; value: string }

function GridRow({
  row, periods, isLocked, includeActuals, includeVariance, searchTerm,
  editingCell, onStartEdit, onCommitEdit, onCancelEdit, onEditChange,
}: {
  row: ForecastGridRow; periods: string[]; isLocked: boolean
  includeActuals: boolean; includeVariance: boolean; searchTerm: string
  editingCell: EditingCell | null
  onStartEdit: (aid: string, pk: string, val: number) => void
  onCommitEdit: (aid: string, pk: string, val: string) => void
  onCancelEdit: () => void
  onEditChange: (v: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const nowKey = new Date().toISOString().slice(0, 7)
  const isEditing = (pk: string) =>
    editingCell?.accountId === row.account_id && editingCell?.periodKey === pk

  const matchesSearch = !searchTerm || (
    row.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (row.account_code ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  )
  if (!matchesSearch) return null

  return (
    <TooltipProvider delayDuration={600}>
      <tr className={`border-b border-gray-100 group transition-colors ${
        row.is_group ? "bg-gray-50 hover:bg-gray-100/70" : "bg-white hover:bg-blue-50/20"
      }`}>
        {/* Sticky account column */}
        <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-3 py-0" style={{ minWidth: 264 }}>
          <div className="flex items-center gap-1.5 py-2.5">
            {row.is_group ? (
              <button onClick={() => setCollapsed(c => !c)}
                className="w-4 h-4 shrink-0 text-gray-400 hover:text-gray-700 transition-colors">
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : <span className="w-4 shrink-0" />}
            <div className="min-w-0">
              {row.account_code && (
                <span className="text-[10px] text-gray-400 font-mono block leading-none mb-0.5">
                  {row.account_code}
                </span>
              )}
              <span className={`text-xs font-mono block truncate ${
                row.is_group ? "font-bold text-gray-800" : "text-gray-700"
              }`}>
                {row.account_name}
              </span>
            </div>
          </div>
        </td>

        {/* Period cells */}
        {periods.map(period => {
          const cell      = row.cells?.[period]
          const amount    = cell?.amount ?? null
          const actual    = cell?.actual_value
          const variance  = cell?.variance
          const varPct    = cell?.variance_pct
          const isOverride = cell?.is_manual_override
          const isPast    = period < nowKey
          const canEdit   = !isLocked && !isPast && !row.is_group

          return (
            <td key={period}
              className={`px-2 py-0 text-right border-r border-gray-100 last:border-r-0 ${isPast ? "bg-gray-50/50" : ""}`}
              style={{ minWidth: 110 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="py-2">
                    {isEditing(period) ? (
                      <input
                        autoFocus
                        className="w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-right text-xs font-mono text-blue-900 outline-none ring-1 ring-blue-300"
                        value={editingCell!.value}
                        onChange={e => onEditChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter")  onCommitEdit(row.account_id, period, editingCell!.value)
                          if (e.key === "Escape") onCancelEdit()
                        }}
                        onBlur={() => onCommitEdit(row.account_id, period, editingCell!.value)}
                      />
                    ) : (
                      <div
                        className={cn(
                          "text-xs font-mono leading-snug select-none",
                          isOverride    ? "text-amber-600 font-semibold" :
                          row.is_group  ? "text-gray-900 font-bold" :
                          isPast        ? "text-gray-400" : "text-gray-800",
                          canEdit && "rounded px-1 -mx-1 hover:bg-blue-100/60 hover:text-blue-900 cursor-text transition-colors"
                        )}
                        onDoubleClick={() => canEdit && onStartEdit(row.account_id, period, amount ?? 0)}
                      >
                        {amount != null ? fmtNum(amount) : <span className="text-gray-200">—</span>}
                      </div>
                    )}

                    {includeActuals && actual != null && !isEditing(period) && (
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5 text-right">A: {fmtNum(actual)}</div>
                    )}

                    {includeVariance && variance != null && !isEditing(period) && (
                      <div className={cn(
                        "flex items-center justify-end gap-0.5 text-[10px] font-mono mt-0.5",
                        variance >= 0 ? "text-emerald-600" : "text-red-500"
                      )}>
                        {variance >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>{fmtNum(Math.abs(variance))}</span>
                        {varPct != null && <span className="opacity-60">({varPct.toFixed(1)}%)</span>}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {cell && (
                  <TooltipContent side="top" className="bg-white border border-gray-200 shadow-lg p-3 z-50">
                    <CellDetail cell={cell} accountName={row.account_name} period={period} />
                  </TooltipContent>
                )}
              </Tooltip>
            </td>
          )
        })}
      </tr>
    </TooltipProvider>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ScenarioGrid({ scenarioId, isLocked }: { scenarioId: string; isLocked: boolean }) {
  const dispatch = useDispatch<AppDispatch>()
  const {
    gridRows, gridPeriods, gridLoading,
    gridPeriodStart, gridPeriodEnd,
    gridIncludeVariance, gridIncludeActuals,
  } = useSelector((state: RootState) => state.forecasting)

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [savingCell,  setSavingCell]  = useState(false)
  const [searchTerm,  setSearchTerm]  = useState("")
  const [fullscreen,  setFullscreen]  = useState(false)

  const loadGrid = useCallback(() => {
    dispatch(fetchScenarioGrid({
      id: scenarioId,
      params: {
        period_start:     gridPeriodStart || undefined,
        period_end:       gridPeriodEnd   || undefined,
        include_actuals:  gridIncludeActuals,
        include_variance: gridIncludeVariance,
      },
    }))
  }, [dispatch, scenarioId, gridPeriodStart, gridPeriodEnd, gridIncludeActuals, gridIncludeVariance])

  useEffect(() => { if (scenarioId) loadGrid() }, [scenarioId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && fullscreen) setFullscreen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  const handleCommitEdit = async (accountId: string, periodKey: string, value: string) => {
    const numVal = parseFloat(value.replace(/,/g, ""))
    if (isNaN(numVal)) { setEditingCell(null); return }
    setEditingCell(null)
    setSavingCell(true)
    try {
      await dispatch(editCell({
        id: scenarioId,
        data: { period_key: periodKey, account_id: accountId, new_value: numVal, tx_currency: "USD" },
      })).unwrap()
      loadGrid()
    } catch (err: any) {
      toast.error("Failed to save cell", { description: err?.message })
    } finally {
      setSavingCell(false)
    }
  }

  const nowKey = new Date().toISOString().slice(0, 7)
  const periodTotals = Object.fromEntries(
    gridPeriods.map(p => [p, gridRows.reduce((s, r) => s + (r.cells?.[p]?.amount ?? 0), 0)])
  )

  const Controls = (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
      <MonthPicker label="From" value={gridPeriodStart} onChange={v => dispatch(setGridPeriodStart(v))} />
      <MonthPicker label="To"   value={gridPeriodEnd}   onChange={v => dispatch(setGridPeriodEnd(v))}   />
      <div className="h-5 w-px bg-gray-200 hidden sm:block" />
      <div className="flex items-center gap-1.5">
        <Switch id="gact" checked={gridIncludeActuals}  onCheckedChange={v => dispatch(setGridIncludeActuals(v))}  className="scale-75" />
        <Label htmlFor="gact" className="text-xs text-gray-500 cursor-pointer">Actuals</Label>
      </div>
      <div className="flex items-center gap-1.5">
        <Switch id="gvar" checked={gridIncludeVariance} onCheckedChange={v => dispatch(setGridIncludeVariance(v))} className="scale-75" />
        <Label htmlFor="gvar" className="text-xs text-gray-500 cursor-pointer">Variance</Label>
      </div>
      <div className="h-5 w-px bg-gray-200 hidden sm:block" />
      {/* Account search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
        <Input
          placeholder="Filter accounts…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-7 h-8 text-xs w-36 rounded-lg border-gray-200"
        />
        {searchTerm && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm("")}>
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        {savingCell && (
          <span className="text-xs text-amber-600 flex items-center gap-1 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </span>
        )}
        <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5 gradient-primary text-white shadow-sm"
          onClick={loadGrid} disabled={gridLoading}>
          {gridLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Load Grid
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => setFullscreen(f => !f)}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  )

  const GridTable = (
    <div
      className={cn("overflow-auto border border-gray-200 shadow-sm bg-white", fullscreen ? "rounded-none border-0" : "rounded-xl")}
      style={{ maxHeight: fullscreen ? "calc(100vh - 136px)" : "65vh" }}
    >
      {gridLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : gridRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">No grid data loaded</p>
          <p className="text-xs text-gray-400 mt-2 max-w-xs">
            Recalculate the scenario to generate forecast cells, then select a date range and click Load Grid
          </p>
          <Button size="sm" className="mt-4 rounded-full gradient-primary text-white h-8 text-xs"
            onClick={loadGrid}>
            <RefreshCw className="w-3 h-3 mr-1.5" /> Load Grid
          </Button>
        </div>
      ) : (
        <table className="border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
          <thead>
            <tr className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-30 bg-gray-50 px-3 py-2.5 text-left border-r border-gray-200" style={{ minWidth: 264 }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</span>
                  {searchTerm && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 rounded px-1 py-0.5 font-medium">filtered</span>
                  )}
                </div>
              </th>
              {gridPeriods.map(period => {
                const isPast = period < nowKey
                return (
                  <th key={period}
                    className={cn("px-2 py-2.5 text-right border-r border-gray-200 last:border-r-0",
                      isPast ? "bg-gray-100/70" : "bg-gray-50")}
                    style={{ minWidth: 110 }}>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-xs font-mono font-semibold ${isPast ? "text-gray-400" : "text-gray-700"}`}>
                        {period}
                      </span>
                      {isPast && <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Past</span>}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {gridRows.map(row => (
              <GridRow
                key={row.account_id}
                row={row}
                periods={gridPeriods}
                isLocked={isLocked}
                includeActuals={gridIncludeActuals}
                includeVariance={gridIncludeVariance}
                searchTerm={searchTerm}
                editingCell={editingCell}
                onStartEdit={(aid, pk, val) => setEditingCell({ accountId: aid, periodKey: pk, value: String(val) })}
                onCommitEdit={handleCommitEdit}
                onCancelEdit={() => setEditingCell(null)}
                onEditChange={v => setEditingCell(prev => prev ? { ...prev, value: v } : null)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-300">
              <td className="sticky left-0 z-20 bg-gray-50 px-3 py-2.5 border-r border-gray-200" style={{ minWidth: 264 }}>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Total</span>
              </td>
              {gridPeriods.map(period => (
                <td key={period} className="px-2 py-2.5 text-right border-r border-gray-200 last:border-r-0">
                  <span className="text-xs font-mono font-bold text-gray-800">{fmtNum(periodTotals[period])}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">Forecast Grid</span>
            {!isLocked && (
              <span className="text-[10px] text-gray-400">Double-click a future cell to edit</span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs gap-1.5"
            onClick={() => setFullscreen(false)}>
            <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen <span className="opacity-40 text-[10px]">Esc</span>
          </Button>
        </div>
        <div className="p-3 shrink-0">{Controls}</div>
        <div className="flex-1 overflow-hidden px-3 pb-3">{GridTable}</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Controls}
      {!isLocked && gridRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-[11px] text-gray-400">
          <span>Double-click a future cell to edit · Enter to commit · Esc to cancel</span>
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Manual override
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="w-3 h-3" /> Positive variance
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <TrendingDown className="w-3 h-3" /> Negative variance
          </span>
        </div>
      )}
      {GridTable}
    </div>
  )
}
