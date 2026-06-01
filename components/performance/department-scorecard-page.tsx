"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDepartmentScorecard } from "@/lib/store/slices/scorecardSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { companyProfileApi, type CompanyAddress } from "@/lib/api/company-profile-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiViewBoard, CiUser, CiTrophy, CiFileOn } from "react-icons/ci"
import { Calendar, RefreshCw, ClipboardList } from "lucide-react"
import { TbTarget } from "react-icons/tb"
import { toast } from "sonner"
import DepartmentScorecardPDF from "./department-scorecard-pdf-document"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PERFORMANCE_ACTIONS } from "@/lib/config/performance-permissions"
import { DepartmentQualitativeModal } from "./department-qualitative-modal"

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
  const [periodLabel, setPeriodLabel] = useState(String(new Date().getFullYear()))
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  const [activeAddress, setActiveAddress] = useState<CompanyAddress | null>(null)
  const [isQualModalOpen, setIsQualModalOpen] = useState(false)

  const { hasSpecificAction } = useRolePermissions()
  const canEditQualitative = hasSpecificAction(PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW)

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      setPDFDownloadLink(() => pdfModule.PDFDownloadLink)
    })
    companyProfileApi.getActiveAddress().then((a) => setActiveAddress(a)).catch(() => {})
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
      dispatch(fetchDepartmentScorecard({ departmentName: selectedDepartment, periodLabel }))
    }
  }, [selectedDepartment, periodLabel, dispatch])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load department scorecard", { description: error })
    }
  }, [error])

  const handleRefresh = () => {
    if (selectedDepartment) {
      dispatch(fetchDepartmentScorecard({ departmentName: selectedDepartment, periodLabel }))
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
        <div className="flex items-center gap-2 flex-wrap">
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
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48 rounded-full">
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
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="gradient-info"
            className="rounded-full gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canEditQualitative && departmentScorecard && (
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
          {isClient && departmentScorecard && PDFDownloadLink && (
            <PDFDownloadLink
              document={<DepartmentScorecardPDF data={departmentScorecard} activeAddress={activeAddress} />}
              fileName={`${(departmentInfo?.name || selectedDepartment || "department").replace(/\s+/g, "-")}-Scorecard-${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading: pdfLoading }: any) => (
                <Button
                  size="sm"
                  variant="gradient-update"
                  className="rounded-full gap-1.5"
                  disabled={pdfLoading}
                >
                  <CiFileOn className={`w-3.5 h-3.5 ${pdfLoading ? "animate-spin" : ""}`} />
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

          {departmentScorecard?.lifecycle && (
            <div className="rounded-xl border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3 flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 border-0">{departmentScorecard.lifecycle.phase}</Badge>
              <p className="text-sm text-blue-800">{departmentScorecard.lifecycle.bannerMessage}</p>
            </div>
          )}

          {(departmentInfo?.headOfDepartmentName || departmentScorecard?.appraiser || departmentScorecard?.contract?.reviewer) && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Head of Department</p>
                  <p className="font-semibold mt-1">{departmentInfo?.headOfDepartmentName || "—"}</p>
                  <p className="text-xs text-muted-foreground">{departmentInfo?.headOfDepartmentTitle || ""}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Appraiser</p>
                  <p className="font-semibold mt-1">{departmentScorecard?.appraiser?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{departmentScorecard?.appraiser?.title || ""}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Contract Reviewer</p>
                  <p className="font-semibold mt-1">{departmentScorecard?.contract?.reviewer?.name || "—"}</p>
                </CardContent>
              </Card>
            </div>
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
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {goal.selectedSource && (
                            <Badge className="bg-gray-100 text-gray-700 text-xs border-0">{goal.selectedSource}</Badge>
                          )}
                          <Badge className={statusColor(goal.status)}>{String(goal.status || "N/A")}</Badge>
                        </div>
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
                      {goal.childContributions && goal.childContributions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Employee Contributions</p>
                          <div className="space-y-1">
                            {goal.childContributions.map((c: any, ci: number) => (
                              <div key={ci} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{c.employeeName}</span>
                                <span>{c.progressPct}% · weight {c.contributionWeight}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

          {rollupSummary.length > 0 && (
            <Card className="bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <CiUser className="w-5 h-5 text-white" />
                  </div>
                  Employee Roll-up Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">Employee</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">Final Score</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">Roll-up Weight</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">Weighted Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rollupSummary.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{row.employeeName}</td>
                          <td className="px-3 py-2 text-right">{row.finalScore ?? "—"}</td>
                          <td className="px-3 py-2 text-right">{row.rollupWeight ?? "—"}%</td>
                          <td className="px-3 py-2 text-right">{row.weightedContribution ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {(() => {
            const attrs = departmentScorecard?.document?.qualitativeSections?.personalAttributes
            if (!attrs || attrs.length === 0) return null
            const cols = attrs[0]?.columns?.map((c: any) => c.label) ?? []
            return (
              <Card className="bg-white rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                    HOD Leadership Evaluation
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

          <DepartmentQualitativeModal
            isOpen={isQualModalOpen}
            onClose={() => setIsQualModalOpen(false)}
            departmentName={selectedDepartment}
            periodLabel={periodLabel}
            existingAttributes={departmentScorecard?.document?.qualitativeSections?.personalAttributes}
            onSaved={handleRefresh}
          />
        </>
      )}
    </div>
  )
}
