export type CampaignStatus = "live" | "planned"

export type CampaignSummary = {
  id: string
  name: string
  status: CampaignStatus
  icon: "rocket" | "mail" | "document" | "shield"
  iconBg: string
  iconColor: string
  startedLabel: string
  description: string
  sent: number
  opened: number
  openedPct: number
  replied: number
  repliedPct: number
  meetingsBooked: number
  materialsDownloaded: number
  progress: number
  progressColor: string
}

export type TimelineKind = "email" | "followup" | "meeting" | "download" | "reply"
export type TimelineTone = "purple" | "blue" | "green" | "orange"

export type TimelineItem = {
  id: string
  kind: TimelineKind
  tone: TimelineTone
  actor: string
  action: string
  target: string
  detail?: string
  campaignTag?: string
  date: string
  time: string
}

export type CampaignTemplate = {
  id: string
  name: string
  usedCount: number
}

export type RoadshowEvent = {
  id: string
  day: string
  month: string
  title: string
  location: string
  time: string
  meetings: number
}

export type DistributionList = {
  id: string
  name: string
  contacts: number
}

export type CampaignMaterial = {
  id: string
  name: string
  fileType: string
  version: string
  updated: string
  tone: "red" | "green"
}

export const CAMPAIGN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "communications", label: "Communications" },
  { id: "templates", label: "Templates" },
  { id: "lists", label: "Lists" },
  { id: "events", label: "Events" },
  { id: "materials", label: "Materials" },
] as const

export const SUMMARY_CAMPAIGNS: CampaignSummary[] = [
  {
    id: "c1",
    name: "Roadshow Launch",
    status: "live",
    icon: "rocket",
    iconBg: "#ede9fe",
    iconColor: "#6d28d9",
    startedLabel: "Started 10 May 2025",
    description: "Roadshow launch to key LPs",
    sent: 165,
    opened: 112,
    openedPct: 67,
    replied: 38,
    repliedPct: 23,
    meetingsBooked: 24,
    materialsDownloaded: 51,
    progress: 47,
    progressColor: "#7c3aed",
  },
  {
    id: "c2",
    name: "First Close Outreach",
    status: "live",
    icon: "mail",
    iconBg: "#dbeafe",
    iconColor: "#1d4ed8",
    startedLabel: "Started 14 May 2025",
    description: "Targeted outreach to anchor LPs for first close",
    sent: 242,
    opened: 158,
    openedPct: 65,
    replied: 54,
    repliedPct: 22,
    meetingsBooked: 29,
    materialsDownloaded: 76,
    progress: 63,
    progressColor: "#2563eb",
  },
  {
    id: "c3",
    name: "DD Follow-Up",
    status: "live",
    icon: "document",
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    startedLabel: "Started 18 May 2025",
    description: "Follow-up with investors in DD / data room stage",
    sent: 89,
    opened: 63,
    openedPct: 71,
    replied: 22,
    repliedPct: 25,
    meetingsBooked: 19,
    materialsDownloaded: 34,
    progress: 39,
    progressColor: "#16a34a",
  },
  {
    id: "c4",
    name: "Anchor LP Round",
    status: "planned",
    icon: "shield",
    iconBg: "#ede9fe",
    iconColor: "#6d28d9",
    startedLabel: "Starts 01 Jun 2025",
    description: "Dedicated anchor LP engagement for final close",
    sent: 0,
    opened: 0,
    openedPct: 0,
    replied: 0,
    repliedPct: 0,
    meetingsBooked: 0,
    materialsDownloaded: 0,
    progress: 0,
    progressColor: "#94a3b8",
  },
]

