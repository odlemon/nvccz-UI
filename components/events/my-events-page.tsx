"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchEvents, setViewMode, setSearchFilter, createEvent } from "@/lib/store/slices/eventsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CiSearch, CiCalendar, CiViewList, CiViewBoard, CiCirclePlus } from "react-icons/ci"
import { EventsListView } from "./events-list-view"
import { EventsGridView } from "./events-grid-view"
import { EventsCalendarView } from "./events-calendar-view"
import { CreateEventWizard } from "./create-event-wizard"
import { EventsListSkeleton } from "./events-skeleton"
import { cn } from "@/lib/utils"

export function MyEventsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { events, viewMode, filters, loading } = useAppSelector((state) => state.events)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchEvents())
  }, [dispatch])

  if (loading && events.length === 0) {
    return <EventsListSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage and track all your events</p>
        </div>
        <Button 
          onClick={() => setIsWizardOpen(true)} 
          variant="gradient-create"
          className="rounded-full h-10 px-6 shadow-sm"
        >
          <CiCirclePlus size={20} className="mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <CiSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => dispatch(setSearchFilter(e.target.value))}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => dispatch(setViewMode("list"))}
            className={cn(
              "gap-2 rounded-full h-9 px-4",
              viewMode === "list" && "gradient-primary text-white"
            )}
          >
            <CiViewList size={18} />
            List
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => dispatch(setViewMode("grid"))}
            className={cn(
              "gap-2 rounded-full h-9 px-4",
              viewMode === "grid" && "gradient-primary text-white"
            )}
          >
            <CiViewBoard size={18} />
            Grid
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => dispatch(setViewMode("calendar"))}
            className={cn(
              "gap-2 rounded-full h-9 px-4",
              viewMode === "calendar" && "gradient-primary text-white"
            )}
          >
            <CiCalendar size={18} />
            Calendar
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" && <EventsListView />}
      {viewMode === "grid" && <EventsGridView />}
      {viewMode === "calendar" && <EventsCalendarView />}

      {/* Create Event Wizard */}
      <CreateEventWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  )
}
