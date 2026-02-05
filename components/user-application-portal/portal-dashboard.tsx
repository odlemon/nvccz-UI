"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDashboard } from "@/lib/store/slices/applicationPortalSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CiFileOn,
  CiShop,
  CiDollar,
  CiCircleCheck,
  CiCalendar,
  CiTrophy,
  CiViewList
} from "react-icons/ci"
import { Building2, FileText, TrendingUp, Clock } from "lucide-react"
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"
import { useRouter } from "next/navigation"

export function ApplicationPortalDashboard() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { dashboard, dashboardLoading, dashboardError } = useAppSelector((state) => state.applicationPortal)

  useEffect(() => {
    dispatch(fetchDashboard())
  }, [dispatch])

  const getStageProgress = (stage: string) => {
    const stageOrder = [
      'SUBMITTED', 'INITIAL_SCREENING', 'SHORTLISTED',
      'UNDER_DUE_DILIGENCE', 'DUE_DILIGENCE_COMPLETED',
      'UNDER_BOARD_REVIEW', 'BOARD_APPROVED',
      'TERM_SHEET', 'TERM_SHEET_SIGNED',
      'INVESTMENT_IMPLEMENTATION', 'DISBURSED'
    ]
    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex === -1) return 0
    return Math.round((currentIndex / (stageOrder.length - 1)) * 100)
  }

  const getStageColor = (stage: string) => {
    if (stage.includes('DISBURSED')) return 'bg-green-100 text-green-800'
    if (stage.includes('BOARD')) return 'bg-purple-100 text-purple-800'
    if (stage.includes('DILIGENCE')) return 'bg-blue-100 text-blue-800'
    if (stage.includes('SCREEN')) return 'bg-amber-100 text-amber-800'
    if (stage.includes('SHORTLIST')) return 'bg-cyan-100 text-cyan-800'
    if (stage.includes('TERM_SHEET')) return 'bg-indigo-100 text-indigo-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (dashboardLoading) {
    return <DashboardSkeleton />
  }

  if (dashboardError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{dashboardError}</p>
            <Button onClick={() => dispatch(fetchDashboard())}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Dashboard data will appear here once available.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your application and investment journey</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 gradient-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiFileOn size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Application Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl text-white">
                {dashboard.summary.hasApplication ? 'Active' : 'Not Started'}
              </div>
              {dashboard.summary.hasApplication && (
                <Badge className={getStageColor(dashboard.summary.applicationStage)}>
                  {dashboard.summary.applicationStage.replaceAll('_', ' ')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiShop size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium">Company Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl">
                {dashboard.summary.hasPortfolioCompany ? 'Registered' : 'Pending'}
              </div>
              {/* {dashboard.summary.hasPortfolioCompany && (
                <Badge variant="outline">
                  {dashboard.summary.companyStatus}
                </Badge>
              )} */}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 gradient-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Requested Amount</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">
              ${(dashboard.summary.requestedAmount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-emerald-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Approved Amount</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">
              ${(dashboard.summary.approvedAmount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiCircleCheck size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium">Application Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl">
                {dashboard.application ? getStageProgress(dashboard.application.currentStage) : 0}%
              </div>
              <Progress value={dashboard.application ? getStageProgress(dashboard.application.currentStage) : 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Details */}
      {dashboard.application && (
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <CardTitle>Your Application</CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/application-portal/applications')}
              >
                <CiViewList className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Business Name</span>
                </div>
                <p className="text-lg font-medium">{dashboard.application.businessName}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  <span>Industry</span>
                </div>
                <p className="text-lg font-medium">{dashboard.application.industry}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Submitted</span>
                </div>
                <p className="text-lg font-medium">
                  {new Date(dashboard.application.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Company Details */}
      {dashboard.portfolioCompany && (
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <CiShop size={20} className="text-white" />
                </div>
                <CardTitle>Portfolio Company</CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/application-portal/portfolio-company')}
              >
                <CiViewList className="w-4 h-4 mr-2" />
                Manage Company
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Company Name</span>
                </div>
                <p className="text-lg font-medium">{dashboard.portfolioCompany.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  <span>Funding Stage</span>
                </div>
                <Badge variant="outline">{dashboard.portfolioCompany.fundingStage}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CiCircleCheck className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <Badge className={
                  dashboard.portfolioCompany.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }>
                  {dashboard.portfolioCompany.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <CiViewList size={20} className="text-white" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-auto py-6 flex-col gap-2"
              variant="outline"
              onClick={() => router.push('/application-portal/applications')}
            >
              <CiFileOn className="w-8 h-8" />
              <span>View Application</span>
            </Button>
            <Button
              className="h-auto py-6 flex-col gap-2"
              variant="outline"
              onClick={() => router.push('/application-portal/term-sheets')}
            >
              <CiFileOn className="w-8 h-8" />
              <span>Term Sheets</span>
            </Button>
            <Button
              className="h-auto py-6 flex-col gap-2"
              variant="outline"
              onClick={() => router.push('/application-portal/reports')}
            >
              <CiTrophy className="w-8 h-8" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
