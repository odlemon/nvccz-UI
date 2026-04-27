"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { eventsApi, type AppEvent } from "@/lib/api/events-api"

export default function PublicEventsPage() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = filter === "upcoming"
          ? await eventsApi.getUpcomingPublic()
          : await eventsApi.getAllPublic()
        if (res.success && res.data) setEvents(res.data)
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Events</h1>
          <p className="text-gray-600">Browse events open to the public</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
            className="rounded-full"
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All Events
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events to show right now. Please check back later.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/public/${event.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 border-b">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      {event.eventType && <Badge variant="outline">{event.eventType}</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(event.startDate), "PPP")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {event.author.firstName} {event.author.lastName}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
