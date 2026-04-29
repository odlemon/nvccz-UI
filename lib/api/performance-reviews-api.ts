"use client"

import { apiClient } from "./api-client"

export type ReviewStage =
  | "self"
  | "external"
  | "hr"
  | "manager"
  | "final"
  | "finalized"
  | "FINALIZED"
  | "DRAFT"

export interface ReviewCycle {
  id: string
  title: string
  startDate: string
  endDate: string
  stageDeadlines?: Record<string, string>
  hasExternalEvaluator?: boolean
  status?: "active" | "closed"
  reviewCount?: number
  createdAt?: string
}

export interface ReviewSummary {
  id: string
  cycleId?: string | null
  cycleTitle?: string
  revieweeId: string
  reviewerId?: string
  employeeId?: string // legacy mapping
  employeeName?: string
  managerId?: string
  managerName?: string
  externalEvaluatorEmail?: string | null
  currentStage: ReviewStage
  stage: string
  status: string
  isLocked: boolean
  dueDate?: string
  updatedAt?: string
  reviewee?: {
    firstName: string
    lastName: string
    email: string
    userDepartment?: string
  }
}

export interface ReviewPillarFeedback {
  pillarId: string
  pillarName?: string
  rating: number
  feedback: string
}

export interface ReviewDetail extends ReviewSummary {
  pillarFeedback?: ReviewPillarFeedback[]
  performanceSnapshot?: any
  history?: Array<{ stage: ReviewStage; submittedAt: string; submittedBy: string }>
}

export interface RatingDistribution {
  rating: 1 | 2 | 3 | 4 | 5
  count: number
}

export const performanceReviewsApi = {
  getCycles: () =>
    apiClient.get<{ success: boolean; data: { cycles: ReviewCycle[] } }>(
      "/performance/review-cycles?isActive=true&page=1&limit=100"
    ),

  createCycle: (data: {
    title: string
    reviewPeriodStart: string
    reviewPeriodEnd: string
    selfAssessmentDeadline?: string
    peerReviewDeadline?: string
    managerReviewDeadline?: string
    availableReviewTypes: string[]
    reviewRatingScale: string
    isActive: boolean
  }) =>
    apiClient.post<{ success: boolean; data: ReviewCycle }>(
      "/performance/review-cycles",
      data
    ),

  // Unified endpoint for reviews as per user feedback
  getReviews: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.append("page", params.page.toString())
    if (params?.limit) qs.append("limit", params.limit.toString())
    
    return apiClient.get<{ success: boolean; data: { reviews: ReviewSummary[] } }>(
      `/performance-reviews?${qs.toString()}`
    )
  },

  getMyReviews: () =>
    apiClient.get<{ success: boolean; data: { reviews: ReviewSummary[] } }>(
      "/performance-reviews?page=1&limit=100"
    ),

  getReviewsToComplete: () =>
    apiClient.get<{ success: boolean; data: { reviews: ReviewSummary[] } }>(
      "/performance-reviews?page=1&limit=100"
    ),

  getReview: (id: string) =>
    apiClient.get<{ success: boolean; data: ReviewDetail }>(
      `/performance-reviews/${id}`
    ),

  submitStage: (
    id: string,
    data: { stage: ReviewStage; pillarFeedback: ReviewPillarFeedback[] }
  ) =>
    apiClient.post<{ success: boolean; data: ReviewDetail }>(
      `/performance-reviews/${id}/submit`,
      data
    ),

  finalizeReview: (id: string) =>
    apiClient.post<{ success: boolean; data: ReviewDetail; pdfUrl?: string }>(
      `/performance-reviews/${id}/finalize`
    ),

  getRatingDistribution: (filters?: { organizationWide?: boolean; departmentName?: string }) => {
    const qs = new URLSearchParams()
    if (filters?.organizationWide !== undefined) qs.append("organizationWide", filters.organizationWide.toString())
    if (filters?.departmentName) qs.append("departmentName", filters.departmentName)
    
    return apiClient.get<{ success: boolean; data: { distribution: RatingDistribution[] } }>(
      `/performance-reviews/reports/rating-distribution?${qs.toString()}`
    )
  },
}
