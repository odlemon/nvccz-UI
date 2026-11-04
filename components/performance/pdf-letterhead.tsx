import { Image, Text, View, StyleSheet } from "@react-pdf/renderer"

interface LetterheadAddress {
  label?: string
  line1?: string
  line2?: string | null
  city?: string
  state?: string | null
  postalCode?: string | null
  country?: string
  logoUrl?: string | null
}

interface PerformancePdfLetterheadProps {
  title: string
  subtitle?: string
  periodLabel?: string
  activeAddress?: LetterheadAddress | null
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    paddingBottom: 8,
  },
  logo: {
    width: "100%",
    height: 89,
    objectFit: "contain",
    objectPosition: "left top",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 9,
    color: "#475569",
    marginTop: 2,
  },
  period: {
    marginTop: 3,
    fontSize: 8,
    color: "#64748b",
  },
})

const NVCCZ_LETTERHEAD_URL = "/nvccz-letterhead-header-2026.png"

export function PerformancePdfLetterhead({
  title,
  subtitle,
  periodLabel,
}: PerformancePdfLetterheadProps) {
  return (
    <View style={styles.wrap}>
      <Image src={NVCCZ_LETTERHEAD_URL} style={styles.logo} />

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {periodLabel ? <Text style={styles.period}>Period: {periodLabel}</Text> : null}
    </View>
  )
}
