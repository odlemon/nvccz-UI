import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { PurchaseInvoice } from "@/lib/api/accounting-api"
import { PdfLetterhead } from "@/components/shared/pdf-letterhead"
import type { LetterheadAddress } from "@/lib/utils/pdf-letterhead"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, backgroundColor: "#ffffff", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  statusPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#fff7ed" },
  statusText: { fontSize: 10, color: "#9a3412", textTransform: "uppercase", fontWeight: "bold" },
  section: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  sectionColumn: { flex: 1 },
  sectionColumnRight: { marginLeft: 32 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6, color: "#111827" },
  text: { fontSize: 10, color: "#374151", marginBottom: 2 },
  itemsHeader: { flexDirection: "row", backgroundColor: "#fff7ed", borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
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
  summaryTotalValue: { fontSize: 12, fontWeight: "bold", color: "#f97316" },
  notes: { marginTop: 24, padding: 12, borderRadius: 8, backgroundColor: "#fffaf0" },
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

const PurchaseInvoicePDF = ({
  invoice,
  letterheadAddress,
}: {
  invoice: PurchaseInvoice
  letterheadAddress?: LetterheadAddress | null
}) => {
  const currencySymbol = invoice.currency?.symbol || ""
  const items = invoice.items || []
  const subtotal = invoice.subtotal
  const tax = invoice.vatAmount
  const total = invoice.totalAmount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfLetterhead address={letterheadAddress} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {invoice.paymentStatus === 'PAID' ? 'PURCHASE RECEIPT' : 'PURCHASE INVOICE'}
            </Text>
            <Text style={styles.subtitle}>
              {invoice.paymentStatus === 'PAID' ? `Receipt #: ${invoice.invoiceNumber}` : `Invoice #: ${invoice.invoiceNumber}`}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{invoice.paymentStatus === 'PAID' ? 'PAID' : invoice.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionColumn}>
            <Text style={styles.sectionTitle}>Vendor</Text>
            <Text style={styles.text}>{invoice.vendor?.name}</Text>
            {!!invoice.vendor?.contactPerson && <Text style={styles.text}>{invoice.vendor.contactPerson}</Text>}
            {!!invoice.vendor?.email && <Text style={styles.text}>{invoice.vendor.email}</Text>}
            {!!invoice.vendor?.phone && <Text style={styles.text}>{invoice.vendor.phone}</Text>}
            {!!invoice.vendor?.address && <Text style={styles.text}>{invoice.vendor.address}</Text>}
          </View>
          <View style={[styles.sectionColumn, styles.sectionColumnRight]}>
            <Text style={styles.sectionTitle}>
              Details
            </Text>
            <Text style={styles.text}>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</Text>
            <Text style={styles.text}>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
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
            const quantity = toNumber(item.quantity)
            const unitPrice = toNumber(item.unitPrice)
            const lineTotal = quantity * unitPrice

            return (
              <View key={`${item.itemName}-${index}`} style={styles.itemsRow}>
                <View style={[styles.itemsCell, styles.descriptionColumn]}>
                  <Text style={styles.itemTitle}>{item.itemName}</Text>
                  {item.description && <Text style={styles.itemMeta}>{item.description}</Text>}
                </View>
                <Text style={[styles.itemsCell, styles.qtyColumn]}>
                  {quantity} {item.unit}
                </Text>
                <Text style={[styles.itemsCell, styles.unitColumn]}>
                  {formatCurrency(currencySymbol, unitPrice)}
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
          {invoice.paymentStatus === 'PAID' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Paid</Text>
              <Text style={styles.summaryValue}>{formatCurrency(currencySymbol, invoice.paidAmount)}</Text>
            </View>
          )}
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {invoice.paymentStatus === 'PAID' 
              ? 'This is an official receipt for the payment of the above purchase.'
              : 'Please ensure payment is made by the due date mentioned above.'}
          </Text>
          {invoice.paymentStatus === 'PAID' && (
            <Text style={styles.paidStamp}>PAID</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default PurchaseInvoicePDF
