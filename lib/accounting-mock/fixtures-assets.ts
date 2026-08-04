/** Accounting V2 — Fixed Asset Register mock fixtures (slide 09). */

export const acFaSubtitle = "Complete register of all tangible assets owned by the company."

export type AcFaKpi = {
  id: string
  label: string
  value: string
  icon: "file" | "clock" | "box" | "calc" | "list"
}

export const acFaKpis: AcFaKpi[] = [
  { id: "gross", label: "Gross Cost", value: "$1,482,900", icon: "file" },
  { id: "accum", label: "Accumulated Depreciation", value: "$438,240", icon: "clock" },
  { id: "nbv", label: "Net Book Value", value: "$1,044,660", icon: "box" },
  { id: "jul", label: "July Depreciation", value: "$21,860", icon: "calc" },
  { id: "count", label: "Assets", value: "214", icon: "list" },
]

export type AcFaRow = {
  assetId: string
  description: string
  assetClass: string
  custodian: string
  location: string
  acquisitionDate: string
  cost: string
  accumDepr: string
  nbv: string
  method: string
  status: string
}

export const acFaRows: AcFaRow[] = [
  { assetId: "AST-VEH-0012", description: "Toyota Land Cruiser Prado KDJ150", assetClass: "Vehicles", custodian: "Tawanda Chikosi", location: "Harare", acquisitionDate: "12 Mar 2022", cost: "$68,500.00", accumDepr: "$27,400.00", nbv: "$41,100.00", method: "SL 5Y", status: "Active" },
  { assetId: "AST-VEH-0013", description: "Isuzu D-Max 3.0 4x4", assetClass: "Vehicles", custodian: "Blessing Mapfumo", location: "Bulawayo", acquisitionDate: "05 Aug 2021", cost: "$42,000.00", accumDepr: "$18,900.00", nbv: "$23,100.00", method: "SL 5Y", status: "Active" },
  { assetId: "AST-IT-0084", description: "HP EliteBook 850 G9", assetClass: "IT Equipment", custodian: "Nyasha Moyo", location: "Harare", acquisitionDate: "18 Jan 2024", cost: "$1,950.00", accumDepr: "$780.00", nbv: "$1,170.00", method: "SL 3Y", status: "Active" },
  { assetId: "AST-IT-0085", description: "Lenovo ThinkPad X1 Carbon Gen 11", assetClass: "IT Equipment", custodian: "Tariro Ncube", location: "Harare", acquisitionDate: "02 Feb 2024", cost: "$2,100.00", accumDepr: "$840.00", nbv: "$1,260.00", method: "SL 3Y", status: "Active" },
  { assetId: "AST-IT-0086", description: "Dell PowerEdge R740", assetClass: "Servers", custodian: "Nyasha Moyo", location: "Harare", acquisitionDate: "11 Nov 2022", cost: "$39,800.00", accumDepr: "$17,520.00", nbv: "$22,280.00", method: "SL 5Y", status: "Active" },
  { assetId: "AST-IT-0087", description: "Dell PowerEdge R760", assetClass: "Servers", custodian: "Nyasha Moyo", location: "Harare", acquisitionDate: "15 Jan 2024", cost: "$48,900.00", accumDepr: "$16,137.00", nbv: "$32,763.00", method: "SL 5Y", status: "Active" },
  { assetId: "AST-OF-0045", description: "Office Fit-Out – 3rd Floor", assetClass: "Office Fit-Out", custodian: "Rumbi Zinyama", location: "Harare", acquisitionDate: "03 Jul 2022", cost: "$86,750.00", accumDepr: "$34,700.00", nbv: "$52,050.00", method: "SL 3Y", status: "Active" },
  { assetId: "AST-PW-0021", description: "30kVA Backup Generator (Perkins)", assetClass: "Power Equipment", custodian: "Simbarashe Dube", location: "Bulawayo", acquisitionDate: "21 Sep 2021", cost: "$19,800.00", accumDepr: "$8,910.00", nbv: "$10,890.00", method: "SL 3Y", status: "Active" },
  { assetId: "AST-PW-0022", description: "10kVA UPS System (APC)", assetClass: "Power Equipment", custodian: "Simbarashe Dube", location: "Harare", acquisitionDate: "10 Mar 2023", cost: "$7,500.00", accumDepr: "$2,700.00", nbv: "$4,800.00", method: "SL 5Y", status: "Active" },
  { assetId: "AST-VEH-0014", description: "Toyota Hilux 2.8 GD-6", assetClass: "Vehicles", custodian: "Farai Moyo", location: "Harare", acquisitionDate: "19 May 2023", cost: "$36,750.00", accumDepr: "$9,810.00", nbv: "$26,940.00", method: "SL 5Y", status: "Active" },
]

export const acFaPagination = {
  showing: "Showing 1 to 10 of 214 assets",
  pages: ["1", "2", "3", "4", "5", "…", "22"],
}

export const acFaDetail = {
  assetId: "AST-IT-0087",
  description: "Dell PowerEdge R760",
  status: "Active",
  serial: "4TJ8X23",
  assetTag: "SRV-R760-01",
  custodian: "Nyasha Moyo",
  location: "Harare – Head Office",
  acquisitionDate: "15 Jan 2024",
  inServiceDate: "16 Jan 2024",
  cost: "$48,900.00",
  usefulLife: "5 years",
  method: "Straight-line",
  residual: "$4,890.00 (10%)",
  monthlyDepr: "$733.50",
  accumDepr: "$16,137.00",
  nbv: "$32,763.00",
}

export const acFaDocuments = [
  "Asset master file.pdf",
  "Purchase invoice_INV-02451.pdf",
  "GRN_GRN-02318.pdf",
]

export type AcFaDepPreview = {
  assetClass: string
  count: string
  charge: string
  exceptions: string
  /** Badge colour when `exceptions` is a count. */
  exceptionTone?: "pending" | "exception"
  postingAccount: string
  journalRef: string
}

export const acFaDepPreview: AcFaDepPreview[] = [
  { assetClass: "Vehicles", count: "28", charge: "$5,420.00", exceptions: "–", postingAccount: "6120-10 Depreciation – Vehicles", journalRef: "DEP-JUL-2026-001" },
  { assetClass: "IT Equipment", count: "96", charge: "$6,980.50", exceptions: "1", exceptionTone: "exception", postingAccount: "6120-20 Depreciation – IT Equipment", journalRef: "DEP-JUL-2026-002" },
  { assetClass: "Servers & Storage", count: "18", charge: "$4,401.00", exceptions: "–", postingAccount: "6120-30 Depreciation – Servers", journalRef: "DEP-JUL-2026-003" },
  { assetClass: "Office Fit-Out", count: "12", charge: "$2,980.00", exceptions: "–", postingAccount: "6120-40 Depreciation – Office Fit-Out", journalRef: "DEP-JUL-2026-004" },
  { assetClass: "Power Equipment", count: "16", charge: "$2,078.50", exceptions: "1", exceptionTone: "pending", postingAccount: "6120-50 Depreciation – Power Equipment", journalRef: "DEP-JUL-2026-005" },
]

export const acFaDepTotal = {
  count: "170",
  charge: "$21,860.00",
  exceptions: "2",
}

export type AcFaException = {
  id: string
  title: string
  detail: string
  tone: "pending" | "exception"
}

export const acFaExceptions: AcFaException[] = [
  { id: "it", title: "IT Equipment", detail: "1 asset missing in-service date", tone: "exception" },
  { id: "pwr", title: "Power Equipment", detail: "1 asset flagged for disposal review", tone: "pending" },
]
