'use client'

import { cn } from '@/lib/utils'

/** Dark-surface pulse bar for Investments V2 (not the light-gray shadcn default). */
export function OpsSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-white/[0.07]', className)}
      {...props}
    />
  )
}

/** KPI / metric strip placeholders. */
export function OpsKpiSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.05] bg-[#09111d]/70 px-4 py-3"
        >
          <OpsSkeleton className="h-2.5 w-16" />
          <OpsSkeleton className="mt-3 h-5 w-24" />
          <OpsSkeleton className="mt-2 h-2 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Table body skeleton — use inside `<tbody>` or as a block under a table header. */
export function OpsTableSkeleton({
  rows = 6,
  cols = 6,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('w-full space-y-2 p-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <OpsSkeleton
              key={c}
              className={cn('h-3.5 flex-1', c === 0 && 'max-w-[140px]', c === cols - 1 && 'max-w-[72px]')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Full-width table loading panel with optional header chrome. */
export function OpsTablePanelSkeleton({
  rows = 8,
  cols = 7,
  showToolbar = true,
  className,
}: {
  rows?: number
  cols?: number
  showToolbar?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border border-white/[0.04] bg-[linear-gradient(145deg,#142030,#0d1623)]',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <OpsSkeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <OpsSkeleton className="h-8 w-40 rounded-full" />
            <OpsSkeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
      )}
      <OpsTableSkeleton rows={rows} cols={cols} className="px-4 py-4" />
    </div>
  )
}

/** Card grid placeholders (blotters, portfolios, etc.). */
export function OpsCardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[16px] border border-white/[0.07] bg-[#070d17] p-3">
          <div className="flex justify-between">
            <OpsSkeleton className="h-3.5 w-28" />
            <OpsSkeleton className="h-5 w-14 rounded-full" />
          </div>
          <OpsSkeleton className="mt-4 h-2.5 w-40" />
          <OpsSkeleton className="mt-2 h-2.5 w-24" />
        </div>
      ))}
    </div>
  )
}

/** Right-hand detail / drawer panel skeleton. */
export function OpsPanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)} role="status" aria-label="Loading">
      <OpsSkeleton className="h-3 w-24" />
      <OpsSkeleton className="h-5 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[16px] bg-white/[0.035] p-3">
            <OpsSkeleton className="h-2 w-14" />
            <OpsSkeleton className="mt-2 h-3.5 w-20" />
          </div>
        ))}
      </div>
      <OpsSkeleton className="h-24 w-full rounded-2xl" />
      <OpsSkeleton className="h-9 w-full rounded-full" />
    </div>
  )
}

/** Compact inline list skeleton (timeline, comments, attachments). */
export function OpsListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <OpsSkeleton className="h-3 w-[66%] max-w-[200px]" />
          <OpsSkeleton className="h-2.5 w-full" />
          <OpsSkeleton className="h-2.5 w-1/2 max-w-[140px]" />
        </div>
      ))}
    </div>
  )
}

/** Page-level body: KPIs + main table. */
export function OpsPageSkeleton({
  kpis = 4,
  tableRows = 8,
  tableCols = 7,
  className,
}: {
  kpis?: number
  tableRows?: number
  tableCols?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading page">
      <OpsKpiSkeleton count={kpis} />
      <OpsTablePanelSkeleton rows={tableRows} cols={tableCols} />
    </div>
  )
}

/** Recon-themed skeleton (uses CSS vars / muted surfaces used on cash recon pages). */
export function ReconTableSkeleton({
  rows = 7,
  cols = 6,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2 p-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn(
                'h-3.5 flex-1 animate-pulse rounded-md bg-white/[0.06]',
                c === 0 && 'max-w-[100px]',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
