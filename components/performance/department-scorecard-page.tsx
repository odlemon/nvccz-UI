"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDepartmentScorecard } from "@/lib/store/slices/scorecardSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiViewBoard, CiUser, CiRedo, CiTrophy, CiFileOn } from "react-icons/ci"
import { TbTarget } from "react-icons/tb"
import { toast } from "sonner"
import DepartmentScorecardPDF from "./department-scorecard-pdf-document"

const DepartmentScorecardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-4 w-96 bg-muted rounded mt-2"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 w-48 bg-muted rounded"></div>
        <div className="h-10 w-28 bg-muted rounded"></div>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="h-32 bg-muted rounded-xl"></div>
      <div className="h-32 bg-muted rounded-xl"></div>
      <div className="h-32 bg-muted rounded-xl"></div>
    </div>
  </div>
)

const toNumber = (value: unknown) => {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(n) ? n : 0
}

const statusColor = (status?: string) => {
  const normalized = String(status || "").toLowerCase()
  if (normalized.includes("green") || normalized.includes("complete")) return "bg-emerald-100 text-emerald-800"
  if (normalized.includes("amber") || normalized.includes("progress")) return "bg-amber-100 text-amber-800"
  if (normalized.includes("red") || normalized.includes("overdue")) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

export function DepartmentScorecardsPage() {
  const dispatch = useAppDispatch()
  const { departmentScorecard, loading, error } = useAppSelector((state) => state.scorecard)
  const { availableDepartments } = useAppSelector((state) => state.performance)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      setPDFDownloadLink(() => pdfModule.PDFDownloadLink)
    })
  }, [])

  useEffect(() => {
    dispatch(fetchAvailableDepartments())
  }, [dispatch])

  useEffect(() => {
    if (availableDepartments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(availableDepartments[0].name)
    }
  }, [availableDepartments, selectedDepartment])

  useEffect(() => {
    if (selectedDepartment) {
      dispatch(fetchDepartmentScorecard(selectedDepartment))
    }
  }, [selectedDepartment, dispatch])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load department scorecard", { description: error })
    }
  }, [error])

  const handleRefresh = () => {
    if (selectedDepartment) {
      dispatch(fetchDepartmentScorecard(selectedDepartment))
    }
  }

  const goals = departmentScorecard?.goals ?? []
  const departmentInfo = departmentScorecard?.department
  const warnings = departmentScorecard?.warnings ?? []
  const performanceMatrix = departmentScorecard?.document?.performanceMatrix ?? []
  const rollupSummary = departmentScorecard?.rollupSummary ?? departmentScorecard?.employeeRollupSummary ?? []

  const goalSummary = useMemo(() => {
    const completed = goals.filter((goal: any) => toNumber(goal.selectedProgressPct ?? goal.progressPct ?? goal.progressPercentage) >= 100).length
    return {
      total: goals.length,
      completed,
      inProgress: Math.max(goals.length - completed, 0),
    }
  }, [goals])

  const teamSummary = useMemo(() => {
    const total = rollupSummary.length
    return {
      total,
      scored: rollupSummary.filter((row: any) => row.finalScore !== null).length,
    }
  }, [rollupSummary])

  const deptScore = toNumber(departmentScorecard?.scores?.departmentScore)
  const performanceLabel = departmentScorecard?.scores?.performanceLabel ?? "N/A"

  if (loading && !departmentScorecard) return <DepartmentScorecardSkeleton />

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-normal text-balance">Department Performance Scorecard</h1>
          <p className="text-muted-foreground font-normal mt-1">
            Aggregated department performance and goal matrix
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {availableDepartments?.map((dept: any) => (
                <SelectItem key={dept.id || dept.name} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <CiRedo className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isClient && departmentScorecard && PDFDownloadLink && (
            <PDFDownloadLink
              document={<DepartmentScorecardPDF data={departmentScorecard} />}
              fileName={`${(departmentInfo?.name || selectedDepartment || "department").replace(/\s+/g, "-")}-Scorecard-${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading: pdfLoading }: any) => (
                <Button variant="outline" disabled={pdfLoading}>
                  <CiFileOn className={`w-4 h-4 mr-2 ${pdfLoading ? "animate-spin" : ""}`} />
                  {pdfLoading ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {!departmentScorecard ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CiViewBoard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Scorecard Found</h3>
          <p className="text-muted-foreground">
            {selectedDepartment
              ? `No scorecard data available for the ${selectedDepartment} department.`
              : "Please select a department to view its scorecard."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl gradient-primary text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Department Score</p>
                    <p className="text-4xl font-normal mt-1">{deptScore.toFixed(2)}</p>
                    <Badge className="mt-2 bg-white/20 text-white border-white/30 hover:bg-white/30">{performanceLabel}</Badge>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <CiTrophy className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Goals</p>
                    <p className="text-4xl font-normal mt-1">{goalSummary.total}</p>
                    <p className="text-sm text-muted-foreground mt-2">{goalSummary.completed} completed</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <TbTarget className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl gradient-primary text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Team Roll-up</p>
                    <p className="text-4xl font-normal mt-1">{teamSummary.total}</p>
                    <p className="text-sm text-white/80 mt-2">{teamSummary.scored} finalised employee scores</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <CiUser className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {warnings.length > 0 && (
            <Card className="rounded-2xl border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-900">Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((warning: string, idx: number) => (
                  <p key={idx} className="text-sm text-amber-800">{warning}</p>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <TbTarget className="w-5 h-5 text-white" />
                  </div>
                  Department Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.length === 0 && <p className="text-sm text-muted-foreground">No goals linked to this scorecard.</p>}
                {goals.map((goal: any) => {
                  const progress = toNumber(goal.selectedProgressPct ?? goal.progressPct ?? goal.progressPercentage)
                  return (
                    <div key={goal.id} className="p-4 rounded-lg bg-muted/40 border space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm leading-tight">{goal.goalName ?? goal.title ?? "Untitled Goal"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{goal.kpiOrMeasure || "KPI"}</p>
                        </div>
                        <Badge className={statusColor(goal.status)}>{String(goal.status || "N/A")}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <p>Target: {goal.targetValue ?? "N/A"}</p>
                        <p>Actual: {goal.selectedActualValue ?? goal.directActualValue ?? goal.actualValue ?? goal.currentValue ?? "N/A"}</p>
                        <p>Weight: {goal.weight ?? "N/A"}</p>
                        <p>Rating: {goal.rawRating ?? "N/A"}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${progress >= 80 ? "bg-emerald-500" : progress >= 60 ? "bg-blue-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <CiViewBoard className="w-5 h-5 text-white" />
                  </div>
                  Performance Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {performanceMatrix.length === 0 && <p className="text-sm text-muted-foreground">No matrix rows available.</p>}
                {performanceMatrix.map((row: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{row.goal || row.kpiOrMeasure || `Goal ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground">Target: {row.target ?? "N/A"} • Actual: {row.actualDirect ?? row.actual ?? "N/A"}</p>
                      </div>
                      <Badge className={statusColor(row.status || row.varianceStatus)}>{row.status || row.varianceStatus || "N/A"}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Weight: {row.weight ?? "N/A"} • Rating: {row.rawRating ?? "N/A"} • Weighted score: {row.weightedScore ?? "N/A"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
