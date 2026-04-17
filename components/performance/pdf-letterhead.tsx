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
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  logo: {
    width: 46,
    height: 46,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  companyLine: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 1,
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

const fallbackAddress = {
  label: "National Venture Capital Company of Zimbabwe",
  line1: "4th Floor Blue Bridge",
  line2: "Eastgate Mall",
  city: "Harare",
  country: "Zimbabwe",
}

const DEFAULT_LOGO_URL = "/logo.png"

const buildAddressLines = (address: LetterheadAddress) => {
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ")
  return [address.line1, address.line2, cityLine, address.country].filter(Boolean) as string[]
}

export function PerformancePdfLetterhead({
  title,
  subtitle,
  periodLabel,
  activeAddress,
}: PerformancePdfLetterheadProps) {
  const address = activeAddress || fallbackAddress
  const lines = buildAddressLines(address)
  const logoUrl = address.logoUrl || DEFAULT_LOGO_URL

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View>
          <Image src={logoUrl} style={styles.logo} />
        </View>
        <View>
          <Text style={styles.companyName}>{address.label || fallbackAddress.label}</Text>
          {lines.map((line, idx) => (
            <Text key={`${line}-${idx}`} style={styles.companyLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {periodLabel ? <Text style={styles.period}>Period: {periodLabel}</Text> : null}
    </View>
  )
}
