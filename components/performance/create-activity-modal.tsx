"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppDispatch } from "@/lib/store"
import { createTaskActivity } from "@/lib/store/slices/taskSlice"
import { toast } from "sonner"

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
  task: any
  onSuccess: () => void
}

export function CreateActivityModal({ isOpen, onClose, task, onSuccess }: CreateActivityModalProps) {
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [valueCollected, setValueCollected] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !title) {
      toast.error("Title is required.")
      return
    }

    if (!task.goalId) {
      toast.error("This task is not linked to a goal. Cannot log activity.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title,
        description,
        activityType: "task" as const,
        taskId: task.id,
        goalId: task.goalId,
        ...(valueCollected && { valueCollected: parseFloat(valueCollected) }),
      }

      await dispatch(createTaskActivity(payload)).unwrap()

      toast.success("Activity logged successfully.")
      onSuccess()
      setTitle("")
      setDescription("")
      setValueCollected("")
    } catch (error: any) {
      toast.error("Failed to log activity.", {
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log New Activity for: {task?.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activity-title">Activity Title *</Label>
            <Input
              id="activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Completed client meeting"
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="activity-description">Description (Optional)</Label>
            <Textarea
              id="activity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about the activity..."
              className="mt-2"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="activity-value">Value Collected (Optional)</Label>
            <Input
              id="activity-value"
              type="number"
              step="0.01"
              value={valueCollected}
              onChange={(e) => setValueCollected(e.target.value)}
              placeholder="e.g., 50000"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="rounded-full"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Logging...
                </>
              ) : (
                "Log Activity"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
