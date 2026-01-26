import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  userDetails: {
    flexDirection: "column",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 12,
    color: "#6b7280",
  },
  badge: {
    padding: "8 12",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f2937",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    width: "23%",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  performanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  performanceValue: {
    fontSize: 12,
    color: "#3b82f6",
  },
  goalItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  goalTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  goalProgress: {
    fontSize: 10,
    color: "#6b7280",
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 10,
    color: "#6b7280",
  },
})

interface UserScorecardPDFProps {
  data: any
}

export default function UserScorecardPDF({ data }: UserScorecardPDFProps) {
  const getPerformanceBandColor = (band: string) => {
    switch (band) {
      case "Excellent":
        return "#10b981"
      case "Good":
        return "#3b82f6"
      case "Fair":
        return "#f59e0b"
      default:
        return "#ef4444"
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Scorecard</Text>
          <Text style={styles.subtitle}>Individual Performance Report</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{data.user.name}</Text>
            <Text style={styles.userRole}>
              {data.user.department || "No Department"}
              {data.user.role && ` • ${data.user.role}`}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: getPerformanceBandColor(data.scorecard.finalScore.performanceBand) },
            ]}
          >
            <Text>{data.scorecard.finalScore.performanceBand}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Goals</Text>
              <Text style={styles.statValue}>{data.scorecard.summary.totalGoals}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{data.scorecard.summary.completedGoals}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Tasks</Text>
              <Text style={styles.statValue}>{data.scorecard.summary.totalTasks}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Final Score</Text>
              <Text style={styles.statValue}>{data.scorecard.finalScore.total}</Text>
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Breakdown</Text>
          {data.scorecard.sections.resultsDelivery && (
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Results Delivery</Text>
              <Text style={styles.performanceValue}>
                {data.scorecard.sections.resultsDelivery.totalScore} /{" "}
                {data.scorecard.sections.resultsDelivery.maxScore}
              </Text>
            </View>
          )}
          {data.scorecard.sections.budgetPerformance && (
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Budget Performance</Text>
              <Text style={styles.performanceValue}>
                {data.scorecard.sections.budgetPerformance.totalScore} /{" "}
                {data.scorecard.sections.budgetPerformance.maxScore}
              </Text>
            </View>
          )}
        </View>

        {/* Active Goals */}
        {data.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals ({data.goals.length})</Text>
            {data.goals.slice(0, 5).map((goal: any, index: number) => (
              <View key={index} style={styles.goalItem}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalProgress}>
                  Progress: {goal.progressPercentage}% • Status: {goal.stage.replace("_", " ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
          <Text style={styles.footerText}>Arcus Performance Management System</Text>
        </View>
      </Page>
    </Document>
  )
}
