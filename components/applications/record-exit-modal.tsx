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
  type ExitRecord,
  type ExitPerformance,
  type ExitType,
} from "@/lib/api/portfolio-monitoring-api"
import { accountingApi, type AccountingCurrency } from "@/lib/api/accounting-api"
import { toast } from "sonner"
import { Loader2, LogOut } from "lucide-react"

const EXIT_TYPES: { value: ExitType; label: string }[] = [
  { value: "ACQUISITION", label: "Acquisition" },
  { value: "IPO", label: "IPO" },
  { value: "SECONDARY_SALE", label: "Secondary Sale" },
  { value: "BUYBACK", label: "Buyback" },
  { value: "WRITE_OFF", label: "Write-off" },
  { value: "OTHER", label: "Other" },
]

interface RecordExitModalProps {
  isOpen: boolean
  onClose: () => void
  implementationId: string
  existing?: ExitRecord | null
  onSaved: (exit: ExitRecord, performance: ExitPerformance) => void
}

export function RecordExitModal({
  isOpen,
  onClose,
  implementationId,
  existing,
  onSaved,
}: RecordExitModalProps) {
  const [exitDate, setExitDate] = useState<Date | undefined>()
  const [exitType, setExitType] = useState<ExitType>("ACQUISITION")
  const [exitProceedsAmount, setExitProceedsAmount] = useState("")
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
      setExitDate(new Date(existing.exitDate))
      setExitType(existing.exitType)
      setExitProceedsAmount(existing.exitProceedsAmount)
      setCurrencyId(existing.currencyId)
      setNotes(existing.notes ?? "")
    } else {
      setExitDate(undefined)
      setExitType("ACQUISITION")
      setExitProceedsAmount("")
      setNotes("")
      setErrors({})
    }
  }, [existing, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!exitDate) errs.exitDate = "Exit date is required"
    if (!exitType) errs.exitType = "Exit type is required"
    const amt = parseFloat(exitProceedsAmount)
    if (!exitProceedsAmount || isNaN(amt) || amt < 0) errs.exitProceedsAmount = "Enter a valid proceeds amount"
    if (!currencyId) errs.currencyId = "Currency is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setSubmitting(true)
      const res = await portfolioMonitoringApi.recordExit(implementationId, {
        exitDate: format(exitDate!, "yyyy-MM-dd"),
        exitType,
        exitProceedsAmount: parseFloat(exitProceedsAmount),
        currencyId,
        notes: notes.trim() || undefined,
      })
      const { exit, performance } = (res as any).data
      toast.success(existing ? "Exit updated" : "Exit recorded successfully")
      onSaved(exit, performance)
      onClose()
    } catch (err: any) {
      toast.error("Failed to record exit", { description: err?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle>{existing ? "Update Exit" : "Record Exit"}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                IRR and ROI are computed automatically from disbursement cash flows.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Exit Date *</Label>
              <DatePicker
                value={exitDate}
                onChange={setExitDate}
                allowFutureDates
                placeholder="Pick date"
              />
              {errors.exitDate && <p className="text-xs text-red-600">{errors.exitDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Exit Type *</Label>
              <Select value={exitType} onValueChange={(v) => setExitType(v as ExitType)}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.exitType && <p className="text-xs text-red-600">{errors.exitType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Exit Proceeds *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={exitProceedsAmount}
                onChange={(e) => setExitProceedsAmount(e.target.value)}
                placeholder="Total proceeds"
                className="rounded-full"
              />
              {errors.exitProceedsAmount && <p className="text-xs text-red-600">{errors.exitProceedsAmount}</p>}
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
              placeholder="Optional — e.g. Strategic acquisition"
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
              {existing ? "Update Exit" : "Record Exit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
