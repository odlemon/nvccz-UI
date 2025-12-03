"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CiCalendar, CiLocationOn, CiDollar, CiUser, CiCircleMore } from "react-icons/ci"
import { format } from "date-fns"
import type { AppEvent } from "@/lib/api/events-api"

interface EventDropdownProps {
  event: AppEvent
  onClick?: (e: React.MouseEvent) => void
}

export function EventDropdown({ event, onClick }: EventDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BUDGET_APPROVED":
      case "ACTIVE":
        return "bg-green-100 hover:bg-green-200 text-green-700"
      case "BUDGET_PENDING":
      case "PLANNING":
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
      case "BUDGET_REJECTED":
      case "CANCELLED":
        return "bg-red-100 hover:bg-red-200 text-red-700"
      case "COMPLETED":
        return "bg-blue-100 hover:bg-blue-200 text-blue-700"
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-700"
    }
  }

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    router.push(`/events/${event.id}`)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <div
          className={`text-xs p-1.5 rounded cursor-pointer transition-all truncate ${
            getStatusColor(event.status)
          }`}
          title={event.title}
        >
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-[10px] opacity-70 truncate">
            {format(new Date(event.startDate), "HH:mm")}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none truncate pr-2">{event.title}</p>
              <Badge className={getStatusColor(event.status).replace('hover:', '')} variant="outline">
                {event.status.replace(/_/g, " ")}
              </Badge>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiCalendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">Date & Time</span>
              <span className="text-sm">
                {format(new Date(event.startDate), "MMM dd, yyyy 'at' HH:mm")}
              </span>
              <span className="text-xs text-muted-foreground">
                to {format(new Date(event.endDate), "MMM dd, yyyy 'at' HH:mm")}
              </span>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiLocationOn className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">Location</span>
              <span className="text-sm">{event.location}</span>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-start gap-3 w-full">
            <CiUser className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">Organizer</span>
              <span className="text-sm">
                {event.author.firstName} {event.author.lastName}
              </span>
            </div>
          </div>
        </DropdownMenuItem>

        {(event.approvedBudget || event.estimatedBudget) && (
          <DropdownMenuItem className="cursor-default focus:bg-transparent">
            <div className="flex items-start gap-3 w-full">
              <CiDollar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-xs text-muted-foreground">Budget</span>
                <span className="text-sm">
                  ${(Number(event.approvedBudget) || Number(event.estimatedBudget) || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer focus:bg-blue-50"
          onClick={handleViewMore}
        >
          <CiCircleMore className="w-4 h-4 mr-2" />
          <span>View Full Details</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
