import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  forecastingApi,
  type ForecastScenario,
  type ForecastGridRow,
  type ForecastDriver,
  type ForecastVersion,
  type ForecastAuditEntry,
  type ForecastEntity,
  type ForecastChartOfAccount,
  type ForecastCounts,
  type ForecastSummary,
  type ComputeJob,
  type GoalLink,
  type CreateScenarioPayload,
} from "@/lib/api/forecasting-api"

// ─── State ────────────────────────────────────────────────────────────────────
interface ForecastingState {
  // List
  scenarios: ForecastScenario[]
  scenariosLoading: boolean
  scenariosError: string | null
  scenariosPagination: { page: number; limit: number; total: number }
  statusFilter: "DRAFT" | "ACTIVE" | "LOCKED" | "ARCHIVED" | null

  // Counts
  counts: ForecastCounts | null
  countsLoading: boolean

  // Selected scenario
  selectedScenario: ForecastScenario | null
  selectedScenarioLoading: boolean
  selectedScenarioError: string | null

  // Summary
  scenarioSummary: ForecastSummary | null
  summaryLoading: boolean

  // Grid
  gridRows: ForecastGridRow[]
  gridPeriods: string[]
  gridLoading: boolean
  gridPeriodStart: string
  gridPeriodEnd: string
  gridIncludeVariance: boolean
  gridIncludeActuals: boolean

  // Drivers
  driversLoading: boolean
  driversSaving: boolean
  driversError: string | null

  // Versions
  versions: ForecastVersion[]
  versionsLoading: boolean

  // Audit
  auditLogs: ForecastAuditEntry[]
  auditLoading: boolean
  highPriorityAudit: ForecastAuditEntry[]
  highPriorityLoading: boolean

  // Entities
  entities: ForecastEntity[]
  entitiesLoading: boolean

  // Entity COA
  entityCoa: ForecastChartOfAccount[]
  entityCoaLoading: boolean

  // Goal Links
  goalLinks: GoalLink[]
  goalLinksLoading: boolean
  goalLinkSaving: boolean

  // Compute
  computeJob: ComputeJob | null
  computeStatus: "idle" | "running" | "done" | "error"

  // UI
  createModalOpen: boolean
  lockModalOpen: boolean
  driversModalOpen: boolean
  createLoading: boolean
  createError: string | null
  lockLoading: boolean
}

const initialState: ForecastingState = {
  scenarios: [],
  scenariosLoading: false,
  scenariosError: null,
  scenariosPagination: { page: 1, limit: 20, total: 0 },
  statusFilter: null,
  counts: null,
  countsLoading: false,
  selectedScenario: null,
  selectedScenarioLoading: false,
  selectedScenarioError: null,
  scenarioSummary: null,
  summaryLoading: false,
  gridRows: [],
  gridPeriods: [],
  gridLoading: false,
  gridPeriodStart: "",
  gridPeriodEnd: "",
  gridIncludeVariance: true,
  gridIncludeActuals: true,
  driversLoading: false,
  driversSaving: false,
  driversError: null,
  versions: [],
  versionsLoading: false,
  auditLogs: [],
  auditLoading: false,
  highPriorityAudit: [],
  highPriorityLoading: false,
  entities: [],
  entitiesLoading: false,
  entityCoa: [],
  entityCoaLoading: false,
  goalLinks: [],
  goalLinksLoading: false,
  goalLinkSaving: false,
  computeJob: null,
  computeStatus: "idle",
  createModalOpen: false,
  lockModalOpen: false,
  driversModalOpen: false,
  createLoading: false,
  createError: null,
  lockLoading: false,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchScenarios = createAsyncThunk(
  "forecasting/fetchScenarios",
  async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await forecastingApi.listScenarios(params)
    if (!res.success) throw new Error(res.error || res.message || "Failed to fetch scenarios")
    return res.data
  }
)

export const fetchScenarioCounts = createAsyncThunk("forecasting/fetchScenarioCounts", async () => {
  const res = await forecastingApi.getScenarioCounts()
  if (!res.success) throw new Error(res.error || "Failed to fetch counts")
  return res.data
})

