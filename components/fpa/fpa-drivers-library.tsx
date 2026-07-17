"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Search, Download, ArrowUpDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaDrawer } from "./fpa-drawer"
import { FpaStatusBadge } from "./fpa-status-badge"
import { asNumber, fpaApi, formatMoney, type FpaDriver } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  setSelectedModelId,
  setSelectedScenarioId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type DriverCategory = "REVENUE" | "OPEX" | "GENERAL" | string
type SpreadingLabel = "Even spread" | "Seasonal profile" | "Prior year pattern" | "Manual"
type ConfidenceLabel = "High" | "Medium" | "Low"
type DisplaySpreadingLabel = SpreadingLabel | "—"
type DisplayConfidenceLabel = ConfidenceLabel | "—"

const CONFIDENCE_TO_API: Record<ConfidenceLabel, "HIGH" | "MEDIUM" | "LOW"> = {
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
}

const SPREAD_TO_API: Record<SpreadingLabel, "EVEN" | "SEASONAL" | "PRIOR_YEAR" | "MANUAL"> = {
  "Even spread": "EVEN",
  "Seasonal profile": "SEASONAL",
  "Prior year pattern": "PRIOR_YEAR",
  Manual: "MANUAL",
}

function confidenceFromApi(raw: string | null | undefined): DisplayConfidenceLabel {
  const c = raw?.toUpperCase()
  if (!c) return "—"
  if (c === "MEDIUM") return "Medium"
  if (c === "LOW") return "Low"
  return c === "HIGH" ? "High" : "—"
}

function spreadingFromApi(raw: string | null | undefined): DisplaySpreadingLabel {
  const s = raw?.toUpperCase().replace(/-/g, "_")
  if (!s) return "—"
  if (s.includes("SEASON")) return "Seasonal profile"
  if (s.includes("PRIOR") || s.includes("YEAR")) return "Prior year pattern"
  if (s.includes("MANUAL")) return "Manual"
  return s === "EVEN" ? "Even spread" : "—"
}

type LocalDriver = FpaDriver & {
  confidenceLabel: DisplayConfidenceLabel
  spreadingLabel: DisplaySpreadingLabel
}

function normalizeCategory(raw: string | null | undefined): DriverCategory {
  const c = (raw || "GENERAL").trim().toUpperCase()
  if (c.includes("REV")) return "REVENUE"
  if (c.includes("OPEX") || c.includes("EXPENSE") || c.includes("COST")) return "OPEX"
  if (c === "GENERAL" || c === "OTHER") return "GENERAL"
  return c || "GENERAL"
}

function toLocalDriver(d: FpaDriver): LocalDriver {
  return {
    ...d,
    category: normalizeCategory(d.category),
    confidenceLabel: confidenceFromApi(d.confidence),
    spreadingLabel: spreadingFromApi(d.spreadingMethod),
  }
}

