import { apiClient, type ApiResponse } from '@/lib/api/api-client'

export interface EventAuthor {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type EventType = 'CONFERENCE' | 'MEETING' | 'WORKSHOP' | 'SOCIAL' | 'TRAINING' | 'OTHER'
export type EventStatus = 'PLANNING' | 'BUDGET_PENDING' | 'BUDGET_APPROVED' | 'BUDGET_REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type BudgetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISED'
export type RSVPStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE'
export type PaymentMethod = 'BANK' | 'CASH' | 'CARD' | 'OTHER'
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
export type BudgetCategory = 'VENUE' | 'CATERING' | 'DECORATIONS' | 'ENTERTAINMENT' | 'TRANSPORT' | 'MARKETING' | 'TECHNOLOGY' | 'STAFFING' | 'SECURITY' | 'OTHER'
export type ReportType = 'FINANCIAL' | 'ATTENDANCE' | 'FEEDBACK' | 'COMPREHENSIVE'

export interface AppEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  authorId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  approvedBudget: string | null
  budgetApprovedAt: string | null
  budgetApprovedBy: string | null
  budgetStatus: BudgetStatus
  checkInRequired: boolean
  estimatedBudget: string | null
  eventType: EventType | null
  feedbackRequired: boolean
  googleCalendarEventId: string | null
  googleCalendarLink: string | null
  isPublic: boolean
  maxAttendees: number | null
  requiresRSVP: boolean
  rsvpDeadline: string | null
  status: EventStatus
  author: EventAuthor
}

export interface EventGuest {
  id: string
  eventId: string
  email: string
  name: string
  phone: string | null
  company: string | null
  title: string | null
  invitationToken: string
  rsvpStatus: RSVPStatus
  rsvpRespondedAt: string | null
  rsvpNotes: string | null
  checkedIn: boolean
  checkedInAt: string | null
  checkedInBy: string | null
  dietaryRequirements: string | null
  accessibilityNeeds: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  createdAt: string
  updatedAt: string
}

