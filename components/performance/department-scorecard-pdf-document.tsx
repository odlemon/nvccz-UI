import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottomWidth: 2, borderBottomColor: "#3b82f6", paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#1e293b", marginBottom: 6 },
  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, padding: 8, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 9, color: "#64748b" },
  value: { fontSize: 9, color: "#1e293b", fontWeight: "bold" },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
})

interface DepartmentScorecardPDFProps {
  data: any
}

const toNumber = (value: unknown) => {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function DepartmentScorecardPDF({ data }: DepartmentScorecardPDFProps) {
  const department = data?.department?.name || data?.department || "Department"
  const goals = data?.goals || []
  const matrix = data?.document?.performanceMatrix || []
  const rollup = data?.rollupSummary || data?.employeeRollupSummary || []
  const warnings = data?.warnings || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Department Performance Scorecard</Text>
          <Text style={styles.subtitle}>{department}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Department Score</Text>
            <Text style={styles.value}>{data?.scores?.departmentScore ?? "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Performance Label</Text>
            <Text style={styles.value}>{data?.scores?.performanceLabel ?? "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Goals</Text>
            <Text style={styles.value}>{goals.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Roll-up Records</Text>
            <Text style={styles.value}>{rollup.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          {goals.slice(0, 12).map((goal: any, idx: number) => {
            const progress = toNumber(goal.selectedProgressPct ?? goal.progressPct ?? goal.progressPercentage)
            return (
              <View key={goal.id || idx} style={styles.card}>
                <Text style={styles.value}>{goal.goalName || goal.title || `Goal ${idx + 1}`}</Text>
                <Text style={styles.label}>KPI: {goal.kpiOrMeasure || "N/A"}</Text>
                <Text style={styles.label}>Progress: {progress.toFixed(1)}% | Rating: {goal.rawRating ?? "N/A"}</Text>
                <Text style={styles.label}>Target: {goal.targetValue ?? "N/A"} | Actual: {goal.selectedActualValue ?? goal.directActualValue ?? goal.currentValue ?? "N/A"}</Text>
              </View>
            )
          })}
        </View>

        {matrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Matrix</Text>
            {matrix.slice(0, 10).map((row: any, idx: number) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.value}>{row.goal || row.kpiOrMeasure || `Row ${idx + 1}`}</Text>
                <Text style={styles.label}>Target: {row.target ?? "N/A"} | Actual: {row.actualDirect ?? row.actual ?? "N/A"}</Text>
                <Text style={styles.label}>Status: {row.status || row.varianceStatus || "N/A"} | Weighted: {row.weightedScore ?? "N/A"}</Text>
              </View>
            ))}
          </View>
        )}

        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warnings</Text>
            {warnings.map((warning: string, idx: number) => (
              <Text key={idx} style={styles.label}>- {warning}</Text>
            ))}
          </View>
        )}

        <Text style={styles.footer}>Generated on {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  )
}
