"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
  CheckCheck,
  Loader2,
  ListTree,
} from "lucide-react"
import { AppNotification } from "@/lib/api/performance-notifications-api"
import { cn } from "@/lib/utils"
import { NotificationsModal } from "./notifications-modal"
import { getNotificationTypeStyle } from "./notification-type-styles"
import { useThemeContainer } from "@/components/investments-v2/ui/use-theme-container"
import { toast } from "sonner"
import { extractApiError } from "@/lib/utils/api-error"

const PREVIEW_LIMIT = 7

const BUDGET_OWNER_WORK_TYPES = new Set([
  "BUDGET_OWNER_ASSIGNED",
  "BUDGET_TASK_ASSIGNED",
])

const BUDGET_WORKFLOW_TYPES = new Set([
  "BUDGET_SUBMITTED_FOR_REVIEW",
  "BUDGET_PENDING_CFO_REVIEW",
  "BUDGET_CFO_APPROVED",
  "BUDGET_CYCLE_LOCKED",
  "BUDGET_RETURNED_FOR_CORRECTION",
  "BUDGET_TASK_SUBMITTED",
  "BUDGET_TASK_RETURNED",
  "BUDGET_TASK_APPROVED",
  "BUDGET_BOARD_PACK_READY",
])

function budgetTaskIdFromNotification(n: AppNotification): string | null {
  const d = n.data || {}
  if (typeof d.taskId === "string" && d.taskId) return d.taskId
  if (
    n.relatedEntityId &&
    (n.relatedEntity === "BudgetTask" ||
      n.relatedEntity === "FpaBudgetTask" ||
      n.relatedEntity === "budget_task" ||
      String(n.relatedEntity || "").toLowerCase().includes("budgettask"))
  ) {
    return n.relatedEntityId
  }
  return null
}

function buildBudgetDeepLink(
  cycleId: string,
  opts?: { workflow?: boolean; taskId?: string | null },
): string {
  const base = opts?.workflow ? "/forecasting/workflow" : "/forecasting/budget"
  const params = new URLSearchParams({ cycleId })
  if (opts?.workflow && opts.taskId) params.set("taskId", opts.taskId)
  return `${base}?${params.toString()}`
}

/** Map backend `/fpa/budgeting/{cycleId}` deep links to the app route. */
export function remapFpaBudgetPath(
  path: string,
  opts?: { workflow?: boolean; taskId?: string | null },
): string {
  const match = path.match(/^\/fpa\/budgeting\/([^/?#]+)/i)
  if (match?.[1]) {
    return buildBudgetDeepLink(match[1], opts)
  }
  if (/^\/fpa\/budgeting\/?/i.test(path)) {
    return opts?.workflow ? "/forecasting/workflow" : "/forecasting/budget"
  }
  return path
}

function budgetCycleIdFromNotification(n: AppNotification): string | null {
  const d = n.data || {}
  if (typeof d.cycleId === "string" && d.cycleId) return d.cycleId
  if (
    n.relatedEntityId &&
    (n.relatedEntity === "BudgetCycle" ||
      n.relatedEntity === "FpaBudgetCycle" ||
      n.relatedEntity === "budget_cycle" ||
      String(n.relatedEntity || "").toLowerCase().includes("budget"))
  ) {
    return n.relatedEntityId
  }
  const candidate = d.path || d.taskPath || n.link
  if (typeof candidate === "string") {
    const match = candidate.match(/\/fpa\/budgeting\/([^/?#]+)/i)
    if (match?.[1]) return match[1]
    try {
      const url = new URL(candidate, "http://local")
      const q = url.searchParams.get("cycleId")
      if (q) return q
    } catch {
      /* ignore */
    }
  }
  return null
}

/** Pick the best deep-link path from a notification's data payload. */
export const getNotificationPath = (n: AppNotification): string | null => {
  const d = n.data || {}

  // 0. FP&A budget notifications (before TASK_ — budget payloads may include taskId)
  if (
    n.type.startsWith("BUDGET_") ||
    String(n.relatedEntity || "").toLowerCase().includes("budget")
  ) {
    const toWorkflow =
      BUDGET_WORKFLOW_TYPES.has(n.type) ||
      (n.type.startsWith("BUDGET_") && !BUDGET_OWNER_WORK_TYPES.has(n.type))
    const cycleId = budgetCycleIdFromNotification(n)
    const taskId = budgetTaskIdFromNotification(n)
    if (cycleId) {
      return buildBudgetDeepLink(cycleId, {
        workflow: toWorkflow,
        taskId: toWorkflow ? taskId : null,
      })
    }
    const explicit = d.path || d.taskPath || n.link
    if (explicit) {
      return remapFpaBudgetPath(explicit, {
        workflow: toWorkflow,
        taskId: toWorkflow ? taskId : null,
      })
    }
    return toWorkflow ? "/forecasting/workflow" : "/forecasting/budget"
  }

  // 1. Task-specific deep-linking
  if (n.type.startsWith("TASK_") || d.taskId || d.modalTarget === "kanban-task") {
    const taskId = d.taskId || n.relatedEntityId
    if (taskId) return `/performance/tasks?taskId=${taskId}`
    if (d.taskPath) return d.taskPath
  }

  // 2. Review-specific deep-linking
  if (n.type.startsWith("REVIEW_")) {
    const reviewId = d.reviewId || (n.relatedEntity === "Review" ? n.relatedEntityId : null)
    if (reviewId) return `/performance/reviews/${reviewId}`
    return "/performance/reviews"
  }

  // 3. Goal-specific
  if (n.type === "GOAL_PROGRESS" || n.relatedEntity === "Goal") {
    return "/performance/goals"
  }

  // 4. Strategy/Cycle
  if (n.type === "CYCLE_CREATED") {
    return "/performance/configuration/strategy"
  }

  // 5. Investment broker reply → orderbook
  if (n.type === "INVESTMENT_BROKER_REPLY") {
    const orderId = typeof d.orderId === "string" ? d.orderId : n.relatedEntityId
    if (orderId) return `/investments-v2/orders/orderbook?orderId=${orderId}`
    if (d.path) return String(d.path)
  }

  // 6. Fallback — remap legacy FPA paths if present
  const fallback = d.path || d.taskPath || n.link || null
  return fallback ? remapFpaBudgetPath(fallback) : null
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
  const { ref: themeRef, container: themeContainer } = useThemeContainer()

  const setBellRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      themeRef(node)
    },
    [themeRef],
  )

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
      <div ref={setBellRef} className="relative">
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
                <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
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
          <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[80vh] bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-300 font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={unreadCount === 0 || markingAll}
                onClick={handleMarkAllRead}
                className="text-xs h-7 gap-1 text-primary hover:text-primary/80 disabled:text-muted-foreground"
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
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : previewItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">All caught up</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    No notifications to show
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
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
              <div className="border-t border-border p-2 bg-muted/40">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
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
        portalContainer={themeContainer}
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
  const style = getNotificationTypeStyle(notification.type)
  const Icon = style.icon

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 hover:bg-accent transition-colors flex items-start gap-3 group",
          !notification.isRead && "bg-primary/5 dark:bg-primary/10"
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
                "text-sm text-foreground truncate",
                !notification.isRead && "font-semibold"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {notification.timeAgo ||
              new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </button>
    </li>
  )
}

NotificationsBell.Row = NotificationRow