export function FpaDriversLibrary() {
  const dispatch = useAppDispatch()
  const { selectedModelId, selectedScenarioId, selectedVersionId, models, scenarios, versions } =
    useAppSelector((s) => s.fpa)
  const { canConfigureDrivers } = useFpaPermissions()

  const [drivers, setDrivers] = useState<LocalDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [sortKey, setSortKey] = useState<"name" | "value" | "category">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newCategory, setNewCategory] = useState<"REVENUE" | "OPEX" | "GENERAL">("GENERAL")
  const [newUnit, setNewUnit] = useState("%")
  const [newPeriod, setNewPeriod] = useState("")

  const [selected, setSelected] = useState<LocalDriver | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [editPeriod, setEditPeriod] = useState("")
  const [editSpreading, setEditSpreading] = useState<DisplaySpreadingLabel>("—")
  const [editConfidence, setEditConfidence] = useState<DisplayConfidenceLabel>("—")

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) || null,
    [models, selectedModelId],
  )

  const effectiveVersionId =
    selectedVersionId || selectedModel?.defaultVersionId || versions[0]?.id || null
  const effectiveScenarioId =
    selectedScenarioId || selectedModel?.defaultScenarioId || scenarios[0]?.id || null

  useEffect(() => {
    if (!selectedModelId || models.length === 0) {
      void dispatch(bootstrapFpaSelection(selectedModelId || undefined))
    }
  }, [dispatch, selectedModelId, models.length])

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setDrivers([])
      setLoadError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fpaApi.listDrivers({
        modelId: selectedModelId,
        versionId: effectiveVersionId || undefined,
        scenarioId: effectiveScenarioId || undefined,
      })
      if (!res.success) throw new Error(res.message || "Failed to load drivers")
      const rows = (res.data || []).map((d) => toLocalDriver(d))
      setDrivers(rows)
      if (!selectedVersionId && selectedModel?.defaultVersionId) {
        dispatch(setSelectedVersionId(selectedModel.defaultVersionId))
      }
      if (!selectedScenarioId && selectedModel?.defaultScenarioId) {
        dispatch(setSelectedScenarioId(selectedModel.defaultScenarioId))
      }
    } catch (err) {
      const msg = errorMessage(err)
      setLoadError(msg)
      setDrivers([])
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${selectedModelId}/drivers`,
        method: "GET",
        message: msg,
        impact: "Assumptions library empty",
        response: err,
      })
    } finally {
      setLoading(false)
    }
  }, [
    selectedModelId,
    effectiveVersionId,
    effectiveScenarioId,
    selectedVersionId,
    selectedScenarioId,
    selectedModel?.defaultVersionId,
    selectedModel?.defaultScenarioId,
    dispatch,
  ])

  useEffect(() => {
    void load()
  }, [load])

  const filteredDrivers = useMemo(() => {
    const list = drivers.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase())
      const cat = normalizeCategory(d.category)
      const matchCategory = activeCategory === "ALL" || cat === activeCategory
      return matchSearch && matchCategory
    })
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "category")
        cmp = normalizeCategory(a.category).localeCompare(normalizeCategory(b.category))
      else cmp = asNumber(a.value) - asNumber(b.value)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [drivers, searchQuery, activeCategory, sortKey, sortDir])

  const availableCategories = useMemo(
    () => Array.from(new Set(drivers.map((driver) => normalizeCategory(driver.category)))).sort(),
    [drivers],
  )

  const openDriver = (d: LocalDriver) => {
    setSelected(d)
    setEditValue(String(asNumber(d.value)))
    setEditPeriod(d.periodDate ? d.periodDate.slice(0, 10) : "")
    setEditSpreading(d.spreadingLabel)
    setEditConfidence(d.confidenceLabel)
    setDrawerOpen(true)
  }

  const saveDriver = async () => {
    if (!selected) return
    if (!canConfigureDrivers) {
      toast.error("You do not have permission to edit drivers")
      return
    }
    setBusy(true)
    try {
      const value = Number(editValue)
      if (!Number.isFinite(value)) {
        toast.error("Enter a valid number")
        return
      }
      const confidence = editConfidence === "—" ? null : CONFIDENCE_TO_API[editConfidence]
      const spreadingMethod = editSpreading === "—" ? null : SPREAD_TO_API[editSpreading]
      const res = await fpaApi.updateDriver(selected.id, {
        value,
        periodDate: editPeriod || null,
        confidence,
        spreadingMethod,
      })
      if (!res.success) throw new Error(res.message || "Driver update failed")
      const payload = res.data
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === selected.id
            ? toLocalDriver({
                ...d,
                ...(payload || {}),
                value: payload?.value ?? value,
                periodDate: payload?.periodDate ?? (editPeriod || d.periodDate),
                confidence: payload?.confidence ?? confidence,
                spreadingMethod: payload?.spreadingMethod ?? spreadingMethod,
              })
            : d,
        ),
      )
      setDrawerOpen(false)
      toast.success("Assumption updated")
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/drivers/${selected.id}`,
        method: "PUT",
        message: errorMessage(err),
        impact: "Assumption save failed",
        response: err,
      })
      toast.error("Could not save assumption", { description: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const createDriver = async () => {
    if (!canConfigureDrivers) {
      toast.error("You do not have permission to create drivers")
      return
    }
    if (!selectedModelId) {
      toast.error("Select a model first")
      return
    }
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Name and code required")
      return
    }
    if (newValue.trim() === "") {
      toast.error("Default value required")
      return
    }
    const parsedValue = Number(newValue)
    if (!Number.isFinite(parsedValue)) {
      toast.error("Enter a valid default value")
      return
    }
    if (!effectiveScenarioId || !effectiveVersionId) {
      toast.error("Select a scenario and version first", {
        description: "Drivers are scoped to model + version + scenario (SRD §38 / §43).",
      })
      return
    }
    setCreating(true)
    try {
      const res = await fpaApi.createDriver(selectedModelId, {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory,
        value: parsedValue,
        unit: newUnit || undefined,
        periodDate: newPeriod || undefined,
        scenarioId: effectiveScenarioId,
        versionId: effectiveVersionId,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Create failed")
      setDrivers((prev) => [...prev, toLocalDriver(res.data!)])
      setIsCreateOpen(false)
      setNewName("")
      setNewCode("")
      setNewValue("")
      setNewPeriod("")
      toast.success(`Created driver: “${res.data.name}”`)
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${selectedModelId}/drivers`,
        method: "POST",
        message: errorMessage(err),
        impact: "Create assumption failed",
        response: err,
      })
      toast.error("Could not create driver", { description: errorMessage(err) })
    } finally {
      setCreating(false)
    }
  }

  const deleteDriver = async () => {
    if (!selected) return
    if (!canConfigureDrivers) {
      toast.error("You do not have permission to delete drivers")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.deleteDriver(selected.id)
      if (!res.success) throw new Error(res.message || "Delete failed")
      setDrivers((prev) => prev.filter((d) => d.id !== selected.id))
      setDrawerOpen(false)
      setSelected(null)
      toast.success("Driver removed")
    } catch (err) {
      const msg = errorMessage(err)
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/drivers/${selected.id}`,
        method: "DELETE",
        message: msg,
        impact: "Delete assumption failed",
        response: err,
      })
      toast.error("Could not delete driver", {
        description: /409|referenc/i.test(msg)
          ? "Driver is referenced by formulas or cells (HTTP 409)."
          : msg,
      })
    } finally {
      setBusy(false)
    }
  }

  const exportDriversCsv = () => {
    const header = "Code,Name,Category,Value,Unit,Period,ScenarioId,VersionId"
    const rows = filteredDrivers.map((d) =>
      [
        d.code,
        d.name,
        normalizeCategory(d.category),
        asNumber(d.value),
        d.unit || "",
        d.periodDate || "",
        d.scenarioId || effectiveScenarioId || "",
        d.versionId || effectiveVersionId || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    const content = `\uFEFF${header}\r\n${rows.join("\r\n")}`
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assumptions-drivers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Assumptions exported")
  }

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const scenarioLabel =
    scenarios.find((s) => s.id === effectiveScenarioId)?.name ||
    (effectiveScenarioId ? "Selected scenario" : "No scenario")

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Assumptions"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-[#667085]">
              Model
              <select
                className="h-9 rounded-full border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#101828]"
                value={selectedModelId || ""}
                onChange={(e) => {
                  const id = e.target.value || null
                  if (id) {
                    void dispatch(bootstrapFpaSelection(id))
                  } else {
                    dispatch(setSelectedModelId(null))
                    dispatch(setSelectedVersionId(null))
                    dispatch(setSelectedScenarioId(null))
                  }
                }}
              >
                <option value="">Select model…</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-4 text-xs font-semibold"
              asChild
            >
              <Link href="/forecasting/scenarios">Scenarios</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-4 text-xs font-semibold"
              onClick={exportDriversCsv}
              disabled={!filteredDrivers.length}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            {canConfigureDrivers ? (
              <Button
                type="button"
                variant="gradient-info"
                className="rounded-full h-9 px-4 text-xs font-semibold shadow-sm"
                onClick={() => setIsCreateOpen(true)}
                disabled={!selectedModelId}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Driver
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="px-4 sm:px-5 pb-6 space-y-4 w-full">
        <p className="text-[12px] text-[#667085]">
          Driver library for the selected <span className="font-semibold text-[#344054]">model / version / scenario</span>
          {" · "}
          Currently scoped to <span className="font-semibold text-[#344054]">{scenarioLabel}</span>
          {" · "}
          Create Best / Downside on{" "}
          <Link href="/forecasting/scenarios" className="text-[#2563eb] font-semibold hover:underline">
            Scenarios
          </Link>
          , then edit assumptions here or in the planning worksheet.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#eaecf0] p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5">
            {["ALL", ...availableCategories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-semibold border transition-all",
                  activeCategory === cat
                    ? "border-[#2563eb] bg-[#eff8ff] text-[#175cd3]"
                    : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]",
                )}
              >
                {cat === "ALL" ? "All Drivers" : cat}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98a2b3]" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-full border border-[#d0d5dd] pl-8 pr-3 text-xs text-[#101828] placeholder:text-[#98a2b3] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        {!selectedModelId ? (
          <div className="rounded-xl border border-dashed border-[#eaecf0] bg-white p-8 text-center text-sm text-[#94a3b8]">
            Select a model to load live assumptions from the API.
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-[#eaecf0] bg-white p-10 flex items-center justify-center gap-2 text-sm text-[#667085]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading assumptions…
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-[#fda29b] bg-[#fef3f2] p-6 text-sm text-[#b42318] space-y-3">
            <p className="font-semibold">Could not load drivers</p>
            <p className="text-[#912018]">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-4 text-xs"
              onClick={() => void load()}
            >
              Retry
            </Button>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#eaecf0] bg-white p-8 text-center text-sm text-[#94a3b8] space-y-2">
            <p>No drivers for this model / version / scenario.</p>
            <p className="text-[12px]">
              Create one here, or seed scenarios from Base on the Scenarios page first.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
            <table className="w-full text-[13px] border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-left text-xs text-[#475467]">
                  <th className="px-5 py-3 font-semibold w-1/4">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-[#101828]"
                    >
                      Driver Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("category")}
                      className="inline-flex items-center gap-1 hover:text-[#101828]"
                    >
                      Category <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">Spreading</th>
                  <th className="px-4 py-3 font-semibold text-right w-24">
                    <button
                      type="button"
                      onClick={() => toggleSort("value")}
                      className="inline-flex items-center gap-1 ml-auto hover:text-[#101828]"
                    >
                      Plan Value <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Confidence</th>
                  <th className="px-4 py-3 font-semibold text-center w-28">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {filteredDrivers.map((d) => (
                  <tr
                    key={d.id}
                    className="cursor-pointer hover:bg-[#f9fafb]/50 transition-colors"
                    onClick={() => openDriver(d)}
                  >
                    <td className="px-5 py-3 font-semibold text-[#101828]">
                      <div>{d.name}</div>
                      <div className="text-[10px] text-[#667085] font-normal mt-0.5">
                        {d.periodDate ? `As of ${String(d.periodDate).slice(0, 10)}` : "No period"}
                        {d.priorActual != null || d.priorValue != null
                          ? ` · Prior ${asNumber(d.priorActual ?? d.priorValue)}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#475569] font-mono text-xs">{d.code}</td>
                    <td className="px-4 py-3 text-[#344054] font-medium">
                      {normalizeCategory(d.category)}
                    </td>
                    <td className="px-4 py-3 text-[#667085] text-center text-xs font-semibold">
                      {d.spreadingLabel}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#101828]">
                      {d.unit === "%" || String(d.unit || "").includes("%")
                        ? `${asNumber(d.value)}%`
                        : formatMoney(d.value)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-5 px-2 rounded-full text-[10px] font-bold",
                          d.confidenceLabel === "High" && "bg-[#edfcf2] text-[#087443]",
                          d.confidenceLabel === "Medium" && "bg-[#fffbeb] text-[#b45309]",
                          d.confidenceLabel === "Low" && "bg-[#fef3f2] text-[#b42318]",
                        )}
                      >
                        {d.confidenceLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FpaStatusBadge tone={d.requiresApproval ? "warning" : "neutral"}>
                        {d.requiresApproval ? "Required" : "Not required"}
                      </FpaStatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Create assumption driver
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-[13px]">
            <p className="text-[11px] text-[#667085]">
              Saved to model <span className="font-semibold">{selectedModel?.name || "—"}</span>
              {" · "}
              scenario <span className="font-semibold">{scenarioLabel}</span>
            </p>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#344054]">Code Name (Uppercase Mono)</label>
              <input
                className="w-full h-9 rounded-lg border border-[#d0d5dd] px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="REV_GROWTH_INDEX"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#344054]">Driver Display Name</label>
              <input
                className="w-full h-9 rounded-lg border border-[#d0d5dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Product Growth Multiplier"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#344054]">Category</label>
                <select
                  className="w-full h-9 rounded-lg border border-[#d0d5dd] px-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as "REVENUE" | "OPEX" | "GENERAL")
                  }
                >
                  <option value="REVENUE">Revenue</option>
                  <option value="OPEX">Opex</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[#344054]">Unit</label>
                <select
                  className="w-full h-9 rounded-lg border border-[#d0d5dd] px-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                >
                  <option value="%">% (Percent)</option>
                  <option value="USD">USD ($)</option>
                  <option value="">None</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#344054]">Default Value</label>
              <input
                type="number"
                step="0.01"
                className="w-full h-9 rounded-lg border border-[#d0d5dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 5.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#344054]">Effective Period (optional)</label>
              <input
                type="date"
                className="w-full h-9 rounded-lg border border-[#d0d5dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-4 text-xs font-semibold"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient-info"
              className="rounded-full h-9 px-4 text-xs font-semibold shadow-sm"
              disabled={creating}
              onClick={() => void createDriver()}
            >
              {creating ? "Creating…" : "Create Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FpaDrawer
        open={drawerOpen && !!selected}
        onClose={() => setDrawerOpen(false)}
        title="Assumption Details & Phasing"
        badge={
          selected ? (
            <span className="text-[10px] bg-[#f2f4f7] text-[#667085] px-2 py-0.5 rounded-full font-bold uppercase">
              {normalizeCategory(selected.category)}
            </span>
          ) : undefined
        }
        footer={
          <div className="flex gap-2">
            {canConfigureDrivers && selected ? (
              <button
                type="button"
                disabled={busy}
                className="h-9 rounded-full border border-[#fda29b] px-4 text-xs font-semibold text-[#b42318] hover:bg-[#fef3f2] inline-flex items-center gap-1 disabled:opacity-50"
                onClick={() => void deleteDriver()}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : null}
            <button
              type="button"
              className="h-9 flex-1 rounded-full border border-[#d0d5dd] text-xs font-semibold text-[#475569] hover:bg-[#f9fafb]"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !canConfigureDrivers}
              className="h-9 flex-1 rounded-full bg-[#2563eb] text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              onClick={() => void saveDriver()}
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-5 text-[13px]">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                Driver Name
              </span>
              <p className="text-[14px] font-bold text-[#101828] mt-0.5">{selected.name}</p>
              <p className="text-[10px] text-[#475569] mt-0.5 font-mono bg-[#f9fafb] inline-block px-1.5 py-0.5 rounded border border-[#eaecf0]">
                {selected.code}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                  Value
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2.5 text-right font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={!canConfigureDrivers}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                  Period
                </span>
                <input
                  type="date"
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(e.target.value)}
                  disabled={!canConfigureDrivers}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                  Confidence
                </span>
                <select
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editConfidence}
                  onChange={(e) => setEditConfidence(e.target.value as DisplayConfidenceLabel)}
                  disabled={!canConfigureDrivers}
                >
                  <option value="—">Not provided</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                  Spreading Method
                </span>
                <select
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editSpreading}
                  onChange={(e) => setEditSpreading(e.target.value as DisplaySpreadingLabel)}
                  disabled={!canConfigureDrivers}
                >
                  <option value="—">Not provided</option>
                  <option value="Even spread">Even spread</option>
                  <option value="Seasonal profile">Seasonal profile</option>
                  <option value="Prior year pattern">Prior year pattern</option>
                  <option value="Manual">Manual</option>
                </select>
                <p className="text-[10px] text-[#98a2b3]">Saved on driver · plan cell Spread tools still apply phasing</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#eaecf0] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">
                  Phasing profile
                </span>
                <span className="text-[10px] text-[#2563eb] font-semibold">
                  {editSpreading}
                </span>
              </div>
              <div className="rounded-xl border border-[#eaecf0] bg-[#f9fafb] p-3 text-[11px] leading-relaxed text-[#667085]">
                Monthly phasing values are shown in the planning worksheet. This panel does not
                invent a seasonal profile when the API returns only a spreading method.
              </div>
            </div>
          </div>
        ) : null}
      </FpaDrawer>
    </div>
  )
}
