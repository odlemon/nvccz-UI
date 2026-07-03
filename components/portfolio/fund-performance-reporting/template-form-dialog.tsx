"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { createTemplate, updateTemplate } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportTemplate, ReportLevel } from "@/lib/api/fund-performance-reporting-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  fundId: string
  target: ReportTemplate | null
}

export function TemplateFormDialog({ open, onOpenChange, fundId, target }: TemplateFormDialogProps) {
  const dispatch = useAppDispatch()
  const isEdit = !!target
  const [name, setName] = useState("")
  const [reportLevel, setReportLevel] = useState<ReportLevel>("INVESTOR")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(target?.name ?? "")
      setReportLevel(target?.reportLevel ?? "INVESTOR")
      setDescription(target?.description ?? "")
    }
  }, [open, target])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && target) {
        await dispatch(updateTemplate({ id: target.id, fundId, data: { name, reportLevel, description } })).unwrap()
        toast.success("Template updated")
      } else {
        await dispatch(createTemplate({ name, reportLevel, description, fundId })).unwrap()
        toast.success("Template created")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(isEdit ? "Failed to update template" : "Failed to create template", { description: err?.message || String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Report Template" : "New Report Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="e.g. Quarterly LP Report" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Report Level</Label>
            <Select value={reportLevel} onValueChange={(v) => setReportLevel(v as ReportLevel)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INVESTOR">Investor</SelectItem>
                <SelectItem value="BOARD">Board</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
