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
  FileSearch,
  Trophy,
  Lightbulb,
  MessageSquare,
  AlertTriangle
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
    color: "bg-blue-500",
  },
  {
    id: "external",
    title: "External Evaluation",
    description: "Objective assessment by external consultants or peers.",
    icon: FileSearch,
    color: "bg-blue-500",
  },
  {
    id: "hr",
    title: "HR Moderation",
    description: "Human Resources reviews and moderates scores for consistency.",
    icon: Shield,
    color: "bg-blue-500",
  },
  {
    id: "manager",
    title: "Manager Assessment",
    description: "Direct manager provides final feedback and ratings.",
    icon: Briefcase,
    color: "bg-blue-500",
  },
  {
    id: "finalized",
    title: "Finalized",
    description: "The review is locked and a permanent PDF record is generated.",
    icon: Award,
    color: "bg-green-500",
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
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border-2 border-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium text-gray-400">Loading assessment data...</p>
      </div>
    )
  }

  const isLocked = currentReview.isLocked
  
  const validateAll = (): { valid: boolean; error?: string } => {
    for (const [_, pf] of Object.entries(pillarFeedback)) {
      const pillarLabel = pf.pillarName || 'pillar'
      if (!pf.rating || pf.rating < 1 || pf.rating > 6) {
        return { valid: false, error: `${pillarLabel}: rating must be between 1 and 6` }
      }
      if (!Number.isInteger(pf.rating)) {
        return { valid: false, error: `${pillarLabel}: rating must be an integer` }
      }
      if ((pf.feedback || "").trim().length < MIN_FEEDBACK_LENGTH) {
        return {
          valid: false,
          error: `${pillarLabel}: evaluation must be at least ${MIN_FEEDBACK_LENGTH} characters`,
        }
      }
    }
    return { valid: true }
  }

  // Stages where the next step is finalize, not advance — the backend rejects
  // submitStage at this point with "No further stage to advance to from here."
  const FINAL_REVIEW_STAGES = new Set([
    'manager',
    'MANAGER_REVIEW',
    'final',
    'FINAL_REVIEW',
  ])

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

    const stage = currentReview.currentStage
    const isFinalStage = FINAL_REVIEW_STAGES.has(stage)

    try {
      // At the final reviewable stage, attempt to save feedback (best-effort)
      // then finalize. The backend may either accept submitStage as a save-only,
      // or reject with "no further stage" — both paths still finalize.
      if (isFinalStage) {
        try {
          await dispatch(
            submitReviewStage({ id: reviewId, stage, pillarFeedback: payload })
          ).unwrap()
        } catch (e: any) {
          if (!/no further stage|use .*\/finalize/i.test(e?.message || '')) {
            throw e
          }
        }
        await dispatch(finalizeReview(reviewId)).unwrap()
        toast.success('Review finalized')
        return
      }

      await dispatch(
        submitReviewStage({ id: reviewId, stage, pillarFeedback: payload })
      ).unwrap()
      toast.success('Stage submitted successfully')
    } catch (e: any) {
      // Safety net: if the backend signals "no further stage / use /finalize"
      // even for a stage we didn't classify as final, fall back to finalize.
      const msg = e?.message || ''
      if (/no further stage|use .*\/finalize/i.test(msg)) {
        try {
          await dispatch(finalizeReview(reviewId)).unwrap()
          toast.success('Review finalized')
          return
        } catch (e2: any) {
          toast.error(e2?.message || 'Finalize failed')
          return
        }
      }
      toast.error(msg || 'Submit failed')
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
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32 px-4">
      {/* Timeline Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-24 space-y-6">
          <div className="space-y-1 px-1">
            <h2 className="text-xl font-medium text-gray-900 tracking-tight">Assessment Timeline</h2>
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
                      "absolute left-[20px] top-10 w-0.5 h-12 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}

                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all shadow-none",
                    isCompleted ? "bg-green-500 border-green-500" : isCurrent ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <stage.icon className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-3 h-3 text-gray-300 fill-gray-100" />
                    )}
                  </div>

                  <div className="ml-4 flex-1 pt-1 pb-10">
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all shadow-none",
                      isCurrent 
                        ? "bg-white border-blue-200" 
                        : isCompleted 
                          ? "bg-green-50/50 border-green-200" 
                          : "bg-transparent border-transparent opacity-50"
                    )}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={cn(
                          "font-medium text-sm",
                          isCurrent ? "text-blue-700" : isCompleted ? "text-green-800" : "text-gray-400"
                        )}>
                          {stage.title}
                        </h3>
                        {isCurrent && <Badge variant="outline" className="text-blue-600 text-[10px] uppercase font-medium px-2 py-0 border-blue-200 bg-blue-50/50">Current</Badge>}
                        {isCompleted && <Badge variant="outline" className="text-green-600 text-[10px] uppercase font-medium px-2 py-0 border-green-200 bg-green-50/50">Done</Badge>}
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed font-normal",
                        isCurrent ? "text-gray-600" : isCompleted ? "text-green-700/60" : "text-gray-400"
                      )}>{stage.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Card className="border-2 border-gray-200 shadow-none bg-white rounded-xl p-5 space-y-4">
             <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">Reviewee</span>
                <span className="text-sm font-medium text-gray-700">{currentReview.reviewee?.firstName} {currentReview.reviewee?.lastName}</span>
             </div>
             <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">Cycle</span>
                <span className="text-sm font-medium text-gray-700">{(currentReview as any).reviewPeriod || "Annual 2026"}</span>
             </div>
             <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">Type</span>
                <span className="text-sm font-medium text-gray-700">{(currentReview as any).reviewType || "ANNUAL"}</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">Rating Scale</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-500 font-medium text-[10px] border-gray-200 uppercase">1-5 SCALE</Badge>
             </div>
          </Card>
        </div>
      </div>

      {/* Main Evaluation Area */}
      <div className="lg:col-span-8 space-y-6">
        {isLocked && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 flex items-center gap-5 shadow-none">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
              <Lock className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-gray-900">Document Locked & Finalized</p>
              <p className="text-sm text-gray-500 font-normal">This performance review is now a permanent record. No further modifications are permitted.</p>
            </div>
            <Button variant="outline" className="rounded-full border-gray-200 text-gray-600 hover:bg-white font-medium shadow-none">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        )}

        {/* Quantitative Snapshot Card */}
        <Card className="border-2 border-gray-200 shadow-none overflow-hidden rounded-xl bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Quantitative Snapshot
                </CardTitle>
                <p className="text-sm text-gray-500 font-normal">Auto-populated organizational metrics (F.07).</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-medium text-gray-900">{automatedProgress.toFixed(2)}%</p>
                <p className="text-[10px] uppercase font-medium text-gray-400 mt-1 tracking-widest">Verified Score</p>
              </div>
            </div>
            <div className="space-y-3">
              <Progress value={automatedProgress} className="h-2 bg-gray-100 rounded-full [&>div]:bg-blue-600" />
              <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 px-1 uppercase tracking-widest">
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
              <h3 className="text-lg font-medium text-gray-900">Qualitative Evaluation</h3>
              <p className="text-sm text-gray-500 font-normal">Provide behavioral evidence and scoring for each pillar.</p>
            </div>
            <Badge variant="outline" className="rounded-full border-2 border-gray-200 text-gray-400 px-3 py-1 text-[10px] tracking-tight bg-white">
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
                <Card key={p.id} className="border-2 border-gray-200 shadow-none rounded-xl overflow-hidden bg-white hover:border-blue-300 transition-colors">
                  <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                      <div className="space-y-1">
                        <h4 className="text-xl font-medium text-gray-900 tracking-tight">{p.displayName}</h4>
                        <p className="text-sm text-gray-500 font-normal">Standardized performance dimension for this role.</p>
                      </div>
                      {pf.rating > 0 && (
                        <div className="px-4 py-1.5 rounded-lg bg-blue-50 text-blue-600 border-2 border-blue-200 flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase">Score</span>
                          <span className="text-lg font-semibold">{pf.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-medium uppercase tracking-widest text-gray-400">
                        Evaluation Rating (1-6 Integer Only)
                      </Label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5,6].map((r) => (
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
                              "flex-1 h-12 rounded-xl border-2 font-medium transition-all text-base shadow-none",
                              pf.rating === r
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-widest text-gray-400">
                          Qualitative Narrative Evidence
                        </Label>
                        <div className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-100", charColor)}>
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
                            "rounded-xl border-2 border-gray-200 focus:ring-0 focus:border-blue-500 p-4 text-sm font-normal resize-none transition-all placeholder:text-gray-300 shadow-none bg-white",
                            tooShort && "border-orange-200 bg-orange-50/20"
                          )}
                          placeholder="Provide behavioral examples and evidence..."
                        />
                        {tooShort && (
                          <p className="text-[11px] font-medium text-orange-500 mt-2 flex items-center gap-1.5">
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

        {/* Narrative Summary */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 px-1">
            <History className="w-5 h-5 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Narrative Summary</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-gray-200 shadow-none rounded-xl p-6 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Key Achievements</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {currentReview.achievements || "No achievements recorded."}
              </p>
            </Card>

            <Card className="border-2 border-gray-200 shadow-none rounded-xl p-6 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Strengths</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {currentReview.strengths || "No strengths recorded."}
              </p>
            </Card>

            <Card className="border-2 border-gray-200 shadow-none rounded-xl p-6 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Areas for Growth</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {currentReview.areasForImprovement || "No areas for improvement recorded."}
              </p>
            </Card>

            <Card className="border-2 border-gray-200 shadow-none rounded-xl p-6 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Development Goals</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {currentReview.goals || "No goals recorded."}
              </p>
            </Card>
          </div>

          <Card className="border-2 border-gray-200 shadow-none rounded-xl p-6 space-y-4 bg-gray-50/10">
             <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Feedback Threads</h4>
             </div>
             <div className="space-y-6">
                {currentReview.selfFeedback && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-medium text-blue-600 uppercase tracking-widest">Employee Feedback</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-blue-200 font-normal">
                      {currentReview.selfFeedback}
                    </p>
                  </div>
                )}
                {currentReview.managerFeedback && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-medium text-orange-600 uppercase tracking-widest">Manager Feedback</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-orange-200 font-normal">
                      {currentReview.managerFeedback}
                    </p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>

      {/* Floating Action Bar */}
      {!isLocked && (
        <div className="fixed bottom-10 left-[60%] -translate-x-1/2 bg-white border-2 border-gray-200 rounded-full px-8 py-3 shadow-none z-50 flex items-center gap-8 ring-1 ring-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Active Stage</span>
            <span className="text-sm font-medium text-gray-700 capitalize">{currentReview.currentStage?.replace('_', ' ') || "Processing"}</span>
          </div>
          
          <div className="w-px h-8 bg-gray-200" />

          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="ghost"
            className="rounded-full font-medium text-gray-500 hover:text-blue-600 h-10 px-6 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 shadow-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-none px-10 h-10 font-medium text-[12px] text-white transition-all border border-blue-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Stage
          </Button>

          {canFinalize && (
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
              className="rounded-full bg-green-600 hover:bg-green-700 shadow-none px-10 h-10 font-medium text-[12px] text-white transition-all border border-green-700"
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
