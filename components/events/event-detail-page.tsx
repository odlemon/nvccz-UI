"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchEventById,
  fetchEventGuests,
  fetchBudgetItems,
  fetchExpenses,
  fetchFeedback,
  fetchAnalytics,
  updateEvent,
  deleteEvent
} from "@/lib/store/slices/eventsSlice"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CiCalendar, 
  CiLocationOn, 
  CiDollar, 
  CiUser, 
  CiEdit, 
  CiTrash, 
  CiCircleChevLeft,
  CiSettings,
  CiGrid2H,
  CiChat1
} from "react-icons/ci"
import { HiChartBar } from "react-icons/hi"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EventDetailSkeleton } from "./events-skeleton"
import { EventOverview } from "./event-detail-tabs/event-overview"
// import { EventOverview } from "./event-detail-tabs/event-overview"
import { EventGuestsTab } from "./event-detail-tabs/event-guests-tab"
import { EventBudgetTab } from "./event-detail-tabs/event-budget-tab"
import { EventExpensesTab } from "./event-detail-tabs/event-expenses-tab"
import { EventFeedbackTab } from "./event-detail-tabs/event-feedback-tab"
import { EventAnalyticsTab } from "./event-detail-tabs/event-analytics-tab"
import { CreateEventWizard } from "./create-event-wizard"

interface EventDetailPageProps {
  eventId: string
}

export function EventDetailPage({ eventId }: EventDetailPageProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentEvent, loading, error } = useAppSelector((state) => state.events)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId))
      dispatch(fetchEventGuests({ eventId }))
      dispatch(fetchBudgetItems(eventId))
      dispatch(fetchExpenses(eventId))
      dispatch(fetchFeedback(eventId))
      dispatch(fetchAnalytics(eventId))
    }
  }, [eventId, dispatch])

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event?")) {
      await dispatch(deleteEvent(eventId))
      router.push("/events/my-events")
    }
  }

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

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200"
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading && !currentEvent) {
    return <EventDetailSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </div>
    )
  }

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-10 w-10"
          >
            <CiCircleChevLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-normal text-gray-900">{currentEvent.title}</h1>
              <Badge className={getStatusColor(currentEvent.status)}>
                {currentEvent.status.replace(/_/g, " ")}
              </Badge>
              <Badge className={getBudgetStatusColor(currentEvent.budgetStatus)}>
                Budget: {currentEvent.budgetStatus}
              </Badge>
            </div>
            {currentEvent.description && (
              <p className="text-gray-600 max-w-2xl">{currentEvent.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="gradient-update"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-2 rounded-full h-10 px-6 shadow-sm"
          >
            <CiEdit size={18} />
            Edit Event
          </Button>
          <Button
            variant="gradient-danger"
            size="sm"
            onClick={handleDelete}
            className="gap-2 rounded-full h-10 px-6 shadow-sm"
          >
            <CiTrash size={18} />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Event Date</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <CiCalendar size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{format(new Date(currentEvent.startDate), "MMM dd")}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">
                {format(new Date(currentEvent.startDate), "yyyy, HH:mm")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <CiLocationOn size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold truncate">{currentEvent.location.split(',')[0]}</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {currentEvent.eventType || "Event"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-primary border border-gray-200 hover:border-gray-300 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Budget</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <CiDollar size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">
              {currentEvent.approvedBudget || currentEvent.estimatedBudget
                ? `$${(Number(currentEvent.approvedBudget || currentEvent.estimatedBudget) / 1000).toFixed(1)}K`
                : "$0"}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-white/80">
                {currentEvent.approvedBudget ? "Approved" : "Estimated"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizer</CardTitle>
            <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-primary">
              <CiUser size={16} className="text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold truncate">
              {currentEvent.author.firstName}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {currentEvent.author.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center overflow-x-auto border-b">
            <div className="flex space-x-1 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: CiGrid2H, gradient: 'from-blue-500 to-blue-600' },
                { id: 'guests', label: 'Guests', icon: CiUser, gradient: 'from-purple-500 to-purple-600' },
                { id: 'budget', label: 'Budget', icon: CiDollar, gradient: 'from-green-500 to-green-600' },
                { id: 'expenses', label: 'Expenses', icon: HiChartBar, gradient: 'from-orange-500 to-orange-600' },
                { id: 'feedback', label: 'Feedback', icon: CiChat1, gradient: 'from-pink-500 to-pink-600' },
                { id: 'analytics', label: 'Analytics', icon: HiChartBar, gradient: 'from-indigo-500 to-indigo-600' },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 text-lg font-medium rounded-t-lg border-b-2 transition-all duration-200',
                      isActive
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200',
                      isActive ? tab.gradient : 'from-gray-300 to-gray-400'
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <TabsContent value="overview" className="mt-6">
            <EventOverview event={currentEvent} />
          </TabsContent>

          <TabsContent value="guests" className="mt-6">
            <EventGuestsTab eventId={eventId} />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <EventBudgetTab eventId={eventId} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <EventExpensesTab eventId={eventId} />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <EventFeedbackTab eventId={eventId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <EventAnalyticsTab eventId={eventId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <CreateEventWizard
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editMode={true}
        eventToEdit={currentEvent}
      />
    </div>
  )
}
