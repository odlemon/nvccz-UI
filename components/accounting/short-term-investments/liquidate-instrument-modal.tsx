"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { liquidateInstrument, extractErrorMessage } from "@/lib/api/short-term-investments-api"
import type { STIInstrument } from "@/lib/api/short-term-investments-api"

interface LiquidateInstrumentModalProps {
  instrument: STIInstrument
  open: boolean
  onOpenChange: (open: boolean) => void
  onLiquidated: () => void
}

export function LiquidateInstrumentModal({
  instrument,
  open,
  onOpenChange,
  onLiquidated,
}: LiquidateInstrumentModalProps) {
  const [liquidationDateObj, setLiquidationDateObj] = useState<Date | undefined>(new Date())
  const liquidationDate = liquidationDateObj ? format(liquidationDateObj, "yyyy-MM-dd") : ""
  const [cashReceived, setCashReceived] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setLiquidationDateObj(new Date())
      setCashReceived("")
      setErrors({})
    }
  }, [open])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!liquidationDate) newErrors.liquidationDate = "Liquidation date is required"
    if (!cashReceived || parseFloat(cashReceived) <= 0) newErrors.cashReceived = "Cash received amount is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await liquidateInstrument(instrument.id, {
        settlementIso: liquidationDate,
        cashReceived: parseFloat(cashReceived),
      })
      toast.success(`Successfully liquidated "${instrument.name}"`)
      onLiquidated()
    } catch (e: any) {
      toast.error("Failed to liquidate instrument", { description: extractErrorMessage(e) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#4f77ff]" />
            Liquidate Instrument
          </DialogTitle>
          <DialogDescription className="text-xs">
            Settle this investment and record the cash received
          </DialogDescription>
        </DialogHeader>

        {/* Instrument Summary */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Instrument</span>
            <span className="text-xs font-semibold">{instrument.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Principal</span>
            <span className="text-xs font-mono font-semibold">{instrument.currency.code} {formatCurrency(instrument.principal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Category</span>
            <span className="text-xs">{instrument.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Maturity</span>
            <span className="text-xs">{format(new Date(instrument.maturityDate), "MMM dd, yyyy")}</span>
          </div>
          {instrument.capitalErosion && (
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Capital Erosion — expected payout less than principal</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Liquidation Date *</Label>
            <DatePicker
              value={liquidationDateObj}
              onChange={(d) => { setLiquidationDateObj(d); setErrors((p) => ({ ...p, liquidationDate: "" })) }}
              placeholder="Pick settlement date"
              allowFutureDates
            />
            {errors.liquidationDate && <p className="text-xs text-red-500">{errors.liquidationDate}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cash Received ({instrument.currency.code}) *</Label>
            <Input
              type="number"
              step="0.01"
              value={cashReceived}
              onChange={(e) => { setCashReceived(e.target.value); setErrors((p) => ({ ...p, cashReceived: "" })) }}
              placeholder="e.g. 10500.00"
              className="rounded-xl h-10 text-sm"
            />
            {errors.cashReceived && <p className="text-xs text-red-500">{errors.cashReceived}</p>}
            <p className="text-[10px] text-muted-foreground">
              The system will calculate any final partial-day interest and generate the settlement journal entry automatically.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            className="rounded-full h-10 px-6"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient-update"
            className="rounded-full h-10 px-6"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm Liquidation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
