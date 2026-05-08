"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { checkInGuest } from "@/lib/store/slices/eventsSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { CiCirclePlus, CiSearch, CiMail, CiPhone, CiUser, CiCircleCheck } from "react-icons/ci"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, Upload } from "lucide-react"
import { format } from "date-fns"
import { AddGuestDialog } from "../add-guest-dialog"
import { BulkUploadGuestsDialog } from "../bulk-upload-guests-dialog"

interface EventGuestsTabProps {
  eventId: string
}

export function EventGuestsTab({ eventId }: EventGuestsTabProps) {
  const dispatch = useAppDispatch()
  const { currentEventGuests, guestsPagination, loading } = useAppSelector((state) => state.events)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)

  const filteredGuests = currentEventGuests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  )



  const handleCheckIn = async (guestId: string) => {
    await dispatch(checkInGuest({ eventId, guestId }))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRSVPColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-700 border-green-200"
      case "DECLINED":
        return "bg-red-100 text-red-700 border-red-200"
      case "MAYBE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const stats = {
    total: currentEventGuests.length,
    accepted: currentEventGuests.filter((g) => g.rsvpStatus === "ACCEPTED").length,
    declined: currentEventGuests.filter((g) => g.rsvpStatus === "DECLINED").length,
    pending: currentEventGuests.filter((g) => g.rsvpStatus === "PENDING").length,
    checkedIn: currentEventGuests.filter((g) => g.checkedIn).length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Guests</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <CiUser size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-white">{stats.total}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">Total invited</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal">{stats.accepted}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <span className="text-white text-sm font-bold">✗</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-red-600">{stats.declined}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">Not attending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-primary border border-gray-200 hover:border-gray-300 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <span className="text-white text-sm font-bold">?</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal text-white">{stats.pending}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">Awaiting response</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <CiCircleCheck size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-normal">{stats.checkedIn}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground">Arrived</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <CiSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsBulkDialogOpen(true)}
          className="gap-2 rounded-full h-10 px-6"
        >
          <Upload size={18} />
          Bulk Upload
        </Button>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          variant="gradient-create"
          className="gap-2 rounded-full h-10 px-6 shadow-sm"
        >
          <CiCirclePlus size={20} />
          Add Guest
        </Button>
      </div>

      {/* Guest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => (
          <Collapsible key={guest.id}>
            <Card className="overflow-hidden border border-gray-200 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{guest.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{guest.email}</p>
                      </div>
                    </div>
                    <Badge className={getRSVPColor(guest.rsvpStatus)}>
                      {guest.rsvpStatus}
                    </Badge>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="p-4 space-y-3">
                  {guest.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <CiUser size={16} className="text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{guest.company}</span>
                      {guest.title && <span className="text-muted-foreground">• {guest.title}</span>}
                    </div>
                  )}
                  
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <CiPhone size={16} className="text-muted-foreground flex-shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}

                  {guest.checkedIn ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      <CiCircleCheck size={18} />
                      <span>Checked in {guest.checkedInAt && format(new Date(guest.checkedInAt), "MMM dd, HH:mm")}</span>
                    </div>
                  ) : guest.rsvpStatus === "ACCEPTED" ? (
                    <Button
                      size="sm"
                      variant="gradient-info"
                      className="w-full gap-2 rounded-full h-9 shadow-sm"
                      onClick={() => handleCheckIn(guest.id)}
                    >
                      <CiCircleCheck size={18} />
                      Check In
                    </Button>
                  ) : null}
                </div>

                {/* Collapsible Details */}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-center gap-2 border-t rounded-none h-10">
                    <span className="text-sm">View Details</span>
                    <ChevronDown size={16} />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 border-t bg-muted/30 space-y-3 text-sm">
                    {guest.rsvpRespondedAt && (
                      <div>
                        <span className="font-medium text-muted-foreground">RSVP Responded:</span>
                        <p>{format(new Date(guest.rsvpRespondedAt), "PPP 'at' p")}</p>
                      </div>
                    )}
                    
                    {guest.rsvpNotes && (
                      <div>
                        <span className="font-medium text-muted-foreground">RSVP Notes:</span>
                        <p className="text-foreground">{guest.rsvpNotes}</p>
                      </div>
                    )}

                    {guest.dietaryRequirements && (
                      <div>
                        <span className="font-medium text-muted-foreground">Dietary Requirements:</span>
                        <p className="text-foreground">{guest.dietaryRequirements}</p>
                      </div>
                    )}

                    {guest.accessibilityNeeds && (
                      <div>
                        <span className="font-medium text-muted-foreground">Accessibility Needs:</span>
                        <p className="text-foreground">{guest.accessibilityNeeds}</p>
                      </div>
                    )}

                    {guest.emergencyContact && (
                      <div>
                        <span className="font-medium text-muted-foreground">Emergency Contact:</span>
                        <p className="text-foreground">
                          {guest.emergencyContact}
                          {guest.emergencyPhone && ` - ${guest.emergencyPhone}`}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <span className="font-medium text-muted-foreground">Invitation Token:</span>
                      <p className="text-xs font-mono bg-background p-2 rounded mt-1 break-all">
                        {guest.invitationToken}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <CiUser size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No guests found</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              variant="gradient-create"
              className="mt-4 gap-2 rounded-full h-10 px-6 shadow-sm"
            >
              <CiCirclePlus size={20} />
              Add First Guest
            </Button>
          </div>
        </Card>
      )}

      {/* Add Guest Dialog */}
      <AddGuestDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        eventId={eventId}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadGuestsDialog
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        eventId={eventId}
      />
    </div>
  )
}
