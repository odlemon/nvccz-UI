import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { ProcurementInvoice } from "@/lib/api/procurement-api"
import { PdfLetterhead } from "@/components/shared/pdf-letterhead"
import type { LetterheadAddress } from "@/lib/utils/pdf-letterhead"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontSize: 10,
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#dbeafe",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  statusText: {
    fontSize: 10,
    color: "#1e40af",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f2937",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoColumn: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    color: "#1f2937",
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1f2937",
  },
  col1: { width: "5%" },
  col2: { width: "30%" },
  col3: { width: "25%" },
  col4: { width: "10%", textAlign: "right" },
  col5: { width: "15%", textAlign: "right" },
  col6: { width: "15%", textAlign: "right" },
  totalsSection: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: "45%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalsLabel: {
    fontSize: 11,
    color: "#4b5563",
  },
  totalsValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  notesBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.4,
  },
})

interface ProcurementInvoicePDFProps {
  invoice: ProcurementInvoice
  letterheadAddress?: LetterheadAddress | null
}

export default function ProcurementInvoicePDF({
  invoice,
  letterheadAddress,
}: ProcurementInvoicePDFProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    return numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfLetterhead address={letterheadAddress} />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #: {invoice.invoiceNumber}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{invoice.status.replace("_", " ")}</Text>
            </View>
            {invoice.paymentStatus && (
              <View style={[styles.statusBadge, { backgroundColor: "#dcfce7" }]}>
                <Text style={[styles.statusText, { color: "#166534" }]}>
                  {invoice.paymentStatus.replace("_", " ")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Vendor and Invoice Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Vendor Information</Text>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>{invoice.vendor.name}</Text>
            {invoice.vendor.email && (
              <>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{invoice.vendor.email}</Text>
              </>
            )}
            {invoice.vendor.phone && (
              <>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{invoice.vendor.phone}</Text>
              </>
            )}
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.invoiceDate)}</Text>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={[styles.infoValue, isOverdue && { color: "#dc2626" }]}>
              {formatDate(invoice.dueDate)} {isOverdue && "(Overdue)"}
            </Text>
            {invoice.receivedDate && (
              <>
                <Text style={styles.infoLabel}>Received Date</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.receivedDate)}</Text>
              </>
            )}
            {invoice.purchaseOrder && (
              <>
                <Text style={styles.infoLabel}>Purchase Order</Text>
                <Text style={styles.infoValue}>{invoice.purchaseOrder.poNumber}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.col1]}>#</Text>
              <Text style={[styles.tableCellHeader, styles.col2]}>Item Name</Text>
              <Text style={[styles.tableCellHeader, styles.col3]}>Description</Text>
              <Text style={[styles.tableCellHeader, styles.col4]}>Qty</Text>
              <Text style={[styles.tableCellHeader, styles.col5]}>Unit Price</Text>
              <Text style={[styles.tableCellHeader, styles.col6]}>Total</Text>
            </View>

            {/* Table Rows */}
            {invoice.items.map((item, index) => (
              <View key={item.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.itemName}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.tableCell, styles.col5]}>
                  {invoice.currency?.symbol || '$'}
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.col6]}>
                  {invoice.currency?.symbol || '$'}
                  {formatCurrency(item.totalPrice || 0)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {invoice.currency?.symbol || '$'}
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax Amount</Text>
            <Text style={styles.totalsValue}>
              {invoice.currency?.symbol || '$'}
              {formatCurrency(invoice.taxAmount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              {invoice.currency?.symbol || '$'}
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        {invoice.paymentDate && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Payment Information</Text>
            <Text style={styles.notesText}>
              Payment Date: {formatDate(invoice.paymentDate)}
              {invoice.paymentReference && `\nReference: ${invoice.paymentReference}`}
            </Text>
          </View>
        )}

        {/* Journal Entry */}
        {invoice.journalEntry && (
          <View style={[styles.notesBox, { backgroundColor: "#dbeafe", borderColor: "#3b82f6" }]}>
            <Text style={[styles.notesTitle, { color: "#1e40af" }]}>Journal Entry</Text>
            <Text style={[styles.notesText, { color: "#1e3a8a" }]}>
              Reference: {invoice.journalEntry.referenceNumber}
              {"\n"}Status: {invoice.journalEntry.status}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>
            Currency: {invoice.currency?.code || 'USD'} ({invoice.currency?.name || 'US Dollar'})
          </Text>
        </View>
      </Page>
    </Document>
  )
}
