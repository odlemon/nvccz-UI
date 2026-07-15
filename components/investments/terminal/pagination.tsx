"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TerminalPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function TerminalPagination({ page, totalPages, onPageChange, className }: TerminalPaginationProps) {
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      {pageNumbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
            page === n ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}
