"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Target, GitBranch } from "lucide-react"
import { toast } from "sonner"
import { PmButton, PmCard, PmEmpty, PmModal, PmPageHeader, PmStatusPill, PmTabPills, PmToggle } from "@/components/performance-mock/primitives"
import {
  performanceFpaIntegrationApi,
  type FpaDriverMapping,
  type FpaTargetMapping,
} from "@/lib/api/performance-fpa-integration-api"
import { kpiApi } from "@/lib/api/kpi-api"
import { fpaApi } from "@/lib/api/fpa-api"

type Kpi = { id: string; name: string }
type FpaModel = { id: string; name: string }
type LineItem = { id: string; name: string; code?: string }
type FpaVersion = { id: string; name: string }

function useCatalogs() {
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [models, setModels] = useState<FpaModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const [kpiRes, modelRes] = await Promise.all([kpiApi.getAvailableKPIs(), fpaApi.listModels()])
        setKpis(Array.isArray((kpiRes as any)?.data) ? (kpiRes as any).data : [])
        setModels(Array.isArray((modelRes as any)?.data) ? (modelRes as any).data : [])
      } catch {
        // leave empty — the create dialogs show "no KPIs/models" and the user can retry
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { kpis, models, loading }
}

function useLineItemsAndVersions(modelId: string) {
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [versions, setVersions] = useState<FpaVersion[]>([])
  useEffect(() => {
    if (!modelId) {
      setLineItems([])
      setVersions([])
      return
    }
    void (async () => {
      try {
        const [modelRes, versionsRes] = await Promise.all([fpaApi.getModel(modelId), fpaApi.listModelVersions(modelId)])
        setLineItems(Array.isArray((modelRes as any)?.data?.lineItems) ? (modelRes as any).data.lineItems : [])
        setVersions(Array.isArray((versionsRes as any)?.data) ? (versionsRes as any).data : [])
      } catch {
        setLineItems([])
        setVersions([])
      }
    })()
  }, [modelId])
  return { lineItems, versions }
}

