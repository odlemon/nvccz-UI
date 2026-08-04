/** Accounting V2 — Inventory Valuation & Controls mock fixtures (slide 08). */

export const acInvFilters = {
  warehouse: "Harare Main",
  valuationDate: "31 Jul 2026",
  valuationMethod: "Weighted Average",
}

export type AcInvKpi = {
  id: string
  label: string
  value: string
  icon: "box" | "tag" | "alert" | "clock" | "scale"
  tone?: "pending" | "exception"
}

export const acInvKpis: AcInvKpi[] = [
  { id: "value", label: "Inventory value", value: "$1,284,660", icon: "box" },
  { id: "items", label: "Items", value: "486", icon: "tag" },
  { id: "low", label: "Low stock items", value: "18", icon: "alert", tone: "pending" },
  { id: "slow", label: "Slow moving value", value: "$92,440", icon: "clock", tone: "pending" },
  { id: "variance", label: "Count variance", value: "$12,860", icon: "scale", tone: "exception" },
]

export type AcInvRow = {
  sku: string
  item: string
  category: string
  location: string
  onHand: string
  reserved: string
  available: string
  unitCost: string
  stockValue: string
  lastMovement: string
  controlState: string
}

export const acInvRows: AcInvRow[] = [
  { sku: "NET-SW-024", item: "Cisco switch stack", category: "Networking", location: "Harare Main", onHand: "24", reserved: "6", available: "18", unitCost: "$1,245.80", stockValue: "$29,899.20", lastMovement: "29 Jul 2026", controlState: "Controlled" },
  { sku: "LAP-TH-014", item: "Lenovo ThinkPad E14", category: "IT Equipment", location: "Harare Main", onHand: "32", reserved: "8", available: "24", unitCost: "$712.40", stockValue: "$22,796.80", lastMovement: "28 Jul 2026", controlState: "Controlled" },
  { sku: "PRN-TNR-85A", item: "HP 85A Black Toner", category: "Printer Consumables", location: "Harare Main", onHand: "76", reserved: "0", available: "76", unitCost: "$78.35", stockValue: "$5,954.60", lastMovement: "27 Jul 2026", controlState: "Controlled" },
  { sku: "DRU-HP-19A", item: "HP 19A Imaging Drum", category: "Printer Consumables", location: "Harare Main", onHand: "18", reserved: "0", available: "18", unitCost: "$124.50", stockValue: "$2,241.00", lastMovement: "26 Jul 2026", controlState: "Controlled" },
  { sku: "SEC-ET-511", item: "Safenet eToken 5110", category: "Security", location: "Harare Main", onHand: "42", reserved: "4", available: "38", unitCost: "$86.90", stockValue: "$3,649.80", lastMovement: "25 Jul 2026", controlState: "Controlled" },
  { sku: "UPS-APC-1500", item: "APC UPS 1500VA", category: "IT Equipment", location: "Harare Main", onHand: "8", reserved: "2", available: "6", unitCost: "$385.20", stockValue: "$3,081.60", lastMovement: "24 Jul 2026", controlState: "Controlled" },
  { sku: "NET-CAT6-305", item: "Cat6 Cable 305m Box", category: "Networking", location: "Harare Main", onHand: "12", reserved: "0", available: "12", unitCost: "$142.30", stockValue: "$1,707.60", lastMovement: "23 Jul 2026", controlState: "Controlled" },
  { sku: "KIT-FE-01", item: "Field Engineer Kit", category: "IT Equipment", location: "Harare Main", onHand: "6", reserved: "0", available: "6", unitCost: "$540.00", stockValue: "$3,240.00", lastMovement: "22 Jul 2026", controlState: "Controlled" },
  { sku: "MON-DELL-24", item: 'Dell 24" Monitor', category: "IT Equipment", location: "Harare Main", onHand: "15", reserved: "3", available: "12", unitCost: "$198.75", stockValue: "$2,981.25", lastMovement: "21 Jul 2026", controlState: "Controlled" },
  { sku: "NAS-SYN-4TB", item: "Synology NAS 4TB", category: "IT Equipment", location: "Harare Main", onHand: "4", reserved: "0", available: "4", unitCost: "$612.00", stockValue: "$2,448.00", lastMovement: "20 Jul 2026", controlState: "Controlled" },
]

export const acInvPagination = {
  showing: "Showing 1 to 10 of 486 items",
  pages: ["1", "2", "3", "4", "5", "…", "49"],
}

export const acInvDetail = {
  sku: "NET-SW-024",
  item: "Cisco switch stack",
  category: "Networking",
  location: "Harare Main",
  onHand: "24",
  reserved: "6",
  available: "18",
  reorderLevel: "10",
  reorderQty: "20",
  uom: "Each",
  unitCost: "$1,245.80",
  stockValue: "$29,899.20",
  lastMovement: "29 Jul 2026",
  controlState: "Controlled",
  linkedPo: "PO-000348",
  glAccount: "1400-20-01",
  abc: "A",
}

export type AcInvMovement = {
  date: string
  type: string
  reference: string
  inQty: string
  outQty: string
  balance: string
}

export const acInvMovements: AcInvMovement[] = [
  { date: "29 Jul 2026", type: "Receipt", reference: "GRN-000512", inQty: "10", outQty: "—", balance: "24" },
  { date: "24 Jul 2026", type: "Issue", reference: "ISS-000276", inQty: "—", outQty: "2", balance: "14" },
]

export const acInvValuation = {
  opening: "$1,196,220",
  receipts: "$224,860",
  issues: "$123,560",
  adjustments: "-$12,860",
  closing: "$1,284,660",
}

export type AcInvAlert = {
  id: string
  title: string
  detail: string
  count: string
  tone: "pending" | "exception"
}

export const acInvAlerts: AcInvAlert[] = [
  { id: "neg", title: "Negative stock prevention", detail: "3 items blocked from issuing", count: "3", tone: "exception" },
  { id: "obs", title: "Obsolete item review", detail: "9 items not moved in 180+ days", count: "9", tone: "pending" },
  { id: "var", title: "Count variance approval", detail: "4 variances require approval", count: "4", tone: "exception" },
]

export type AcInvCostLayer = {
  date: string
  qty: string
  unitCost: string
  totalValue: string
}

export const acInvCostLayers: AcInvCostLayer[] = [
  { date: "29 Jul 2026", qty: "10", unitCost: "$1,245.80", totalValue: "$12,458.00" },
  { date: "18 Jul 2026", qty: "8", unitCost: "$1,238.50", totalValue: "$9,908.00" },
  { date: "06 Jul 2026", qty: "12", unitCost: "$1,201.25", totalValue: "$14,415.00" },
]
