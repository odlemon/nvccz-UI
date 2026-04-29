"use client"

import { TaskComment } from "@/lib/api/performance-tasks-api"
import { format } from "date-fns"
import {
  CircleCheck,
  CirclePlus,
  Edit3,
  ArrowRightLeft,
  UserPlus,
  Activity,
} from "lucide-react"

const EVENT_ICONS: Record<string, any> = {
  TASK_CREATED: CirclePlus,
  TASK_STATUS_CHANGED: ArrowRightLeft,
  TASK_UPDATED: Edit3,
  TASK_ASSIGNED: UserPlus,
  TASK_COMPLETED: CircleCheck,
}

const EVENT_COLORS: Record<string, string> = {
  TASK_CREATED: "text-blue-600 bg-blue-100",
  TASK_STATUS_CHANGED: "text-purple-600 bg-purple-100",
  TASK_UPDATED: "text-amber-600 bg-amber-100",
  TASK_ASSIGNED: "text-green-600 bg-green-100",
  TASK_COMPLETED: "text-emerald-600 bg-emerald-100",
}

interface Props {
  comment: TaskComment
}

export function ChatSystemMessage({ comment }: Props) {
  const eventType = (comment as any).eventType as string | undefined
  const Icon = (eventType && EVENT_ICONS[eventType]) || Activity
  const colorClass =
    (eventType && EVENT_COLORS[eventType]) || "text-gray-600 bg-gray-100"
  const authorName =
    comment.author?.fullName || comment.author?.email || "System"

  return (
    <div className="flex items-center gap-2 my-3 justify-center">
      <div className="flex-1 h-px bg-gray-200" />
      <div
        className={`flex items-center gap-1.5 text-[10px] px-3 py-0.5 rounded-full ${colorClass.replace("border", "")} border-transparent`}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium">{authorName}</span>
        <span className="opacity-80">{comment.content}</span>
        <span className="opacity-50 ml-1">
          {format(new Date(comment.createdAt), "MMM d, HH:mm")}
        </span>
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}
