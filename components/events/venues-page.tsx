"use client"

import { useAppSelector } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiLocationOn, CiCalendar, CiCirclePlus } from "react-icons/ci"

export function VenuesPage() {
  const { list } = useAppSelector((state) => state.events)

  // Group events by venue
  const venueGroups = (list || []).reduce(
    (acc, event) => {
      if (!acc[event.venue]) {
        acc[event.venue] = []
      }
      acc[event.venue].push(event)
      return acc
    },
    {} as Record<string, typeof list>,
  )

  const venues = Object.entries(venueGroups).map(([name, events]) => ({
    name,
    events,
    totalEvents: events.length,
    totalCost: events.reduce((sum, e) => sum + (e.totalCost || 0), 0),
    avgCost: events.reduce((sum, e) => sum + (e.totalCost || 0), 0) / events.length,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Venues</h1>
          <p className="text-muted-foreground mt-1">Manage event venues and locations</p>
        </div>
        <Button className="gap-2">
          <CiCirclePlus size={20} />
          Add Venue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Venues</div>
          <div className="text-2xl font-semibold mt-1">{venues.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Most Used</div>
          <div className="text-2xl font-semibold mt-1">
            {venues.sort((a, b) => b.totalEvents - a.totalEvents)[0]?.name.substring(0, 20) || "N/A"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Venue Spend</div>
          <div className="text-2xl font-semibold mt-1">
            ${venues.reduce((sum, v) => sum + v.totalCost, 0).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <Card key={venue.name} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CiLocationOn size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{venue.name}</h3>
                <Badge variant="outline" className="mt-1">
                  {venue.totalEvents} events
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Spend</span>
                <span className="font-medium">${venue.totalCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Cost</span>
                <span className="font-medium">
                  ${venue.avgCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">Recent Events</div>
                <div className="space-y-1">
                  {venue.events.slice(0, 2).map((event) => (
                    <div key={event.id} className="text-sm flex items-center gap-2">
                      <CiCalendar size={14} className="text-muted-foreground" />
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View Details
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