export const fetchScenario = createAsyncThunk("forecasting/fetchScenario", async (id: string) => {
  const res = await forecastingApi.getScenario(id)
  if (!res.success) throw new Error(res.error || "Failed to fetch scenario")
  return res.data
})

export const createScenario = createAsyncThunk(
  "forecasting/createScenario",
  async (data: CreateScenarioPayload) => {
    const res = await forecastingApi.createScenario(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create scenario")
    return res.data
  }
)

export const updateScenario = createAsyncThunk(
  "forecasting/updateScenario",
  async ({ id, data }: { id: string; data: Partial<ForecastScenario> }) => {
    const res = await forecastingApi.updateScenario(id, data)
    if (!res.success) throw new Error(res.error || "Failed to update scenario")
    return res.data
  }
)

export const fetchScenarioSummary = createAsyncThunk(
  "forecasting/fetchScenarioSummary",
  async (id: string) => {
    const res = await forecastingApi.getScenarioSummary(id)
    if (!res.success) throw new Error(res.error || "Failed to fetch summary")
    return res.data
  }
)

export const fetchScenarioGrid = createAsyncThunk(
  "forecasting/fetchScenarioGrid",
  async ({
    id,
    params,
  }: {
    id: string
    params?: { period_start?: string; period_end?: string; include_actuals?: boolean; include_variance?: boolean }
  }) => {
    const res = await forecastingApi.getScenarioGrid(id, params)
    if (!res.success) throw new Error(res.error || "Failed to fetch grid")
    return res.data
  }
)

export const updateDrivers = createAsyncThunk(
  "forecasting/updateDrivers",
  async ({ id, drivers }: { id: string; drivers: Omit<ForecastDriver, "driver_id" | "scenario_id" | "updated_at">[] }) => {
    const res = await forecastingApi.updateDrivers(id, drivers)
    if (!res.success) throw new Error(res.error || "Failed to update drivers")
    return res.data
  }
)

export const editCell = createAsyncThunk(
  "forecasting/editCell",
  async ({ id, data }: { id: string; data: { period_key: string; account_id: string; new_value: number; tx_currency: string } }) => {
    const res = await forecastingApi.editCell(id, data)
    if (!res.success) throw new Error(res.error || "Failed to edit cell")
    return res.data
  }
)

export const batchEditCells = createAsyncThunk(
  "forecasting/batchEditCells",
  async ({
    id,
    data,
  }: {
    id: string
    data: { atomic?: boolean; edits: Array<{ period_key: string; account_id: string; new_value: number; tx_currency: string }> }
  }) => {
    const res = await forecastingApi.batchEditCells(id, data)
    if (!res.success) throw new Error(res.error || "Failed to batch edit cells")
    return res.data
  }
)

export const lockScenario = createAsyncThunk(
  "forecasting/lockScenario",
  async ({ id, version_label }: { id: string; version_label: string }) => {
    const res = await forecastingApi.lockScenario(id, version_label)
    if (!res.success) throw new Error(res.error || res.message || "Failed to lock scenario")
    return res.data
  }
)

export const fetchVersions = createAsyncThunk("forecasting/fetchVersions", async (id: string) => {
  const res = await forecastingApi.listVersions(id)
  if (!res.success) throw new Error(res.error || "Failed to fetch versions")
  return res.data
})

export const duplicateVersion = createAsyncThunk(
  "forecasting/duplicateVersion",
  async ({ id, versionId, name }: { id: string; versionId: string; name: string }) => {
    const res = await forecastingApi.duplicateVersion(id, versionId, name)
    if (!res.success) throw new Error(res.error || "Failed to duplicate version")
    return res.data
  }
)

export const fetchScenarioAudit = createAsyncThunk("forecasting/fetchScenarioAudit", async (id: string) => {
  const res = await forecastingApi.getScenarioAudit(id)
  if (!res.success) throw new Error(res.error || "Failed to fetch audit")
  return res.data
})

export const fetchAuditFeed = createAsyncThunk("forecasting/fetchAuditFeed", async () => {
  const res = await forecastingApi.getAuditFeed()
  if (!res.success) throw new Error(res.error || "Failed to fetch audit feed")
  return res.data
})

export const fetchHighPriorityAudit = createAsyncThunk("forecasting/fetchHighPriorityAudit", async () => {
  const res = await forecastingApi.getHighPriorityAudit()
  if (!res.success) throw new Error(res.error || "Failed to fetch high priority audit")
  return res.data
})

export const fetchEntities = createAsyncThunk("forecasting/fetchEntities", async () => {
  const res = await forecastingApi.listEntities()
  if (!res.success) throw new Error(res.error || "Failed to fetch entities")
  return res.data
})

export const triggerCompute = createAsyncThunk(
  "forecasting/triggerCompute",
  async (data: { scenario_id: string; edit_type?: string; options?: any }) => {
    const res = await forecastingApi.triggerCompute(data)
    if (!res.success) throw new Error(res.error || "Failed to trigger compute")
    return res.data
  }
)

export const createEntity = createAsyncThunk(
  "forecasting/createEntity",
  async (data: { name: string; type: "INTERNAL_SUBSIDIARY" | "EXTERNAL_STARTUP"; base_currency?: string; clone_from_entity_id?: string }) => {
    const res = await forecastingApi.createEntity(data)
    if (!res.success) throw new Error(res.error || res.message || "Failed to create entity")
    return res.data
  }
)

export const resyncEntityCoa = createAsyncThunk("forecasting/resyncEntityCoa", async (entityId: string) => {
  const res = await forecastingApi.resyncEntityCoa(entityId)
  if (!res.success) throw new Error(res.error || "Failed to resync COA")
  return res.data
})

export const triggerGlSync = createAsyncThunk(
  "forecasting/triggerGlSync",
  async (data: { scenario_id?: string }) => {
    const res = await forecastingApi.triggerGlSync(data)
    if (!res.success) throw new Error(res.error || "Failed to trigger GL sync")
    return res.data
  }
)

export const fetchEntityCoa = createAsyncThunk("forecasting/fetchEntityCoa", async (entityId: string) => {
  const res = await forecastingApi.getEntityChartOfAccounts(entityId)
  if (!res.success) throw new Error(res.error || "Failed to fetch chart of accounts")
  return res.data
})

export const fetchGoalLinks = createAsyncThunk("forecasting/fetchGoalLinks", async (id: string) => {
  const res = await forecastingApi.getGoalLinks(id)
  if (!res.success) throw new Error(res.error || "Failed to fetch goal links")
  return res.data
})

export const createGoalLink = createAsyncThunk(
  "forecasting/createGoalLink",
  async ({ id, data }: { id: string; data: { performance_goal_id: string; account_id?: string; threshold_value?: number } }) => {
    const res = await forecastingApi.createGoalLink(id, data)
    if (!res.success) throw new Error(res.error || "Failed to create goal link")
    return res.data
  }
)

export const deleteGoalLink = createAsyncThunk(
  "forecasting/deleteGoalLink",
  async ({ id, linkId }: { id: string; linkId: string }) => {
    const res = await forecastingApi.deleteGoalLink(id, linkId)
    if (!res.success) throw new Error(res.error || "Failed to delete goal link")
    return linkId
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const forecastingSlice = createSlice({
  name: "forecasting",
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<ForecastingState["statusFilter"]>) => {
      state.statusFilter = action.payload
      state.scenariosPagination.page = 1
    },
    setCreateModalOpen: (state, action: PayloadAction<boolean>) => {
      state.createModalOpen = action.payload
      if (!action.payload) state.createError = null
    },
    setLockModalOpen: (state, action: PayloadAction<boolean>) => {
      state.lockModalOpen = action.payload
    },
    setDriversModalOpen: (state, action: PayloadAction<boolean>) => {
      state.driversModalOpen = action.payload
    },
    setGridPeriodStart: (state, action: PayloadAction<string>) => {
      state.gridPeriodStart = action.payload
    },
    setGridPeriodEnd: (state, action: PayloadAction<string>) => {
      state.gridPeriodEnd = action.payload
    },
    setGridIncludeVariance: (state, action: PayloadAction<boolean>) => {
      state.gridIncludeVariance = action.payload
    },
    setGridIncludeActuals: (state, action: PayloadAction<boolean>) => {
      state.gridIncludeActuals = action.payload
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.scenariosPagination.page = action.payload
    },
    clearErrors: (state) => {
      state.scenariosError = null
      state.selectedScenarioError = null
      state.driversError = null
      state.createError = null
    },
    clearSelectedScenario: (state) => {
      state.selectedScenario = null
      state.scenarioSummary = null
      state.gridRows = []
      state.gridPeriods = []
      state.versions = []
      state.auditLogs = []
      state.goalLinks = []
    },
    clearEntityCoa: (state) => {
      state.entityCoa = []
    },
  },
  extraReducers: (builder) => {
    // fetchScenarios
    builder
      .addCase(fetchScenarios.pending, (state) => {
        state.scenariosLoading = true
        state.scenariosError = null
      })
      .addCase(fetchScenarios.fulfilled, (state, action) => {
        state.scenariosLoading = false
        const payload = action.payload as any
        state.scenarios = payload?.items ?? payload?.scenarios ?? (Array.isArray(payload) ? payload : [])
        state.scenariosPagination.total = payload?.pagination?.total ?? payload?.total ?? state.scenarios.length
      })
      .addCase(fetchScenarios.rejected, (state, action) => {
        state.scenariosLoading = false
        state.scenariosError = action.error.message || "Failed to fetch scenarios"
      })

    // fetchScenarioCounts
    builder
      .addCase(fetchScenarioCounts.pending, (state) => { state.countsLoading = true })
      .addCase(fetchScenarioCounts.fulfilled, (state, action) => {
        state.countsLoading = false
        state.counts = (action.payload as ForecastCounts) ?? null
      })
      .addCase(fetchScenarioCounts.rejected, (state) => { state.countsLoading = false })

    // fetchScenario
    builder
      .addCase(fetchScenario.pending, (state) => {
        state.selectedScenarioLoading = true
        state.selectedScenarioError = null
      })
      .addCase(fetchScenario.fulfilled, (state, action) => {
        state.selectedScenarioLoading = false
        // Detail endpoint returns camelCase; normalise to snake_case
        const p = action.payload as any
        state.selectedScenario = p ? {
          ...p,
          entity_id: p.entity_id ?? p.entityId,
          fund_id: p.fund_id ?? p.fundId,
          base_currency: p.base_currency ?? p.baseCurrency,
          horizon_start_date: (p.horizon_start_date ?? p.horizonStartDate ?? "").slice(0, 10),
          horizon_end_date: (p.horizon_end_date ?? p.horizonEndDate ?? "").slice(0, 10),
          granularity: p.granularity,
          status: p.status,
          version_label: p.version_label ?? p.versionLabel,
          created_at: p.created_at ?? p.createdAt,
          updated_at: p.updated_at ?? p.updatedAt,
          created_by: p.created_by ?? p.createdById,
        } : null
      })
      .addCase(fetchScenario.rejected, (state, action) => {
        state.selectedScenarioLoading = false
        state.selectedScenarioError = action.error.message || "Failed to load scenario"
      })

    // createScenario
    builder
      .addCase(createScenario.pending, (state) => {
        state.createLoading = true
        state.createError = null
      })
      .addCase(createScenario.fulfilled, (state) => {
        state.createLoading = false
        state.createModalOpen = false
      })
      .addCase(createScenario.rejected, (state, action) => {
        state.createLoading = false
        state.createError = action.error.message || "Failed to create scenario"
      })

    // updateScenario
    builder
      .addCase(updateScenario.fulfilled, (state, action) => {
        const updated = action.payload as ForecastScenario
        if (updated) {
          state.scenarios = state.scenarios.map((s) => (s.id === updated.id ? updated : s))
          if (state.selectedScenario?.id === updated.id) state.selectedScenario = updated
        }
      })

    // fetchScenarioSummary
    builder
      .addCase(fetchScenarioSummary.pending, (state) => { state.summaryLoading = true })
      .addCase(fetchScenarioSummary.fulfilled, (state, action) => {
        state.summaryLoading = false
        state.scenarioSummary = (action.payload as ForecastSummary) ?? null
      })
      .addCase(fetchScenarioSummary.rejected, (state) => { state.summaryLoading = false })

    // fetchScenarioGrid
    builder
      .addCase(fetchScenarioGrid.pending, (state) => { state.gridLoading = true })
      .addCase(fetchScenarioGrid.fulfilled, (state, action) => {
        state.gridLoading = false
        const payload = action.payload as any
        const flatRows: any[] = payload?.rows ?? []

        // API returns flat rows (one per account+period). Pivot into grouped rows.
        const periodsSet = new Set<string>()
        const accountMap: Record<string, ForecastGridRow> = {}

        flatRows.forEach((row: any) => {
          periodsSet.add(row.period_key)
          if (!accountMap[row.account_id]) {
            accountMap[row.account_id] = {
              account_id: row.account_id,
              account_name: row.account_name,
              account_code: row.account_no ?? row.account_code,
              cells: {},
            }
          }
          accountMap[row.account_id].cells[row.period_key] = {
            period_key: row.period_key,
            amount: parseFloat(row.forecast_value ?? row.amount) || 0,
            actual_value: row.actual_value != null ? parseFloat(row.actual_value) : undefined,
            variance: row.variance_absolute != null ? parseFloat(row.variance_absolute) : undefined,
            variance_pct: row.variance_percent != null ? parseFloat(row.variance_percent) : undefined,
            currency_code: row.tx_currency ?? payload?.base_currency ?? "ZIG",
            is_manual_override: row.is_manual_override ?? false,
          }
        })

        state.gridRows = Object.values(accountMap)
        state.gridPeriods = Array.from(periodsSet).sort()
      })
      .addCase(fetchScenarioGrid.rejected, (state) => { state.gridLoading = false })

    // updateDrivers
    builder
      .addCase(updateDrivers.pending, (state) => { state.driversSaving = true; state.driversError = null })
      .addCase(updateDrivers.fulfilled, (state) => { state.driversSaving = false; state.driversModalOpen = false })
      .addCase(updateDrivers.rejected, (state, action) => {
        state.driversSaving = false
        state.driversError = action.error.message || "Failed to save drivers"
      })

    // lockScenario
    builder
      .addCase(lockScenario.pending, (state) => { state.lockLoading = true })
      .addCase(lockScenario.fulfilled, (state) => {
        state.lockLoading = false
        state.lockModalOpen = false
        if (state.selectedScenario) state.selectedScenario.status = "LOCKED"
      })
      .addCase(lockScenario.rejected, (state) => { state.lockLoading = false })

    // fetchVersions
    builder
      .addCase(fetchVersions.pending, (state) => { state.versionsLoading = true })
      .addCase(fetchVersions.fulfilled, (state, action) => {
        state.versionsLoading = false
        const payload = action.payload as any
        state.versions = payload?.items ?? payload?.versions ?? (Array.isArray(payload) ? payload : [])
      })
      .addCase(fetchVersions.rejected, (state) => { state.versionsLoading = false })

    // fetchScenarioAudit
    builder
      .addCase(fetchScenarioAudit.pending, (state) => { state.auditLoading = true })
      .addCase(fetchScenarioAudit.fulfilled, (state, action) => {
        state.auditLoading = false
        const payload = action.payload as any
        const items: any[] = payload?.items ?? (Array.isArray(payload) ? payload : [])
        state.auditLogs = items.map((e) => ({ ...e, timestamp: e.timestamp ?? e.created_at }))
      })
      .addCase(fetchScenarioAudit.rejected, (state) => { state.auditLoading = false })

    // fetchAuditFeed
    builder
      .addCase(fetchAuditFeed.pending, (state) => { state.auditLoading = true })
      .addCase(fetchAuditFeed.fulfilled, (state, action) => {
        state.auditLoading = false
        const payload = action.payload as any
        const items: any[] = payload?.items ?? (Array.isArray(payload) ? payload : [])
        state.auditLogs = items.map((e) => ({ ...e, timestamp: e.timestamp ?? e.created_at }))
      })
      .addCase(fetchAuditFeed.rejected, (state) => { state.auditLoading = false })

    // fetchHighPriorityAudit
    builder
      .addCase(fetchHighPriorityAudit.pending, (state) => { state.highPriorityLoading = true })
      .addCase(fetchHighPriorityAudit.fulfilled, (state, action) => {
        state.highPriorityLoading = false
        const payload = action.payload as any
        const items: any[] = payload?.items ?? (Array.isArray(payload) ? payload : [])
        state.highPriorityAudit = items.map((e) => ({ ...e, timestamp: e.timestamp ?? e.created_at }))
      })
      .addCase(fetchHighPriorityAudit.rejected, (state) => { state.highPriorityLoading = false })

    // fetchEntities
    builder
      .addCase(fetchEntities.pending, (state) => { state.entitiesLoading = true })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.entitiesLoading = false
        const payload = action.payload as any
        state.entities = payload?.items ?? payload?.entities ?? (Array.isArray(payload) ? payload : [])
      })
      .addCase(fetchEntities.rejected, (state) => { state.entitiesLoading = false })

    // triggerCompute
    builder
      .addCase(triggerCompute.pending, (state) => { state.computeStatus = "running" })
      .addCase(triggerCompute.fulfilled, (state, action) => {
        state.computeStatus = "done"
        state.computeJob = (action.payload as ComputeJob) ?? null
      })
      .addCase(triggerCompute.rejected, (state) => { state.computeStatus = "error" })

    // createEntity
    builder
      .addCase(createEntity.fulfilled, (state, action) => {
        if (action.payload) state.entities = [...state.entities, action.payload as ForecastEntity]
      })

    // fetchEntityCoa
    builder
      .addCase(fetchEntityCoa.pending, (state) => { state.entityCoaLoading = true; state.entityCoa = [] })
      .addCase(fetchEntityCoa.fulfilled, (state, action) => {
        state.entityCoaLoading = false
        const payload = action.payload as any
        state.entityCoa = payload?.items ?? (Array.isArray(payload) ? payload : [])
      })
      .addCase(fetchEntityCoa.rejected, (state) => { state.entityCoaLoading = false })

    // fetchGoalLinks
    builder
      .addCase(fetchGoalLinks.pending, (state) => { state.goalLinksLoading = true })
      .addCase(fetchGoalLinks.fulfilled, (state, action) => {
        state.goalLinksLoading = false
        const payload = action.payload as any
        state.goalLinks = payload?.items ?? (Array.isArray(payload) ? payload : [])
      })
      .addCase(fetchGoalLinks.rejected, (state) => { state.goalLinksLoading = false })

    // createGoalLink
    builder
      .addCase(createGoalLink.pending, (state) => { state.goalLinkSaving = true })
      .addCase(createGoalLink.fulfilled, (state, action) => {
        state.goalLinkSaving = false
        if (action.payload) state.goalLinks = [...state.goalLinks, action.payload as GoalLink]
      })
      .addCase(createGoalLink.rejected, (state) => { state.goalLinkSaving = false })

    // deleteGoalLink
    builder
      .addCase(deleteGoalLink.fulfilled, (state, action) => {
        state.goalLinks = state.goalLinks.filter(l => l.id !== action.payload)
      })
  },
})

export const {
  setStatusFilter,
  setCreateModalOpen,
  setLockModalOpen,
  setDriversModalOpen,
  setGridPeriodStart,
  setGridPeriodEnd,
  setGridIncludeVariance,
  setGridIncludeActuals,
  setPage,
  clearErrors,
  clearSelectedScenario,
  clearEntityCoa,
} = forecastingSlice.actions

export default forecastingSlice.reducer
