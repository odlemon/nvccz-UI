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
  SELF_REVIEW: "bg-blue-50 text-blue-700 border-blue-100",
  PEER_REVIEW: "bg-purple-50 text-purple-700 border-purple-100",
  HR_REVIEW: "bg-pink-50 text-pink-700 border-pink-100",
  MANAGER_REVIEW: "bg-orange-50 text-orange-700 border-orange-100",
  FINAL_REVIEW: "bg-amber-50 text-amber-700 border-amber-100",
  FINALIZED: "bg-green-50 text-green-700 border-green-100",
  DRAFT: "bg-gray-50 text-gray-700 border-gray-100",
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
      className="flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden"
      onClick={onOpen}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors shadow-sm">
        <ClipboardList className="w-6 h-6 text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-gray-900 text-lg leading-none tracking-tight">
            {review.title || review.cycleTitle || "Performance Review"}
          </p>
          <Badge variant="outline" className={cn("text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5", STAGE_COLORS[review.stage] || STAGE_COLORS[review.status] || "bg-gray-50 text-gray-600")}>
            {STAGE_LABELS[review.stage] || STAGE_LABELS[review.status] || review.stage || review.status}
          </Badge>
          {review.isLocked && (
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-y-1 gap-x-6 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <User className="w-3.5 h-3.5 text-blue-500" />
            {employeeName}
            {review.reviewee?.userDepartment && (
              <span className="text-gray-400 font-normal">({review.reviewee.userDepartment})</span>
            )}
          </div>

          <div className="flex items-center gap-2 font-medium">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-gray-600">Reviewer:</span>
            <span className="text-gray-500">{reviewerName}</span>
          </div>

          {review.reviewPeriod && (
            <div className="flex items-center gap-2 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-gray-600">Period:</span>
              <span className="text-gray-500">{review.reviewPeriod}</span>
            </div>
          )}

          {review.dueDate && (
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span className="text-gray-600">Due:</span>
              <span className="text-gray-500">{format(new Date(review.dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
         {review.overallScore && (
           <div className="text-right">
             <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Score</p>
             <p className="text-lg font-bold text-blue-600">{review.overallScore}</p>
           </div>
         )}
         <Button variant="ghost" size="icon" className="rounded-full text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
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
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 text-sm font-medium">Syncing reviews...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 border border-gray-100">
          <ClipboardList className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Found</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto font-normal leading-relaxed">
          {type === "my" 
            ? "Your performance history is clear. You'll see reviews here once they are initiated by HR or your manager." 
            : "All caught up! There are no pending reviews requiring your feedback at this time."}
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
