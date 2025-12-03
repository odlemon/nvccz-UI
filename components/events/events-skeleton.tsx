import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function EventsDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className={`border border-gray-200 ${i % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className={`h-4 w-32 ${i % 2 === 0 ? 'bg-white/20' : 'bg-gray-200'}`} />
                <Skeleton className={`h-8 w-8 rounded-full ${i % 2 === 0 ? 'bg-white/20' : 'bg-gray-200'}`} />
              </div>
              <Skeleton className={`h-12 w-24 mb-2 ${i % 2 === 0 ? 'bg-white/20' : 'bg-gray-200'}`} />
              <Skeleton className={`h-4 w-20 ${i % 2 === 0 ? 'bg-white/20' : 'bg-gray-200'}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="border border-gray-200 rounded-2xl p-6 gradient-primary">
        <Skeleton className="h-6 w-48 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-64 mb-4 bg-white/20" />
        <Skeleton className="h-[300px] w-full bg-white/10" />
      </Card>

      {/* Upcoming Events Skeleton */}
      <Card className="rounded-2xl border border-gray-200 bg-white">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function EventsListSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="flex-1 h-10" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      {/* Events List Skeleton */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
            <div className="mb-4">
              <Skeleton className="h-2 w-full mb-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function EventDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-96" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-5 w-[600px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Quick Info Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full">
        <div className="border-b mb-6">
          <div className="flex space-x-1">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-32 rounded-t-lg" />
            ))}
          </div>
        </div>

        {/* Tab Content Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
