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
import { lpFeesApi, type Distribution } from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"
import { Loader2, TrendingDown } from "lucide-react"

interface DeclareDistributionModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  fundName: string
  onDeclared: (dist: Distribution) => void
}

export function DeclareDistributionModal({
  isOpen, onClose, fundId, fundName, onDeclared,
}: DeclareDistributionModalProps) {
  const [distributionDate, setDistributionDate] = useState<Date | undefined>()
  const [source, setSource] = useState<string>("")
  const [grossAmount, setGrossAmount] = useState("")
  const [carryRateOverride, setCarryRateOverride] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setDistributionDate(undefined)
    setSource("")
    setGrossAmount("")
    setCarryRateOverride("")
    setNotes("")
    setErrors({})
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!distributionDate) errs.distributionDate = "Distribution date is required"
    if (!source) errs.source = "Source is required"
    const amt = parseFloat(grossAmount)
    if (!grossAmount || isNaN(amt) || amt <= 0) errs.grossAmount = "Enter a valid gross amount greater than 0"
    if (carryRateOverride) {
      const cr = parseFloat(carryRateOverride)
      if (isNaN(cr) || cr < 0 || cr > 100) errs.carryRateOverride = "Enter a valid % between 0 and 100"
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
        distributionDate: format(distributionDate!, "yyyy-MM-dd"),
        source,
        grossAmount: parseFloat(grossAmount),
      }
      if (carryRateOverride) body.carryRateOverride = parseFloat(carryRateOverride) / 100
      if (notes.trim()) body.notes = notes.trim()

      const res = await lpFeesApi.declareDistribution(fundId, body)
      toast.success(res.message || "Distribution declared successfully")
      reset()
      onClose()
      onDeclared(res.data)
    } catch (e: any) {
      toast.error("Failed to declare distribution", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Declare Distribution</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{fundName}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          The backend applies the carry waterfall (GP carry %, preferred return hurdle) to the gross amount,
          then splits the net pro-rata across LPs by paid-in capital or commitment.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Distribution Date *</Label>
              <DatePicker value={distributionDate} onChange={setDistributionDate} allowFutureDates />
              {errors.distributionDate && <p className="text-xs text-red-600">{errors.distributionDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Source *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIVIDEND">Dividend</SelectItem>
                  <SelectItem value="EXIT_PROCEEDS">Exit Proceeds</SelectItem>
                  <SelectItem value="INTEREST">Interest</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && <p className="text-xs text-red-600">{errors.source}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Gross Amount (before carry) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              placeholder="Total pool available for distribution"
              className="rounded-full"
            />
            {errors.grossAmount && <p className="text-xs text-red-600">{errors.grossAmount}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Carry Rate Override (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={carryRateOverride}
              onChange={(e) => setCarryRateOverride(e.target.value)}
              placeholder="Leave blank to use fund policy carry rate"
              className="rounded-full"
            />
            {errors.carryRateOverride && <p className="text-xs text-red-600">{errors.carryRateOverride}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional memo for this distribution"
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-full gap-1.5 gradient-primary text-white"
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Declare Distribution
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
