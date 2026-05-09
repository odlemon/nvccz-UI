import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PerformancePdfLetterhead } from "./pdf-letterhead"
import {
  BalancedScorecardTable,
  HeatMapLegend,
  computeHeat,
  colorForPillar,
  type BSCColumn,
  type BSCRow,
  type BSCPerspective,
} from "./balanced-scorecard-pdf-table"

const COLORS = {
  primary: "#2563eb",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  amber: "#f59e0b",
  white: "#ffffff",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.slate700,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate300,
  },
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.slate100,
  },
  summaryLabel: {
    fontSize: 7,
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, color: COLORS.slate900, fontWeight: "bold" },
  summaryValuePrimary: { fontSize: 16, color: COLORS.primary, fontWeight: "bold" },
  warningBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
    backgroundColor: "#fffbeb",
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  warningText: { fontSize: 8, color: "#92400e" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate300,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.slate500,
  },
})

interface UserScorecardPDFProps {
  data: any
  activeAddress?: any
}

const toNumber = (value: unknown) => {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(n) ? n : 0
}

const fmtNumber = (value: unknown, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return fallback
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const fmtPercent = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—"
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(1)}%`
}

const fmtWeight = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—"
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return "—"
  const pct = n > 1 ? n : n * 100
  return `${pct.toFixed(0)}%`
}

export default function UserScorecardPDF({ data, activeAddress }: UserScorecardPDFProps) {
  const employee = data?.employee || {}
  const goals: any[] = data?.goals || []
  const matrix: any[] = data?.document?.performanceMatrix || []
  const taskSummary: any[] = data?.document?.taskSummary || []
  const flatTasks = taskSummary.flatMap((section: any) => section?.tasks || [])
  const warnings: string[] = data?.warnings || []
  const periodLabel = data?.contract?.periodLabel || data?.reviewPeriod

  const totalGoals = goals.length
  const completedGoals = goals.filter(
    (goal: any) => toNumber(goal.progressPct ?? goal.progressPercentage) >= 100,
  ).length
  const completedTasks = flatTasks.filter((task: any) =>
    String(task.status || "").toLowerCase().includes("complete"),
  ).length

  // Group goals by scorecard pillar.
  const pillarMap = new Map<string, BSCPerspective>()
  const bscRows: BSCRow[] = []

  for (const goal of goals) {
    const pillarName = (goal.scorecardPillar || goal.pillar || "Goals").toString()
    const pillarId = pillarName.toLowerCase().replace(/\s+/g, "-")
    if (!pillarMap.has(pillarId)) {
      pillarMap.set(pillarId, {
        id: pillarId,
        name: pillarName,
        color: colorForPillar(pillarName),
      })
    }
    const target = goal.targetValue ?? goal.monetaryValue ?? goal.percentValue
    const actual =
      goal.selectedActualValue ??
      goal.directActualValue ??
      goal.currentValue ??
      goal.monetaryValueAchieved
    const progress = toNumber(
      goal.progressPercentage ?? goal.progressPct ?? goal.percentValueAchieved,
    )
    const heat = computeHeat({
      status: goal.performanceRiskZone || goal.status || goal.varianceStatus,
      progress,
      target: target !== undefined ? toNumber(target) : null,
      actual: actual !== undefined ? toNumber(actual) : null,
      isReverseKpi: !!goal.isReverseKpi,
    })
    bscRows.push({
      perspectiveId: pillarId,
      heat,
      values: {
        objective: goal.goalName || goal.title || "—",
        measure: goal.kpiOrMeasure || goal.kpi?.name || "—",
        target: fmtNumber(target),
        actual: fmtNumber(actual),
        progress: fmtPercent(progress),
        weight: fmtWeight(goal.weight ?? goal.scorecardWeight),
        rating: fmtNumber(goal.rawRating),
      },
    })
  }

  const perspectives: BSCPerspective[] = Array.from(pillarMap.values())

  const columns: BSCColumn[] = [
    { key: "objective", label: "Strategic Objective", flex: 2.4, bold: true },
    { key: "measure", label: "Measure / KPI", flex: 2 },
    { key: "target", label: "Target", flex: 1, align: "right" },
    { key: "actual", label: "Actual", flex: 1, align: "right", heat: true },
    { key: "progress", label: "Progress", flex: 1, align: "right", heat: true },
    { key: "weight", label: "Weight", flex: 0.8, align: "right" },
    { key: "rating", label: "Rating", flex: 0.8, align: "right" },
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title="Individual Performance Scorecard"
          subtitle={`Employee: ${employee?.name || "N/A"}${employee?.role ? ` — ${employee.role}` : ""}`}
          periodLabel={periodLabel}
          activeAddress={activeAddress}
        />

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Final Score</Text>
            <Text style={styles.summaryValuePrimary}>{data?.scores?.finalScore ?? "—"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Performance Label</Text>
            <Text style={styles.summaryValue}>{data?.scores?.performanceLabel ?? "—"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Department</Text>
            <Text style={styles.summaryValue}>{employee?.department || "—"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Goals</Text>
            <Text style={styles.summaryValue}>
              {completedGoals}/{totalGoals}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tasks</Text>
            <Text style={styles.summaryValue}>
              {completedTasks}/{flatTasks.length}
            </Text>
          </View>
        </View>

        {bscRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balanced Scorecard</Text>
            <BalancedScorecardTable
              perspectives={perspectives}
              rows={bscRows}
              columns={columns}
            />
            <HeatMapLegend />
          </View>
        )}

        {matrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Matrix</Text>
            <BalancedScorecardTable
              perspectives={[{ id: "matrix", name: "Matrix", color: COLORS.primary }]}
              rows={matrix.map((row: any) => {
                const target = toNumber(row.target)
                const actual = toNumber(row.actual)
                const heat = computeHeat({
                  status: row.varianceStatus || row.status,
                  target,
                  actual,
                  isReverseKpi: !!row.isReverseKpi,
                })
                return {
                  perspectiveId: "matrix",
                  heat,
                  values: {
                    goal: row.goal || row.kpiOrMeasure || "—",
                    target: fmtNumber(row.target),
                    actual: fmtNumber(row.actual),
                    rating: fmtNumber(row.rawRating),
                    weighted: fmtNumber(row.weightedScore),
                  },
                }
              })}
              columns={[
                { key: "goal", label: "Goal / KPI", flex: 3, bold: true },
                { key: "target", label: "Target", flex: 1, align: "right" },
                { key: "actual", label: "Actual", flex: 1, align: "right", heat: true },
                { key: "rating", label: "Rating", flex: 0.8, align: "right" },
                { key: "weighted", label: "Weighted", flex: 0.9, align: "right" },
              ]}
            />
          </View>
        )}

        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warnings &amp; Notes</Text>
            {warnings.map((warning: string, idx: number) => (
              <View key={idx} style={styles.warningBox}>
                <Text style={styles.warningText}>• {warning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text> Generated {new Date().toLocaleString()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
