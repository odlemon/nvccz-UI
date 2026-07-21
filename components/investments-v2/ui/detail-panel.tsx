'use client'

import { cn } from '@/lib/utils'

/** Side detail drawer — z-index above shared top nav (z-50). */
export function DetailPanel({
  open,
  onClose,
  children,
  className,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  width?: string
}) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close detail panel"
        className="fixed inset-0 z-[90] cursor-default bg-black/50 dark:bg-black/55"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[100] w-full overflow-y-auto border-l border-white/10 bg-[#09111e] p-5 shadow-2xl',
          width,
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}
