"use client"

import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { lpFeesApi, type FundFeePolicy, type FundFeePolicyUpsertRequest } from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"
import { Loader2, Settings2 } from "lucide-react"
import { format, parseISO } from "date-fns"

interface FeePolicyModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  fundName: string
  policy: FundFeePolicy | null
  onSaved: (policy: FundFeePolicy) => void
}

function pctToFrac(pct: string): number | null {
  const n = parseFloat(pct)
  if (isNaN(n)) return null
  return n / 100
}

export function FeePolicyModal({ isOpen, onClose, fundId, fundName, policy, onSaved }: FeePolicyModalProps) {
  const [feeRate, setFeeRate] = useState("")
  const [feeBase, setFeeBase] = useState<string>("")
  const [feeFrequency, setFeeFrequency] = useState<string>("")
  const [feeStartDate, setFeeStartDate] = useState<Date | undefined>()
  const [carryRate, setCarryRate] = useState("")
  const [hurdleRate, setHurdleRate] = useState("")
  const [hurdleType, setHurdleType] = useState<string>("")
  const [catchUpRate, setCatchUpRate] = useState("")
  const [waterfallType, setWaterfallType] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && policy) {
      setFeeRate(policy.managementFeeRate != null ? String(policy.managementFeeRate * 100) : "")
      setFeeBase(policy.managementFeeBase || "")
      setFeeFrequency(policy.managementFeeFrequency || "")
      setFeeStartDate(policy.managementFeeStartDate ? parseISO(policy.managementFeeStartDate) : undefined)
      setCarryRate(policy.carryRate != null ? String(policy.carryRate * 100) : "")
      setHurdleRate(policy.hurdleRate != null ? String(policy.hurdleRate * 100) : "")
      setHurdleType(policy.hurdleType || "")
      setCatchUpRate(policy.catchUpRate != null ? String(policy.catchUpRate * 100) : "")
      setWaterfallType(policy.waterfallType || "")
    }
    if (!isOpen) {
      setErrors({})
    }
  }, [isOpen, policy])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (feeRate) {
      const n = parseFloat(feeRate)
      if (isNaN(n) || n < 0 || n > 100) errs.feeRate = "Enter a valid % between 0 and 100"
      if (!feeBase) errs.feeBase = "Fee base is required when rate is set"
      if (!feeFrequency) errs.feeFrequency = "Frequency is required when rate is set"
    }
    if (hurdleType === "PREFERRED_RETURN" && !hurdleRate) {
      errs.hurdleRate = "Hurdle rate is required for preferred return"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const body: FundFeePolicyUpsertRequest = {}
    if (feeRate) {
      body.managementFeeRate = pctToFrac(feeRate)
      body.managementFeeBase = feeBase as any
      body.managementFeeFrequency = feeFrequency as any
    } else {
      body.managementFeeRate = null
    }
    if (feeStartDate) body.managementFeeStartDate = format(feeStartDate, "yyyy-MM-dd")
    if (carryRate) body.carryRate = pctToFrac(carryRate)
    if (hurdleType) body.hurdleType = hurdleType as any
    if (hurdleRate) body.hurdleRate = pctToFrac(hurdleRate)
    if (catchUpRate) body.catchUpRate = pctToFrac(catchUpRate)
    if (waterfallType) body.waterfallType = waterfallType as any

    try {
      setSubmitting(true)
      const res = await lpFeesApi.upsertFeePolicy(fundId, body)
      toast.success("Fee policy saved")
      onSaved(res.data)
      onClose()
    } catch (e: any) {
      toast.error("Failed to save fee policy", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">LP Fee & Carry Policy</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{fundName}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-6">
          {/* Management fee section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground border-b pb-2">Management Fee</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Annual Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  placeholder="e.g. 2"
                  className="rounded-full"
                />
                {errors.feeRate && <p className="text-xs text-red-600">{errors.feeRate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Fee Base</Label>
                <Select value={feeBase} onValueChange={setFeeBase}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMITTED">Committed Capital</SelectItem>
                    <SelectItem value="INVESTED">Invested Capital</SelectItem>
                    <SelectItem value="NAV">Net Asset Value</SelectItem>
                  </SelectContent>
                </Select>
                {errors.feeBase && <p className="text-xs text-red-600">{errors.feeBase}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Billing Frequency</Label>
                <Select value={feeFrequency} onValueChange={setFeeFrequency}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="SEMI_ANNUAL">Semi-Annual</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.feeFrequency && <p className="text-xs text-red-600">{errors.feeFrequency}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Fee Start Date</Label>
                <DatePicker value={feeStartDate} onChange={setFeeStartDate} allowFutureDates />
              </div>
            </div>
          </div>

          {/* Carry / waterfall section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground border-b pb-2">Carry & Waterfall</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>GP Carry Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={carryRate}
                  onChange={(e) => setCarryRate(e.target.value)}
                  placeholder="e.g. 20"
                  className="rounded-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hurdle Type</Label>
                <Select value={hurdleType} onValueChange={setHurdleType}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No hurdle</SelectItem>
                    <SelectItem value="PREFERRED_RETURN">Preferred Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hurdleType === "PREFERRED_RETURN" && (
                <div className="space-y-1.5">
                  <Label>Hurdle Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={hurdleRate}
                    onChange={(e) => setHurdleRate(e.target.value)}
                    placeholder="e.g. 8"
                    className="rounded-full"
                  />
                  {errors.hurdleRate && <p className="text-xs text-red-600">{errors.hurdleRate}</p>}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Catch-Up Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={catchUpRate}
                  onChange={(e) => setCatchUpRate(e.target.value)}
                  placeholder="e.g. 100"
                  className="rounded-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Waterfall Type</Label>
                <Select value={waterfallType} onValueChange={setWaterfallType}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUROPEAN">European</SelectItem>
                    <SelectItem value="AMERICAN">American</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full gap-1.5 gradient-primary text-white" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Policy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
