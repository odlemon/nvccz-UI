"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import {
  Archive,
  Database,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sliders,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import {
  fpaApi,
  type ForecastChartAccount,
  type ForecastEntity,
  type FpaSettings as PersistedFpaSettings,
  type FpaSyncSource,
} from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { cn } from "@/lib/utils"

type LocalEntity = ForecastEntity & {
  accountCount: number
}

type SettingsDraft = {
  variance: {
    commentaryThresholdPct: string
    enforceCommentary: boolean
    blockSubmitWithoutCommentary: boolean
  }
  workflow: PersistedFpaSettings["workflow"]
}

function settingsDraft(settings: PersistedFpaSettings): SettingsDraft {
  return {
    variance: {
      ...settings.variance,
      commentaryThresholdPct: String(settings.variance.commentaryThresholdPct),
    },
    workflow: { ...settings.workflow },
  }
}

function replaceSyncSource(
  settings: PersistedFpaSettings,
  source: FpaSyncSource,
): PersistedFpaSettings {
  return {
    ...settings,
    syncSources: settings.syncSources.map((current) =>
      current.id === source.id ? source : current,
    ),
  }
}

function referenceCountLines(references: unknown): string[] {
  if (Array.isArray(references)) {
    return references.map((reference, index) => {
      if (!reference || typeof reference !== "object") return `Reference ${index + 1}: 1`
      const item = reference as Record<string, unknown>
      const label = String(item.label || item.type || item.resource || item.name || `Reference ${index + 1}`)
      const count = Number(item.count ?? item.total ?? 0)
      return `${label}: ${Number.isFinite(count) ? count : 0}`
    })
  }
  if (!references || typeof references !== "object") return []
  return Object.entries(references as Record<string, unknown>).map(([name, value]) => {
    const count =
      typeof value === "number"
        ? value
        : Array.isArray(value)
          ? value.length
          : value && typeof value === "object" && "count" in value
            ? Number((value as { count: unknown }).count)
            : 0
    return `${name}: ${Number.isFinite(count) ? count : 0}`
  })
}

