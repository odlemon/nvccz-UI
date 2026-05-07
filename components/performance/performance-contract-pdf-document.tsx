import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PerformancePdfLetterhead } from "./pdf-letterhead"

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
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.slate700,
  },
  // Status pill row directly under the letterhead
  pillRow: { flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  pillPrimary: { backgroundColor: "#dbeafe", color: "#1e40af" },
  pillStatus: { backgroundColor: "#dcfce7", color: "#166534" },
  pillStatusInactive: { backgroundColor: "#f1f5f9", color: COLORS.slate700 },

  // Section
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate300,
  },

  // Two-column field grid
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  gridCell: { width: "50%", paddingHorizontal: 4, marginBottom: 8 },
  cellBox: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: 4,
    backgroundColor: COLORS.slate100,
    padding: 8,
  },
  cellLabel: {
    fontSize: 7,
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  cellValue: { fontSize: 10, color: COLORS.slate900, fontWeight: "bold" },
  cellMeta: { fontSize: 8, color: COLORS.slate500, marginTop: 2 },

  // Inline label/value row (for compact lists)
  inlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  inlineLabel: { fontSize: 9, color: COLORS.slate500 },
  inlineValue: { fontSize: 9, color: COLORS.slate900, fontWeight: "bold" },

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

interface PerformanceContractPDFProps {
  contract: any
  activeAddress?: any
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—")

const fullName = (u?: { firstName?: string; lastName?: string }) =>
  u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : ""

export default function PerformanceContractPDF({
  contract,
  activeAddress,
}: PerformanceContractPDFProps) {
  const c = contract || {}
  const subjectName = fullName(c.subjectUser) || "No participant assigned"
  const subjectEmail = c.subjectUser?.email || "—"
  const createdByName = fullName(c.createdBy) || "System"
  const createdByEmail = c.createdBy?.email || "—"
  const reviewerName = fullName(c.reviewer) || "Not assigned"
  const approverName = fullName(c.approver) || "Not assigned"
  const allocated = Number(c.allocatedBudget ?? 0).toLocaleString()
  const actual = Number(c.actualSpend ?? 0).toLocaleString()
  const source = String(c.metadata?.source ?? "manual_entry").replace(/_/g, " ")

  const isActive = String(c.status || "").toUpperCase() === "ACTIVE"

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title={c.title || `${c.contractType || ""} Performance Contract`.trim()}
          subtitle={subjectName ? `Subject: ${subjectName}` : "Performance Contract"}
          periodLabel={c.periodLabel}
          activeAddress={activeAddress}
        />

        {/* Status pills row */}
        <View style={styles.pillRow}>
          <Text style={[styles.pill, styles.pillPrimary]}>
            {String(c.contractType || "").toUpperCase()} CONTRACT
          </Text>
          <Text style={[styles.pill, isActive ? styles.pillStatus : styles.pillStatusInactive]}>
            {String(c.status || "—").toUpperCase()}
          </Text>
          {c.periodLabel && (
            <Text style={[styles.pill, styles.pillStatusInactive]}>
              PERIOD · {c.periodLabel}
            </Text>
          )}
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Subject Participant</Text>
                <Text style={styles.cellValue}>{subjectName}</Text>
                <Text style={styles.cellMeta}>{subjectEmail}</Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Created By</Text>
                <Text style={styles.cellValue}>{createdByName}</Text>
                <Text style={styles.cellMeta}>{createdByEmail}</Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Reviewer</Text>
                <Text style={styles.cellValue}>{reviewerName}</Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Approver</Text>
                <Text style={styles.cellValue}>{approverName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Period & Department */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period &amp; Department</Text>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Reporting Period</Text>
                <Text style={styles.cellValue}>{c.periodLabel || "—"}</Text>
                <Text style={styles.cellMeta}>
                  {fmtDate(c.periodStart)} — {fmtDate(c.periodEnd)}
                </Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Department</Text>
                <Text style={styles.cellValue}>{c.departmentName || "—"}</Text>
                <Text style={styles.cellMeta}>Primary org unit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Allocated Budget</Text>
                <Text style={[styles.cellValue, { color: COLORS.slate900 }]}>
                  ${allocated}
                </Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <View style={styles.cellBox}>
                <Text style={styles.cellLabel}>Actual Spend</Text>
                <Text style={[styles.cellValue, { color: COLORS.red }]}>
                  ${actual}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>Source</Text>
            <Text style={[styles.inlineValue, { textTransform: "capitalize" }]}>
              {source}
            </Text>
          </View>
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>Contract ID</Text>
            <Text style={styles.inlineValue}>{c.id || "—"}</Text>
          </View>
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>Generated</Text>
            <Text style={styles.inlineValue}>{new Date().toLocaleString()}</Text>
          </View>
        </View>

        {/* Fixed footer */}
        <View style={styles.footer} fixed>
          <Text>NVCCZ Performance Management · Generated {new Date().toLocaleString()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
