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
  indigo: "#6366f1",
  purple: "#9333ea",
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

  // Summary KPI cards
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

  alertBox: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: 6,
    padding: 8,
    backgroundColor: COLORS.white,
    marginBottom: 6,
  },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  alertTitle: { fontSize: 9, fontWeight: "bold", color: COLORS.slate900 },
  alertBadge: { fontSize: 7, color: COLORS.primary, fontWeight: "bold", textTransform: "uppercase" },
  alertMessage: { fontSize: 8, color: COLORS.slate500 },
  alertMeta: { fontSize: 7, color: COLORS.slate400, marginTop: 2 },

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

export default function OrgBscPDF({ data, activeAddress }: OrgBscPDFProps) {
  const pillars = data?.pillars || []
  const warnings = data?.warnings || []
  const alerts = data?.alerts || []
  const overallScore = data?.orgBscScore ?? data?.overallScore ?? 0
  const reviewPeriod = data?.reviewPeriod || data?.periodLabel || "N/A"

  // We'll treat all pillars as belonging to one "Governance & Performance" perspective
  // or just use their labels as perspective names.
  const perspectives: BSCPerspective[] = pillars.map((p: any, idx: number) => ({
    id: p.pillarCode || `pillar-${idx}`,
    name: p.pillarLabel || p.pillarCode || "N/A",
    color: colorForPillar(p.pillarLabel || p.pillarCode),
  }))

  const bscRows: BSCRow[] = pillars.map((p: any, idx: number) => {
    const id = p.pillarCode || `pillar-${idx}`
    const heat = computeHeat({
        status: p.pillarStatus,
        actual: toNumber(p.pillarScore)
    })
    return {
      perspectiveId: id,
      heat,
      values: {
        objective: p.pillarLabel || "Pillar Performance",
        score: fmtNumber(p.pillarScore),
        weight: fmtPercent(p.pillarWeight),
        goalsCount: (p.goals?.length || 0).toString(),
        status: p.pillarStatus || "N/A",
      },
    }
  })

  const columns: BSCColumn[] = [
    { key: "objective", label: "Strategic Pillar", flex: 3, bold: true },
    { key: "score", label: "Weighted Score", flex: 1.5, align: "right", heat: true },
    { key: "weight", label: "Pillar Weight", flex: 1.2, align: "right" },
    { key: "goalsCount", label: "Linked Goals", flex: 1, align: "right" },
    { key: "status", label: "Pillar Status", flex: 1.5, align: "center", heat: true },
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title="Organisational Balanced Scorecard"
          subtitle={data?.organisationName || "Executive Dashboard"}
          periodLabel={reviewPeriod}
          activeAddress={activeAddress}
        />

        {/* Summary KPI grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overall BSC Score</Text>
            <Text style={styles.summaryValuePrimary}>
              {fmtNumber(overallScore)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pillars</Text>
            <Text style={styles.summaryValue}>{pillars.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active Alerts</Text>
            <Text style={styles.summaryValue}>{alerts.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>{data?.orgBscStatus || "N/A"}</Text>
          </View>
        </View>

        {/* Balanced Scorecard table */}
        {bscRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Pillar Performance</Text>
            <BalancedScorecardTable
              perspectives={perspectives}
              rows={bscRows}
              columns={columns}
            />
            <HeatMapLegend />
          </View>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Critical Alerts & Notifications</Text>
            {alerts.slice(0, 10).map((alert: any, idx: number) => (
              <View key={idx} style={styles.alertBox}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.goalName || "Metric Alert"}</Text>
                  <Text style={styles.alertBadge}>{alert.type}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertMeta}>Pillar: {alert.pillar || "Corporate"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dashboard Warnings</Text>
            {warnings.map((warning: string, idx: number) => (
              <View key={idx} style={styles.warningBox}>
                <Text style={styles.warningText}>• {warning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Organisational BSC Executive Report • Generated {new Date().toLocaleString()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
