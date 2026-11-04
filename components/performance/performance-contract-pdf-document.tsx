import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PerformancePdfLetterhead } from "./pdf-letterhead"

const COLORS = {
  primary: "#1e40af", // Formal Darker Blue
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  emerald: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  white: "#ffffff",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.slate700,
    lineHeight: 1.5,
  },
  
  // Contract Title Section
  contractTitleContainer: {
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.slate900,
    paddingBottom: 15,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slate900,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  contractSubtitle: {
    fontSize: 10,
    color: COLORS.slate500,
    marginTop: 5,
    fontWeight: "bold",
  },

  // Recitals / Intro
  recital: {
    marginBottom: 20,
    fontStyle: "italic",
    fontSize: 10,
    color: COLORS.slate900,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.slate300,
    paddingLeft: 10,
  },

  // Section Styling
  section: { 
    marginBottom: 25,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.slate900,
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Tables
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.slate50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellLabel: {
    fontWeight: "bold",
    fontSize: 8,
    color: COLORS.slate500,
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.slate900,
  },

  // KPI Table Specifics
  kpiRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingVertical: 10,
  },
  kpiColMain: { flex: 4, paddingRight: 10 },
  kpiColValue: { flex: 1.5, textAlign: "right", paddingRight: 5 },
  kpiColUnit: { flex: 1, textAlign: "right" },
  
  kpiTitle: { fontSize: 9, fontWeight: "bold", color: COLORS.slate900 },
  kpiSubtitle: { fontSize: 7, color: COLORS.slate500, marginTop: 2 },

  // Legal Clauses
  clause: {
    marginBottom: 12,
  },
  clauseTitle: {
    fontWeight: "bold",
    color: COLORS.slate900,
    marginRight: 5,
  },

  // Signatures
  signatureGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    gap: 30,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate900,
    paddingTop: 10,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.slate900,
  },
  signatureLabel: {
    fontSize: 7,
    color: COLORS.slate500,
    textTransform: "uppercase",
    marginTop: 2,
  },
  signatureDate: {
    fontSize: 7,
    color: COLORS.slate400,
    marginTop: 6,
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.slate400,
  },
})

interface PerformanceContractPDFProps {
  contract: any
  activeAddress?: any
}

const fullName = (u?: { firstName?: string; lastName?: string }) =>
  u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : ""

