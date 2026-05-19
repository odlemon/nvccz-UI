"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { lpFeesApi, type ManagementFeePeriod } from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"
import { Loader2, Receipt } from "lucide-react"

interface AccrueFeeModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  fundName: string
  onAccrued: (period: ManagementFeePeriod) => void
}

export function AccrueFeeModal({ isOpen, onClose, fundId, fundName, onAccrued }: AccrueFeeModalProps) {
  const [periodStart, setPeriodStart] = useState<Date | undefined>()
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>()
  const [transactionDate, setTransactionDate] = useState<Date | undefined>()
  const [feeBase, setFeeBase] = useState<string>("none")
  const [rateOverride, setRateOverride] = useState("")
  const [feeBaseAmountOverride, setFeeBaseAmountOverride] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setPeriodStart(undefined)
    setPeriodEnd(undefined)
    setTransactionDate(undefined)
    setFeeBase("none")
    setRateOverride("")
    setFeeBaseAmountOverride("")
    setNotes("")
    setErrors({})
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!periodStart) errs.periodStart = "Period start date is required"
    if (!periodEnd) errs.periodEnd = "Period end date is required"
    if (periodStart && periodEnd && periodEnd <= periodStart)
      errs.periodEnd = "Period end must be after period start"
    if (rateOverride) {
      const n = parseFloat(rateOverride)
      if (isNaN(n) || n <= 0 || n > 100) errs.rateOverride = "Enter a valid % between 0 and 100"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setSubmitting(true)
      const body: any = {
        periodStart: format(periodStart!, "yyyy-MM-dd"),
        periodEnd: format(periodEnd!, "yyyy-MM-dd"),
      }
      if (transactionDate) body.transactionDate = format(transactionDate, "yyyy-MM-dd")
      if (feeBase && feeBase !== "none") body.feeBase = feeBase
      if (rateOverride) body.rateOverride = parseFloat(rateOverride) / 100
      if (feeBaseAmountOverride) body.feeBaseAmountOverride = parseFloat(feeBaseAmountOverride)
      if (notes.trim()) body.notes = notes.trim()

      const res = await lpFeesApi.accrueFee(fundId, body)
      toast.success(res.message || "Management fee accrued successfully")
      reset()
      onClose()
      onAccrued(res.data)
    } catch (e: any) {
      toast.error("Failed to accrue management fee", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Fixed header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Accrue Management Fee</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{fundName}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-1 pr-2">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
            The backend will use the fund&apos;s fee policy (rate &amp; base) to calculate per-LP shares
            and post the accrual journal automatically. You may override rate or base for this billing
            period only.
          </div>

          <form id="accrue-fee-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Billing period */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Period Start *</Label>
                <DatePicker value={periodStart} onChange={setPeriodStart} allowFutureDates />
                {errors.periodStart && <p className="text-xs text-red-600">{errors.periodStart}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Period End *</Label>
                <DatePicker value={periodEnd} onChange={setPeriodEnd} allowFutureDates />
                {errors.periodEnd && <p className="text-xs text-red-600">{errors.periodEnd}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>GL / Transaction Date</Label>
                <DatePicker value={transactionDate} onChange={setTransactionDate} allowFutureDates />
                <p className="text-xs text-muted-foreground">Defaults to period end</p>
              </div>
            </div>

            {/* Overrides */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Overrides (optional)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Fee Base</Label>
                  <Select value={feeBase} onValueChange={setFeeBase}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Fund policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Use fund policy</SelectItem>
                      <SelectItem value="COMMITTED">Committed</SelectItem>
                      <SelectItem value="INVESTED">Invested</SelectItem>
                      <SelectItem value="NAV">NAV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rate Override (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    value={rateOverride}
                    onChange={(e) => setRateOverride(e.target.value)}
                    placeholder="e.g. 2"
                    className="rounded-full"
                  />
                  {errors.rateOverride && <p className="text-xs text-red-600">{errors.rateOverride}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Base Amount Override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={feeBaseAmountOverride}
                    onChange={(e) => setFeeBaseAmountOverride(e.target.value)}
                    placeholder="Manual NAV / base"
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Q1 2026 management fee accrual"
                className="resize-none"
                rows={2}
              />
            </div>
          </form>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { reset(); onClose() }}
            className="rounded-full"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="accrue-fee-form"
            className="rounded-full gap-1.5 gradient-primary text-white"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Accrue Fee
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
