"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TaskComment, getAttachmentUrl } from "@/lib/api/performance-tasks-api"
import { Trash2, Paperclip, Download, FileText } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  comment: TaskComment
  isOwn: boolean
  showAvatar: boolean
  onDelete?: (id: string) => void
  onPreview?: (docs: any[], idx: number) => void
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

/**
 * Render comment content with @mentions highlighted as inline pills.
 */
function renderContentWithMentions(content: string, mentions?: { name: string }[]) {
  if (!mentions || mentions.length === 0) return <span>{content}</span>

  // Build a regex of mention names (escape each)
  const names = mentions
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // longest first to avoid partial matches
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

  if (names.length === 0) return <span>{content}</span>

  const re = new RegExp(`@(${names.join("|")})`, "g")
  const parts: Array<{ text: string; isMention: boolean }> = []
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ text: content.slice(lastIdx, match.index), isMention: false })
    }
    parts.push({ text: match[0], isMention: true })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < content.length) {
    parts.push({ text: content.slice(lastIdx), isMention: false })
  }

  return (
    <>
      {parts.map((p, i) =>
        p.isMention ? (
          <span
            key={i}
            className="inline-block bg-blue-100 text-blue-800 font-medium px-1.5 rounded"
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  )
}

export function ChatBubble({ comment, isOwn, showAvatar, onDelete, onPreview }: Props) {
  const isDeleted = comment.isDeleted
  const authorName =
    comment.author?.fullName || comment.author?.email || "Unknown"

  return (
    <div
      className={cn(
        "flex gap-2 group items-end",
        isOwn ? "justify-end" : "justify-start",
        showAvatar ? "mt-3" : "mt-1"
      )}
    >
      {!isOwn &&
        (showAvatar ? (
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-7 flex-shrink-0" />
        ))}

      <div
        className={cn(
          "max-w-[70%] flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {showAvatar && (
          <div
            className={cn(
              "flex items-baseline gap-2 mb-0.5 text-xs",
              isOwn && "flex-row-reverse"
            )}
          >
            <span className="font-medium text-gray-800">
              {isOwn ? "You" : authorName}
            </span>
            <span className="text-gray-400 text-[10px]">
              {format(new Date(comment.createdAt), "MMM d, HH:mm")}
            </span>
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
              isOwn
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm",
              isDeleted && "italic opacity-60"
            )}
          >
            {isDeleted ? (
              <span className={isOwn ? "text-white/80" : "text-gray-400"}>
                [deleted]
              </span>
            ) : (
              renderContentWithMentions(comment.content, comment.mentions)
            )}
          </div>

          {!isDeleted && onDelete && isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 bg-white border rounded-full p-1 shadow-md hover:bg-red-50 transition-opacity"
              title="Delete message"
              type="button"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>

        {/* Attachments below the bubble */}
        {!isDeleted && comment.attachments && comment.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1.5", isOwn && "justify-end")}>
            {comment.attachments.map((a, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1 bg-white border rounded-lg pl-2 pr-1 py-1 hover:bg-blue-50 transition-colors text-xs group/attach"
              >
                <Paperclip className="w-3 h-3 text-gray-500" />
                <span className="max-w-[140px] truncate text-gray-700">
                  {a.fileName}
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  <Button
                    variant="ghost"
                    onClick={() => onPreview?.(comment.attachments!, i)}
                    title="View"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                  </Button>
                  <a href={getAttachmentUrl(a)} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-100" title="Download">
                      <Download className="w-3 h-3 text-gray-400" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
