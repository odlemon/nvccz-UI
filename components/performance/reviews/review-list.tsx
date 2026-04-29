"use client"

import { useAppSelector } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, ClipboardList, Loader2, Lock, User, Target, Layers } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { ReviewSummary } from "@/lib/api/performance-reviews-api"
import { cn } from "@/lib/utils"

const STAGE_COLORS: Record<string, string> = {
  SELF_REVIEW: "text-blue-600 border-blue-200 bg-blue-50/30",
  PEER_REVIEW: "text-purple-600 border-purple-200 bg-purple-50/30",
  HR_REVIEW: "text-pink-600 border-pink-200 bg-pink-50/30",
  MANAGER_REVIEW: "text-orange-600 border-orange-200 bg-orange-50/30",
  FINAL_REVIEW: "text-amber-600 border-amber-200 bg-amber-50/30",
  FINALIZED: "text-green-600 border-green-200 bg-green-50/30",
  DRAFT: "text-gray-600 border-gray-200 bg-gray-50/30",
}

const STAGE_LABELS: Record<string, string> = {
  SELF_REVIEW: "Self-Review",
  PEER_REVIEW: "External Evaluation",
  HR_REVIEW: "HR Moderation",
  MANAGER_REVIEW: "Manager Review",
  FINAL_REVIEW: "Finalizing",
  FINALIZED: "Finalized",
  DRAFT: "Draft",
}

function ReviewRow({
  review,
  onOpen,
}: {
  review: ReviewSummary
  onOpen: () => void
}) {
  const employeeName = review.reviewee 
    ? `${review.reviewee.firstName} ${review.reviewee.lastName}`
    : review.employeeName || "Employee"

  const reviewerName = review.reviewer
    ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
    : review.managerName || "Assigned Manager"

  return (
    <div 
      className="flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 transition-all duration-200 cursor-pointer group shadow-none"
      onClick={onOpen}
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors border border-gray-200 group-hover:border-blue-200">
        <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-900 text-base leading-none tracking-tight">
            {review.title || review.cycleTitle || "Performance Review"}
          </p>
          <Badge variant="outline" className={cn("text-[10px] uppercase font-medium tracking-widest px-2 py-0 border-2", STAGE_COLORS[review.stage] || STAGE_COLORS[review.status] || "border-gray-200 text-gray-600")}>
            {STAGE_LABELS[review.stage] || STAGE_LABELS[review.status] || review.stage || review.status}
          </Badge>
          {review.isLocked && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
               <Lock className="w-3 h-3 text-gray-400" />
               <span className="text-[10px] font-medium text-gray-500 uppercase">Locked</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-y-1 gap-x-6 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {employeeName}
            {review.reviewee?.userDepartment && (
              <span className="text-gray-400 font-normal">({review.reviewee.userDepartment})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 font-normal">Reviewer:</span>
            <span className="text-gray-600 font-medium">{reviewerName}</span>
          </div>

          {review.reviewPeriod && (
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 font-normal">Period:</span>
              <span className="text-gray-600 font-medium">{review.reviewPeriod}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
         {review.overallScore && (
           <div className="text-right">
             <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Score</p>
             <p className="text-xl font-medium text-blue-600">{review.overallScore}</p>
           </div>
         )}
         <Button variant="ghost" size="icon" className="rounded-full text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all border border-transparent group-hover:border-blue-100">
           <ChevronRight className="w-6 h-6" />
         </Button>
      </div>
    </div>
  )
}

interface ReviewListProps {
  type: "my" | "todo"
}

export function ReviewList({ type }: ReviewListProps) {
  const router = useRouter()
  const { myReviews, reviewsToComplete, loading } = useAppSelector(
    (s) => s.performanceReviews
  )

  const reviews = type === "my" ? myReviews : reviewsToComplete

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-none">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Loading Reviews...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center px-4 shadow-none">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-200">
          <ClipboardList className="w-8 h-8 text-gray-200" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 tracking-tight">No Reviews Found</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed font-normal">
          {type === "my" 
            ? "Your performance history is clear. You'll see reviews here once they are initiated." 
            : "All caught up! There are no pending reviews requiring your feedback."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewRow
          key={r.id}
          review={r}
          onOpen={() => router.push(`/performance/reviews/${r.id}`)}
        />
      ))}
    </div>
  )
}
