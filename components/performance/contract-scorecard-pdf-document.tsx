import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PerformancePdfLetterhead } from "./pdf-letterhead"

const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  accent: "#6366f1",
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
  page: { paddingTop: 36, paddingBottom: 44, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: COLORS.slate700 },

  // Header
  headerBand: {
    backgroundColor: COLORS.primary,
    marginHorizontal: -32,
    marginTop: -36,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginBottom: 18,
  },
  headerType: { fontSize: 9, color: COLORS.white, opacity: 0.85, letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 22, color: COLORS.white, fontWeight: "bold", marginBottom: 4 },
  headerSubtitle: { fontSize: 10, color: COLORS.white, opacity: 0.95 },
  headerPill: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    borderRadius: 10,
    fontSize: 9,
    color: COLORS.white,
  },

  // Section
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: COLORS.slate900, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: COLORS.slate300 },

  // Summary KPI row
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
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

  // Generic row
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  rowLabel: { fontSize: 9, color: COLORS.slate500 },
  rowValue: { fontSize: 9, color: COLORS.slate900, fontWeight: "bold" },

  // Table
  table: { borderWidth: 1, borderColor: COLORS.slate300, borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: COLORS.primary },
  tableHeaderCell: { padding: 6, fontSize: 8, color: COLORS.white, fontWeight: "bold" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.slate300, backgroundColor: COLORS.white },
  tableRowAlt: { backgroundColor: COLORS.slate100 },
  tableCell: { padding: 6, fontSize: 8, color: COLORS.slate700 },
  tableCellBold: { padding: 6, fontSize: 8, color: COLORS.slate900, fontWeight: "bold" },

  // Indicator card
  indicatorCard: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: 4,
    padding: 8,
    marginBottom: 5,
    backgroundColor: COLORS.white,
  },
  indicatorHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  indicatorName: { fontSize: 9, color: COLORS.slate900, fontWeight: "bold", flex: 1 },
  indicatorBadge: { fontSize: 7, color: COLORS.white, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  indicatorMeta: { fontSize: 8, color: COLORS.slate500 },

  // Warning / info box
  warningBox: { borderLeftWidth: 3, borderLeftColor: COLORS.amber, backgroundColor: "#fffbeb", padding: 8, borderRadius: 4, marginBottom: 5 },
  warningText: { fontSize: 8, color: "#92400e" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
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
  const agreed: any[] = data?.agreedRatingsSummary || data?.document?.agreedRatingsSummary || []
  const periodLabel = data?.contract?.periodLabel || "—"

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title={data?.contract?.title || `${type} Contract ${periodLabel}`}
          subtitle={subjectName ? `${subjectName}${subjectTitle ? ` - ${subjectTitle}` : ""}` : "Contract party not assigned"}
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

        {/* Section breakdown table */}
        {sections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Section</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Indicators</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Score</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Label</Text>
              </View>
              {sections.map(([key, section], idx) => (
                <View
                  key={key}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{key}</Text>
                  <Text style={[styles.tableCellBold, { flex: 3 }]}>
                    {section?.label || "Section"}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {Math.round((Number(section?.weight) || 0) * 100)}%
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {section?.indicators?.length ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellBold,
                      { flex: 1, color: scoreColor(section?.sectionScore) },
                    ]}
                  >
                    {section?.sectionScore ?? "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1.4, color: labelColor(section?.performanceLabel) },
                    ]}
                  >
                    {section?.performanceLabel || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Agreed ratings summary */}
        {agreed.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Agreed Ratings Summary</Text>
            {agreed.slice(0, 12).map((item: any, idx: number) => (
              <View key={`${item.section || "item"}-${idx}`} style={styles.indicatorCard}>
                <View style={styles.indicatorHeader}>
                  <Text style={styles.indicatorName}>
                    {item.heading || item.section || "Item"}
                  </Text>
                  <Text style={[styles.indicatorBadge, { backgroundColor: scoreColor(item.sectionScore) }]}>
                    {item.sectionScore ?? "—"}
                  </Text>
                </View>
                <Text style={styles.indicatorMeta}>
                  Section: {item.section || "N/A"} · {item.label || "No label"}
                </Text>
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

        {/* Fixed footer */}
        <View style={styles.footer} fixed>
          <Text>NVCCZ Performance Management · Generated {new Date().toLocaleString()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
