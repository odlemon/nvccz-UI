"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { CiCalendar, CiLocationOn, CiSettings, CiCircleCheck } from "react-icons/ci"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { createEvent, updateEvent, fetchEvents } from "@/lib/store/slices/eventsSlice"
import { type EventType, type AppEvent } from "@/lib/api/events-api"

interface CreateEventWizardProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  editMode?: boolean
  eventToEdit?: AppEvent
}

interface EventFormData {
  title: string
  description: string
  startDate: Date
  startTime: string
  endDate: Date
  endTime: string
  location: string
  eventType: EventType
  maxAttendees: string
  rsvpDeadline: Date | null
  estimatedBudget: string
  isPublic: boolean
  requiresRSVP: boolean
  checkInRequired: boolean
  feedbackRequired: boolean
}

const EVENT_TYPES: EventType[] = ["CONFERENCE", "MEETING", "WORKSHOP", "SOCIAL", "TRAINING", "OTHER"]

export function CreateEventWizard({ isOpen, onClose, initialDate, editMode = false, eventToEdit }: CreateEventWizardProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<EventFormData>({
    mode: "onChange",
    defaultValues: editMode && eventToEdit ? {
      title: eventToEdit.title,
      description: eventToEdit.description,
      startDate: new Date(eventToEdit.startDate),
      startTime: format(new Date(eventToEdit.startDate), "HH:mm"),
      endDate: new Date(eventToEdit.endDate),
      endTime: format(new Date(eventToEdit.endDate), "HH:mm"),
      location: eventToEdit.location,
      eventType: eventToEdit.eventType || "CONFERENCE",
      maxAttendees: eventToEdit.maxAttendees?.toString() || "",
      rsvpDeadline: eventToEdit.rsvpDeadline ? new Date(eventToEdit.rsvpDeadline) : null,
      estimatedBudget: eventToEdit.estimatedBudget?.toString() || "",
      isPublic: eventToEdit.isPublic,
      requiresRSVP: eventToEdit.requiresRSVP,
      checkInRequired: eventToEdit.checkInRequired,
      feedbackRequired: eventToEdit.feedbackRequired,
    } : {
      title: "",
      description: "",
      startDate: initialDate || new Date(),
      startTime: "09:00",
      endDate: initialDate || new Date(),
      endTime: "17:00",
      location: "",
      eventType: "CONFERENCE",
      maxAttendees: "",
      rsvpDeadline: null,
      estimatedBudget: "",
      isPublic: false,
      requiresRSVP: true,
      checkInRequired: true,
      feedbackRequired: true,
    }
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const startTime = watch("startTime")
  const endTime = watch("endTime")
  const rsvpDeadline = watch("rsvpDeadline")
  const eventType = watch("eventType")
  const isPublic = watch("isPublic")
  const requiresRSVP = watch("requiresRSVP")
  const checkInRequired = watch("checkInRequired")
  const feedbackRequired = watch("feedbackRequired")

  useEffect(() => {
    if (initialDate && isOpen && !editMode) {
      setValue("startDate", initialDate)
      setValue("endDate", initialDate)
    }
    if (editMode && eventToEdit && isOpen) {
      setValue("title", eventToEdit.title)
      setValue("description", eventToEdit.description)
      setValue("startDate", new Date(eventToEdit.startDate))
      setValue("startTime", format(new Date(eventToEdit.startDate), "HH:mm"))
      setValue("endDate", new Date(eventToEdit.endDate))
      setValue("endTime", format(new Date(eventToEdit.endDate), "HH:mm"))
      setValue("location", eventToEdit.location)
      setValue("eventType", eventToEdit.eventType || "CONFERENCE")
      setValue("maxAttendees", eventToEdit.maxAttendees?.toString() || "")
      setValue("rsvpDeadline", eventToEdit.rsvpDeadline ? new Date(eventToEdit.rsvpDeadline) : null)
      setValue("estimatedBudget", eventToEdit.estimatedBudget?.toString() || "")
      setValue("isPublic", eventToEdit.isPublic)
      setValue("requiresRSVP", eventToEdit.requiresRSVP)
      setValue("checkInRequired", eventToEdit.checkInRequired)
      setValue("feedbackRequired", eventToEdit.feedbackRequired)
    }
  }, [initialDate, isOpen, editMode, eventToEdit, setValue])

  const onSubmit = async (data: EventFormData) => {
    if (!data.title.trim()) {
      toast.error("Please enter an event title")
      return
    }

    if (!data.location.trim()) {
      toast.error("Please enter a location")
      return
    }

    if (!data.startDate || !data.endDate) {
      toast.error("Please select start and end dates")
      return
    }

    if (data.endDate < data.startDate) {
      toast.error("End date must be after start date")
      return
    }

    setLoading(true)
    try {
      const startDateTime = new Date(data.startDate)
      const [startHour, startMinute] = data.startTime.split(':')
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

      const endDateTime = new Date(data.endDate)
      const [endHour, endMinute] = data.endTime.split(':')
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

      let rsvpDeadlineDateTime
      if (data.rsvpDeadline) {
        rsvpDeadlineDateTime = new Date(data.rsvpDeadline)
        rsvpDeadlineDateTime.setHours(23, 59, 59, 999)
      }

      const eventData = {
        title: data.title,
        description: data.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: data.location,
        eventType: data.eventType,
        maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : undefined,
        rsvpDeadline: rsvpDeadlineDateTime?.toISOString(),
        estimatedBudget: data.estimatedBudget ? Number(data.estimatedBudget) : undefined,
        isPublic: data.isPublic,
        requiresRSVP: data.requiresRSVP,
        checkInRequired: data.checkInRequired,
        feedbackRequired: data.feedbackRequired,
      }

      if (editMode && eventToEdit) {
        await dispatch(updateEvent({ id: eventToEdit.id, data: eventData })).unwrap()
        toast.success("Event updated successfully")
      } else {
        await dispatch(createEvent(eventData)).unwrap()
        toast.success("Event created successfully")
      }

      await dispatch(fetchEvents())
      handleClose()
    } catch (error: any) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} event:`, error)
      toast.error(`Failed to ${editMode ? 'update' : 'create'} event`, {
        description: error.message || "Please try again"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <CiCalendar className="w-5 h-5" />
            {editMode ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <p className="text-gray-600">
            {editMode ? "Update event details" : "Create a new event and manage all the details"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Basic Information</h3>
            <Card className="border-l-4 border-l-blue-500 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiCalendar className="w-5 h-5 text-blue-500" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: "Title is required" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="title"
                          placeholder="Annual Company Conference"
                          className="rounded-lg"
                        />
                      )}
                    />
                    {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={eventType} onValueChange={(value) => setValue("eventType", value as EventType)}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="Describe your event..."
                        rows={3}
                        className="rounded-lg"
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Date & Time</h3>
            <Card className="border-l-4 border-l-green-500 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiCalendar className="w-5 h-5 text-green-500" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <DatePicker
                      value={startDate}
                      onChange={(date) => setValue("startDate", date || new Date())}
                      placeholder="Select start date"
                      allowFutureDates={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <TimePicker value={startTime} onChange={(time) => setValue("startTime", time)} placeholder="09:00" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <DatePicker
                      value={endDate}
                      onChange={(date) => setValue("endDate", date || new Date())}
                      placeholder="Select end date"
                      allowFutureDates={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <TimePicker value={endTime} onChange={(time) => setValue("endTime", time)} placeholder="17:00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location & Attendance */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Location & Attendance</h3>
            <Card className="border-l-4 border-l-purple-500 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiLocationOn className="w-5 h-5 text-purple-500" />
                  Venue & Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Controller
                      name="location"
                      control={control}
                      rules={{ required: "Location is required" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="location"
                          placeholder="Convention Center, Harare"
                          className="rounded-lg"
                        />
                      )}
                    />
                    {errors.location && <span className="text-xs text-red-500">{errors.location.message}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">Max Attendees</Label>
                    <Controller
                      name="maxAttendees"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="maxAttendees"
                          type="number"
                          placeholder="500"
                          className="rounded-lg"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RSVP Deadline</Label>
                    <DatePicker
                      value={rsvpDeadline || undefined}
                      onChange={(date) => setValue("rsvpDeadline", date || null)}
                      placeholder="Select RSVP deadline"
                      allowFutureDates={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedBudget">Estimated Budget</Label>
                    <Controller
                      name="estimatedBudget"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="estimatedBudget"
                          type="number"
                          placeholder="50000"
                          className="rounded-lg"
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Configuration */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Event Configuration</h3>
            <Card className="border-l-4 border-l-amber-500 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <CiSettings className="w-5 h-5 text-amber-500" />
                  Settings & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setValue("isPublic", e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Public Event</span>
                    <p className="text-xs text-muted-foreground">Event will be visible to everyone</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={requiresRSVP}
                    onChange={(e) => setValue("requiresRSVP", e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Requires RSVP</span>
                    <p className="text-xs text-muted-foreground">Attendees must confirm attendance</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkInRequired}
                    onChange={(e) => setValue("checkInRequired", e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Check-in Required</span>
                    <p className="text-xs text-muted-foreground">Track attendee check-ins at the event</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={feedbackRequired}
                    onChange={(e) => setValue("feedbackRequired", e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Feedback Required</span>
                    <p className="text-xs text-muted-foreground">Collect feedback after the event</p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="rounded-full h-10 px-6">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            variant={editMode ? "gradient-update" : "gradient-create"}
            className="rounded-full h-10 px-6 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <CiCircleCheck className="mr-2 h-4 w-4" />
                {editMode ? "Update Event" : "Create Event"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
