"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/store/slices/notificationsSlice"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ListTree,
  Calendar,
  AlertTriangle,
  ClipboardList,
  AtSign,
  MessageCircle,
  CircleDot,
} from "lucide-react"
import { AppNotification } from "@/lib/api/performance-notifications-api"
import { cn } from "@/lib/utils"
import { NotificationsModal } from "./notifications-modal"
import { toast } from "sonner"
import { extractApiError } from "@/lib/utils/api-error"

const PREVIEW_LIMIT = 7

const TYPE_ICON_COLOR: Record<string, { icon: any; bg: string; text: string }> = {
  TASK_ASSIGNED: { icon: ClipboardList, bg: "bg-blue-100", text: "text-blue-600" },
  TASK_MENTION: { icon: AtSign, bg: "bg-violet-100", text: "text-violet-600" },
  TASK_COMMENT: {
    icon: MessageCircle,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  TASK_RED_ZONE: {
    icon: AlertTriangle,
    bg: "bg-red-100",
    text: "text-red-600",
  },
  REVIEW_DUE: { icon: ClipboardList, bg: "bg-amber-100", text: "text-amber-600" },
  REVIEW_FINALIZED: { icon: Check, bg: "bg-green-100", text: "text-green-600" },
  GOAL_PROGRESS: {
    icon: CircleDot,
    bg: "bg-sky-100",
    text: "text-sky-600",
  },
  CYCLE_CREATED: { icon: Calendar, bg: "bg-indigo-100", text: "text-indigo-600" },
  event: { icon: Calendar, bg: "bg-purple-100", text: "text-purple-600" },
  SYSTEM: { icon: Bell, bg: "bg-gray-100", text: "text-gray-600" },
}

const getTypeStyle = (type: string) => {
  return TYPE_ICON_COLOR[type] || TYPE_ICON_COLOR.SYSTEM
}

/** Pick the best deep-link path from a notification's data payload. */
export const getNotificationPath = (n: AppNotification): string | null => {
  const d = n.data
  if (!d) return n.link || null
  // Prefer task path when modal target is a task
  if (d.modalTarget === "kanban-task" && d.taskPath) return d.taskPath
  if (d.modalTarget === "kanban-task" && d.taskId)
    return `/performance/tasks?taskId=${d.taskId}`
  return d.path || d.taskPath || n.link || null
}

export function NotificationsBell() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { feed, unreadCount, loading } = useAppSelector(
    (state) => state.notifications
  )
  const [open, setOpen] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initial fetch + 60s poll
  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50, offset: 0 }))
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ limit: 50, offset: 0 }))
    }, 60_000)
    return () => clearInterval(interval)
  }, [dispatch])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const previewItems = feed.slice(0, PREVIEW_LIMIT)

  const handleNotificationClick = async (n: AppNotification) => {
    setOpen(false)
    if (!n.isRead) {
      try {
        await dispatch(markNotificationRead(n.id)).unwrap()
      } catch (e: any) {
        // Non-blocking — still navigate
        console.warn("[notifications-bell] markRead failed", e)
      }
    }
    const path = getNotificationPath(n)
    if (path) router.push(path)
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await dispatch(markAllNotificationsRead()).unwrap()
      toast.success("All notifications marked as read")
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to mark all as read"))
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative h-12 w-12 flex items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "Notifications"}
            </p>
          </TooltipContent>
        </Tooltip>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[80vh] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={unreadCount === 0 || markingAll}
                onClick={handleMarkAllRead}
                className="text-xs h-7 gap-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                {markingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading && feed.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : previewItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">All caught up</p>
                  <p className="text-xs text-gray-400 mt-1">
                    No notifications to show
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {previewItems.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onClick={() => handleNotificationClick(n)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {feed.length > 0 && (
              <div className="border-t p-2 bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setOpen(false)
                    setShowAllModal(true)
                  }}
                >
                  <ListTree className="w-4 h-4" />
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationsModal
        open={showAllModal}
        onOpenChange={setShowAllModal}
        onNotificationClick={handleNotificationClick}
      />
    </>
  )
}

/* ---------- Single notification row ---------- */
function NotificationRow({
  notification,
  onClick,
}: {
  notification: AppNotification
  onClick: () => void
}) {
  const style = getTypeStyle(notification.type)
  const Icon = style.icon

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start gap-3 group",
          !notification.isRead && "bg-blue-50/50"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
            style.bg
          )}
        >
          <Icon className={cn("w-4 h-4", style.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "text-sm text-gray-900 truncate",
                !notification.isRead && "font-semibold"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {notification.timeAgo ||
              new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </button>
    </li>
  )
}

NotificationsBell.Row = NotificationRow
