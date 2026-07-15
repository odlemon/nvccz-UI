export type DataRoomStatus = "Active" | "Expired" | "Draft" | "Revoked"

export type DataRoom = {
  id: string
  name: string
  campaign: string
  status: DataRoomStatus
  investorsInvited: number
  documents: number
  views7d: number
  downloads7d: number
  expiresOn: string
  owner: string
  watermark: boolean
  mfaRequired: boolean
  folders: { name: string; docs: number }[]
  recentActivity: { id: string; actor: string; action: string; doc: string; at: string }[]
  accessList: {
    id: string
    investor: string
    contact: string
    access: "View only" | "Download" | "Expired"
    lastAccess: string
  }[]
}

export const DATA_ROOMS: DataRoom[] = [
  {
    id: "dr-1",
    name: "ZGF II — Core Data Room",
    campaign: "ZGF II",
    status: "Active",
    investorsInvited: 14,
    documents: 86,
    views7d: 128,
    downloads7d: 22,
    expiresOn: "30 Nov 2025",
    owner: "Tariro Moyo",
    watermark: true,
    mfaRequired: true,
    folders: [
      { name: "Fund overview", docs: 8 },
      { name: "Strategy", docs: 12 },
      { name: "Track record", docs: 15 },
      { name: "Team", docs: 6 },
      { name: "Legal", docs: 18 },
      { name: "Financials", docs: 11 },
      { name: "ESG", docs: 7 },
      { name: "Subscription", docs: 9 },
    ],
    recentActivity: [
      {
        id: "a1",
        actor: "Nyasha Pension Fund",
        action: "Viewed",
        doc: "LPA v3 (marked-up)",
        at: "20 May 2025, 10:14",
      },
      {
        id: "a2",
        actor: "Granite Peak Trustees",
        action: "Downloaded",
        doc: "Track Record Workbook",
        at: "19 May 2025, 16:02",
      },
      {
        id: "a3",
        actor: "Stanbic Bank Zimbabwe",
        action: "Viewed",
        doc: "Fee Schedule Annex B",
        at: "19 May 2025, 11:40",
      },
      {
        id: "a4",
        actor: "Afreximbank",
        action: "Failed access",
        doc: "Legal Opinions folder",
        at: "18 May 2025, 09:22",
      },
    ],
    accessList: [
      {
        id: "x1",
        investor: "Nyasha Pension Fund",
        contact: "Tendai Mawoyo",
        access: "Download",
        lastAccess: "20 May 2025",
      },
      {
        id: "x2",
        investor: "Granite Peak Trustees",
        contact: "Patience Gumbo",
        access: "View only",
        lastAccess: "19 May 2025",
      },
      {
        id: "x3",
        investor: "Stanbic Bank Zimbabwe",
        contact: "Natalie Mpofu",
        access: "Download",
        lastAccess: "19 May 2025",
      },
      {
        id: "x4",
        investor: "Horizon Capital",
        contact: "Laura Chen",
        access: "Expired",
        lastAccess: "02 May 2025",
      },
    ],
  },
  {
    id: "dr-2",
    name: "ZGF II — Side Letter Room",
    campaign: "ZGF II",
    status: "Active",
    investorsInvited: 4,
    documents: 12,
    views7d: 31,
    downloads7d: 5,
    expiresOn: "21 May 2025",
    owner: "Tawanda Chirwa",
    watermark: true,
    mfaRequired: true,
    folders: [
      { name: "Side letters", docs: 6 },
      { name: "MFN register", docs: 2 },
      { name: "Approvals", docs: 4 },
    ],
    recentActivity: [
      {
        id: "a1",
        actor: "NMBZ Holdings",
        action: "Downloaded",
        doc: "Side Letter draft v2",
        at: "20 May 2025, 08:50",
      },
    ],
    accessList: [
      {
        id: "x1",
        investor: "NMBZ Holdings Limited",
        contact: "Rudo Sibanda",
        access: "Download",
        lastAccess: "20 May 2025",
      },
    ],
  },
  {
    id: "dr-3",
    name: "NSSA Mandate Diligence Room",
    campaign: "Institutional Mandates FY25",
    status: "Active",
    investorsInvited: 3,
    documents: 42,
    views7d: 54,
    downloads7d: 9,
    expiresOn: "31 Jul 2025",
    owner: "Grace Chirwa",
    watermark: true,
    mfaRequired: false,
    folders: [
      { name: "Proposal", docs: 5 },
      { name: "Guidelines", docs: 8 },
      { name: "Fees & SLA", docs: 6 },
      { name: "Track record", docs: 10 },
      { name: "Team", docs: 4 },
      { name: "Risk & compliance", docs: 9 },
    ],
    recentActivity: [
      {
        id: "a1",
        actor: "NSSA",
        action: "Viewed",
        doc: "Investment Guidelines draft",
        at: "17 May 2025, 14:05",
      },
    ],
    accessList: [
      {
        id: "x1",
        investor: "NSSA",
        contact: "Sipho Ndlovu",
        access: "View only",
        lastAccess: "17 May 2025",
      },
    ],
  },
  {
    id: "dr-4",
    name: "First Mutual RFP Pack",
    campaign: "Institutional Mandates FY25",
    status: "Draft",
    investorsInvited: 0,
    documents: 18,
    views7d: 0,
    downloads7d: 0,
    expiresOn: "—",
    owner: "Tendai Banda",
    watermark: true,
    mfaRequired: true,
    folders: [
      { name: "Mandatory responses", docs: 10 },
      { name: "Appendices", docs: 8 },
    ],
    recentActivity: [],
    accessList: [],
  },
  {
    id: "dr-5",
    name: "ZGF I — Archive Room",
    campaign: "ZGF I (Closed)",
    status: "Expired",
    investorsInvited: 22,
    documents: 120,
    views7d: 0,
    downloads7d: 0,
    expiresOn: "31 Dec 2024",
    owner: "Tariro Moyo",
    watermark: true,
    mfaRequired: true,
    folders: [
      { name: "Closing packs", docs: 40 },
      { name: "Historical reporting", docs: 80 },
    ],
    recentActivity: [],
    accessList: [],
  },
]

export function roomStatusClass(status: DataRoomStatus): string {
  switch (status) {
    case "Active":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Draft":
      return "bg-[#f1f5f9] text-[#64748b]"
    case "Expired":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Revoked":
      return "bg-[#fee2e2] text-[#dc2626]"
  }
}
