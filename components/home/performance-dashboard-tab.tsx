"use client"

import { useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchUserScorecard } from "@/lib/store/slices/scorecardSlice"
import { fetchDepartmentScorecard } from "@/lib/store/slices/scorecardSlice"
import { fetchDashboardAnalytics, fetchDepartmentComparison } from "@/lib/store/slices/performanceSlice"
import { 
  CiTrophy, 
  CiUser, 
  CiViewBoard, 
  CiCircleCheck,
  CiViewTimeline 
} from "react-icons/ci"
import { 
  Target,
  Award,
  TrendingUp,
  Building2,
  Users
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// High-level executive roles that should see overall performance dashboard
const EXECUTIVE_ROLES = [
  'CEO', 'CIO', 'CFO', 'BOARD_CHAIR', 'BOARD_MEMBER', 
  'FUND_MGR', 'PORTFOLIO_MGR', 'INV_COMM_MEM'
]

// Manager-level roles (level 4-5) that should see department scorecard
const isManagerRole = (roleCode: string, level?: number) => {
  return (level && level >= 4) || 
         roleCode.includes('_MGR') || 
         roleCode.includes('MANAGER')
}

const isExecutiveRole = (roleCode: string) => {
  return EXECUTIVE_ROLES.includes(roleCode)
}

// Loading skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded-2xl"></div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-80 bg-muted rounded-2xl"></div>
      <div className="h-80 bg-muted rounded-2xl"></div>
    </div>
  </div>
)