export const TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: "t1",
    kind: "email",
    tone: "purple",
    actor: "Tawanda Chirwa",
    action: "emailed",
    target: "Nyasha Pension Fund",
    detail: "Roadshow invitation and teaser deck",
    campaignTag: "Roadshow Launch",
    date: "Today",
    time: "10:42",
  },
  {
    id: "t2",
    kind: "followup",
    tone: "blue",
    actor: "Chipo Dube",
    action: "followed up with",
    target: "Granite Peak Trustees",
    detail: "Re: Due diligence request",
    campaignTag: "DD Follow-Up",
    date: "Today",
    time: "09:30",
  },
  {
    id: "t3",
    kind: "meeting",
    tone: "green",
    actor: "Tariro Moyo",
    action: "scheduled Management Presentation with",
    target: "Baobab Family Office",
    date: "19 May 2025",
    time: "16:05",
  },
  {
    id: "t4",
    kind: "email",
    tone: "purple",
    actor: "Tawanda Chirwa",
    action: "emailed",
    target: "Chirecha Ventures",
    detail: "Follow-up: PPM and DDQ",
    date: "19 May 2025",
    time: "14:22",
  },
  {
    id: "t5",
    kind: "download",
    tone: "orange",
    actor: "Nyasha Pension Fund",
    action: "downloaded",
    target: "Pitch Deck",
    detail: "by Memory Ndlovu",
    campaignTag: "Roadshow Launch",
    date: "19 May 2025",
    time: "11:18",
  },
  {
    id: "t6",
    kind: "reply",
    tone: "green",
    actor: "Chipo Dube",
    action: "received reply from",
    target: "Horizon Capital",
    detail: "Re: Roadshow in Johannesburg",
    campaignTag: "Roadshow Launch",
    date: "18 May 2025",
    time: "15:43",
  },
  {
    id: "t7",
    kind: "meeting",
    tone: "green",
    actor: "Chipo Dube",
    action: "scheduled DD call with",
    target: "Granite Peak Trustees",
    date: "18 May 2025",
    time: "10:07",
  },
  {
    id: "t8",
    kind: "email",
    tone: "purple",
    actor: "Tariro Moyo",
    action: "emailed",
    target: "Kuziva Asset Management",
    detail: "Investment mandate and strategy",
    campaignTag: "Anchor LP Round",
    date: "17 May 2025",
    time: "13:51",
  },
]

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  { id: "tp1", name: "Roadshow Invitation Email", usedCount: 92 },
  { id: "tp2", name: "First Close Commitment Letter", usedCount: 48 },
  { id: "tp3", name: "DD Follow-Up Reminder", usedCount: 36 },
  { id: "tp4", name: "LP Update Newsletter", usedCount: 24 },
  { id: "tp5", name: "Meeting Confirmation", usedCount: 18 },
  { id: "tp6", name: "Data Room Access Invite", usedCount: 15 },
]

export const ROADSHOW_EVENTS: RoadshowEvent[] = [
  {
    id: "e1",
    day: "27",
    month: "MAY",
    title: "Harare Roadshow",
    location: "Harare, Zimbabwe",
    time: "09:00 – 17:00",
    meetings: 8,
  },
  {
    id: "e2",
    day: "29",
    month: "MAY",
    title: "Johannesburg Roadshow",
    location: "Sandton, South Africa",
    time: "10:00 – 16:00",
    meetings: 6,
  },
  {
    id: "e3",
    day: "03",
    month: "JUN",
    title: "Cape Town LP Breakfast",
    location: "Cape Town, South Africa",
    time: "08:00 – 11:00",
    meetings: 4,
  },
]

export const DISTRIBUTION_LISTS: DistributionList[] = [
  { id: "l1", name: "Zimbabwe Pension Funds", contacts: 32 },
  { id: "l2", name: "Southern Africa Family Offices", contacts: 18 },
  { id: "l3", name: "DFI & Development Partners", contacts: 12 },
  { id: "l4", name: "Insurance & Endowment LPs", contacts: 21 },
  { id: "l5", name: "Anchor LP Prospects", contacts: 8 },
]

export const CAMPAIGN_MATERIALS: CampaignMaterial[] = [
  {
    id: "m1",
    name: "Teaser Deck",
    fileType: "PDF",
    version: "v2.2",
    updated: "18 May 2025",
    tone: "red",
  },
  {
    id: "m2",
    name: "PPM Summary",
    fileType: "PDF",
    version: "v1.4",
    updated: "15 May 2025",
    tone: "red",
  },
  {
    id: "m3",
    name: "Track Record Pack",
    fileType: "PDF",
    version: "v3.0",
    updated: "12 May 2025",
    tone: "green",
  },
]
