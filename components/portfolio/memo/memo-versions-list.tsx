"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Lock, FileText, User, Clock, GitBranch, Paperclip } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchMemoVersionDetail } from "@/lib/store/slices/applicationSlice"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MEMO_SECTIONS } from "./memo-sections-config"
import { cn } from "@/lib/utils"
import type { MemoVersionSummary } from "@/lib/api/investment-memo-api"

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  LOCKED: "bg-blue-100 text-blue-700",
}

// Plain-text sections (dealTerms/recommendation) are edited via a raw Textarea,
// so they must be HTML-escaped before being injected as HTML — unlike rich-text
// sections, whose HTML comes only from Tiptap's own controlled node set.
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

interface MemoVersionsListProps {
  applicationId: string
  versions: MemoVersionSummary[]
  loading: boolean
  currentVersionId: string | null
}

export function MemoVersionsList({ applicationId, versions, loading, currentVersionId }: MemoVersionsListProps) {
  const dispatch = useAppDispatch()
  const { memoVersionDetailById } = useAppSelector((s) => s.application as any)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (versionId: string) => {
    if (expandedId === versionId) {
      setExpandedId(null)
      return
    }
    setExpandedId(versionId)
    if (!memoVersionDetailById[versionId]) {
      dispatch(fetchMemoVersionDetail({ applicationId, versionId }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="flex-1 h-24 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <GitBranch className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">No memo versions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {versions.map((version, idx) => {
        const isLast = idx === versions.length - 1
        const isCurrent = version.id === currentVersionId
        const detail = memoVersionDetailById[version.id]
        const isExpanded = expandedId === version.id
        return (
          <div key={version.id} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                {version.versionStatus === "LOCKED" ? <Lock className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-white" />}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-purple-200 to-gray-100 my-2 min-h-[32px]" />}
            </div>

            <div className={cn("flex-1 min-w-0", isLast ? "" : "mb-4")}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-gray-900 leading-snug">v{version.versionNumber}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[version.versionStatus] ?? "bg-gray-100 text-gray-600")}>
                        {version.versionStatus}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Current
                        </span>
                      )}
                      {version.attachmentFileName && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          <Paperclip className="w-2.5 h-2.5" /> {version.attachmentFileName}
                        </span>
                      )}
                    </div>
                    {version.changeSummary && <p className="text-xs text-gray-500 mt-1.5">{version.changeSummary}</p>}
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="h-8 rounded-full text-xs gap-1.5 bg-white border-purple-200 text-purple-600 hover:bg-purple-50 shrink-0"
                    onClick={() => toggleExpand(version.id)}
                  >
                    {isExpanded ? "Hide" : "View"} sections
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: User, label: "Created By", value: version.createdBy ? `${version.createdBy.firstName} ${version.createdBy.lastName}` : "—" },
                    { icon: Clock, label: "Created At", value: format(new Date(version.createdAt), "MMM d, yyyy HH:mm") },
                    ...(version.submittedAt ? [{ icon: Clock, label: "Submitted At", value: format(new Date(version.submittedAt), "MMM d, yyyy HH:mm") }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {!detail ? (
                      <Skeleton className="h-24 w-full rounded-lg" />
                    ) : (
                      MEMO_SECTIONS.map((section) => {
                        const value = detail.sections?.[section.key]
                        if (!value) return null
                        return (
                          <div key={section.key}>
                            <p className="text-xs font-semibold text-gray-600 mb-1">{section.label}</p>
                            <div
                              className="text-sm text-gray-700 prose prose-sm max-w-none bg-gray-50/60 rounded-lg px-3 py-2"
                              dangerouslySetInnerHTML={{ __html: section.richText ? value : escapeHtml(value).replace(/\n/g, "<br/>") }}
                            />
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
