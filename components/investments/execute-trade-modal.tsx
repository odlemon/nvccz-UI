"use client"

import { useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setExecuteTradeModalOpen, executeTrade, createTrade, fetchTrade } from "@/lib/store/slices/investmentsSlice"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { priceChange } from "@/lib/api/investments-api"
import { RoutingPipeline, type PipelineHop } from "./routing-pipeline"

type Side = "BUY" | "SELL"
type Step = "form" | "confirm"

const PREVIEW_HOPS: PipelineHop[] = [
  { target: "BROKER", status: "STAGED" },
  { target: "CUSTODIAN", status: "STAGED", skipped: true },
  { target: "CORE_BANKING", status: "STAGED" },
  { target: "ACCOUNTING_GL", status: "STAGED" },
]

export function ExecuteTradeModal() {
  const dispatch = useAppDispatch()
  const { securities, latestPrices, selectedFundId, funds, executing } = useAppSelector((s) => s.investments)

  const [open, setOpen] = useState(false)
  const [securityId, setSecurityId] = useState("")
  const [securitySearch, setSecuritySearch] = useState("")
  const [side, setSide] = useState<Side>("BUY")
  const [quantity, setQuantity] = useState("")
  const [executionPrice, setExecutionPrice] = useState("")
  const [fees, setFees] = useState("")
  const [step, setStep] = useState<Step>("form")

  const selectedFund = funds.find((f) => f.id === selectedFundId)
  const selectedSecurity = securities.find((s) => s.id === securityId)
  const tick = selectedSecurity ? (latestPrices[selectedSecurity.symbol] ?? latestPrices[selectedSecurity.id]) : null

  const isPendingReview = tick?.validationStatus === "PENDING_REVIEW"

  const filteredSecurities = useMemo(() => {
    const q = securitySearch.toLowerCase()
    return securities.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [securities, securitySearch])

  const handleSecuritySelect = (id: string) => {
    setSecurityId(id)
    setOpen(false)
    const sec = securities.find((s) => s.id === id)
    if (sec) {
      const t = latestPrices[sec.symbol] ?? latestPrices[sec.id]
      const { price } = priceChange(t)
      if (price != null) setExecutionPrice(String(price))
    }
  }

  const handleClose = () => {
    dispatch(setExecuteTradeModalOpen(false))
    setStep("form")
    setSecurityId("")
    setQuantity("")
    setExecutionPrice("")
    setFees("")
  }

  const handleSubmit = async () => {
    if (step === "form") {
      setStep("confirm")
      return
    }

    if (!selectedFundId || !securityId) return

    try {
      const created = await dispatch(
        createTrade({
          fundId: selectedFundId,
          securityId: securityId,
          side: side,
          quantity: Number(quantity),
          executionPrice: Number(executionPrice),
          executionCurrencyCode: selectedFund?.base_currency ?? "USD",
          fees: fees ? Number(fees) : undefined,
        })
      ).unwrap()

      const result = await dispatch(executeTrade(created.id)).unwrap()
      await dispatch(fetchTrade(result.id))

      toast.success("Trade executed", {
        description: `${result.tradeRef} — ${side} ${quantity} ${selectedSecurity?.symbol}. Cash hold released, GL posted.`,
      })
      handleClose()
    } catch (err: any) {
      toast.error("Execution failed", { description: err.message })
      setStep("form")
    }
  }

  const grossAmount = Number(quantity || 0) * Number(executionPrice || 0)
  const canSubmit = securityId && quantity && executionPrice && !isPendingReview

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "confirm" ? "Confirm Execution" : "Execute Trade"}</DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-2">
            {/* Fund (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Fund</Label>
              <div className="h-9 px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground">
                {selectedFund?.name ?? "—"}
              </div>
            </div>

            {/* Security combobox */}
            <div className="space-y-1.5">
              <Label className="text-xs">Security</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal h-9"
                  >
                    {selectedSecurity
                      ? `${selectedSecurity.symbol} — ${selectedSecurity.name}`
                      : "Search security…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search by ticker or name…"
                      value={securitySearch}
                      onValueChange={setSecuritySearch}
                    />
                    <CommandList>
                      <CommandEmpty>No securities found.</CommandEmpty>
                      <CommandGroup>
                        {filteredSecurities.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.id}
                            onSelect={() => handleSecuritySelect(s.id)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", securityId === s.id ? "opacity-100" : "opacity-0")} />
                            <span className="font-mono mr-2">{s.symbol}</span>
                            <span className="text-muted-foreground text-xs truncate">{s.name}</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">{s.exchangeCode}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {isPendingReview && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Price tick pending review — execution blocked until approved
                </div>
              )}
            </div>

            {/* BUY/SELL toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs">Side</Label>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  type="button"
                  className={cn("flex-1 h-9 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    side === "BUY" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                  onClick={() => setSide("BUY")}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> BUY
                </button>
                <button
                  type="button"
                  className={cn("flex-1 h-9 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    side === "SELL" ? "bg-red-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                  onClick={() => setSide("SELL")}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> SELL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-9 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Execution Price</Label>
                <Input
                  type="number"
                  placeholder="0.0000"
                  value={executionPrice}
                  onChange={(e) => setExecutionPrice(e.target.value)}
                  className="h-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Broker Fees (optional)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="h-9 font-mono"
              />
            </div>

            {grossAmount > 0 && (
              <div className="bg-slate-50 rounded px-3 py-2 text-xs flex justify-between">
                <span className="text-slate-500">Gross Amount</span>
                <span className="font-mono font-semibold">{grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        ) : (
          /* Confirm step — quad-target preview */
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Security</span>
                <span className="font-mono font-medium">{selectedSecurity?.symbol} — {selectedSecurity?.exchangeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Side</span>
                <Badge className={cn("font-mono", side === "BUY" ? "bg-emerald-600" : "bg-red-600")}>{side}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity</span>
                <span className="font-mono">{Number(quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <span className="font-mono">{Number(executionPrice).toFixed(4)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Gross Total</span>
                <span className="font-mono">{grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Routing Preview</p>
              <RoutingPipeline mode="compact" hops={PREVIEW_HOPS} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={step === "confirm" ? () => setStep("form") : handleClose}>
            {step === "confirm" ? "Back" : "Cancel"}
          </Button>
          <Button
            className={cn("gradient-primary text-white", side === "SELL" && step === "confirm" && "from-red-600 to-red-700")}
            onClick={handleSubmit}
            disabled={!canSubmit || executing}
          >
            {executing ? "Executing…" : step === "confirm" ? `Confirm ${side}` : "Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
