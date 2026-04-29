"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Calendar, 
  BarChart3, 
  Plus, 
  Loader2, 
  UserCheck, 
  Search, 
  Filter,
  ChevronRight,
  ChevronLeft,
  Target,
  Trophy,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  History,
  Info,
  Send,
  Layers
} from "lucide-react"
import { ReviewList } from "./review-list"
import { ReviewCyclesManager } from "./review-cycles-manager"
import { RatingDistributionChart } from "./rating-distribution-chart"
import { fetchMyReviews, fetchReviewCycles } from "@/lib/store/slices/performanceReviewsSlice"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"

export function ReviewsManagement() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const { permissions } = usePerformancePermissions()
  const { myReviews, cycles } = useAppSelector((s) => s.performanceReviews)
  const [activeTab, setActiveTab] = useState(tabParam || "reviews")
  
  const [showCreateReview, setShowCreateReview] = useState(false)
  const [step, setStep] = useState(1)
  const [creatingReview, setCreatingReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    cycleId: "",
    reviewType: "ANNUAL",
    strengths: "",
    areasForImprovement: "",
    achievements: "",
    goals: "",
    selfFeedback: "",
    managerFeedback: ""
  })

  useEffect(() => {
    dispatch(fetchMyReviews())
    if (permissions.canCreateReviewCycle || permissions.canPerformAction("view-all-performance-reviews")) {
      dispatch(fetchReviewCycles())
    }
  }, [dispatch, permissions])

  const handleCreateReview = async () => {
    if (!reviewForm.employeeId) {
      toast.error("Please select an employee")
      return
    }
    if (!reviewForm.reviewType) {
      toast.error("Review type is required")
      return
    }
    setCreatingReview(true)
    try {
      await apiClient.post("/performance-reviews", {
        revieweeId: reviewForm.employeeId,
        reviewType: reviewForm.reviewType,
        cycleId: reviewForm.cycleId === "none" ? null : reviewForm.cycleId,
        strengths: reviewForm.strengths,
        areasForImprovement: reviewForm.areasForImprovement,
        achievements: reviewForm.achievements,
        goals: reviewForm.goals,
        selfFeedback: reviewForm.selfFeedback,
        managerFeedback: reviewForm.managerFeedback
      })
      toast.success("Performance review created")
      setShowCreateReview(false)
      setStep(1)
      dispatch(fetchMyReviews())
    } catch (e: any) {
      toast.error("Failed to create review", { description: e?.message })
    } finally {
      setCreatingReview(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b pb-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-medium"
              >
                <ClipboardList className="w-4 h-4" />
                Reviews
                {myReviews.length > 0 && (
                  <Badge variant="outline" className="ml-1 bg-gray-50 text-gray-500 font-medium border-gray-200">
                    {myReviews.length}
                  </Badge>
                )}
              </TabsTrigger>

              {permissions.canCreateReviewCycle && (
                <>
                  <TabsTrigger 
                    value="cycles" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    Cycles
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="reports" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-medium"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Reports
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {(permissions.canCreateReviewCycle || permissions.canPerformAction("approve-performance-review")) && (
              <Button 
                onClick={() => setShowCreateReview(true)} 
                size="sm" 
                className="rounded-full bg-blue-600 hover:bg-blue-700 gap-2 h-9 px-5 mb-2 shadow-none transition-all font-medium text-xs border border-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> New Review
              </Button>
            )}
          </div>

          <TabsContent value="reviews" className="mt-6 border-none shadow-none bg-transparent">
            <ReviewList type="my" />
          </TabsContent>

          {permissions.canCreateReviewCycle && (
            <>
              <TabsContent value="cycles" className="mt-6 border-none shadow-none bg-transparent">
                <ReviewCyclesManager />
              </TabsContent>

              <TabsContent value="reports" className="mt-6 border-none shadow-none bg-transparent">
                <RatingDistributionChart />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <Dialog open={showCreateReview} onOpenChange={(val) => { setShowCreateReview(val); if(!val) setStep(1); }}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-2 border-gray-200 rounded-2xl shadow-none bg-white h-[600px] flex flex-col">
          <DialogHeader className="bg-white border-b-2 p-6 shrink-0 border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-100">
                   <UserCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-medium text-gray-900">
                    {step === 1 ? "Initialize Review" : "Initial Feedback & Goals"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 font-normal text-[11px] pt-0.5">
                    Step {step} of 2: {step === 1 ? "Assign employee and cycle" : "Qualitative starting points"}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-full border-2 border-gray-100">
                {[1, 2].map((s) => (
                  <div key={s} className={cn("h-1 w-6 rounded-full transition-all", s <= step ? "bg-blue-600" : "bg-gray-200")} />
                ))}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Select Employee *</Label>
                    <Select onValueChange={(val) => setReviewForm({ ...reviewForm, employeeId: val })}>
                      <SelectTrigger className="rounded-lg h-10 border-2 border-gray-100 font-normal text-sm bg-white shadow-none">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-none border-2 border-gray-200 bg-white">
                        <SelectItem value="cml7spmbr000ckt1bcwq6pd8o">Nyasha K (Finance)</SelectItem>
                        <SelectItem value="cmislgonq0001unfkpukqyiah">Admin User (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Review Type *</Label>
                    <Select value={reviewForm.reviewType} onValueChange={(val) => setReviewForm({ ...reviewForm, reviewType: val })}>
                      <SelectTrigger className="rounded-lg h-10 border-2 border-gray-100 font-normal text-sm bg-white shadow-none">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-none border-2 border-gray-200 bg-white">
                        <SelectItem value="ANNUAL">Annual Review</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly Review</SelectItem>
                        <SelectItem value="PROBATIONARY">Probationary Review</SelectItem>
                        <SelectItem value="PROJECT_BASED">Project Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Target Cycle (Optional)</Label>
                  <Select onValueChange={(val) => setReviewForm({ ...reviewForm, cycleId: val })}>
                    <SelectTrigger className="rounded-lg h-10 border-2 border-gray-100 font-normal text-sm bg-white shadow-none">
                      <SelectValue placeholder="Standalone (No Cycle)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-none border-2 border-gray-200 bg-white">
                      <SelectItem value="none">Standalone (No Cycle)</SelectItem>
                      {cycles.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-xl border-2 border-gray-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Employee Overview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-3 rounded-lg border-2 border-gray-100">
                        <p className="text-[9px] font-medium text-gray-400 mb-0.5 uppercase tracking-widest">Department</p>
                        <p className="text-xs font-medium text-gray-600">Finance & Audit</p>
                     </div>
                     <div className="bg-white p-3 rounded-lg border-2 border-gray-100">
                        <p className="text-[9px] font-medium text-gray-400 mb-0.5 uppercase tracking-widest">Last Review</p>
                        <p className="text-xs font-medium text-gray-600">2026-Q1 (4.25)</p>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Notable Achievements</Label>
                    <Textarea 
                      placeholder="e.g. Closed month-end 2 days early..."
                      className="rounded-lg border-2 border-gray-100 text-sm font-normal min-h-[80px] resize-none bg-white shadow-none focus:border-blue-500"
                      value={reviewForm.achievements}
                      onChange={(e) => setReviewForm({...reviewForm, achievements: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Core Strengths</Label>
                    <Textarea 
                      placeholder="e.g. Reliable under pressure..."
                      className="rounded-lg border-2 border-gray-100 text-sm font-normal min-h-[80px] resize-none bg-white shadow-none focus:border-blue-500"
                      value={reviewForm.strengths}
                      onChange={(e) => setReviewForm({...reviewForm, strengths: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Areas for Growth</Label>
                    <Textarea 
                      placeholder="e.g. Delegation..."
                      className="rounded-lg border-2 border-gray-100 text-sm font-normal min-h-[80px] resize-none bg-white shadow-none focus:border-blue-500"
                      value={reviewForm.areasForImprovement}
                      onChange={(e) => setReviewForm({...reviewForm, areasForImprovement: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Development Goals</Label>
                    <Textarea 
                      placeholder="e.g. Advanced Excel course..."
                      className="rounded-lg border-2 border-gray-100 text-sm font-normal min-h-[80px] resize-none bg-white shadow-none focus:border-blue-500"
                      value={reviewForm.goals}
                      onChange={(e) => setReviewForm({...reviewForm, goals: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t-2 border-gray-50">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Initial Manager Feedback</Label>
                  <Textarea 
                    placeholder="Summary of performance..."
                    className="rounded-lg border-2 border-gray-100 text-sm font-normal min-h-[100px] resize-none bg-white shadow-none focus:border-blue-500"
                    value={reviewForm.managerFeedback}
                    onChange={(e) => setReviewForm({...reviewForm, managerFeedback: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t-2 border-gray-100 flex items-center justify-between shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => step === 1 ? setShowCreateReview(false) : setStep(1)} 
              className="rounded-full px-6 font-medium text-gray-400 text-xs hover:bg-white border-2 border-transparent hover:border-gray-200 shadow-none"
            >
              {step === 1 ? "Cancel" : <><ChevronLeft className="w-3.5 h-3.5 mr-2" /> Back</>}
            </Button>
            
            {step === 1 ? (
              <Button 
                onClick={() => setStep(2)} 
                className="rounded-full px-6 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-none font-medium text-xs border border-blue-700"
              >
                Continue <ChevronRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateReview} 
                disabled={creatingReview} 
                className="rounded-full px-8 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-none font-medium text-xs border border-blue-700"
              >
                {creatingReview ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing...</> : <><Send className="w-3.5 h-3.5 mr-2" /> Create Review</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