// Individual User Performance Dashboard
const UserPerformanceDashboard = ({ scorecard }: any) => {
  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case "Excellent": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      case "Good": return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "Fair": return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

  const goalStatusData = [
    { name: 'Completed', value: scorecard.scorecard.summary.completedGoals, color: '#10b981' },
    { name: 'Pending', value: scorecard.scorecard.summary.totalGoals - scorecard.scorecard.summary.completedGoals, color: '#3b82f6' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Performance Scorecard</h2>
        <p className="text-gray-600 mt-1">Track your individual performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Goals</p>
                  <p className="text-4xl font-bold mt-1">{scorecard.scorecard.summary.totalGoals}</p>
                  <p className="text-sm text-white/80 mt-2">Assigned goals</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-4xl font-bold mt-1 text-emerald-600">
                    {scorecard.scorecard.summary.completedGoals}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Goals achieved</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <CiCircleCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Tasks</p>
                  <p className="text-4xl font-bold mt-1">{scorecard.scorecard.summary.totalTasks}</p>
                  <p className="text-sm text-white/80 mt-2">
                    {scorecard.scorecard.summary.completedTasks} done
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CiViewBoard className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Final Score</p>
                  <p className="text-4xl font-bold mt-1 text-primary">
                    {scorecard.scorecard.finalScore.total}
                  </p>
                  <Badge className={`mt-2 ${getPerformanceColor(scorecard.scorecard.finalScore.performanceBand)}`}>
                    {scorecard.scorecard.finalScore.performanceBand}
                  </Badge>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <CiTrophy className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Breakdown */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiViewBoard className="w-5 h-5 text-white" />
              </div>
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {scorecard.scorecard.sections.resultsDelivery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Results Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      {scorecard.scorecard.sections.resultsDelivery.completionRate}% completion
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {scorecard.scorecard.sections.resultsDelivery.totalScore}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {scorecard.scorecard.sections.resultsDelivery.maxScore}
                    </p>
                  </div>
                </div>
                <Progress
                  value={
                    (Number.parseFloat(scorecard.scorecard.sections.resultsDelivery.totalScore) /
                      scorecard.scorecard.sections.resultsDelivery.maxScore) * 100
                  }
                  className="h-2"
                />
              </div>
            )}

            {scorecard.scorecard.sections.budgetPerformance && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Budget Performance</p>
                    <p className="text-xs text-muted-foreground">
                      {scorecard.scorecard.sections.budgetPerformance.budgetUtilization}% utilization
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {scorecard.scorecard.sections.budgetPerformance.totalScore}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {scorecard.scorecard.sections.budgetPerformance.maxScore}
                    </p>
                  </div>
                </div>
                <Progress
                  value={
                    (Number.parseFloat(scorecard.scorecard.sections.budgetPerformance.totalScore) /
                      scorecard.scorecard.sections.budgetPerformance.maxScore) * 100
                  }
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Distribution */}
        {scorecard.scorecard.summary.totalGoals > 0 && (
          <Card className="bg-white rounded-2xl">
            <CardHeader>
              <CardTitle>Goal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={goalStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {goalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Department Performance Dashboard (for managers)
const DepartmentPerformanceDashboard = ({ scorecard }: any) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-emerald-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{scorecard.department} Performance</h2>
        <p className="text-gray-600 mt-1">Department performance metrics and team overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Overall Score</p>
                  <p className="text-4xl font-bold mt-1">{scorecard.scorecard.finalScore.total}</p>
                  <Badge className="mt-2 bg-white/20 text-white border-white/30">
                    {scorecard.scorecard.finalScore.performanceBand}
                  </Badge>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CiTrophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                  <p className="text-4xl font-bold mt-1">{scorecard.scorecard.summary.totalGoals}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {scorecard.scorecard.summary.completedGoals} completed
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Team Members</p>
                  <p className="text-4xl font-bold mt-1">{scorecard.scorecard.summary.totalUsers}</p>
                  <p className="text-sm text-white/80 mt-2">
                    {scorecard.scorecard.summary.managers} managers
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CiUser className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Sections */}
      <Card className="bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <CiViewBoard className="w-5 h-5 text-white" />
            </div>
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Outcomes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Outcomes</p>
                <p className="text-xs text-muted-foreground">
                  {scorecard.scorecard.sections.outcomes.goals} goals
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(
                  Number.parseFloat(scorecard.scorecard.sections.outcomes.totalScore),
                  scorecard.scorecard.sections.outcomes.maxScore
                )}`}>
                  {scorecard.scorecard.sections.outcomes.totalScore}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {scorecard.scorecard.sections.outcomes.maxScore}
                </p>
              </div>
            </div>
            <Progress
              value={
                (Number.parseFloat(scorecard.scorecard.sections.outcomes.totalScore) /
                  scorecard.scorecard.sections.outcomes.maxScore) * 100
              }
              className="h-2"
            />
          </div>

          {/* Outputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Outputs</p>
                <p className="text-xs text-muted-foreground">
                  {scorecard.scorecard.sections.outputs.goals} goals
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(
                  Number.parseFloat(scorecard.scorecard.sections.outputs.totalScore),
                  scorecard.scorecard.sections.outputs.maxScore
                )}`}>
                  {scorecard.scorecard.sections.outputs.totalScore}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {scorecard.scorecard.sections.outputs.maxScore}
                </p>
              </div>
            </div>
            <Progress
              value={
                (Number.parseFloat(scorecard.scorecard.sections.outputs.totalScore) /
                  scorecard.scorecard.sections.outputs.maxScore) * 100
              }
              className="h-2"
            />
          </div>

          {/* Service Delivery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Service Delivery</p>
                <p className="text-xs text-muted-foreground">Customer satisfaction</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(
                  Number.parseFloat(scorecard.scorecard.sections.serviceDelivery.totalScore),
                  scorecard.scorecard.sections.serviceDelivery.maxScore
                )}`}>
                  {scorecard.scorecard.sections.serviceDelivery.totalScore}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {scorecard.scorecard.sections.serviceDelivery.maxScore}
                </p>
              </div>
            </div>
            <Progress
              value={
                (Number.parseFloat(scorecard.scorecard.sections.serviceDelivery.totalScore) /
                  scorecard.scorecard.sections.serviceDelivery.maxScore) * 100
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Executive/Organization-wide Performance Dashboard
const ExecutivePerformanceDashboard = ({ dashboardData, departmentComparison }: any) => {
  const departmentComparisonData = useMemo(() => {
    if (!departmentComparison?.departments) return []
    
    return departmentComparison.departments
      .filter((dept: any) => dept.goals.total > 0)
      .map((dept: any) => ({
        department: dept.department,
        completed: dept.goals.completed,
        total: dept.goals.total,
        progress: parseFloat(dept.progress.progressPercentage)
      }))
  }, [departmentComparison])

  const overview = dashboardData?.overview || {}
  const companyGoals = dashboardData?.companyGoals || []
  const summary = departmentComparison?.summary || {}
  const bestPerformingDept = summary.bestPerformingDepartment || null

  const totalGoals = overview.totalCompanyGoals || 0
  const completedGoals = companyGoals.filter((g: any) => g.stage === 'completed').length
  const totalTasks = overview.totalTasks || 0
  const completedTasks = overview.completedTasks || 0
  const averageProgress = parseFloat(summary.averageProgress || '0')
  const totalDepartments = summary.totalDepartments || 0

  const totalUsersFromDept = useMemo(() => {
    if (!departmentComparison?.departments) return 0
    return departmentComparison.departments.reduce((sum: number, dept: any) => 
      sum + (dept.users?.total || 0), 0
    )
  }, [departmentComparison])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization Performance Overview</h2>
        <p className="text-gray-600 mt-1">Company-wide metrics and departmental comparison</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Departments</p>
                  <p className="text-4xl font-bold mt-1">{totalDepartments}</p>
                  <p className="text-sm text-white/80 mt-2">{totalUsersFromDept} users</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Goals Progress</p>
                  <p className="text-4xl font-bold mt-1">{completedGoals}/{totalGoals}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}% completed
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl gradient-primary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Tasks Completion</p>
                  <p className="text-4xl font-bold mt-1">{completedTasks}/{totalTasks}</p>
                  <p className="text-sm text-white/80 mt-2">
                    {totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}% done
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CiCircleCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                  <p className="text-4xl font-bold mt-1">{(averageProgress * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-2">Organization-wide</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Best Performing Department */}
      {bestPerformingDept && (
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-amber-200">
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
                <h3 className="text-2xl font-bold text-amber-900 mb-1">
                  {bestPerformingDept.goals.completed}/{bestPerformingDept.goals.total}
                </h3>
                <p className="text-sm text-amber-700">Goals Completed</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-900 mb-1">
                  {bestPerformingDept.progress.progressPercentage}%
                </h3>
                <p className="text-sm text-amber-700">Progress Rate</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-900 mb-1">
                  {bestPerformingDept.users.total}
                </h3>
                <p className="text-sm text-amber-700">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Comparison Chart */}
      {departmentComparisonData.length > 0 && (
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle>Department Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed Goals" />
                <Bar dataKey="total" fill="#3b82f6" name="Total Goals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main Component
export function PerformanceDashboardTab() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { userScorecard, departmentScorecard, loading: scorecardLoading } = useAppSelector((state) => state.scorecard)
  const { dashboardData, departmentComparison, dashboardLoading } = useAppSelector((state) => state.performance)

  const userRoleCode = (user as any)?.roleCode || ''
  const userDepartment = (user as any)?.department || ''
  const userRoleLevel = (user as any)?.roleLevel

  // Determine which dashboard to show based on role
  const dashboardType = useMemo(() => {
    if (isExecutiveRole(userRoleCode)) {
      return 'executive'
    } else if (isManagerRole(userRoleCode, userRoleLevel)) {
      return 'department'
    }
    return 'user'
  }, [userRoleCode, userRoleLevel])

  useEffect(() => {
    if (dashboardType === 'executive') {
      dispatch(fetchDashboardAnalytics())
      dispatch(fetchDepartmentComparison())
    } else if (dashboardType === 'department') {
      if (userDepartment) {
        dispatch(fetchDepartmentScorecard(userDepartment))
      }
    } else {
      dispatch(fetchUserScorecard())
    }
  }, [dashboardType, dispatch, userDepartment])

  if (scorecardLoading || dashboardLoading) {
    return <DashboardSkeleton />
  }

  // Render appropriate dashboard
  if (dashboardType === 'executive') {
    return <ExecutivePerformanceDashboard 
      dashboardData={dashboardData} 
      departmentComparison={departmentComparison}
    />
  } else if (dashboardType === 'department') {
    if (!departmentScorecard) {
      return (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Department Data</h3>
          <p className="text-muted-foreground">Department scorecard data is not available.</p>
        </div>
      )
    }
    return <DepartmentPerformanceDashboard scorecard={departmentScorecard} />
  } else {
    if (!userScorecard) {
      return (
        <div className="text-center py-12">
          <CiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scorecard Data</h3>
          <p className="text-muted-foreground">Your performance scorecard is not yet available.</p>
        </div>
      )
    }
    return <UserPerformanceDashboard scorecard={userScorecard} />
  }
}
