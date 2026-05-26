"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchValuations } from "@/lib/store/slices/applicationPortalSlice"
import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CiTrophy, CiCalendar, CiUser } from "react-icons/ci"
import { TrendingUp } from "lucide-react"
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"
import { InvestmentRecipientGuard } from "@/components/user-application-portal/investment-recipient-guard"

export default function ValuationsPage() {
  const dispatch = useAppDispatch()
  const { valuations, valuationsLoading } = useAppSelector((state) => state.applicationPortal)

  useEffect(() => {
    dispatch(fetchValuations())
  }, [dispatch])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (valuationsLoading) {
    return (
      <ApplicationPortalLayout>
        <DashboardSkeleton />
      </ApplicationPortalLayout>
    )
  }

  return (
    <ApplicationPortalLayout>
      <InvestmentRecipientGuard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Valuations</h1>
            <p className="text-muted-foreground">Track your company valuations and assessments</p>
          </div>
          <Badge variant="outline">
            {valuations.length} Total
          </Badge>
        </div>

        {/* Valuations List */}
        {valuations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Valuations</h3>
                <p className="text-muted-foreground">
                  Company valuations will appear here once they are conducted.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {valuations.map((valuation) => (
              <Card key={valuation.id} className="card-shadow hover:card-shadow-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <TrendingUp size={20} className="text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Valuation Assessment</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CiCalendar className="w-4 h-4" />
                          {new Date(valuation.valuationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(valuation.status)}>
                      {valuation.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Valuation Amount */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valuation Amount</p>
                      <p className="text-3xl font-bold text-purple-900">
                        ${valuation.valuationAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Method: {valuation.valuationMethod}
                      </p>
                    </div>

                    {/* Assigned To */}
                    {valuation.assignedTo && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <CiUser className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned To</p>
                          <p className="font-medium">
                            {valuation.assignedTo.firstName} {valuation.assignedTo.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {valuation.assignedTo.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {valuation.valuationActivities && valuation.valuationActivities.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recent Activities</p>
                        {valuation.valuationActivities.slice(0, 3).map((activity) => (
                          <div
                            key={activity.id}
                            className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {activity.activityType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </InvestmentRecipientGuard>
    </ApplicationPortalLayout>
  )
}
