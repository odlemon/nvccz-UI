"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Loader2, Plus, Search, Download, ArrowUpDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaDrawer } from "./fpa-drawer"
import { FpaStatusBadge } from "./fpa-status-badge"
import { asNumber, fpaApi, formatMoney, type FpaDriver } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
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

type LocalDriver = FpaDriver & {
  confidence: "High" | "Medium" | "Low"
  spreadingMethod: "Even spread" | "Seasonal profile" | "Prior year pattern" | "Manual"
}

const INITIAL_DRIVERS: LocalDriver[] = [
  { id: "dr-1", code: "REV_GROWTH", name: "Revenue Growth", category: "REVENUE", value: 8.7, unit: "%", periodDate: "2026-06-30", confidence: "High", spreadingMethod: "Even spread" },
  { id: "dr-2", code: "PRICE_CHANGE", name: "Price Change", category: "REVENUE", value: 3.2, unit: "%", periodDate: "2026-06-30", confidence: "Medium", spreadingMethod: "Prior year pattern" },
  { id: "dr-3", code: "VOL_GROWTH", name: "Volume Growth", category: "REVENUE", value: 5.1, unit: "%", periodDate: "2026-06-30", confidence: "High", spreadingMethod: "Seasonal profile" },
  { id: "dr-4", code: "OPEX_GROWTH", name: "Opex Growth", category: "OPEX", value: 6.4, unit: "%", periodDate: "2026-06-30", confidence: "Medium", spreadingMethod: "Even spread" },
  { id: "dr-5", code: "TAX_RATE", name: "Tax Rate", category: "GENERAL", value: 22.3, unit: "%", periodDate: "2026-06-30", confidence: "High", spreadingMethod: "Even spread" },
  { id: "dr-6", code: "FX_RATE", name: "FX Rate (USD/EUR)", category: "GENERAL", value: 1.09, unit: "", periodDate: "2026-06-30", confidence: "High", spreadingMethod: "Even spread" },
  { id: "dr-7", code: "MKT_INDEX", name: "Marketing Cost Index", category: "OPEX", value: 1.04, unit: "", periodDate: "2026-06-30", confidence: "Low", spreadingMethod: "Manual" },
]

