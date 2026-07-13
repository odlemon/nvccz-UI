"use client"

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react"
import {
  Background,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Info,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FpaDependencyGraph, FpaDepEdgeKind } from "@/lib/api/fpa-api"

export type DepViewMode = "module" | "line-item"
export type DepLayoutMode = "ltr" | "ttb"

type ModuleCardData = {
  label: string
  items: string[]
  isActive: boolean
  showLineItems: boolean
  layout: DepLayoutMode
  selectedItem?: string | null
  onSelectItem?: (name: string) => void
  onSelectModule?: () => void
}

type LineItemNodeData = {
  label: string
  moduleLabel: string
  isActive: boolean
  layout: DepLayoutMode
}

type GraphModule = {
  id: string
  label: string
  items: Array<{ id: string; name: string; code?: string }>
}

type GraphLink = {
  id: string
  sourceModuleId: string
  targetModuleId: string
  sourceItemName?: string
  targetItemName?: string
  kind: "direct" | "indirect" | "external" | "invalid"
}

const EDGE_STYLE: Record<
  GraphLink["kind"],
  { stroke: string; strokeWidth: number; strokeDasharray?: string }
> = {
  direct: { stroke: "#334155", strokeWidth: 1.5 },
  indirect: { stroke: "#94a3b8", strokeWidth: 1.5, strokeDasharray: "5 4" },
  external: { stroke: "#7c3aed", strokeWidth: 1.5 },
  invalid: { stroke: "#dc2626", strokeWidth: 1.5, strokeDasharray: "2 3" },
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function handleId(kind: "in" | "out", name: string) {
  return `${kind}-${slug(name)}`
}

function normalizeEdgeKind(kind: string | undefined): GraphLink["kind"] {
  const k = String(kind || "direct").toLowerCase()
  if (k === "indirect" || k === "external" || k === "invalid") return k
  return "direct"
}

/** Build render modules + links from live dependency graph (and optional LI fallbacks). */
function fromLiveGraph(
  live: FpaDependencyGraph | null | undefined,
  fallbackModules?: Array<{
    id: string
    name: string
    items?: Array<{ id: string; name: string; code?: string }>
  }>,
): { modules: GraphModule[]; links: GraphLink[] } {
  const fallbackById = new Map((fallbackModules || []).map((m) => [m.id, m]))

  const sourceModules =
    live?.modules?.length
      ? live.modules
      : (fallbackModules || []).map((m) => ({
          id: m.id,
          name: m.name,
          lineItems: (m.items || []).map((li) => ({
            id: li.id,
            code: li.code || "",
            name: li.name,
          })),
        }))

  const modules: GraphModule[] = sourceModules.map((m) => {
    const fromLive = (m.lineItems || []).map((li) => ({
      id: li.id,
      name: li.name,
      code: li.code,
    }))
    const fromFallback = (fallbackById.get(m.id)?.items || []).map((li) => ({
      id: li.id,
      name: li.name,
      code: li.code,
    }))
    return {
      id: m.id,
      label: m.name,
      items: fromLive.length ? fromLive : fromFallback,
    }
  })

  // If live graph had no modules, still show fallback modules alone
  if (!modules.length && fallbackModules?.length) {
    for (const m of fallbackModules) {
      modules.push({
        id: m.id,
        label: m.name,
        items: (m.items || []).map((li) => ({ id: li.id, name: li.name, code: li.code })),
      })
    }
  }

  const liToModule = new Map<string, string>()
  const liMeta = new Map<string, { name: string; moduleId: string }>()
  for (const mod of modules) {
    for (const li of mod.items) {
      liToModule.set(li.id, mod.id)
      liMeta.set(li.id, { name: li.name, moduleId: mod.id })
    }
  }

  const links: GraphLink[] = []
  for (const e of live?.edges || []) {
    const srcMod = liToModule.get(e.sourceLineItemId)
    const tgtMod = liToModule.get(e.targetLineItemId)
    if (!srcMod || !tgtMod) continue
    links.push({
      id: e.id || `${e.sourceLineItemId}->${e.targetLineItemId}`,
      sourceModuleId: srcMod,
      targetModuleId: tgtMod,
      sourceItemName: liMeta.get(e.sourceLineItemId)?.name,
      targetItemName: liMeta.get(e.targetLineItemId)?.name,
      kind: normalizeEdgeKind(e.kind as FpaDepEdgeKind | string),
    })
  }

  return { modules, links }
}

function resolveActiveModuleId(
  modules: GraphModule[],
  activeModuleId?: string | null,
  activeModuleLabel?: string | null,
): string {
  if (activeModuleId && modules.some((m) => m.id === activeModuleId)) return activeModuleId
  if (activeModuleLabel) {
    const hit = modules.find(
      (m) => m.label === activeModuleLabel || m.id === slug(activeModuleLabel) || m.id === activeModuleLabel,
    )
    if (hit) return hit.id
  }
  return modules[0]?.id || ""
}

function ModuleCardNode({ data, id }: NodeProps) {
  const d = data as ModuleCardData
  const sourcePos = d.layout === "ttb" ? Position.Bottom : Position.Right
  const targetPos = d.layout === "ttb" ? Position.Top : Position.Left
  const headerH = 40
  const rowH = 32
  const listPadTop = 6

  return (
    <div
      className={cn(
        "relative w-[200px] rounded-[8px] bg-white cursor-pointer",
        d.isActive
          ? "border-2 border-[#2563eb] shadow-[0_0_0_1px_rgba(37,99,235,0.12)]"
          : "border border-[#e2e8f0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      )}
      onClick={() => d.onSelectModule?.()}
    >
      {/* Module-level fallback handles (collapsed mode + routing fallback) */}
      <Handle
        type="target"
        id="in"
        position={targetPos}
        className="!w-[7px] !h-[7px] !bg-[#cbd5e1] !border-[#94a3b8] !border !z-10"
        style={d.layout === "ttb" ? { top: 0, left: "50%" } : { top: headerH / 2 }}
      />
      {!d.showLineItems ? (
        <Handle
          type="source"
          id="out"
          position={sourcePos}
          className="!w-[7px] !h-[7px] !bg-[#94a3b8] !border-[#64748b] !border !z-10"
          style={
            d.layout === "ttb"
              ? { bottom: 0, left: "50%", top: "auto" }
              : { top: "50%" }
          }
        />
      ) : null}

      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 h-10 border-b rounded-t-[7px]",
          d.isActive
            ? "bg-[#eff6ff] border-[#bfdbfe]"
            : "bg-white border-[#f1f5f9]",
        )}
      >
        <p className="text-[12px] font-semibold text-[#0f172a] truncate leading-none">{d.label}</p>
        {d.isActive ? (
          <span className="shrink-0 rounded-full bg-[#dbeafe] px-2 py-[3px] text-[10px] font-medium leading-none text-[#1d4ed8]">
            This Module
          </span>
        ) : null}
      </div>

      {d.showLineItems ? (
        <>
          <ul className="py-1.5">
            {d.items.map((item) => {
              const selected = d.selectedItem === item
              return (
                <li key={item} className="h-8">
                  <button
                    type="button"
                    className={cn(
                      "w-full h-full text-left px-3 text-[12px] transition-colors",
                      selected
                        ? "bg-[#eff6ff] text-[#1d4ed8] font-medium"
                        : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      d.onSelectItem?.(item)
                    }}
                  >
                    {item}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Handles must be absolute children of the node root for RF to measure them */}
          {d.items.map((item, i) => {
            const top = headerH + listPadTop + i * rowH + rowH / 2
            return (
              <Handle
                key={`${id}-out-${item}`}
                type="source"
                id={handleId("out", item)}
                position={sourcePos}
                className="!w-[7px] !h-[7px] !bg-[#94a3b8] !border-[#64748b] !border !z-10"
                style={
                  d.layout === "ttb"
                    ? {
                        left: `${((i + 0.5) / d.items.length) * 100}%`,
                        bottom: -3,
                        top: "auto",
                      }
                    : { top, right: -3 }
                }
              />
            )
          })}
          {d.items.map((item, i) => {
            const top = headerH + listPadTop + i * rowH + rowH / 2
            return (
              <Handle
                key={`${id}-in-${item}`}
                type="target"
                id={handleId("in", item)}
                position={targetPos}
                className="!w-[7px] !h-[7px] !bg-[#cbd5e1] !border-[#94a3b8] !border !opacity-70 !z-10"
                style={
                  d.layout === "ttb"
                    ? {
                        left: `${((i + 0.5) / d.items.length) * 100}%`,
                        top: -3,
                      }
                    : { top, left: -3 }
                }
              />
            )
          })}
        </>
      ) : (
        <div className="px-3 py-3">
          <p className="text-[11px] text-[#94a3b8]">{d.items.length} line items</p>
        </div>
      )}
    </div>
  )
}

function LineItemCardNode({ data }: NodeProps) {
  const d = data as LineItemNodeData
  const sourcePos = d.layout === "ttb" ? Position.Bottom : Position.Right
  const targetPos = d.layout === "ttb" ? Position.Top : Position.Left

  return (
    <div
      className={cn(
        "min-w-[140px] rounded-md border bg-white px-3 py-2 shadow-sm",
        d.isActive ? "border-[#2563eb] border-2 bg-[#eff6ff]" : "border-[#e2e8f0]",
      )}
    >
      <Handle
        type="target"
        id="in"
        position={targetPos}
        className="!w-2 !h-2 !bg-[#cbd5e1] !border-[#94a3b8]"
      />
      <p className="text-[10px] text-[#94a3b8] truncate">{d.moduleLabel}</p>
      <p className="text-[12px] font-medium text-[#0f172a]">{d.label}</p>
      <Handle
        type="source"
        id="out"
        position={sourcePos}
        className="!w-2 !h-2 !bg-[#94a3b8] !border-[#64748b]"
      />
    </div>
  )
}

const nodeTypes = {
  moduleCard: memo(ModuleCardNode),
  lineItemCard: memo(LineItemCardNode),
}

function buildGraph(opts: {
  view: DepViewMode
  layout: DepLayoutMode
  showLineItems: boolean
  activeModuleId: string
  selectedItem?: string | null
  onSelectItem?: (name: string) => void
  onSelectModule?: (moduleId: string) => void
  modules: GraphModule[]
  links: GraphLink[]
}): { nodes: Node[]; edges: Edge[] } {
  const {
    view,
    layout,
    showLineItems,
    activeModuleId,
    selectedItem,
    onSelectItem,
    onSelectModule,
    modules,
    links,
  } = opts

  if (!modules.length) return { nodes: [], edges: [] }

  const gapX = showLineItems ? 320 : 250
  const gapY = showLineItems ? 230 : 140

  if (view === "line-item") {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let col = 0
    for (const mod of modules) {
      mod.items.forEach((item, row) => {
        const id = `${mod.id}::${item.id}`
        nodes.push({
          id,
          type: "lineItemCard",
          position:
            layout === "ltr"
              ? { x: col * 200, y: row * 72 }
              : { x: row * 170, y: col * 100 },
          data: {
            label: item.name,
            moduleLabel: mod.label,
            isActive: mod.id === activeModuleId,
            layout,
          },
          draggable: true,
        })
      })
      col += 1
    }

    for (const link of links) {
      if (link.kind === "external") continue
      const srcItem = modules
        .find((m) => m.id === link.sourceModuleId)
        ?.items.find((it) => it.name === link.sourceItemName)
      const tgtItem = modules
        .find((m) => m.id === link.targetModuleId)
        ?.items.find((it) => it.name === link.targetItemName)
      if (!srcItem || !tgtItem) continue
      const style = EDGE_STYLE[link.kind]
      edges.push({
        id: `li-${link.id}`,
        source: `${link.sourceModuleId}::${srcItem.id}`,
        target: `${link.targetModuleId}::${tgtItem.id}`,
        type: "smoothstep",
        animated: false,
        style,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: style.stroke,
        },
      })
    }
    return { nodes, edges }
  }

  const nodes: Node[] = modules.map((mod, i) => ({
    id: mod.id,
    type: "moduleCard",
    position:
      layout === "ltr"
        ? { x: i * gapX, y: 24 }
        : { x: 40, y: i * gapY },
    data: {
      label: mod.label,
      items: mod.items.map((it) => it.name),
      isActive: mod.id === activeModuleId,
      showLineItems,
      layout,
      selectedItem: mod.id === activeModuleId ? selectedItem : null,
      onSelectItem,
      onSelectModule: () => onSelectModule?.(mod.id),
    } satisfies ModuleCardData,
    draggable: true,
  }))

  const edges: Edge[] = links.map((link) => {
    const style = EDGE_STYLE[link.kind]
    const collapsed = !showLineItems
    return {
      id: link.id,
      source: link.sourceModuleId,
      target: link.targetModuleId,
      sourceHandle:
        collapsed || !link.sourceItemName ? "out" : handleId("out", link.sourceItemName),
      targetHandle:
        collapsed || !link.targetItemName ? "in" : handleId("in", link.targetItemName),
      type: "default",
      animated: false,
      style,
      data: { kind: link.kind, sourceItemName: link.sourceItemName },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: style.stroke,
      },
    }
  })

  if (!showLineItems) {
    const seen = new Set<string>()
    const collapsed: Edge[] = []
    for (const e of edges) {
      const key = `${e.source}->${e.target}`
      if (seen.has(key)) continue
      seen.add(key)
      const kind =
        (e.data as { kind?: GraphLink["kind"] } | undefined)?.kind || "direct"
      const style = EDGE_STYLE[kind === "invalid" ? "invalid" : kind === "external" ? "direct" : kind]
      collapsed.push({
        ...e,
        id: `c-${key}`,
        sourceHandle: "out",
        targetHandle: "in",
        type: "default",
        style,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: style.stroke,
        },
      })
    }
    return { nodes, edges: collapsed }
  }

  return { nodes, edges }
}

function MapCanvas({
  view,
  layout,
  showLineItems,
  activeModuleLabel,
  activeModuleId: activeModuleIdProp,
  selectedItem,
  liveGraph,
  fallbackModules,
  onSelectNode,
  onSelectModule,
}: {
  view: DepViewMode
  layout: DepLayoutMode
  showLineItems: boolean
  activeModuleLabel?: string | null
  activeModuleId?: string | null
  selectedItem?: string | null
  liveGraph?: FpaDependencyGraph | null
  fallbackModules?: Array<{ id: string; name: string; items?: Array<{ id: string; name: string; code?: string }> }>
  onSelectNode?: (code: string) => void
  onSelectModule?: (moduleId: string, moduleLabel: string) => void
}) {
  const graphKey = useMemo(() => {
    const mods = (liveGraph?.modules || []).map((m) => m.id).join(",")
    const edges = (liveGraph?.edges || []).map((e) => e.id).join(",")
    const fb = (fallbackModules || [])
      .map((m) => `${m.id}:${(m.items || []).map((i) => i.id).join("|")}`)
      .join(";")
    return `${mods}#${edges}#${fb}#${activeModuleIdProp || ""}#${activeModuleLabel || ""}`
  }, [liveGraph, fallbackModules, activeModuleIdProp, activeModuleLabel])

  const { modules, links } = useMemo(
    () => fromLiveGraph(liveGraph, fallbackModules),
    [liveGraph, fallbackModules],
  )
  const activeModuleId = resolveActiveModuleId(modules, activeModuleIdProp, activeModuleLabel)
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()

  const onSelectItem = useCallback(
    (name: string) => onSelectNode?.(name),
    [onSelectNode],
  )

  const selectModule = useCallback(
    (moduleId: string) => {
      const mod = modules.find((m) => m.id === moduleId)
      onSelectModule?.(moduleId, mod?.label || moduleId)
    },
    [onSelectModule, modules],
  )

  const initial = useMemo(
    () =>
      buildGraph({
        view,
        layout,
        showLineItems,
        activeModuleId,
        selectedItem,
        onSelectItem,
        onSelectModule: selectModule,
        modules,
        links,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild via effect below
    [],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  useEffect(() => {
    const next = buildGraph({
      view,
      layout,
      showLineItems,
      activeModuleId,
      selectedItem,
      onSelectItem,
      onSelectModule: selectModule,
      modules,
      links,
    })
    setNodes(next.nodes)
    setEdges(next.edges)
    const t = window.setTimeout(() => {
      next.nodes.forEach((n) => updateNodeInternals(n.id))
      const focusIds = activeModuleId ? [activeModuleId] : modules.slice(0, 3).map((m) => m.id)
      const idx = modules.findIndex((m) => m.id === activeModuleId)
      if (idx >= 0) {
        if (modules[idx + 1]) focusIds.push(modules[idx + 1].id)
        if (modules[idx + 2]) focusIds.push(modules[idx + 2].id)
        if (idx > 0) focusIds.unshift(modules[idx - 1].id)
      }
      void fitView({
        nodes: focusIds.filter(Boolean).map((id) => ({ id })),
        padding: 0.2,
        maxZoom: 1,
        minZoom: 0.65,
        duration: 200,
      })
    }, 80)
    return () => window.clearTimeout(t)
  }, [
    view,
    layout,
    showLineItems,
    activeModuleId,
    selectedItem,
    onSelectItem,
    selectModule,
    graphKey,
    setNodes,
    setEdges,
    fitView,
    updateNodeInternals,
  ])

  const onNodeClick = useCallback(
    (_: ReactMouseEvent, node: Node) => {
      if (node.type === "lineItemCard") {
        const d = node.data as LineItemNodeData
        onSelectNode?.(d.label)
        return
      }
      selectModule(node.id)
    },
    [onSelectNode, selectModule],
  )

  const onEdgeClick = useCallback(
    (_: ReactMouseEvent, edge: Edge) => {
      setEdges((eds) =>
        eds.map((e) => {
          const kind =
            (e.data as { kind?: GraphLink["kind"] } | undefined)?.kind || "direct"
          const base = EDGE_STYLE[kind]
          const active = e.id === edge.id
          return {
            ...e,
            selected: active,
            style: {
              ...base,
              strokeWidth: active ? 2.75 : base.strokeWidth,
            },
          }
        }),
      )
      const item = (edge.data as { sourceItemName?: string } | undefined)?.sourceItemName
      if (item) onSelectNode?.(item)
    },
    [onSelectNode, setEdges],
  )

  // Expose zoom helpers via custom events from toolbar (same ReactFlow tree)
  useEffect(() => {
    const root = document.getElementById("fpa-dep-map-root")
    if (!root) return
    const onZoomIn = () => void zoomIn({ duration: 160 })
    const onZoomOut = () => void zoomOut({ duration: 160 })
    const onReset = () => {
      void fitView({ padding: 0.2, maxZoom: 1, minZoom: 0.7, duration: 280 })
    }
    const onSetZoom = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail
      const vp = getViewport()
      void setViewport({ ...vp, zoom: detail }, { duration: 160 })
    }
    root.addEventListener("dep-zoom-in", onZoomIn)
    root.addEventListener("dep-zoom-out", onZoomOut)
    root.addEventListener("dep-zoom-reset", onReset)
    root.addEventListener("dep-set-zoom", onSetZoom as EventListener)
    return () => {
      root.removeEventListener("dep-zoom-in", onZoomIn)
      root.removeEventListener("dep-zoom-out", onZoomOut)
      root.removeEventListener("dep-zoom-reset", onReset)
      root.removeEventListener("dep-set-zoom", onSetZoom as EventListener)
    }
  }, [fitView, getViewport, setViewport, zoomIn, zoomOut])

  if (!modules.length) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fafbfc] px-6 text-center text-[12px] text-[#94a3b8]">
        No dependency graph yet. Add modules and formulas to see references here.
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      nodeTypes={nodeTypes}
      fitView={false}
      minZoom={0.5}
      maxZoom={1.75}
      defaultViewport={{ x: 24, y: 16, zoom: 0.95 }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "default" }}
      className="bg-[#fafbfc] !w-full !h-full"
    >
      <Background gap={20} size={1} color="#e8edf3" />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        className="!bg-white !border !border-[#e2e8f0] !rounded-[8px] !shadow-sm !w-[104px] !h-[72px]"
        maskColor="rgba(15,23,42,0.06)"
        nodeColor={(n) => {
          const d = n.data as { isActive?: boolean }
          return d?.isActive ? "#2563eb" : "#cbd5e1"
        }}
      />
    </ReactFlow>
  )
}

type Props = {
  graph: Record<string, string[]> | null
  liveGraph?: FpaDependencyGraph | null
  circular: boolean | null
  circularPath: string[] | null
  showLineItems: boolean
  onToggleLineItems: (v: boolean) => void
  apiMissing: boolean
  activeModuleLabel?: string | null
  activeModuleId?: string | null
  selectedItemName?: string | null
  fallbackModules?: Array<{ id: string; name: string; items?: Array<{ id: string; name: string; code?: string }> }>
  onSelectNode?: (code: string) => void
  onSelectModule?: (moduleId: string, moduleLabel: string) => void
}

export function BuilderDependencyMap({
  liveGraph,
  circular,
  circularPath,
  showLineItems,
  onToggleLineItems,
  apiMissing: _apiMissing,
  activeModuleLabel,
  activeModuleId,
  selectedItemName,
  fallbackModules,
  onSelectNode,
  onSelectModule,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<DepViewMode>("module")
  const [layout, setLayout] = useState<DepLayoutMode>("ltr")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const toggleFullscreen = async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      /* ignore — browser may block */
    }
  }

  const fire = (name: string, detail?: number) => {
    const root = document.getElementById("fpa-dep-map-root")
    if (!root) return
    root.dispatchEvent(
      detail !== undefined
        ? new CustomEvent(name, { detail })
        : new Event(name),
    )
  }

  const canvasStyle: CSSProperties = isFullscreen
    ? { height: "calc(100vh - 120px)" }
    : { flex: 1, minHeight: 280 }


  const selectClass =
    "h-8 min-w-[108px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-white pl-2.5 pr-7 text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
  const selectChevron =
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"

  return (
    <div
      ref={shellRef}
      id="fpa-dep-map-root"
      className={cn(
        "bg-white flex flex-col min-h-0 w-full h-full",
        isFullscreen && "fixed inset-0 z-[80] bg-white p-4",
      )}
    >
      {/* Toolbar — matches A.3: title left, filters + chrome right */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 justify-between px-4 pt-3 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 relative">
          <h3 className="text-[13px] font-semibold text-[#0f172a] tracking-[-0.01em]">
            Dependency Map
          </h3>
          <button
            type="button"
            className="text-[#94a3b8] hover:text-[#64748b] rounded-full p-0.5"
            aria-label="About dependency map"
            onClick={() => setTipOpen((v) => !v)}
            onBlur={() => setTimeout(() => setTipOpen(false), 150)}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          {tipOpen ? (
            <div className="absolute left-0 top-7 z-20 w-64 rounded-[8px] border border-[#e2e8f0] bg-white p-2.5 text-[11px] text-[#475569] shadow-lg">
              Live dependency graph for this model. Click a card to focus that module, a line item to
              open it in Properties, or an arrow to trace a reference.
              {circular ? (
                <p className="mt-1.5 text-[#b91c1c]">
                  Circular: {(circularPath || []).join(" → ") || "detected"}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[12px] text-[#64748b]">
            <span>View</span>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as DepViewMode)}
              className={cn(selectClass, selectChevron)}
            >
              <option value="module">Module</option>
              <option value="line-item">Line Item</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-[12px] text-[#64748b]">
            <span>Layout</span>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as DepLayoutMode)}
              className={cn(selectClass, selectChevron, "min-w-[128px]")}
            >
              <option value="ltr">Left to Right</option>
              <option value="ttb">Top to Bottom</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={showLineItems}
              onClick={() => onToggleLineItems(!showLineItems)}
              className={cn(
                "relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors",
                showLineItems ? "bg-[#2563eb]" : "bg-[#cbd5e1]",
              )}
            >
              <span
                className={cn(
                  "inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-sm transition duration-150",
                  showLineItems ? "translate-x-[18px]" : "translate-x-[2px]",
                )}
              />
            </button>
            <span className="text-[12px] text-[#475569]">Show Line Items</span>
          </label>

          <div className="flex items-center gap-2 ml-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={() => void toggleFullscreen()}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="inline-flex h-8 items-stretch overflow-hidden rounded-[6px] border border-[#e2e8f0] bg-white">
              <button
                type="button"
                className="inline-flex w-8 items-center justify-center text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a] border-r border-[#e2e8f0]"
                aria-label="Zoom out"
                onClick={() => fire("dep-zoom-out")}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="min-w-[52px] px-1.5 text-[12px] font-medium tabular-nums text-[#475569] hover:bg-[#f8fafc]"
                title="Fit to view"
                onClick={() => fire("dep-zoom-reset")}
              >
                <ZoomBadge />
              </button>
              <button
                type="button"
                className="inline-flex w-8 items-center justify-center text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a] border-l border-[#e2e8f0]"
                aria-label="Zoom in"
                onClick={() => fire("dep-zoom-in")}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative mx-4 mb-3 flex-1 min-h-[280px] rounded-[8px] border border-[#e2e8f0] overflow-hidden bg-[#fafbfc]"
        style={canvasStyle}
      >
        <ReactFlowProvider>
          <MapCanvas
            view={view}
            layout={layout}
            showLineItems={showLineItems}
            activeModuleLabel={activeModuleLabel}
            activeModuleId={activeModuleId}
            selectedItem={selectedItemName}
            liveGraph={liveGraph}
            fallbackModules={fallbackModules}
            onSelectNode={onSelectNode}
            onSelectModule={onSelectModule}
          />
        </ReactFlowProvider>
      </div>

      {/* Legend — bordered bar, centered (A.3) */}
      <div className="flex justify-center px-4 pb-3 shrink-0">
        <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="inline-flex items-center gap-2">
            <span className="relative w-8 h-0 border-t-[1.5px] border-[#334155]">
              <span className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-[#334155]" />
            </span>
            Direct Reference
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative w-8 h-0 border-t-[1.5px] border-dashed border-[#94a3b8]">
              <span className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-[#94a3b8]" />
            </span>
            Indirect Reference
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative w-8 h-0 border-t-[1.5px] border-[#7c3aed]">
              <span className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-[#7c3aed]" />
            </span>
            External Input
          </span>
        </div>
      </div>
    </div>
  )
}

/** Live zoom % that reads from the map root's React Flow instance via polling the canvas transform. */
function ZoomBadge() {
  const [pct, setPct] = useState(100)

  useEffect(() => {
    const root = document.getElementById("fpa-dep-map-root")
    if (!root) return
    const read = () => {
      const pane = root.querySelector(".react-flow__viewport") as HTMLElement | null
      if (!pane) return
      const t = pane.style.transform || ""
      const m = t.match(/scale\(([^)]+)\)/)
      if (m) setPct(Math.round(parseFloat(m[1]) * 100))
    }
    read()
    const obs = new MutationObserver(read)
    const pane = root.querySelector(".react-flow__viewport")
    if (pane) obs.observe(pane, { attributes: true, attributeFilter: ["style"] })
    const iv = window.setInterval(read, 400)
    return () => {
      obs.disconnect()
      window.clearInterval(iv)
    }
  }, [])

  return (
    <span className="tabular-nums">{pct}%</span>
  )
}
