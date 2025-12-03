import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface BudgetLineItem {
  id: string
  name: string
  category: string
  qty: number
  unitCost: number
  total: number
}

export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  role?: string
  status: "INVITED" | "RSVP_YES" | "RSVP_NO" | "CHECKED_IN"
  checkedIn: boolean
  feedbackRating?: number
  notes?: string
  internalAttendee?: boolean
}

export interface ActivityLog {
  id: string
  timestamp: string
  actor: string
  action: string
}

export interface Event {
  id: string
  title: string
  description?: string
  creatorId: string
  creatorName: string
  startDate: string
  endDate?: string
  venue: string
  totalCost: number
  procurementStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  rsvpRate: number
  myStatus?: "INVITED" | "RSVP_YES" | "RSVP_NO"
  accessList: string[]
  budgetLineItems: BudgetLineItem[]
  guests: Guest[]
  activity: ActivityLog[]
  private: boolean
  procurementId?: string
}

interface EventsState {
  list: Event[]
  currentEventId: string | null
  filters: {
    search: string
    status: string[]
    dateRange: { start: string | null; end: string | null }
  }
  viewMode: "list" | "calendar"
}

// Dummy data
const dummyEvents: Event[] = [
  {
    id: "evt_001",
    title: "Investor Roundtable — Q4",
    description: "Quarterly investor meeting to discuss performance and strategy",
    creatorId: "u_admin",
    creatorName: "A. Manager",
    startDate: "2025-11-12T18:00:00Z",
    endDate: "2025-11-12T21:00:00Z",
    venue: "Harare Conference Centre",
    totalCost: 50000.0,
    procurementStatus: "APPROVED",
    rsvpRate: 64,
    myStatus: "RSVP_YES",
    accessList: ["u_admin", "u_finance", "u_ops"],
    private: false,
    procurementId: "pr_101",
    budgetLineItems: [
      { id: "b1", name: "Venue Hire", category: "Venue", qty: 1, unitCost: 15000, total: 15000 },
      { id: "b2", name: "Catering", category: "F&B", qty: 120, unitCost: 35, total: 4200 },
      { id: "b3", name: "AV Equipment", category: "A/V", qty: 1, unitCost: 2500, total: 2500 },
    ],
    guests: [
      {
        id: "g1",
        name: "John Doe",
        email: "john@invest.com",
        phone: "+263771234567",
        status: "RSVP_YES",
        checkedIn: true,
        feedbackRating: 5,
        internalAttendee: true,
      },
      {
        id: "g2",
        name: "Jane Smith",
        email: "jane@vc.com",
        phone: "+263772345678",
        status: "INVITED",
        checkedIn: false,
        internalAttendee: false,
      },
      { id: "g3", name: "Ali K", email: "ali@capvc.com", status: "RSVP_NO", checkedIn: false, internalAttendee: false },
    ],
    activity: [
      { id: "a1", timestamp: "2025-10-20T12:00:00Z", actor: "A. Manager", action: "Created event" },
      { id: "a2", timestamp: "2025-10-25T10:00:00Z", actor: "A. Manager", action: "Sent PR to procurement" },
      { id: "a3", timestamp: "2025-10-28T14:30:00Z", actor: "Procurement Team", action: "Approved PR" },
    ],
  },
  {
    id: "evt_002",
    title: "Series A Pitch Night",
    description: "Startup pitch event for Series A funding round",
    creatorId: "u_ops",
    creatorName: "O. Ops",
    startDate: "2025-12-05T17:00:00Z",
    endDate: "2025-12-05T20:00:00Z",
    venue: "Boardroom B",
    totalCost: 12000.0,
    procurementStatus: "PENDING",
    rsvpRate: 0,
    myStatus: "INVITED",
    accessList: ["u_ops", "u_admin"],
    private: true,
    budgetLineItems: [
      { id: "b4", name: "Venue", category: "Venue", qty: 1, unitCost: 5000, total: 5000 },
      { id: "b5", name: "Refreshments", category: "F&B", qty: 50, unitCost: 20, total: 1000 },
    ],
    guests: [
      { id: "g4", name: "Mike Chen", email: "mike@startup.com", status: "INVITED", checkedIn: false },
      { id: "g5", name: "Sarah Lee", email: "sarah@vc.fund", status: "INVITED", checkedIn: false },
    ],
    activity: [{ id: "a4", timestamp: "2025-10-15T09:00:00Z", actor: "O. Ops", action: "Created event" }],
  },
  {
    id: "evt_003",
    title: "Annual Gala Dinner",
    description: "Annual company gala dinner and awards ceremony",
    creatorId: "u_admin",
    creatorName: "A. Manager",
    startDate: "2025-12-20T19:00:00Z",
    endDate: "2025-12-20T23:00:00Z",
    venue: "The Vault",
    totalCost: 85000.0,
    procurementStatus: "APPROVED",
    rsvpRate: 78,
    myStatus: "RSVP_YES",
    accessList: ["u_admin"],
    private: false,
    budgetLineItems: [
      { id: "b6", name: "Venue Hire", category: "Venue", qty: 1, unitCost: 25000, total: 25000 },
      { id: "b7", name: "Catering", category: "F&B", qty: 200, unitCost: 50, total: 10000 },
      { id: "b8", name: "Entertainment", category: "Entertainment", qty: 1, unitCost: 15000, total: 15000 },
    ],
    guests: [
      {
        id: "g6",
        name: "Robert Brown",
        email: "robert@company.com",
        status: "RSVP_YES",
        checkedIn: false,
        internalAttendee: true,
      },
      {
        id: "g7",
        name: "Emily White",
        email: "emily@company.com",
        status: "RSVP_YES",
        checkedIn: false,
        internalAttendee: true,
      },
    ],
    activity: [
      { id: "a5", timestamp: "2025-09-01T10:00:00Z", actor: "A. Manager", action: "Created event" },
      { id: "a6", timestamp: "2025-09-15T11:00:00Z", actor: "A. Manager", action: "Sent PR to procurement" },
    ],
  },
]