export function FpaDriversLibrary() {
  const { selectedModelId, selectedScenarioId, selectedVersionId } = useAppSelector((s) => s.fpa)
  const { canConfigureDrivers } = useFpaPermissions()

  const [drivers, setDrivers] = useState<LocalDriver[]>(INITIAL_DRIVERS)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  // Filtering / Search States
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<"ALL" | "REVENUE" | "OPEX" | "GENERAL">("ALL")
  const [sortKey, setSortKey] = useState<"name" | "value" | "category">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newCategory, setNewCategory] = useState<"REVENUE" | "OPEX" | "GENERAL">("GENERAL")
  const [newUnit, setNewUnit] = useState("%")

  // Edit Drawer State
  const [selected, setSelected] = useState<LocalDriver | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [editPeriod, setEditPeriod] = useState("")
  const [editSpreading, setEditSpreading] = useState<LocalDriver["spreadingMethod"]>("Even spread")
  const [editConfidence, setEditConfidence] = useState<LocalDriver["confidence"]>("High")

  // Search and Category filter logic
  const filteredDrivers = useMemo(() => {
    const list = drivers.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = activeCategory === "ALL" || d.category === activeCategory
      return matchSearch && matchCategory
    })
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category)
      else cmp = asNumber(a.value) - asNumber(b.value)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [drivers, searchQuery, activeCategory, sortKey, sortDir])

  const openDriver = (d: LocalDriver) => {
    setSelected(d)
    setEditValue(String(asNumber(d.value)))
    setEditPeriod(d.periodDate ? d.periodDate.slice(0, 10) : "")
    setEditSpreading(d.spreadingMethod)
    setEditConfidence(d.confidence)
    setDrawerOpen(true)
  }

  const saveDriver = async () => {
    if (!selected) return
    setBusy(true)

    // Simulate saving and update in local state for instantaneous interactivity
    setTimeout(() => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === selected.id
            ? {
                ...d,
                value: Number(editValue) || 0,
                periodDate: editPeriod,
                spreadingMethod: editSpreading,
                confidence: editConfidence,
              }
            : d,
        ),
      )
      setBusy(false)
      setDrawerOpen(false)
      toast.success("Driver assumptions updated")
    }, 500)
  }

  const createDriver = () => {
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Name and code required")
      return
    }

    const newDriver: LocalDriver = {
      id: `dr-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      value: Number(newValue) || 0,
      unit: newUnit,
      periodDate: new Date().toISOString().slice(0, 10),
      confidence: "High",
      spreadingMethod: "Even spread",
    }

    setDrivers((prev) => [...prev, newDriver])
    setIsCreateOpen(false)
    setNewName("")
    setNewCode("")
    setNewValue("")
    toast.success(`Created driver: "${newDriver.name}"`)
  }

  const deleteDriver = () => {
    if (!selected) return
    setDrivers((prev) => prev.filter((d) => d.id !== selected.id))
    setDrawerOpen(false)
    setSelected(null)
    toast.success("Driver removed")
  }

  const exportDriversCsv = () => {
    const header = "Code,Name,Category,Value,Unit,Period,Spreading,Confidence"
    const rows = filteredDrivers.map((d) =>
      [
        d.code,
        d.name,
        d.category,
        asNumber(d.value),
        d.unit || "",
        d.periodDate || "",
        d.spreadingMethod,
        d.confidence,
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

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Assumptions"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-4 text-xs font-semibold"
              onClick={exportDriversCsv}
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
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Driver
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="px-4 sm:px-5 pb-6 space-y-4 w-full">
        {/* Table Toolbar controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#eaecf0] p-3.5 rounded-xl shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5">
            {(["ALL", "REVENUE", "OPEX", "GENERAL"] as const).map((cat) => (
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

          {/* Search Inputs */}
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

        {/* Drivers Grid Table */}
        {filteredDrivers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#eaecf0] bg-white p-8 text-center text-sm text-[#94a3b8]">
            No drivers matching the filters.
          </div>
        ) : (
          <div className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
            <table className="w-full text-[13px] border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-left text-xs text-[#475467]">
                  <th className="px-5 py-3 font-semibold w-1/4">
                    <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-[#101828]">
                      Driver Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort("category")} className="inline-flex items-center gap-1 hover:text-[#101828]">
                      Category <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">Spreading</th>
                  <th className="px-4 py-3 font-semibold text-right w-24">
                    <button type="button" onClick={() => toggleSort("value")} className="inline-flex items-center gap-1 ml-auto hover:text-[#101828]">
                      Default Value <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Confidence</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Status</th>
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
                      <div className="text-[10px] text-[#667085] font-normal mt-0.5">As of {d.periodDate}</div>
                    </td>
                    <td className="px-4 py-3 text-[#475569] font-mono text-xs">{d.code}</td>
                    <td className="px-4 py-3 text-[#344054] font-medium">{d.category}</td>
                    <td className="px-4 py-3 text-[#667085] text-center text-xs font-semibold">
                      {d.spreadingMethod}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#101828]">
                      {d.unit === "%" ? `${asNumber(d.value)}%` : formatMoney(d.value)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-5 px-2 rounded-full text-[10px] font-bold",
                          d.confidence === "High" && "bg-[#edfcf2] text-[#087443]",
                          d.confidence === "Medium" && "bg-[#fffbeb] text-[#b45309]",
                          d.confidence === "Low" && "bg-[#fef3f2] text-[#b42318]",
                        )}
                      >
                        {d.confidence}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FpaStatusBadge tone="success">Active</FpaStatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Driver Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Create Central Assumption Driver
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-[13px]">
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
                  onChange={(e) => setNewCategory(e.target.value as any)}
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
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 rounded-full border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createDriver}
              className="h-9 rounded-full bg-[#2563eb] px-4 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Create Driver
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive side drawer for editor and phasing preview */}
      <FpaDrawer
        open={drawerOpen && !!selected}
        onClose={() => setDrawerOpen(false)}
        title="Assumption Details & Phasing"
        badge={
          selected ? (
            <span className="text-[10px] bg-[#f2f4f7] text-[#667085] px-2 py-0.5 rounded-full font-bold uppercase">
              {selected.category}
            </span>
          ) : undefined
        }
        footer={
          <div className="flex gap-2">
            {canConfigureDrivers && selected ? (
              <button
                type="button"
                className="h-9 rounded-full border border-[#fda29b] px-4 text-xs font-semibold text-[#b42318] hover:bg-[#fef3f2] inline-flex items-center gap-1"
                onClick={deleteDriver}
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
              disabled={busy}
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
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Driver Name</span>
              <p className="text-[14px] font-bold text-[#101828] mt-0.5">{selected.name}</p>
              <p className="text-[10px] text-[#475569] mt-0.5 font-mono bg-[#f9fafb] inline-block px-1.5 py-0.5 rounded border border-[#eaecf0]">
                {selected.code}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Value</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2.5 text-right font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Period</span>
                <input
                  type="date"
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Confidence</span>
                <select
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editConfidence}
                  onChange={(e) => setEditConfidence(e.target.value as any)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Spreading Method</span>
                <select
                  className="w-full h-8.5 rounded-lg border border-[#d0d5dd] px-2 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  value={editSpreading}
                  onChange={(e) => setEditSpreading(e.target.value as any)}
                >
                  <option value="Even spread">Even spread</option>
                  <option value="Seasonal profile">Seasonal profile</option>
                  <option value="Prior year pattern">Prior year pattern</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>

            {/* Phasing Preview SVG mini-bar chart representation */}
            <div className="space-y-2 border-t border-[#eaecf0] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Phasing Spreading Preview</span>
                <span className="text-[10px] text-[#2563eb] font-semibold">{editSpreading}</span>
              </div>
              <div className="h-28 bg-[#f9fafb] border border-[#eaecf0] rounded-xl p-2 flex items-center justify-center">
                <PhasingMiniChart method={editSpreading} baseVal={parseFloat(editValue) || 10} />
              </div>
            </div>
          </div>
        ) : null}
      </FpaDrawer>
    </div>
  )
}

function PhasingMiniChart({ method, baseVal }: { method: LocalDriver["spreadingMethod"]; baseVal: number }) {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

  const values = useMemo(() => {
    const factor = Math.abs(baseVal)
    if (method === "Even spread") {
      return Array(12).fill(factor / 12)
    }
    if (method === "Seasonal profile") {
      // higher weights in Q4 (peak season)
      return [0.05, 0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.10, 0.11, 0.12, 0.12].map((w) => w * factor)
    }
    if (method === "Prior year pattern") {
      // Fluctuating historic profile
      return [0.08, 0.06, 0.09, 0.07, 0.08, 0.10, 0.09, 0.08, 0.07, 0.09, 0.10, 0.09].map((w) => w * factor)
    }
    // Manual distribution
    return [0.15, 0.15, 0.10, 0.10, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.10, 0.10].map((w) => w * factor)
  }, [method, baseVal])

  const maxVal = Math.max(...values, 1e-6)
  const chartHeight = 70
  const barWidth = 14
  const spacing = 7
  const leftMargin = 12

  return (
    <svg viewBox="0 0 280 96" className="w-full h-full">
      {/* Bars */}
      {values.map((v, i) => {
        const height = (v / maxVal) * chartHeight
        const x = leftMargin + i * (barWidth + spacing)
        const y = 80 - height
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill="#d1e9ff"
              className="hover:fill-[#1570ef] transition-colors"
              rx={1.5}
            />
            {/* Month labels */}
            <text
              x={x + barWidth / 2}
              y={92}
              textAnchor="middle"
              className="fill-[#667085] text-[9.5px] font-bold"
            >
              {months[i]}
            </text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={8} y1={80} x2={272} y2={80} stroke="#eaecf0" strokeWidth={1} />
    </svg>
  )
}
