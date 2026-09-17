import { apiClient } from "./api-client"

/**
 * Backend: nvccz/src/routes/performanceFpaIntegrationRoutes.ts, mounted at
 * /api/performance/fpa-integration. Implements the Performance <-> FP&A
 * integration described in design-refs/fpa-srds/REQUIREMENTS_DIGEST.md §5
 * (SRD-4 §22-25): Target Mapping (direction 1), Driver Mapping + Forecast
 * Review Triggers (direction 2), forecast snapshot (direction 3).
 */

export interface FpaTargetMapping {
  id: string
  kpiId: string
  kpiName: string | null
  modelId: string
  modelName: string | null
  lineItemId: string
  lineItemName: string | null
  lineItemCode: string | null
  targetSourceVersionId: string | null
  targetSourceVersionName: string | null
  targetMappingMethod: string
  isActive: boolean
  createdAt: string
}

export interface FpaDriverMapping {
  id: string
  kpiId: string
  kpiName: string | null
  modelId: string
  modelName: string | null
  lineItemId: string
  lineItemName: string | null
  lineItemCode: string | null
  thresholdPct: string | number
  consecutivePeriods: number
  isActive: boolean
  createdAt: string
}

export interface FpaForecastReviewTrigger {
  id: string
  kpiId: string
  kpiName: string | null
  performanceGoalId: string
  goalTitle: string | null
  kpiOwnerId: string | null
  performancePeriod: string
  targetValue: string | number | null
  actualValue: string | number | null
  achievementPct: string | number | null
  status: string
  driverMappingId: string | null
  currentDriverValue: string | number | null
  triggerReason: string | null
  triggerDate: string
  fpaReviewerId: string | null
  reviewStatus: string | null
  reviewDecision: string | null
  resultingForecastVersionId: string | null
}

export const performanceFpaIntegrationApi = {
  listTargetMappings: (params?: { kpiId?: string; modelId?: string }) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""
    return apiClient.get<{ success: boolean; data: FpaTargetMapping[] }>(`/performance/fpa-integration/target-mappings${qs}`)
  },
  createTargetMapping: (body: {
    kpiId: string
    modelId: string
    lineItemId: string
    targetSourceVersionId?: string
    targetMappingMethod?: string
  }) => apiClient.post<{ success: boolean; data: FpaTargetMapping }>("/performance/fpa-integration/target-mappings", body),
  setTargetMappingActive: (id: string, isActive: boolean) =>
    apiClient.put<{ success: boolean; data: FpaTargetMapping }>(`/performance/fpa-integration/target-mappings/${id}/active`, { isActive }),
  deleteTargetMapping: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/performance/fpa-integration/target-mappings/${id}`),

  listDriverMappings: (params?: { kpiId?: string; modelId?: string }) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""
    return apiClient.get<{ success: boolean; data: FpaDriverMapping[] }>(`/performance/fpa-integration/driver-mappings${qs}`)
  },
  createDriverMapping: (body: {
    kpiId: string
    modelId: string
    lineItemId: string
    thresholdPct?: number
    consecutivePeriods?: number
  }) => apiClient.post<{ success: boolean; data: FpaDriverMapping }>("/performance/fpa-integration/driver-mappings", body),
  setDriverMappingActive: (id: string, isActive: boolean) =>
    apiClient.put<{ success: boolean; data: FpaDriverMapping }>(`/performance/fpa-integration/driver-mappings/${id}/active`, { isActive }),
  deleteDriverMapping: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/performance/fpa-integration/driver-mappings/${id}`),

  listReviewTriggers: (params?: { status?: string; openOnly?: boolean; kpiId?: string }) => {
    const qs = params
      ? `?${new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
        ).toString()}`
      : ""
    return apiClient.get<{ success: boolean; data: FpaForecastReviewTrigger[] }>(`/performance/fpa-integration/review-triggers${qs}`)
  },
  claimReviewTrigger: (id: string) =>
    apiClient.post<{ success: boolean; data: FpaForecastReviewTrigger }>(`/performance/fpa-integration/review-triggers/${id}/claim`, {}),
  decideReviewTrigger: (
    id: string,
    body: { status: string; reviewDecision?: string; resultingForecastVersionId?: string | null },
  ) => apiClient.post<{ success: boolean; data: FpaForecastReviewTrigger }>(`/performance/fpa-integration/review-triggers/${id}/decide`, body),
}
