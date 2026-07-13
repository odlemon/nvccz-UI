"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaDrawer } from "./fpa-drawer"
import { FpaStatusBadge } from "./fpa-status-badge"
import { asNumber, fpaApi, formatMoney, type FpaDriver } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"

export function FpaDriversLibrary() {
  const { selectedModelId, selectedScenarioId, selectedVersionId } = useAppSelector((s) => s.fpa)
  const { canConfigureDrivers } = useFpaPermissions()
  const [drivers, setDrivers] = useState<FpaDriver[]>([])
  const [selected, setSelected] = useState<FpaDriver | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [editPeriod, setEditPeriod] = useState("")
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newValue, setNewValue] = useState("")

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setDrivers([])
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.listDrivers({
        modelId: selectedModelId,
        scenarioId: selectedScenarioId || undefined,
        versionId: selectedVersionId || undefined,
      })
      if (!res.success) throw new Error(res.message || "Drivers failed")
      const list = res.data || []
      setDrivers(list)
      if (selected && !list.find((d) => d.id === selected.id)) {
        setSelected(list[0] || null)
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${selectedModelId}/drivers`,
        method: "GET",
        message: errorMessage(err),
        impact: "Drivers library empty",
        response: err,
      })
      toast.error(errorMessage(err))
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }, [selectedModelId, selectedScenarioId, selectedVersionId, selected])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on selection only
  }, [selectedModelId, selectedScenarioId, selectedVersionId])

  const openDriver = (d: FpaDriver) => {
    setSelected(d)
    setEditValue(String(asNumber(d.value)))
    setEditPeriod(d.periodDate ? d.periodDate.slice(0, 10) : "")
    setCreating(false)
    setDrawerOpen(true)
  }

  const saveDriver = async () => {
    if (!selectedModelId || !selected) return
    setBusy(true)
    try {
      const res = await fpaApi.updateDriver(selected.id, {
        value: Number(editValue),
        unit: selected.unit || undefined,
        periodDate: editPeriod || undefined,
        name: selected.name,
        category: selected.category,
      })
      if (!res.success) throw new Error(res.message || "Save failed")
      toast.success("Driver saved")
      setDrawerOpen(false)
      await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/drivers/${selected.id}`,
        method: "PUT",
        message: errorMessage(err),
        impact: "Cannot save driver edits",
        request: { value: editValue, periodDate: editPeriod },
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const createDriver = async () => {
    if (!selectedModelId || !newName.trim() || !newCode.trim()) {
      toast.error("Name and code required")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.createDriver(selectedModelId, {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        category: "GENERAL",
        value: Number(newValue) || 0,
        scenarioId: selectedScenarioId || undefined,
        versionId: selectedVersionId || undefined,
      })
      if (!res.success) throw new Error(res.message || "Create failed")
      toast.success("Driver created")
      setCreating(false)
      setNewName("")
      setNewCode("")
      setNewValue("")
      setDrawerOpen(false)
      await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${selectedModelId}/drivers`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot create drivers",
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Assumptions"
        actions={
          canConfigureDrivers ? (
            <button
              type="button"
              disabled={!selectedModelId}
              onClick={() => {
                setCreating(true)
                setSelected(null)
                setDrawerOpen(true)
              }}
              className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 text-xs font-medium text-white disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              New driver
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-8rem)]">
        <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-4">
          <p className="text-sm text-[#64748b]">
            Central drivers that recalculate dependent line items across scenarios and versions.
          </p>

          {!selectedModelId ? (
            <p className="text-sm text-[#94a3b8]">Select a model to load drivers.</p>
          ) : loading ? (
            <div className="flex items-center gap-2 py-12 text-[#64748b]">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading drivers…
            </div>
          ) : drivers.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#e2e8f0] bg-white p-8 text-center text-sm text-[#94a3b8]">
              No drivers yet. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border border-[#e2e8f0] bg-white overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-left text-xs text-[#64748b]">
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-[#e2e8f0] cursor-pointer hover:bg-[#f8fafc]"
                      onClick={() => openDriver(d)}
                    >
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{d.name}</td>
                      <td className="px-4 py-3 text-[#475569] font-mono text-xs">{d.code}</td>
                      <td className="px-4 py-3 text-[#475569]">{d.category}</td>
                      <td className="px-4 py-3 text-[#475569]">
                        {d.periodDate ? d.periodDate.slice(0, 10) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-[#0f172a]">
                        {d.unit === "%" || d.unit === "pct"
                          ? `${asNumber(d.value)}%`
                          : formatMoney(d.value)}
                        {d.unit && d.unit !== "%" ? (
                          <span className="text-[#94a3b8] ml-1 text-xs">{d.unit}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <FpaStatusBadge tone="success">Active</FpaStatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <FpaDrawer
          open={drawerOpen && (!!selected || creating)}
          onClose={() => setDrawerOpen(false)}
          title={creating ? "New driver" : "Period editor"}
          badge={
            selected && !creating ? (
              <FpaStatusBadge tone="info">{selected.category}</FpaStatusBadge>
            ) : undefined
          }
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                className="h-9 flex-1 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#475569]"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !canConfigureDrivers}
                className="h-9 flex-1 rounded-full bg-[#2563eb] text-xs font-medium text-white disabled:opacity-50"
                onClick={() => void (creating ? createDriver() : saveDriver())}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          }
        >
          {creating ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-[#64748b]">Code</dt>
                <dd className="mt-1">
                  <input
                    className="w-full h-9 rounded-md border border-[#e2e8f0] px-3 text-sm font-mono"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="HC_GROWTH"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748b]">Name</dt>
                <dd className="mt-1">
                  <input
                    className="w-full h-9 rounded-md border border-[#e2e8f0] px-3 text-sm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748b]">Value</dt>
                <dd className="mt-1">
                  <input
                    className="w-full h-9 rounded-md border border-[#e2e8f0] px-3 text-sm tabular-nums"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </dd>
              </div>
            </dl>
          ) : selected ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-[#64748b]">Driver</dt>
                <dd className="mt-1 font-medium text-[#0f172a]">{selected.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748b]">Period</dt>
                <dd className="mt-1">
                  <input
                    type="date"
                    className="w-full h-9 rounded-md border border-[#e2e8f0] px-3 text-sm"
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(e.target.value)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748b]">Value</dt>
                <dd className="mt-1">
                  <input
                    className="w-full h-9 rounded-md border border-[#e2e8f0] px-3 text-sm tabular-nums"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </dd>
              </div>
              <p className="text-xs text-[#94a3b8]">
                No dedicated driver update API — save posts a new driver row with the same code.
              </p>
            </dl>
          ) : null}
        </FpaDrawer>
      </div>
    </div>
  )
}
