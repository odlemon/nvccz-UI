export type DocCategory = "Legal" | "Track Record" | "Marketing" | "Due Diligence" | "KYC" | "Financials"
export type DocStatus = "Draft" | "In Review" | "Approved" | "Superseded"

export type FrDocument = {
  id: string
  name: string
  category: DocCategory
  campaign: string
  version: string
  status: DocStatus
  owner: string
  updated: string
  confidential: boolean
  versions: { id: string; version: string; updated: string; author: string; note: string }[]
}

export const FR_DOCUMENTS: FrDocument[] = [
  {
    id: "d1",
    name: "ZGF II Private Placement Memorandum",
    category: "Legal",
    campaign: "ZGF II",
    version: "v3.1",
    status: "Approved",
    owner: "Tawanda Chirwa",
    updated: "18 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v3.1", updated: "18 May 2025", author: "Tawanda Chirwa", note: "IC feedback incorporated" },
      { id: "v2", version: "v3.0", updated: "10 May 2025", author: "Tawanda Chirwa", note: "Legal clean version" },
      { id: "v3", version: "v2.4", updated: "28 Apr 2025", author: "Legal", note: "Superseded" },
    ],
  },
  {
    id: "d2",
    name: "Limited Partnership Agreement",
    category: "Legal",
    campaign: "ZGF II",
    version: "v3",
    status: "In Review",
    owner: "Tawanda Chirwa",
    updated: "19 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v3", updated: "19 May 2025", author: "Tawanda Chirwa", note: "Clause 8.2 highlighted" },
      { id: "v2", version: "v2", updated: "02 May 2025", author: "Legal", note: "Superseded — invalidates open signatures" },
    ],
  },
  {
    id: "d3",
    name: "Track Record Workbook",
    category: "Track Record",
    campaign: "ZGF II",
    version: "v5",
    status: "Approved",
    owner: "Kudakwashe Mlambo",
    updated: "17 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v5", updated: "17 May 2025", author: "Kudakwashe Mlambo", note: "Q1 updates" },
    ],
  },
  {
    id: "d4",
    name: "Fund Teaser Deck",
    category: "Marketing",
    campaign: "ZGF II",
    version: "v8",
    status: "Approved",
    owner: "Tariro Moyo",
    updated: "12 May 2025",
    confidential: false,
    versions: [
      { id: "v1", version: "v8", updated: "12 May 2025", author: "Tariro Moyo", note: "Roadshow ready" },
    ],
  },
  {
    id: "d5",
    name: "DDQ Master Responses",
    category: "Due Diligence",
    campaign: "ZGF II",
    version: "v2",
    status: "In Review",
    owner: "Tawanda Chirwa",
    updated: "19 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v2", updated: "19 May 2025", author: "Tawanda Chirwa", note: "Waterfall FAQs added" },
    ],
  },
  {
    id: "d6",
    name: "KYC Pack Template",
    category: "KYC",
    campaign: "All Campaigns",
    version: "v1.2",
    status: "Approved",
    owner: "Compliance",
    updated: "01 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v1.2", updated: "01 May 2025", author: "Compliance", note: "UBO checklist update" },
    ],
  },
  {
    id: "d7",
    name: "Investment Guidelines — NSSA",
    category: "Legal",
    campaign: "Institutional Mandates FY25",
    version: "v1",
    status: "Draft",
    owner: "Grace Chirwa",
    updated: "17 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v1", updated: "17 May 2025", author: "Grace Chirwa", note: "Initial draft" },
    ],
  },
  {
    id: "d8",
    name: "Audited Statements (3yrs)",
    category: "Financials",
    campaign: "ZGF II",
    version: "v1",
    status: "Approved",
    owner: "Finance",
    updated: "15 May 2025",
    confidential: true,
    versions: [
      { id: "v1", version: "v1", updated: "15 May 2025", author: "Finance", note: "FY22–FY24 pack" },
    ],
  },
]

export const DOC_CATEGORIES: DocCategory[] = [
  "Legal",
  "Track Record",
  "Marketing",
  "Due Diligence",
  "KYC",
  "Financials",
]

export function docStatusClass(s: DocStatus) {
  switch (s) {
    case "Approved":
      return "bg-[#dcfce7] text-[#15803d]"
    case "In Review":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Superseded":
      return "bg-[#f1f5f9] text-[#64748b]"
    default:
      return "bg-[#e0f2fe] text-[#0369a1]"
  }
}
