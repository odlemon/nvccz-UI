"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, MapPin, Users, MessageSquare, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { eventsApi, type AppEvent } from "@/lib/api/events-api"

export default function PublicEventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventsApi.getByIdPublic(eventId)
        if (res.success && res.data) {
          setEvent(res.data)
        } else {
          setError(res.message || "Event not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load event")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50">
        <Card className="max-w-md w-full p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-6">{error || "This event may have been removed or is unavailable."}</p>
          <Link href="/events/public">
            <Button className="rounded-full">Browse Public Events</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href="/events/public"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </Link>

        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {event.eventType && (
                <Badge className="bg-white/20 hover:bg-white/30 border-0 text-white">{event.eventType}</Badge>
              )}
              {event.status && (
                <Badge className="bg-white/20 hover:bg-white/30 border-0 text-white">{event.status}</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{event.title}</h1>
            {event.description && <p className="text-white/90 text-lg">{event.description}</p>}
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Date</div>
                  <div className="font-medium">{format(new Date(event.startDate), "PPP")}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Time</div>
                  <div className="font-medium">
                    {format(new Date(event.startDate), "p")}
                    {event.endDate && ` – ${format(new Date(event.endDate), "p")}`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Location</div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>

              {event.maxAttendees != null && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Capacity</div>
                    <div className="font-medium">{event.maxAttendees} attendees</div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Organized by</div>
              <div className="font-medium">
                {event.author.firstName} {event.author.lastName}
              </div>
            </div>

            {event.feedbackRequired && (
              <div className="border-t pt-6">
                <Link href={`/events/feedback/${event.id}`}>
                  <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full">
                    <MessageSquare className="w-4 h-4" />
                    Share Feedback
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
