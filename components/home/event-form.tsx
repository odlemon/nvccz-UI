"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

export interface EventFormValues {
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
}

interface EventFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialValues?: Partial<EventFormValues>
}

export function EventForm({ open, onClose, onSubmit, mode = 'create', initialValues }: EventFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && initialValues) {
      if (initialValues.title) setTitle(initialValues.title)
      if (initialValues.description) setDescription(initialValues.description)
      if (initialValues.location) setLocation(initialValues.location)
      if (initialValues.startDate) setStartDate(new Date(initialValues.startDate))
      if (initialValues.endDate) setEndDate(new Date(initialValues.endDate))
    }
    if (!open && mode === 'create') {
      setTitle("")
      setDescription("")
      setLocation("")
      setStartDate(null)
      setEndDate(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ 
        title, 
        description, 
        location, 
        startDate: startDate ? startDate.toISOString() : "", 
        endDate: endDate ? endDate.toISOString() : "" 
      })
      if (mode === 'create') {
        setTitle("")
        setDescription("")
        setLocation("")
        setStartDate(null)
        setEndDate(null)
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent className="max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">{mode === 'edit' ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription className="text-gray-600">
            Add events with title, description, location and dates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-full" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-full" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start *</Label>
              <DatePicker value={startDate} onChange={setStartDate} allowFutureDates={true} />
            </div>
            <div className="space-y-2">
              <Label>End *</Label>
              <DatePicker value={endDate} onChange={setEndDate} allowFutureDates={true} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => !submitting && onClose()} disabled={submitting}>Cancel</Button>
            <Button type="submit" className="gradient-primary" disabled={submitting || !title || !description || !location || !startDate || !endDate}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EventForm


