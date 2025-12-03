"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDashboardAnalytics, fetchDepartmentComparison } from "@/lib/store/slices/performanceSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CiCircleCheck, CiViewTimeline, CiViewBoard, CiGrid41, CiUser, CiCalendar } from "react-icons/ci"
import { TrendingUp, Award } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { PerformanceDashboardSkeleton } from "./performance-dashboard-skeleton"
import { toast } from "sonner"

export function PerformanceDashboard() {
  const dispatch = useAppDispatch()
  const { 
    dashboardData, 
    departmentComparison, 
    dashboardLoading, 
    departmentComparisonLoading,
    error 
  } = useAppSelector((state) => state.performance)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchDashboardAnalytics()).unwrap(),
          dispatch(fetchDepartmentComparison()).unwrap()
        ])
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        toast.error("Failed to load dashboard data")
      }
    }
    fetchData()
  }, [dispatch])

  // Transform data for charts
  const departmentComparisonData = useMemo(() => {
    if (!departmentComparison?.departments) return []
    
    return departmentComparison.departments
      .filter((dept: any) => dept.goals.total > 0)
      .map((dept: any) => ({
        department: dept.department,
        total: dept.goals.total,
        completed: dept.goals.completed,
        progress: parseFloat(dept.progress.progressPercentage)
      }))
  }, [departmentComparison])

  const progressTrendData = useMemo(() => {
    if (!dashboardData?.companyGoals) return []
    
    return dashboardData.companyGoals.map((goal: any, index: number) => ({
      name: `Goal ${index + 1}`,
      progress: parseFloat(goal.progressPercentage),
      target: 100
    }))
  }, [dashboardData])

  const overview = dashboardData?.overview || {}
  const companyGoals = dashboardData?.companyGoals || []
  const departmentBreakdown = dashboardData?.departmentBreakdown || []
  const summary = departmentComparison?.summary || {}
  const bestPerformingDept = summary.bestPerformingDepartment || null

  const totalGoals = overview.totalCompanyGoals || 0
  const completedGoals = companyGoals.filter((g: any) => g.stage === 'completed').length
  const totalTasks = overview.totalTasks || 0
  const completedTasks = overview.completedTasks || 0
  const overallProgress = parseFloat(overview.overallProgress || '0')
  const averageProgress = parseFloat(summary.averageProgress || '0')
  const totalDepartments = summary.totalDepartments || overview.totalDepartments || 0

  // Calculate total users across all departments
  const totalUsersFromDept = useMemo(() => {
    if (!departmentComparison?.departments) return 0
    return departmentComparison.departments.reduce((sum: number, dept: any) => 
      sum + (dept.users?.total || 0), 0
    )
  }, [departmentComparison])

  // Group goals by department count
  const companyLevelGoals = companyGoals.filter((g: any) => g.departmentCount >= 4)
  const departmentLevelGoals = companyGoals.filter((g: any) => g.departmentCount > 0 && g.departmentCount < 4)
  const individualGoals = [] // This would need to come from another endpoint

  // Recent activity from company goals
  const recentActivity = companyGoals.slice(0, 4).map((goal: any, index: number) => ({
    id: index + 1,
    type: 'goal',
    title: goal.stage === 'in_progress' ? `Goal in progress: ${goal.title}` : `New goal created: ${goal.title}`,
    time: goal.stage === 'in_progress' ? 'Active' : 'Recently added',
    user: `${goal.departmentCount} department${goal.departmentCount !== 1 ? 's' : ''}`
  }))

  // Upcoming deadlines from active goals
  const upcomingDeadlines = companyGoals
    .filter((g: any) => g.stage === 'in_progress' || g.stage === 'planning')
    .slice(0, 5)

  if (dashboardLoading || departmentComparisonLoading) {
    return <PerformanceDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <Button 
            onClick={() => {
              dispatch(fetchDashboardAnalytics())
              dispatch(fetchDepartmentComparison())
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl text-gray-900 mb-2">Performance Management Dashboard</h1>
        <p className="text-gray-600 font-normal">
          Comprehensive overview of organizational performance, goals, and key metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
        <Card className="rounded-2xl gradient-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Departments</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CiViewTimeline className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{totalDepartments}</div>
            <p className="text-xs text-white/80">{totalUsersFromDept} total users</p>
            <div className="relative mt-2 h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white"
                style={{ width: `${(averageProgress * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-1">
              {(averageProgress * 100).toFixed(1)}% avg progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <CiViewBoard className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">
              {completedGoals}/{totalGoals}
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl gradient-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Tasks Completion</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CiCircleCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">
              {completedTasks}/{totalTasks}
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-1">
              {totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <CiUser className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{(overallProgress).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Average performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Best Performing Department Card */}
      {bestPerformingDept && (
        <Card className=" from-amber-50 to-yellow-50 rounded-2xl border-amber-200 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              Best Performing Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-amber-900 mb-1">
                  {bestPerformingDept.department}
                </h3>
                <p className="text-sm text-amber-700">Department Name</p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-amber-900">
                    {bestPerformingDept.goals.total}
                  </h3>
                  <span className="text-sm text-amber-700">goals</span>
                </div>
                <p className="text-sm text-amber-700">
                  {bestPerformingDept.goals.completed} completed ({bestPerformingDept.goals.completionRate}%)
                </p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-amber-900">
                    {bestPerformingDept.users.total}
                  </h3>
                  <span className="text-sm text-amber-700">users</span>
                </div>
                <p className="text-sm text-amber-700">
                  {bestPerformingDept.users.managers} managers, {bestPerformingDept.users.officers} officers
                </p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-amber-900">
                    {parseFloat(bestPerformingDept.progress.progressPercentage).toFixed(1)}%
                  </h3>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div className="relative mt-2 h-2 rounded-full bg-amber-200 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-600"
                    style={{ width: `${parseFloat(bestPerformingDept.progress.progressPercentage)}%` }}
                  />
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  ${parseFloat(bestPerformingDept.progress.totalCurrentValue).toLocaleString()} / 
                  ${parseFloat(bestPerformingDept.progress.totalTargetValue).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <CiViewBoard className="w-5 h-5 text-white" />
            </div>
            Goal Hierarchy Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-900">Company Goals</h3>
                  <Badge className="bg-blue-600 text-white">{totalGoals}</Badge>
                </div>
                <p className="text-sm text-blue-700">Strategic organizational objectives</p>
                <p className="text-xs text-blue-600 mt-2">
                  {completedGoals} completed • {totalGoals - completedGoals} active
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-purple-900">Department Goals</h3>
                  <Badge className="bg-purple-600 text-white">{departmentBreakdown.length}</Badge>
                </div>
                <p className="text-sm text-purple-700">Departmental targets and KPIs</p>
                <p className="text-xs text-purple-600 mt-2">
                  Across {totalDepartments} departments
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-green-900">Individual Goals</h3>
                  <Badge className="bg-green-600 text-white">
                    {bestPerformingDept?.individualGoals?.total || 0}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">Personal performance goals</p>
                <p className="text-xs text-green-600 mt-2">
                  {bestPerformingDept?.individualGoals?.completed || 0} completed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Total Goals" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle>Goal Progress Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={2} name="Progress %" />
                <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/performance/goals">
              <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <CiViewBoard className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Company Goals</CardTitle>
            <Link href="/performance/goals">
              <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((goal: any) => (
                  <li key={goal.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CiCalendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.kpi?.name} • {goal.kpi?.unitSymbol}{parseFloat(goal.currentValue).toLocaleString()}/{goal.kpi?.unitSymbol}{parseFloat(goal.targetValue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        goal.stage === 'in_progress' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {parseFloat(goal.progressPercentage).toFixed(1)}%
                    </Badge>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No active goals</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-none">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/performance/kpis">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50">
                <CiViewTimeline className="w-4 h-4 mr-2" />
                Manage KPIs
              </Button>
            </Link>
            <Link href="/performance/goals">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50">
                <CiViewBoard className="w-4 h-4 mr-2" />
                View Goals
              </Button>
            </Link>
            <Link href="/performance/department-scorecards">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50">
                <CiGrid41 className="w-4 h-4 mr-2" />
                Department Scorecards
              </Button>
            </Link>
            <Link href="/performance/user-scorecards">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50">
                <CiUser className="w-4 h-4 mr-2" />
                User Scorecards
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
