import { apiClient } from "./api-client"

// ─── Response wrapper ────────────────────────────────────────────────────────
interface ForecastingResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

// ─── Core Types ──────────────────────────────────────────────────────────────
export interface ForecastDimension {
  type: "ACCOUNT" | "PORTFOLIO_CO" | "REGION" | "DEPT"
  value_id: string
  display_name?: string
}

export interface ForecastScenario {
  id: string
  name: string
  description?: string
  entity_id: string
  entity_name?: string
  fund_id?: string
  fund_name?: string
  base_currency: string
  granularity: "MONTHLY" | "QUARTERLY" | "ANNUALLY"
  horizon_start_date: string
  horizon_end_date: string
  status: "DRAFT" | "ACTIVE" | "LOCKED" | "ARCHIVED"
  version_label?: string | null
  driver_count?: number
  cell_count?: number
  created_by?: string
  created_by_name?: string
  updated_by?: string
  created_at?: string
  updated_at: string
  dimensions?: ForecastDimension[]
  entity?: { id: string; name: string; type: string }
}

export interface ForecastDriver {
  driver_id?: string
  scenario_id?: string
  target_account_range_start: number
  target_account_range_end: number
  driver_type: "LINEAR_TREND" | "EXPONENTIAL" | "CAGR_DRIVEN" | "CUSTOM_FORMULA"
  formula_expression?: string
  parameters: Record<string, any>
  updated_at?: string
}

export interface ForecastCell {
  period_key: string
  amount: number
  actual_value?: number | null
  variance?: number | null
  variance_pct?: number | null
  currency_code: string
  is_manual_override?: boolean
  is_dirty?: boolean
  projected_exchange_rate?: number
  amount_base_currency_equivalent?: number
}

export interface ForecastGridRow {
  account_id: string
  account_name: string
  account_code?: string
  account_type?: string
  parent_id?: string | null
  is_group?: boolean
  cells: Record<string, ForecastCell>
}

export interface ForecastGridResponse {
  rows: ForecastGridRow[]
  periods: string[]
  scenario_id: string
  include_actuals: boolean
  include_variance: boolean
}

export interface ForecastEntity {
  id: string
  name: string
  type: "INTERNAL_SUBSIDIARY" | "EXTERNAL_STARTUP"
  is_default: boolean
  account_count: number
  scenario_count: number
}

export interface ForecastChartOfAccount {
  id: string
  account_no: string
  account_name: string
  account_type: string
  natural_balance?: string
  financial_statement?: string
  notes?: string | null
  parent_id?: string | null
  is_active: boolean
  source_account_id?: string | null
}

export interface ForecastVersion {
  id: string
  version_label: string
  locked_at: string
  locked_by: string
  locked_by_name?: string
  scenario_id: string
}

export interface ForecastAuditEntry {
  id: string
  action_type: string
  scenario_id: string
  scenario_name?: string
  user_id: string
  user_name?: string
  timestamp: string
  delta_payload?: any
  priority?: "HIGH" | "NORMAL" | "LOW"
}

export interface ForecastCounts {
  draft: number
  active: number
  locked: number
  archived?: number
  total: number
}

export interface ForecastSummary {
  scenario_id: string
  total_forecast_value: number
  total_actual_value?: number
  total_variance?: number
  periods_covered: number
  last_computed_at?: string
  cells_count?: number
  base_currency: string
}

export interface GoalLink {
  id: string
  scenarioId: string
  performanceGoalId: string
  accountId?: string | null
  thresholdValue?: string | number | null
  createdAt?: string | null
  performanceGoal?: {
    id: string
    title: string
    targetValue?: string | number | null
    currentValue?: string | number | null
  } | null
}

export interface ComputeJob {
  compute_job_id: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
  updated_cells?: number
  duration_ms?: number
  error?: string
  created_at?: string
  completed_at?: string
}

// ─── Create Scenario Payload ──────────────────────────────────────────────────
export interface CreateScenarioPayload {
  name: string
  description?: string
  entity_id: string
  fund_id?: string
  base_currency: string
  granularity: "MONTHLY" | "QUARTERLY" | "ANNUALLY"
  horizon_start_date: string
  horizon_end_date: string
  dimensions?: { type: string; value_id: string }[]
}

