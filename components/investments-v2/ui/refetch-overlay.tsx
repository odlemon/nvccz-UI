'use client'

import { OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { cn } from '@/lib/utils'

/** Semi-transparent skeleton overlay for table/card regions during filter refetch. */
export function RefetchOverlay({
  active,
  rows = 6,
  cols = 6,
  className,
}: {
  active: boolean
  rows?: number
  cols?: number
  className?: string
}) {
  if (!active) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-start justify-center bg-[#05090f]/60 backdrop-blur-[1px]',
        className,
      )}
      role="status"
      aria-label="Refreshing"
    >
      <div className="w-full pt-2">
        <OpsTableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  )
}
