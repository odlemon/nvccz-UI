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
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  rowLabel: { fontSize: 9, color: COLORS.slate500 },
  rowValue: { fontSize: 9, color: COLORS.slate900, fontWeight: "bold" },
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

const labelColor = (label?: string) => {
  if (!label) return COLORS.slate500
  const lower = String(label).toLowerCase()
  if (lower.includes("exceed") || lower.includes("outstand") || lower.includes("exemplary")) return COLORS.emerald
  if (lower.includes("meet") || lower.includes("satisf")) return COLORS.primary
  if (lower.includes("develop") || lower.includes("partial")) return COLORS.amber
  if (lower.includes("below") || lower.includes("unsatis")) return COLORS.red
  return COLORS.slate700
}

const scoreColor = (score: any) => {
  const n = Number(score)
  if (!Number.isFinite(n)) return COLORS.slate500
  if (n >= 90) return COLORS.emerald
  if (n >= 70) return COLORS.primary
  if (n >= 50) return COLORS.amber
  return COLORS.red
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

const fmtWeight = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—"
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return "—"
  const pct = n > 1 ? n : n * 100
  return `${pct.toFixed(0)}%`
}

interface ContractScorecardPDFProps {
  data: any
  type: "CEO" | "BOARD"
  activeAddress?: any
}

export default function ContractScorecardPDF({ data, type, activeAddress }: ContractScorecardPDFProps) {
  const scoreValue = data?.scores?.finalScore ?? "N/A"
  const performanceLabel = data?.scores?.performanceLabel || "N/A"
  const subjectName = type === "CEO" ? data?.ceo?.name : data?.board?.chairpersonName
  const subjectTitle = type === "CEO" ? data?.ceo?.title : data?.board?.chairpersonTitle
  const warnings: string[] = data?.warnings || []
  const sections = Object.entries(data?.sections || {}) as Array<[string, any]>
  const periodLabel = data?.contract?.periodLabel || "—"

  // Build BSC perspectives + rows from contract sections.
  // Each section becomes a perspective; its indicators become rows.
  // If a section has no indicators we still emit a single summary row so the
  // section doesn't disappear from the scorecard.
  const perspectives: BSCPerspective[] = []
  const bscRows: BSCRow[] = []

  for (const [key, section] of sections) {
    const sectionLabel = section?.label || `Section ${key}`
    const perspectiveId = `sec-${key}`
    perspectives.push({
      id: perspectiveId,
      name: sectionLabel,
      color: colorForPillar(sectionLabel),
      weight: fmtWeight(section?.weight),
    })

    const indicators: any[] = Array.isArray(section?.indicators) ? section.indicators : []

    if (indicators.length === 0) {
      const heat = computeHeat({
        status: section?.performanceLabel,
        progress: toNumber(section?.sectionScore),
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: sectionLabel,
          measure: "—",
          target: "—",
          actual: "—",
          weight: fmtWeight(section?.weight),
          rating: fmtNumber(section?.sectionScore),
          weighted: fmtNumber(section?.sectionScore),
        },
      })
      continue
    }

    for (const ind of indicators) {
      const target = ind.targetValue
      const actual = ind.computedActual
      const heat = computeHeat({
        progress: ind.progressPct !== null && ind.progressPct !== undefined ? toNumber(ind.progressPct) : null,
        target: target !== null && target !== undefined ? toNumber(target) : null,
        actual: actual !== null && actual !== undefined ? toNumber(actual) : null,
        isReverseKpi: !!ind.isReverseKpi,
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: ind.indicatorName || "—",
          measure: ind.formulaType || ind.unit || "—",
          target: fmtNumber(target),
          actual: fmtNumber(actual),
          weight: fmtWeight(ind.effectiveWeight ?? ind.weight),
          rating: fmtNumber(ind.rawRating),
          weighted: fmtNumber(ind.weightedScore),
        },
      })
    }
  }

  const columns: BSCColumn[] = [
    { key: "objective", label: "Strategic Objective / Indicator", flex: 2.6, bold: true },
    { key: "measure", label: "Measure", flex: 1.4 },
    { key: "target", label: "Target", flex: 1, align: "right" },
    { key: "actual", label: "Actual", flex: 1, align: "right", heat: true },
    { key: "weight", label: "Weight", flex: 0.8, align: "right" },
    { key: "rating", label: "Rating", flex: 0.8, align: "right" },
    { key: "weighted", label: "Weighted", flex: 0.9, align: "right", heat: true },
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title={data?.contract?.title || `${type} Contract ${periodLabel}`}
          subtitle={
            subjectName
              ? `${subjectName}${subjectTitle ? ` — ${subjectTitle}` : ""}`
              : "Contract party not assigned"
          }
          periodLabel={periodLabel}
          activeAddress={activeAddress}
        />

        {/* Summary KPI grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Final Score</Text>
            <Text style={[styles.summaryValuePrimary, { color: scoreColor(scoreValue) }]}>
              {String(scoreValue)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Performance Label</Text>
            <Text style={[styles.summaryValue, { color: labelColor(performanceLabel) }]}>
              {performanceLabel}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sections</Text>
            <Text style={styles.summaryValue}>{sections.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Indicators</Text>
            <Text style={styles.summaryValue}>
              {sections.reduce((sum, [, s]: any) => sum + (s?.indicators?.length || 0), 0)}
            </Text>
          </View>
        </View>

        {/* Contract details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Contract Type</Text>
            <Text style={styles.rowValue}>{type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Period</Text>
            <Text style={styles.rowValue}>{periodLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Contract Party</Text>
            <Text style={styles.rowValue}>{subjectName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Title</Text>
            <Text style={styles.rowValue}>{subjectTitle || "N/A"}</Text>
          </View>
          {data?.contract?.reviewer && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Reviewer</Text>
              <Text style={styles.rowValue}>{data.contract.reviewer}</Text>
            </View>
          )}
          {data?.contract?.approver && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Approver</Text>
              <Text style={styles.rowValue}>{data.contract.approver}</Text>
            </View>
          )}
        </View>

        {/* Balanced Scorecard */}
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
          <Text>NVCCZ Performance Management · Generated {new Date().toLocaleString()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
