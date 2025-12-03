"use client"

import { useAppSelector } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CiSearch, CiMail, CiPhone, CiExport } from "react-icons/ci"
import { useState } from "react"

export function AttendeesPage() {
  const { list } = useAppSelector((state) => state.events)
  const [searchTerm, setSearchTerm] = useState("")

  // Flatten all guests from all events
  const allGuests = (list || []).flatMap((event) =>
    (event.guests || []).map((guest) => ({
      ...guest,
      eventTitle: event.title,
      eventId: event.id,
      eventDate: event.startDate,
    })),
  )

  // Remove duplicates by email
  const uniqueGuests = allGuests.reduce(
    (acc, guest) => {
      if (!acc.find((g) => g.email === guest.email)) {
        acc.push(guest)
      }
      return acc
    },
    [] as typeof allGuests,
  )

  const filteredGuests = uniqueGuests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RSVP_YES":
        return "bg-green-100 text-green-700 border-green-200"
      case "RSVP_NO":
        return "bg-red-100 text-red-700 border-red-200"
      case "CHECKED_IN":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Attendees</h1>
          <p className="text-muted-foreground mt-1">Manage event attendees and guests</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <CiExport size={18} />
          Export List
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Attendees</div>
          <div className="text-2xl font-semibold mt-1">{uniqueGuests.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Confirmed</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {allGuests.filter((g) => g.status === "RSVP_YES").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Checked In</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">{allGuests.filter((g) => g.checkedIn).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Internal</div>
          <div className="text-2xl font-semibold mt-1">{uniqueGuests.filter((g) => g.internalAttendee).length}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <CiSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Attendees Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Latest Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
              <TableRow key={`${guest.eventId}-${guest.id}`}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CiMail size={16} className="text-muted-foreground" />
                    {guest.email}
                  </div>
                </TableCell>
                <TableCell>
                  {guest.phone ? (
                    <div className="flex items-center gap-2">
                      <CiPhone size={16} className="text-muted-foreground" />
                      {guest.phone}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{guest.eventTitle}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(guest.status)}>{guest.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  {guest.internalAttendee ? (
                    <Badge variant="outline">Internal</Badge>
                  ) : (
                    <Badge variant="outline">External</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    <CiMail size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No attendees found</p>
          </div>
        )}
      </Card>
    </div>
  )
}
