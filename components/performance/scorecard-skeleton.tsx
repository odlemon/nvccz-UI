import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ScorecardSkeletonProps {
  type: "department" | "user"
}

export function ScorecardSkeleton({ type }: ScorecardSkeletonProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            {type === "user" && <Skeleton className="h-6 w-20 rounded-full" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>

        {/* Performance Distribution/Activity Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
        </div>

        {/* Company Ranking/Review Score */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Action Button */}
        <Skeleton className="w-full h-10 rounded-md" />
      </CardContent>
    </Card>
  )
}

export function ScorecardGridSkeleton({ type, count = 6 }: { type: "department" | "user", count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ScorecardSkeleton key={index} type={type} />
      ))}
    </div>
  )
}
