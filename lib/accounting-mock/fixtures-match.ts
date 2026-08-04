export const acMatchInvoice = {
  id: "AP-2026-0187",
  status: "Match exception",
  supplier: "ZimTech Solutions (Pvt) Ltd",
  supplierCode: "SUP-00341",
  invoiceNo: "ZTS-4481",
  invoiceDate: "10 Jul 2026",
  dueDate: "07 Aug 2026",
  overdue: "28 days overdue",
  currency: "USD",
  total: "$28,476.00",
  po: "PO-10492",
  grn: "GRN-7714",
  buyer: "Chipo Mhlanga",
  paymentTerms: "Net 30",
  incoterms: "FOB Harare",
  department: "IT Infrastructure",
}

export const acMatchTabs = ["Invoice", "Purchase Order", "Goods Receipt", "Audit"]

export type AcMatchLine = {
  line: number
  item: string
  sku: string
  invQty: string
  invPrice: string
  invTax: string
  invAmount: string
  poQty: string
  poPrice: string
  poAmount: string
  grQty: string
  varQty: string
  varAmount: string
  result: "Matched" | "Exception"
  poQtyWarn?: boolean
}

export const acMatchLines: AcMatchLine[] = [
  {
    line: 1,
    item: "Dell PowerEdge R660 Rack Server",
    sku: "SKU: DELL-R660",
    invQty: "2",
    invPrice: "7,500.00",
    invTax: "15%",
    invAmount: "17,250.00",
    poQty: "2",
    poPrice: "7,500.00",
    poAmount: "17,250.00",
    grQty: "2",
    varQty: "0",
    varAmount: "0.00",
    result: "Matched",
  },
  {
    line: 2,
    item: "Samsung 1.92TB SSD (Enterprise)",
    sku: "SKU: SAM-1.92TB",
    invQty: "4",
    invPrice: "1,280.00",
    invTax: "15%",
    invAmount: "5,888.00",
    poQty: "4",
    poPrice: "1,280.00",
    poAmount: "5,888.00",
    grQty: "4",
    varQty: "0",
    varAmount: "0.00",
    result: "Matched",
  },
  {
    line: 3,
    item: "Ubiquiti UniFi 24-Port PoE Switch",
    sku: "SKU: UBI-U24P",
    invQty: "3",
    invPrice: "420.00",
    invTax: "15%",
    invAmount: "1,449.00",
    poQty: "3",
    poPrice: "420.00",
    poAmount: "1,449.00",
    grQty: "3",
    varQty: "0",
    varAmount: "0.00",
    result: "Matched",
  },
  {
    line: 4,
    item: "Cisco Catalyst 9300 Switch Stack",
    sku: "SKU: CISCO-9300-48T",
    invQty: "4",
    invPrice: "2,300.00",
    invTax: "15%",
    invAmount: "10,580.00",
    poQty: "2",
    poPrice: "2,300.00",
    poAmount: "4,600.00",
    grQty: "2",
    varQty: "2",
    varAmount: "1,840.00",
    result: "Exception",
    poQtyWarn: true,
  },
]

export const acMatchTotals = {
  subtotal: "24,680.00",
  tax: "3,796.00",
  total: "28,476.00",
}

export const acMatchDocument = {
  filename: "ZTS-4481_Invoice.pdf",
  size: "142 KB",
}

export const acMatchComments = [
  {
    author: "Chipo Mhlanga (Buyer)",
    date: "14 Jul 2026, 09:12",
    text: "Please confirm ETA for the additional 2 Cisco units.",
  },
  {
    author: "Tariro Ncube (Finance)",
    date: "14 Jul 2026, 10:03",
    text: "Supplier confirmed 2 units on backorder arriving 18 Aug 2026.",
  },
]

export const acMatchAttachments = [
  { name: "GRN-7714_DeliveryNote.pdf", size: "98 KB", date: "10 Jul 2026" },
  { name: "ZTS-4481_Terms.pdf", size: "74 KB", date: "10 Jul 2026" },
  { name: "Warranty_Cisco_9300.pdf", size: "112 KB", date: "10 Jul 2026" },
]

export const acMatchAudit = [
  { label: "Invoice Created", user: "Chipo Mhlanga", date: "10 Jul 2026", tone: "done" as const },
  { label: "Submitted for Review", user: "Chipo Mhlanga", date: "11 Jul 2026", tone: "done" as const },
  { label: "Under Finance Review", user: "Tariro Ncube", date: "14 Jul 2026", tone: "done" as const },
  { label: "Match Exception", user: "Tariro Ncube", date: "14 Jul 2026, 10:02", sub: "Quantity variance on line 4", tone: "exception" as const },
  { label: "Pending Approval", user: "Tariro Ncube", date: "14 Jul 2026", tone: "pending" as const },
]

export const acMatchCompliance = [
  { label: "Duplicate Check", status: "Passed", tone: "ok" as const },
  { label: "Vendor Bank Details", status: "Verified", tone: "ok" as const },
  { label: "Budget Check", status: "Passed", tone: "ok" as const },
  { label: "Withholding Tax", status: "Review", tone: "warn" as const },
  { label: "Three-Way Match", status: "Exception", tone: "exception" as const },
]

export const acMatchApprovers = [
  { step: 1, name: "Chipo Mhlanga", role: "Buyer", status: "Approved", date: "11 Jul 2026", active: true },
  { step: 2, name: "Tariro Ncube", role: "Finance Review", status: "Review", date: "14 Jul 2026", active: true },
  { step: 3, name: "Farai Moyo", role: "Approver", status: "Pending", active: false },
]

export const acMatchPayment = {
  account: "CBZ USD Operating (19023456780012)",
  method: "EFT",
  batchDate: "05 Aug 2026",
  estimatedDate: "05 Aug 2026",
  amount: "28,476.00",
  note: "Payment will be scheduled upon final approval.",
}

export const acMatchAccountOptions = [
  "CBZ USD Operating (19023456780012)",
  "CBZ ZiG Operating (19023456780013)",
]
export const acMatchMethodOptions = ["EFT", "RTGS", "Cheque"]

export const acMatchFooter = {
  created: "Created by Chipo Mhlanga on 10 Jul 2026, 09:01",
  updated: "Last updated by Tariro Ncube on 14 Jul 2026, 10:05",
}
