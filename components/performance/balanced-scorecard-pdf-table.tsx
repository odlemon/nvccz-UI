import { Text, View, StyleSheet } from "@react-pdf/renderer"

// Colors borrowed from the Smartsheet "Basic Balanced Scorecard" + Heat Map templates
// the user attached. Pillar bands are saturated; heat cells are softer fills with darker text.
const PILLAR_COLOR_MAP: Array<[string, string]> = [
  ["financ", "#84cc16"],          // Financial → lime
  ["customer", "#14b8a6"],        // Customer → teal
  ["market", "#14b8a6"],          // Customer & Market
  ["internal", "#94a3b8"],        // Internal Processes / Operations → slate
  ["operation", "#94a3b8"],
  ["learning", "#2dd4bf"],        // Learning, Growth & HR → bright teal
  ["growth", "#2dd4bf"],
  ["hr", "#2dd4bf"],
  ["people", "#2dd4bf"],
  ["innovation", "#a78bfa"],
]
const DEFAULT_PILLAR_COLOR = "#6366f1"

const HEAT_BG = {
  green: "#86efac",
  amber: "#fcd34d",
  red: "#fca5a5",
  neutral: "#f1f5f9",
}
const HEAT_TEXT = {
  green: "#14532d",
  amber: "#78350f",
  red: "#7f1d1d",
  neutral: "#475569",
}

export type HeatLevel = "green" | "amber" | "red" | "neutral"

export const colorForPillar = (name?: string): string => {
  if (!name) return DEFAULT_PILLAR_COLOR
  const key = String(name).toLowerCase().trim()
  for (const [needle, color] of PILLAR_COLOR_MAP) {
    if (key.includes(needle)) return color
  }
  return DEFAULT_PILLAR_COLOR
}

/**
 * Normalize whatever signal the scorecard exposes (explicit risk-zone string,
 * progress percentage, or target+actual delta) into a single heat level.
 * The status branch handles upstream values like "GREEN" / "amber" / "red"
 * so the PDF never has to render the word — it renders the color.
 */
export const computeHeat = (args: {
  status?: string | null
  progress?: number | null
  target?: number | null
  actual?: number | null
  isReverseKpi?: boolean
}): HeatLevel => {
  const s = (args.status || "").toString().toLowerCase()
  if (s) {
    if (s.includes("green") || s.includes("complete") || s.includes("on_track") || s === "met" || s === "exceed" || s.includes("exemplary") || s.includes("outstand")) {
      return "green"
    }
    if (s.includes("amber") || s.includes("yellow") || s.includes("at_risk") || s.includes("partial") || s.includes("progress") || s.includes("develop") || s.includes("satisf")) {
      return "amber"
    }
    if (s.includes("red") || s.includes("fail") || s.includes("overdue") || s.includes("behind") || s.includes("below") || s.includes("unsatis") || s.includes("not_started")) {
      return "red"
    }
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

export interface BSCColumn {
  key: string
  label: string
  flex?: number
  align?: "left" | "right" | "center"
  heat?: boolean
  bold?: boolean
}

export interface BSCRow {
  perspectiveId: string
  values: Record<string, string | number | null | undefined>
  heat?: HeatLevel
}

export interface BSCPerspective {
  id: string
  name: string
  color?: string
  weight?: string | number | null
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#cbd5e1",
  },
  headerCell: {
    padding: 6,
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
    borderRightWidth: 1,
    borderRightColor: "#94a3b8",
  },
  perspectiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perspectiveName: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  perspectiveMeta: {
    fontSize: 8,
    color: "#ffffff",
    opacity: 0.85,
    marginLeft: 8,
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 22,
  },
  bodyRowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    padding: 6,
    fontSize: 8,
    color: "#0f172a",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  cellAlt: {
    backgroundColor: "#f8fafc",
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendSwatch: {
    width: 18,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  legendText: {
    fontSize: 7,
    color: "#475569",
  },
})

const fmtCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

export function BalancedScorecardTable({
  perspectives,
  rows,
  columns,
}: {
  perspectives: BSCPerspective[]
  rows: BSCRow[]
  columns: BSCColumn[]
}) {
  // Only render groups that actually have rows; preserve perspective order.
  const grouped = perspectives
    .map((p) => ({ p, rows: rows.filter((r) => r.perspectiveId === p.id) }))
    .filter((g) => g.rows.length > 0)

  return (
    <View style={styles.table}>
      {/* Column header */}
      <View style={styles.headerRow}>
        {columns.map((col, idx) => (
          <Text
            key={col.key}
            style={[
              styles.headerCell,
              {
                flex: col.flex ?? 1,
                textAlign: col.align ?? "left",
                borderRightWidth: idx === columns.length - 1 ? 0 : 1,
              },
            ]}
          >
            {col.label}
          </Text>
        ))}
      </View>

      {/* Perspective groups */}
      {grouped.map(({ p, rows: prows }) => {
        const bg = p.color ?? colorForPillar(p.name)
        return (
          <View key={p.id} wrap={false}>
            {/* Banner row */}
            <View style={[styles.perspectiveBanner, { backgroundColor: bg }]}>
              <Text style={styles.perspectiveName}>{p.name.toUpperCase()}</Text>
              {p.weight !== undefined && p.weight !== null && p.weight !== "" && (
                <Text style={styles.perspectiveMeta}>Weight: {p.weight}</Text>
              )}
            </View>

            {/* Body rows */}
            {prows.map((row, idx) => {
              const heat: HeatLevel = row.heat ?? "neutral"
              const isLast = idx === prows.length - 1
              return (
                <View
                  key={`${p.id}-${idx}`}
                  style={[
                    styles.bodyRow,
                    isLast ? styles.bodyRowLast : null,
                  ]}
                >
                  {columns.map((col, colIdx) => {
                    const v = row.values[col.key]
                    const isHeat = !!col.heat
                    const cellStyles: any[] = [
                      styles.cell,
                      {
                        flex: col.flex ?? 1,
                        textAlign: col.align ?? "left",
                        borderRightWidth: colIdx === columns.length - 1 ? 0 : 1,
                        fontWeight: col.bold ? "bold" : "normal",
                      },
                    ]
                    if (isHeat) {
                      cellStyles.push({
                        backgroundColor: HEAT_BG[heat],
                        color: HEAT_TEXT[heat],
                        fontWeight: "bold",
                      })
                    } else if (idx % 2 === 1) {
                      cellStyles.push(styles.cellAlt)
                    }
                    return (
                      <Text key={col.key} style={cellStyles}>
                        {fmtCellValue(v)}
                      </Text>
                    )
                  })}
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}

export function HeatMapLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: HEAT_BG.green }]} />
        <Text style={styles.legendText}>Meets / exceeds target</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: HEAT_BG.amber }]} />
        <Text style={styles.legendText}>Within 10% of target</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: HEAT_BG.red }]} />
        <Text style={styles.legendText}>More than 10% below target</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: HEAT_BG.neutral }]} />
        <Text style={styles.legendText}>Not assessed</Text>
      </View>
    </View>
  )
}
