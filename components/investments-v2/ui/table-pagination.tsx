'use client'

import { cn } from '@/lib/utils'

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  rowsShown,
  totalRows,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  rowsShown: number
  totalRows: number
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
        Showing {rowsShown} out of {totalRows} results
      </span>
      <div className="flex items-center gap-1">
        <button className="pg-btn" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPageChange(p)} className={cn('pg-btn', page === p && 'active')}>
            {p}
          </button>
        ))}
        <button className="pg-btn" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          ›
        </button>
      </div>
    </div>
  )
}
