import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { Invoice } from "@/lib/api/accounting-api"
import { PdfLetterhead } from "@/components/shared/pdf-letterhead"
import type { LetterheadAddress } from "@/lib/utils/pdf-letterhead"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, backgroundColor: "#ffffff", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  statusPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#e0f2fe" },
  statusText: { fontSize: 10, color: "#0369a1", textTransform: "uppercase", fontWeight: "bold" },
  section: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  sectionColumn: { flex: 1 },
  sectionColumnRight: { marginLeft: 32 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6, color: "#111827" },
  text: { fontSize: 10, color: "#374151", marginBottom: 2 },
  itemsHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  itemsRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8, paddingHorizontal: 12 },
  itemsCell: { fontSize: 10, color: "#1f2937", flexDirection: "column", justifyContent: "center" },
  descriptionColumn: { flex: 3, paddingRight: 12 },
  qtyColumn: { flex: 1, textAlign: "right" },
  unitColumn: { flex: 1.5, textAlign: "right" },
  amountColumn: { flex: 1.5, textAlign: "right" },
  itemTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  itemMeta: { fontSize: 9, color: "#6b7280" },
  emptyItems: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  summary: { marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: "#f9fafb", alignSelf: "flex-end", width: "60%" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 10, color: "#4b5563" },
  summaryValue: { fontSize: 10, fontWeight: "bold", color: "#1f2937" },
  summaryTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 12, fontWeight: "bold", color: "#111827" },
  summaryTotalValue: { fontSize: 12, fontWeight: "bold", color: "#10b981" },
  notes: { marginTop: 24, padding: 12, borderRadius: 8, backgroundColor: "#eef2ff" },
  footer: { marginTop: 24, fontSize: 10, color: "#6b7280", textAlign: "center" },
  paidStamp: { marginTop: 8, fontSize: 10, color: "#10b981", fontWeight: "bold", textAlign: "center" },
})

const formatCurrency = (symbol: string, value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value ?? 0)
  if (!Number.isFinite(numeric)) return `${symbol}0.00`
  return `${symbol}${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const toNumber = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

const InvoicePDF = ({
  invoice,
  letterheadAddress,
}: {
  invoice: Invoice
  letterheadAddress?: LetterheadAddress | null
}) => {
  const currencySymbol = invoice.currency?.symbol || ""
  const items = invoice.items || []
  const subtotal = invoice.amount ?? invoice.totalAmount
  const tax = invoice.vatAmount
  const total = invoice.totalAmount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfLetterhead address={letterheadAddress} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {invoice.status === 'PAID' ? 'PAYMENT RECEIPT' : 'INVOICE'}
            </Text>
            <Text style={styles.subtitle}>
              {invoice.status === 'PAID' ? `Receipt #: ${invoice.invoiceNumber}` : `Invoice #: ${invoice.invoiceNumber}`}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionColumn}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.text}>{invoice.customer?.name}</Text>
            {!!invoice.customer?.contactPerson && <Text style={styles.text}>{invoice.customer.contactPerson}</Text>}
            {!!invoice.customer?.email && <Text style={styles.text}>{invoice.customer.email}</Text>}
            {!!invoice.customer?.phone && <Text style={styles.text}>{invoice.customer.phone}</Text>}
            {!!invoice.customer?.address && <Text style={styles.text}>{invoice.customer.address}</Text>}
          </View>
          <View style={[styles.sectionColumn, styles.sectionColumnRight]}>
            <Text style={styles.sectionTitle}>
              {invoice.status === 'PAID' ? 'Receipt' : 'Invoice'} Details
            </Text>
            <Text style={styles.text}>Date: {new Date(invoice.transactionDate).toLocaleDateString()}</Text>
            {invoice.paymentDate && (
              <Text style={styles.text}>Payment Date: {new Date(invoice.paymentDate).toLocaleDateString()}</Text>
            )}
            <Text style={styles.text}>Currency: {invoice.currency?.code} ({invoice.currency?.name})</Text>
            <Text style={styles.text}>Payment Method: {invoice.paymentMethod || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsCell, styles.descriptionColumn]}>Description</Text>
          <Text style={[styles.itemsCell, styles.qtyColumn]}>Qty</Text>
          <Text style={[styles.itemsCell, styles.unitColumn]}>Unit Price</Text>
          <Text style={[styles.itemsCell, styles.amountColumn]}>Amount</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Text style={styles.text}>No items recorded for this invoice.</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const quantity = item.quantity != null ? toNumber(item.quantity) : null
            const unitPrice = item.unitPrice != null ? toNumber(item.unitPrice) : null
            const lineTotal =
              quantity != null && unitPrice != null ? quantity * unitPrice : toNumber(item.amount)

            return (
              <View key={`${item.description}-${index}`} style={styles.itemsRow}>
                <View style={[styles.itemsCell, styles.descriptionColumn]}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  {item.category && <Text style={styles.itemMeta}>Category: {item.category}</Text>}
                </View>
                <Text style={[styles.itemsCell, styles.qtyColumn]}>
                  {quantity != null ? quantity : "-"}
                </Text>
                <Text style={[styles.itemsCell, styles.unitColumn]}>
                  {unitPrice != null ? formatCurrency(currencySymbol, unitPrice) : "-"}
                </Text>
                <Text style={[styles.itemsCell, styles.amountColumn]}>
                  {formatCurrency(currencySymbol, lineTotal)}
                </Text>
              </View>
            )
          })
        )}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(currencySymbol, subtotal)}</Text>
          </View>
          {invoice.isTaxable && tax != null && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT / Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(currencySymbol, tax)}</Text>
            </View>
          )}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(currencySymbol, total)}</Text>
          </View>
        </View>

        {invoice.description && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{invoice.description}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {invoice.status === 'PAID' 
              ? 'Thank you for your payment. This receipt confirms your transaction.'
              : 'Thank you for your business. Payment is due upon receipt.'}
          </Text>
          {invoice.status === 'PAID' && (
            <Text style={styles.paidStamp}>PAID</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDF
