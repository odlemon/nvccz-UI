"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiCircleChevLeft, CiCircleChevRight, CiCirclePlus } from "react-icons/ci"
import { CreateEventWizard } from "./create-event-wizard"
import { EventDropdown } from "./event-dropdown"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"

export function EventsCalendarView() {
  const router = useRouter()
  const { events } = useAppSelector((state) => state.events)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startDate), day))
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDayClick = (day: Date, hasEvents: boolean) => {
    if (!hasEvents) {
      setSelectedDate(day)
      setIsWizardOpen(true)
    }
  }

  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <CiCircleChevLeft size={20} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <CiCircleChevRight size={20} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {daysInCalendar.map((day) => {
          const dayEvents = getEventsForDay(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <div
              key={day.toString()}
              className={`min-h-32 p-2 border rounded-lg transition-all cursor-pointer ${
                dayEvents.length === 0 ? 'hover:border-blue-400 hover:ring-2 hover:ring-blue-100 hover:bg-blue-50/30' : ''
              } ${
                isToday ? "bg-primary/5 border-primary" : "bg-background border-border"
              } ${!isCurrentMonth ? "opacity-50" : ""}`}
              onClick={() => handleDayClick(day, dayEvents.length > 0)}
            >
              <div className={`text-sm font-medium mb-1 flex items-center justify-between ${isToday ? "text-primary" : "text-foreground"}`}>
                <span>{format(day, "d")}</span>
                {dayEvents.length === 0 && isCurrentMonth && (
                  <CiCirclePlus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <EventDropdown
                    key={event.id}
                    event={event}
                    onClick={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-6 border-t">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
          <span className="text-xs text-muted-foreground">Approved/Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
          <span className="text-xs text-muted-foreground">Pending/Planning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
          <span className="text-xs text-muted-foreground">Rejected/Cancelled</span>
        </div>
      </div>

      {/* Create Event Wizard */}
      <CreateEventWizard 
        isOpen={isWizardOpen} 
        onClose={() => {
          setIsWizardOpen(false)
          setSelectedDate(null)
        }}
        initialDate={selectedDate || undefined}
      />
    </Card>
  )
}
