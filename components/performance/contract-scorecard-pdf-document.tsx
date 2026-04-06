import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

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

interface ContractScorecardPDFProps {
  data: any
  type: "CEO" | "BOARD"
}

export default function ContractScorecardPDF({ data, type }: ContractScorecardPDFProps) {
  const scoreValue = data?.scores?.finalScore ?? "N/A"
  const subjectName = type === "CEO" ? data?.ceo?.name : data?.board?.chairpersonName
  const subjectTitle = type === "CEO" ? data?.ceo?.title : data?.board?.chairpersonTitle
  const warnings = data?.warnings || []
  const sections = Object.entries(data?.sections || {})
  const agreed = data?.agreedRatingsSummary || data?.document?.agreedRatingsSummary || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{type} Contract Scorecard</Text>
          <Text style={styles.subtitle}>{data?.contract?.title || `${type} Contract`}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Period</Text><Text style={styles.value}>{data?.contract?.periodLabel || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Contract Party</Text><Text style={styles.value}>{subjectName || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Title</Text><Text style={styles.value}>{subjectTitle || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Final Score</Text><Text style={styles.value}>{String(scoreValue)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Performance Label</Text><Text style={styles.value}>{data?.scores?.performanceLabel || "N/A"}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section Breakdown</Text>
          {sections.slice(0, 8).map(([key, section]: [string, any]) => (
            <View key={key} style={styles.card}>
              <Text style={styles.value}>{key} - {section?.label || "Section"}</Text>
              <Text style={styles.label}>Weight: {Number(section?.weight || 0) * 100}% | Score: {section?.sectionScore ?? "N/A"} | Label: {section?.performanceLabel || "N/A"}</Text>
              <Text style={styles.label}>Indicators: {section?.indicators?.length || 0}</Text>
            </View>
          ))}
        </View>

        {agreed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agreed Ratings Summary</Text>
            {agreed.slice(0, 8).map((item: any, idx: number) => (
              <View key={`${item.section || "item"}-${idx}`} style={styles.card}>
                <Text style={styles.value}>{item.heading || item.section}</Text>
                <Text style={styles.label}>Section: {item.section || "N/A"} | Score: {item.sectionScore ?? "N/A"} | Label: {item.label || "N/A"}</Text>
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
