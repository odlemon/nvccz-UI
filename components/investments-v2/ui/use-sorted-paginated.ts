'use client'

import { useEffect, useMemo, useState } from 'react'

export function useSortedPaginated<T, K extends string>(
  rows: T[],
  getSortValue: (row: T, key: K) => string | number,
  defaultSortKey: K,
  pageSize = 12
) {
  const [sortKey, setSortKey] = useState<K>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' || typeof vb === 'string') {
        return dir * String(va).localeCompare(String(vb))
      }
      return dir * ((va as number) - (vb as number))
    })
  }, [rows, sortKey, sortDir, getSortValue])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const clampedPage = Math.min(page, totalPages)
  const pageRows = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)

  const toggleSort = (key: K) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  return {
    sorted,
    pageRows,
    sortKey,
    sortDir,
    toggleSort,
    page: clampedPage,
    setPage,
    totalPages,
    totalRows: sorted.length,
  }
}
