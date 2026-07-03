"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { createSchedule, updateSchedule } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportSchedule, PeriodType } from "@/lib/api/fund-performance-reporting-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  fundId: string
  target: ReportSchedule | null
}

const PERIOD_TYPES: PeriodType[] = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]

export function ScheduleFormDialog({ open, onOpenChange, fundId, target }: ScheduleFormDialogProps) {
  const dispatch = useAppDispatch()
  const { templates, distributionLists } = useAppSelector((s) => s.fundPerformanceReporting)
  const isEdit = !!target

  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [periodType, setPeriodType] = useState<PeriodType>("QUARTERLY")
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [hourOfDay, setHourOfDay] = useState("8")
  const [timezone, setTimezone] = useState("Africa/Harare")
  const [distributionListId, setDistributionListId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(target?.name ?? "")
      setTemplateId(target?.templateId ?? "")
      setPeriodType(target?.periodType ?? "QUARTERLY")
      setDayOfMonth(String(target?.dayOfMonth ?? 1))
      setHourOfDay(String(target?.hourOfDay ?? 8))
      setTimezone(target?.timezone ?? "Africa/Harare")
      setDistributionListId(target?.distributionListId ?? "")
    }
  }, [open, target])

  const isValid = name.trim() && templateId && distributionListId && timezone.trim() &&
    Number(dayOfMonth) >= 1 && Number(dayOfMonth) <= 31 &&
    Number(hourOfDay) >= 0 && Number(hourOfDay) <= 23

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please fill in all fields with valid values")
      return
    }
    const data = {
      fundId,
      templateId,
      name,
      periodType,
      dayOfMonth: Number(dayOfMonth),
      hourOfDay: Number(hourOfDay),
      timezone,
      distributionListId,
    }
    setSubmitting(true)
    try {
      if (isEdit && target) {
        await dispatch(updateSchedule({ id: target.id, fundId, data })).unwrap()
        toast.success("Schedule updated")
      } else {
        await dispatch(createSchedule(data)).unwrap()
        toast.success("Schedule created")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(isEdit ? "Failed to update schedule" : "Failed to create schedule", { description: err?.message || String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Report Schedule" : "New Report Schedule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="e.g. Quarterly LP Distribution" />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select list" /></SelectTrigger>
                <SelectContent>
                  {distributionLists.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Period Type</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPES.map((p) => <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Day of Month</Label>
              <Input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hour of Day (0–23)</Label>
              <Input type="number" min={0} max={23} value={hourOfDay} onChange={(e) => setHourOfDay(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Timezone</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9" placeholder="Africa/Harare" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
