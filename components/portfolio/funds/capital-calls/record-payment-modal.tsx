"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  capitalCallsApi,
  type CapitalCallAllocation,
} from "@/lib/api/capital-calls-api"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"

function fmtCurrency(val: string | number, symbol = "$") {
  const n = Number(val)
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  capitalCallId: string
  allocation: CapitalCallAllocation
  currencySymbol: string
  currencyCode: string
  onPaymentRecorded: () => void
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  fundId,
  capitalCallId,
  allocation,
  currencySymbol,
  currencyCode,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const remaining = Number(allocation.currentCallAmount) - Number(allocation.amountPaid)

  const validate = () => {
    const num = Number(amount)
    if (!amount || isNaN(num) || num <= 0) {
      setError("Enter a valid amount greater than 0")
      return false
    }
    if (num > remaining) {
      setError(`Amount cannot exceed remaining balance of ${fmtCurrency(remaining, currencySymbol)}`)
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setSubmitting(true)
      await capitalCallsApi.recordPayment(
        fundId,
        capitalCallId,
        allocation.id,
        Number(amount)
      )
      toast.success("Payment recorded successfully")
      setAmount("")
      setError("")
      onPaymentRecorded()
    } catch (e: any) {
      toast.error("Failed to record payment", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Record Payment</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {allocation.lpLegalNameSnapshot}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Allocation context */}
        <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Call Amount</span>
            <span className="font-medium">
              {fmtCurrency(allocation.currentCallAmount, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-medium text-emerald-600">
              {fmtCurrency(allocation.amountPaid, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground font-medium">
              Remaining
            </span>
            <span className="font-semibold text-amber-600">
              {fmtCurrency(remaining, currencySymbol)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Payment Amount ({currencyCode}) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${remaining}`}
              className="rounded-full"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {remaining > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setAmount(String(remaining))}
              >
                Full: {fmtCurrency(remaining, currencySymbol)}
              </Button>
            )}
            {remaining > 0 && remaining / 2 > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() =>
                  setAmount(String(Math.round(remaining / 2 * 100) / 100))
                }
              >
                Half: {fmtCurrency(remaining / 2, currencySymbol)}
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-full"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full gap-1.5 gradient-primary text-white"
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