export function FpaSettings() {
  const { canManageSettings } = useFpaPermissions()
  const [activeSection, setActiveSection] = useState<"entities" | "thresholds" | "sync" | "workflow">("entities")

  // Entities state
  const [entities, setEntities] = useState<LocalEntity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [entitiesLoading, setEntitiesLoading] = useState(true)
  const [entitiesError, setEntitiesError] = useState<string | null>(null)
  const [creatingEntity, setCreatingEntity] = useState(false)
  const [entityName, setEntityName] = useState("")
  const [entityCurrency, setEntityCurrency] = useState("USD")
  const [coaSearch, setCoaSearch] = useState("")
  const [coaRows, setCoaRows] = useState<ForecastChartAccount[]>([])
  const [coaLoading, setCoaLoading] = useState(false)
  const [coaError, setCoaError] = useState<string | null>(null)
  const [archiveConfirming, setArchiveConfirming] = useState(false)
  const [archiveReason, setArchiveReason] = useState("")
  const [archivingEntity, setArchivingEntity] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archiveReferences, setArchiveReferences] = useState<string[]>([])

  // Persisted settings state
  const [settings, setSettings] = useState<PersistedFpaSettings | null>(null)
  const [draft, setDraft] = useState<SettingsDraft | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsValidationError, setSettingsValidationError] = useState<string | null>(null)
  const [sourceBusy, setSourceBusy] = useState<Record<string, string>>({})
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({})

  const activeCoa = useMemo(() => {
    const rows = coaRows.map((row) => ({
      code: row.code || row.account_code || "—",
      name: row.name || row.account_name || "Unnamed account",
    }))
    const q = coaSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
    )
  }, [coaRows, coaSearch])

  const loadEntities = useCallback(async () => {
    setEntitiesLoading(true)
    setEntitiesError(null)
    try {
      const res = await fpaApi.listEntities()
      if (!res.success) throw new Error(res.message || "Could not load entities")
      const rows = (res.data || []).map((entity) => ({
        ...entity,
        baseCurrency: entity.baseCurrency || entity.base_currency,
        accountCount: entity.account_count || 0,
      }))
      setEntities(rows)
      setSelectedEntity((current) =>
        current && rows.some((entity) => entity.id === current) ? current : rows[0]?.id || null,
      )
    } catch (err) {
      const message = errorMessage(err)
      setEntities([])
      setSelectedEntity(null)
      setEntitiesError(message)
      logFpaGap({
        category: "broken",
        path: "/forecast-entities",
        method: "GET",
        message,
        impact: "Settings entity list empty",
        response: err,
      })
    } finally {
      setEntitiesLoading(false)
    }
  }, [])

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const res = await fpaApi.getSettings()
      if (!res.success || !res.data) throw new Error(res.message || "Could not load settings")
      setSettings(res.data)
      setDraft(settingsDraft(res.data))
      setSettingsValidationError(null)
      setSourceErrors({})
    } catch (err) {
      setSettings(null)
      setDraft(null)
      setSettingsError(errorMessage(err))
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEntities()
    void loadSettings()
  }, [loadEntities, loadSettings])

  const loadCoa = useCallback(async (entityId: string | null) => {
    if (!entityId) {
      setCoaRows([])
      setCoaError(null)
      return
    }
    setCoaLoading(true)
    setCoaError(null)
    try {
      const res = await fpaApi.getChartOfAccounts(entityId)
      if (!res.success) throw new Error(res.message || "Could not load chart of accounts")
      setCoaRows(res.data || [])
    } catch (err) {
      setCoaRows([])
      setCoaError(errorMessage(err))
    } finally {
      setCoaLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCoa(selectedEntity)
  }, [loadCoa, selectedEntity])

  useEffect(() => {
    setArchiveConfirming(false)
    setArchiveReason("")
    setArchiveError(null)
    setArchiveReferences([])
  }, [selectedEntity])

  const createEntity = async () => {
    if (!entityName.trim() || !canManageSettings) return
    setCreatingEntity(true)
    try {
      const res = await fpaApi.createEntity({
        name: entityName.trim(),
        type: "COMPANY",
        base_currency: entityCurrency,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Could not create entity")
      setEntityName("")
      await loadEntities()
      setSelectedEntity(res.data.id)
      toast.success(`Entity "${res.data.name}" created`)
    } catch (err) {
      toast.error("Could not create entity", { description: errorMessage(err) })
    } finally {
      setCreatingEntity(false)
    }
  }

  const saveSettings = async () => {
    if (!settings || !draft || !canManageSettings) return
    const threshold = Number(draft.variance.commentaryThresholdPct)
    if (
      draft.variance.commentaryThresholdPct.trim() === "" ||
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      setSettingsValidationError("Commentary threshold must be a finite number greater than or equal to 0.")
      return
    }
    setSavingSettings(true)
    setSettingsValidationError(null)
    try {
      const res = await fpaApi.updateSettings({
        variance: { ...draft.variance, commentaryThresholdPct: threshold },
        workflow: { ...draft.workflow },
        syncSources: settings.syncSources,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Could not save settings")
      setSettings(res.data)
      setDraft(settingsDraft(res.data))
      toast.success("FP&A settings saved")
    } catch (err) {
      toast.error("Could not save settings", { description: errorMessage(err) })
    } finally {
      setSavingSettings(false)
    }
  }

  const runSourceAction = async (
    source: FpaSyncSource,
    action: "connect" | "disconnect" | "sync",
  ) => {
    if (!canManageSettings) return
    setSourceBusy((current) => ({ ...current, [source.id]: action }))
    setSourceErrors((current) => {
      const next = { ...current }
      delete next[source.id]
      return next
    })
    try {
      const request =
        action === "connect"
          ? fpaApi.connectSyncSource(source.id)
          : action === "disconnect"
            ? fpaApi.disconnectSyncSource(source.id)
            : fpaApi.syncSyncSource(source.id)
      const res = await request
      if (!res.success || !res.data) throw new Error(res.message || `Could not ${action} source`)
      setSettings((current) => (current ? replaceSyncSource(current, res.data!) : current))
      toast.success(
        action === "sync"
          ? `${res.data.label} synced`
          : `${res.data.label} ${action === "connect" ? "connected" : "disconnected"}`,
      )
    } catch (err) {
      const apiError = err as {
        status?: number
        message?: string
        response?: {
          message?: string
          error?: string
          data?: {
            source?: FpaSyncSource
            code?: string
            message?: string
            error?: string
          }
        }
      }
      const failedSource = apiError.response?.data?.source
      const code = apiError.response?.code || apiError.response?.data?.code
      if (apiError.status === 502 && code === "SYNC_FAILED" && failedSource) {
        setSettings((current) => (current ? replaceSyncSource(current, failedSource) : current))
      }
      const message =
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        apiError.response?.message ||
        apiError.response?.error ||
        apiError.message ||
        "Source action failed"
      setSourceErrors((current) => ({ ...current, [source.id]: message }))
      toast.error(`Could not ${action} ${source.label}`, { description: message })
    } finally {
      setSourceBusy((current) => {
        const next = { ...current }
        delete next[source.id]
        return next
      })
    }
  }

  const archiveSelectedEntity = async () => {
    if (!selectedEntity || !archiveReason.trim() || !canManageSettings) return
    setArchivingEntity(true)
    setArchiveError(null)
    setArchiveReferences([])
    try {
      const res = await fpaApi.archiveEntity(selectedEntity, {
        archive: true,
        reason: archiveReason.trim(),
      })
      if (!res.success) throw new Error(res.message || "Could not archive entity")
      toast.success("Forecast entity archived")
      setArchiveConfirming(false)
      setArchiveReason("")
      await loadEntities()
    } catch (err) {
      const apiError = err as {
        message?: string
        response?: {
          code?: string
          message?: string
          data?: {
            code?: string
            message?: string
            references?: unknown
          }
          references?: unknown
        }
      }
      const payload = apiError.response?.data
      const code = payload?.code || apiError.response?.code
      const message = payload?.message || apiError.response?.message || apiError.message || "Could not archive entity"
      setArchiveError(message)
      if (code === "ENTITY_IN_USE") {
        setArchiveReferences(
          referenceCountLines(payload?.references || apiError.response?.references),
        )
      }
    } finally {
      setArchivingEntity(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Settings" />

      <div className="px-4 sm:px-5 pb-6 w-full flex flex-col md:flex-row gap-5">
        {/* Left Side Navigation Panel */}
        <aside className="w-full md:w-64 shrink-0 rounded-xl border border-[#eaecf0] bg-white p-2 shadow-sm h-fit">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveSection("entities")}
              className={cn(
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-full text-xs font-semibold tracking-wide text-left transition-all",
                activeSection === "entities"
                  ? "bg-[#eff8ff] text-[#175cd3]"
                  : "text-[#475467] hover:bg-[#f9fafb] hover:text-[#101828]",
              )}
            >
              <Layers className="w-4 h-4 shrink-0" />
              Entities & Accounts
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("thresholds")}
              className={cn(
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-full text-xs font-semibold tracking-wide text-left transition-all",
                activeSection === "thresholds"
                  ? "bg-[#eff8ff] text-[#175cd3]"
                  : "text-[#475467] hover:bg-[#f9fafb] hover:text-[#101828]",
              )}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              Variance Thresholds
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("sync")}
              className={cn(
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-full text-xs font-semibold tracking-wide text-left transition-all",
                activeSection === "sync"
                  ? "bg-[#eff8ff] text-[#175cd3]"
                  : "text-[#475467] hover:bg-[#f9fafb] hover:text-[#101828]",
              )}
            >
              <Database className="w-4 h-4 shrink-0" />
              Sync Sources
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("workflow")}
              className={cn(
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-full text-xs font-semibold tracking-wide text-left transition-all",
                activeSection === "workflow"
                  ? "bg-[#eff8ff] text-[#175cd3]"
                  : "text-[#475467] hover:bg-[#f9fafb] hover:text-[#101828]",
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Workflow Defaults
            </button>
          </nav>
        </aside>

        {/* Right Main Content Card */}
        <main className="flex-1 min-w-0">
          {!canManageSettings && (
            <div className="rounded-xl border border-[#fda29b] bg-[#fffbfa] p-4 flex items-start gap-3 shadow-sm mb-4">
              <ShieldAlert className="w-5 h-5 text-[#d92d20] shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-relaxed">
                <h4 className="font-semibold text-[#b42318]">Read-Only Settings Mode</h4>
                <p className="text-[#b42318] mt-0.5">
                  Your current account profile does not possess write privileges for FP&A Configuration parameters. You may inspect settings but changes cannot be committed.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Entities & Chart of Accounts */}
          {activeSection === "entities" && (
            <div className="space-y-4">
              {/* Creator Card */}
              <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-[15px] font-semibold text-[#101828]">Forecast Entities</h2>
                  <span className="text-[11px] text-[#667085]">Define scopes for consolidations</span>
                </div>

                {entitiesLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-[#667085]">
                    <Loader2 className="size-4 animate-spin" />
                    Loading entities…
                  </div>
                ) : entitiesError ? (
                  <div className="rounded-xl border border-[#fda29b] bg-[#fef3f2] p-4 text-sm text-[#b42318]">
                    <p>{entitiesError}</p>
                    <button
                      type="button"
                      onClick={() => void loadEntities()}
                      className="mt-3 h-8 rounded-full border border-[#fda29b] px-3 text-xs font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                ) : entities.length === 0 ? (
                  <p className="py-6 text-sm text-[#667085]">No forecast entities returned by the API.</p>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {entities.map((e) => {
                    const isSelected = selectedEntity === e.id
                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEntity(e.id)}
                        className={cn(
                          "rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[100px] relative",
                          isSelected
                            ? "border-[#2563eb] bg-[#eff8ff] text-[#175cd3]"
                            : "border-[#eaecf0] bg-white text-[#344054]",
                        )}
                      >
                        <div>
                          <h4 className="text-[13px] font-bold text-[#101828]">{e.name}</h4>
                          <p className="text-[10px] text-[#667085] mt-1">
                            Currency: <span className="font-semibold">{e.baseCurrency || e.base_currency || "—"}</span>
                          </p>
                        </div>
                        <span className="text-[10.5px] text-[#2563eb] font-semibold mt-3 block">
                          {e.accountCount > 0 ? `${e.accountCount} Accounts mapped` : "No accounts"}
                        </span>
                      </div>
                    )
                  })}
                </div>
                )}

                {canManageSettings && (
                  <div className="border-t border-[#f2f4f7] pt-4 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                    <input
                      className="h-9 rounded-lg border border-[#d0d5dd] px-3 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      placeholder="New entity name"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                    />
                    <select
                      className="h-9 rounded-lg border border-[#d0d5dd] px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      value={entityCurrency}
                      onChange={(e) => setEntityCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <button
                      type="button"
                      disabled={!entityName.trim() || creatingEntity}
                      onClick={() => void createEntity()}
                      className="h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] px-5 text-xs font-semibold text-white transition-colors shadow-sm"
                    >
                      {creatingEntity ? "Adding…" : "Add Entity"}
                    </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Chart of Accounts details */}
              {selectedEntity && (
                <>
                <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#101828]">Chart of Accounts Mappings</h3>
                      <p className="text-[11px] text-[#667085] mt-0.5">Accounts linked from General Ledger source</p>
                    </div>
                    <input
                      type="search"
                      value={coaSearch}
                      onChange={(e) => setCoaSearch(e.target.value)}
                      placeholder="Search accounts…"
                      className="h-8 w-44 rounded-full border border-[#d0d5dd] px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  {coaLoading ? (
                    <p className="text-[12px] text-[#667085] py-4 inline-flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading accounts…
                    </p>
                  ) : coaError ? (
                    <div className="py-4 text-[12px] text-[#b42318]">
                      <p>{coaError}</p>
                      <button
                        type="button"
                        onClick={() => void loadCoa(selectedEntity)}
                        className="mt-3 h-8 rounded-full border border-[#fda29b] px-3 text-xs font-semibold"
                      >
                        Retry
                      </button>
                    </div>
                  ) : !activeCoa.length ? (
                    <p className="text-[12px] text-[#98a2b3] py-4">No accounts mapped to this entity.</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto text-[12.5px] divide-y divide-[#f2f4f7] pr-1.5">
                      {activeCoa.map((row) => (
                        <li key={row.code} className="flex gap-4 py-2 hover:bg-[#f9fafb] px-2 rounded-md">
                          <span className="font-mono text-[#667085] w-16 shrink-0">{row.code}</span>
                          <span className="text-[#344054] font-medium">{row.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                {canManageSettings && (
                  <section className="rounded-xl border border-[#fda29b] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[14px] font-semibold text-[#b42318]">Archive selected entity</h3>
                        <p className="mt-1 text-[11px] text-[#667085]">
                          Archived entities are removed from the active forecast entity list.
                        </p>
                      </div>
                      {!archiveConfirming && (
                        <button
                          type="button"
                          onClick={() => setArchiveConfirming(true)}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-[#fda29b] px-4 text-xs font-semibold text-[#b42318]"
                        >
                          <Archive className="size-3.5" />
                          Archive entity
                        </button>
                      )}
                    </div>
                    {archiveConfirming && (
                      <div className="mt-4 space-y-3 border-t border-[#fef3f2] pt-4">
                        <label className="block text-xs font-semibold text-[#344054]">
                          Reason for archiving
                          <textarea
                            value={archiveReason}
                            onChange={(event) => setArchiveReason(event.target.value)}
                            placeholder="Enter an explicit reason"
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-[#d0d5dd] px-3 py-2 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-[#d92d20]"
                          />
                        </label>
                        {archiveError && (
                          <div className="rounded-xl border border-[#fda29b] bg-[#fef3f2] p-3 text-xs text-[#b42318]">
                            <p>{archiveError}</p>
                            {archiveReferences.length > 0 && (
                              <p className="mt-1">References: {archiveReferences.join(", ")}</p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!archiveReason.trim() || archivingEntity}
                            onClick={() => void archiveSelectedEntity()}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#d92d20] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {archivingEntity && <Loader2 className="size-3.5 animate-spin" />}
                            Confirm archive
                          </button>
                          <button
                            type="button"
                            disabled={archivingEntity}
                            onClick={() => {
                              setArchiveConfirming(false)
                              setArchiveReason("")
                              setArchiveError(null)
                              setArchiveReferences([])
                            }}
                            className="h-9 rounded-full border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
                </>
              )}
            </div>
          )}

          {/* Section 2: Variance Thresholds */}
          {activeSection === "thresholds" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">Variance Commentary Thresholds</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">
                  Determine when department managers must explain budget deviations.
                </p>
              </div>
              {settingsLoading ? (
                <LoadingState label="Loading variance settings…" />
              ) : settingsError ? (
                <SettingsErrorState message={settingsError} onRetry={loadSettings} />
              ) : !settings || !draft ? (
                <EmptyState label="No variance settings were returned by the API." />
              ) : (
                <>
                  <label className="block max-w-sm text-xs font-semibold text-[#344054]">
                    Commentary threshold (%)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={!canManageSettings}
                      value={draft.variance.commentaryThresholdPct}
                      onChange={(event) => {
                        setSettingsValidationError(null)
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                variance: {
                                  ...current.variance,
                                  commentaryThresholdPct: event.target.value,
                                },
                              }
                            : current,
                        )
                      }}
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#d0d5dd] px-3 text-xs disabled:bg-[#f9fafb]"
                    />
                  </label>
                  <ToggleRow
                    label="Enforce commentary"
                    description="Require commentary when the configured threshold is exceeded."
                    checked={draft.variance.enforceCommentary}
                    disabled={!canManageSettings}
                    onChange={(checked) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              variance: { ...current.variance, enforceCommentary: checked },
                            }
                          : current,
                      )
                    }
                  />
                  <ToggleRow
                    label="Block submit without commentary"
                    description="Prevent submission until required commentary is supplied."
                    checked={draft.variance.blockSubmitWithoutCommentary}
                    disabled={!canManageSettings}
                    onChange={(checked) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              variance: {
                                ...current.variance,
                                blockSubmitWithoutCommentary: checked,
                              },
                            }
                          : current,
                      )
                    }
                  />
                  <SettingsSaveBar
                    canSave={canManageSettings}
                    saving={savingSettings}
                    error={settingsValidationError}
                    onSave={saveSettings}
                  />
                </>
              )}
            </section>
          )}

          {/* Section 3: Sync Sources */}
          {activeSection === "sync" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">ERP & Data Hub Integrations</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">
                  Configure live pipelines to pull historical actuals and metadata structures.
                </p>
              </div>
              {settingsLoading ? (
                <LoadingState label="Loading sync sources…" />
              ) : settingsError ? (
                <SettingsErrorState message={settingsError} onRetry={loadSettings} />
              ) : !settings ? (
                <EmptyState label="No sync source settings were returned by the API." />
              ) : settings.syncSources.length === 0 ? (
                <EmptyState label="No sync sources are configured." />
              ) : (
                <div className="grid gap-3">
                  {settings.syncSources.map((source) => {
                    const busy = sourceBusy[source.id]
                    const connected = source.status.toUpperCase() === "CONNECTED"
                    return (
                      <article key={source.id} className="rounded-xl border border-[#eaecf0] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-[#101828]">{source.label}</h3>
                              <span className="rounded-full bg-[#f2f4f7] px-2 py-0.5 text-[10px] font-semibold text-[#475467]">
                                {source.status}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#667085]">
                              Last sync: {source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString() : "Never"}
                            </p>
                            {source.lastError && (
                              <p className="mt-1 text-[11px] text-[#b42318]">{source.lastError}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!canManageSettings || Boolean(busy)}
                              onClick={() => void runSourceAction(source, connected ? "disconnect" : "connect")}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054] disabled:opacity-50"
                            >
                              {busy === (connected ? "disconnect" : "connect") ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : connected ? (
                                <Unplug className="size-3.5" />
                              ) : (
                                <Link2 className="size-3.5" />
                              )}
                              {connected ? "Disconnect" : "Connect"}
                            </button>
                            <button
                              type="button"
                              disabled={!canManageSettings || Boolean(busy) || !connected}
                              onClick={() => void runSourceAction(source, "sync")}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#2563eb] px-4 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {busy === "sync" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="size-3.5" />
                              )}
                              Sync now
                            </button>
                          </div>
                        </div>
                        {sourceErrors[source.id] && (
                          <p className="mt-3 rounded-xl border border-[#fda29b] bg-[#fef3f2] p-3 text-xs text-[#b42318]">
                            {sourceErrors[source.id]}
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section 4: Workflow Defaults */}
          {activeSection === "workflow" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">Workflow Defaults</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">
                  Configure default guidelines and checkpoint restrictions for budget approvals.
                </p>
              </div>
              {settingsLoading ? (
                <LoadingState label="Loading workflow settings…" />
              ) : settingsError ? (
                <SettingsErrorState message={settingsError} onRetry={loadSettings} />
              ) : !settings || !draft ? (
                <EmptyState label="No workflow settings were returned by the API." />
              ) : (
                <>
                  <label className="block max-w-sm text-xs font-semibold text-[#344054]">
                    Workflow path
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={draft.workflow.path}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                workflow: { ...current.workflow, path: event.target.value },
                              }
                            : current,
                        )
                      }
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#d0d5dd] px-3 text-xs disabled:bg-[#f9fafb]"
                    />
                  </label>
                  <ToggleRow
                    label="Require CFO signature"
                    description="Add CFO sign-off to the workflow path."
                    checked={draft.workflow.requireCfoSignature}
                    disabled={!canManageSettings}
                    onChange={(checked) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              workflow: { ...current.workflow, requireCfoSignature: checked },
                            }
                          : current,
                      )
                    }
                  />
                  <ToggleRow
                    label="Allow rerun after return"
                    description="Let owners rerun a workflow after it is returned."
                    checked={draft.workflow.allowRerunAfterReturn}
                    disabled={!canManageSettings}
                    onChange={(checked) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              workflow: { ...current.workflow, allowRerunAfterReturn: checked },
                            }
                          : current,
                      )
                    }
                  />
                  <SettingsSaveBar
                    canSave={canManageSettings}
                    saving={savingSettings}
                    error={settingsValidationError}
                    onSave={saveSettings}
                  />
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-[#667085]">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className="rounded-xl border border-[#eaecf0] bg-[#f9fafb] p-4 text-xs text-[#667085]">{label}</p>
}

function SettingsErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => Promise<void>
}) {
  return (
    <div className="rounded-xl border border-[#fda29b] bg-[#fef3f2] p-4 text-xs text-[#b42318]">
      <p>{message}</p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="mt-3 h-8 rounded-full border border-[#fda29b] px-3 font-semibold"
      >
        Retry
      </button>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-[#eaecf0] p-4">
      <span>
        <span className="block text-xs font-semibold text-[#344054]">{label}</span>
        <span className="mt-0.5 block text-[11px] text-[#667085]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#2563eb]"
      />
    </label>
  )
}

function SettingsSaveBar({
  canSave,
  saving,
  error,
  onSave,
}: {
  canSave: boolean
  saving: boolean
  error: string | null
  onSave: () => Promise<void>
}) {
  return (
    <div className="border-t border-[#f2f4f7] pt-4">
      {error && <p className="mb-2 text-xs text-[#b42318]">{error}</p>}
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={() => void onSave()}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2563eb] px-6 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <Loader2 className="size-3.5 animate-spin" />}
        Save settings
      </button>
    </div>
  )
}
