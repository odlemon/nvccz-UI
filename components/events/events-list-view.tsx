"use client"

import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiCalendar, CiLocationOn, CiDollar } from "react-icons/ci"
import { format } from "date-fns"
import { UserAvatarDropdown } from "./user-avatar-dropdown"

export function EventsListView() {
  const router = useRouter()
  const { events, filters } = useAppSelector((state) => state.events)

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.location.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = filters.status === "ALL" || event.status === filters.status
    const matchesType = filters.eventType === "ALL" || event.eventType === filters.eventType
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BUDGET_APPROVED":
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200"
      case "BUDGET_PENDING":
      case "PLANNING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "BUDGET_REJECTED":
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200"
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      {filteredEvents.map((event) => (
        <Card
          key={event.id}
          className="p-6 cursor-pointer hover:shadow-none hover:border-blue-400 hover:ring-2 hover:ring-blue-100 transition-all duration-300 border border-gray-200 shadow-none"
          onClick={() => router.push(`/events/${event.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                <Badge className={getStatusColor(event.status)}>
                  {event.status.replace(/_/g, " ")}
                </Badge>
                {event.eventType && (
                  <Badge variant="outline">{event.eventType}</Badge>
                )}
              </div>

              {event.description && <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CiCalendar size={18} className="text-muted-foreground flex-shrink-0" />
                  <span>{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CiLocationOn size={18} className="text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CiDollar size={18} className="text-muted-foreground flex-shrink-0" />
                  <span>
                    ${(Number(event.approvedBudget) || Number(event.estimatedBudget) || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <UserAvatarDropdown
                    user={event.author}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={(e) => {
              e.stopPropagation()
              router.push(`/events/${event.id}`)
            }}>
              View Details
            </Button>
          </div>
        </Card>
      ))}

      {filteredEvents.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">No events found</p>
          </div>
        </Card>
      )}
    </div>
  )
}
