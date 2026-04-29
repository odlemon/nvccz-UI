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
      toast.success("Cycle reminders sent")
      dispatch(fetchReviewCycles())
    } catch (e: any) {
      toast.error("Failed to initiate cycle", { description: e?.message })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cycle?")) return
    setProcessingId(id)
    try {
      await apiClient.delete(`/performance/review-cycles/${id}`)
      toast.success("Cycle deleted")
      dispatch(fetchReviewCycles())
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message })
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
          <h2 className="text-xl font-medium text-gray-900 tracking-tight">Review Cycles</h2>
          <p className="text-sm text-gray-500 font-normal">Configure assessment windows and automation rules.</p>
        </div>
        {permissions.canCreateReviewCycle && (
          <Button onClick={() => setOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-none transition-all gap-2 px-5 h-9 font-medium text-xs border border-blue-700">
            <Plus className="w-3.5 h-3.5" /> New Cycle
          </Button>
        )}
      </div>

      {loading && cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-none">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading cycles...</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed rounded-xl border-gray-200 shadow-none">
          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <CalendarIcon className="w-6 h-6 text-gray-200" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No cycles yet</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto font-normal">Create a cycle to start automating performance reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((c) => (
            <Card key={c.id} className="overflow-hidden border border-gray-200 hover:border-blue-300 transition-all rounded-xl bg-white shadow-none group">
              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900 leading-tight text-base">{c.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(c.reviewPeriodStart), "MMM yyyy")} — {format(new Date(c.reviewPeriodEnd), "MMM yyyy")}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-2 py-0 border-2 font-medium text-[9px] uppercase tracking-widest",
                      c.isActive ? "text-green-600 border-green-200 bg-green-50/30" : "text-gray-400 border-gray-200 bg-gray-50/30"
                    )}>
                      {c.isActive ? "Active" : "Draft"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
                      <p className="text-[9px] font-medium text-gray-400 mb-0.5 uppercase tracking-widest">Self Deadline</p>
                      <p className="text-xs font-medium text-gray-600">
                        {c.selfAssessmentDeadline ? format(new Date(c.selfAssessmentDeadline), "MMM d, yy") : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
                      <p className="text-[9px] font-medium text-gray-400 mb-0.5 uppercase tracking-widest">Final Deadline</p>
                      <p className="text-xs font-medium text-gray-600">
                        {c.managerReviewDeadline ? format(new Date(c.managerReviewDeadline), "MMM d, yy") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/30 px-5 py-3 border-t border-gray-200 flex items-center gap-3">
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="flex-1 rounded-full text-[11px] font-medium gap-2 border-gray-200 hover:bg-white h-8 text-gray-600 hover:border-gray-300 shadow-none"
                    onClick={() => handleInitiate(c.id)}
                    disabled={processingId === c.id}
                  >
                    {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Remind
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="rounded-full h-8 w-8 p-0 text-gray-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
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
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-gray-200 rounded-2xl shadow-none bg-white h-[580px] flex flex-col">
          <DialogHeader className="bg-white border-b p-6 shrink-0 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                  {step === 1 ? <Layers className="w-5 h-5 text-gray-400" /> : <Settings className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-medium text-gray-900">
                    {step === 1 ? "Review Cycle Details" : "Configuration"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 font-normal text-[11px] pt-0.5">
                    Step {step} of 2: {step === 1 ? "Period windows" : "Rules & scale"}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-full border border-gray-200">
                {[1, 2].map((s) => (
                  <div key={s} className={cn("h-1 w-6 rounded-full transition-all", s <= step ? "bg-blue-600" : "bg-gray-200")} />
                ))}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Cycle Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. 2026 Annual Review"
                      className="rounded-lg h-10 border-gray-200 font-normal text-sm focus:border-blue-500 shadow-none bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Status</Label>
                    <div className="flex items-center justify-between h-10 px-3 bg-white border rounded-lg border-gray-200">
                      <span className="text-xs font-medium text-gray-500">{formData.isActive ? "Active" : "Draft"}</span>
                      <Switch 
                        checked={formData.isActive} 
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Period Start *</Label>
                    <DatePicker 
                      value={formData.reviewPeriodStart} 
                      onChange={(date) => setFormData({ ...formData, reviewPeriodStart: date })}
                      placeholder="Start date"
                      allowFutureDates
                      className="rounded-lg h-10 border-gray-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Period End *</Label>
                    <DatePicker 
                      value={formData.reviewPeriodEnd} 
                      onChange={(date) => setFormData({ ...formData, reviewPeriodEnd: date })}
                      placeholder="End date"
                      allowFutureDates
                      className="rounded-lg h-10 border-gray-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Deadlines</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Self</Label>
                      <DatePicker 
                        value={formData.selfAssessmentDeadline} 
                        onChange={(date) => setFormData({ ...formData, selfAssessmentDeadline: date })}
                        placeholder="Date"
                        allowFutureDates
                        className="rounded-lg h-9 border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Peer</Label>
                      <DatePicker 
                        value={formData.peerReviewDeadline} 
                        onChange={(date) => setFormData({ ...formData, peerReviewDeadline: date })}
                        placeholder="Date"
                        allowFutureDates
                        className="rounded-lg h-9 border-gray-200 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Manager</Label>
                      <DatePicker 
                        value={formData.managerReviewDeadline} 
                        onChange={(date) => setFormData({ ...formData, managerReviewDeadline: date })}
                        placeholder="Date"
                        allowFutureDates
                        className="rounded-lg h-9 border-gray-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Review Types</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Self", "Manager", "Peer", "External"].map(type => (
                      <div 
                        key={type} 
                        onClick={() => toggleReviewType(type)}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer shadow-none",
                          formData.availableReviewTypes.includes(type) 
                            ? "border-blue-500 bg-blue-50/20" 
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <span className={cn("text-sm font-medium", formData.availableReviewTypes.includes(type) ? "text-blue-700" : "text-gray-500")}>
                          {type} Review
                        </span>
                        <Checkbox 
                          checked={formData.availableReviewTypes.includes(type)}
                          className="rounded-full border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Rating Scale</Label>
                  <div className="p-3.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between shadow-none">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-gray-300" />
                      <Input
                        value={formData.reviewRatingScale}
                        onChange={(e) => setFormData({ ...formData, reviewRatingScale: e.target.value })}
                        className="bg-transparent border-none shadow-none focus-visible:ring-0 h-8 font-medium text-gray-700 px-0 w-32 text-sm"
                      />
                    </div>
                    <Badge variant="outline" className="text-[9px] font-medium text-gray-400 border-gray-200 tracking-widest uppercase">Integer Only</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t border-gray-200 flex items-center justify-between shrink-0 shadow-none">
            <Button 
              variant="ghost" 
              onClick={() => step === 1 ? setOpen(false) : setStep(1)} 
              className="rounded-full px-6 font-medium text-gray-400 text-xs hover:bg-white border border-transparent hover:border-gray-200"
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
                onClick={handleCreate} 
                disabled={creating} 
                className="rounded-full px-8 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-none font-medium text-xs border border-blue-700"
              >
                {creating ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing...</> : <><Send className="w-3.5 h-3.5 mr-2" /> Create Cycle</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
