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
import { DatePicker } from "@/components/ui/date-picker"
import { capitalCallsApi } from "@/lib/api/capital-calls-api"
import { toast } from "sonner"
import { Loader2, DollarSign } from "lucide-react"

interface InitiateCapitalCallModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  fundName: string
  onCreated: () => void
}

export function InitiateCapitalCallModal({
  isOpen,
  onClose,
  fundId,
  fundName,
  onCreated,
}: InitiateCapitalCallModalProps) {
  const [callPercent, setCallPercent] = useState("")
  const [paymentDueDate, setPaymentDueDate] = useState<Date | undefined>()
  const [transactionDate, setTransactionDate] = useState<Date | undefined>()
  const [bankInstructions, setBankInstructions] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    const pct = Number(callPercent)
    if (!callPercent || isNaN(pct) || pct <= 0 || pct > 100) {
      errs.callPercent = "Enter a valid percentage between 1 and 100"
    }
    if (!paymentDueDate) {
      errs.paymentDueDate = "Payment due date is required"
    }
    if (!transactionDate) {
      errs.transactionDate = "Transaction date is required"
    }
    if (!bankInstructions.trim()) {
      errs.bankInstructions = "Bank instructions are required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setSubmitting(true)
      await capitalCallsApi.initiate(fundId, {
        callPercent: Number(callPercent),
        paymentDueDate: format(paymentDueDate!, "yyyy-MM-dd"),
        transactionDate: format(transactionDate!, "yyyy-MM-dd"),
        bankInstructions: bankInstructions.trim(),
      })
      toast.success("Capital call initiated successfully", {
        description: "Journal entry posted (Dr 1210 / Cr 3010)",
      })
      resetForm()
      onClose()
      onCreated()
    } catch (e: any) {
      toast.error("Failed to initiate capital call", {
        description: e?.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCallPercent("")
    setPaymentDueDate(undefined)
    setTransactionDate(undefined)
    setBankInstructions("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Initiate Capital Call
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {fundName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Call Percent */}
          <div className="space-y-2">
            <Label>Call Percentage *</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={callPercent}
                onChange={(e) => setCallPercent(e.target.value)}
                placeholder="e.g. 10"
                className="rounded-full pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            {errors.callPercent && (
              <p className="text-sm text-red-600">{errors.callPercent}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction Date *</Label>
              <DatePicker
                value={transactionDate}
                onChange={setTransactionDate}
                placeholder="Select date"
                allowFutureDates
              />
              {errors.transactionDate && (
                <p className="text-sm text-red-600">
                  {errors.transactionDate}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Due Date *</Label>
              <DatePicker
                value={paymentDueDate}
                onChange={setPaymentDueDate}
                placeholder="Select due date"
                allowFutureDates
              />
              {errors.paymentDueDate && (
                <p className="text-sm text-red-600">
                  {errors.paymentDueDate}
                </p>
              )}
            </div>
          </div>

          {/* Bank Instructions */}
          <div className="space-y-2">
            <Label>Bank Instructions *</Label>
            <textarea
              value={bankInstructions}
              onChange={(e) => setBankInstructions(e.target.value)}
              placeholder="Payment bank details, reference, SWIFT code..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.bankInstructions && (
              <p className="text-sm text-red-600">
                {errors.bankInstructions}
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            This will create a capital call for all eligible LPs with
            ACTIVE or PENDING commitments. A journal entry (Dr 1210 / Cr
            3010) will be automatically posted.
          </div>

          {/* Actions */}
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
              Initiate Call
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
