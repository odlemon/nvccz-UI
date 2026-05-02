import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  performanceNotificationsApi,
  AppNotification,
  NotificationsPagination,
} from "@/lib/api/performance-notifications-api"

interface NotificationsState {
  feed: AppNotification[]
  unreadCount: number
  total: number
  pagination: NotificationsPagination | null
  loading: boolean
  loadingMore: boolean
  error: string | null
}

const initialState: NotificationsState = {
  feed: [],
  unreadCount: 0,
  total: 0,
  pagination: null,
  loading: false,
  loadingMore: false,
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (params?: { limit?: number; offset?: number; append?: boolean }) => {
    const res = await performanceNotificationsApi.list({
      limit: params?.limit,
      offset: params?.offset,
    })
    return {
      notifications: res.data?.notifications || [],
      pagination: res.data?.pagination || null,
      append: params?.append || false,
    }
  }
)

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    const res = await performanceNotificationsApi.markRead(id)
    return { id, unread: res.unread }
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    const res = await performanceNotificationsApi.markAllRead()
    return { unread: res.unread ?? 0 }
  }
)

const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushNotificationFromSocket(state, action: PayloadAction<AppNotification>) {
      const exists = state.feed.find((n) => n.id === action.payload.id)
      if (!exists) {
        state.feed.unshift(action.payload)
        state.total += 1
        if (!action.payload.isRead) state.unreadCount += 1
      }
    },
    clearNotifications(state) {
      state.feed = []
      state.unreadCount = 0
      state.total = 0
      state.pagination = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        if (action.meta.arg?.append) {
          state.loadingMore = true
        } else {
          state.loading = true
        }
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.loadingMore = false
        if (action.payload.append) {
          // Append while deduping by id
          const existingIds = new Set(state.feed.map((n) => n.id))
          const fresh = action.payload.notifications.filter(
            (n) => !existingIds.has(n.id)
          )
          state.feed = [...state.feed, ...fresh]
        } else {
          state.feed = action.payload.notifications
        }
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination
          state.total = action.payload.pagination.total
          state.unreadCount = action.payload.pagination.unread
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.loadingMore = false
        state.error = action.error.message || "Failed to load notifications"
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.feed.find((n) => n.id === action.payload.id)
        if (n && !n.isRead) {
          n.isRead = true
        }
        if (typeof action.payload.unread === "number") {
          state.unreadCount = action.payload.unread
        } else if (n) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        state.feed.forEach((n) => (n.isRead = true))
        state.unreadCount = action.payload.unread ?? 0
      })
  },
})

export const { pushNotificationFromSocket, clearNotifications } = slice.actions
export default slice.reducer
