"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { updateEvent } from "@/lib/store/slices/eventsSlice"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type AppEvent, type EventType } from "@/lib/api/events-api"

interface EditEventDialogProps {
  event: AppEvent
  isOpen: boolean
  onClose: () => void
}

const EVENT_TYPES: EventType[] = ["CONFERENCE", "MEETING", "WORKSHOP", "SOCIAL", "TRAINING", "OTHER"]

export function EditEventDialog({ event, isOpen, onClose }: EditEventDialogProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    startDate: event.startDate.split("T")[0],
    startTime: event.startDate.split("T")[1]?.substring(0, 5) || "09:00",
    endDate: event.endDate.split("T")[0],
    endTime: event.endDate.split("T")[1]?.substring(0, 5) || "17:00",
    location: event.location,
    eventType: event.eventType || "CONFERENCE",
    maxAttendees: event.maxAttendees?.toString() || "",
    rsvpDeadline: event.rsvpDeadline?.split("T")[0] || "",
    estimatedBudget: event.estimatedBudget || "",
    isPublic: event.isPublic,
    requiresRSVP: event.requiresRSVP,
    checkInRequired: event.checkInRequired,
    feedbackRequired: event.feedbackRequired
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await dispatch(
        updateEvent({
          id: event.id,
          data: {
            title: formData.title,
            description: formData.description,
            startDate: `${formData.startDate}T${formData.startTime}:00.000Z`,
            endDate: `${formData.endDate}T${formData.endTime}:00.000Z`,
            location: formData.location,
            eventType: formData.eventType as EventType,
            maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : undefined,
            rsvpDeadline: formData.rsvpDeadline ? `${formData.rsvpDeadline}T23:59:59.000Z` : undefined,
            estimatedBudget: formData.estimatedBudget ? Number(formData.estimatedBudget) : undefined,
            isPublic: formData.isPublic,
            requiresRSVP: formData.requiresRSVP,
            checkInRequired: formData.checkInRequired,
            feedbackRequired: formData.feedbackRequired
          }
        })
      )
      onClose()
    } catch (error) {
      console.error("Failed to update event:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update event details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Annual Company Conference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Convention Center, Harare"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value as EventType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rsvpDeadline">RSVP Deadline</Label>
              <Input
                id="rsvpDeadline"
                type="date"
                value={formData.rsvpDeadline}
                onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Estimated Budget</Label>
              <Input
                id="estimatedBudget"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="50000"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Public Event</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresRSVP}
                onChange={(e) => setFormData({ ...formData, requiresRSVP: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Requires RSVP</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.checkInRequired}
                onChange={(e) => setFormData({ ...formData, checkInRequired: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Check-in Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.feedbackRequired}
                onChange={(e) => setFormData({ ...formData, feedbackRequired: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Feedback Required</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-full gradient-primary text-white">
            {loading ? "Updating..." : "Update Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
