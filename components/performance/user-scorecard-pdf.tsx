import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#ffffff", padding: 30 },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#3b82f6", paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#6b7280" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8, color: "#1f2937" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 10, color: "#6b7280" },
  value: { fontSize: 10, color: "#111827", fontWeight: "bold" },
  card: { padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, marginBottom: 8 },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
  },
})

interface UserScorecardPDFProps {
  data: any
}

const toNumber = (value: unknown) => {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function UserScorecardPDF({ data }: UserScorecardPDFProps) {
  const employee = data?.employee || {}
  const goals = data?.goals || []
  const warnings = data?.warnings || []
  const matrix = data?.document?.performanceMatrix || []
  const taskSummary = data?.document?.taskSummary || []
  const flatTasks = taskSummary.flatMap((section: any) => section?.tasks || [])

  const totalGoals = goals.length
  const completedGoals = goals.filter((goal: any) => toNumber(goal.progressPct ?? goal.progressPercentage) >= 100).length
  const completedTasks = flatTasks.filter((task: any) => String(task.status || "").toLowerCase().includes("complete")).length

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Individual Performance Scorecard</Text>
          <Text style={styles.subtitle}>Employee: {employee?.name || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{employee?.department || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{employee?.role || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Final Score</Text>
            <Text style={styles.value}>{data?.scores?.finalScore ?? "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Performance Label</Text>
            <Text style={styles.value}>{data?.scores?.performanceLabel ?? "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Goals</Text>
            <Text style={styles.value}>{completedGoals}/{totalGoals} completed</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasks</Text>
            <Text style={styles.value}>{completedTasks}/{flatTasks.length} completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          {goals.slice(0, 10).map((goal: any, idx: number) => (
            <View key={goal.id || idx} style={styles.card}>
              <Text style={styles.value}>{goal.goalName || goal.title || `Goal ${idx + 1}`}</Text>
              <Text style={styles.label}>Progress: {toNumber(goal.progressPct ?? goal.progressPercentage).toFixed(1)}%</Text>
              <Text style={styles.label}>Weight: {goal.weight ?? "N/A"} | Rating: {goal.rawRating ?? "N/A"}</Text>
            </View>
          ))}
        </View>

        {matrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Matrix</Text>
            {matrix.slice(0, 8).map((row: any, idx: number) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.value}>{row.goal || row.kpiOrMeasure || `Row ${idx + 1}`}</Text>
                <Text style={styles.label}>Target: {row.target ?? "N/A"} | Actual: {row.actual ?? "N/A"}</Text>
                <Text style={styles.label}>Rating: {row.rawRating ?? "N/A"} | Weighted: {row.weightedScore ?? "N/A"}</Text>
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
