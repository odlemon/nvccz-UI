"use client"

import { useState, useEffect } from "react"
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
import {
  portfolioMonitoringApi,
  type ValuationEvent,
  type ValuationType,
} from "@/lib/api/portfolio-monitoring-api"
import { accountingApi, type AccountingCurrency } from "@/lib/api/accounting-api"
import { toast } from "sonner"
import { Loader2, TrendingUp } from "lucide-react"

const VALUATION_TYPES: { value: ValuationType; label: string }[] = [
  { value: "POST_MONEY", label: "Post-Money" },
  { value: "PRE_MONEY", label: "Pre-Money" },
  { value: "FAIR_MARKET_VALUE", label: "Fair Market Value" },
  { value: "BOOK_VALUE", label: "Book Value" },
  { value: "LIQUIDATION", label: "Liquidation" },
]

interface RecordValuationModalProps {
  isOpen: boolean
  onClose: () => void
  implementationId: string
  existing?: ValuationEvent | null
  onSaved: (event: ValuationEvent) => void
}

export function RecordValuationModal({
  isOpen,
  onClose,
  implementationId,
  existing,
  onSaved,
}: RecordValuationModalProps) {
  const [valuationDate, setValuationDate] = useState<Date | undefined>()
  const [valuationType, setValuationType] = useState<ValuationType>("FAIR_MARKET_VALUE")
  const [valuationAmount, setValuationAmount] = useState("")
  const [currencyId, setCurrencyId] = useState("")
  const [notes, setNotes] = useState("")
  const [currencies, setCurrencies] = useState<AccountingCurrency[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    accountingApi.getCurrencies().then((res) => {
      const list = (res as any).data ?? []
      setCurrencies(list.filter((c: AccountingCurrency) => c.isActive))
      if (!currencyId && !existing) {
        const def = list.find((c: AccountingCurrency) => c.isDefault)
        if (def) setCurrencyId(def.id)
      }
    }).catch(() => {})
  }, [isOpen])

  useEffect(() => {
    if (existing) {
      setValuationDate(new Date(existing.valuationDate))
      setValuationType(existing.valuationType)
      setValuationAmount(existing.valuationAmount)
      setCurrencyId(existing.currencyId)
      setNotes(existing.notes ?? "")
    } else {
      setValuationDate(undefined)
      setValuationType("FAIR_MARKET_VALUE")
      setValuationAmount("")
      setNotes("")
      setErrors({})
    }
  }, [existing, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!valuationDate) errs.valuationDate = "Date is required"
    if (!valuationType) errs.valuationType = "Type is required"
    const amt = parseFloat(valuationAmount)
    if (!valuationAmount || isNaN(amt) || amt <= 0) errs.valuationAmount = "Enter a valid amount"
    if (!currencyId) errs.currencyId = "Currency is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setSubmitting(true)
      const body = {
        valuationDate: format(valuationDate!, "yyyy-MM-dd"),
        valuationType,
        valuationAmount: parseFloat(valuationAmount),
        currencyId,
        notes: notes.trim() || undefined,
      }
      let saved: ValuationEvent
      if (existing) {
        const res = await portfolioMonitoringApi.updateValuation(implementationId, existing.id, body)
        saved = (res as any).data
      } else {
        const res = await portfolioMonitoringApi.createValuation(implementationId, body)
        saved = (res as any).data
      }
      toast.success(existing ? "Valuation updated" : "Valuation recorded")
      onSaved(saved)
      onClose()
    } catch (err: any) {
      toast.error("Failed to save valuation", { description: err?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle>{existing ? "Edit Valuation" : "Record Valuation"}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valuation Date *</Label>
              <DatePicker
                value={valuationDate}
                onChange={setValuationDate}
                allowFutureDates
                placeholder="Pick date"
              />
              {errors.valuationDate && <p className="text-xs text-red-600">{errors.valuationDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={valuationType} onValueChange={(v) => setValuationType(v as ValuationType)}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VALUATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.valuationType && <p className="text-xs text-red-600">{errors.valuationType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valuationAmount}
                onChange={(e) => setValuationAmount(e.target.value)}
                placeholder="e.g. 12500000"
                className="rounded-full"
              />
              {errors.valuationAmount && <p className="text-xs text-red-600">{errors.valuationAmount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <Select value={currencyId} onValueChange={setCurrencyId}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyId && <p className="text-xs text-red-600">{errors.currencyId}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional — e.g. Q1 board valuation"
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full gap-1.5 gradient-primary text-white" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {existing ? "Update" : "Record Valuation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
