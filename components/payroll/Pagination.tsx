"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])
  return { page, setPage, totalPages, current }
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
      <div className="flex gap-2">
        <Button disabled={page === 1} onClick={() => onChange(page - 1)} variant="outline" className="rounded-full">Prev</Button>
        <Button disabled={page === totalPages} onClick={() => onChange(page + 1)} className="rounded-full">Next</Button>
      </div>
    </div>
  )
}


