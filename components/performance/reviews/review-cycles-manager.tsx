"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchReviewCycles,
  createReviewCycle,
} from "@/lib/store/slices/performanceReviewsSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Loader2, 
  Calendar as CalendarIcon, 
  Trash2, 
  Send,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronLeft,
  Settings,
  Layers
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { apiClient } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"

export function ReviewCyclesManager() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { cycles, loading } = useAppSelector((s) => s.performanceReviews)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    reviewPeriodStart: undefined as Date | undefined,
    reviewPeriodEnd: undefined as Date | undefined,
    selfAssessmentDeadline: undefined as Date | undefined,
    peerReviewDeadline: undefined as Date | undefined,
    managerReviewDeadline: undefined as Date | undefined,
    availableReviewTypes: ["Self", "Manager", "Peer"],
    reviewRatingScale: "1-5 Scale",
    isActive: true
  })
  const [creating, setCreating] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchReviewCycles())
  }, [dispatch])

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.reviewPeriodStart || !formData.reviewPeriodEnd) {
      toast.error("Required fields must be filled")
      return
    }
    setCreating(true)
    try {
      await dispatch(createReviewCycle({
        title: formData.title,
        reviewPeriodStart: formData.reviewPeriodStart.toISOString(),
        reviewPeriodEnd: formData.reviewPeriodEnd.toISOString(),
        selfAssessmentDeadline: formData.selfAssessmentDeadline?.toISOString(),
        peerReviewDeadline: formData.peerReviewDeadline?.toISOString(),
        managerReviewDeadline: formData.managerReviewDeadline?.toISOString(),
        availableReviewTypes: formData.availableReviewTypes,
        reviewRatingScale: formData.reviewRatingScale,
        isActive: formData.isActive
      })).unwrap()
      toast.success("Review cycle created")
      setOpen(false)
      setStep(1)
      setFormData({
        title: "",
        reviewPeriodStart: undefined,
        reviewPeriodEnd: undefined,
        selfAssessmentDeadline: undefined,
        peerReviewDeadline: undefined,
        managerReviewDeadline: undefined,
        availableReviewTypes: ["Self", "Manager", "Peer"],
        reviewRatingScale: "1-5 Scale",
        isActive: true
      })
    } catch (e: any) {
      toast.error(e?.message || "Failed to create cycle")
    } finally {
      setCreating(false)
    }
  }

  const handleInitiate = async (id: string) => {
    setProcessingId(id)
    try {
      await apiClient.post(`/performance-reviews/cycles/${id}/initiate`, {})
      toast.success("Review cycle reminders processed")
      dispatch(fetchReviewCycles())
    } catch (e: any) {
      toast.error("Failed to initiate cycle", { description: e?.message })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review cycle?")) return
    setProcessingId(id)
    try {
      await apiClient.delete(`/performance/review-cycles/${id}`)
      toast.success("Review cycle deleted")
      dispatch(fetchReviewCycles())
    } catch (e: any) {
      toast.error("Failed to delete cycle", { description: e?.message })
    } finally {
      setProcessingId(null)
    }
  }

  const toggleReviewType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      availableReviewTypes: prev.availableReviewTypes.includes(type)
        ? prev.availableReviewTypes.filter(t => t !== type)
        : [...prev.availableReviewTypes, type]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Review Cycles</h2>
          <p className="text-sm text-gray-500 font-normal">Configure and monitor performance assessment windows.</p>
        </div>
        {permissions.canCreateReviewCycle && (
          <Button onClick={() => setOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-all gap-2 px-6 h-10 font-medium">
            <Plus className="w-4 h-4" /> New Cycle
          </Button>
        )}
      </div>

      {loading && cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading cycles...</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/30 border border-dashed rounded-xl border-gray-200">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-sm">
            <CalendarIcon className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No cycles created yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto font-normal">Create a cycle to start automating performance reviews.</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-6 rounded-full border-gray-200 hover:bg-white transition-all text-gray-600">
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((c) => (
            <Card key={c.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 rounded-xl bg-white group">
              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900 leading-tight text-base transition-colors">{c.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        {format(new Date(c.reviewPeriodStart), "MMM yyyy")} — {format(new Date(c.reviewPeriodEnd), "MMM yyyy")}
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 border font-semibold text-[10px] uppercase",
                      c.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {c.isActive ? "Active" : "Archived"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase">
                        Self Deadline
                      </p>
                      <p className="text-xs font-medium text-gray-800">
                        {c.selfAssessmentDeadline ? format(new Date(c.selfAssessmentDeadline), "MMM d, yy") : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase">
                        Final Deadline
                      </p>
                      <p className="text-xs font-medium text-gray-800">
                        {c.managerReviewDeadline ? format(new Date(c.managerReviewDeadline), "MMM d, yy") : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.availableReviewTypes?.map(type => (
                      <Badge key={type} variant="outline" className="bg-white text-blue-600 border-blue-200 px-2 py-0 rounded text-[10px] font-semibold uppercase">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                  <Button 
                    size="sm" 
                    className="flex-1 rounded-full text-xs font-semibold gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all text-white h-8"
                    onClick={() => handleInitiate(c.id)}
                    disabled={processingId === c.id}
                  >
                    {processingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Trigger
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200 transition-all"
                    onClick={() => handleDelete(c.id)}
                    disabled={processingId === c.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setStep(1); }}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-gray-200 rounded-2xl shadow-xl bg-white h-[600px] flex flex-col">
          <DialogHeader className="bg-white border-b p-6 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  {step === 1 ? <Layers className="w-5 h-5 text-blue-600" /> : <Settings className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {step === 1 ? "Review Cycle Details" : "Configuration & Targets"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 font-normal text-xs">
                    Step {step} of 2: {step === 1 ? "Basic information and period windows" : "Review types and scoring scales"}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2].map((s) => (
                  <div key={s} className={cn("h-1.5 w-8 rounded-full transition-all", s <= step ? "bg-blue-600" : "bg-gray-100")} />
                ))}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Cycle Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. 2026 Annual Review"
                      className="rounded-lg h-10 border-gray-200 font-normal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Status</Label>
                    <div className="flex items-center justify-between h-10 px-3 bg-gray-50 border rounded-lg border-gray-200">
                      <span className="text-xs font-medium text-gray-600">{formData.isActive ? "Active" : "Draft"}</span>
                      <Switch 
                        checked={formData.isActive} 
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Review Period Start *</Label>
                    <DatePicker 
                      value={formData.reviewPeriodStart} 
                      onChange={(date) => setFormData({ ...formData, reviewPeriodStart: date })}
                      placeholder="Select date"
                      allowFutureDates
                      className="rounded-lg h-10 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Review Period End *</Label>
                    <DatePicker 
                      value={formData.reviewPeriodEnd} 
                      onChange={(date) => setFormData({ ...formData, reviewPeriodEnd: date })}
                      placeholder="Select date"
                      allowFutureDates
                      className="rounded-lg h-10 border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key Deadlines</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-gray-500">Self Evaluation</Label>
                      <DatePicker 
                        value={formData.selfAssessmentDeadline} 
                        onChange={(date) => setFormData({ ...formData, selfAssessmentDeadline: date })}
                        placeholder="Deadline"
                        allowFutureDates
                        className="rounded-lg h-10 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-gray-500">Peer Feedback</Label>
                      <DatePicker 
                        value={formData.peerReviewDeadline} 
                        onChange={(date) => setFormData({ ...formData, peerReviewDeadline: date })}
                        placeholder="Deadline"
                        allowFutureDates
                        className="rounded-lg h-10 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-gray-500">Manager Final</Label>
                      <DatePicker 
                        value={formData.managerReviewDeadline} 
                        onChange={(date) => setFormData({ ...formData, managerReviewDeadline: date })}
                        placeholder="Deadline"
                        allowFutureDates
                        className="rounded-lg h-10 border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-gray-900">Available Review Types</Label>
                      <p className="text-xs text-gray-500 font-normal">Select which participants are required for this cycle.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["Self", "Manager", "Peer", "External", "Stakeholder"].map(type => (
                      <div 
                        key={type} 
                        onClick={() => toggleReviewType(type)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                          formData.availableReviewTypes.includes(type) 
                            ? "border-blue-600 bg-blue-50/50" 
                            : "border-gray-100 bg-white hover:border-gray-200"
                        )}
                      >
                        <span className={cn("text-sm font-medium", formData.availableReviewTypes.includes(type) ? "text-blue-700" : "text-gray-600")}>
                          {type} Review
                        </span>
                        <Checkbox 
                          checked={formData.availableReviewTypes.includes(type)}
                          className="rounded-full border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-900">Rating Scale Configuration</Label>
                    <p className="text-xs text-gray-500 font-normal">Standardized scale applied to all evaluation pillars.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-gray-400" />
                      <Input
                        value={formData.reviewRatingScale}
                        onChange={(e) => setFormData({ ...formData, reviewRatingScale: e.target.value })}
                        className="bg-transparent border-none shadow-none focus-visible:ring-0 h-8 font-semibold text-gray-900 px-0 w-32"
                      />
                    </div>
                    <Badge className="bg-blue-600 text-white font-bold text-[10px]">INTEGER ONLY</Badge>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                  <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700 font-medium leading-relaxed">
                    Triggering this cycle will automatically notify all assigned employees and their respective reviewers. Ensure all deadlines are accurate before proceeding.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t flex items-center justify-between shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => step === 1 ? setOpen(false) : setStep(1)} 
              className="rounded-full px-6 font-semibold text-gray-500"
            >
              {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-2" /> Back</>}
            </Button>
            
            {step === 1 ? (
              <Button 
                onClick={() => setStep(2)} 
                className="rounded-full px-8 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold"
              >
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreate} 
                disabled={creating} 
                className="rounded-full px-10 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold"
              >
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing...</> : <><Send className="w-4 h-4 mr-2" /> Create Cycle</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
