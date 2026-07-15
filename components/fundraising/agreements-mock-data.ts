export type AgreementType =
  | "NDA"
  | "Term Sheet"
  | "Subscription"
  | "LPA"
  | "Side Letter"
  | "IMA"
  | "Fee Schedule"

export type SigStatus =
  | "Draft"
  | "Sent"
  | "Partially Signed"
  | "Completed"
  | "Expired"
  | "Voided"

export type FrAgreement = {
  id: string
  name: string
  type: AgreementType
  investor: string
  campaign: string
  version: string
  status: SigStatus
  signatories: { id: string; name: string; role: string; status: "Pending" | "Signed" | "Declined"; signedAt: string | null }[]
  sentDate: string | null
  expiry: string | null
  owner: string
}

export const FR_AGREEMENTS: FrAgreement[] = [
  {
    id: "ag1",
    name: "NMBZ Subscription Agreement",
    type: "Subscription",
    investor: "NMBZ Holdings Limited",
    campaign: "ZGF II",
    version: "v2",
    status: "Completed",
    signatories: [
      { id: "s1", name: "Rudo Sibanda", role: "Investor signatory", status: "Signed", signedAt: "12 May 2025" },
      { id: "s2", name: "GP Authorised", role: "Fund signatory", status: "Signed", signedAt: "13 May 2025" },
    ],
    sentDate: "08 May 2025",
    expiry: null,
    owner: "Tariro Moyo",
  },
  {
    id: "ag2",
    name: "Nyasha Side Letter",
    type: "Side Letter",
    investor: "Nyasha Pension Fund",
    campaign: "ZGF II",
    version: "v1",
    status: "Partially Signed",
    signatories: [
      { id: "s1", name: "Tendai Mawoyo", role: "Investor CIO", status: "Signed", signedAt: "18 May 2025" },
      { id: "s2", name: "Farai Kumbirai", role: "Investor Legal", status: "Pending", signedAt: null },
      { id: "s3", name: "GP Authorised", role: "Fund signatory", status: "Pending", signedAt: null },
    ],
    sentDate: "16 May 2025",
    expiry: "30 May 2025",
    owner: "Tawanda Chirwa",
  },
  {
    id: "ag3",
    name: "Granite Peak NDA",
    type: "NDA",
    investor: "Granite Peak Trustees",
    campaign: "ZGF II",
    version: "v1",
    status: "Completed",
    signatories: [
      { id: "s1", name: "Patience Gumbo", role: "Trustee Chair", status: "Signed", signedAt: "01 May 2025" },
      { id: "s2", name: "GP Authorised", role: "Fund signatory", status: "Signed", signedAt: "01 May 2025" },
    ],
    sentDate: "28 Apr 2025",
    expiry: null,
    owner: "Kudakwashe Mlambo",
  },
  {
    id: "ag4",
    name: "Stanbic Subscription (draft)",
    type: "Subscription",
    investor: "Stanbic Bank Zimbabwe",
    campaign: "ZGF II",
    version: "v1",
    status: "Draft",
    signatories: [],
    sentDate: null,
    expiry: null,
    owner: "Farai Ncube",
  },
  {
    id: "ag5",
    name: "NSSA Investment Management Agreement",
    type: "IMA",
    investor: "NSSA",
    campaign: "Institutional Mandates FY25",
    version: "v2",
    status: "Sent",
    signatories: [
      { id: "s1", name: "Sipho Ndlovu", role: "Investor", status: "Pending", signedAt: null },
      { id: "s2", name: "Grace Chirwa", role: "Manager", status: "Pending", signedAt: null },
    ],
    sentDate: "15 May 2025",
    expiry: "05 Jun 2025",
    owner: "Grace Chirwa",
  },
  {
    id: "ag6",
    name: "LPA Counterpart — voided after v3 upload",
    type: "LPA",
    investor: "Horizon Capital",
    campaign: "ZGF II",
    version: "v2",
    status: "Voided",
    signatories: [
      { id: "s1", name: "Laura Chen", role: "Investor", status: "Pending", signedAt: null },
    ],
    sentDate: "05 May 2025",
    expiry: "20 May 2025",
    owner: "Chipo Dube",
  },
]

export function sigStatusClass(s: SigStatus) {
  switch (s) {
    case "Completed":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Sent":
    case "Partially Signed":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Expired":
    case "Voided":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
