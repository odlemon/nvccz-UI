export type CommType =
  | "Email"
  | "Call"
  | "Meeting"
  | "Presentation"
  | "Data Room Invite"
  | "DDQ"
  | "Follow-up"
  | "Internal Note"

export type CommSentiment = "Positive" | "Neutral" | "Cautious" | "Negative"

export type Communication = {
  id: string
  type: CommType
  subject: string
  summary: string
  investor: string
  contact: string
  campaign: string
  owner: string
  date: string
  outcome: string
  nextAction: string
  nextActionDate: string
  sentiment: CommSentiment
  confidential: boolean
}

export const COMMUNICATIONS: Communication[] = [
  {
    id: "cm1",
    type: "DDQ",
    subject: "Carried interest waterfall clarification",
    summary: "Investor requested confirmation of waterfall steps and catch-up mechanics.",
    investor: "Nyasha Pension Fund",
    contact: "Tendai Mawoyo",
    campaign: "ZGF II",
    owner: "Tawanda Chirwa",
    date: "19 May 2025, 15:02",
    outcome: "Awaiting IR response",
    nextAction: "Reply with schedule extract",
    nextActionDate: "21 May 2025",
    sentiment: "Neutral",
    confidential: false,
  },
  {
    id: "cm2",
    type: "Meeting",
    subject: "Stanbic commercial negotiation",
    summary: "Discussed fee discount request and side-letter reporting rights.",
    investor: "Stanbic Bank Zimbabwe",
    contact: "Natalie Mpofu",
    campaign: "ZGF II",
    owner: "Farai Ncube",
    date: "19 May 2025, 11:30",
    outcome: "Escalated for GP approval",
    nextAction: "Submit approval request",
    nextActionDate: "22 May 2025",
    sentiment: "Cautious",
    confidential: true,
  },
  {
    id: "cm3",
    type: "Email",
    subject: "Data-room materials shared — track record",
    summary: "Secure link sent for Track Record Workbook (watermarked, no download by default).",
    investor: "Granite Peak Trustees",
    contact: "Patience Gumbo",
    campaign: "ZGF II",
    owner: "Kudakwashe Mlambo",
    date: "18 May 2025, 16:45",
    outcome: "Link opened",
    nextAction: "Follow up on workbook Qs",
    nextActionDate: "23 May 2025",
    sentiment: "Positive",
    confidential: false,
  },
  {
    id: "cm4",
    type: "Call",
    subject: "NSSA custody transition kick-off",
    summary: "Aligned on custodian checklist, opening balances and reporting go-live.",
    investor: "NSSA",
    contact: "Sipho Ndlovu",
    campaign: "Institutional Mandates FY25",
    owner: "Grace Chirwa",
    date: "17 May 2025, 14:20",
    outcome: "Assets in transition",
    nextAction: "Confirm custody LOA",
    nextActionDate: "24 May 2025",
    sentiment: "Positive",
    confidential: false,
  },
  {
    id: "cm5",
    type: "Presentation",
    subject: "Afreximbank IC briefing prep",
    summary: "Agenda and teaser pack shared for 22 May IC session.",
    investor: "Afreximbank",
    contact: "Kwame Asante",
    campaign: "ZGF II",
    owner: "Tariro Moyo",
    date: "15 May 2025, 13:10",
    outcome: "Meeting booked",
    nextAction: "Finalise IC deck",
    nextActionDate: "21 May 2025",
    sentiment: "Positive",
    confidential: false,
  },
  {
    id: "cm6",
    type: "Data Room Invite",
    subject: "Invitation to ZGF II Core Data Room",
    summary: "MFA-enabled invite; confidentiality acknowledgement required before access.",
    investor: "Horizon Capital",
    contact: "Laura Chen",
    campaign: "ZGF II",
    owner: "Chipo Dube",
    date: "14 May 2025, 09:00",
    outcome: "Pending acknowledgement",
    nextAction: "Resend invite if no ack",
    nextActionDate: "21 May 2025",
    sentiment: "Neutral",
    confidential: false,
  },
  {
    id: "cm7",
    type: "Follow-up",
    subject: "First Mutual RFP deadline reminder",
    summary: "Internal note confirming submission checklist owners and document versions.",
    investor: "First Mutual Holdings",
    contact: "Blessing Nyoni",
    campaign: "Institutional Mandates FY25",
    owner: "Tendai Banda",
    date: "12 May 2025, 10:35",
    outcome: "On track",
    nextAction: "Upload fee schedule",
    nextActionDate: "28 May 2025",
    sentiment: "Neutral",
    confidential: true,
  },
  {
    id: "cm8",
    type: "Internal Note",
    subject: "Probability adjustment — Horizon Capital",
    summary: "Reduced confidence to 0.7 pending decision-maker confirmation. Internal only.",
    investor: "Horizon Capital",
    contact: "Laura Chen",
    campaign: "ZGF II",
    owner: "Chipo Dube",
    date: "11 May 2025, 17:20",
    outcome: "Logged",
    nextAction: "Reconfirm influence map",
    nextActionDate: "20 May 2025",
    sentiment: "Cautious",
    confidential: true,
  },
  {
    id: "cm9",
    type: "Email",
    subject: "NMBZ wire instructions confirmation",
    summary: "Requested bank details verification ahead of Closing #2 funding.",
    investor: "NMBZ Holdings Limited",
    contact: "Rudo Sibanda",
    campaign: "ZGF II",
    owner: "Tariro Moyo",
    date: "20 May 2025, 09:40",
    outcome: "Awaiting investor",
    nextAction: "Chase wire confirmation",
    nextActionDate: "21 May 2025",
    sentiment: "Neutral",
    confidential: false,
  },
  {
    id: "cm10",
    type: "Call",
    subject: "Old Mutual portal walkthrough",
    summary: "Guided LP through document centre and capital-call contacts.",
    investor: "Old Mutual Life Assurance",
    contact: "James Chikwanha",
    campaign: "ZGF II",
    owner: "Tariro Moyo",
    date: "16 May 2025, 11:00",
    outcome: "Portal activated",
    nextAction: "None",
    nextActionDate: "—",
    sentiment: "Positive",
    confidential: false,
  },
]

export const COMM_TYPES: CommType[] = [
  "Email",
  "Call",
  "Meeting",
  "Presentation",
  "Data Room Invite",
  "DDQ",
  "Follow-up",
  "Internal Note",
]

export function sentimentClass(s: CommSentiment): string {
  switch (s) {
    case "Positive":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Cautious":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Negative":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function commTypeClass(t: CommType): string {
  if (t === "Internal Note") return "bg-[#fef3c7] text-[#b45309]"
  if (t === "DDQ") return "bg-[#ede9fe] text-[#6d28d9]"
  if (t === "Meeting" || t === "Presentation") return "bg-[#dbeafe] text-[#1d4ed8]"
  if (t === "Call") return "bg-[#e0f2fe] text-[#0369a1]"
  return "bg-[#f1f5f9] text-[#475569]"
}
