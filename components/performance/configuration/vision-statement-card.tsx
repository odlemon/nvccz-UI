"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchVisionStatement,
  updateStrategy,
} from "@/lib/store/slices/performanceConfigSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { extractApiError } from "@/lib/utils/api-error"

export function VisionStatementCard() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { visionStatement, activeStrategyId } = useAppSelector(
    (s) => s.performanceConfig
  )

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchVisionStatement())
  }, [dispatch])

  const handleOpen = () => {
    setDraft(visionStatement || "")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!activeStrategyId) {
      toast.error("No active strategy found. Create one first.")
      return
    }
    if (!draft.trim()) {
      toast.error("Vision statement cannot be empty")
      return
    }
    setSaving(true)
    try {
      await dispatch(
        updateStrategy({
          id: activeStrategyId,
          data: { visionStatement: draft.trim() },
        })
      ).unwrap()
      await dispatch(fetchVisionStatement()).unwrap()
      toast.success("Vision statement updated")
      setOpen(false)
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to update vision statement"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Vision Statement</CardTitle>
          </div>
          {permissions.canEditVisionStatement && (
            <Button
              size="sm"
              onClick={handleOpen}
              className="rounded-full gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {visionStatement ? (
            <p className="text-base text-gray-800 leading-relaxed italic">
              "{visionStatement}"
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              No vision statement set yet.
              {permissions.canEditVisionStatement &&
                " Click Edit to add the organisational vision."}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vision Statement</DialogTitle>
            <DialogDescription>
              The organisational vision is shown to all employees on the dashboard.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Our vision is..."
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              className="rounded-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
