import { apiClient } from './api-client'

export interface BoardReviewData {
  id: string
  applicationId: string
  reviewerId: string
  investmentApproved
  investmentRejected: boolean
  conditionalApproval: boolean
  recommendationReport: string
  additionalInformation: string | null
  decisionReason: string
  conditions: string | null
  nextSteps: string
  overallScore: string
  finalComments: string
  status: 'IN_PROGRESS' | 'COMPLETED'
  memorandumUrl?: string
  documentUrl?: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  reviewer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  application: {
    id: string
    businessName: string
    applicantName: string
    applicantEmail: string
    currentStage: string
    requestedAmount: string
  }
}

export interface Vote {
  id: string
  userId: string
  userName: string
  vote: 'APPROVE' | 'REJECT'
  comment: string
  votingPower: number
  createdAt: string
}

export interface VoteData {
  id: string
  vote: 'APPROVE' | 'REJECT'
  comment: string
  reviewer: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface VoteSummaryData {
  boardStatus: 'IN_PROGRESS' | 'COMPLETED'
  approvePower: number
  rejectPower: number
  remainingPower: number
  totalConfiguredPower: number
  totalCastPower: number
  majorityDecision: 'APPROVE' | 'REJECT' | 'PENDING' | null
  isVotingComplete: boolean
  votesVisible: boolean
  votes: Vote[]
  userVote: Vote | null
}

export interface BoardReviewCreateRequest {
  investmentApproved: boolean
  investmentRejected: boolean
  conditionalApproval: boolean
  recommendationReport: string
  decisionReason: string
  nextSteps: string
  overallScore: number
  finalComments: string
}

export interface BoardReviewUpdateRequest {
  recommendationReport?: string
  decisionReason?: string
  nextSteps?: string
  overallScore?: number
  finalComments?: string
}

export interface BoardReviewResponse {
  success: boolean
  message: string
  data: BoardReviewData
  timestamp: string
}

class BoardReviewApiService {
  // Create board review with memorandum document
  async create(applicationId: string, document: File): Promise<BoardReviewResponse> {
    const formData = new FormData()
    formData.append('document', document)
    
    return apiClient.post<BoardReviewResponse>(`/board-reviews/${applicationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  }

  // Get board review by application ID
  async getByApplicationId(applicationId: string): Promise<BoardReviewResponse> {
    return apiClient.get<BoardReviewResponse>(`/board-reviews/${applicationId}`)
  }

  // Update board review
  async update(applicationId: string, data: BoardReviewUpdateRequest): Promise<BoardReviewResponse> {
    return apiClient.put<BoardReviewResponse>(`/board-reviews/${applicationId}`, data)
  }

  // Complete board review
  async complete(applicationId: string): Promise<BoardReviewResponse> {
    return apiClient.post<BoardReviewResponse>(`/board-reviews/${applicationId}/complete`, {})
  }

  // Cast a vote on a board review
  async castVote(applicationId: string, data: { vote: 'APPROVE' | 'REJECT'; comment: string }): Promise<any> {
    return apiClient.post(`/board-reviews/${applicationId}/votes`, data)
  }

  // Get vote summary for a board review
  async getVoteSummary(applicationId: string): Promise<{ data: VoteSummaryData }> {
    return apiClient.get(`/board-reviews/${applicationId}/votes/summary`)
  }
}

export const boardReviewApi = new BoardReviewApiService()
