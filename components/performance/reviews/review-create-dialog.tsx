"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/api-client"
import { fetchMyReviews, fetchReviewCycles } from "@/lib/store/slices/performanceReviewsSlice"
import { usersApi, AppUser } from "@/lib/api/users-api"

interface ReviewCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReviewCreateDialog({ open, onOpenChange }: ReviewCreateDialogProps) {
  const dispatch = useAppDispatch()
  const { cycles } = useAppSelector((s) => s.performanceReviews)
  
  const [step, setStep] = useState(1)
  const [creatingReview, setCreatingReview] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    cycleId: "",
    reviewType: "ANNUAL",
    reviewPeriod: "2026",
    strengths: "",
    areasForImprovement: "",
    achievements: "",
    goals: "",
    selfFeedback: "",
    managerFeedback: ""
  })

  useEffect(() => {
    if (open) {
      loadUsers()
      dispatch(fetchReviewCycles())
    } else {
      setStep(1)
      setForm({
        employeeId: "",
        title: "",
        cycleId: "",
        reviewType: "ANNUAL",
        reviewPeriod: "2026",
        strengths: "",
        areasForImprovement: "",
        achievements: "",
        goals: "",
        selfFeedback: "",
        managerFeedback: ""
      })
    }
  }, [open, dispatch])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res: any = await usersApi.getAll()
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      setUsers(list)
    } catch (e) {
      console.error("Failed to load users", e)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleCreateReview = async () => {
    if (!form.employeeId) {
      toast.error("Please select an employee")
      return
    }
    setCreatingReview(true)
    try {
      await apiClient.post("/performance-reviews", {
        revieweeId: form.employeeId,
        title: form.title,
        reviewType: form.reviewType,
        reviewPeriod: form.reviewPeriod,
        cycleId: form.cycleId === "none" ? null : form.cycleId,
        strengths: form.strengths,
        areasForImprovement: form.areasForImprovement,
        achievements: form.achievements,
        goals: form.goals,
        selfFeedback: form.selfFeedback,
        managerFeedback: form.managerFeedback
      })
      toast.success("Performance review created")
      onOpenChange(false)
      dispatch(fetchMyReviews())
    } catch (e: any) {
      toast.error("Failed to create review", { description: e?.response?.data?.message || e?.message })
    } finally {
      setCreatingReview(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Initialize Review (Step 1/2)" : "Feedback & Goals (Step 2/2)"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Select the employee and review cycle to begin." 
              : "Provide initial qualitative feedback and set goals for this period."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Review Title *</Label>
                <Input 
                  placeholder="e.g. Annual Review 2026 - Finance Dept"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select value={form.employeeId || undefined} onValueChange={(val) => setForm({ ...form, employeeId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder={usersLoading ? "Loading..." : "Select employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} {u.userDepartment ? `(${u.userDepartment})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Review Type *</Label>
                  <Select value={form.reviewType} onValueChange={(val) => setForm({ ...form, reviewType: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUAL">Annual Review</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly Review</SelectItem>
                      <SelectItem value="PROBATIONARY">Probationary Review</SelectItem>
                      <SelectItem value="PROJECT_BASED">Project Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Review Period *</Label>
                  <Select value={form.reviewPeriod} onValueChange={(val) => setForm({ ...form, reviewPeriod: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Target Cycle (Optional)</Label>
                  <Select value={form.cycleId || "none"} onValueChange={(val) => setForm({ ...form, cycleId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone (No Cycle)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standalone (No Cycle)</SelectItem>
                      {cycles.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Achievements</Label>
                  <Textarea 
                    placeholder="List key successes..."
                    className="min-h-[100px]"
                    value={form.achievements}
                    onChange={(e) => setForm({...form, achievements: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Strengths</Label>
                  <Textarea 
                    placeholder="List core strengths..."
                    className="min-h-[100px]"
                    value={form.strengths}
                    onChange={(e) => setForm({...form, strengths: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Areas for Improvement</Label>
                  <Textarea 
                    placeholder="Identify areas for growth..."
                    className="min-h-[100px]"
                    value={form.areasForImprovement}
                    onChange={(e) => setForm({...form, areasForImprovement: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goals</Label>
                  <Textarea 
                    placeholder="Set objectives for the next period..."
                    className="min-h-[100px]"
                    value={form.goals}
                    onChange={(e) => setForm({...form, goals: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Manager Feedback</Label>
                <Textarea 
                  placeholder="Provide overall feedback..."
                  className="min-h-[120px]"
                  value={form.managerFeedback}
                  onChange={(e) => setForm({...form, managerFeedback: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => step === 1 ? onOpenChange(false) : setStep(1)} 
            className="rounded-full"
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          {step === 1 ? (
            <Button 
              onClick={() => {
                if (!form.employeeId) return toast.error("Select an employee first")
                setStep(2)
              }} 
              className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Next Step
            </Button>
          ) : (
            <Button 
              onClick={handleCreateReview} 
              disabled={creatingReview} 
              className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {creatingReview ? "Creating..." : "Create Review"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
