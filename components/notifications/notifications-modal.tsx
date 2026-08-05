"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchNotifications,
  markAllNotificationsRead,
} from "@/lib/store/slices/notificationsSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Loader2,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AppNotification } from "@/lib/api/performance-notifications-api"
import { toast } from "sonner"
import { extractApiError } from "@/lib/utils/api-error"
import { getNotificationTypeStyle } from "./notification-type-styles"

const PAGE_SIZE = 20

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationClick: (n: AppNotification) => void
  /** Portal into investments-terminal so dark/light CSS variables apply */
  portalContainer?: HTMLElement | null
}

export function NotificationsModal({ open, onOpenChange, onNotificationClick, portalContainer }: Props) {
  const dispatch = useAppDispatch()
  const { feed, unreadCount, total, pagination, loading } = useAppSelector(
    (s) => s.notifications
  )
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [markingAll, setMarkingAll] = useState(false)

  // When modal opens, refetch the first page (large) so we have a good window
  useEffect(() => {
    if (open) {
      setPage(0)
      dispatch(fetchNotifications({ limit: 50, offset: 0 }))
    }
  }, [open, dispatch])

  const filtered = useMemo(() => {
    if (filter === "unread") return feed.filter((n) => !n.isRead)
    return feed
  }, [feed, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  const totalDisplay = filter === "unread" ? unreadCount : total
  const filteredCount = filtered.length
  const showingFrom = filteredCount === 0 ? 0 : start + 1
  const showingTo = Math.min(start + PAGE_SIZE, filteredCount)

  const handleLoadMore = async () => {
    if (!pagination?.hasMore) return
    await dispatch(
      fetchNotifications({
        limit: 50,
        offset: feed.length,
        append: true,
      })
    )
  }

  const handleMarkAll = async () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={portalContainer ?? undefined}
        className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 bg-popover text-popover-foreground"
      >
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
                <Bell className="w-5 h-5 text-primary" />
                All Notifications
              </DialogTitle>
              <DialogDescription className="mt-1">
                {total} total · {unreadCount} unread
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || markingAll}
              onClick={handleMarkAll}
              className="rounded-full gap-1.5"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Mark all read
            </Button>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => {
                setFilter("all")
                setPage(0)
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              All ({total})
            </button>
            <button
              onClick={() => {
                setFilter("unread")
                setPage(0)
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === "unread"
                  ? "bg-red-500/15 text-red-600 dark:text-red-300"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && feed.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {filter === "unread"
                  ? "You're all caught up"
                  : "You'll see notifications here when there's activity"}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((n) => (
                <ModalRow
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    onOpenChange(false)
                    onNotificationClick(n)
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="border-t border-border p-4 flex items-center justify-between bg-muted/40 flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            {filteredCount === 0
              ? "Showing 0 of 0"
              : `Showing ${showingFrom}–${showingTo} of ${filteredCount}${
                  filter === "all" && totalDisplay > filteredCount
                    ? ` (${totalDisplay} total on server)`
                    : ""
                }`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-full h-8 gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Badge variant="outline" className="font-mono text-[11px]">
              {safePage + 1} / {totalPages}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => {
                if (safePage >= totalPages - 1 && pagination?.hasMore) {
                  handleLoadMore()
                } else {
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
              }}
              className="rounded-full h-8 gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            {pagination?.hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-full h-8 ml-2 text-xs"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Load more"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalRow({
  notification,
  onClick,
}: {
  notification: AppNotification
  onClick: () => void
}) {
  const style = getNotificationTypeStyle(notification.type)
  const Icon = style.icon

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3",
          notification.isRead
            ? "bg-card border-border hover:border-border/80 hover:bg-accent/50"
            : "bg-primary/5 dark:bg-primary/10 border-primary/30 hover:border-primary/50"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            style.bg
          )}
        >
          <Icon className={cn("w-5 h-5", style.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p
                className={cn(
                  "text-sm truncate",
                  notification.isRead ? "text-muted-foreground" : "font-semibold text-foreground"
                )}
              >
                {notification.title}
              </p>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
              {notification.type.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            {notification.timeAgo ||
              new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </button>
    </li>
  )
}
