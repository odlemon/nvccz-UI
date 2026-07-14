"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { ChevronRight, Loader2, Plus, Settings, ShieldAlert, Check, RefreshCw, Layers, Database, Sliders, Play } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { fpaApi, type ForecastEntity } from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type LocalEntity = ForecastEntity & {
  accountCount: number
}

const INITIAL_ENTITIES: LocalEntity[] = [
  { id: "ent-1", name: "Acme Corp (Global)", type: "COMPANY", baseCurrency: "USD", accountCount: 142 },
  { id: "ent-2", name: "Acme EMEA Division", type: "COMPANY", baseCurrency: "EUR", accountCount: 89 },
  { id: "ent-3", name: "Acme Tech Ventures", type: "COMPANY", baseCurrency: "USD", accountCount: 54 },
]

const MOCK_COAS: Record<string, Array<{ code: string; name: string }>> = {
  "ent-1": [
    { code: "1010", name: "Cash and Cash Equivalents" },
    { code: "1200", name: "Accounts Receivable" },
    { code: "4000", name: "Product Sales Revenue" },
    { code: "5000", name: "Cost of Goods Sold (COGS)" },
    { code: "6010", name: "Salaries & Benefits" },
    { code: "6120", name: "Marketing & Campaigns" },
  ],
  "ent-2": [
    { code: "1000-EU", name: "Cash EUR" },
    { code: "4100-EU", name: "Services Revenue" },
    { code: "6050-EU", name: "Rent & Facilities" },
  ],
  "ent-3": [
    { code: "1010-TV", name: "Investments" },
    { code: "4200-TV", name: "Licensing Revenue" },
    { code: "6100-TV", name: "Research & Development" },
  ],
}

type SyncSource = {
  id: string
  name: string
  provider: string
  status: "Connected" | "Not Connected" | "Syncing"
  lastSynced: string
}

