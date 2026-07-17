"use client"

import { useEffect, useState } from "react"
import { Bell, Coins, GitBranch, Loader2, Pencil, Plus, Shield, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import {
  mapNotificationRow,
  mapPipelineStages,
  mapSettingsRole,
  mapStageGateRow,
  STAGE_GATE_FLAGS,
  titleCase,
  type PipelineStageRow,
} from "@/lib/fundraising/mappers"
import { probabilityColor } from "./settings-mock-data"
import { FrConfirmDialog, FrDialogShell, FrField, FrFormFooter, FrViewAllDialog, frInputClass, frSelectClass } from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type SettingsTab = "pipelines" | "gates" | "amounts" | "roles" | "notifications"

const TABS: { id: SettingsTab; label: string; icon: typeof GitBranch }[] = [
  { id: "pipelines", label: "Pipelines", icon: GitBranch },
  { id: "gates", label: "Stage Gates", icon: Shield },
  { id: "amounts", label: "Amount Types", icon: Coins },
  { id: "roles", label: "Roles", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
]

type PipelineKey = "PE_VC" | "AM"

type AmountTypeRow = { key: string; label: string; enabled: boolean }
type NotificationRow = ReturnType<typeof mapNotificationRow>
type StageGateRow = ReturnType<typeof mapStageGateRow>
type RoleRow = ReturnType<typeof mapSettingsRole>

function StageList({
  title,
  stages,
  onViewAll,
  onEdit,
  onDelete,
}: {
  title: string
  stages: PipelineStageRow[]
  onViewAll: () => void
  onEdit: (stage: PipelineStageRow) => void
  onDelete: (stage: PipelineStageRow) => void
}) {
  return (
    <div className={cn(CARD, "overflow-hidden")}>
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[#0f172a]">{title}</h3>
          <p className="mt-0.5 text-[11px] text-[#64748b]">{stages.length} stages</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="rounded-full text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View all &gt;
        </button>
      </div>
      {stages.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12px] text-[#94a3b8]">No stages configured yet.</p>
      ) : (
        <ul className="divide-y divide-[#f1f5f9]">
          {stages.slice(0, 5).map((stage) => (
            <li key={stage.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0 truncate text-[12px] font-medium text-[#0f172a]">{stage.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: probabilityColor(stage.probability) }}
                >
                  {stage.probability != null ? `${stage.probability}%` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => onEdit(stage)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#2563eb]"
                  aria-label={`Edit ${stage.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(stage)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                  aria-label={`Delete ${stage.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FundraisingSettings() {
  const [tab, setTab] = useState<SettingsTab>("pipelines")
  const [loading, setLoading] = useState(true)
  const [peStages, setPeStages] = useState<PipelineStageRow[]>([])
  const [amStages, setAmStages] = useState<PipelineStageRow[]>([])
  const [gates, setGates] = useState<StageGateRow[]>([])
  const [amountTypes, setAmountTypes] = useState<AmountTypeRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [viewAllPipeline, setViewAllPipeline] = useState<PipelineKey>("PE_VC")

  const [addStageOpen, setAddStageOpen] = useState(false)
  const [addStageForm, setAddStageForm] = useState({
    pipelineKey: "PE_VC" as PipelineKey,
    stageName: "",
    stageCode: "",
    winProbabilityPct: "",
  })

  const [editStageOpen, setEditStageOpen] = useState(false)
  const [editStagePipeline, setEditStagePipeline] = useState<PipelineKey>("PE_VC")
  const [editingStage, setEditingStage] = useState<PipelineStageRow | null>(null)
  const [editStageForm, setEditStageForm] = useState({ stageName: "", winProbabilityPct: "", sortOrder: "" })
  const [savingStage, setSavingStage] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    pipelineKey: PipelineKey
    stage: PipelineStageRow
  } | null>(null)
  const [deletingStage, setDeletingStage] = useState(false)

  const [editGateOpen, setEditGateOpen] = useState(false)
  const [editingGate, setEditingGate] = useState<StageGateRow | null>(null)
  const [gateFlags, setGateFlags] = useState<Record<string, boolean>>({})

  const [savingAmountKey, setSavingAmountKey] = useState<string | null>(null)

  async function loadSettings(silent = false) {
    if (!silent) setLoading(true)
    try {
      const data = await fundraisingApi.getSettings()
      setPeStages(mapPipelineStages(data?.pipelines?.PE_VC))
      setAmStages(mapPipelineStages(data?.pipelines?.AM))
      setGates(Array.isArray(data?.stageGates) ? data.stageGates.map(mapStageGateRow) : [])
      setAmountTypes(
        Array.isArray(data?.amountTypes)
          ? data.amountTypes.map((t: Record<string, any>) => {
              const key = String(t.key ?? t.code ?? t.amountType ?? "")
              return {
                key,
                label: t.label || titleCase(key),
                enabled: t.enabled !== false,
              }
            })
          : [],
      )
      setNotifications(
        Array.isArray(data?.notifications) ? data.notifications.map(mapNotificationRow) : [],
      )
      setRoles(Array.isArray(data?.roles) ? data.roles.map(mapSettingsRole) : [])
    } catch (err) {
      toastFrError(err, "Could not load settings")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function toggleAmountType(type: AmountTypeRow, enabled: boolean) {
    setAmountTypes((prev) => prev.map((t) => (t.key === type.key ? { ...t, enabled } : t)))
    setSavingAmountKey(type.key)
    try {
      await fundraisingApi.patchAmountTypes({ amountTypes: [{ key: type.key, enabled }] })
      toast.success(`${type.label} ${enabled ? "enabled" : "disabled"}`)
      await loadSettings(true)
    } catch (err) {
      setAmountTypes((prev) => prev.map((t) => (t.key === type.key ? { ...t, enabled: !enabled } : t)))
      toastFrError(err, "Could not update amount type")
    } finally {
      setSavingAmountKey(null)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const viewAllStages = viewAllPipeline === "PE_VC" ? peStages : amStages

  const viewAllRows = viewAllStages.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: `${viewAllPipeline === "PE_VC" ? "PE / VC" : "Asset Management"} pipeline`,
    meta: `Sort order ${s.sortOrder}`,
    badge: s.probability != null ? `${s.probability}%` : "—",
    badgeClass: "bg-[#f5f3ff] text-[#6d28d9]",
  }))

  function openViewAll(pipeline: PipelineKey) {
    setViewAllPipeline(pipeline)
    setViewAllOpen(true)
  }

  function openAddStage() {
    setAddStageForm({ pipelineKey: "PE_VC", stageName: "", stageCode: "", winProbabilityPct: "" })
    setAddStageOpen(true)
  }

  async function submitAddStage() {
    const stages = addStageForm.pipelineKey === "PE_VC" ? peStages : amStages
    try {
      await fundraisingApi.createPipelineStage(addStageForm.pipelineKey, {
        stageName: addStageForm.stageName.trim(),
        stageCode: addStageForm.stageCode.trim() || undefined,
        winProbabilityPct: addStageForm.winProbabilityPct ? asNumber(addStageForm.winProbabilityPct) : undefined,
        sortOrder: stages.length + 1,
      })
      toast.success("Stage added")
      await loadSettings()
    } catch (err) {
      toastFrError(err, "Could not add stage")
      throw err
    }
  }

  function openEditStage(pipelineKey: PipelineKey, stage: PipelineStageRow) {
    setEditStagePipeline(pipelineKey)
    setEditingStage(stage)
    setEditStageForm({
      stageName: stage.name,
      winProbabilityPct: stage.probability != null ? String(stage.probability) : "",
      sortOrder: String(stage.sortOrder),
    })
    setEditStageOpen(true)
  }

  async function submitEditStage() {
    if (!editingStage) return
    setSavingStage(true)
    try {
      await fundraisingApi.patchPipelineStage(editStagePipeline, editingStage.id, {
        stageName: editStageForm.stageName.trim(),
        winProbabilityPct: editStageForm.winProbabilityPct ? asNumber(editStageForm.winProbabilityPct) : undefined,
        sortOrder: editStageForm.sortOrder ? asNumber(editStageForm.sortOrder) : undefined,
      })
      toast.success("Stage updated")
      setEditStageOpen(false)
      setEditingStage(null)
      await loadSettings()
    } catch (err) {
      toastFrError(err, "Could not update stage")
    } finally {
      setSavingStage(false)
    }
  }

  function handleDeleteStage(pipelineKey: PipelineKey, stage: PipelineStageRow) {
    setDeleteTarget({ pipelineKey, stage })
  }

  async function confirmDeleteStage() {
    if (!deleteTarget) return
    setDeletingStage(true)
    try {
      await fundraisingApi.deletePipelineStage(deleteTarget.pipelineKey, deleteTarget.stage.id)
      toast.success("Stage deleted")
      setDeleteTarget(null)
      await loadSettings()
    } catch (err) {
      toastFrError(err, "Could not delete stage")
    } finally {
      setDeletingStage(false)
    }
  }

  function openEditGate(gate: StageGateRow) {
    setEditingGate(gate)
    const flags: Record<string, boolean> = {}
    STAGE_GATE_FLAGS.forEach((f) => {
      flags[f.key] = Boolean(gate.raw?.[f.key])
    })
    setGateFlags(flags)
    setEditGateOpen(true)
  }

  async function saveGate() {
    if (!editingGate) return
    try {
      await fundraisingApi.patchStageGates({
        gates: [{ stageCode: editingGate.stageCode, ...gateFlags }],
      })
      toast.success("Stage gate updated")
      await loadSettings()
    } catch (err) {
      toastFrError(err, "Could not update stage gate")
      throw err
    }
  }

  async function toggleNotification(item: NotificationRow, enabled: boolean) {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, enabled } : n)))
    try {
      await fundraisingApi.patchNotificationSettings({ notifications: [{ id: item.id, enabled }] })
    } catch (err) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, enabled: !enabled } : n)))
      toastFrError(err, "Could not update notification setting")
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Settings</h1>
        <p className="mt-1 text-[12px] text-[#64748b]">
          Pipeline stages, probabilities, stage gates, and module configuration
        </p>
      </div>

      <div className={cn(CARD, "mt-5 overflow-hidden")}>
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#f1f5f9] px-3 pt-3">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border-b-2 px-3 pb-2.5 text-[12px] font-medium",
                  tab === t.id
                    ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                    : "border-transparent text-[#94a3b8] hover:text-[#64748b]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-4">
          {tab === "pipelines" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-[#64748b]">
                  {loading
                    ? "Loading pipeline stages…"
                    : "PE / VC and Asset Management pipeline stages with configured win probabilities."}
                </p>
                <Button
                  variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
                  onClick={openAddStage}
                >
                  <Plus className="h-4 w-4" /> Add Stage
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-[13px] text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading pipelines…
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <StageList
                    title="PE / VC pipeline"
                    stages={peStages}
                    onViewAll={() => openViewAll("PE_VC")}
                    onEdit={(s) => openEditStage("PE_VC", s)}
                    onDelete={(s) => handleDeleteStage("PE_VC", s)}
                  />
                  <StageList
                    title="Asset Management pipeline"
                    stages={amStages}
                    onViewAll={() => openViewAll("AM")}
                    onEdit={(s) => openEditStage("AM", s)}
                    onDelete={(s) => handleDeleteStage("AM", s)}
                  />
                </div>
              )}
            </div>
          ) : null}

          {tab === "gates" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Requirements that must be met before an opportunity can advance into a stage.
              </p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-[13px] text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading stage gates…
                </div>
              ) : gates.length === 0 ? (
                <div className="rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
                  No stage gates configured yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {gates.map((gate) => (
                    <div
                      key={gate.id}
                      className={cn(CARD, "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between")}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] font-semibold text-[#0f172a]">
                          Entering {gate.stageName}
                        </span>
                        {gate.requirements.length === 0 ? (
                          <p className="mt-2 text-[11px] text-[#94a3b8]">No requirements configured</p>
                        ) : (
                          <ul className="mt-2 space-y-1">
                            {gate.requirements.map((req) => (
                              <li key={req} className="flex items-start gap-2 text-[11px] text-[#64748b]">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c4b5fd]" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="h-8 shrink-0 rounded-full px-3 text-[11px]"
                        onClick={() => openEditGate(gate)}
                      >
                        Edit gate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "amounts" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Amount types are independent labels — each is tracked separately and never overwrites
                another (edits append history).
              </p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-[13px] text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading amount types…
                </div>
              ) : amountTypes.length === 0 ? (
                <div className="rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
                  No amount types configured yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {amountTypes.map((type, i) => (
                    <div key={type.key} className={cn(CARD, "flex items-center gap-3 p-3.5")}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#f5f3ff] text-[11px] font-bold text-[#7c3aed]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-[#0f172a]">
                          {type.label}
                        </span>
                        <span className="text-[9px] text-[#94a3b8]">{type.key}</span>
                      </div>
                      {savingAmountKey === type.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#94a3b8]" />
                      ) : (
                        <Switch
                          checked={type.enabled}
                          onCheckedChange={(enabled) => toggleAmountType(type, enabled)}
                          aria-label={`${type.enabled ? "Disable" : "Enable"} ${type.label}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "roles" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Role summaries for fundraising module access. Managed in Admin.
              </p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-[13px] text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
                </div>
              ) : roles.length === 0 ? (
                <div className="rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
                  No fundraising roles configured yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {roles.map((role) => (
                    <div key={role.id} className={cn(CARD, "p-4")}>
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 text-[#7c3aed]" />
                        <div>
                          <h3 className="text-[13px] font-semibold text-[#0f172a]">{role.name}</h3>
                          <p className="mt-1 text-[11px] text-[#64748b]">{role.summary}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {role.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#475569]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Choose which events trigger in-app and email notifications for your account.
              </p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-[13px] text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading notification settings…
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-[6px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
                  No notification rules configured yet.
                </div>
              ) : (
                <ul className={cn(CARD, "divide-y divide-[#f1f5f9]")}>
                  {notifications.map((n) => (
                    <NotificationRowItem key={n.id} item={n} onToggle={toggleNotification} />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <FrViewAllDialog
        open={viewAllOpen}
        onOpenChange={setViewAllOpen}
        title={viewAllPipeline === "PE_VC" ? "PE / VC — all stages" : "Asset Management — all stages"}
        description={`${viewAllStages.length} configured stages`}
        rows={viewAllRows}
      />

      <FrConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletingStage) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete ${deleteTarget.stage.name}?` : "Delete stage?"}
        description="This permanently removes the pipeline stage. Stages used by open opportunities cannot be deleted."
        confirmLabel="Delete stage"
        loading={deletingStage}
        destructive
        onConfirm={confirmDeleteStage}
      />

      <FrSimpleWizard
        open={addStageOpen}
        onOpenChange={setAddStageOpen}
        title="Add pipeline stage"
        steps={[{ id: "details", short: "1", label: "Details" }, { id: "review", short: "2", label: "Review" }]}
        submitLabel="Add stage"
        validateStep={(step) =>
          step === "details" && !addStageForm.stageName.trim() ? ["Stage name is required"] : []
        }
        onFinish={submitAddStage}
      >
        {(step) =>
          step === "details" ? (
            <div className="space-y-3">
              <FrField label="Pipeline">
                <select
                  className={frSelectClass}
                  value={addStageForm.pipelineKey}
                  onChange={(e) =>
                    setAddStageForm((f) => ({ ...f, pipelineKey: e.target.value as PipelineKey }))
                  }
                >
                  <option value="PE_VC">PE / VC</option>
                  <option value="AM">Asset Management</option>
                </select>
              </FrField>
              <FrField label="Stage name">
                <input
                  className={frInputClass}
                  value={addStageForm.stageName}
                  onChange={(e) => setAddStageForm((f) => ({ ...f, stageName: e.target.value }))}
                  placeholder="e.g. Contacted"
                />
              </FrField>
              <FrField label="Stage code (optional)">
                <input
                  className={frInputClass}
                  value={addStageForm.stageCode}
                  onChange={(e) => setAddStageForm((f) => ({ ...f, stageCode: e.target.value }))}
                  placeholder="e.g. CONTACTED"
                />
              </FrField>
              <FrField label="Win probability % (optional)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={frInputClass}
                  value={addStageForm.winProbabilityPct}
                  onChange={(e) => setAddStageForm((f) => ({ ...f, winProbabilityPct: e.target.value }))}
                />
              </FrField>
            </div>
          ) : (
            <ReviewList
              items={[
                { label: "Pipeline", value: addStageForm.pipelineKey === "PE_VC" ? "PE / VC" : "Asset Management" },
                { label: "Stage name", value: addStageForm.stageName || "—" },
                { label: "Stage code", value: addStageForm.stageCode || "Auto-generated" },
                { label: "Win probability", value: addStageForm.winProbabilityPct ? `${addStageForm.winProbabilityPct}%` : "—" },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrDialogShell
        open={editStageOpen}
        onOpenChange={(v) => {
          setEditStageOpen(v)
          if (!v) setEditingStage(null)
        }}
        title="Edit pipeline stage"
        description={editingStage?.name}
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setEditStageOpen(false)}
            onSubmit={submitEditStage}
            submitLabel={savingStage ? "Saving…" : "Save stage"}
            submitDisabled={savingStage || !editStageForm.stageName.trim()}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Stage name">
            <input
              className={frInputClass}
              value={editStageForm.stageName}
              onChange={(e) => setEditStageForm((f) => ({ ...f, stageName: e.target.value }))}
            />
          </FrField>
          <div className="grid grid-cols-2 gap-3">
            <FrField label="Win probability %">
              <input
                type="number"
                min={0}
                max={100}
                className={frInputClass}
                value={editStageForm.winProbabilityPct}
                onChange={(e) => setEditStageForm((f) => ({ ...f, winProbabilityPct: e.target.value }))}
              />
            </FrField>
            <FrField label="Sort order">
              <input
                type="number"
                min={1}
                className={frInputClass}
                value={editStageForm.sortOrder}
                onChange={(e) => setEditStageForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </FrField>
          </div>
        </div>
      </FrDialogShell>

      <FrSimpleWizard
        open={editGateOpen}
        onOpenChange={(v) => {
          setEditGateOpen(v)
          if (!v) setEditingGate(null)
        }}
        title="Edit stage gate"
        steps={[{ id: "flags", short: "1", label: "Requirements" }, { id: "review", short: "2", label: "Review" }]}
        submitLabel="Save gate"
        validateStep={() => []}
        onFinish={saveGate}
      >
        {(step) =>
          step === "flags" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-[#64748b]">
                Entering <span className="font-semibold text-[#0f172a]">{editingGate?.stageName}</span> requires:
              </p>
              {STAGE_GATE_FLAGS.map((f) => (
                <label
                  key={f.key}
                  className={cn(CARD, "flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer")}
                >
                  <span className="text-[12px] text-[#0f172a]">{f.label}</span>
                  <Switch
                    checked={Boolean(gateFlags[f.key])}
                    onCheckedChange={(v) => setGateFlags((prev) => ({ ...prev, [f.key]: v }))}
                  />
                </label>
              ))}
            </div>
          ) : (
            <ReviewList
              items={STAGE_GATE_FLAGS.map((f) => ({ label: f.label, value: gateFlags[f.key] ? "Required" : "Not required" }))}
            />
          )
        }
      </FrSimpleWizard>
    </div>
  )
}

function NotificationRowItem({
  item,
  onToggle,
}: {
  item: NotificationRow
  onToggle: (item: NotificationRow, enabled: boolean) => void
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-[12px] text-[#0f172a]">{item.label}</span>
      <Switch checked={item.enabled} onCheckedChange={(v) => onToggle(item, v)} />
    </li>
  )
}
