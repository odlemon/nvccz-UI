"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CiCalendar, CiLocationOn, CiUser, CiDollar, CiCircleCheck } from "react-icons/ci"
import { format } from "date-fns"
import { type AppEvent } from "@/lib/api/events-api"

interface EventOverviewProps {
  event: AppEvent
}

export function EventOverview({ event }: EventOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CiCalendar size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">Start Date & Time</div>
                <div className="font-semibold mt-1">{format(new Date(event.startDate), "PPP")}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(event.startDate), "p")}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <CiCalendar size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">End Date & Time</div>
                <div className="font-semibold mt-1">{format(new Date(event.endDate), "PPP")}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(event.endDate), "p")}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CiLocationOn size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="font-semibold mt-1">{event.location}</div>
                {event.eventType && (
                  <Badge variant="outline" className="mt-1">
                    {event.eventType}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CiUser size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">Organizer</div>
                <div className="font-semibold mt-1">
                  {event.author.firstName} {event.author.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{event.author.email}</div>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
              <p className="text-foreground leading-relaxed">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Event Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Maximum Attendees</span>
                <span className="font-semibold">{event.maxAttendees || "Unlimited"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Public Event</span>
                <Badge variant={event.isPublic ? "default" : "outline"}>
                  {event.isPublic ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Requires RSVP</span>
                <Badge variant={event.requiresRSVP ? "default" : "outline"}>
                  {event.requiresRSVP ? "Yes" : "No"}
                </Badge>
              </div>
              {event.rsvpDeadline && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RSVP Deadline</span>
                  <span className="font-semibold">{format(new Date(event.rsvpDeadline), "PPP")}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-in Required</span>
                <Badge variant={event.checkInRequired ? "default" : "outline"}>
                  {event.checkInRequired ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Feedback Required</span>
                <Badge variant={event.feedbackRequired ? "default" : "outline"}>
                  {event.feedbackRequired ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Status</span>
                <Badge variant={event.isActive ? "default" : "outline"}>
                  {event.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Information */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Estimated Budget</div>
                <div className="text-2xl font-semibold">
                  ${event.estimatedBudget ? Number(event.estimatedBudget).toLocaleString() : "0"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Approved Budget</div>
                <div className="text-2xl font-semibold text-green-600">
                  ${event.approvedBudget ? Number(event.approvedBudget).toLocaleString() : "0"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Budget Status</div>
                <Badge className="mt-1" variant={event.budgetStatus === "APPROVED" ? "default" : "outline"}>
                  {event.budgetStatus}
                </Badge>
              </div>
            </div>

            {event.budgetApprovedBy && event.budgetApprovedAt && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Budget approved on {format(new Date(event.budgetApprovedAt), "PPP 'at' p")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      {event.googleCalendarEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CiCircleCheck size={24} className="text-green-600" />
              <div>
                <div className="font-medium">Synced with Google Calendar</div>
                {event.googleCalendarLink && (
                  <a
                    href={event.googleCalendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View in Google Calendar
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{format(new Date(event.createdAt), "PPP 'at' p")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{format(new Date(event.updatedAt), "PPP 'at' p")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
