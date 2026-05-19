import { apiClient, ApiResponse } from './api-client'

export type ValuationType = 'POST_MONEY' | 'PRE_MONEY' | 'FAIR_MARKET_VALUE' | 'BOOK_VALUE' | 'LIQUIDATION'
export type ExitType = 'IPO' | 'ACQUISITION' | 'SECONDARY_SALE' | 'WRITE_OFF' | 'BUYBACK' | 'OTHER'

export interface ValuationEvent {
  id: string
  investmentImplementationId: string
  valuationDate: string
  valuationType: ValuationType
  valuationAmount: string
  currencyId: string
  notes?: string
  currency: { id: string; code: string; symbol: string }
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateValuationRequest {
  valuationDate: string
  valuationType: ValuationType
  valuationAmount: number
  currencyId: string
  notes?: string
}

export interface UpdateValuationRequest {
  valuationDate?: string
  valuationType?: ValuationType
  valuationAmount?: number
  currencyId?: string
  notes?: string
}

export interface ExitRecord {
  id: string
  investmentImplementationId: string
  exitDate: string
  exitType: ExitType
  exitProceedsAmount: string
  totalInvestedBasis: string
  irrAnnualized: string
  roiMultiple: string
  currencyId: string
  notes?: string
  currency: { id: string; code: string; symbol: string }
  recordedBy: { id: string; firstName: string; lastName: string; email: string }
}

export interface ExitPerformance {
  totalInvestedBasis: number
  exitProceedsAmount: number
  irrAnnualized: number
  roiMultiple: number
  disbursementFlowCount: number
}

export interface RecordExitRequest {
  exitDate: string
  exitType: ExitType
  exitProceedsAmount: number
  currencyId: string
  notes?: string
}

class PortfolioMonitoringApiService {
  async listValuations(implementationId: string): Promise<ApiResponse<ValuationEvent[]>> {
    return apiClient.get(`/investments/${implementationId}/valuations`)
  }

  async createValuation(implementationId: string, data: CreateValuationRequest): Promise<ApiResponse<ValuationEvent>> {
    return apiClient.post(`/investments/${implementationId}/valuations`, data)
  }

  async updateValuation(implementationId: string, valuationEventId: string, data: UpdateValuationRequest): Promise<ApiResponse<ValuationEvent>> {
    return apiClient.patch(`/investments/${implementationId}/valuations/${valuationEventId}`, data)
  }

  async deleteValuation(implementationId: string, valuationEventId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/investments/${implementationId}/valuations/${valuationEventId}`)
  }

  async getExit(implementationId: string): Promise<ApiResponse<ExitRecord[]>> {
    return apiClient.get(`/investments/${implementationId}/exit`)
  }

  async recordExit(implementationId: string, data: RecordExitRequest): Promise<ApiResponse<{ exit: ExitRecord; performance: ExitPerformance }>> {
    return apiClient.post(`/investments/${implementationId}/exit`, data)
  }

  async deleteExit(implementationId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/investments/${implementationId}/exit`)
  }
}

export const portfolioMonitoringApi = new PortfolioMonitoringApiService()
