import { View, Text, StyleSheet, Image } from "@react-pdf/renderer"
import type { LetterheadAddress } from "@/lib/utils/pdf-letterhead"

const FALLBACK_COMPANY_NAME = "National Venture Capital Company of Zimbabwe"
const FALLBACK_ADDRESS_LINES = [
  "4th Floor Blue Bridge",
  "Eastgate Mall",
  "Harare",
  "Zimbabwe",
]

const styles = StyleSheet.create({
  // Banner: blue gradient feel with white text on the right, logo on left
  banner: {
    backgroundColor: "#0f172a", // slate-900
    color: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -40, // bleed to page edge when parent has 40 padding
    marginTop: -40,
    marginBottom: 20,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#ffffff20",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 56,
    height: 56,
    objectFit: "contain",
  },
  logoFallback: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  rightCol: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 8,
    color: "#cbd5e1", // slate-300
    marginBottom: 1.5,
  },
  divider: {
    height: 2,
    backgroundColor: "#3b82f6", // blue-500
    marginHorizontal: -40,
    marginTop: -20,
    marginBottom: 16,
  },
})

interface Props {
  /** Active address from companyProfileApi.getActiveAddress() — may be null */
  address?: LetterheadAddress | null
}

/**
 * Letterhead band rendered at the very top of an invoice / PO / financial
 * document PDF. Uses the dynamic active address (logo + company info) if
 * provided, otherwise falls back to NVCCZ defaults.
 *
 * IMPORTANT: must be the first child of <Page> with `padding: 40`. The
 * negative margins make the banner bleed to the page edge.
 */
export function PdfLetterhead({ address }: Props) {
  const companyName = address?.label || FALLBACK_COMPANY_NAME

  const addressLines: string[] = address
    ? [
        address.line1,
        ...(address.line2 ? [address.line2] : []),
        [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(", "),
        address.country,
      ].filter(Boolean)
    : FALLBACK_ADDRESS_LINES

  return (
    <>
      <View style={styles.banner} fixed>
        <View style={styles.logoBox}>
          {address?.logoUrl ? (
            // @react-pdf/renderer can fetch remote images directly
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={address.logoUrl} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoFallback}>
              {companyName
                .split(" ")
                .filter((w) => /^[A-Za-z]/.test(w))
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "NV"}
            </Text>
          )}
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.companyName}>{companyName}</Text>
          {addressLines.map((line, i) => (
            <Text key={i} style={styles.addressLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.divider} fixed />
    </>
  )
}
