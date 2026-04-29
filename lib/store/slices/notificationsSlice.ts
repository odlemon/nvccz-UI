import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  performanceNotificationsApi,
  AppNotification,
} from "@/lib/api/performance-notifications-api"

interface NotificationsState {
  feed: AppNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

const initialState: NotificationsState = {
  feed: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const res = await performanceNotificationsApi.list(params)
    return { data: res.data || [], unreadCount: res.unreadCount ?? 0 }
  }
)

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    await performanceNotificationsApi.markRead(id)
    return id
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    await performanceNotificationsApi.markAllRead()
  }
)

export const fetchUnreadCount = createAsyncThunk(
  "notifications/unreadCount",
  async () => {
    const res = await performanceNotificationsApi.getUnreadCount()
    return res.count || 0
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
        if (!action.payload.isRead) state.unreadCount += 1
      }
    },
    clearNotifications(state) {
      state.feed = []
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.feed = action.payload.data
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load notifications"
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.feed.find((n) => n.id === action.payload)
        if (n && !n.isRead) {
          n.isRead = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.feed.forEach((n) => (n.isRead = true))
        state.unreadCount = 0
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
  },
})

export const { pushNotificationFromSocket, clearNotifications } = slice.actions
export default slice.reducer
