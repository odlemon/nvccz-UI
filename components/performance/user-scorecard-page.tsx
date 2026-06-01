"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchUserScorecard } from "@/lib/store/slices/scorecardSlice"
import { companyProfileApi, type CompanyAddress } from "@/lib/api/company-profile-api"
import { scorecardApiService } from "@/lib/api/scorecard-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiUser, CiViewBoard, CiCircleCheck, CiTrophy, CiFileOn } from "react-icons/ci"
import { TbTarget } from "react-icons/tb"
import { Calendar, RefreshCw, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PERFORMANCE_ACTIONS } from "@/lib/config/performance-permissions"
import { EmployeeQualitativeModal } from "./employee-qualitative-modal"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const UserScorecardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="h-4 w-80 bg-muted rounded mt-2"></div>
      </div>
      <div className="h-10 w-28 bg-muted rounded"></div>
    </div>
    <div className="grid gap-4 md:grid-cols-4">
      <div className="h-32 bg-muted rounded-2xl"></div>
      <div className="h-32 bg-muted rounded-2xl"></div>
      <div className="h-32 bg-muted rounded-2xl"></div>
      <div className="h-32 bg-muted rounded-2xl"></div>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-96 bg-muted rounded-2xl"></div>
      <div className="h-96 bg-muted rounded-2xl"></div>
    </div>
  </div>
)

