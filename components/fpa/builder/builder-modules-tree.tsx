"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  GitBranch,
  Layers,
  MapPin,
  MoreHorizontal,
  Network,
  Package,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react"
import type { FpaBuilderModule, FpaDimension, FpaLineItem } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type ModuleGroup = {
  key: string
  label: string
  items: FpaLineItem[]
}

export function groupLineItemsByModule(items: FpaLineItem[]): ModuleGroup[] {
  const map = new Map<string, FpaLineItem[]>()
  for (const li of items) {
    const key = String(li.moduleName || li.moduleId || li.category || "General").trim() || "General"
    const list = map.get(key) || []
    list.push(li)
    map.set(key, list)
  }
  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      label: key
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      items: list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Flatten API module tree into A.3 folder/leaf shape. */
export type BuilderModuleFolder = {
  id: string
  name: string
  children: Array<{ id: string; name: string }>
}

export function apiModulesToFolders(modules: FpaBuilderModule[]): BuilderModuleFolder[] {
  // Prefer nested `children` from API; fall back to parentModuleId nesting if flat.
  const hasNested = modules.some((m) => (m.children || []).length > 0)
  const roots = hasNested
    ? modules.filter((m) => !(m.parentModuleId || m.parentId))
    : (() => {
        const byParent = new Map<string | null, FpaBuilderModule[]>()
        for (const m of modules) {
          const p = m.parentModuleId || m.parentId || null
          const list = byParent.get(p) || []
          list.push(m)
          byParent.set(p, list)
        }
        return byParent.get(null) || modules.filter((m) => !(m.parentModuleId || m.parentId))
      })()

  const mapNode = (m: FpaBuilderModule): BuilderModuleFolder => {
    const kids =
      m.children && m.children.length
        ? m.children
        : modules.filter(
            (c) => (c.parentModuleId || c.parentId) === m.id && c.id !== m.id,
          )
    if (kids.length > 0) {
      // Keep parent selectable so its own line items stay reachable
      const childLeaves = kids
        .filter((c) => c.id !== m.id)
        .map((c) => ({ id: c.id, name: c.name }))
      return {
        id: m.id,
        name: m.name,
        children: [{ id: m.id, name: m.name }, ...childLeaves],
      }
    }
    // Leaf-only root: treat as folder with itself as leaf for selection UX
    return {
      id: m.id,
      name: m.name,
      children: [{ id: m.id, name: m.name }],
    }
  }
  return (roots.length ? roots : modules).map(mapNode)
}

export type SelectedModuleLeaf = {
  folderId: string
  folderName: string
  leafId: string
  leafName: string
}

type TreeProps = {
  modules: ModuleGroup[]
  selectedModuleKey: string | null
  selectedLineItemId: string | null
  onSelectModule: (key: string) => void
  onSelectLineItem: (item: FpaLineItem) => void
  canCreateModule: boolean
  onCreateModuleClick: () => void
  /** Live modules from GET /models/:id/modules */
  apiModules?: FpaBuilderModule[]
  selectedLeaf?: SelectedModuleLeaf | null
  onSelectLeaf?: (leaf: SelectedModuleLeaf) => void
  /** Open A.4 detailed workspace for a leaf */
  onOpenWorkspace?: (leaf: SelectedModuleLeaf) => void
  onRenameModule?: (moduleId: string, currentName: string) => void
  onDuplicateModule?: (moduleId: string) => void
  onDeleteModule?: (moduleId: string) => void
  /** Create a child module under this parent (folder or leaf). */
  onAddChildModule?: (parentModuleId: string, parentName: string) => void
}

export function BuilderModulesTree({
  canCreateModule,
  onCreateModuleClick,
  apiModules,
  selectedLeaf,
  onSelectLeaf,
  onOpenWorkspace,
  onRenameModule,
  onDuplicateModule,
  onDeleteModule,
  onAddChildModule,
}: TreeProps) {
  const [q, setQ] = useState("")
  const liveFolders = useMemo(
    () => (apiModules?.length ? apiModulesToFolders(apiModules) : []),
    [apiModules],
  )
  const folders = liveFolders
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(folders.slice(0, 1).map((f) => f.id)),
  )
  const [menuLeafId, setMenuLeafId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return folders
    return folders
      .map((f) => ({
        ...f,
        children: f.children.filter(
          (c) =>
            c.name.toLowerCase().includes(needle) || f.name.toLowerCase().includes(needle),
        ),
      }))
      .filter(
        (f) =>
          f.children.length > 0 ||
          f.name.toLowerCase().includes(needle),
      )
  }, [folders, q])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectLeaf = (folder: BuilderModuleFolder, leaf: { id: string; name: string }) => {
    onSelectLeaf?.({
      folderId: folder.id,
      folderName: folder.name,
      leafId: leaf.id,
      leafName: leaf.name,
    })
    setMenuLeafId(null)
  }

  if (!liveFolders.length) {
    return (
      <div className="flex flex-col min-h-0 flex-1 rounded-xl border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[13px] font-semibold text-[#0f172a] mb-2">Modules</h2>
        <p className="text-[12px] text-[#94a3b8]">No modules yet. Create one to start building.</p>
        {canCreateModule ? (
          <button
            type="button"
            onClick={onCreateModuleClick}
            className="mt-3 h-8 inline-flex items-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2 text-[11px] font-medium text-[#2563eb]"
          >
            <Plus className="w-3 h-3" /> Module
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[13px] font-semibold text-[#0f172a]">Modules</h2>
          <button
            type="button"
            onClick={() => {
              if (canCreateModule) onCreateModuleClick()
              else toast.message("Module create API coming — tree is interactive for design.")
            }}
            className="h-7 inline-flex items-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2 text-[11px] font-medium text-[#2563eb] hover:bg-[#dbeafe]"
          >
            <Plus className="w-3 h-3" /> Module
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search modules..."
            className="h-8 w-full rounded-md border border-[#e2e8f0] bg-white pl-8 pr-2 text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-1.5 pb-3 space-y-0.5">
        {filtered.map((folder) => {
          const open = expanded.has(folder.id) || Boolean(q.trim())
          const count = folder.children.length
          return (
            <li key={folder.id}>
              <button
                type="button"
                className="w-full flex items-center gap-1.5 h-8 px-2 rounded-md text-[12px] font-medium text-[#0f172a] hover:bg-[#f8fafc]"
                onClick={() => toggle(folder.id)}
              >
                {open ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                )}
                <Folder className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]/15 shrink-0" />
                <span className="truncate text-left flex-1">{folder.name}</span>
                <span className="ml-1 inline-flex min-w-[20px] h-5 items-center justify-center rounded bg-[#f1f5f9] px-1.5 text-[10px] font-medium text-[#64748b] tabular-nums">
                  {count}
                </span>
              </button>

              {open && (
                <ul className="mt-0.5 mb-1 ml-2 pl-2 border-l border-[#e2e8f0] space-y-0.5">
                  {folder.children.map((leaf) => {
                    const sel = selectedLeaf?.leafId === leaf.id
                    return (
                      <li key={leaf.id} className="relative">
                        <button
                          type="button"
                          className={cn(
                            "group w-full flex items-center gap-2 h-8 pl-2 pr-1 rounded-md text-[12px] text-left",
                            sel
                              ? "bg-[#eff6ff] text-[#2563eb] font-medium"
                              : "text-[#475569] hover:bg-[#f8fafc]",
                          )}
                          onClick={() => selectLeaf(folder, leaf)}
                        >
                          <FileText
                            className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              sel ? "text-[#2563eb]" : "text-[#94a3b8]",
                            )}
                          />
                          <span className="truncate flex-1">{leaf.name}</span>
                          {sel ? (
                            <span
                              role="button"
                              tabIndex={0}
                              className="h-6 w-6 inline-flex items-center justify-center rounded text-[#64748b] hover:bg-white/80"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuLeafId((v) => (v === leaf.id ? null : leaf.id))
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMenuLeafId((v) => (v === leaf.id ? null : leaf.id))
                                }
                              }}
                              aria-label="Module actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-6" />
                          )}
                        </button>
                        {menuLeafId === leaf.id && (
                          <div className="absolute right-1 top-8 z-20 w-44 rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              className="w-full px-3 py-1.5 text-left text-[12px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuLeafId(null)
                                onOpenWorkspace?.({
                                  folderId: folder.id,
                                  folderName: folder.name,
                                  leafId: leaf.id,
                                  leafName: leaf.name,
                                })
                              }}
                            >
                              Open workspace
                            </button>
                            {canCreateModule && onAddChildModule ? (
                              <button
                                type="button"
                                className="w-full px-3 py-1.5 text-left text-[12px] text-[#334155] hover:bg-[#f8fafc]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMenuLeafId(null)
                                  // Parent for child = folder when leaf is the folder itself, else the leaf
                                  const parentId = leaf.id
                                  onAddChildModule(parentId, leaf.name)
                                }}
                              >
                                Add submodule
                              </button>
                            ) : null}
                            {canCreateModule ? (
                              <>
                                <button
                                  type="button"
                                  className="w-full px-3 py-1.5 text-left text-[12px] text-[#334155] hover:bg-[#f8fafc]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuLeafId(null)
                                    if (onRenameModule) onRenameModule(leaf.id, leaf.name)
                                    else toast.message("Rename — API coming")
                                  }}
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-3 py-1.5 text-left text-[12px] text-[#334155] hover:bg-[#f8fafc]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuLeafId(null)
                                    if (onDuplicateModule) onDuplicateModule(leaf.id)
                                    else toast.message("Duplicate — API coming")
                                  }}
                                >
                                  Duplicate
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-3 py-1.5 text-left text-[12px] text-[#b91c1c] hover:bg-[#fef2f2]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuLeafId(null)
                                    if (onDeleteModule) onDeleteModule(leaf.id)
                                    else toast.message("Delete — API coming")
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
        {!filtered.length && (
          <li className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">No modules found</li>
        )}
      </ul>
    </div>
  )
}

type DimIconKey = "time" | "product" | "region" | "segment" | "version" | "scenario" | "currency"

type DimRow = {
  id: string
  name: string
  subtitle: string
  icon: DimIconKey
}

function dimIconFor(key: string, type?: string): DimIconKey {
  const k = `${type || ""} ${key}`.toLowerCase()
  if (k.includes("time") || k.includes("period") || k.includes("calendar")) return "time"
  if (k.includes("product") || k.includes("sku") || k.includes("item")) return "product"
  if (k.includes("region") || k.includes("geo") || k.includes("entity") || k.includes("location"))
    return "region"
  if (k.includes("version")) return "version"
  if (k.includes("scenario")) return "scenario"
  if (k.includes("currency") || k.includes("fx")) return "currency"
  if (k.includes("segment") || k.includes("customer")) return "segment"
  return "segment"
}

function toDimRows(
  dimensions: FpaDimension[],
  modelDimensionKeys: string[],
): DimRow[] {
  return dimensions.map((d) => {
    const memberCount = d.members?.length ?? 0
    const onModel = modelDimensionKeys.includes(d.key) || modelDimensionKeys.includes(d.code)
    const parts = [
      d.dimensionType || d.key || d.code,
      memberCount ? `${memberCount} member${memberCount === 1 ? "" : "s"}` : null,
      onModel ? "On model" : null,
    ].filter(Boolean)
    return {
      id: d.id,
      name: d.name,
      subtitle: parts.join(" · "),
      icon: dimIconFor(d.key || d.code, d.dimensionType),
    }
  })
}

const DIM_ICON: Record<
  DimIconKey,
  { Icon: typeof Calendar; wrap: string; iconClass: string }
> = {
  time: {
    Icon: Calendar,
    wrap: "bg-[#dcfce7] text-[#16a34a]",
    iconClass: "",
  },
  product: {
    Icon: ShoppingBag,
    wrap: "bg-[#f3e8ff] text-[#9333ea]",
    iconClass: "",
  },
  region: {
    Icon: MapPin,
    wrap: "bg-[#dbeafe] text-[#2563eb]",
    iconClass: "",
  },
  segment: {
    Icon: Network,
    wrap: "bg-[#fce7f3] text-[#db2777]",
    iconClass: "",
  },
  version: {
    Icon: Layers,
    wrap: "bg-[#ede9fe] text-[#7c3aed]",
    iconClass: "",
  },
  scenario: {
    Icon: GitBranch,
    wrap: "bg-[#e0e7ff] text-[#4f46e5]",
    iconClass: "",
  },
  currency: {
    Icon: Package,
    wrap: "bg-[#1e3a8a] text-white !rounded-full",
    iconClass: "",
  },
}

type DimProps = {
  dimensions: FpaDimension[]
  modelDimensionKeys: string[]
  onSelectDimension?: (id: string) => void
  onAttachClick?: () => void
}

export function BuilderDimensionsPanel({
  dimensions,
  modelDimensionKeys,
  onSelectDimension,
  onAttachClick,
}: DimProps) {
  const [q, setQ] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sourceRows = useMemo(
    () => toDimRows(dimensions, modelDimensionKeys),
    [dimensions, modelDimensionKeys],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return sourceRows
    return sourceRows.filter(
      (d) =>
        d.name.toLowerCase().includes(needle) ||
        d.subtitle.toLowerCase().includes(needle),
    )
  }, [q, sourceRows])

  useEffect(() => {
    if (!selectedId && sourceRows[0]) setSelectedId(sourceRows[0].id)
  }, [selectedId, sourceRows])

  return (
    <div className="flex flex-col min-h-[220px] max-h-[46%] shrink-0 rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[13px] font-semibold text-[#0f172a]">Dimensions</h2>
          <button
            type="button"
            onClick={() => {
              if (onAttachClick) onAttachClick()
              else toast.message("Use model setup to attach dimensions")
            }}
            className="h-7 inline-flex items-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2 text-[11px] font-medium text-[#2563eb] hover:bg-[#dbeafe]"
          >
            <Plus className="w-3 h-3" /> Dimension
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dimensions..."
            className="h-8 w-full rounded-md border border-[#e2e8f0] bg-white pl-8 pr-2 text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>
      </div>

      <ul className="overflow-y-auto px-2 pb-3 space-y-0.5">
        {rows.map((d) => {
          const cfg = DIM_ICON[d.icon]
          const Icon = cfg.Icon
          const sel = selectedId === d.id
          return (
            <li key={d.id}>
              <button
                type="button"
                className={cn(
                  "w-full flex items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                  sel ? "bg-[#f8fafc] ring-1 ring-[#e2e8f0]" : "hover:bg-[#f8fafc]",
                )}
                onClick={() => {
                  setSelectedId(d.id)
                  onSelectDimension?.(d.id)
                }}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center",
                    d.icon === "currency" ? "rounded-full" : "rounded-md",
                    cfg.wrap,
                  )}
                >
                  {d.icon === "currency" ? (
                    <span className="text-[13px] font-bold leading-none">$</span>
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[#0f172a]">{d.name}</span>
                  <span className="block text-[11px] text-[#94a3b8] truncate">{d.subtitle}</span>
                </span>
              </button>
            </li>
          )
        })}
        {!rows.length && (
          <li className="px-2 py-6 text-center text-[12px] text-[#94a3b8]">
            No dimensions from API yet
          </li>
        )}
      </ul>
    </div>
  )
}

