export type MeetingStatus = "Scheduled" | "Completed" | "Cancelled"

export type FrMeeting = {
  id: string
  title: string
  investor: string
  campaign: string
  date: string
  time: string
  type: "Video" | "In person" | "Call"
  owner: string
  status: MeetingStatus
  attendees: string[]
  relatedOpportunity?: string
}

export type FrTaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_ON_INVESTOR"
  | "WAITING_ON_INTERNAL_TEAM"
  | "COMPLETED"
  | "CANCELLED"
  | "OVERDUE"

export type FrTask = {
  id: string
  title: string
  related: string
  campaign: string
  dueDate: string
  status: FrTaskStatus
  owner: string
  priority: "High" | "Medium" | "Low"
}

export const FR_MEETINGS: FrMeeting[] = [
  {
    id: "m1",
    title: "Afreximbank IC briefing",
    investor: "Afreximbank",
    campaign: "ZGF II",
    date: "22 May 2025",
    time: "10:00–11:00",
    type: "Video",
    owner: "Tariro Moyo",
    status: "Scheduled",
    attendees: ["Kwame Asante", "Tariro Moyo", "Farai Ncube"],
    relatedOpportunity: "Afreximbank · Engaged",
  },
  {
    id: "m2",
    title: "Granite Peak LPA walkthrough",
    investor: "Granite Peak Trustees",
    campaign: "ZGF II",
    date: "23 May 2025",
    time: "14:00–15:00",
    type: "Video",
    owner: "Kudakwashe Mlambo",
    status: "Scheduled",
    attendees: ["Patience Gumbo", "Tawanda Chirwa"],
    relatedOpportunity: "Granite Peak · Data Room",
  },
  {
    id: "m3",
    title: "NSSA custody transition",
    investor: "NSSA",
    campaign: "Institutional Mandates FY25",
    date: "24 May 2025",
    time: "09:30–10:30",
    type: "Call",
    owner: "Grace Chirwa",
    status: "Scheduled",
    attendees: ["Sipho Ndlovu", "Grace Chirwa", "Finance"],
  },
  {
    id: "m4",
    title: "Stanbic commercial negotiation",
    investor: "Stanbic Bank Zimbabwe",
    campaign: "ZGF II",
    date: "19 May 2025",
    time: "11:30–12:30",
    type: "In person",
    owner: "Farai Ncube",
    status: "Completed",
    attendees: ["Natalie Mpofu", "Farai Ncube"],
  },
  {
    id: "m5",
    title: "Nyasha DDQ sync",
    investor: "Nyasha Pension Fund",
    campaign: "ZGF II",
    date: "19 May 2025",
    time: "15:00–15:45",
    type: "Video",
    owner: "Tawanda Chirwa",
    status: "Completed",
    attendees: ["Tendai Mawoyo", "Tawanda Chirwa", "Tariro Moyo"],
  },
  {
    id: "m6",
    title: "First Mutual proposal dry-run",
    investor: "First Mutual Holdings",
    campaign: "Institutional Mandates FY25",
    date: "27 May 2025",
    time: "16:00–17:00",
    type: "Video",
    owner: "Tendai Banda",
    status: "Scheduled",
    attendees: ["Blessing Nyoni", "Tendai Banda", "Rudo Dube"],
  },
]

export const FR_TASKS: FrTask[] = [
  {
    id: "t1",
    title: "Upload Closing #2 pack for legal sign-off",
    related: "ZGF II · Closing",
    campaign: "ZGF II",
    dueDate: "21 May 2025",
    status: "OVERDUE",
    owner: "Tariro Moyo",
    priority: "High",
  },
  {
    id: "t2",
    title: "Respond to Nyasha waterfall Q&A",
    related: "Nyasha Pension Fund",
    campaign: "ZGF II",
    dueDate: "21 May 2025",
    status: "IN_PROGRESS",
    owner: "Tawanda Chirwa",
    priority: "High",
  },
  {
    id: "t3",
    title: "Route fee discount approval (>15bps)",
    related: "Stanbic Bank Zimbabwe",
    campaign: "ZGF II",
    dueDate: "22 May 2025",
    status: "WAITING_ON_INTERNAL_TEAM",
    owner: "Farai Ncube",
    priority: "High",
  },
  {
    id: "t4",
    title: "Issue data-room invite (Granite Peak)",
    related: "Granite Peak Trustees",
    campaign: "ZGF II",
    dueDate: "23 May 2025",
    status: "NOT_STARTED",
    owner: "Kudakwashe Mlambo",
    priority: "Medium",
  },
  {
    id: "t5",
    title: "Confirm custodian onboarding (NSSA)",
    related: "NSSA Mandate",
    campaign: "Institutional Mandates FY25",
    dueDate: "24 May 2025",
    status: "WAITING_ON_INVESTOR",
    owner: "Grace Chirwa",
    priority: "Medium",
  },
  {
    id: "t6",
    title: "Prepare monthly IR update deck",
    related: "All Campaigns",
    campaign: "All",
    dueDate: "26 May 2025",
    status: "IN_PROGRESS",
    owner: "Tariro Moyo",
    priority: "Low",
  },
  {
    id: "t7",
    title: "Complete First Mutual RFP checklist",
    related: "First Mutual Holdings",
    campaign: "Institutional Mandates FY25",
    dueDate: "28 May 2025",
    status: "NOT_STARTED",
    owner: "Tendai Banda",
    priority: "Medium",
  },
  {
    id: "t8",
    title: "Obtain Horizon Capital email consent",
    related: "Laura Chen",
    campaign: "ZGF II",
    dueDate: "20 May 2025",
    status: "OVERDUE",
    owner: "Chipo Dube",
    priority: "Low",
  },
]

export function meetingStatusClass(s: MeetingStatus): string {
  switch (s) {
    case "Scheduled":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Completed":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Cancelled":
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function frTaskStatusClass(status: FrTaskStatus): string {
  switch (status) {
    case "OVERDUE":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "IN_PROGRESS":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "WAITING_ON_INVESTOR":
    case "WAITING_ON_INTERNAL_TEAM":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "CANCELLED":
      return "bg-[#f1f5f9] text-[#64748b]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

export function frTaskStatusLabel(status: FrTaskStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

export function priorityClass(p: FrTask["priority"]): string {
  switch (p) {
    case "High":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "Medium":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#dcfce7] text-[#15803d]"
  }
}
