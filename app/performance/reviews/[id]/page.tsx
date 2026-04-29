"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"
import { ReviewForm } from "@/components/performance/reviews/review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/performance/reviews")}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Review Details</h1>
          </div>
          <ReviewForm reviewId={id} />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
