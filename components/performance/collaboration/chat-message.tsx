"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TaskComment } from "@/lib/api/performance-tasks-api"
import { Trash2, Paperclip, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Props {
  comment: TaskComment
  onDelete?: (id: string) => void
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

export function ChatMessage({ comment, onDelete }: Props) {
  const isSystem = comment.activityType !== "task_comment"
  const isDeleted = comment.isDeleted

  if (isSystem) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Badge variant="outline" className="text-[10px]">
          system
        </Badge>
        <p className="text-xs text-gray-600 italic">
          {comment.title || comment.content}
        </p>
        <span className="text-[10px] text-gray-400 ml-auto">
          {format(new Date(comment.createdAt), "MMM d, HH:mm")}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-2 group", isDeleted && "opacity-50")}>
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarFallback className="text-xs bg-blue-500 text-white">
          {getInitials(comment.author?.fullName || comment.author?.email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium">
            {comment.author?.fullName || comment.author?.email || "Unknown"}
          </p>
          <span className="text-[10px] text-gray-400">
            {format(new Date(comment.createdAt), "MMM d, HH:mm")}
          </span>
          {!isDeleted && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="opacity-0 group-hover:opacity-100 ml-auto text-gray-400 hover:text-red-600 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {isDeleted ? (
          <p className="text-sm text-gray-400 italic">[deleted]</p>
        ) : (
          <>
            <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            {comment.mentions && comment.mentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {comment.mentions.map((m) => (
                  <Badge
                    key={m.userId}
                    variant="outline"
                    className="text-[10px] px-1 py-0 border-blue-300 text-blue-700"
                  >
                    @{m.name}
                  </Badge>
                ))}
              </div>
            )}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comment.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{a.fileName}</span>
                    <Download className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
