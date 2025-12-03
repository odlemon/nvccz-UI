"use client"

import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setCurrentEvent } from "@/lib/store/slices/eventsSlice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiCalendar, CiLocationOn, CiCircleCheck, CiCircleRemove } from "react-icons/ci"
import { format } from "date-fns"

export function InvitationsPage() {
  const dispatch = useAppDispatch()
  const { list } = useAppSelector((state) => state.events)

  // Filter events where current user is invited
  const myInvitations = (list || []).filter((event) => event.myStatus)

  const handleRSVP = (eventId: string, status: "RSVP_YES" | "RSVP_NO") => {
    // In a real app, this would update the guest status for the current user
    console.log(`RSVP ${status} for event ${eventId}`)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "RSVP_YES":
        return "bg-green-100 text-green-700 border-green-200"
      case "RSVP_NO":
        return "bg-red-100 text-red-700 border-red-200"
      case "INVITED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">My Invitations</h1>
        <p className="text-muted-foreground mt-1">Events you have been invited to</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Invitations</div>
          <div className="text-2xl font-semibold mt-1">{myInvitations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Accepted</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {myInvitations.filter((e) => e.myStatus === "RSVP_YES").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending Response</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">
            {myInvitations.filter((e) => e.myStatus === "INVITED").length}
          </div>
        </Card>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {myInvitations.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                  <Badge className={getStatusColor(event.myStatus)}>{event.myStatus?.replace("_", " ")}</Badge>
                </div>

                {event.description && <p className="text-muted-foreground mb-4">{event.description}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CiCalendar size={18} className="text-muted-foreground" />
                    <span>{format(new Date(event.startDate), "PPP p")}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CiLocationOn size={18} className="text-muted-foreground" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">Hosted by {event.creatorName}</div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {event.myStatus === "INVITED" && (
                  <>
                    <Button size="sm" className="gap-2" onClick={() => handleRSVP(event.id, "RSVP_YES")}>
                      <CiCircleCheck size={18} />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => handleRSVP(event.id, "RSVP_NO")}
                    >
                      <CiCircleRemove size={18} />
                      Decline
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => dispatch(setCurrentEvent(event.id))}>
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {myInvitations.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">No invitations at the moment</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
