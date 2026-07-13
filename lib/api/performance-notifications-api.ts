import { apiClient } from "./api-client"

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_MENTION"
  | "TASK_COMMENT"
  | "TASK_RED_ZONE"
  | "REVIEW_DUE"
  | "REVIEW_FINALIZED"
  | "GOAL_PROGRESS"
  | "CYCLE_CREATED"
  | "event"
  | "SYSTEM"
  | string

export interface AppNotificationData {
  taskId?: string
  commentId?: string | null
  dealId?: string
  eventId?: string
  authorId?: string
  /** FP&A budget cycle id for BUDGET_* notification deep links */
  cycleId?: string
  /** Primary deep-link path returned by backend */
  path?: string
  /** Alternative path (e.g. taskPath when modalTarget is deal-card) */
  taskPath?: string
  /** Hint for which modal to open: 'kanban-task', 'deal-card', etc. */
  modalTarget?: string
  [key: string]: any
}

export interface AppNotification {
  id: string
  /** Backend may not always include userId on this endpoint */
  userId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  /** Structured payload with deep-link info */
  data?: AppNotificationData | null
  payload?: Record<string, any>
  relatedEntity?: string | null
  relatedEntityId?: string | null
  isRead: boolean
  createdAt: string
  updatedAt?: string
  /** Pre-formatted relative time (e.g. "1 day ago") */
  timeAgo?: string
}

export interface NotificationsPagination {
  total: number
  unread: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface NotificationsListResponse {
  success: boolean
  data: {
    notifications: AppNotification[]
    pagination: NotificationsPagination
  }
}

export interface MarkReadResponse {
  success: boolean
  message?: string
  unread?: number
}

export const performanceNotificationsApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    qs.append("limit", String(params?.limit ?? 50))
    qs.append("offset", String(params?.offset ?? 0))
    return apiClient.get<NotificationsListResponse>(
      `/homepage/notifications?${qs.toString()}`
    )
  },

  markRead: (id: string) =>
    apiClient.put<MarkReadResponse>(`/homepage/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.put<MarkReadResponse>(`/homepage/notifications/read-all`),
}