export interface BudgetItem {
  id: string
  eventId: string
  category: BudgetCategory
  itemName: string
  description: string | null
  estimatedCost: string
  actualCost: string | null
  quantity: number
  unit: string | null
  vendor: string | null
  vendorContact: string | null
  notes: string | null
  isApproved: boolean
  approvedBy: string | null
  approvedAt: string | null
  approvalNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface EventExpense {
  id: string
  eventId: string
  budgetItemId: string | null
  description: string
  amount: string
  category: BudgetCategory
  vendor: string | null
  receiptPath: string | null
  paymentMethod: PaymentMethod
  paymentDate: string
  isReimbursable: boolean
  status: ExpenseStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface EventFeedback {
  id: string
  eventId: string
  rating: number
  overallSatisfaction: number
  contentQuality: number | null
  venueQuality: number | null
  foodQuality: number | null
  organization: number | null
  positiveAspects: string | null
  areasForImprovement: string | null
  suggestions: string | null
  wouldAttendAgain: boolean
  wouldRecommend: boolean
  additionalComments: string | null
  anonymous: boolean
  createdAt: string
  updatedAt: string
}

export interface EventAnalytics {
  rsvpRate: number
  checkInRate: number
  feedbackRate: number
  averageRating: number
  totalBudget: number
  totalExpenses: number
  budgetUtilization: number
  budgetVariance: number
  costPerAttendee: number
  totalGuests: number
  totalAttendees: number
  acceptedInvitations: number
  declinedInvitations: number
  pendingInvitations: number
}

export interface EventReport {
  id: string
  eventId: string
  reportType: ReportType
  generatedBy: string
  generatedAt: string
  totalAttendees: number
  rsvpRate: string
  checkInRate: string
  averageRating: string
  totalBudget: string
  totalExpenses: string
  budgetVariance: string
  costPerAttendee: string
  summary: string
  keyMetrics: any
  recommendations: string
  reportData: any
  createdAt: string
  updatedAt: string
}

export const eventsApi = {
  // Event Management
  getAll: async (): Promise<ApiResponse<AppEvent[]>> => {
    return apiClient.get<ApiResponse<AppEvent[]>>('/events')
  },
  
  getUpcoming: async (): Promise<ApiResponse<AppEvent[]>> => {
    return apiClient.get<ApiResponse<AppEvent[]>>('/events/upcoming')
  },
  
  getById: async (id: string): Promise<ApiResponse<AppEvent>> => {
    return apiClient.get<ApiResponse<AppEvent>>(`/events/${id}`)
  },
  
  create: async (data: {
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
  }): Promise<ApiResponse<AppEvent>> => {
    return apiClient.post<ApiResponse<AppEvent>>('/events', data)
  },
  
  update: async (id: string, data: Partial<{
    title: string
    description: string
    startDate: string
    endDate: string
    location: string
    eventType: EventType
    maxAttendees: number
    isPublic: boolean
    requiresRSVP: boolean
    rsvpDeadline: string
    estimatedBudget: number
    checkInRequired: boolean
    feedbackRequired: boolean
  }>): Promise<ApiResponse<AppEvent>> => {
    return apiClient.put<ApiResponse<AppEvent>>(`/events/${id}`, data)
  },
  
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/events/${id}`)
  },

  // Guest Management
  getGuests: async (eventId: string, page = 1, limit = 10): Promise<ApiResponse<EventGuest[]> & { pagination?: any }> => {
    return apiClient.get<ApiResponse<EventGuest[]>>(`/events/${eventId}/guests?page=${page}&limit=${limit}`)
  },
  
  addGuests: async (eventId: string, guests: Array<{
    email: string
    name: string
    phone?: string
    company?: string
    title?: string
    dietaryRequirements?: string
    accessibilityNeeds?: string
    emergencyContact?: string
    emergencyPhone?: string
  }>): Promise<ApiResponse<EventGuest[]>> => {
    return apiClient.post<ApiResponse<EventGuest[]>>(`/events/${eventId}/guests`, { guests })
  },
  
  checkInGuest: async (eventId: string, guestId: string, notes?: string): Promise<ApiResponse<EventGuest>> => {
    return apiClient.post<ApiResponse<EventGuest>>(`/events/${eventId}/guests/${guestId}/check-in`, { notes })
  },

  // Budget Management
  getBudgetItems: async (eventId: string): Promise<ApiResponse<BudgetItem[]>> => {
    return apiClient.get<ApiResponse<BudgetItem[]>>(`/events/${eventId}/budget-items`)
  },
  
  addBudgetItems: async (eventId: string, budgetItems: Array<{
    category: BudgetCategory
    itemName: string
    description?: string
    estimatedCost: number
    quantity: number
    unit?: string
    vendor?: string
    vendorContact?: string
    notes?: string
  }>): Promise<ApiResponse<BudgetItem[]>> => {
    return apiClient.post<ApiResponse<BudgetItem[]>>(`/events/${eventId}/budget-items`, { budgetItems })
  },
  
  approveBudget: async (eventId: string, approvedBudget: number, notes?: string): Promise<ApiResponse<AppEvent>> => {
    return apiClient.post<ApiResponse<AppEvent>>(`/events/${eventId}/budget/approve`, { approvedBudget, notes })
  },

  // Expense Management
  getExpenses: async (eventId: string): Promise<ApiResponse<EventExpense[]>> => {
    return apiClient.get<ApiResponse<EventExpense[]>>(`/events/${eventId}/expenses`)
  },
  
  addExpense: async (eventId: string, data: {
    description: string
    amount: number
    category: BudgetCategory
    vendor?: string
    vendorId?: string
    budgetItemId?: string
    paymentMethod: PaymentMethod
    paymentDate: string
    isTaxable?: boolean
    isReimbursable?: boolean
    receiptNumber?: string
    currencyId?: string
  }): Promise<ApiResponse<EventExpense>> => {
    return apiClient.post<ApiResponse<EventExpense>>(`/events/${eventId}/expenses`, data)
  },

  // Feedback Management
  getFeedback: async (eventId: string): Promise<ApiResponse<EventFeedback[]>> => {
    return apiClient.get<ApiResponse<EventFeedback[]>>(`/events/${eventId}/feedback`)
  },
  
  submitFeedback: async (eventId: string, data: {
    rating: number
    overallSatisfaction: number
    contentQuality?: number
    venueQuality?: number
    foodQuality?: number
    organization?: number
    positiveAspects?: string
    areasForImprovement?: string
    suggestions?: string
    wouldAttendAgain: boolean
    wouldRecommend: boolean
    additionalComments?: string
    anonymous?: boolean
  }): Promise<ApiResponse<EventFeedback>> => {
    return apiClient.post<ApiResponse<EventFeedback>>(`/events/${eventId}/feedback`, data)
  },

  // Analytics & Reporting
  getAnalytics: async (eventId: string): Promise<ApiResponse<EventAnalytics>> => {
    return apiClient.get<ApiResponse<EventAnalytics>>(`/events/${eventId}/analytics`)
  },
  
  generateReport: async (eventId: string, reportType: ReportType): Promise<ApiResponse<EventReport>> => {
    return apiClient.post<ApiResponse<EventReport>>(`/events/${eventId}/reports`, { reportType })
  },

  // RSVP Management - Public endpoint, no auth required
  respondToRSVP: async (token: string, data: {
    rsvpStatus: 'ACCEPTED' | 'DECLINED' | 'MAYBE'
    notes?: string
  }): Promise<ApiResponse<{
    id: string
    rsvpStatus: string
    rsvpRespondedAt: string
  }>> => {
    // Direct fetch without auth for public RSVP
    const response = await fetch(`http://31.220.82.129:3010/api/events/rsvp/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}


