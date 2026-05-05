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
import { ReviewCreateDialog } from "./review-create-dialog"
import { cn } from "@/lib/utils"

export function ReviewsManagement() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const { permissions } = usePerformancePermissions()
  const { myReviews } = useAppSelector((s) => s.performanceReviews)
  const [activeTab, setActiveTab] = useState(tabParam || "reviews")
  
  const [showCreateReview, setShowCreateReview] = useState(false)

  useEffect(() => {
    dispatch(fetchMyReviews())
    if (permissions.canCreateReviewCycle || permissions.canPerformAction("view-all-performance-reviews")) {
      dispatch(fetchReviewCycles())
    }
  }, [dispatch, permissions])

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

      <ReviewCreateDialog 
        open={showCreateReview} 
        onOpenChange={setShowCreateReview} 
      />
    </div>
  )
}

