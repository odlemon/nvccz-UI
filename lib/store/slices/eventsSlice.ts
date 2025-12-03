import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  eventsApi,
  type AppEvent,
  type EventGuest,
  type BudgetItem,
  type EventExpense,
  type EventFeedback,
  type EventAnalytics,
  type EventReport,
  type EventType,
  type EventStatus,
  type BudgetStatus,
  type BudgetCategory,
  type PaymentMethod,
  type ReportType
} from '@/lib/api/events-api'

export interface EventsState {
  events: AppEvent[]
  currentEvent: AppEvent | null
  currentEventGuests: EventGuest[]
  currentEventBudgetItems: BudgetItem[]
  currentEventExpenses: EventExpense[]
  currentEventFeedback: EventFeedback[]
  currentEventAnalytics: EventAnalytics | null
  viewMode: 'list' | 'calendar' | 'grid'
  filters: {
    search: string
    status: EventStatus | 'ALL'
    eventType: EventType | 'ALL'
    dateRange: { start: string | null; end: string | null }
  }
  loading: boolean
  error: string | null
  guestsPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  currentEventGuests: [],
  currentEventBudgetItems: [],
  currentEventExpenses: [],
  currentEventFeedback: [],
  currentEventAnalytics: null,
  viewMode: 'list',
  filters: {
    search: '',
    status: 'ALL',
    eventType: 'ALL',
    dateRange: { start: null, end: null }
  },
  loading: false,
  error: null,
  guestsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
}

// Async Thunks for API calls
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getAll()
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch events')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch events')
    }
  }
)

export const fetchUpcomingEvents = createAsyncThunk(
  'events/fetchUpcomingEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getUpcoming()
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch upcoming events')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch upcoming events')
    }
  }
)

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getById(eventId)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch event')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch event')
    }
  }
)

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: {
    title: string
    description: string
    startDate: string
    endDate: string
    location: string
    eventType?: EventType
    maxAttendees?: number
    isPublic?: boolean
    requiresRSVP?: boolean
    rsvpDeadline?: string
    estimatedBudget?: number
    checkInRequired?: boolean
    feedbackRequired?: boolean
  }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.create(eventData)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to create event')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create event')
    }
  }
)

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.update(id, data)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to update event')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update event')
    }
  }
)

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsApi.delete(eventId)
      return eventId
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete event')
    }
  }
)

// Guest Management
export const fetchEventGuests = createAsyncThunk(
  'events/fetchEventGuests',
  async ({ eventId, page = 1, limit = 10 }: { eventId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getGuests(eventId, page, limit)
      if (response.success) {
        return { guests: response.data, pagination: response.pagination }
      }
      throw new Error('Failed to fetch guests')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch guests')
    }
  }
)

export const addEventGuests = createAsyncThunk(
  'events/addEventGuests',
  async ({ eventId, guests }: { eventId: string; guests: any[] }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.addGuests(eventId, guests)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add guests')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add guests')
    }
  }
)

export const checkInGuest = createAsyncThunk(
  'events/checkInGuest',
  async ({ eventId, guestId, notes }: { eventId: string; guestId: string; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.checkInGuest(eventId, guestId, notes)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to check in guest')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check in guest')
    }
  }
)

// Budget Management
export const fetchBudgetItems = createAsyncThunk(
  'events/fetchBudgetItems',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getBudgetItems(eventId)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch budget items')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch budget items')
    }
  }
)

export const addBudgetItems = createAsyncThunk(
  'events/addBudgetItems',
  async ({ eventId, budgetItems }: { eventId: string; budgetItems: any[] }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.addBudgetItems(eventId, budgetItems)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add budget items')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add budget items')
    }
  }
)

export const approveBudget = createAsyncThunk(
  'events/approveBudget',
  async ({ eventId, approvedBudget, notes }: { eventId: string; approvedBudget: number; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.approveBudget(eventId, approvedBudget, notes)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to approve budget')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve budget')
    }
  }
)

// Expense Management
export const fetchExpenses = createAsyncThunk(
  'events/fetchExpenses',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getExpenses(eventId)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch expenses')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch expenses')
    }
  }
)

