"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  PerformanceTask,
  hydratedTeam,
  teamMemberIds,
} from "@/lib/api/performance-tasks-api"
import { Calendar, Paperclip, MessageCircle, GripVertical, Users } from "lucide-react"
import { format, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/lib/store"

interface KanbanCardProps {
  task: PerformanceTask
  isSelected?: boolean
  selectionMode?: boolean
  onToggleSelect?: () => void
  onClick?: () => void
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

const getInitials = (name?: string) => {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function KanbanCard({
  task,
  isSelected,
  selectionMode,
  onToggleSelect,
  onClick,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const due = task.dueDate || task.date
  const isOverdue =
    due &&
    task.stage !== "completed" &&
    isPast(new Date(due))

  // Resolve team IDs against the cached users list so the kanban card
  // shows real initials/names instead of "Member" placeholders.
  const cachedUsers = useAppSelector((s) => s.users.items)
  const teamIds = teamMemberIds(task.team)
  const teamObjects = hydratedTeam(task.team)
  const objectMap = new Map(teamObjects.map((u) => [u.id, u]))
  const resolvedTeam = teamIds.map((id) => {
    const hydrated = objectMap.get(id)
    if (hydrated) return hydrated
    const cached = cachedUsers.find((u) => u.id === id)
    if (cached) {
      return {
        id: cached.id,
        firstName: cached.firstName,
        lastName: cached.lastName,
        email: cached.email,
        fullName: `${cached.firstName} ${cached.lastName}`.trim(),
      }
    }
    return { id, email: id } as any
  })
  const visibleTeam = resolvedTeam.slice(0, 3)
  const totalCount = teamIds.length
  const overflowCount = Math.max(0, totalCount - visibleTeam.length)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isSelected && "ring-2 ring-blue-500 border-blue-500",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        {selectionMode && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect?.()
            }}
            className="mt-1 w-4 h-4"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{task.title}</p>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn("text-xs px-1.5 py-0", PRIORITY_STYLES[task.priority])}
              >
                {task.priority}
              </Badge>
            )}
            {task.isPerformanceTask && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 border-purple-300 text-purple-700"
              >
                Perf
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {due && (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isOverdue && "text-red-600 font-medium"
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {format(new Date(due), "MMM d")}
                </span>
              )}
              {task.attachments && task.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {task.attachments.length}
                </span>
              )}
              {task.commentCount !== undefined && task.commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {task.commentCount}
                </span>
              )}
            </div>

            {totalCount > 0 && (
              <div className="flex -space-x-2 items-center">
                {visibleTeam.map((u, i) => {
                  const display =
                    (u as any).fullName ||
                    `${(u as any).firstName ?? ""} ${(u as any).lastName ?? ""}`.trim() ||
                    (u as any).email ||
                    ""
                  const hasName = !!(
                    (u as any).fullName ||
                    (u as any).firstName ||
                    (u as any).lastName
                  )
                  return (
                    <Avatar
                      key={(u as any).id || i}
                      className="w-6 h-6 border-2 border-white"
                      title={display}
                    >
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          hasName
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        )}
                      >
                        {hasName ? (
                          getInitials(display)
                        ) : (
                          <Users className="w-3 h-3" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )
                })}
                {overflowCount > 0 && (
                  <Avatar className="w-6 h-6 border-2 border-white">
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                      +{overflowCount}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
