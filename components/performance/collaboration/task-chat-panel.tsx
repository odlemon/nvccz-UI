"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import {
  performanceTasksApi,
  TaskComment,
} from "@/lib/api/performance-tasks-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, MessageCircle, Paperclip, X } from "lucide-react"
import { toast } from "sonner"
import { useTaskRoom } from "@/lib/hooks/useTaskRoom"
import { ChatBubble } from "./chat-bubble"
import { ChatSystemMessage } from "./chat-system-message"
import { MentionDropdown } from "./mention-dropdown"
import { extractApiError } from "@/lib/utils/api-error"

interface Props {
  taskId: string
  onPreview?: (docs: any[], idx: number) => void
}

export function TaskChatPanel({ taskId, onPreview }: Props) {
  const currentUser = useAppSelector((s) => (s as any).auth?.user || null)
  const currentUserId =
    (currentUser?.id as string) ||
    (currentUser?.userId as string) ||
    null

  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [sending, setSending] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await performanceTasksApi.getComments(taskId)
      // API returns { success, comments } — be defensive in case shape varies
      const list: TaskComment[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.comments)
        ? res.comments
        : Array.isArray(res?.data)
        ? res.data
        : []
      setComments(list)
    } catch (e: any) {
      // 404 means task has no comments yet — set empty
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // Realtime subscriptions
  useTaskRoom(taskId, {
    onMessage: (msg) => {
      setComments((prev) => {
        if (prev.find((c) => c.id === msg.id)) return prev
        return [...prev, msg]
      })
    },
    onCommentCreated: (comment) => {
      setComments((prev) => {
        if (prev.find((c) => c.id === comment.id)) return prev
        return [...prev, comment]
      })
    },
    onCommentDeleted: ({ commentId }) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, isDeleted: true } : c
        )
      )
    },
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [comments.length])

  const handleContentChange = (value: string) => {
    setContent(value)
    const match = value.match(/@(\w*)$/)
    if (match) {
      setMentionQuery(match[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (user: { id: string; name: string }) => {
    setContent((prev) => prev.replace(/@\w*$/, `@${user.name} `))
    setMentionedUserIds((prev) =>
      prev.includes(user.id) ? prev : [...prev, user.id]
    )
    setShowMentions(false)
    setMentionQuery("")
  }

  const handleSend = async () => {
    if (!content.trim() && pendingFiles.length === 0) return
    setSending(true)
    try {
      await performanceTasksApi.postComment(taskId, {
        content: content.trim() || "(attachment)",
        mentionUserIds: mentionedUserIds.length ? mentionedUserIds : undefined,
        attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
      })
      setContent("")
      setMentionedUserIds([])
      setPendingFiles([])
      // realtime should pick this up; refresh as fallback
      await loadComments()
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to post message"))
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await performanceTasksApi.deleteComment(taskId, commentId)
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, isDeleted: true } : c
        )
      )
      toast.success("Message deleted")
    } catch (e: any) {
      toast.error(extractApiError(e, "Delete failed"))
    }
  }

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const tooLarge = arr.find((f) => f.size > 5 * 1024 * 1024)
    if (tooLarge) {
      toast.error(`${tooLarge.name} exceeds 5MB limit`)
      return
    }
    setPendingFiles((prev) => [...prev, ...arr])
  }

  // Group consecutive messages from the same author for tighter bubble thread look
  const renderItems = useMemo(() => {
    return comments.map((c, idx) => {
      const prev = idx > 0 ? comments[idx - 1] : undefined
      const isSystem = c.activityType !== "task_comment"
      const prevSameAuthor =
        prev &&
        !isSystem &&
        prev.activityType === "task_comment" &&
        prev.author?.id === c.author?.id
      const isOwn = !!currentUserId && c.author?.id === currentUserId
      return { comment: c, isSystem, prevSameAuthor: !!prevSameAuthor, isOwn }
    })
  }, [comments, currentUserId])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">
              Start the conversation. Use @ to mention teammates.
            </p>
          </div>
        ) : (
          <>
            {renderItems.map(({ comment, isSystem, prevSameAuthor, isOwn }) =>
              isSystem ? (
                <ChatSystemMessage key={comment.id} comment={comment} />
              ) : (
                <ChatBubble
                  key={comment.id}
                  comment={comment}
                  isOwn={isOwn}
                  showAvatar={!prevSameAuthor}
                  onDelete={isOwn ? handleDelete : undefined}
                  onPreview={onPreview}
                />
              )
            )}
            <div ref={scrollAnchorRef} />
          </>
        )}
      </div>

      {/* Pending file chips */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2 border-t bg-white">
          {pendingFiles.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200"
            >
              <Paperclip className="w-3 h-3" />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="hover:bg-blue-100 rounded-full p-0.5"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="relative bg-white border-t p-3">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Type a message... use @ to mention"
          rows={2}
          className="resize-none border-gray-200 focus-visible:ring-blue-400"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        {showMentions && (
          <div className="absolute bottom-full left-3 right-3 mb-1">
            <MentionDropdown
              taskId={taskId}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
            />
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                handleAddFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full gap-1 text-gray-600"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attach
            </Button>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              ⌘/Ctrl + Enter to send
            </p>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || (!content.trim() && pendingFiles.length === 0)}
            size="sm"
            className="rounded-full gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
