"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"

// Same color & heat logic as the PDF helper, but emitted as Tailwind / inline styles
// for the on-screen view. Heat values are intentionally kept as enums ("green" /
// "amber" / "red" / "neutral") so the rendered cell shows a color, not the word.

const PILLAR_COLOR_MAP: Array<[string, string]> = [
  ["financ", "#84cc16"],
  ["customer", "#14b8a6"],
  ["market", "#14b8a6"],
  ["internal", "#94a3b8"],
  ["operation", "#94a3b8"],
  ["learning", "#2dd4bf"],
  ["growth", "#2dd4bf"],
  ["hr", "#2dd4bf"],
  ["people", "#2dd4bf"],
  ["innovation", "#a78bfa"],
]
const DEFAULT_PILLAR_COLOR = "#6366f1"

export const colorForPillar = (name?: string): string => {
  if (!name) return DEFAULT_PILLAR_COLOR
  const key = String(name).toLowerCase().trim()
  for (const [needle, color] of PILLAR_COLOR_MAP) {
    if (key.includes(needle)) return color
  }
  return DEFAULT_PILLAR_COLOR
}

export type HeatLevel = "green" | "amber" | "red" | "neutral"

export const computeHeat = (args: {
  status?: string | null
  progress?: number | null
  target?: number | null
  actual?: number | null
  isReverseKpi?: boolean
}): HeatLevel => {
  const s = (args.status || "").toString().toLowerCase()
  if (s) {
    if (
      s.includes("green") ||
      s.includes("complete") ||
      s.includes("on_track") ||
      s === "met" ||
      s === "exceed" ||
      s.includes("exemplary") ||
      s.includes("outstand")
    ) return "green"
    if (
      s.includes("amber") ||
      s.includes("yellow") ||
      s.includes("at_risk") ||
      s.includes("partial") ||
      s.includes("progress") ||
      s.includes("develop") ||
      s.includes("satisf")
    ) return "amber"
    if (
      s.includes("red") ||
      s.includes("fail") ||
      s.includes("overdue") ||
      s.includes("behind") ||
      s.includes("below") ||
      s.includes("unsatis") ||
      s.includes("not_started")
    ) return "red"
  }

  if (typeof args.progress === "number" && Number.isFinite(args.progress)) {
    if (args.progress >= 100) return "green"
    if (args.progress >= 90) return "amber"
    return "red"
  }

  const t = typeof args.target === "number" ? args.target : null
  const a = typeof args.actual === "number" ? args.actual : null
  if (t !== null && a !== null && t !== 0) {
    const delta = args.isReverseKpi
      ? (t - a) / Math.abs(t)
      : (a - t) / Math.abs(t)
    if (delta >= 0) return "green"
    if (delta >= -0.1) return "amber"
    return "red"
  }

  return "neutral"
}

const HEAT_CELL: Record<HeatLevel, string> = {
  green: "bg-green-200/80 text-green-900 font-semibold",
  amber: "bg-amber-200/80 text-amber-900 font-semibold",
  red: "bg-red-200/80 text-red-900 font-semibold",
  neutral: "bg-gray-50 text-gray-600",
}

export interface BSCViewColumn {
  key: string
  label: string
  align?: "left" | "right" | "center"
  heat?: boolean
  bold?: boolean
  width?: string
}

export interface BSCViewRow {
  perspectiveId: string
  values: Record<string, React.ReactNode | string | number | null | undefined>
  heat?: HeatLevel
}

export interface BSCViewPerspective {
  id: string
  name: string
  color?: string
  weight?: string | number | null
}

const fmtCellValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "—"
  return value as React.ReactNode
}

interface BalancedScorecardViewProps {
  perspectives: BSCViewPerspective[]
  rows: BSCViewRow[]
  columns: BSCViewColumn[]
  className?: string
}

export function BalancedScorecardView({
  perspectives,
  rows,
  columns,
  className,
}: BalancedScorecardViewProps) {
  const grouped = perspectives
    .map((p) => ({ p, rows: rows.filter((r) => r.perspectiveId === p.id) }))
    .filter((g) => g.rows.length > 0)

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-gray-200", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200/70 text-gray-800">
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2 text-xs font-semibold uppercase tracking-wide",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  idx < columns.length - 1 && "border-r border-gray-300",
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ p, rows: prows }, gIdx) => {
            const bg = p.color ?? colorForPillar(p.name)
            return (
              <Fragment key={p.id}>
                {/* Perspective banner — full-width colored row with the
                    perspective name (and optional weight) shown horizontally. */}
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-1.5"
                    style={{ backgroundColor: bg }}
                  >
                    <div className="flex items-center gap-3 text-white">
                      <span className="text-xs font-bold tracking-[0.18em] uppercase">
                        {p.name}
                      </span>
                      {p.weight !== undefined && p.weight !== null && p.weight !== "" && (
                        <span className="text-[10px] font-medium opacity-90">
                          Weight: {p.weight}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {prows.map((row, rowIdx) => {
                  const isLast = rowIdx === prows.length - 1
                  const heat: HeatLevel = row.heat ?? "neutral"
                  return (
                    <tr
                      key={`${p.id}-${rowIdx}`}
                      className={cn(
                        rowIdx % 2 === 1 ? "bg-gray-50/60" : "bg-white",
                        !isLast && "border-b border-gray-200",
                      )}
                    >
                      {columns.map((col, colIdx) => {
                        const v = row.values[col.key]
                        const isHeat = !!col.heat
                        return (
                          <td
                            key={col.key}
                            className={cn(
                              "px-3 py-2 align-middle",
                              col.align === "right" && "text-right",
                              col.align === "center" && "text-center",
                              col.bold && "font-medium text-gray-900",
                              colIdx < columns.length - 1 && "border-r border-gray-200",
                              isHeat ? HEAT_CELL[heat] : "text-gray-700",
                            )}
                          >
                            {fmtCellValue(v)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {gIdx < grouped.length - 1 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columns.length}
                      className="bg-white"
                      style={{ height: 4 }}
                    />
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function HeatMapLegend({ className }: { className?: string }) {
  const items: Array<{ heat: HeatLevel; label: string }> = [
    { heat: "green", label: "Meets / exceeds target" },
    { heat: "amber", label: "Within 10% of target" },
    { heat: "red", label: "More than 10% below target" },
    { heat: "neutral", label: "Not assessed" },
  ]
  return (
    <div className={cn("flex flex-wrap gap-3 text-xs text-gray-600", className)}>
      {items.map(({ heat, label }) => (
        <div key={heat} className="flex items-center gap-1.5">
          <span
            className={cn("inline-block w-4 h-3 rounded-sm border border-gray-300", HEAT_CELL[heat])}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