const initialState: EventsState = {
  list: dummyEvents,
  currentEventId: null,
  filters: {
    search: "",
    status: [],
    dateRange: { start: null, end: null },
  },
  viewMode: "list",
}

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<string | null>) => {
      state.currentEventId = action.payload
    },
    setViewMode: (state, action: PayloadAction<"list" | "calendar">) => {
      state.viewMode = action.payload
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload
    },
    setStatusFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.status = action.payload
    },
    setDateRangeFilter: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload
    },
    addEvent: (state, action: PayloadAction<Event>) => {
      state.list.push(action.payload)
    },
    updateEvent: (state, action: PayloadAction<Event>) => {
      const index = state.list.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) {
        state.list[index] = action.payload
      }
    },
    updateGuestStatus: (
      state,
      action: PayloadAction<{ eventId: string; guestId: string; status: Guest["status"] }>,
    ) => {
      const event = state.list.find((e) => e.id === action.payload.eventId)
      if (event) {
        const guest = event.guests.find((g) => g.id === action.payload.guestId)
        if (guest) {
          guest.status = action.payload.status
        }
      }
    },
    addGuest: (state, action: PayloadAction<{ eventId: string; guest: Guest }>) => {
      const event = state.list.find((e) => e.id === action.payload.eventId)
      if (event) {
        event.guests.push(action.payload.guest)
      }
    },
    addBudgetLineItem: (state, action: PayloadAction<{ eventId: string; item: BudgetLineItem }>) => {
      const event = state.list.find((e) => e.id === action.payload.eventId)
      if (event) {
        event.budgetLineItems.push(action.payload.item)
        event.totalCost = event.budgetLineItems.reduce((sum, item) => sum + item.total, 0)
      }
    },
    updateBudgetLineItem: (state, action: PayloadAction<{ eventId: string; item: BudgetLineItem }>) => {
      const event = state.list.find((e) => e.id === action.payload.eventId)
      if (event) {
        const index = event.budgetLineItems.findIndex((i) => i.id === action.payload.item.id)
        if (index !== -1) {
          event.budgetLineItems[index] = action.payload.item
          event.totalCost = event.budgetLineItems.reduce((sum, item) => sum + item.total, 0)
        }
      }
    },
    deleteBudgetLineItem: (state, action: PayloadAction<{ eventId: string; itemId: string }>) => {
      const event = state.list.find((e) => e.id === action.payload.eventId)
      if (event) {
        event.budgetLineItems = event.budgetLineItems.filter((i) => i.id !== action.payload.itemId)
        event.totalCost = event.budgetLineItems.reduce((sum, item) => sum + item.total, 0)
      }
    },
  },
})

export const {
  setCurrentEvent,
  setViewMode,
  setSearchFilter,
  setStatusFilter,
  setDateRangeFilter,
  addEvent,
  updateEvent,
  updateGuestStatus,
  addGuest,
  addBudgetLineItem,
  updateBudgetLineItem,
  deleteBudgetLineItem,
} = eventsSlice.actions

export default eventsSlice.reducer
