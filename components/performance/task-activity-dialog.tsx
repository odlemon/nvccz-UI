"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface TaskActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<any>
}

export function TaskActivityDialog({ isOpen, onClose, onSubmit }: TaskActivityDialogProps) {
  const [formData, setFormData] = useState({
    activityType: "todo",
    title: "",
    description: "",
    monetaryValueAchieved: "",
    percentValueAchieved: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    try {
      setSubmitting(true)
      const payload: any = {
        activityType: formData.activityType,
        title: formData.title,
        description: formData.description,
        notes: formData.notes || undefined,
      }
      if (formData.monetaryValueAchieved) payload.monetaryValueAchieved = Number(formData.monetaryValueAchieved)
      if (formData.percentValueAchieved) payload.percentValueAchieved = Number(formData.percentValueAchieved)
      await onSubmit(payload)
      toast.success("Activity added")
      onClose()
    } catch (err: any) {
      toast.error("Failed to add activity", { description: err?.message || String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Task Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Activity Type</Label>
              <Select value={formData.activityType} onValueChange={(v) => setFormData({ ...formData, activityType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Monetary Achieved</Label>
              <Input type="number" value={formData.monetaryValueAchieved} onChange={(e) => setFormData({ ...formData, monetaryValueAchieved: e.target.value })} />
            </div>
            <div>
              <Label>Percent Achieved</Label>
              <Input type="number" step="0.01" value={formData.percentValueAchieved} onChange={(e) => setFormData({ ...formData, percentValueAchieved: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className={submitting ? "opacity-90 cursor-not-allowed" : ""}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 inline-block rounded-full border-2 border-white/60 border-b-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                "Add Activity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


