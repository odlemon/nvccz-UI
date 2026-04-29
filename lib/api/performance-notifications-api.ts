import { apiClient } from "./api-client"

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_MENTION"
  | "TASK_COMMENT"
  | "REVIEW_DUE"
  | "REVIEW_FINALIZED"
  | "GOAL_PROGRESS"
  | "CYCLE_CREATED"
  | "SYSTEM"

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  payload?: Record<string, any>
  isRead: boolean
  createdAt: string
}

export const performanceNotificationsApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
        ).toString()
      : ""
    return apiClient.get<{
      success: boolean
      data: AppNotification[]
      unreadCount?: number
    }>(`/notifications${qs}`)
  },

  markRead: (id: string) =>
    apiClient.put<{ success: boolean }>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.put<{ success: boolean }>("/notifications/mark-all-read"),

  getUnreadCount: () =>
    apiClient.get<{ success: boolean; count: number }>("/notifications/unread-count"),
}
