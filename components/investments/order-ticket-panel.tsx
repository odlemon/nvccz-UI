"use client"

import { useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setExecuteTradeModalOpen, executeTrade, createTrade, fetchTrade, runIngest, runValuation } from "@/lib/store/slices/investmentsSlice"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { priceChange } from "@/lib/api/investments-api"
import { Maximize2, RefreshCw, Calculator, Check, ChevronsUpDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { Delta, ExchangeTag } from "./status-pills"
import { RoutingPipeline, type PipelineHop } from "./routing-pipeline"

type Side = "BUY" | "SELL"
type OrderType = "MARKET" | "LIMIT"

const PREVIEW_HOPS: PipelineHop[] = [
  { target: "BROKER", status: "STAGED" },
  { target: "CUSTODIAN", status: "STAGED", skipped: true },
  { target: "CORE_BANKING", status: "STAGED" },
  { target: "ACCOUNTING_GL", status: "STAGED" },
]

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-panel-muted">{label}</span>
      <span className={cn("font-mono tabular-nums", strong ? "text-sm font-semibold text-panel-foreground" : "text-panel-foreground")}>
        {value}
      </span>
    </div>
  )
}

function IconButton({ onClick, disabled, tooltip, children }: { onClick: () => void; disabled?: boolean; tooltip: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] text-panel-muted ring-1 ring-inset ring-white/10 hover:bg-white/[0.12] hover:text-panel-foreground disabled:opacity-40 disabled:hover:bg-white/[0.06]"
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function OrderTicketPanel() {
  const dispatch = useAppDispatch()
  const { securities, latestPrices, selectedFundId, funds, executing, ingestRunning, valuationRunning } = useAppSelector((s) => s.investments)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("investments", "investments-market-data")

  const watchlist = useMemo(() => securities.filter((s) => s.isActive), [securities])
  const [securityId, setSecurityId] = useState(() => watchlist[0]?.id ?? "")
  const [comboOpen, setComboOpen] = useState(false)
  const [securitySearch, setSecuritySearch] = useState("")
  const [side, setSide] = useState<Side>("BUY")
  const [orderType, setOrderType] = useState<OrderType>("MARKET")
  const [qty, setQty] = useState("1000")
  const [limit, setLimit] = useState("")
  const [confirming, setConfirming] = useState(false)

  const security = securities.find((s) => s.id === securityId) ?? watchlist[0]
  const tick = security ? (latestPrices[security.symbol] ?? latestPrices[security.id]) : null
  const change = priceChange(tick)
  const selectedFund = funds.find((f) => f.id === selectedFundId)

  const filteredSecurities = useMemo(() => {
    const q = securitySearch.toLowerCase()
    return watchlist.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [watchlist, securitySearch])

  const isPendingReview = tick?.validationStatus === "PENDING_REVIEW"
  const priceUsed = orderType === "MARKET" ? (change.price ?? 0) : (Number(limit) || 0)
  const quantity = Number(qty) || 0
  const gross = priceUsed * quantity

  const resetForm = () => {
    setConfirming(false)
    setQty("1000")
    setLimit("")
  }

  const handleSelectSecurity = (id: string) => {
    setSecurityId(id)
    setComboOpen(false)
    setConfirming(false)
  }

  const handleStage = () => {
    if (quantity <= 0 || !security) {
      toast.error("Enter a valid quantity")
      return
    }
    if (isPendingReview) return
    setConfirming(true)
  }

  const handleConfirm = async () => {
    if (!selectedFundId || !security) return
    try {
      const created = await dispatch(
        createTrade({
          fundId: selectedFundId,
          securityId: security.id,
          side,
          quantity,
          executionPrice: priceUsed,
          executionCurrencyCode: selectedFund?.base_currency ?? "USD",
        })
      ).unwrap()

      const result = await dispatch(executeTrade(created.id)).unwrap()
      await dispatch(fetchTrade(result.id))

      toast.success("Trade executed", {
        description: `${result.tradeRef} — ${side} ${quantity.toLocaleString()} ${security.symbol}. Cash hold released, GL posted.`,
      })
      resetForm()
    } catch (err: any) {
      toast.error("Execution failed", { description: err.message })
      setConfirming(false)
    }
  }

  if (!security) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border-2 border-panel-border bg-panel p-6 text-center text-sm text-panel-muted shadow-xl">
        Add a security to your watchlist to start trading
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-panel-border bg-panel text-panel-foreground shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 font-mono text-sm font-semibold text-panel-foreground ring-1 ring-inset ring-white/10 hover:bg-white/[0.12]">
                  {security.symbol}
                  <ChevronsUpDown className="h-3.5 w-3.5 text-panel-muted" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-panel border-panel-border text-panel-foreground" align="start">
                <Command className="bg-panel text-panel-foreground">
                  <CommandInput
                    placeholder="Search ticker or name…"
                    value={securitySearch}
                    onValueChange={setSecuritySearch}
                    className="text-panel-foreground placeholder:text-panel-muted"
                  />
                  <CommandList>
                    <CommandEmpty className="text-panel-muted">No securities found.</CommandEmpty>
                    <CommandGroup>
                      {filteredSecurities.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.id}
                          onSelect={() => handleSelectSecurity(s.id)}
                          className="text-panel-foreground data-[selected=true]:bg-white/10 data-[selected=true]:text-panel-foreground"
                        >
                          <Check className={cn("mr-2 h-4 w-4", securityId === s.id ? "opacity-100" : "opacity-0")} />
                          <span className="font-mono mr-2">{s.symbol}</span>
                          <span className="text-panel-muted text-xs truncate">{s.name}</span>
                          <ExchangeTag exchange={s.exchangeCode} className="ml-auto border-panel-border bg-white/5 text-panel-muted" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <ExchangeTag exchange={security.exchangeCode} className="border-panel-border bg-white/5 text-panel-muted" />
          </div>
          <p className="mt-1 truncate text-[11px] text-panel-muted">{security.name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <IconButton
              onClick={() => selectedFundId && dispatch(runValuation(selectedFundId))}
              disabled={valuationRunning || !selectedFundId}
              tooltip="Run Valuation"
            >
              <Calculator className={cn("h-3.5 w-3.5", valuationRunning && "animate-pulse")} />
            </IconButton>
          )}
          {isAdmin && (
            <IconButton onClick={() => dispatch(runIngest("ALL"))} disabled={ingestRunning} tooltip="Force Aggregation Run">
              <RefreshCw className={cn("h-3.5 w-3.5", ingestRunning && "animate-spin")} />
            </IconButton>
          )}
          <IconButton onClick={() => dispatch(setExecuteTradeModalOpen(true))} tooltip="Advanced (full dialog)">
            <Maximize2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <p className="font-mono text-lg font-semibold">{tick ? change.price?.toFixed(4) : "—"}</p>
        {tick && <Delta value={change.pct} direction={change.direction} className="text-xs" />}
      </div>

      {isPendingReview && (
        <div className="mx-4 mt-2 rounded-md bg-warn-muted px-2.5 py-1.5 text-[11px] font-medium text-warn-foreground">
          Price pending review — execution blocked until approved
        </div>
      )}

      <div className="space-y-4 p-4">
        {!confirming ? (
          <>
            {/* Buy / Sell toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["BUY", "SELL"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-bold tracking-wide transition-colors",
                    side === s
                      ? s === "BUY" ? "bg-gain text-white shadow-md shadow-gain/30" : "bg-loss text-white shadow-md shadow-loss/30"
                      : "bg-white/[0.06] text-panel-muted ring-1 ring-inset ring-white/10 hover:bg-white/[0.12] hover:text-panel-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Order type */}
            <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1 ring-1 ring-inset ring-white/10">
              {(["MARKET", "LIMIT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setOrderType(t); if (t === "LIMIT" && !limit && change.price != null) setLimit(change.price.toFixed(4)) }}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                    orderType === t ? "bg-primary text-primary-foreground shadow-sm" : "text-panel-muted hover:text-panel-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-panel-muted">Quantity</label>
              <input
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-panel-foreground outline-none focus:border-primary"
              />
              <div className="mt-2 flex gap-1.5">
                {[1000, 5000, 10000, 25000].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQty(String(q))}
                    className="flex-1 rounded-md bg-white/[0.06] py-1 text-[11px] font-medium text-panel-muted ring-1 ring-inset ring-white/10 hover:bg-white/[0.14] hover:text-panel-foreground"
                  >
                    {q >= 1000 ? `${q / 1000}k` : q}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit price */}
            {orderType === "LIMIT" && (
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-panel-muted">
                  Limit Price ({security.listingCurrencyCode})
                </label>
                <input
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-mono text-sm text-panel-foreground outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Summary */}
            <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
              <Row label="Est. price" value={orderType === "MARKET" ? "Market" : priceUsed.toFixed(4)} />
              <Row label="Gross" value={gross.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
              <div className="my-1 border-t border-white/10" />
              <Row label={side === "BUY" ? "Net debit" : "Net credit"} value={gross.toLocaleString("en-US", { minimumFractionDigits: 2 })} strong />
            </div>

            <button
              onClick={handleStage}
              disabled={quantity <= 0 || isPendingReview}
              className={cn(
                "w-full rounded-lg py-2.5 text-sm font-bold tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50",
                side === "BUY" ? "bg-gain shadow-md shadow-gain/30" : "bg-loss shadow-md shadow-loss/30",
              )}
            >
              Review {side} — {security.symbol}
            </button>
            <p className="text-center text-[11px] text-panel-muted">
              Routes: Broker → Custodian → Core Banking → GL
            </p>
          </>
        ) : (
          <>
            <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
              <Row label="Security" value={`${security.symbol} — ${security.exchangeCode}`} />
              <Row label="Side" value={side} />
              <Row label="Quantity" value={quantity.toLocaleString()} />
              <Row label="Price" value={priceUsed.toFixed(4)} />
              <div className="my-1 border-t border-white/10" />
              <Row label="Gross Total" value={gross.toLocaleString("en-US", { minimumFractionDigits: 2 })} strong />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-panel-muted">Routing Preview</p>
              <RoutingPipeline mode="compact" hops={PREVIEW_HOPS} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={executing}
                className="flex-1 rounded-lg bg-white/[0.08] py-2.5 text-sm font-semibold text-panel-foreground ring-1 ring-inset ring-white/15 hover:bg-white/[0.16] disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={executing}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50",
                  side === "BUY" ? "bg-gain shadow-md shadow-gain/30" : "bg-loss shadow-md shadow-loss/30",
                )}
              >
                {executing ? "Executing…" : `Confirm ${side}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
