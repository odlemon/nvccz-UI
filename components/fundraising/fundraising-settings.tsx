"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Bell, Coins, GitBranch, Plus, Shield, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  AMOUNT_TYPES,
  AM_STAGES,
  FR_NOTIFICATIONS,
  FR_ROLES,
  PE_STAGES,
  STAGE_GATES,
  probabilityColor,
  type FrNotification,
  type PipelineStage,
  type StageGate,
} from "./settings-mock-data"
import {
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
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

function StageList({
  title,
  stages,
  onViewAll,
}: {
  title: string
  stages: PipelineStage[]
  onViewAll: () => void
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
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View all &gt;
        </button>
      </div>
      <ul className="divide-y divide-[#f1f5f9]">
        {stages.slice(0, 5).map((stage) => (
          <li key={stage.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-[12px] font-medium text-[#0f172a]">{stage.name}</span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: probabilityColor(stage.probability) }}
            >
              {stage.probability}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FundraisingSettings() {
  const [tab, setTab] = useState<SettingsTab>("pipelines")
  const [peStages, setPeStages] = useState(PE_STAGES)
  const [amStages, setAmStages] = useState(AM_STAGES)
  const [gates, setGates] = useState(STAGE_GATES)
  const [notifications, setNotifications] = useState(FR_NOTIFICATIONS)

  const [addStageOpen, setAddStageOpen] = useState(false)
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [viewAllPipeline, setViewAllPipeline] = useState<"pe" | "am">("pe")
  const [editGateOpen, setEditGateOpen] = useState(false)
  const [editingGate, setEditingGate] = useState<StageGate | null>(null)

  const [stageForm, setStageForm] = useState({
    pipeline: "pe" as "pe" | "am",
    name: "",
    probability: "25",
  })
  const [gateForm, setGateForm] = useState({
    from: "",
    to: "",
    requirements: "",
  })

  const viewAllStages = viewAllPipeline === "pe" ? peStages : amStages

  const viewAllRows = useMemo(
    () =>
      viewAllStages.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${viewAllPipeline === "pe" ? "PE Fund" : "Asset Management"} pipeline`,
        meta: `Default win probability`,
        badge: `${s.probability}%`,
        badgeClass: "bg-[#f5f3ff] text-[#6d28d9]",
      })),
    [viewAllStages, viewAllPipeline],
  )

  function openViewAll(pipeline: "pe" | "am") {
    setViewAllPipeline(pipeline)
    setViewAllOpen(true)
  }

  function addStage() {
    if (!stageForm.name.trim()) return
    const stage: PipelineStage = {
      id: `${stageForm.pipeline}-${Date.now()}`,
      name: stageForm.name.trim(),
      probability: Math.min(100, Math.max(0, Number(stageForm.probability) || 0)),
    }
    if (stageForm.pipeline === "pe") {
      setPeStages((prev) => [...prev, stage])
    } else {
      setAmStages((prev) => [...prev, stage])
    }
    setAddStageOpen(false)
    setStageForm({ pipeline: "pe", name: "", probability: "25" })
    toast.success("Stage added")
  }

  function openEditGate(gate: StageGate) {
    setEditingGate(gate)
    setGateForm({
      from: gate.from,
      to: gate.to,
      requirements: gate.requirements.join("\n"),
    })
    setEditGateOpen(true)
  }

  function saveGate() {
    if (!editingGate || !gateForm.from.trim() || !gateForm.to.trim()) return
    const requirements = gateForm.requirements
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)
    setGates((prev) =>
      prev.map((g) =>
        g.id === editingGate.id
          ? { ...g, from: gateForm.from.trim(), to: gateForm.to.trim(), requirements }
          : g,
      ),
    )
    setEditGateOpen(false)
    setEditingGate(null)
    toast.success("Stage gate updated")
  }

  function toggleNotification(id: string, enabled: boolean) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled } : n)),
    )
    toast.success(enabled ? "Notification enabled" : "Notification disabled")
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
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 text-[12px] font-medium",
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
                  Configure PE and Asset Management pipeline stages with default win probabilities.
                </p>
                <Button
                  variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
                  onClick={() => setAddStageOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Add Stage
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StageList title="PE Fund pipeline" stages={peStages} onViewAll={() => openViewAll("pe")} />
                <StageList
                  title="Asset Management pipeline"
                  stages={amStages}
                  onViewAll={() => openViewAll("am")}
                />
              </div>
            </div>
          ) : null}

          {tab === "gates" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Requirements that must be met before an opportunity can advance between stages.
              </p>
              <div className="space-y-3">
                {gates.map((gate) => (
                  <div
                    key={gate.id}
                    className={cn(CARD, "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#0f172a]">{gate.from}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#94a3b8]" />
                        <span className="text-[12px] font-semibold text-[#0f172a]">{gate.to}</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {gate.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2 text-[11px] text-[#64748b]">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c4b5fd]" />
                            {req}
                          </li>
                        ))}
                      </ul>
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
            </div>
          ) : null}

          {tab === "amounts" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Amount types are defined in the SRD and cannot be edited here.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {AMOUNT_TYPES.map((label, i) => (
                  <div key={label} className={cn(CARD, "flex items-center gap-3 p-3.5")}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#f5f3ff] text-[11px] font-bold text-[#7c3aed]">
                      {i + 1}
                    </span>
                    <span className="text-[12px] font-medium text-[#0f172a]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "roles" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Role summaries for fundraising module access. Managed in Admin.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {FR_ROLES.map((role) => (
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
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div>
              <p className="mb-4 text-[12px] text-[#64748b]">
                Choose which events trigger in-app and email notifications for your account.
              </p>
              <ul className={cn(CARD, "divide-y divide-[#f1f5f9]")}>
                {notifications.map((n) => (
                  <NotificationRow key={n.id} item={n} onToggle={toggleNotification} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <FrSimpleWizard
        open={addStageOpen}
        onOpenChange={setAddStageOpen}
        title="Add pipeline stage"
        steps={[{ id: "pipeline", short: "1", label: "Pipeline" }, { id: "stage", short: "2", label: "Stage details" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Add stage"
        validateStep={(step) => step === "stage" && !stageForm.name.trim() ? ["Stage name is required"] : []}
        onSubmit={addStage}
      >
        {(step) => step === "pipeline" ? <FrField label="Pipeline">
            <select
              className={frSelectClass}
              value={stageForm.pipeline}
              onChange={(e) =>
                setStageForm((f) => ({ ...f, pipeline: e.target.value as "pe" | "am" }))
              }
            >
              <option value="pe">PE Fund</option>
              <option value="am">Asset Management</option>
            </select>
          </FrField> : step === "stage" ? <div className="space-y-3">
          <FrField label="Stage name">
            <input
              className={frInputClass}
              value={stageForm.name}
              onChange={(e) => setStageForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Term Sheet"
            />
          </FrField>
          <FrField label="Default probability (%)">
            <input
              className={frInputClass}
              type="number"
              min={0}
              max={100}
              value={stageForm.probability}
              onChange={(e) => setStageForm((f) => ({ ...f, probability: e.target.value }))}
            />
          </FrField>
        </div> : <ReviewList items={[
          { label: "Pipeline", value: stageForm.pipeline === "pe" ? "PE Fund" : "Asset Management" },
          { label: "Stage", value: stageForm.name },
          { label: "Default probability", value: `${stageForm.probability}%` },
        ]} />}
      </FrSimpleWizard>

      <FrViewAllDialog
        open={viewAllOpen}
        onOpenChange={setViewAllOpen}
        title={viewAllPipeline === "pe" ? "PE Fund — all stages" : "Asset Management — all stages"}
        description={`${viewAllStages.length} configured stages`}
        rows={viewAllRows}
      />

      <FrSimpleWizard
        open={editGateOpen}
        onOpenChange={setEditGateOpen}
        title="Edit stage gate"
        steps={[{ id: "transition", short: "1", label: "Transition" }, { id: "requirements", short: "2", label: "Requirements" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Save gate"
        validateStep={(step) => step === "transition" && (!gateForm.from.trim() || !gateForm.to.trim()) ? ["Both stages are required"] : []}
        onSubmit={saveGate}
      >
        {(step) => step === "transition" ? <div className="space-y-3">
          <FrField label="From stage">
            <input
              className={frInputClass}
              value={gateForm.from}
              onChange={(e) => setGateForm((f) => ({ ...f, from: e.target.value }))}
            />
          </FrField>
          <FrField label="To stage">
            <input
              className={frInputClass}
              value={gateForm.to}
              onChange={(e) => setGateForm((f) => ({ ...f, to: e.target.value }))}
            />
          </FrField>
        </div> : step === "requirements" ? <FrField label="Requirements (one per line)">
            <textarea
              className={cn(frInputClass, "min-h-[120px] resize-y py-2")}
              value={gateForm.requirements}
              onChange={(e) => setGateForm((f) => ({ ...f, requirements: e.target.value }))}
            />
          </FrField> : <ReviewList items={[
            { label: "Transition", value: `${gateForm.from} → ${gateForm.to}` },
            { label: "Requirements", value: gateForm.requirements || "None configured" },
          ]} />}
      </FrSimpleWizard>
    </div>
  )
}

function NotificationRow({
  item,
  onToggle,
}: {
  item: FrNotification
  onToggle: (id: string, enabled: boolean) => void
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-[12px] text-[#0f172a]">{item.label}</span>
      <Switch checked={item.enabled} onCheckedChange={(v) => onToggle(item.id, v)} />
    </li>
  )
}
