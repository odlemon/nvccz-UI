"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Full-page placeholder while a different budget cycle is loading. */
export function WorkflowPageSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200" aria-busy="true" aria-label="Loading cycle">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-6 rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-5">
          <div className="flex justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
              <Skeleton className="h-7 w-3/4 max-w-md bg-[#e2e8f0]" />
              <Skeleton className="h-8 w-48 bg-[#e2e8f0] rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 bg-[#e2e8f0] rounded-lg" />
              <Skeleton className="h-9 w-9 bg-[#e2e8f0] rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-8 w-8 rounded-full bg-[#e2e8f0]" />
                <Skeleton className="h-3 w-16 bg-[#e2e8f0]" />
                <Skeleton className="h-2.5 w-20 bg-[#e2e8f0]" />
              </div>
            ))}
          </div>
        </div>
        <div className="xl:col-span-3 rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-4">
          <Skeleton className="h-4 w-28 bg-[#e2e8f0]" />
          <div className="flex gap-4 pt-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-9 w-14 bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
            </div>
            <Skeleton className="w-px h-16 bg-[#e2e8f0]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-9 w-10 bg-[#e2e8f0]" />
              <Skeleton className="h-3 w-20 bg-[#e2e8f0]" />
            </div>
          </div>
          <Skeleton className="h-3 w-28 bg-[#e2e8f0] mt-6" />
        </div>
        <div className="xl:col-span-3 rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32 bg-[#e2e8f0]" />
            <Skeleton className="h-3 w-14 bg-[#e2e8f0]" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full bg-[#e2e8f0]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24 bg-[#e2e8f0]" />
                <Skeleton className="h-2.5 w-16 bg-[#e2e8f0]" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-[#e2e8f0]" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
        <Skeleton className="h-9 w-full max-w-lg bg-[#e2e8f0] rounded-full" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-6 rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3">
          <Skeleton className="h-5 w-36 bg-[#e2e8f0]" />
          <Skeleton className="h-8 w-full bg-[#e2e8f0] rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-[#e2e8f0]" />
          ))}
        </div>
        <div className="xl:col-span-3 space-y-3">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-40 bg-[#e2e8f0]" />
            <Skeleton className="h-24 w-full bg-[#e2e8f0]" />
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-36 bg-[#e2e8f0]" />
            <Skeleton className="h-32 w-full bg-[#e2e8f0]" />
          </div>
        </div>
        <div className="xl:col-span-3 rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3 min-h-[420px]">
          <Skeleton className="h-5 w-48 bg-[#e2e8f0]" />
          <Skeleton className="h-4 w-24 bg-[#e2e8f0]" />
          <Skeleton className="h-28 w-full bg-[#e2e8f0]" />
          <Skeleton className="h-20 w-full bg-[#e2e8f0]" />
        </div>
      </div>
    </div>
  )
}