// ─── Service Class ────────────────────────────────────────────────────────────
class ForecastingApiService {
  // ── Scenarios ──────────────────────────────────────────────────────────────
  async listScenarios(params?: {
    status?: string
    page?: number
    limit?: number
    sort?: string
  }): Promise<ForecastingResponse<{ scenarios: ForecastScenario[]; total: number; page: number; limit: number }>> {
    const q = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.append(k, String(v))
      })
    }
    const qs = q.toString()
    return apiClient.get(`/forecasting/scenarios${qs ? `?${qs}` : ""}`)
  }

  async getScenarioCounts(): Promise<ForecastingResponse<ForecastCounts>> {
    return apiClient.get("/forecasting/scenarios/counts")
  }

  async getScenario(id: string): Promise<ForecastingResponse<ForecastScenario>> {
    return apiClient.get(`/forecasting/scenarios/${id}`)
  }

  async createScenario(data: CreateScenarioPayload): Promise<ForecastingResponse<{ scenario_id: string; lifecycle_state: string; total_allocated_cells: number; msg: string }>> {
    return apiClient.post("/forecasting/scenarios", data)
  }

  async updateScenario(id: string, data: Partial<ForecastScenario>): Promise<ForecastingResponse<ForecastScenario>> {
    return apiClient.patch(`/forecasting/scenarios/${id}`, data)
  }

  async getScenarioSummary(id: string): Promise<ForecastingResponse<ForecastSummary>> {
    return apiClient.get(`/forecasting/scenarios/${id}/summary`)
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  async getScenarioGrid(
    id: string,
    params?: {
      period_start?: string
      period_end?: string
      include_actuals?: boolean
      include_variance?: boolean
    }
  ): Promise<ForecastingResponse<ForecastGridResponse>> {
    const q = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v))
      })
    }
    const qs = q.toString()
    return apiClient.get(`/forecasting/scenarios/${id}/grid${qs ? `?${qs}` : ""}`)
  }

  // ── Drivers ────────────────────────────────────────────────────────────────
  async updateDrivers(
    id: string,
    drivers: Omit<ForecastDriver, "driver_id" | "scenario_id" | "updated_at">[]
  ): Promise<ForecastingResponse<{ status: string; scenario_id: string; cells_updated: number; execution_duration_ms: number }>> {
    return apiClient.put(`/forecasting/scenarios/${id}/drivers`, { drivers })
  }

  // ── Cells ──────────────────────────────────────────────────────────────────
  async editCell(
    id: string,
    data: { period_key: string; account_id: string; new_value: number; tx_currency: string }
  ): Promise<ForecastingResponse<any>> {
    return apiClient.patch(`/forecasting/scenarios/${id}/cells`, data)
  }

  async batchEditCells(
    id: string,
    data: {
      atomic?: boolean
      edits: Array<{ period_key: string; account_id: string; new_value: number; tx_currency: string }>
    }
  ): Promise<ForecastingResponse<any>> {
    return apiClient.patch(`/forecasting/scenarios/${id}/cells/batch`, data)
  }

  async clearCellOverride(
    id: string,
    period_key: string,
    account_id: string
  ): Promise<ForecastingResponse<any>> {
    const q = new URLSearchParams({ period_key, account_id })
    return apiClient.delete(`/forecasting/scenarios/${id}/cells/override?${q}`)
  }

  // ── Lock / Versions ────────────────────────────────────────────────────────
  async lockScenario(id: string, version_label: string): Promise<ForecastingResponse<any>> {
    return apiClient.post(`/forecasting/scenarios/${id}/lock`, { version_label })
  }

  async listVersions(id: string): Promise<ForecastingResponse<ForecastVersion[]>> {
    return apiClient.get(`/forecasting/scenarios/${id}/versions`)
  }

  async compareVersions(id: string, version_a: string, version_b: string): Promise<ForecastingResponse<any>> {
    const q = new URLSearchParams({ version_a, version_b })
    return apiClient.get(`/forecasting/scenarios/${id}/versions/compare?${q}`)
  }

  async getVersion(id: string, versionId: string): Promise<ForecastingResponse<any>> {
    return apiClient.get(`/forecasting/scenarios/${id}/versions/${versionId}`)
  }

  async duplicateVersion(id: string, versionId: string, name: string): Promise<ForecastingResponse<{ id: string; status: string }>> {
    return apiClient.post(`/forecasting/scenarios/${id}/versions/${versionId}/duplicate`, { name })
  }

  // ── Audit ──────────────────────────────────────────────────────────────────
  async getScenarioAudit(id: string): Promise<ForecastingResponse<ForecastAuditEntry[]>> {
    return apiClient.get(`/forecasting/scenarios/${id}/audit`)
  }

  async getAuditFeed(): Promise<ForecastingResponse<ForecastAuditEntry[]>> {
    return apiClient.get("/forecasting/audit")
  }

  async getHighPriorityAudit(): Promise<ForecastingResponse<ForecastAuditEntry[]>> {
    return apiClient.get("/forecasting/audit/high-priority")
  }

  // ── Goal Links ─────────────────────────────────────────────────────────────
  async getGoalLinks(id: string): Promise<ForecastingResponse<GoalLink[]>> {
    return apiClient.get(`/forecasting/scenarios/${id}/goal-links`)
  }

  async createGoalLink(
    id: string,
    data: { performance_goal_id: string; account_id?: string; threshold_value?: number }
  ): Promise<ForecastingResponse<GoalLink>> {
    return apiClient.post(`/forecasting/scenarios/${id}/goal-links`, data)
  }

  async deleteGoalLink(id: string, linkId: string): Promise<ForecastingResponse<any>> {
    return apiClient.delete(`/forecasting/scenarios/${id}/goal-links/${linkId}`)
  }

  // ── Compute Engine ─────────────────────────────────────────────────────────
  async triggerCompute(data: {
    scenario_id: string
    edit_type?: string
    options?: { include_elapsed_variance?: boolean; skip_manual_overrides?: boolean }
  }): Promise<ForecastingResponse<ComputeJob>> {
    return apiClient.post("/v1/forecasting/compute", data)
  }

  async validateFormula(expression: string): Promise<ForecastingResponse<{ valid: boolean; error?: string }>> {
    return apiClient.post("/v1/forecasting/compute/validate", { expression })
  }

  async getComputeJob(computeJobId: string): Promise<ForecastingResponse<ComputeJob>> {
    return apiClient.get(`/v1/forecasting/compute/${computeJobId}`)
  }

  // ── Entities ───────────────────────────────────────────────────────────────
  async listEntities(): Promise<ForecastingResponse<ForecastEntity[]>> {
    return apiClient.get("/forecasting/entities")
  }

  async getEntity(entityId: string): Promise<ForecastingResponse<ForecastEntity & { company_profile_id?: string }>> {
    return apiClient.get(`/forecasting/entities/${entityId}`)
  }

  async createEntity(data: {
    name: string
    type: "INTERNAL_SUBSIDIARY" | "EXTERNAL_STARTUP"
    base_currency?: string
    clone_from_entity_id?: string
  }): Promise<ForecastingResponse<ForecastEntity>> {
    return apiClient.post("/forecasting/entities", data)
  }

  async getEntityChartOfAccounts(entityId: string, params?: {
    account_type?: string
    is_active?: boolean
    for_posting?: boolean
  }): Promise<ForecastingResponse<ForecastChartOfAccount[]>> {
    const q = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v))
      })
    }
    const qs = q.toString()
    return apiClient.get(`/forecasting/entities/${entityId}/chart-of-accounts${qs ? `?${qs}` : ""}`)
  }

  async resyncEntityCoa(entityId: string): Promise<ForecastingResponse<{ entity_id: string; accounts_added: number; accounts_updated: number }>> {
    return apiClient.post(`/forecasting/entities/${entityId}/resync-coa`, {})
  }

  async triggerGlSync(data: { scenario_id?: string }): Promise<ForecastingResponse<any>> {
    return apiClient.post("/cron/forecasting/gl-sync", data)
  }
}

export const forecastingApi = new ForecastingApiService()