export function FpaSettings() {
  const { canManageSettings } = useFpaPermissions()
  const [activeSection, setActiveSection] = useState<"entities" | "thresholds" | "sync" | "workflow">("entities")

  // Entities state
  const [entities, setDrivers] = useState<LocalEntity[]>(INITIAL_ENTITIES)
  const [selectedEntity, setSelectedEntity] = useState<string | null>("ent-1")
  const [entityName, setEntityName] = useState("")
  const [entityCurrency, setEntityCurrency] = useState("USD")
  const [coaSearch, setCoaSearch] = useState("")

  // Thresholds state
  const [threshold, setThreshold] = useState(10)
  const [enforceCommentary, setEnforceCommentary] = useState(true)
  const [blockSubmit, setBlockSubmit] = useState(false)
  const [savingThreshold, setSavingThreshold] = useState(false)

  // Sync sources state
  const [syncSources, setSyncSources] = useState<SyncSource[]>([
    { id: "ss-1", name: "NetSuite ERP Integration", provider: "Oracle NetSuite", status: "Connected", lastSynced: "2 hours ago" },
    { id: "ss-2", name: "QuickBooks Online Sync", provider: "Intuit QuickBooks", status: "Not Connected", lastSynced: "Never" },
    { id: "ss-3", name: "Xero General Ledger", provider: "Xero", status: "Not Connected", lastSynced: "Never" },
    { id: "ss-4", name: "Arcus Data Hub API", provider: "Arcus Internal", status: "Connected", lastSynced: "Just now" },
  ])
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null)

  // Workflow settings state
  const [linearWorkflow, setLinearWorkflow] = useState(true)
  const [cfoSignature, setCfoSignature] = useState(true)
  const [allowRerun, setAllowRerun] = useState(false)
  const [savingWorkflow, setSavingWorkflow] = useState(false)

  const activeCoa = useMemo(() => {
    if (!selectedEntity) return []
    const rows = MOCK_COAS[selectedEntity] || []
    const q = coaSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
    )
  }, [selectedEntity, coaSearch])

  const createEntity = () => {
    if (!entityName.trim()) return
    const newEntity: LocalEntity = {
      id: `ent-${Date.now()}`,
      name: entityName.trim(),
      type: "COMPANY",
      baseCurrency: entityCurrency,
      accountCount: 0,
    }
    setDrivers((prev) => [...prev, newEntity])
    setEntityName("")
    setSelectedEntity(newEntity.id)
    toast.success(`Entity "${newEntity.name}" created successfully`)
  }

  const deleteEntity = (id: string) => {
    if (entities.length <= 1) {
      toast.message("At least one entity is required")
      return
    }
    setDrivers((prev) => prev.filter((e) => e.id !== id))
    if (selectedEntity === id) {
      setSelectedEntity(entities.find((e) => e.id !== id)?.id || null)
    }
    toast.success("Entity removed")
  }

  const saveThresholdSettings = () => {
    setSavingThreshold(true)
    setTimeout(() => {
      setSavingThreshold(false)
      toast.success("Variance thresholds updated successfully")
    }, 400)
  }

  const saveWorkflowDefaults = () => {
    setSavingWorkflow(true)
    setTimeout(() => {
      setSavingWorkflow(false)
      toast.success("Workflow default parameters updated")
    }, 400)
  }

  const handleConnectSyncSource = (id: string) => {
    setConnectingSourceId(id)
    setTimeout(() => {
      setSyncSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Connected" } : s)),
      )
      setConnectingSourceId(null)
      toast.success("Integration connected successfully")
    }, 1000)
  }

  const handleDisconnectSyncSource = (id: string) => {
    setSyncSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Not Connected" } : s)),
    )
    toast.warning("Integration disconnected")
  }

  const handleSyncSourceNow = (id: string) => {
    setSyncSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Syncing" } : s)),
    )
    setTimeout(() => {
      setSyncSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Connected", lastSynced: "Just now" } : s)),
      )
      toast.success("Sync completed: 1,482 records imported from ERP")
    }, 1000)
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
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide text-left transition-all",
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
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide text-left transition-all",
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
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide text-left transition-all",
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
                "w-full h-10 inline-flex items-center gap-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide text-left transition-all",
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {entities.map((e) => {
                    const isSelected = selectedEntity === e.id
                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEntity(e.id)}
                        className={cn(
                          "rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[100px] relative group",
                          isSelected
                            ? "border-[#2563eb] bg-[#eff8ff] text-[#175cd3]"
                            : "border-[#eaecf0] bg-white text-[#344054]",
                        )}
                      >
                        {canManageSettings && entities.length > 1 && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              deleteEntity(e.id)
                            }}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full text-[10px] font-bold text-[#b42318] bg-[#fef3f2] opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${e.name}`}
                          >
                            ×
                          </button>
                        )}
                        <div>
                          <h4 className="text-[13px] font-bold text-[#101828]">{e.name}</h4>
                          <p className="text-[10px] text-[#667085] mt-1">
                            Currency: <span className="font-semibold">{e.baseCurrency}</span>
                          </p>
                        </div>
                        <span className="text-[10.5px] text-[#2563eb] font-semibold mt-3 block">
                          {e.accountCount > 0 ? `${e.accountCount} Accounts mapped` : "No accounts"}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {canManageSettings && (
                  <div className="flex items-center gap-3 border-t border-[#f2f4f7] pt-4 flex-wrap">
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
                      disabled={!entityName.trim()}
                      onClick={createEntity}
                      className="h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] px-5 text-xs font-semibold text-white transition-colors shadow-sm"
                    >
                      Add Entity
                    </button>
                  </div>
                )}
              </section>

              {/* Chart of Accounts details */}
              {selectedEntity && (
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

                  {!activeCoa.length ? (
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
              )}
            </div>
          )}

          {/* Section 2: Variance Thresholds */}
          {activeSection === "thresholds" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">Variance Commentary Thresholds</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">Determine when department managers are required to write explanations for budget deviations.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[13px] font-semibold text-[#344054]">
                    <span>Mandatory Commentary Threshold:</span>
                    <span className="text-[#2563eb]">{threshold}% Variance</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    disabled={!canManageSettings}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#eaecf0] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                  />
                  <p className="text-[11.5px] text-[#667085] mt-1">
                    💡 If a department's expense budget deviates from the actual result by more than {threshold}%, submission is locked until explanation comments are provided.
                  </p>
                </div>

                <div className="space-y-3.5 border-t border-[#f2f4f7] pt-4">
                  <label className="flex items-start gap-2.5 text-[12.5px] text-[#344054] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={enforceCommentary}
                      onChange={(e) => setEnforceCommentary(e.target.checked)}
                      className="mt-0.5 rounded border-[#d0d5dd] text-[#2563eb] focus:ring-[#2563eb]/20"
                    />
                    <div>
                      <span className="font-semibold">Enforce commentary rules on Opex line items</span>
                      <p className="text-[11px] text-[#667085] mt-0.5">Applies threshold validations to salaries, marketing, and operational expenses.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-[12.5px] text-[#344054] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={blockSubmit}
                      onChange={(e) => setBlockSubmit(e.target.checked)}
                      className="mt-0.5 rounded border-[#d0d5dd] text-[#2563eb] focus:ring-[#2563eb]/20"
                    />
                    <div>
                      <span className="font-semibold">Block budget cycle lock if variances are unexplained</span>
                      <p className="text-[11px] text-[#667085] mt-0.5">Prevents finance administrators from locking the rolling forecast if comments are missing.</p>
                    </div>
                  </label>
                </div>
              </div>

              {canManageSettings && (
                <div className="border-t border-[#f2f4f7] pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={savingThreshold}
                    onClick={saveThresholdSettings}
                    className="h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] px-5 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {savingThreshold ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Threshold Settings
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Section 3: Sync Sources */}
          {activeSection === "sync" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">ERP & Data Hub Integrations</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">Configure live pipelines to pull historical actuals and metadata structures.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {syncSources.map((source) => {
                  const isSyncing = source.status === "Syncing"
                  const isConnected = source.status === "Connected"
                  const isConnecting = connectingSourceId === source.id

                  return (
                    <div key={source.id} className="rounded-xl border border-[#eaecf0] p-4 flex flex-col justify-between gap-4 bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <h4 className="text-[13px] font-bold text-[#101828]">{source.name}</h4>
                          <span className="text-[10px] text-[#667085] mt-0.5">{source.provider}</span>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full",
                            source.status === "Connected" && "bg-[#edfcf2] text-[#087443]",
                            source.status === "Not Connected" && "bg-[#f2f4f7] text-[#667085]",
                            source.status === "Syncing" && "bg-[#eff8ff] text-[#175cd3]",
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-[#12b76a]" : isSyncing ? "bg-[#2563eb] animate-ping" : "bg-[#98a2b3]")} />
                          {source.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#667085]">
                        Last synchronization: <span className="font-semibold text-[#344054]">{source.lastSynced}</span>
                      </div>

                      {canManageSettings && (
                        <div className="flex items-center gap-2 border-t border-[#f2f4f7] pt-3 mt-1">
                          {!isConnected ? (
                            <button
                              type="button"
                              disabled={isConnecting}
                              onClick={() => handleConnectSyncSource(source.id)}
                              className="h-8 flex-1 inline-flex items-center justify-center rounded-lg bg-[#2563eb] text-xs font-semibold text-white hover:bg-[#1d4ed8]"
                            >
                              {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect Integration"}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isSyncing}
                                onClick={() => handleSyncSourceNow(source.id)}
                                className="h-8 flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#d0d5dd] text-xs font-semibold text-[#344054] hover:bg-[#f9fafb]"
                              >
                                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3 h-3 text-[#475467]" />}
                                Sync Now
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDisconnectSyncSource(source.id)}
                                className="h-8 rounded-lg border border-[#fda29b] text-xs font-semibold text-[#b42318] px-3.5 hover:bg-[#fef3f2]"
                              >
                                Disconnect
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Section 4: Workflow Defaults */}
          {activeSection === "workflow" && (
            <section className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828]">Workflow Defaults</h2>
                <p className="text-[12px] text-[#667085] mt-0.5">Configure default guidelines and checkpoint restrictions for budget approvals.</p>
              </div>

              <div className="space-y-4 text-[13px]">
                <div className="space-y-3.5">
                  <label className="flex items-start gap-2.5 text-[#344054] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={linearWorkflow}
                      onChange={(e) => setLinearWorkflow(e.target.checked)}
                      className="mt-0.5 rounded border-[#d0d5dd] text-[#2563eb] focus:ring-[#2563eb]/20"
                    />
                    <div>
                      <span className="font-semibold">Enforce linear path checks (Draft → Submitted → Approved)</span>
                      <p className="text-[11px] text-[#667085] mt-0.5">Restricts roles so department managers cannot approve their own drafts.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-[#344054] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={cfoSignature}
                      onChange={(e) => setCfoSignature(e.target.checked)}
                      className="mt-0.5 rounded border-[#d0d5dd] text-[#2563eb] focus:ring-[#2563eb]/20"
                    />
                    <div>
                      <span className="font-semibold">Require CFO signature to lock cycle consolidations</span>
                      <p className="text-[11px] text-[#667085] mt-0.5">Enforces a dual-authorization barrier before closing forecast periods.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-[#344054] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManageSettings}
                      checked={allowRerun}
                      onChange={(e) => setAllowRerun(e.target.checked)}
                      className="mt-0.5 rounded border-[#d0d5dd] text-[#2563eb] focus:ring-[#2563eb]/20"
                    />
                    <div>
                      <span className="font-semibold">Allow scenario recalculations on locked budgets</span>
                      <p className="text-[11px] text-[#667085] mt-0.5">Allows administrators to trigger backruns on historic cycle data.</p>
                    </div>
                  </label>
                </div>
              </div>

              {canManageSettings && (
                <div className="border-t border-[#f2f4f7] pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={savingWorkflow}
                    onClick={saveWorkflowDefaults}
                    className="h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] px-5 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {savingWorkflow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Workflow Settings
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
