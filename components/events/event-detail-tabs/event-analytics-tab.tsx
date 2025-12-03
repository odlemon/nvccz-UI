"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CiUser, CiDollar, CiStar, CiCircleCheck } from "react-icons/ci"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

interface EventAnalyticsTabProps {
  eventId: string
}

export function EventAnalyticsTab({ eventId }: EventAnalyticsTabProps) {
  const { currentEventAnalytics, currentEventGuests, currentEventFeedback, currentEvent } = useAppSelector(
    (state) => state.events
  )

  const analytics = currentEventAnalytics || {
    rsvpRate: 0,
    checkInRate: 0,
    feedbackRate: 0,
    averageRating: 0,
    totalBudget: 0,
    totalExpenses: 0,
    budgetUtilization: 0,
    budgetVariance: 0,
    costPerAttendee: 0,
    totalGuests: currentEventGuests.length,
    totalAttendees: currentEventGuests.filter((g) => g.checkedIn).length,
    acceptedInvitations: currentEventGuests.filter((g) => g.rsvpStatus === "ACCEPTED").length,
    declinedInvitations: currentEventGuests.filter((g) => g.rsvpStatus === "DECLINED").length,
    pendingInvitations: currentEventGuests.filter((g) => g.rsvpStatus === "PENDING").length,
  }

  // RSVP Status Distribution
  const rsvpData = [
    { name: "Accepted", value: analytics.acceptedInvitations, color: "#10b981" },
    { name: "Pending", value: analytics.pendingInvitations, color: "#f59e0b" },
    { name: "Declined", value: analytics.declinedInvitations, color: "#ef4444" },
  ].filter((d) => d.value > 0)

  // Rating Distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: currentEventFeedback.filter((f) => Math.round(f.rating) === rating).length,
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CiUser size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">RSVP Rate</div>
                <div className="text-2xl font-semibold">{analytics.rsvpRate?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <Progress value={analytics.rsvpRate || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CiCircleCheck size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Check-in Rate</div>
                <div className="text-2xl font-semibold">{analytics.checkInRate?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <Progress value={analytics.checkInRate || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CiStar size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Feedback Rate</div>
                <div className="text-2xl font-semibold">{analytics.feedbackRate?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <Progress value={analytics.feedbackRate || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <CiDollar size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Budget Used</div>
                <div className="text-2xl font-semibold">{analytics.budgetUtilization?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <Progress value={analytics.budgetUtilization || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RSVP Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>RSVP Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {rsvpData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No RSVP data available</div>
            )}
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {currentEventFeedback.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" label={{ value: "Rating", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No feedback data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Total Budget</div>
              <div className="text-3xl font-semibold">${analytics.totalBudget?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Total Expenses</div>
              <div className="text-3xl font-semibold text-blue-600">
                ${analytics.totalExpenses?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Budget Variance</div>
              <div
                className={`text-3xl font-semibold ${
                  (analytics.budgetVariance || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${Math.abs(analytics.budgetVariance || 0).toLocaleString()}
                <span className="text-sm ml-2">{(analytics.budgetVariance || 0) >= 0 ? "under" : "over"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Cost per Attendee</div>
                <div className="text-2xl font-semibold mt-1">${analytics.costPerAttendee?.toFixed(2) || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Attendees</div>
                <div className="text-2xl font-semibold mt-1">{analytics.totalAttendees}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {currentEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.rsvpRate < 80 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800">Low RSVP Rate</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Consider sending reminder emails to improve response rate. Current rate:{" "}
                    {analytics.rsvpRate?.toFixed(1)}%
                  </div>
                </div>
              )}

              {analytics.checkInRate < 85 && analytics.totalAttendees > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="font-medium text-orange-800">Check-in Could Be Improved</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Implement better check-in process or send event reminders. Current rate:{" "}
                    {analytics.checkInRate?.toFixed(1)}%
                  </div>
                </div>
              )}

              {analytics.feedbackRate < 70 && analytics.totalAttendees > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800">Low Feedback Rate</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Encourage attendees to provide feedback. Current rate: {analytics.feedbackRate?.toFixed(1)}%
                  </div>
                </div>
              )}

              {Math.abs(analytics.budgetUtilization - 100) > 10 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="font-medium text-purple-800">Budget Planning Review</div>
                  <div className="text-sm text-purple-700 mt-1">
                    Review budget planning for future events. Current utilization:{" "}
                    {analytics.budgetUtilization?.toFixed(1)}%
                  </div>
                </div>
              )}

              {analytics.averageRating > 0 && analytics.averageRating >= 4.0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">Great Performance!</div>
                  <div className="text-sm text-green-700 mt-1">
                    Event performed well across all metrics. Average rating: {analytics.averageRating.toFixed(1)}/5.0
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
