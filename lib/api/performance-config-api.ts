import { apiClient } from "./api-client"

export type SystemPillarId =
  | "bsc_financial"
  | "bsc_customer_market"
  | "bsc_internal_operations"
  | "bsc_learning_growth_hr"

export interface ScorecardPillar {
  id: string
  canonicalName: string
  displayName: string
  description?: string
  weight: number | null
  strategyId?: string | null
  isSystem?: boolean
}

export interface StrategicTheme {
  id: string
  name: string
  description?: string
  color?: string
  createdAt?: string
  goalCount?: number
}

export interface PerformanceStrategy {
  id: string
  title: string
  periodStart: string
  periodEnd: string
  visionStatement?: string
  pillarWeights?: Record<string, number>
  strategyDocumentUrl?: string | null
  isArchived?: boolean
  metadata?: Record<string, any>
  createdAt?: string
}

export interface VisionStatementResponse {
  visionStatement: string
  strategyId: string | null
}

export interface PillarConfig {
  pillars: ScorecardPillar[]
  visionStatement?: string
  strategyId?: string | null
}

export interface CompanyGoalLineWeight {
  id: string
  title: string
  scorecardWeight: number | null
  weight: number | null
  strategyId: string | null
  departmentName: string | null
  status: "active" | "inactive"
}

export const performanceConfigApi = {
  getVisionStatement: () =>
    apiClient.get<{ success: boolean; data: VisionStatementResponse }>(
      "/performance/config/vision-statement"
    ),

  getPillarConfig: () =>
    apiClient.get<{ success: boolean; data: PillarConfig }>("/performance/config/pillars"),

  getThemes: () =>
    apiClient.get<{ success: boolean; data: StrategicTheme[] }>("/performance/config/themes"),

  createTheme: (data: { name: string; description?: string; color?: string }) =>
    apiClient.post<{ success: boolean; data: StrategicTheme }>(
      "/performance/config/themes",
      data
    ),

  getThemeGoals: (themeId: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(
      `/performance/config/themes/${themeId}/goals`
    ),

  tagGoalsToTheme: (themeId: string, goalIds: string[]) =>
    apiClient.post<{ success: boolean }>(
      `/performance/config/themes/${themeId}/goals`,
      { goalIds }
    ),

  getStrategies: (includeArchived = false) =>
    apiClient.get<{ success: boolean; data: PerformanceStrategy[] }>(
      `/performance/config/strategies?includeArchived=${includeArchived}`
    ),

  getStrategy: (id: string) =>
    apiClient.get<{ success: boolean; data: PerformanceStrategy }>(
      `/performance/config/strategies/${id}`
    ),

  createStrategy: (data: {
    title: string
    periodStart: string
    periodEnd: string
    visionStatement?: string
    pillarWeights?: Record<string, number>
    metadata?: Record<string, any>
  }) =>
    apiClient.post<{ success: boolean; data: PerformanceStrategy }>(
      "/performance/config/strategies",
      data
    ),

  updateStrategy: (id: string, data: Record<string, any>) =>
    apiClient.put<{ success: boolean; data: PerformanceStrategy }>(
      `/performance/config/strategies/${id}`,
      data
    ),

  archiveStrategy: (id: string) =>
    apiClient.post<{ success: boolean }>(
      `/performance/config/strategies/${id}/archive`
    ),

  getArchives: () =>
    apiClient.get<{ success: boolean; data: PerformanceStrategy[] }>(
      "/performance/config/strategies/archives"
    ),

  uploadStrategyDocument: (id: string, file: File, strategicGoalId?: string) => {
    const fd = new FormData()
    fd.append("file", file)
    if (strategicGoalId) fd.append("strategicGoalId", strategicGoalId)
    return apiClient.postFormData<{ success: boolean; data: PerformanceStrategy }>(
      `/performance/config/strategies/${id}/document`,
      fd
    )
  },

  updateGoalScorecardMetadata: (goalId: string, data: Record<string, any>) =>
    apiClient.put<{ success: boolean }>(`/performance/config/goals/${goalId}`, data),

  getScorecardPillars: () =>
    apiClient.get<{ success: boolean; data: ScorecardPillar[] }>(
      "/performance/scorecard-pillars"
    ),

  getScorecardPillar: (id: string, params?: { type?: string; status?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : ""
    return apiClient.get<{ success: boolean; data: any }>(
      `/performance/scorecard-pillars/${id}${qs}`
    )
  },

  setPillarWeights: (pillarWeights: Record<string, number>) =>
    apiClient.put<{ success: boolean }>("/performance/scorecard-pillars/weights", {
      pillarWeights,
    }),

  updateScorecardPillar: (
    id: string,
    data: { displayName?: string; description?: string; canonicalName?: string }
  ) => apiClient.put<{ success: boolean }>(`/performance/scorecard-pillars/${id}`, data),

  deleteScorecardPillar: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/performance/scorecard-pillars/${id}`),

  getCompanyGoalLineWeights: (pillarId: string) =>
    apiClient.get<{ success: boolean; data: { goals: CompanyGoalLineWeight[] } }>(
      `/performance/scorecard-pillars/${pillarId}/company-goal-line-weights`
    ),

  setCompanyGoalLineWeights: (pillarId: string, goalWeights: Record<string, number>) =>
    apiClient.put<{ success: boolean }>(
      `/performance/scorecard-pillars/${pillarId}/company-goal-weights`,
      { goalWeights }
    ),
}
