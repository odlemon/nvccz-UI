"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchEvents, fetchUpcomingEvents } from "@/lib/store/slices/eventsSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiCalendar, CiDollar, CiUser, CiTrophy, CiCirclePlus } from "react-icons/ci"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { EventsDashboardSkeleton } from "./events-skeleton"

export function EventsDashboard() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { events, loading } = useAppSelector((state) => state.events)

  useEffect(() => {
    dispatch(fetchEvents())
  }, [dispatch])

  // Calculate summary metrics
  const today = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.startDate) > today)

  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const thisMonthBudget = events
    .filter((e) => {
      const eventDate = new Date(e.startDate)
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })
    .reduce((sum, e) => sum + Number(e.approvedBudget || e.estimatedBudget || 0), 0)

  const totalBudget = events.reduce((sum, e) => sum + Number(e.approvedBudget || e.estimatedBudget || 0), 0)

  const statCards = [
    {
      title: "Total Upcoming Events",
      value: upcomingEvents.length,
      amount: `${upcomingEvents.length} scheduled`,
      change: "View all upcoming",
      trend: "up",
      icon: CiCalendar,
      color: "gradient-primary",
    },
    {
      title: "This Month's Budget",
      value: `$${thisMonthBudget.toLocaleString()}`,
      amount: "Allocated",
      change: `${events.filter(e => {
        const eventDate = new Date(e.startDate)
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
      }).length} events`,
      trend: "up",
      icon: CiDollar,
      color: "bg-white",
    },
    {
      title: "Total Events",
      value: events.length,
      amount: "All time",
      change: `${events.filter(e => e.status === "COMPLETED").length} completed`,
      trend: "up",
      icon: CiUser,
      color: "gradient-primary",
    },
    {
      title: "Total Budget",
      value: `$${totalBudget.toLocaleString()}`,
      amount: "Allocated",
      change: `${events.filter(e => e.budgetStatus === "APPROVED").length} approved`,
      trend: "up",
      icon: CiTrophy,
      color: "bg-white",
    },
  ]

  // Events by month for chart
  const eventsByMonth = events.reduce((acc, event) => {
    const month = format(new Date(event.startDate), "MMM")
    const existing = acc.find(item => item.month === month)
    if (existing) {
      existing.events += 1
      existing.budget += Number(event.approvedBudget || event.estimatedBudget || 0)
    } else {
      acc.push({
        month,
        events: 1,
        budget: Number(event.approvedBudget || event.estimatedBudget || 0)
      })
    }
    return acc
  }, [] as Array<{ month: string; events: number; budget: number }>)

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

  if (loading && events.length === 0) {
    return <EventsDashboardSkeleton />
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Events Dashboard</h1>
          <p className="text-muted-foreground">Manage and track all your events</p>
        </div>
        <Button 
          onClick={() => router.push("/events/my-events")} 
          variant="gradient-create"
          className="rounded-full h-10 px-6 shadow-sm"
        >
          <CiCirclePlus size={20} className="mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className={`border border-gray-200 hover:border-gray-300 transition-all duration-300 ${index % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${index % 2 === 0 ? 'text-white' : 'text-muted-foreground'}`}>{stat.title}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index % 2 === 0 ? 'bg-white/20' : 'gradient-primary'}`}>
                    <Icon className={`h-4 w-4 ${index % 2 === 0 ? 'text-white' : 'text-white'}`} />
                  </div>
                </div>
                <div className={`text-5xl font-normal ${index % 2 === 0 ? 'text-white' : ''}`}>{stat.value}</div>
                <p className={`text-sm mt-2 ${index % 2 === 0 ? 'text-white/80' : 'text-muted-foreground'}`}>{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart */}
      {eventsByMonth.length > 0 && (
        <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:border-gray-300 transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <CiTrophy className="w-4 h-4 text-white" />
              </div>
              Events Overview
            </h3>
            <p className="text-sm text-muted-foreground">Events and budget by month</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="month" stroke="#374151" />
              <YAxis yAxisId="left" stroke="#374151" />
              <YAxis yAxisId="right" orientation="right" stroke="#374151" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="events" fill="#a78bfa" name="Events" />
              <Bar yAxisId="right" dataKey="budget" fill="#60a5fa" name="Budget ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming Events */}
      <Card className="rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <CiCalendar className="w-4 h-4 text-white" />
                </div>
                Upcoming Events
              </h3>
              <p className="text-sm text-muted-foreground">Next 10 scheduled events</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/events/my-events")} className="rounded-full h-9 px-4">
              View All
            </Button>
          </div>
        </div>
        <div className="p-6">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 10).map((event) => (
                <Card
                  key={event.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CiCalendar size={16} />
                          {format(new Date(event.startDate), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <CiUser size={16} />
                          {event.author.firstName} {event.author.lastName}
                        </div>
                        {event.approvedBudget || event.estimatedBudget ? (
                          <div className="flex items-center gap-1">
                            <CiDollar size={16} />
                            ${Number(event.approvedBudget || event.estimatedBudget).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/events/${event.id}`)
                      }}
                      className="rounded-full h-8 px-4"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CiCalendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming events</p>
              <Button 
                onClick={() => router.push("/events/my-events")} 
                variant="gradient-create"
                className="mt-4 gap-2 rounded-full h-10 px-6 shadow-sm"
              >
                <CiCirclePlus size={20} />
                Create First Event
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
