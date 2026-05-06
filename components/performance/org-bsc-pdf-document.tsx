import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PerformancePdfLetterhead } from "./pdf-letterhead"

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottomWidth: 2, borderBottomColor: "#2563eb", paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#1f2937", marginBottom: 6 },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 8, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 9, color: "#6b7280" },
  value: { fontSize: 9, color: "#111827", fontWeight: "bold" },
  footer: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, fontSize: 8, color: "#9ca3af", textAlign: "center" },
})

interface OrgBscPDFProps {
  data: any
  activeAddress?: any
}

export default function OrgBscPDF({ data, activeAddress }: OrgBscPDFProps) {
  const pillars = data?.pillars || []
  const warnings = data?.warnings || []
  const alerts = data?.alerts || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PerformancePdfLetterhead
          title="Organisational Balanced Scorecard"
          subtitle={data?.organisationName || "Organisation"}
          periodLabel={data?.reviewPeriod}
          activeAddress={activeAddress}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.row}><Text style={styles.label}>Review Period</Text><Text style={styles.value}>{data?.reviewPeriod || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Overall Score</Text><Text style={styles.value}>{data?.orgBscScore ?? data?.overallScore ?? "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={styles.value}>{data?.orgBscStatus || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Pillars</Text><Text style={styles.value}>{pillars.length}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Alerts</Text><Text style={styles.value}>{alerts.length}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pillar Performance</Text>
          {pillars.slice(0, 8).map((pillar: any, idx: number) => (
            <View key={`${pillar.pillarCode || "pillar"}-${idx}`} style={styles.card}>
              <Text style={styles.value}>{pillar.pillarLabel || pillar.pillarCode || `Pillar ${idx + 1}`}</Text>
              <Text style={styles.label}>Weight: {pillar.pillarWeight ?? "N/A"}% | Score: {pillar.pillarScore ?? "N/A"} | Status: {pillar.pillarStatus || "N/A"}</Text>
              <Text style={styles.label}>Goals: {pillar.goals?.length || 0}</Text>
            </View>
          ))}
        </View>

        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {alerts.slice(0, 8).map((alert: any, idx: number) => (
              <View key={`${alert.goalId || "alert"}-${idx}`} style={styles.card}>
                <Text style={styles.value}>{alert.goalName || alert.type || "Alert"}</Text>
                <Text style={styles.label}>{alert.message || "No message"}</Text>
                <Text style={styles.label}>Pillar: {alert.pillar || "N/A"}</Text>
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
