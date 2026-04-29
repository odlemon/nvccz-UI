"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Calendar, BarChart3, Plus, Loader2, UserCheck, Search, Filter } from "lucide-react"
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
  const [creatingReview, setCreatingReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    cycleId: ""
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
    setCreatingReview(true)
    try {
      await apiClient.post("/performance-reviews", {
        revieweeId: reviewForm.employeeId,
        cycleId: reviewForm.cycleId === "none" ? null : reviewForm.cycleId
      })
      toast.success("Performance review created")
      setShowCreateReview(false)
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
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-semibold"
              >
                <ClipboardList className="w-4 h-4" />
                Reviews
                {myReviews.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700">
                    {myReviews.length}
                  </Badge>
                )}
              </TabsTrigger>

              {permissions.canCreateReviewCycle && (
                <>
                  <TabsTrigger 
                    value="cycles" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-semibold"
                  >
                    <Calendar className="w-4 h-4" />
                    Cycles
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="reports" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-1 gap-2 text-sm font-semibold"
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
                className="rounded-full bg-blue-600 hover:bg-blue-700 gap-2 h-10 px-6 mb-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> New Review
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

      <Dialog open={showCreateReview} onOpenChange={setShowCreateReview}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-gray-200 rounded-2xl shadow-xl">
          <DialogHeader className="bg-white border-b p-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>Create New Review</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-normal pt-1">
              Manually assign a performance review to an employee.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Select Employee *</Label>
              <Select onValueChange={(val) => setReviewForm({ ...reviewForm, employeeId: val })}>
                <SelectTrigger className="rounded-lg h-11 border-gray-300 font-normal">
                  <SelectValue placeholder="Search or select employee..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-gray-100">
                  <SelectItem value="cml7spmbr000ckt1bcwq6pd8o">Nyasha K (Finance)</SelectItem>
                  <SelectItem value="cmislgonq0001unfkpukqyiah">Admin User (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Target Cycle (Optional)</Label>
              <Select onValueChange={(val) => setReviewForm({ ...reviewForm, cycleId: val })}>
                <SelectTrigger className="rounded-lg h-11 border-gray-300 font-normal">
                  <SelectValue placeholder="No cycle assigned" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-gray-100">
                  <SelectItem value="none">Standalone (No Cycle)</SelectItem>
                  {cycles.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateReview(false)} 
              className="rounded-full px-6 font-medium text-gray-600 border-gray-300 h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReview} 
              disabled={creatingReview} 
              className="rounded-full px-8 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all font-semibold"
            >
              {creatingReview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
