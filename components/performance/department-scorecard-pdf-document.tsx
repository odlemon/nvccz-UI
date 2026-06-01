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
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  white: "#ffffff",
}

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 44, paddingHorizontal: 28, fontFamily: "Helvetica", fontSize: 9, color: COLORS.slate700 },

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

  // Summary KPI cards (mirrors the contract scorecard look)
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.slate100,
  },
  summaryLabel: { fontSize: 7, color: COLORS.slate500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
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

  qualTable: { borderWidth: 1, borderColor: COLORS.slate300, borderRadius: 4 },
  qualHeaderRow: { flexDirection: "row", backgroundColor: COLORS.slate100, borderBottomWidth: 1, borderBottomColor: COLORS.slate300 },
  qualRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.slate300 },
  qualRowLast: { flexDirection: "row" },
  qualCellAttr: { flex: 2.5, padding: 5, fontSize: 8, color: COLORS.slate700 },
  qualCellCol: { flex: 1, padding: 5, fontSize: 8, textAlign: "center" as const, color: COLORS.slate500 },
  qualSelected: { color: COLORS.primary, fontWeight: "bold" },
})

interface DepartmentScorecardPDFProps {
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
  // Weights in this app are sometimes stored as 0–1, sometimes as 0–100. Detect.
  const pct = n > 1 ? n : n * 100
  return `${pct.toFixed(0)}%`
}

export default function DepartmentScorecardPDF({ data, activeAddress }: DepartmentScorecardPDFProps) {
  const department = data?.department?.name || data?.department || "Department"
  const goals: any[] = data?.goals || []
  const matrix: any[] = data?.document?.performanceMatrix || []
  const rollup: any[] = data?.rollupSummary || data?.employeeRollupSummary || []
  const warnings: string[] = data?.warnings || []
  const periodLabel = data?.contract?.periodLabel || data?.reviewPeriod

  // Group goals by scorecard pillar. Anything missing a pillar lands under "Goals".
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
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title="Department Performance Scorecard"
          subtitle={department}
          periodLabel={periodLabel}
          activeAddress={activeAddress}
        />

        {/* Summary KPI grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Department Score</Text>
            <Text style={styles.summaryValuePrimary}>
              {data?.scores?.departmentScore ?? "—"}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Performance Label</Text>
            <Text style={styles.summaryValue}>
              {data?.scores?.performanceLabel ?? "—"}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Goals</Text>
            <Text style={styles.summaryValue}>{goals.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pillars</Text>
            <Text style={styles.summaryValue}>{perspectives.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Roll-up Records</Text>
            <Text style={styles.summaryValue}>{rollup.length}</Text>
          </View>
          {data?.department?.headOfDepartmentName && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Head of Dept</Text>
              <Text style={styles.summaryValue}>{data.department.headOfDepartmentName}</Text>
            </View>
          )}
          {data?.appraiser?.name && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Appraiser</Text>
              <Text style={styles.summaryValue}>{data.appraiser.name}</Text>
            </View>
          )}
        </View>

        {/* Balanced Scorecard table */}
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

        {/* Performance matrix as supplemental BSC table when present */}
        {matrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Matrix</Text>
            <BalancedScorecardTable
              perspectives={[
                {
                  id: "matrix",
                  name: "Matrix",
                  color: COLORS.primary,
                },
              ]}
              rows={matrix.map((row: any) => {
                const target = toNumber(row.target)
                const actual = toNumber(row.actualDirect ?? row.actual)
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
                    actual: fmtNumber(row.actualDirect ?? row.actual),
                    weight: fmtWeight(row.weight),
                    rating: fmtNumber(row.rawRating),
                    weighted: fmtNumber(row.weightedScore),
                  },
                }
              })}
              columns={[
                { key: "goal", label: "Goal / KPI", flex: 3, bold: true },
                { key: "target", label: "Target", flex: 1, align: "right" },
                { key: "actual", label: "Actual", flex: 1, align: "right", heat: true },
                { key: "weight", label: "Weight", flex: 0.8, align: "right" },
                { key: "rating", label: "Rating", flex: 0.8, align: "right" },
                { key: "weighted", label: "Weighted", flex: 0.9, align: "right" },
              ]}
            />
          </View>
        )}

        {/* Employee Roll-up */}
        {(() => {
          const rollupRows: any[] = data?.document?.rollupTable ?? data?.rollupSummary ?? data?.employeeRollupSummary ?? []
          if (rollupRows.length === 0) return null
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employee Roll-up Summary</Text>
              <BalancedScorecardTable
                perspectives={[{ id: 'rollup', name: 'Employee Roll-up', color: COLORS.primary }]}
                rows={rollupRows.map((row: any) => ({
                  perspectiveId: 'rollup',
                  heat: 'neutral' as any,
                  values: {
                    employee: row.employeeName ?? '—',
                    score: String(row.finalScore ?? '—'),
                    weight: row.rollupWeight != null ? `${row.rollupWeight}%` : '—',
                    contribution: String(row.weightedContribution ?? '—'),
                  },
                }))}
                columns={[
                  { key: 'employee', label: 'Employee', flex: 3, bold: true },
                  { key: 'score', label: 'Final Score', flex: 1, align: 'right' as const },
                  { key: 'weight', label: 'Roll-up Weight', flex: 1, align: 'right' as const },
                  { key: 'contribution', label: 'Weighted Contribution', flex: 1.2, align: 'right' as const },
                ]}
              />
            </View>
          )
        })()}

        {/* HOD Leadership Evaluation */}
        {(() => {
          const attrs: any[] = data?.document?.qualitativeSections?.personalAttributes ?? []
          if (attrs.length === 0) return null
          const colLabels: string[] = attrs[0]?.columns?.map((c: any) => c.label) ?? []
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOD Leadership Evaluation</Text>
              <View style={styles.qualTable}>
                <View style={styles.qualHeaderRow}>
                  <Text style={[styles.qualCellAttr, { fontWeight: 'bold', color: COLORS.slate900 }]}>Attribute</Text>
                  {colLabels.map((col: string) => (
                    <Text key={col} style={[styles.qualCellCol, { fontWeight: 'bold', color: COLORS.slate900 }]}>{col}</Text>
                  ))}
                </View>
                {attrs.map((attr: any, idx: number) => (
                  <View key={idx} style={idx === attrs.length - 1 ? styles.qualRowLast : styles.qualRow}>
                    <Text style={styles.qualCellAttr}>{attr.attribute}</Text>
                    {attr.columns.map((col: any) => (
                      <Text key={col.label} style={[styles.qualCellCol, col.selected ? styles.qualSelected : {}]}>
                        {col.selected ? '●' : '○'}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )
        })()}

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warnings &amp; Notes</Text>
            {warnings.map((warning, idx) => (
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
