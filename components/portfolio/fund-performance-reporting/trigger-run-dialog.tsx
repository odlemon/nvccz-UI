"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { triggerRun } from "@/lib/store/slices/fundPerformanceReportingSlice"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface TriggerRunDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  fundId: string
}

export function TriggerRunDialog({ open, onOpenChange, fundId }: TriggerRunDialogProps) {
  const dispatch = useAppDispatch()
  const { templates, distributionLists, triggerRunLoading } = useAppSelector((s) => s.fundPerformanceReporting)
  const fundName = useAppSelector((s) => s.funds.funds.find((f) => f.id === fundId)?.name) ?? fundId

  const [templateId, setTemplateId] = useState("")
  const [distributionListId, setDistributionListId] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTemplateId("")
      setDistributionListId("")
      setPeriodStart("")
      setPeriodEnd("")
      setLocalError(null)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!templateId || !distributionListId || !periodStart || !periodEnd) {
      setLocalError("All fields are required")
      return
    }
    setLocalError(null)
    try {
      await dispatch(triggerRun({ fundId, templateId, distributionListId, periodStart, periodEnd })).unwrap()
      toast.success("Report run triggered")
      onOpenChange(false)
    } catch (err: any) {
      // Surfaced verbatim and left visible — e.g. the confirmed real 400
      // "No eligible recipients for this run" must not vanish like a toast would.
      setLocalError(err?.message || String(err) || "Failed to trigger report run")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trigger Report Run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {localError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Fund</Label>
            <Input value={fundName} disabled className="h-9 bg-gray-50" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Distribution List</Label>
            <Select value={distributionListId} onValueChange={setDistributionListId}>
              <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select distribution list" /></SelectTrigger>
              <SelectContent>
                {distributionLists.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Period Start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Period End</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="h-9" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={triggerRunLoading}>Cancel</Button>
          <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={triggerRunLoading}>
            {triggerRunLoading ? "Triggering…" : "Trigger Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
