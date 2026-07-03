"use client"

import { cn } from "@/lib/utils"
import { MEMO_SECTIONS, isSectionFilled, type SectionKey } from "./memo-sections-config"
import type { MemoSections } from "@/lib/api/investment-memo-api"
import { CheckSquare, Square } from "lucide-react"

interface MemoSectionNavProps {
  sections: MemoSections | null
  activeKey: SectionKey
  onSelect: (key: SectionKey) => void
}

export function MemoSectionNav({ sections, activeKey, onSelect }: MemoSectionNavProps) {
  return (
    <nav className="w-56 shrink-0 border-r border-gray-100 pr-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 px-2 mb-2">Sections</p>
      {MEMO_SECTIONS.map((section) => {
        const filled = isSectionFilled(sections?.[section.key] as string | undefined)
        const active = activeKey === section.key
        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onSelect(section.key)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors",
              active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {filled ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            )}
            <span className="truncate">{section.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
