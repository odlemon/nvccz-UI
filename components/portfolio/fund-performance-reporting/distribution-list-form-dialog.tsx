"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { createDistributionList, updateDistributionList } from "@/lib/store/slices/fundPerformanceReportingSlice"
import type { ReportDistributionList, DistributionListSourceType } from "@/lib/api/fund-performance-reporting-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DistributionListFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  fundId: string
  target: ReportDistributionList | null
}

export function DistributionListFormDialog({ open, onOpenChange, fundId, target }: DistributionListFormDialogProps) {
  const dispatch = useAppDispatch()
  const isEdit = !!target

  const [name, setName] = useState("")
  const [sourceType, setSourceType] = useState<DistributionListSourceType>("COMMITMENT_COHORT")
  const [roleCodesText, setRoleCodesText] = useState("")
  const [cohortFilterText, setCohortFilterText] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(target?.name ?? "")
      setSourceType(target?.sourceType ?? "COMMITMENT_COHORT")
      setRoleCodesText((target?.roleCodes ?? []).join(", "))
      setCohortFilterText(target?.cohortFilter ? JSON.stringify(target.cohortFilter, null, 2) : "")
      setJsonError(null)
    }
  }, [open, target])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    let cohortFilter: Record<string, any> | undefined
    if (sourceType === "COMMITMENT_COHORT" && cohortFilterText.trim()) {
      try {
        cohortFilter = JSON.parse(cohortFilterText)
        setJsonError(null)
      } catch (e: any) {
        setJsonError(`Invalid JSON: ${e.message}`)
        return
      }
    }

    const roleCodes = sourceType === "ROLE_BOUND"
      ? roleCodesText.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined

    const data = { fundId, name, sourceType, roleCodes, cohortFilter }

    setSubmitting(true)
    try {
      if (isEdit && target) {
        await dispatch(updateDistributionList({ id: target.id, fundId, data })).unwrap()
        toast.success("Distribution list updated")
      } else {
        await dispatch(createDistributionList(data)).unwrap()
        toast.success("Distribution list created")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(isEdit ? "Failed to update distribution list" : "Failed to create distribution list", { description: err?.message || String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Distribution List" : "New Distribution List"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="e.g. All Active LPs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Source Type</Label>
            <Select value={sourceType} onValueChange={(v) => setSourceType(v as DistributionListSourceType)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COMMITMENT_COHORT">Commitment Cohort</SelectItem>
                <SelectItem value="ROLE_BOUND">Role Bound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === "ROLE_BOUND" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Role Codes (comma-separated)</Label>
              <Input
                value={roleCodesText}
                onChange={(e) => setRoleCodesText(e.target.value)}
                className="h-9"
                placeholder="e.g. LIMITED_PARTNER, BOARD_MEMBER"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Cohort Filter (JSON)</Label>
              <Textarea
                value={cohortFilterText}
                onChange={(e) => { setCohortFilterText(e.target.value); setJsonError(null) }}
                placeholder='{"minCommitment": 100000}'
                rows={5}
                className="font-mono text-xs"
              />
              {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