export function UserScorecardsPage() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { userScorecard, loading, error } = useAppSelector((state) => state.scorecard)
  const scorecardRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<any>(null)
  const [periodLabel, setPeriodLabel] = useState(String(new Date().getFullYear()))
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("self")
  const [activeAddress, setActiveAddress] = useState<CompanyAddress | null>(null)
  const [isQualModalOpen, setIsQualModalOpen] = useState(false)
  const { hasSpecificAction } = useRolePermissions()
  const canEditQualitative = hasSpecificAction(PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW)

  const canSelectEmployee =
    permissions.canViewUserScorecards ||
    permissions.canViewAllScorecards ||
    permissions.canConductPerformanceReview

  useEffect(() => {
    dispatch(
      fetchUserScorecard({
        periodLabel,
        employeeId: canSelectEmployee && selectedEmployeeId !== "self" ? selectedEmployeeId : undefined,
      }),
    )
  }, [dispatch, periodLabel, canSelectEmployee, selectedEmployeeId])

  useEffect(() => {
    if (!canSelectEmployee) {
      setEmployees([])
      setSelectedEmployeeId("self")
      return
    }

    const loadEmployees = async () => {
      try {
        const response = await scorecardApiService.getEmployeesForGeneration(periodLabel)
        if (response.success && response.data) {
          const mapped = response.data.employees.map((emp) => ({
            id: emp.id,
            name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
          }))
          setEmployees(mapped)
          setSelectedEmployeeId((current) =>
            current !== "self" && !mapped.some((employee) => employee.id === current) ? "self" : current,
          )
        }
      } catch {
        toast.error("Failed to load employees for scorecard selection")
      }
    }

    loadEmployees()
  }, [canSelectEmployee, periodLabel])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load user scorecard", { description: error })
    }
  }, [error])

  useEffect(() => {
    setIsClient(true)
    // Dynamically import PDF components only on client
    import("@react-pdf/renderer").then((pdfModule) => {
      import("./user-scorecard-pdf").then((pdfComponent) => {
        setPDFComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          UserScorecardPDF: pdfComponent.default,
        })
      })
    })
    companyProfileApi.getActiveAddress().then((a) => setActiveAddress(a)).catch(() => {})
  }, [])

  const handleRefresh = () => {
    dispatch(
      fetchUserScorecard({
        periodLabel,
        employeeId: canSelectEmployee && selectedEmployeeId !== "self" ? selectedEmployeeId : undefined,
      }),
    )
  }

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      case "Good":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "Fair":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      case "Poor":
      case "Unsatisfactory":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "green":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      case "amber":
      case "pending":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      case "red":
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500"
    if (percentage >= 60) return "bg-blue-500"
    if (percentage >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  const toNumber = (value: unknown) => {
    const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const goals = userScorecard?.goals ?? []
  const performanceMatrix = userScorecard?.document?.performanceMatrix ?? []
  const taskRows = useMemo(() => {
    const sections = userScorecard?.document?.taskSummary ?? []
    return sections.flatMap((section: any) => section?.tasks ?? [])
  }, [userScorecard])

  const completedGoals = goals.filter((goal: any) => toNumber(goal.progressPct ?? goal.progressPercentage) >= 100).length
  const totalGoals = goals.length
  const completedTasks = taskRows.filter((task: any) => String(task.status || "").toLowerCase().includes("complete")).length
  const overdueTasks = taskRows.filter((task: any) => {
    if (!task?.dueDate) return false
    const dueDate = new Date(task.dueDate).getTime()
    return dueDate < Date.now() && !String(task.status || "").toLowerCase().includes("complete")
  }).length

  const finalScore = toNumber(userScorecard?.scores?.finalScore)
  const resultsDeliveryScore = userScorecard?.scores?.resultsDeliveryScore
  const budgetScore = userScorecard?.scores?.budgetScore
  const performanceLabel = userScorecard?.scores?.performanceLabel ?? "N/A"
  const employee = userScorecard?.employee

  if (loading && !userScorecard) return <UserScorecardSkeleton />

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-normal text-balance">Individual Performance Scorecard</h1>
          <p className="text-muted-foreground font-normal mt-1">
            Track your performance metrics and goal achievement
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canSelectEmployee && (
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-[260px] rounded-full" size="sm">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">My Scorecard</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={periodLabel} onValueChange={setPeriodLabel}>
            <SelectTrigger className="w-[120px] rounded-full" size="sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="rounded-full gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canEditQualitative && userScorecard?.employee?.id && (
            <Button
              size="sm"
              variant="gradient"
              className="rounded-full gap-1.5"
              onClick={() => setIsQualModalOpen(true)}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Add Evaluation
            </Button>
          )}
          {isClient && userScorecard && PDFComponents && (
            <PDFComponents.PDFDownloadLink
              document={<PDFComponents.UserScorecardPDF data={userScorecard} activeAddress={activeAddress} />}
              fileName={`${(employee?.name || "employee").replace(/\s+/g, "-")}-Scorecard-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            >
              {({ loading: pdfLoading }: any) => (
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  disabled={pdfLoading}
                >
                  <CiFileOn className={`w-3.5 h-3.5 ${pdfLoading ? "animate-spin" : ""}`} />
                  {pdfLoading ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </PDFComponents.PDFDownloadLink>
          )}
        </div>
      </div>

      <div ref={scorecardRef}>
        {!userScorecard ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CiUser className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Scorecard Data</h3>
            <p className="text-muted-foreground">Your scorecard data is not yet available.</p>
          </div>
        ) : (
          <>
            {/* User Info Card */}
            <Card className="rounded-2xl bg-muted/30 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <CiUser className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{employee?.name || "Unknown Employee"}</h2>
                    <p className="text-muted-foreground">
                      {employee?.department || "No Department"}
                      {employee?.role && ` • ${employee.role}`}
                    </p>
                  </div>
                  <Badge className={`${getPerformanceColor(performanceLabel)} text-sm px-4 py-2`}>
                    {performanceLabel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card className="rounded-2xl gradient-primary text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">Total Goals</p>
                      <p className="text-4xl font-bold mt-1">{totalGoals}</p>
                      <p className="text-sm text-white/80 mt-2">Assigned goals</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <TbTarget className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed Goals</p>
                      <p className="text-4xl font-bold mt-1 text-emerald-600">
                        {completedGoals}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Successfully achieved</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <CiCircleCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl gradient-primary text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">Total Tasks</p>
                      <p className="text-4xl font-bold mt-1">{taskRows.length}</p>
                      <p className="text-sm text-white/80 mt-2">
                        {completedTasks} completed
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <CiViewBoard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Final Score</p>
                      <p className="text-4xl font-bold mt-1 text-primary">{finalScore.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-2">{performanceLabel}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <CiTrophy className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-6">
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
                  {/* Results Delivery */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Results Delivery Score</p>
                        <p className="text-xs text-muted-foreground">Calculated from weighted goal results</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{resultsDeliveryScore ?? "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Budget Score</p>
                        <p className="text-xs text-muted-foreground">Optional budget component for final score</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{budgetScore ?? "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="space-y-6">
                {/* Goal Status Distribution */}
                {totalGoals > 0 && (
                  <Card className="bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle>Goal Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Completed",
                                value: completedGoals,
                                color: "#10b981",
                              },
                              {
                                name: "In Progress",
                                value: totalGoals - completedGoals,
                                color: "#3b82f6",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[{ color: "#10b981" }, { color: "#3b82f6" }].map((entry, index) => (
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

                {/* Task Status */}
                {taskRows.length > 0 && (
                  <Card className="bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle>Task Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={[
                            {
                              name: "Tasks",
                              Completed: completedTasks,
                              Overdue: overdueTasks,
                              Pending: taskRows.length - completedTasks - overdueTasks,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Completed" fill="#10b981" />
                          <Bar dataKey="Pending" fill="#3b82f6" />
                          <Bar dataKey="Overdue" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Goals and Tasks */}
            {(goals.length > 0 || taskRows.length > 0) && (
              <div className="grid gap-6 lg:grid-cols-2 mb-6">
                {/* Active Goals */}
                {goals.length > 0 && (
                  <Card className="bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                          <TbTarget className="w-5 h-5 text-white" />
                        </div>
                        Active Goals ({goals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {goals.map((goal: any) => {
                          const progress = toNumber(goal.progressPct ?? goal.progressPercentage)
                          const rowStatus = goal.status || (progress >= 100 ? "completed" : "in_progress")
                          return (
                          <div key={goal.id} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight flex-1">{goal.goalName ?? goal.title ?? "Untitled Goal"}</h4>
                              <Badge variant="outline" className={`${getStatusColor(goal.stage)} text-xs shrink-0`}>
                                {String(rowStatus).replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{progress.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${getProgressColor(progress)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tasks */}
                {taskRows.length > 0 && (
                  <Card className="bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                          <CiCircleCheck className="w-5 h-5 text-white" />
                        </div>
                        Tasks ({taskRows.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {taskRows.map((task: any) => (
                          <div key={task.id} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight flex-1">{task.title}</h4>
                              <Badge variant="outline" className={`${getStatusColor(task.stage)} text-xs shrink-0`}>
                                {String(task.status || task.stage || "pending").replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Badge variant="outline" className="text-xs">
                                {(task.priority || "normal")} priority
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Performance Summary */}
            <Card className="rounded-2xl bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CiTrophy className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Performance Summary</p>
                    <p className="text-sm text-muted-foreground mt-1">{performanceLabel}</p>
                  </div>
                  <Badge className={`${getPerformanceColor(performanceLabel)} text-sm px-4 py-2`}>
                    {performanceLabel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

              {userScorecard.warnings?.length > 0 && (
                <Card className="rounded-2xl border-amber-300 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userScorecard.warnings.map((warning: string, idx: number) => (
                      <p key={idx} className="text-sm text-amber-800">{warning}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              {performanceMatrix.length > 0 && (
                <Card className="bg-white rounded-2xl">
                  <CardHeader>
                    <CardTitle>Performance Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceMatrix.slice(0, 8).map((row: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{row.goal || row.kpiOrMeasure || `Item ${idx + 1}`}</p>
                              <p className="text-xs text-muted-foreground">
                                Target: {row.target ?? "N/A"} • Actual: {row.actual ?? "N/A"}
                              </p>
                            </div>
                            <Badge variant="outline">Rating {row.rawRating ?? "-"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(() => {
                const attrs = userScorecard?.document?.qualitativeSections?.personalAttributes
                if (!attrs || attrs.length === 0) return null
                const cols = attrs[0]?.columns?.map((c: any) => c.label) ?? []
                return (
                  <Card className="bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-white" />
                        </div>
                        Employee Leadership Evaluation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left px-3 py-2 font-semibold text-gray-700 w-[35%]">Attribute</th>
                              {cols.map((col: string) => (
                                <th key={col} className="px-3 py-2 font-semibold text-gray-700 text-center whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {attrs.map((attr: any, idx: number) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="px-3 py-2 font-medium text-gray-800">{attr.attribute}</td>
                                {attr.columns.map((col: any) => (
                                  <td key={col.label} className="px-3 py-2 text-center">
                                    {col.selected ? (
                                      <span className="inline-flex w-6 h-6 rounded-full bg-blue-600 items-center justify-center text-white text-xs">●</span>
                                    ) : (
                                      <span className="inline-flex w-6 h-6 rounded-full border-2 border-gray-300 items-center justify-center text-gray-300 text-xs">○</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
          </>
        )}
      </div>

      <EmployeeQualitativeModal
        isOpen={isQualModalOpen}
        onClose={() => setIsQualModalOpen(false)}
        employeeId={userScorecard?.employee?.id || ""}
        employeeName={userScorecard?.employee?.name || employee?.name || "Employee"}
        periodLabel={periodLabel}
        existingAttributes={userScorecard?.document?.qualitativeSections?.personalAttributes}
        onSaved={handleRefresh}
      />
    </div>
  )
}
