"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchReview,
  submitReviewStage,
  finalizeReview,
} from "@/lib/store/slices/performanceReviewsSlice"
import { fetchScorecardPillars } from "@/lib/store/slices/performanceConfigSlice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Loader2,
  Lock,
  Send,
  Award,
  CheckCircle2,
  FileText,
  Activity,
  History,
  Download,
  Info,
  Circle,
  User,
  Shield,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Target,
  FileSearch
} from "lucide-react"
import { toast } from "sonner"
import {
  ReviewPillarFeedback,
  ReviewStage,
} from "@/lib/api/performance-reviews-api"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface Props {
  reviewId: string
}

const MIN_FEEDBACK_LENGTH = 50

const REVIEW_STAGES_CONFIG = [
  {
    id: "self",
    title: "Self-Review",
    description: "Employee evaluates their own performance and achievements.",
    icon: User,
    color: "bg-blue-600",
  },
  {
    id: "external",
    title: "External Evaluation",
    description: "Objective assessment by external consultants or peers.",
    icon: FileSearch,
    color: "bg-blue-600",
  },
  {
    id: "hr",
    title: "HR Moderation",
    description: "Human Resources reviews and moderates scores for consistency.",
    icon: Shield,
    color: "bg-blue-600",
  },
  {
    id: "manager",
    title: "Manager Assessment",
    description: "Direct manager provides final feedback and ratings.",
    icon: Briefcase,
    color: "bg-blue-600",
  },
  {
    id: "finalized",
    title: "Finalized",
    description: "The review is locked and a permanent PDF record is generated.",
    icon: Award,
    color: "bg-green-600",
  },
]

