"use client"

import { Download, Filter, RefreshCw, Search, X } from "lucide-react"
import type { WorkflowTab } from "@/components/fpa/workflow/workflow-utils"
import { cn } from "@/lib/utils"

const TABS: WorkflowTab[] = ["All", "My Tasks", "Pending Review", "Returned"]

function tabLabel(t: WorkflowTab, counts: Record<WorkflowTab, number>) {
  if (t === "All") return `All Tasks (${counts.All})`
  if (t === "My Tasks") return `My Tasks (${counts["My Tasks"]})`
  if (t === "Pending Review") return `Pending Review (${counts["Pending Review"]})`
  return `Returned (${counts.Returned})`
}

export function WorkflowTasksToolbar({
  tab,
  onTabChange,
  counts,
  search,
  onSearch,
  department,
  onDepartment,
  status,
  onStatus,
  priority,
  onPriority,
  departments,
  onExport,
  onRefresh,
  refreshing,
}: {
  tab: WorkflowTab
  onTabChange: (t: WorkflowTab) => void
  counts: Record<WorkflowTab, number>
  search: string
  onSearch: (v: string) => void
  department: string
  onDepartment: (v: string) => void
  status: string
  onStatus: (v: string) => void
  priority: string
  onPriority: (v: string) => void
  departments: Array<{ id: string; name: string }>
  onExport: () => void
  onRefresh: () => void
  refreshing?: boolean
}) {
  const selectClass =
    "h-8 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-[11px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"

  return (
    <div className="space-y-3 shrink-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#0f172a]">Workflow Tasks</h2>
          <div className="flex flex-wrap items-center gap-0.5 mt-2 border-b border-[#e2e8f0]">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={cn(
                  "h-8 px-2.5 text-[11px] font-medium border-b-2 -mb-px whitespace-nowrap",
                  tab === t
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-[#64748b] hover:text-[#0f172a]",
                )}
              >
                {tabLabel(t, counts)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onExport}
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#475569] hover:bg-[#f8fafc]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={department}
          onChange={(e) => onDepartment(e.target.value)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => onStatus(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="PENDING">Not Submitted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="RETURNED">Returned</option>
          <option value="APPROVED">Approved</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onPriority(e.target.value)}
          className={selectClass}
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-8 text-[11px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b]"
          aria-label="More filters"
          title="Filters"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
