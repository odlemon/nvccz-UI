"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { FpaStatusBadge } from "@/components/fpa/fpa-status-badge"
import {
  formatDateTime,
  formatShortDate,
  normalizePriority,
  priorityTone,
  taskStatusTone,
  type WorkflowTaskRow,
} from "@/components/fpa/workflow/workflow-utils"
import { cn } from "@/lib/utils"

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function PersonCell({ name }: { name?: string | null }) {
  if (!name) return <span className="text-[#94a3b8]">—</span>
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-6 w-6 rounded-full bg-[#e0e7ff] text-[10px] font-semibold text-[#3730a3] inline-flex items-center justify-center shrink-0">
        {initials(name)}
      </span>
      <span className="text-[#0f172a] truncate">{name}</span>
    </div>
  )
}

function pageWindow(page: number, pages: number, size = 5): number[] {
  if (pages <= size) return Array.from({ length: pages }, (_, i) => i)
  const half = Math.floor(size / 2)
  let start = Math.max(0, page - half)
  let end = start + size
  if (end > pages) {
    end = pages
    start = Math.max(0, end - size)
  }
  return Array.from({ length: end - start }, (_, i) => start + i)
}

export function WorkflowTasksTable({
  tasks,
  selectedId,
  onSelect,
  page,
  pageSize,
  onPage,
}: {
  tasks: WorkflowTaskRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  page: number
  pageSize: number
  onPage: (p: number) => void
}) {
  const total = tasks.length
  const start = page * pageSize
  const slice = tasks.slice(start, start + pageSize)
  const pages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const nums = pageWindow(page, pages)

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="overflow-auto flex-1 min-h-0 rounded-lg border border-[#e2e8f0]">
        <table className="w-full border-collapse text-[11px] min-w-[820px]">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
              <th className="text-left px-3 py-2.5 font-medium">Task</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Department</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Assignee</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Due Date</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Priority</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Status</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Submitted On</th>
              <th className="text-left px-2.5 py-2.5 font-medium">Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#94a3b8]">
                  No tasks match the current filters.
                </td>
              </tr>
            ) : (
              slice.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  className={cn(
                    "border-b border-[#f1f5f9] cursor-pointer transition-colors",
                    selectedId === task.id ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "font-medium",
                        selectedId === task.id ? "text-[#1d4ed8]" : "text-[#2563eb]",
                      )}
                    >
                      {task.title}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-[#475569]">
                    {task.departmentName || task.departmentId || "—"}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <PersonCell name={task.assigneeName} />
                  </td>
                  <td className="px-2.5 py-2.5 text-[#475569] whitespace-nowrap">
                    {formatShortDate(task.dueDate)}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <FpaStatusBadge tone={priorityTone(task.priority)}>
                      {normalizePriority(task.priority)
                        ? String(normalizePriority(task.priority))
                            .charAt(0)
                            .toUpperCase() +
                          String(normalizePriority(task.priority)).slice(1).toLowerCase()
                        : "—"}
                    </FpaStatusBadge>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <FpaStatusBadge tone={taskStatusTone(task.status)}>
                      {String(task.status).replace(/_/g, " ")}
                    </FpaStatusBadge>
                  </td>
                  <td className="px-2.5 py-2.5 text-[#475569] whitespace-nowrap">
                    {task.submittedOn ? formatDateTime(task.submittedOn) : "—"}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <PersonCell name={task.reviewerName} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-[#64748b] shrink-0 mt-auto">
        <p>
          Showing {total === 0 ? 0 : start + 1} to {Math.min(start + pageSize, total)} of {total}{" "}
          tasks
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onPage(page - 1)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-40 hover:bg-[#f8fafc]"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {nums.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPage(i)}
              className={cn(
                "h-7 min-w-7 px-1.5 rounded-lg border text-[11px] font-medium",
                page === i
                  ? "border-[#2563eb] bg-[#2563eb] text-white"
                  : "border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]",
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => onPage(page + 1)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-40 hover:bg-[#f8fafc]"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
