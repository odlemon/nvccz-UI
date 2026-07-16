"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const CARD =
  "rounded-lg border border-[#e4e7ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"

export function PlanningKpiStripSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#e4e7ec] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#eaecf0] bg-[#f9fafb] px-3 py-2.5 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-16 bg-[#e2e8f0]" />
            </div>
            <Skeleton className="h-6 w-20 bg-[#e2e8f0]" />
            <Skeleton className="h-8 w-full rounded-md bg-[#e2e8f0]" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-28 bg-[#e2e8f0]" />
        <Skeleton className="h-8 w-36 rounded-full bg-[#e2e8f0]" />
      </div>
    </div>
  )
}

function GridTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden px-2 py-2">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[200px_repeat(6,1fr)] gap-2 border-b border-[#eaecf0] px-2 py-2">
          <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12 mx-auto bg-[#e2e8f0]" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-[200px_repeat(6,1fr)] gap-2 border-b border-[#f2f4f7] px-2 py-2.5"
          >
            <Skeleton
              className="h-3.5 bg-[#e2e8f0]"
              style={{ width: `${55 + (row % 4) * 12}%` }}
            />
            {Array.from({ length: 6 }).map((_, col) => (
              <Skeleton key={col} className="h-3.5 w-14 ml-auto bg-[#e2e8f0]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlanningGridSkeleton({
  className,
  /** When true, only the table body (for use inside an existing Planning Grid card). */
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className={cn("min-h-[280px]", className)}>
        <GridTableSkeleton />
      </div>
    )
  }
  return (
    <div className={cn(CARD, "overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 bg-[#e2e8f0]" />
          <Skeleton className="h-3 w-48 bg-[#e2e8f0]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full bg-[#e2e8f0]" />
          ))}
        </div>
      </div>
      <GridTableSkeleton />
    </div>
  )
}

export function PlanningInsightsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className={cn(CARD, "p-4 space-y-3")}>
            <Skeleton className="h-4 w-40 bg-[#e2e8f0]" />
            <Skeleton className="h-[140px] w-full rounded-lg bg-[#e2e8f0]" />
            <Skeleton className="h-3 w-56 bg-[#e2e8f0]" />
          </div>
        ))}
      </div>
      <div className={cn(CARD, "px-4 py-3")}>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 min-w-[140px]">
              <Skeleton className="h-6 w-6 rounded-full bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PlanningCollabSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#eaecf0] bg-white shadow-sm flex flex-col min-h-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-5 border-b border-[#eaecf0] px-4 h-11 shrink-0">
        <Skeleton className="h-3 w-16 bg-[#e2e8f0]" />
        <Skeleton className="h-3 w-12 bg-[#e2e8f0]" />
        <Skeleton className="h-3 w-14 bg-[#e2e8f0]" />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 space-y-4">
        <Skeleton className="h-10 w-full rounded-[10px] bg-[#e2e8f0]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-[#e2e8f0]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-28 bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-full bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-[75%] bg-[#e2e8f0]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlanningTasksCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden shrink-0",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaecf0]">
        <Skeleton className="h-4 w-14 bg-[#e2e8f0]" />
        <Skeleton className="h-3 w-16 bg-[#e2e8f0]" />
      </div>
      <div className="px-4 py-2 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-1">
            <Skeleton className="mt-0.5 h-[18px] w-[18px] rounded-full bg-[#e2e8f0]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40 bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
            </div>
            <Skeleton className="h-3 w-10 bg-[#e2e8f0]" />
          </div>
        ))}
      </div>
    </section>
  )
}

/** Full left+right planning shell while the primary worksheet load runs. */
export function PlanningWorksheetBodySkeleton() {
  return (
    <div className="space-y-3">
      <PlanningKpiStripSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-9 space-y-3 min-w-0">
          <PlanningGridSkeleton />
          <PlanningInsightsSkeleton />
        </div>
        <div
          className="lg:col-span-3 flex flex-col gap-3 min-h-[480px]"
          style={{ height: "calc(100vh - 6.5rem)" }}
        >
          <PlanningCollabSkeleton className="flex-1 min-h-0" />
          <PlanningTasksCardSkeleton />
        </div>
      </div>
    </div>
  )
}
