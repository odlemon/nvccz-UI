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
  visionBox: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: COLORS.slate100,
  },
  visionLabel: { fontSize: 7, color: COLORS.slate500, textTransform: "uppercase", marginBottom: 2 },
  visionText: { fontSize: 9, color: COLORS.slate900 },
  alertCard: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
    borderRadius: 4,
    padding: 8,
    marginBottom: 5,
  },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  alertName: { fontSize: 9, color: COLORS.slate900, fontWeight: "bold" },
  alertType: {
    fontSize: 7,
    color: COLORS.white,
    backgroundColor: COLORS.amber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  alertMeta: { fontSize: 8, color: COLORS.slate500 },
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

interface OrgBscPDFProps {
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
  // Pillar weights for Org BSC are stored as 0-100; goal weights as 0-1.
  const pct = n > 1 ? n : n * 100
  return `${pct.toFixed(0)}%`
}

export default function OrgBscPDF({ data, activeAddress }: OrgBscPDFProps) {
  const pillars: any[] = data?.pillars || []
  const warnings: string[] = data?.warnings || []
  const alerts: any[] = data?.alerts || []
  const overallScore = data?.orgBscScore ?? data?.overallScore

  // Build BSC perspectives + rows from pillars + their goals.
  const perspectives: BSCPerspective[] = []
  const bscRows: BSCRow[] = []

  for (const pillar of pillars) {
    const pillarLabel = pillar.pillarLabel || pillar.pillarCode || "Pillar"
    const perspectiveId = `pillar-${pillar.pillarCode || pillarLabel}`
    perspectives.push({
      id: perspectiveId,
      name: pillarLabel,
      color: colorForPillar(pillarLabel),
      weight: fmtWeight(pillar.pillarWeight),
    })

    const goals: any[] = Array.isArray(pillar.goals) ? pillar.goals : []

    if (goals.length === 0) {
      // Pillar with no goals — emit a single placeholder so the banner still renders.
      const heat = computeHeat({
        status: pillar.pillarStatus,
        progress: toNumber(pillar.pillarScore),
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: pillarLabel,
          target: "—",
          actual: "—",
          progress: "—",
          weight: fmtWeight(pillar.pillarWeight),
          score: fmtNumber(pillar.pillarScore),
        },
      })
      continue
    }

    for (const goal of goals) {
      const target = goal.targetValue
      const actual = goal.actualValue
      const progress = goal.progressPct
      const heat = computeHeat({
        status: goal.status,
        progress: progress !== null && progress !== undefined ? toNumber(progress) : null,
        target: target !== null && target !== undefined ? toNumber(target) : null,
        actual: actual !== null && actual !== undefined ? toNumber(actual) : null,
        isReverseKpi: !!goal.isReverseKpi,
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: goal.goalName || "—",
          target: fmtNumber(target),
          actual: fmtNumber(actual),
          progress: fmtPercent(progress),
          weight: fmtWeight(goal.effectiveWeight ?? goal.goalWeight),
          score: fmtNumber(goal.progressPct),
        },
      })
    }
  }

  const columns: BSCColumn[] = [
    { key: "objective", label: "Strategic Objective", flex: 3, bold: true },
    { key: "target", label: "Target", flex: 1, align: "right" },
    { key: "actual", label: "Actual", flex: 1, align: "right", heat: true },
    { key: "progress", label: "Progress", flex: 1, align: "right", heat: true },
    { key: "weight", label: "Weight", flex: 0.8, align: "right" },
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title="Organisational Balanced Scorecard"
          subtitle={data?.organisationName || "Organisation"}
          periodLabel={data?.reviewPeriod}
          activeAddress={activeAddress}
        />

        {/* Summary KPI grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overall BSC Score</Text>
            <Text style={styles.summaryValuePrimary}>{fmtNumber(overallScore)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>{data?.orgBscStatus || "—"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pillars</Text>
            <Text style={styles.summaryValue}>{pillars.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Goals</Text>
            <Text style={styles.summaryValue}>
              {pillars.reduce((sum, p: any) => sum + (p?.goals?.length || 0), 0)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Alerts</Text>
            <Text style={styles.summaryValue}>{alerts.length}</Text>
          </View>
        </View>

        {/* Strategic alignment */}
        {data?.ceoVision?.statement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Alignment</Text>
            <View style={styles.visionBox}>
              <Text style={styles.visionLabel}>Vision</Text>
              <Text style={styles.visionText}>{data.ceoVision.statement}</Text>
            </View>
          </View>
        )}

        {/* Balanced Scorecard */}
        {bscRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balanced Scorecard by Pillar</Text>
            <BalancedScorecardTable
              perspectives={perspectives}
              rows={bscRows}
              columns={columns}
            />
            <HeatMapLegend />
          </View>
        )}

        {/* Active alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            {alerts.slice(0, 12).map((alert: any, idx: number) => (
              <View key={`${alert.goalId || "alert"}-${idx}`} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertName}>{alert.goalName || "Data alert"}</Text>
                  <Text style={styles.alertType}>{alert.type || "ALERT"}</Text>
                </View>
                <Text style={styles.alertMeta}>{alert.message || "No message"}</Text>
                {alert.pillar && (
                  <Text style={styles.alertMeta}>Pillar: {alert.pillar}</Text>
                )}
              </View>
            ))}
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
