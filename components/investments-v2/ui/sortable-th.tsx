'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SortableTh<K extends string>({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
}: {
  col: K
  label: string
  sortKey: K
  sortDir: 'asc' | 'desc'
  onSort: (key: K) => void
  align?: 'left' | 'right'
}) {
  const active = sortKey === col
  return (
    <th className={align === 'right' ? 'text-right' : undefined}>
      <button className={cn('flex items-center gap-1', align === 'right' && 'ml-auto')} onClick={() => onSort(col)}>
        {label}
        {active ? (
          sortDir === 'desc' ? (
            <ChevronDown className="w-2.5 h-2.5" style={{ color: 'var(--primary)' }} />
          ) : (
            <ChevronUp className="w-2.5 h-2.5" style={{ color: 'var(--primary)' }} />
          )
        ) : (
          <ChevronDown className="w-2.5 h-2.5 opacity-30" />
        )}
      </button>
    </th>
  )
}
