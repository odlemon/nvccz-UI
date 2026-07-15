export type ApprovalType =
  | "Fee discount"
  | "Side letter"
  | "Stage override"
  | "Campaign activation"

export type ApprovalPriority = "High" | "Med" | "Low"

export type ApprovalStatus = "Pending" | "Approved" | "Rejected"

export type ApprovalHistoryEntry = {
  id: string
  at: string
  actor: string
  action: string
  note?: string
}

export type ApprovalRequest = {
  id: string
  type: ApprovalType
  title: string
  summary: string
  campaign: string
  investor: string
  requestedBy: string
  requestedAt: string
  priority: ApprovalPriority
  status: ApprovalStatus
  amount?: string
  history: ApprovalHistoryEntry[]
}

export const FR_APPROVALS: ApprovalRequest[] = [
  {
    id: "ap1",
    type: "Fee discount",
    title: "Reduce management fee to 1.75%",
    summary: "NMBZ anchor re-up requests 25 bps discount on first close tranche.",
    campaign: "ZGF II",
    investor: "NMBZ Holdings Limited",
    requestedBy: "Tariro Moyo",
    requestedAt: "14 Jul 2026",
    priority: "High",
    status: "Pending",
    amount: "US$8.0M",
    history: [
      { id: "h1", at: "14 Jul 2026, 09:12", actor: "Tariro Moyo", action: "Submitted for approval", note: "Anchor investor — strategic relationship" },
      { id: "h2", at: "14 Jul 2026, 11:40", actor: "Farai Kumbirai", action: "Commented", note: "Within policy if offset by co-invest rights" },
    ],
  },
  {
    id: "ap2",
    type: "Side letter",
    title: "MFN clause — Nyasha Pension",
    summary: "Most-favoured-nation on fee and key person provisions for US$5M commitment.",
    campaign: "ZGF II",
    investor: "Nyasha Pension Fund",
    requestedBy: "Tawanda Chirwa",
    requestedAt: "12 Jul 2026",
    priority: "Med",
    status: "Pending",
    amount: "US$5.0M",
    history: [
      { id: "h1", at: "12 Jul 2026, 15:00", actor: "Tawanda Chirwa", action: "Submitted for approval" },
      { id: "h2", at: "13 Jul 2026, 08:30", actor: "Legal", action: "Draft side letter uploaded" },
    ],
  },
  {
    id: "ap3",
    type: "Stage override",
    title: "Move Granite Peak to Term Sheet",
    summary: "Override stage gate — DD substantially complete, IC preview scheduled.",
    campaign: "ZGF II",
    investor: "Granite Peak Trustees",
    requestedBy: "Kudakwashe Mlambo",
    requestedAt: "11 Jul 2026",
    priority: "Low",
    status: "Approved",
    amount: "US$4.0M",
    history: [
      { id: "h1", at: "11 Jul 2026, 10:00", actor: "Kudakwashe Mlambo", action: "Submitted for approval" },
      { id: "h2", at: "11 Jul 2026, 16:45", actor: "GP Partner", action: "Approved", note: "Conditional on final DD memo" },
    ],
  },
  {
    id: "ap4",
    type: "Campaign activation",
    title: "Activate ZGF II co-invest sleeve",
    summary: "Open parallel co-invest track for existing LPs — US$15M sub-target.",
    campaign: "ZGF II",
    investor: "—",
    requestedBy: "Tariro Moyo",
    requestedAt: "08 Jul 2026",
    priority: "High",
    status: "Approved",
    history: [
      { id: "h1", at: "08 Jul 2026, 09:00", actor: "Tariro Moyo", action: "Submitted for approval" },
      { id: "h2", at: "09 Jul 2026, 14:00", actor: "IC Chair", action: "Approved" },
      { id: "h3", at: "10 Jul 2026, 08:00", actor: "Ops", action: "Campaign activated in CRM" },
    ],
  },
  {
    id: "ap5",
    type: "Fee discount",
    title: "Placement agent rebate pass-through",
    summary: "Pass 50% of placement fee rebate to CBZ Insurance — outside standard grid.",
    campaign: "ZGF II",
    investor: "CBZ Insurance",
    requestedBy: "Farai Kumbirai",
    requestedAt: "05 Jul 2026",
    priority: "Med",
    status: "Rejected",
    amount: "US$2.5M",
    history: [
      { id: "h1", at: "05 Jul 2026, 11:00", actor: "Farai Kumbirai", action: "Submitted for approval" },
      { id: "h2", at: "06 Jul 2026, 17:30", actor: "CFO", action: "Rejected", note: "Use standard fee schedule only" },
    ],
  },
  {
    id: "ap6",
    type: "Side letter",
    title: "Reporting frequency — Zimnat AM",
    summary: "Quarterly instead of monthly portfolio reporting for US$3M ticket.",
    campaign: "ZGF II",
    investor: "Zimnat Asset Managers",
    requestedBy: "Patience Gumbo",
    requestedAt: "03 Jul 2026",
    priority: "Low",
    status: "Pending",
    amount: "US$3.0M",
    history: [
      { id: "h1", at: "03 Jul 2026, 13:20", actor: "Patience Gumbo", action: "Submitted for approval" },
    ],
  },
]

export function priorityClass(priority: ApprovalPriority) {
  switch (priority) {
    case "High":
      return "bg-[#fee2e2] text-[#b91c1c]"
    case "Med":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function statusClass(status: ApprovalStatus) {
  switch (status) {
    case "Approved":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Rejected":
      return "bg-[#fee2e2] text-[#b91c1c]"
    default:
      return "bg-[#fef3c7] text-[#b45309]"
  }
}

export function typeClass(type: ApprovalType) {
  switch (type) {
    case "Fee discount":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Side letter":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Stage override":
      return "bg-[#e0f2fe] text-[#0369a1]"
    default:
      return "bg-[#dcfce7] text-[#15803d]"
  }
}
