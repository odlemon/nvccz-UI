"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StreetRatesDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>

      {/* Hero */}
      <Skeleton className="h-72 w-full rounded-3xl" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white border border-gray-200">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <Skeleton className="h-72 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Comparison panel */}
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-48 flex-1 rounded-2xl" />
        <Skeleton className="h-48 flex-1 rounded-2xl" />
      </div>
    </div>
  )
}
