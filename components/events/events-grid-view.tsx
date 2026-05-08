"use client"

import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiCalendar, CiLocationOn, CiDollar } from "react-icons/ci"
import { format } from "date-fns"
import { UserAvatarDropdown } from "./user-avatar-dropdown"

export function EventsGridView() {
  const router = useRouter()
  const { events, filters } = useAppSelector((state) => state.events)

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.location.toLowerCase().includes(filters.search.toLowerCase())
    return matchesSearch
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map((event) => (
        <Card
          key={event.id}
          className="cursor-pointer hover:shadow-none hover:border-blue-400 hover:ring-2 hover:ring-blue-100 transition-all duration-300 overflow-hidden border border-gray-200 shadow-none"
          onClick={() => router.push(`/events/${event.id}`)}
        >
          {/* Card Header with gradient */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <CiCalendar size={24} className="text-primary" />
              </div>
              <Badge className={`${getStatusColor(event.status)} text-xs`}>
                {event.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground line-clamp-2">{event.title}</h3>
          </div>

          {/* Card Content */}
          <CardContent className="p-6 space-y-4">
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CiCalendar size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CiLocationOn size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <UserAvatarDropdown
                  user={event.author}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CiDollar size={16} className="flex-shrink-0" />
                <span>
                  $
                  {(event.approvedBudget
                    ? Number(event.approvedBudget)
                    : event.estimatedBudget
                    ? Number(event.estimatedBudget)
                    : 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full h-9"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/events/${event.id}`)
                  }}
                >
                  View Details
                </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredEvents.length === 0 && (
        <div className="col-span-full text-center py-12">
          <CiCalendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      )}
    </div>
  )
}