export default function PerformanceContractPDF({
  contract: c,
  activeAddress,
}: PerformanceContractPDFProps) {
  const metadata = c.metadata && typeof c.metadata === "object" ? c.metadata : {}
  const subjectName = fullName(c.subjectUser) || c.subjectName || c.departmentName || "Official Subject"
  const subjectRole = c.subjectUser?.jobTitle || c.subjectUser?.role?.name || (c.contractType === "CEO" ? "Chief Executive Officer" :
                   c.contractType === "BOARD" ? "Member of the Board" :
                   c.contractType === "DEPARTMENT" ? "Department Head" : "Employee")

  const reviewerName = fullName(c.reviewer) || c.reviewerName || "Official Reviewer"
  const approverName = fullName(c.approver) || c.approverName || "Approving Authority"
  const goals = c.contractKpis?.goals || c.goals || []
  const objectiveEvidence = metadata.objectiveEvidence && typeof metadata.objectiveEvidence === "object" ? metadata.objectiveEvidence : {}
  const reference = c.documentReference || `PC-${String(c.contractType || "EMPLOYEE").replace(/[^A-Z0-9]/gi, "-")}-${c.periodLabel || new Date(c.periodStart || Date.now()).getUTCFullYear()}-V${c.versionNo || 1}`

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PerformancePdfLetterhead
          title="Official Performance Agreement"
          subtitle={c.periodLabel ? `Reporting Cycle: ${c.periodLabel}` : "Executive Agreement"}
          periodLabel={c.periodLabel}
          activeAddress={activeAddress ? { ...activeAddress, logoUrl: "/nvccz-logo.png" } : null}
        />

        <View style={styles.contractTitleContainer}>
          <Text style={styles.contractTitle}>
            {c.contractType} PERFORMANCE CONTRACT
          </Text>
          <Text style={styles.contractSubtitle}>
            CONTRACT REF: {reference}
          </Text>
        </View>

        <Text style={styles.recital}>
          THIS AGREEMENT is entered into for the performance cycle of {c.periodLabel}, setting out the agreed
          performance objectives, measures, evidence requirements and review expectations between the organisation
          and the Subject Participant.
        </Text>

        {/* 1.0 PARTIES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>1.0 Parties to the Agreement</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellLabel}>Subject Participant</Text>
                <Text style={styles.tableCellText}>{subjectName}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellLabel}>Designation</Text>
                <Text style={styles.tableCellText}>{subjectRole}</Text>
              </View>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellLabel}>Department / Unit</Text>
                <Text style={styles.tableCellText}>{c.departmentName || c.subjectUser?.userDepartment || "Corporate Executive"}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellLabel}>Agreement Status</Text>
                <Text style={[styles.tableCellText, { color: c.status === 'ACTIVE' ? COLORS.emerald : COLORS.amber }]}>
                  {c.status || "PENDING"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {metadata.bodyText ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>2.0 Agreement Details</Text>
            <Text>{metadata.bodyText}</Text>
          </View>
        ) : null}

        {/* 3.0 OBJECTIVES */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeading}>{metadata.bodyText ? "3.0" : "2.0"} Objectives and Measures</Text>
          <Text style={{ fontSize: 8, marginBottom: 8, color: COLORS.slate500 }}>
            The following objectives, measures and targets have been agreed for this period. Review cadence: {metadata.reviewCadence || "As agreed by the signatories"}.
          </Text>
          
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.slate900, marginBottom: 5 }} />
          <View style={{ flexDirection: "row", paddingVertical: 4 }}>
             <Text style={[styles.tableCellLabel, { flex: 4 }]}>Deliverable / KPI Description</Text>
             <Text style={[styles.tableCellLabel, { flex: 1.5, textAlign: "right" }]}>Target</Text>
             <Text style={[styles.tableCellLabel, { flex: 1, textAlign: "right" }]}>Unit</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.slate300, marginBottom: 5 }} />

          {goals.length > 0 ? (
            goals.map((goal: any, idx: number) => (
              <View key={goal.id} style={styles.kpiRow} wrap={false}>
                <View style={styles.kpiColMain}>
                  <Text style={styles.kpiTitle}>{idx + 1}. {goal.title}</Text>
                  <Text style={styles.kpiSubtitle}>{goal.scorecardPillar || "Strategic"}{goal.measureName || goal.kpiName ? ` | Measure: ${goal.measureName || goal.kpiName}` : ""}{objectiveEvidence[goal.id] ? ` | Evidence: ${objectiveEvidence[goal.id]}` : ""}</Text>
                </View>
                <View style={styles.kpiColValue}>
                  <Text style={styles.tableCellText}>{goal.targetValue || "0"}</Text>
                </View>
                <View style={styles.kpiColUnit}>
                  <Text style={[styles.tableCellText, { fontSize: 8, color: COLORS.slate500 }]}>{goal.targetUnit || "Units"}</Text>
                  {goal.scorecardWeight != null ? <Text style={styles.kpiSubtitle}>{Number(goal.scorecardWeight).toFixed(2).replace(/\.00$/, "")}% weight</Text> : null}
                </View>
              </View>
            ))
          ) : (
             <Text style={{ textAlign: "center", paddingVertical: 20, color: COLORS.slate400, fontSize: 8 }}>
                No specific KPIs have been defined for this contract.
             </Text>
          )}
        </View>

        {metadata.development || metadata.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{metadata.bodyText ? "4.0" : "3.0"} Commitments and Notes</Text>
            {metadata.development ? <Text><Text style={styles.clauseTitle}>Development commitments: </Text>{metadata.development}</Text> : null}
            {metadata.notes ? <Text style={{ marginTop: 8 }}><Text style={styles.clauseTitle}>Notes: </Text>{metadata.notes}</Text> : null}
          </View>
        ) : null}

        {/* 4.0 SIGNATORIES */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeading}>{metadata.bodyText ? "5.0" : "4.0"} Agreement Signatories</Text>
          <Text style={{ fontSize: 8, color: COLORS.slate500, marginBottom: 10 }}>
            By signing below, the parties agree to strictly adhere to the performance metrics and financial 
            provisions outlined in this document.
          </Text>

          <View style={styles.signatureGrid}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureName}>{subjectName}</Text>
              <Text style={styles.signatureLabel}>Subject Participant (Obligor)</Text>
              <Text style={styles.signatureDate}>Date: ________________________</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureName}>{reviewerName}</Text>
              <Text style={styles.signatureLabel}>Official Reviewer</Text>
              <Text style={styles.signatureDate}>Date: ________________________</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureName}>{approverName}</Text>
              <Text style={styles.signatureLabel}>Approving Authority</Text>
              <Text style={styles.signatureDate}>Date: ________________________</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Performance Contract Ref: {reference}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
