import { Skeleton } from "@/components/ui/skeleton"

// Exchange Rates Ticker Skeleton
export function ExchangeRatesTickerSkeleton() {
  return (
    <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-100">
      {/* Title skeleton */}
      <div className="px-6 py-2 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-1">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
      
      {/* Ticker content skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/60 to-indigo-50/60 py-3">
        <div className="flex gap-12 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Skeleton className="w-7 h-7 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Market Data Card Skeleton
export function MarketDataCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-full mt-3" />
    </div>
  )
}

// Article Card Skeleton
export function ArticleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab Content Skeleton
export function TabContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Market Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <MarketDataCardSkeleton key={index} />
        ))}
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ZSE Data Skeleton
export function ZSEDataSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Task Management Skeleton
export function TaskManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-full">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Task Board Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, stageIndex) => (
            <div key={stageIndex} className="space-y-4">
              {/* Stage Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </div>

              {/* Stage Column */}
              <div className="min-h-[400px] p-3 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, taskIndex) => (
                    <div key={taskIndex} className="bg-white rounded-lg border p-4">
                      <div className="space-y-3">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-2" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-16 rounded-full" />
                              <Skeleton className="h-5 w-12 rounded-full" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-6" />
                        </div>

                        {/* Task Description */}
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />

                        {/* Task Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>

                        {/* Team Members */}
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1">
                            {Array.from({ length: 3 }).map((_, memberIndex) => (
                              <Skeleton key={memberIndex} className="h-6 w-6 rounded-full" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Task List Skeleton (for list view loading)
export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters row skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-[240px]" />
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-10 w-[150px]" />
        ))}
      </div>

      {/* List items skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, a) => (
                  <Skeleton key={a} className="h-8 w-8 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}