export const addExpense = createAsyncThunk(
  'events/addExpense',
  async ({ eventId, data }: { eventId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.addExpense(eventId, data)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add expense')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add expense')
    }
  }
)

// Feedback Management
export const fetchFeedback = createAsyncThunk(
  'events/fetchFeedback',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getFeedback(eventId)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch feedback')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch feedback')
    }
  }
)

export const submitFeedback = createAsyncThunk(
  'events/submitFeedback',
  async ({ eventId, data }: { eventId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.submitFeedback(eventId, data)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to submit feedback')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit feedback')
    }
  }
)

// Analytics & Reporting
export const fetchAnalytics = createAsyncThunk(
  'events/fetchAnalytics',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsApi.getAnalytics(eventId)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch analytics')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics')
    }
  }
)

export const generateReport = createAsyncThunk(
  'events/generateReport',
  async ({ eventId, reportType }: { eventId: string; reportType: ReportType }, { rejectWithValue }) => {
    try {
      const response = await eventsApi.generateReport(eventId, reportType)
      if (response.success) {
        return response.data
      }
      throw new Error('Failed to generate report')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate report')
    }
  }
)

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        state.currentEvent = state.events.find(e => e.id === action.payload) || null
      } else {
        state.currentEvent = null
      }
    },
    setViewMode: (state, action: PayloadAction<'list' | 'calendar' | 'grid'>) => {
      state.viewMode = action.payload
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload
    },
    setStatusFilter: (state, action: PayloadAction<EventStatus | 'ALL'>) => {
      state.filters.status = action.payload
    },
    setEventTypeFilter: (state, action: PayloadAction<EventType | 'ALL'>) => {
      state.filters.eventType = action.payload
    },
    setDateRangeFilter: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Fetch Events
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false
        state.events = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch Upcoming Events
    builder
      .addCase(fetchUpcomingEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUpcomingEvents.fulfilled, (state, action) => {
        state.loading = false
        state.events = action.payload
      })
      .addCase(fetchUpcomingEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch Event By ID
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false
        state.currentEvent = action.payload
        const index = state.events.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        } else {
          state.events.push(action.payload)
        }
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create Event
    builder
      .addCase(createEvent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false
        state.events.unshift(action.payload)
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update Event
    builder
      .addCase(updateEvent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false
        const index = state.events.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete Event
    builder
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false
        state.events = state.events.filter(e => e.id !== action.payload)
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch Guests
    builder
      .addCase(fetchEventGuests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEventGuests.fulfilled, (state, action) => {
        state.loading = false
        state.currentEventGuests = action.payload.guests
        if (action.payload.pagination) {
          state.guestsPagination = action.payload.pagination
        }
      })
      .addCase(fetchEventGuests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Add Guests
    builder
      .addCase(addEventGuests.fulfilled, (state, action) => {
        state.currentEventGuests = [...state.currentEventGuests, ...action.payload]
      })

    // Check In Guest
    builder
      .addCase(checkInGuest.fulfilled, (state, action) => {
        const index = state.currentEventGuests.findIndex(g => g.id === action.payload.id)
        if (index !== -1) {
          state.currentEventGuests[index] = action.payload
        }
      })

    // Budget Items
    builder
      .addCase(fetchBudgetItems.fulfilled, (state, action) => {
        state.currentEventBudgetItems = action.payload
      })
      .addCase(addBudgetItems.fulfilled, (state, action) => {
        state.currentEventBudgetItems = [...state.currentEventBudgetItems, ...action.payload]
      })
      .addCase(approveBudget.fulfilled, (state, action) => {
        if (state.currentEvent) {
          state.currentEvent = action.payload
        }
        const index = state.events.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        }
      })

    // Expenses
    builder
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.currentEventExpenses = action.payload
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.currentEventExpenses.push(action.payload)
      })

    // Feedback
    builder
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.currentEventFeedback = action.payload
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.currentEventFeedback.push(action.payload)
      })

    // Analytics
    builder
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.currentEventAnalytics = action.payload
      })
  }
})

export const {
  setCurrentEvent,
  setViewMode,
  setSearchFilter,
  setStatusFilter,
  setEventTypeFilter,
  setDateRangeFilter,
  clearFilters,
  clearError
} = eventsSlice.actions

export default eventsSlice.reducer
