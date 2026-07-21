'use client'

import { cn } from '@/lib/utils'

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  rowsShown,
  totalRows,
  pageSize,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  rowsShown: number
  totalRows: number
  pageSize?: number
}) {
  if (totalRows === 0) return null

  const start = (page - 1) * (pageSize ?? rowsShown) + 1
  const end = Math.min(page * (pageSize ?? rowsShown), totalRows)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5">
      <span className="text-[11px] text-muted-foreground">
        {totalRows <= rowsShown && totalPages <= 1
          ? `Showing ${totalRows} result${totalRows === 1 ? '' : 's'}`
          : `Showing ${start}–${end} of ${totalRows}`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="pg-btn"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn('pg-btn', page === p && 'active')}
              aria-label={`Page ${p}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="pg-btn"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