export function ReviewForm({ reviewId }: Props) {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { currentReview, loading, saving } = useAppSelector(
    (s) => s.performanceReviews
  )
  const { pillars } = useAppSelector((s) => s.performanceConfig)

  const [pillarFeedback, setPillarFeedback] = useState<
    Record<string, { rating: number; feedback: string; pillarName?: string }>
  >({})
  const [finalizing, setFinalizing] = useState(false)

  useEffect(() => {
    dispatch(fetchReview(reviewId))
    if (pillars.length === 0) dispatch(fetchScorecardPillars())
  }, [dispatch, reviewId, pillars.length])

  useEffect(() => {
    if (!currentReview) return
    const next: Record<
      string,
      { rating: number; feedback: string; pillarName?: string }
    > = {}
    pillars.forEach((p) => {
      const existing = currentReview.pillarFeedback?.find((pf) => pf.pillarId === p.id)
      next[p.id] = {
        rating: existing?.rating || 0,
        feedback: existing?.feedback || "",
        pillarName: p.displayName,
      }
    })
    setPillarFeedback(next)
  }, [currentReview, pillars])

  const stageStatus = useMemo(() => {
    if (!currentReview) return {}
    const status: Record<string, "completed" | "current" | "upcoming"> = {}
    const stages = REVIEW_STAGES_CONFIG.map(s => s.id)
    const currentStageId = (currentReview.currentStage || "").toLowerCase()
    const currentIdx = stages.indexOf(currentStageId)
    
    REVIEW_STAGES_CONFIG.forEach((s, idx) => {
      if (currentReview.status === "FINALIZED" || currentReview.isLocked) {
        status[s.id] = "completed"
      } else if (idx < currentIdx) {
        status[s.id] = "completed"
      } else if (idx === currentIdx) {
        status[s.id] = "current"
      } else {
        status[s.id] = "upcoming"
      }
    })
    return status
  }, [currentReview])

  if (loading || !currentReview) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium text-gray-400">Loading assessment data...</p>
      </div>
    )
  }

  const isLocked = currentReview.isLocked
  
  const validateAll = (): { valid: boolean; error?: string } => {
    for (const [_, pf] of Object.entries(pillarFeedback)) {
      if (!pf.rating || pf.rating < 1 || pf.rating > 5) {
        return { valid: false, error: "All ratings must be between 1 and 5" }
      }
      if (!Number.isInteger(pf.rating)) {
        return { valid: false, error: "Ratings must be integers" }
      }
      if ((pf.feedback || "").trim().length < MIN_FEEDBACK_LENGTH) {
        return {
          valid: false,
          error: `Evaluations must be at least ${MIN_FEEDBACK_LENGTH} characters`,
        }
      }
    }
    return { valid: true }
  }

  const handleSubmit = async () => {
    const v = validateAll()
    if (!v.valid) {
      toast.error(v.error!)
      return
    }
    const payload: ReviewPillarFeedback[] = Object.entries(pillarFeedback).map(
      ([pillarId, pf]) => ({
        pillarId,
        pillarName: pf.pillarName,
        rating: pf.rating,
        feedback: pf.feedback.trim(),
      })
    )
    try {
      await dispatch(
        submitReviewStage({
          id: reviewId,
          stage: currentReview.currentStage,
          pillarFeedback: payload,
        })
      ).unwrap()
      toast.success("Stage submitted successfully")
    } catch (e: any) {
      toast.error(e?.message || "Submit failed")
    }
  }

  const handleFinalize = async () => {
    if (!confirm("Finalize this review?")) return
    setFinalizing(true)
    try {
      await dispatch(finalizeReview(reviewId)).unwrap()
      toast.success("Review finalized")
    } catch (e: any) {
      toast.error(e?.message || "Finalize failed")
    } finally {
      setFinalizing(false)
    }
  }

  const canFinalize = permissions.canFinalizeReview && !isLocked && 
    (["manager", "final", "MANAGER_REVIEW", "FINAL_REVIEW"].includes(currentReview.currentStage))

  const automatedProgress = currentReview.performanceSnapshot?.totalProgress || 80.00

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
      {/* Timeline Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-24 space-y-6">
          <div className="space-y-1 px-1">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Assessment Timeline</h2>
            <p className="text-sm text-gray-500 font-normal">Track the lifecycle of this performance review.</p>
          </div>

          <div className="relative space-y-1">
            {REVIEW_STAGES_CONFIG.map((stage, index) => {
              const status = stageStatus[stage.id]
              const isCompleted = status === "completed"
              const isCurrent = status === "current"
              
              return (
                <div key={stage.id} className="relative flex items-start group">
                  {index < REVIEW_STAGES_CONFIG.length - 1 && (
                    <div className={cn(
                      "absolute left-[23px] top-10 w-0.5 h-12 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}

                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm transition-all",
                    isCompleted ? "bg-green-500" : isCurrent ? stage.color : "bg-gray-50"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <stage.icon className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>

                  <div className="ml-4 flex-1 pt-1 pb-10">
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      isCurrent 
                        ? "bg-white border-blue-500 shadow-md" 
                        : isCompleted 
                          ? "bg-green-50/50 border-green-100" 
                          : "bg-transparent border-transparent opacity-50"
                    )}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          isCurrent ? "text-blue-600" : isCompleted ? "text-green-700" : "text-gray-400"
                        )}>
                          {stage.title}
                        </h3>
                        {isCurrent && <Badge className="bg-blue-600 text-[10px] uppercase font-semibold px-2 py-0">Current</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 font-normal leading-relaxed">{stage.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Card className="border border-gray-200 shadow-sm bg-white rounded-xl p-5 space-y-4">
             <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Reviewee</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{currentReview.reviewee?.firstName} {currentReview.reviewee?.lastName}</span>
                </div>
             </div>
             <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Cycle</span>
                <span className="text-sm font-medium text-gray-900">{currentReview.reviewPeriod || "Annual 2026"}</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Rating Scale</span>
                <Badge variant="secondary" className="bg-gray-50 text-gray-500 font-semibold text-[10px] border-none">1-5 SCALE</Badge>
             </div>
          </Card>
        </div>
      </div>

      {/* Main Evaluation Area */}
      <div className="lg:col-span-8 space-y-6">
        {isLocked && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900">Document Locked & Finalized</p>
              <p className="text-sm text-gray-500 font-normal">This review is now a permanent record. No further modifications are permitted.</p>
            </div>
            <Button variant="outline" className="rounded-full border-gray-300 font-medium">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        )}

        {/* Quantitative Snapshot Card */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden rounded-xl bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Quantitative Snapshot
                </CardTitle>
                <p className="text-sm text-gray-500 font-normal">Auto-populated organizational metrics (F.07).</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold text-gray-900">{automatedProgress.toFixed(2)}%</p>
                <p className="text-[10px] uppercase font-semibold text-gray-400 mt-1">Verified Score</p>
              </div>
            </div>
            <div className="space-y-3">
              <Progress value={automatedProgress} className="h-2.5 bg-gray-100 rounded-full [&>div]:bg-blue-600" />
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 px-1 uppercase tracking-wider">
                <span>Progress to target</span>
                <span>Annualized</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Evaluation Pillars */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Qualitative Evaluation</h3>
              <p className="text-sm text-gray-500 font-normal">Provide behavioral evidence and scoring for each pillar.</p>
            </div>
            <Badge variant="outline" className="rounded-full text-blue-600 border-blue-100 bg-blue-50/30 px-3 py-1 font-semibold text-[10px] tracking-tight">
              F.04 & F.08 COMPLIANT
            </Badge>
          </div>

          <div className="space-y-6">
            {pillars.map((p) => {
              const pf = pillarFeedback[p.id] || { rating: 0, feedback: "" }
              const len = (pf.feedback || "").length
              const tooShort = len < MIN_FEEDBACK_LENGTH && len > 0
              const charColor = len >= MIN_FEEDBACK_LENGTH ? "text-green-600" : len > 0 ? "text-orange-500" : "text-gray-400"

              return (
                <Card key={p.id} className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                  <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between border-b border-gray-50 pb-4">
                      <div className="space-y-1">
                        <h4 className="text-xl font-semibold text-gray-900 tracking-tight">{p.displayName}</h4>
                        <p className="text-sm text-gray-500 font-normal">Standardized performance dimension for this role.</p>
                      </div>
                      {pf.rating > 0 && (
                        <div className="px-4 py-1.5 rounded-lg bg-blue-600 text-white flex items-center gap-2 shadow-sm">
                          <span className="text-[10px] font-semibold uppercase opacity-80">Score</span>
                          <span className="text-lg font-bold">{pf.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-tight text-gray-400">
                        Evaluation Rating (1-5 Integer Only)
                      </Label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            disabled={isLocked}
                            onClick={() =>
                              setPillarFeedback((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], rating: r, pillarName: p.displayName },
                              }))
                            }
                            className={cn(
                              "flex-1 h-12 rounded-lg border font-semibold transition-all text-base",
                              pf.rating === r
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-white border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-tight text-gray-400">
                          Qualitative Narrative Evidence
                        </Label>
                        <div className={cn("text-[10px] font-semibold", charColor)}>
                          {len} / {MIN_FEEDBACK_LENGTH} MIN CHARACTERS
                        </div>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={pf.feedback}
                          disabled={isLocked}
                          onChange={(e) =>
                            setPillarFeedback((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], feedback: e.target.value, pillarName: p.displayName },
                            }))
                          }
                          rows={4}
                          className={cn(
                            "rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-4 text-sm font-normal resize-none transition-all placeholder:text-gray-300",
                            tooShort && "border-orange-200 bg-orange-50/30"
                          )}
                          placeholder="Provide behavioral examples and evidence..."
                        />
                        {tooShort && (
                          <p className="text-[11px] font-medium text-orange-600 mt-1.5 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {MIN_FEEDBACK_LENGTH - len} characters remaining
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {!isLocked && (
        <div className="fixed bottom-10 left-[60%] -translate-x-1/2 bg-white border border-gray-200 rounded-full px-8 py-3 shadow-xl z-50 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Active Stage</span>
            <span className="text-sm font-semibold text-gray-900 capitalize">{currentReview.currentStage?.replace('_', ' ') || "Processing"}</span>
          </div>
          
          <div className="w-px h-8 bg-gray-100" />

          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="ghost"
            className="rounded-full font-semibold text-gray-500 hover:text-blue-600 h-10 px-6"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md px-8 h-10 font-semibold uppercase text-[11px] tracking-wider text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Stage
          </Button>

          {canFinalize && (
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
              className="rounded-full bg-green-600 hover:bg-green-700 shadow-md px-8 h-10 font-semibold uppercase text-[11px] tracking-wider text-white"
            >
              {finalizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Award className="w-4 h-4 mr-2" />}
              Finalize
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