function CreateTargetMappingModal({
  open,
  onClose,
  kpis,
  models,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  kpis: Kpi[]
  models: FpaModel[]
  onCreated: () => void
}) {
  const [kpiId, setKpiId] = useState("")
  const [modelId, setModelId] = useState("")
  const [lineItemId, setLineItemId] = useState("")
  const [targetSourceVersionId, setTargetSourceVersionId] = useState("")
  const [method, setMethod] = useState("FULL_YEAR_VALUE")
  const [busy, setBusy] = useState(false)
  const { lineItems, versions } = useLineItemsAndVersions(modelId)

  useEffect(() => {
    if (!open) {
      setKpiId(""); setModelId(""); setLineItemId(""); setTargetSourceVersionId(""); setMethod("FULL_YEAR_VALUE")
    }
  }, [open])

  const submit = async () => {
    if (!kpiId || !modelId || !lineItemId) {
      toast.error("Select a KPI, model, and line item.")
      return
    }
    setBusy(true)
    try {
      await performanceFpaIntegrationApi.createTargetMapping({
        kpiId, modelId, lineItemId,
        targetSourceVersionId: targetSourceVersionId || undefined,
        targetMappingMethod: method,
      })
      toast.success("Target mapping created")
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create target mapping")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PmModal
      open={open}
      onClose={onClose}
      title="New Target Mapping"
      description="An FP&A line item flows into this KPI's target when its FP&A version locks."
      footer={
        <>
          <PmButton variant="outline" onClick={onClose}>Cancel</PmButton>
          <PmButton onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Create
          </PmButton>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">KPI</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={kpiId} onChange={(e) => setKpiId(e.target.value)}>
            <option value="">Select a KPI…</option>
            {kpis.map((k) => (<option key={k.id} value={k.id}>{k.name}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">FP&A Model</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={modelId} onChange={(e) => { setModelId(e.target.value); setLineItemId(""); setTargetSourceVersionId("") }}>
            <option value="">Select a model…</option>
            {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">FP&A Line Item</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={lineItemId} onChange={(e) => setLineItemId(e.target.value)} disabled={!modelId}>
            <option value="">Select a line item…</option>
            {lineItems.map((li) => (<option key={li.id} value={li.id}>{li.name}{li.code ? ` (${li.code})` : ""}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">Target Source Version (optional)</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={targetSourceVersionId} onChange={(e) => setTargetSourceVersionId(e.target.value)} disabled={!modelId}>
            <option value="">Any version that locks</option>
            {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">Target Mapping Method</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="FULL_YEAR_VALUE">Full year value (sum)</option>
            <option value="LATEST_PERIOD">Latest period</option>
            <option value="AVERAGE">Average</option>
          </select>
        </label>
      </div>
    </PmModal>
  )
}

function CreateDriverMappingModal({
  open,
  onClose,
  kpis,
  models,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  kpis: Kpi[]
  models: FpaModel[]
  onCreated: () => void
}) {
  const [kpiId, setKpiId] = useState("")
  const [modelId, setModelId] = useState("")
  const [lineItemId, setLineItemId] = useState("")
  const [thresholdPct, setThresholdPct] = useState("70")
  const [busy, setBusy] = useState(false)
  const { lineItems } = useLineItemsAndVersions(modelId)

  useEffect(() => {
    if (!open) { setKpiId(""); setModelId(""); setLineItemId(""); setThresholdPct("70") }
  }, [open])

  const submit = async () => {
    if (!kpiId || !modelId || !lineItemId) {
      toast.error("Select a KPI, model, and line item.")
      return
    }
    const pct = Number(thresholdPct)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast.error("Threshold must be between 0 and 100.")
      return
    }
    setBusy(true)
    try {
      await performanceFpaIntegrationApi.createDriverMapping({ kpiId, modelId, lineItemId, thresholdPct: pct })
      toast.success("Driver mapping created")
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create driver mapping")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PmModal
      open={open}
      onClose={onClose}
      title="New Driver Mapping"
      description="If this KPI's achievement falls below the threshold, a Forecast Review Trigger is raised for FP&A — never a direct change to FP&A."
      footer={
        <>
          <PmButton variant="outline" onClick={onClose}>Cancel</PmButton>
          <PmButton onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Create
          </PmButton>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">KPI</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={kpiId} onChange={(e) => setKpiId(e.target.value)}>
            <option value="">Select a KPI…</option>
            {kpis.map((k) => (<option key={k.id} value={k.id}>{k.name}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">FP&A Model</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={modelId} onChange={(e) => { setModelId(e.target.value); setLineItemId("") }}>
            <option value="">Select a model…</option>
            {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">FP&A Driver (line item)</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={lineItemId} onChange={(e) => setLineItemId(e.target.value)} disabled={!modelId}>
            <option value="">Select a driver…</option>
            {lineItems.map((li) => (<option key={li.id} value={li.id}>{li.name}{li.code ? ` (${li.code})` : ""}</option>))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">Achievement threshold (%)</span>
          <input type="number" min={0} max={100} className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={thresholdPct} onChange={(e) => setThresholdPct(e.target.value)} />
        </label>
      </div>
    </PmModal>
  )
}

export function FpaMappingScreen() {
  const [tab, setTab] = useState<"targets" | "drivers">("targets")
  const [targetMappings, setTargetMappings] = useState<FpaTargetMapping[]>([])
  const [driverMappings, setDriverMappings] = useState<FpaDriverMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [createOpen, setCreateOpen] = useState(false)
  const { kpis, models } = useCatalogs()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [tRes, dRes] = await Promise.all([
        performanceFpaIntegrationApi.listTargetMappings(),
        performanceFpaIntegrationApi.listDriverMappings(),
      ])
      setTargetMappings((tRes as any)?.data || [])
      setDriverMappings((dRes as any)?.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load mappings.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const toggleTarget = async (id: string, isActive: boolean) => {
    try {
      await performanceFpaIntegrationApi.setTargetMappingActive(id, isActive)
      setTargetMappings((prev) => prev.map((m) => (m.id === id ? { ...m, isActive } : m)))
    } catch {
      toast.error("Failed to update mapping")
    }
  }
  const toggleDriver = async (id: string, isActive: boolean) => {
    try {
      await performanceFpaIntegrationApi.setDriverMappingActive(id, isActive)
      setDriverMappings((prev) => prev.map((m) => (m.id === id ? { ...m, isActive } : m)))
    } catch {
      toast.error("Failed to update mapping")
    }
  }

  return (
    <div className="p-4 space-y-4">
      <PmPageHeader
        title="FP&A Integration"
        subtitle="Map FP&A line items to KPI targets and drivers. Targets snapshot in when an FP&A version locks; driver breaches raise a Forecast Review Trigger for FP&A — Performance never writes to FP&A directly."
        breadcrumbs={["Performance Management", "Configuration", "FP&A Integration"]}
        actions={<PmButton onClick={() => setCreateOpen(true)}><Plus className="w-3.5 h-3.5" /> New {tab === "targets" ? "Target Mapping" : "Driver Mapping"}</PmButton>}
      />

      <PmTabPills
        tabs={[
          { id: "targets", label: "Target Mappings" },
          { id: "drivers", label: "Driver Mappings" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "targets" | "drivers")}
      />

      <PmCard className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B7280]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-[#991B1B]">{error}</p>
            <PmButton variant="outline" className="mt-3" onClick={() => void load()}>Retry</PmButton>
          </div>
        ) : tab === "targets" ? (
          targetMappings.length === 0 ? (
            <PmEmpty title="No target mappings yet" description="Create one to feed an FP&A line item into a KPI's target." />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-left text-[11px] uppercase tracking-wide text-[#6B7280]">
                  <th className="py-2 pr-3 font-medium">KPI</th>
                  <th className="py-2 pr-3 font-medium">Model</th>
                  <th className="py-2 pr-3 font-medium">Line Item</th>
                  <th className="py-2 pr-3 font-medium">Method</th>
                  <th className="py-2 pr-3 font-medium">Source Version</th>
                  <th className="py-2 pr-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {targetMappings.map((m) => (
                  <tr key={m.id} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="py-2 pr-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#7C3AED]" />{m.kpiName || m.kpiId}</td>
                    <td className="py-2 pr-3">{m.modelName || m.modelId}</td>
                    <td className="py-2 pr-3">{m.lineItemName || m.lineItemId}</td>
                    <td className="py-2 pr-3"><PmStatusPill label={m.targetMappingMethod} tone="purple" /></td>
                    <td className="py-2 pr-3 text-[#6B7280]">{m.targetSourceVersionName || "Any version that locks"}</td>
                    <td className="py-2 pr-3"><PmToggle checked={m.isActive} onChange={(v) => void toggleTarget(m.id, v)} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : driverMappings.length === 0 ? (
          <PmEmpty title="No driver mappings yet" description="Create one so a KPI breach raises a review trigger for FP&A." />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-[11px] uppercase tracking-wide text-[#6B7280]">
                <th className="py-2 pr-3 font-medium">KPI</th>
                <th className="py-2 pr-3 font-medium">Model</th>
                <th className="py-2 pr-3 font-medium">Driver</th>
                <th className="py-2 pr-3 font-medium">Threshold</th>
                <th className="py-2 pr-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {driverMappings.map((m) => (
                <tr key={m.id} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="py-2 pr-3 flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5 text-[#7C3AED]" />{m.kpiName || m.kpiId}</td>
                  <td className="py-2 pr-3">{m.modelName || m.modelId}</td>
                  <td className="py-2 pr-3">{m.lineItemName || m.lineItemId}</td>
                  <td className="py-2 pr-3">Below {Number(m.thresholdPct).toFixed(0)}%</td>
                  <td className="py-2 pr-3"><PmToggle checked={m.isActive} onChange={(v) => void toggleDriver(m.id, v)} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PmCard>

      {tab === "targets" ? (
        <CreateTargetMappingModal open={createOpen} onClose={() => setCreateOpen(false)} kpis={kpis} models={models} onCreated={() => void load()} />
      ) : (
        <CreateDriverMappingModal open={createOpen} onClose={() => setCreateOpen(false)} kpis={kpis} models={models} onCreated={() => void load()} />
      )}
    </div>
  )
}
