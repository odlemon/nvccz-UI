export type PipelineFilter = "all" | "vc" | "pe" | "am"

export type PipelineKpi = {
  id: string
  label: string
  value: string
  meta: string
  pct: number
  icon: "target" | "users" | "shield" | "handshake" | "coins" | "pie"
  accent: string
  bar: string
}

export type PipelineStage = {
  name: string
  count: number
  amount: string
  amountNum: number
  pct: number
  color: string
}

export type OpportunityRow = {
  id: string
  investor: string
  initials: string
  type: string
  fundType: PipelineFilter
  stage: string
  stageTone: "blue" | "navy" | "sky" | "green" | "vivid" | "purple"
  ticket: string
  probability: number
  owner: string
  ownerInitials: string
  nextStep: string
  nextDate: string
  lastContact: string
}

const ALL_KPIS: PipelineKpi[] = [
  { id: "target", label: "Target Raise", value: "US$60.0M", meta: "100% of target", pct: 100, icon: "target", accent: "#7c3aed", bar: "#8b5cf6" },
  { id: "soft", label: "Soft Circles", value: "US$38.0M", meta: "63% of target", pct: 63, icon: "users", accent: "#2563eb", bar: "#3b82f6" },
  { id: "hard", label: "Hard Circles", value: "US$32.0M", meta: "53% of target", pct: 53, icon: "shield", accent: "#0ea5e9", bar: "#38bdf8" },
  { id: "committed", label: "Committed", value: "US$25.0M", meta: "42% of target", pct: 42, icon: "handshake", accent: "#16a34a", bar: "#22c55e" },
  { id: "funded", label: "Funded", value: "US$18.5M", meta: "31% of target", pct: 31, icon: "coins", accent: "#65a30d", bar: "#84cc16" },
  { id: "coverage", label: "Pipeline Coverage", value: "2.2x", meta: "vs target", pct: 88, icon: "pie", accent: "#7c3aed", bar: "#a78bfa" },
]

const VC_KPIS: PipelineKpi[] = [
  { id: "target", label: "Target Raise", value: "US$25.0M", meta: "100% of target", pct: 100, icon: "target", accent: "#7c3aed", bar: "#8b5cf6" },
  { id: "soft", label: "Soft Circles", value: "US$14.5M", meta: "58% of target", pct: 58, icon: "users", accent: "#2563eb", bar: "#3b82f6" },
  { id: "hard", label: "Hard Circles", value: "US$11.0M", meta: "44% of target", pct: 44, icon: "shield", accent: "#0ea5e9", bar: "#38bdf8" },
  { id: "committed", label: "Committed", value: "US$8.0M", meta: "32% of target", pct: 32, icon: "handshake", accent: "#16a34a", bar: "#22c55e" },
  { id: "funded", label: "Funded", value: "US$5.5M", meta: "22% of target", pct: 22, icon: "coins", accent: "#65a30d", bar: "#84cc16" },
  { id: "coverage", label: "Pipeline Coverage", value: "1.9x", meta: "vs target", pct: 76, icon: "pie", accent: "#7c3aed", bar: "#a78bfa" },
]

const PE_KPIS: PipelineKpi[] = [
  { id: "target", label: "Target Raise", value: "US$60.0M", meta: "100% of target", pct: 100, icon: "target", accent: "#7c3aed", bar: "#8b5cf6" },
  { id: "soft", label: "Soft Circles", value: "US$38.0M", meta: "63% of target", pct: 63, icon: "users", accent: "#2563eb", bar: "#3b82f6" },
  { id: "hard", label: "Hard Circles", value: "US$32.0M", meta: "53% of target", pct: 53, icon: "shield", accent: "#0ea5e9", bar: "#38bdf8" },
  { id: "committed", label: "Committed", value: "US$25.0M", meta: "42% of target", pct: 42, icon: "handshake", accent: "#16a34a", bar: "#22c55e" },
  { id: "funded", label: "Funded", value: "US$18.5M", meta: "31% of target", pct: 31, icon: "coins", accent: "#65a30d", bar: "#84cc16" },
  { id: "coverage", label: "Pipeline Coverage", value: "2.2x", meta: "vs target", pct: 88, icon: "pie", accent: "#7c3aed", bar: "#a78bfa" },
]

const AM_KPIS: PipelineKpi[] = [
  { id: "target", label: "Target Raise", value: "US$120.0M", meta: "100% of AUM target", pct: 100, icon: "target", accent: "#7c3aed", bar: "#8b5cf6" },
  { id: "soft", label: "Soft Circles", value: "US$72.0M", meta: "60% of target", pct: 60, icon: "users", accent: "#2563eb", bar: "#3b82f6" },
  { id: "hard", label: "Hard Circles", value: "US$55.0M", meta: "46% of target", pct: 46, icon: "shield", accent: "#0ea5e9", bar: "#38bdf8" },
  { id: "committed", label: "Awarded", value: "US$40.0M", meta: "33% of target", pct: 33, icon: "handshake", accent: "#16a34a", bar: "#22c55e" },
  { id: "funded", label: "Activated AUM", value: "US$28.0M", meta: "23% of target", pct: 23, icon: "coins", accent: "#65a30d", bar: "#84cc16" },
  { id: "coverage", label: "Pipeline Coverage", value: "2.5x", meta: "vs target", pct: 92, icon: "pie", accent: "#7c3aed", bar: "#a78bfa" },
]

export const KPIS_BY_FILTER: Record<PipelineFilter, PipelineKpi[]> = {
  all: ALL_KPIS,
  vc: VC_KPIS,
  pe: PE_KPIS,
  am: AM_KPIS,
}

const ALL_STAGES: PipelineStage[] = [
  { name: "Prospect", count: 82, amount: "US$12.8M", amountNum: 12.8, pct: 100, color: "#7c3aed" },
  { name: "Qualified", count: 49, amount: "US$9.4M", amountNum: 9.4, pct: 60, color: "#8b5cf6" },
  { name: "Management Meeting", count: 27, amount: "US$7.1M", amountNum: 7.1, pct: 33, color: "#3b82f6" },
  { name: "DD / Data Room", count: 18, amount: "US$5.6M", amountNum: 5.6, pct: 22, color: "#38bdf8" },
  { name: "IC Review", count: 11, amount: "US$4.2M", amountNum: 4.2, pct: 13, color: "#14b8a6" },
  { name: "Commitment", count: 8, amount: "US$2.8M", amountNum: 2.8, pct: 10, color: "#22c55e" },
  { name: "Closed", count: 6, amount: "US$1.6M", amountNum: 1.6, pct: 7, color: "#86efac" },
]

const VC_STAGES: PipelineStage[] = [
  { name: "Prospect", count: 34, amount: "US$5.2M", amountNum: 5.2, pct: 100, color: "#7c3aed" },
  { name: "Qualified", count: 21, amount: "US$3.8M", amountNum: 3.8, pct: 62, color: "#8b5cf6" },
  { name: "Management Meeting", count: 12, amount: "US$2.9M", amountNum: 2.9, pct: 35, color: "#3b82f6" },
  { name: "DD / Data Room", count: 8, amount: "US$2.1M", amountNum: 2.1, pct: 24, color: "#38bdf8" },
  { name: "IC Review", count: 5, amount: "US$1.4M", amountNum: 1.4, pct: 15, color: "#14b8a6" },
  { name: "Commitment", count: 3, amount: "US$0.9M", amountNum: 0.9, pct: 9, color: "#22c55e" },
  { name: "Closed", count: 2, amount: "US$0.5M", amountNum: 0.5, pct: 6, color: "#86efac" },
]

const PE_STAGES: PipelineStage[] = ALL_STAGES

const AM_STAGES: PipelineStage[] = [
  { name: "Target Client", count: 40, amount: "US$48.0M", amountNum: 48, pct: 100, color: "#7c3aed" },
  { name: "Qualified", count: 28, amount: "US$36.0M", amountNum: 36, pct: 70, color: "#8b5cf6" },
  { name: "RFI / RFP", count: 16, amount: "US$28.0M", amountNum: 28, pct: 40, color: "#3b82f6" },
  { name: "Proposal", count: 11, amount: "US$22.0M", amountNum: 22, pct: 28, color: "#38bdf8" },
  { name: "Due Diligence", count: 7, amount: "US$16.0M", amountNum: 16, pct: 18, color: "#14b8a6" },
  { name: "Awarded", count: 4, amount: "US$10.0M", amountNum: 10, pct: 10, color: "#22c55e" },
  { name: "Activated", count: 2, amount: "US$6.0M", amountNum: 6, pct: 5, color: "#86efac" },
]

export const STAGES_BY_FILTER: Record<PipelineFilter, PipelineStage[]> = {
  all: ALL_STAGES,
  vc: VC_STAGES,
  pe: PE_STAGES,
  am: AM_STAGES,
}

export const TOTAL_PIPELINE_BY_FILTER: Record<PipelineFilter, string> = {
  all: "US$43.5M",
  vc: "US$16.8M",
  pe: "US$43.5M",
  am: "US$166.0M",
}

export const CAPITAL_BY_FILTER: Record<
  PipelineFilter,
  { month: string; committed: number; funded: number; target: number }[]
> = {
  all: [
    { month: "Nov '24", committed: 2, funded: 0.8, target: 60 },
    { month: "Dec '24", committed: 5.5, funded: 2.5, target: 60 },
    { month: "Jan '25", committed: 10, funded: 5, target: 60 },
    { month: "Feb '25", committed: 14.5, funded: 8.5, target: 60 },
    { month: "Mar '25", committed: 19, funded: 12.5, target: 60 },
    { month: "Apr '25", committed: 22.5, funded: 15.5, target: 60 },
    { month: "May '25", committed: 25, funded: 18.5, target: 60 },
  ],
  vc: [
    { month: "Nov '24", committed: 1.2, funded: 0.4, target: 25 },
    { month: "Dec '24", committed: 2.5, funded: 1.0, target: 25 },
    { month: "Jan '25", committed: 3.8, funded: 1.8, target: 25 },
    { month: "Feb '25", committed: 5.0, funded: 2.8, target: 25 },
    { month: "Mar '25", committed: 6.2, funded: 3.8, target: 25 },
    { month: "Apr '25", committed: 7.1, funded: 4.6, target: 25 },
    { month: "May '25", committed: 8.0, funded: 5.5, target: 25 },
  ],
  pe: [
    { month: "Nov '24", committed: 2, funded: 0.8, target: 60 },
    { month: "Dec '24", committed: 5.5, funded: 2.5, target: 60 },
    { month: "Jan '25", committed: 10, funded: 5, target: 60 },
    { month: "Feb '25", committed: 14.5, funded: 8.5, target: 60 },
    { month: "Mar '25", committed: 19, funded: 12.5, target: 60 },
    { month: "Apr '25", committed: 22.5, funded: 15.5, target: 60 },
    { month: "May '25", committed: 25, funded: 18.5, target: 60 },
  ],
  am: [
    { month: "Nov '24", committed: 8, funded: 3, target: 120 },
    { month: "Dec '24", committed: 14, funded: 6, target: 120 },
    { month: "Jan '25", committed: 20, funded: 10, target: 120 },
    { month: "Feb '25", committed: 26, funded: 14, target: 120 },
    { month: "Mar '25", committed: 32, funded: 19, target: 120 },
    { month: "Apr '25", committed: 36, funded: 24, target: 120 },
    { month: "May '25", committed: 40, funded: 28, target: 120 },
  ],
}

export const TOP_OPPORTUNITIES: OpportunityRow[] = [
  {
    id: "1",
    investor: "Nyaradzo Pension Fund",
    initials: "NP",
    type: "Pension Fund",
    fundType: "pe",
    stage: "DD / Data Room",
    stageTone: "blue",
    ticket: "US$8.0M",
    probability: 75,
    owner: "Tawanda Chirwa",
    ownerInitials: "TC",
    nextStep: "DD Q&A",
    nextDate: "21 May 2025",
    lastContact: "19 May 2025",
  },
  {
    id: "2",
    investor: "Baobab Family Office",
    initials: "BF",
    type: "Family Office",
    fundType: "pe",
    stage: "Management Meeting",
    stageTone: "navy",
    ticket: "US$6.0M",
    probability: 60,
    owner: "Chipo Dube",
    ownerInitials: "CD",
    nextStep: "Investment Memo",
    nextDate: "23 May 2025",
    lastContact: "16 May 2025",
  },
  {
    id: "3",
    investor: "Granite Peak Trustees",
    initials: "GP",
    type: "Asset Manager",
    fundType: "am",
    stage: "IC Review",
    stageTone: "sky",
    ticket: "US$5.0M",
    probability: 50,
    owner: "Kuda Mlambo",
    ownerInitials: "KM",
    nextStep: "IC Presentation",
    nextDate: "27 May 2025",
    lastContact: "14 May 2025",
  },
  {
    id: "4",
    investor: "Horizon Capital",
    initials: "HC",
    type: "Private Equity",
    fundType: "pe",
    stage: "Commitment",
    stageTone: "green",
    ticket: "US$4.0M",
    probability: 85,
    owner: "Rumbidzai Chikore",
    ownerInitials: "RC",
    nextStep: "Commitment Docs",
    nextDate: "29 May 2025",
    lastContact: "13 May 2025",
  },
  {
    id: "5",
    investor: "Mhofu Holdings",
    initials: "MH",
    type: "Corporation",
    fundType: "pe",
    stage: "Qualified",
    stageTone: "vivid",
    ticket: "US$3.0M",
    probability: 40,
    owner: "Tariro Moyo",
    ownerInitials: "TM",
    nextStep: "Intro Call",
    nextDate: "26 May 2025",
    lastContact: "12 May 2025",
  },
  {
    id: "6",
    investor: "Chiedza Ventures",
    initials: "CV",
    type: "VC Fund",
    fundType: "vc",
    stage: "Prospect",
    stageTone: "purple",
    ticket: "US$2.5M",
    probability: 25,
    owner: "Tawanda Chirwa",
    ownerInitials: "TC",
    nextStep: "Initial Call",
    nextDate: "30 May 2025",
    lastContact: "09 May 2025",
  },
]

export type UpcomingItem = {
  id: string
  title: string
  subtitle: string
  date: string
  time: string
  tone: "purple" | "green" | "indigo" | "blue" | "amber" | "sky"
  kind: "meeting" | "task" | "people" | "travel" | "call" | "prep"
  location?: string
  owner?: string
  notes?: string
  status?: string
}

const ALL_UPCOMING: UpcomingItem[] = [
  {
    id: "1",
    title: "Meeting: Nyaradzo Pension Fund",
    subtitle: "Harare, Zimbabwe",
    date: "Today",
    time: "10:00",
    tone: "purple",
    kind: "meeting",
    location: "Nyaradzo HQ, Harare",
    owner: "Tariro Moyo",
    notes: "Discuss soft-circle confirmation and DD timeline for Zambezi Growth Fund.",
    status: "Confirmed",
  },
  {
    id: "2",
    title: "Data Room Follow-up",
    subtitle: "Granite Peak Trustees",
    date: "Tomorrow",
    time: "09:30",
    tone: "green",
    kind: "task",
    owner: "Farai Chikafu",
    notes: "Confirm watermarked pack access and chase outstanding Q&A answers.",
    status: "Open",
  },
  {
    id: "3",
    title: "Management Meeting",
    subtitle: "Baobab Family Office",
    date: "22 May",
    time: "14:00",
    tone: "indigo",
    kind: "people",
    location: "Virtual · Teams",
    owner: "Tendai Ncube",
    notes: "Present track record and answer fee / side-letter questions.",
    status: "Scheduled",
  },
  {
    id: "4",
    title: "Travel: Cape Town",
    subtitle: "Horizon Capital Roadshow",
    date: "26 May",
    time: "All day",
    tone: "blue",
    kind: "travel",
    location: "Cape Town, South Africa",
    owner: "Tariro Moyo",
    notes: "LP roadshow meetings with Horizon Capital introductions.",
    status: "Booked",
  },
  {
    id: "5",
    title: "IC Pack Preparation",
    subtitle: "Zambezi Growth Fund I",
    date: "28 May",
    time: "12:00",
    tone: "amber",
    kind: "prep",
    owner: "Rutendo Dube",
    notes: "Assemble IC memo, pipeline summary and exception list for first close.",
    status: "In progress",
  },
  {
    id: "6",
    title: "Call: African Development Bank",
    subtitle: "Soft circle confirmation",
    date: "29 May",
    time: "16:00",
    tone: "sky",
    kind: "call",
    owner: "Tariro Moyo",
    notes: "Confirm indicative ticket and next governance step.",
    status: "Scheduled",
  },
  {
    id: "7",
    title: "Send subscription draft",
    subtitle: "Old Mutual Investment Group",
    date: "30 May",
    time: "11:00",
    tone: "green",
    kind: "task",
    owner: "Legal desk",
    notes: "Issue draft subscription agreement for legal review.",
    status: "Open",
  },
  {
    id: "8",
    title: "KYC document chase",
    subtitle: "Sanlam Private Wealth",
    date: "2 Jun",
    time: "09:00",
    tone: "amber",
    kind: "task",
    owner: "Compliance",
    notes: "Request missing beneficial ownership pack.",
    status: "Open",
  },
]

export const UPCOMING_BY_FILTER: Record<PipelineFilter, UpcomingItem[]> = {
  all: ALL_UPCOMING,
  vc: [
    {
      id: "v1",
      title: "Meeting: Sanlam Private Wealth",
      subtitle: "Cape Town, South Africa",
      date: "Today",
      time: "11:00",
      tone: "purple",
      kind: "meeting",
      owner: "Farai Chikafu",
      notes: "VC sleeve introduction and ticket sizing.",
      status: "Confirmed",
    },
    {
      id: "v2",
      title: "Data Room Follow-up",
      subtitle: "Hivos Impact Investors",
      date: "Tomorrow",
      time: "10:00",
      tone: "green",
      kind: "task",
      owner: "Rutendo Dube",
      notes: "Share ESG DD pack and confirm access.",
      status: "Open",
    },
    {
      id: "v3",
      title: "Management Meeting",
      subtitle: "ZIMNAT Life Assurance",
      date: "23 May",
      time: "15:00",
      tone: "indigo",
      kind: "people",
      owner: "Rutendo Dube",
      notes: "Intro with CIO office on seed allocation.",
      status: "Scheduled",
    },
    {
      id: "v4",
      title: "IC Pack Preparation",
      subtitle: "VC first close",
      date: "28 May",
      time: "12:00",
      tone: "amber",
      kind: "prep",
      owner: "Farai Chikafu",
      notes: "Prepare VC IC summary for early closers.",
      status: "In progress",
    },
    {
      id: "v5",
      title: "Travel: Johannesburg",
      subtitle: "Angel syndicate roadshow",
      date: "1 Jun",
      time: "All day",
      tone: "blue",
      kind: "travel",
      owner: "Rutendo Dube",
      notes: "Meet corporate venture partners.",
      status: "Booked",
    },
  ],
  pe: ALL_UPCOMING.filter((i) => ["1", "2", "3", "4", "5", "6"].includes(i.id)),
  am: [
    {
      id: "a1",
      title: "RFP workshop: NSSA",
      subtitle: "Harare, Zimbabwe",
      date: "Today",
      time: "09:00",
      tone: "purple",
      kind: "meeting",
      owner: "Tendai Ncube",
      notes: "Mandate proposal dry-run before formal submission.",
      status: "Confirmed",
    },
    {
      id: "a2",
      title: "Data Room Follow-up",
      subtitle: "CBZ Asset Management",
      date: "Tomorrow",
      time: "09:30",
      tone: "green",
      kind: "task",
      owner: "Tendai Ncube",
      notes: "Upload revised fee schedule and guidelines.",
      status: "Open",
    },
    {
      id: "a3",
      title: "Management Meeting",
      subtitle: "CBZ Asset Management",
      date: "22 May",
      time: "11:00",
      tone: "indigo",
      kind: "people",
      owner: "Tendai Ncube",
      notes: "Internal IC prep for awarded mandate onboarding.",
      status: "Scheduled",
    },
    {
      id: "a4",
      title: "IC Pack Preparation",
      subtitle: "NSSA mandate",
      date: "28 May",
      time: "12:00",
      tone: "amber",
      kind: "prep",
      owner: "Legal desk",
      notes: "Assemble RFP response annexes.",
      status: "In progress",
    },
    {
      id: "a5",
      title: "Travel: Bulawayo",
      subtitle: "Regional trustee meetings",
      date: "3 Jun",
      time: "All day",
      tone: "blue",
      kind: "travel",
      owner: "Tendai Ncube",
      notes: "On-site meetings with regional pension trustees.",
      status: "Booked",
    },
  ],
}

export type ActivityItem = {
  id: string
  parts: { text: string; bold?: boolean }[]
  actor: string
  when: string
  tone: "blue" | "green" | "purple" | "sky" | "amber"
  detail?: string
}

export const ACTIVITY_BY_FILTER: Record<PipelineFilter, ActivityItem[]> = {
  all: [
    {
      id: "1",
      parts: [
        { text: "Nyaradzo Pension Fund", bold: true },
        { text: " moved to " },
        { text: "DD / Data Room", bold: true },
      ],
      actor: "Tawanda Chirwa",
      when: "19 May 2025, 16:42",
      tone: "purple",
      detail: "Stage gate checks passed. Confidentiality agreement on file.",
    },
    {
      id: "2",
      parts: [
        { text: "Document added: " },
        { text: "NZGF I - DD Request List", bold: true },
      ],
      actor: "Chipo Dube",
      when: "19 May 2025, 11:18",
      tone: "green",
      detail: "Uploaded to data room folder. Notification sent to DD team.",
    },
    {
      id: "3",
      parts: [
        { text: "Meeting completed: " },
        { text: "Baobab Family Office", bold: true },
      ],
      actor: "Chipo Dube",
      when: "16 May 2025, 14:03",
      tone: "blue",
      detail: "Outcome: proceed to investment memo. Next action logged.",
    },
    {
      id: "4",
      parts: [
        { text: "Granite Peak Trustees", bold: true },
        { text: " moved to " },
        { text: "IC Review", bold: true },
      ],
      actor: "Kuda Mlambo",
      when: "14 May 2025, 09:27",
      tone: "purple",
      detail: "IC pack circulated to committee members.",
    },
    {
      id: "5",
      parts: [
        { text: "Commitment received from " },
        { text: "Horizon Capital", bold: true },
      ],
      actor: "Rumbidzai Chikore",
      when: "13 May 2025, 15:36",
      tone: "green",
      detail: "Soft commitment US$4.0M. Docs in progress.",
    },
  ],
  vc: [
    {
      id: "1",
      parts: [
        { text: "Chiedza Ventures", bold: true },
        { text: " moved to " },
        { text: "Prospect", bold: true },
      ],
      actor: "Tawanda Chirwa",
      when: "12 May 2025, 10:15",
      tone: "purple",
    },
    {
      id: "2",
      parts: [
        { text: "Document added: " },
        { text: "VC Teaser Pack", bold: true },
      ],
      actor: "Chipo Dube",
      when: "11 May 2025, 14:22",
      tone: "green",
    },
    {
      id: "3",
      parts: [
        { text: "Meeting completed: " },
        { text: "Chiedza Ventures", bold: true },
      ],
      actor: "Tawanda Chirwa",
      when: "09 May 2025, 16:05",
      tone: "blue",
    },
  ],
  pe: [
    {
      id: "1",
      parts: [
        { text: "Nyaradzo Pension Fund", bold: true },
        { text: " moved to " },
        { text: "DD / Data Room", bold: true },
      ],
      actor: "Tawanda Chirwa",
      when: "19 May 2025, 16:42",
      tone: "purple",
    },
    {
      id: "2",
      parts: [
        { text: "Meeting completed: " },
        { text: "Baobab Family Office", bold: true },
      ],
      actor: "Chipo Dube",
      when: "16 May 2025, 14:03",
      tone: "blue",
    },
    {
      id: "3",
      parts: [
        { text: "Commitment received from " },
        { text: "Horizon Capital", bold: true },
      ],
      actor: "Rumbidzai Chikore",
      when: "13 May 2025, 15:36",
      tone: "green",
    },
    {
      id: "4",
      parts: [
        { text: "Mhofu Holdings", bold: true },
        { text: " moved to " },
        { text: "Qualified", bold: true },
      ],
      actor: "Tariro Moyo",
      when: "12 May 2025, 11:40",
      tone: "purple",
    },
  ],
  am: [
    {
      id: "1",
      parts: [
        { text: "Granite Peak Trustees", bold: true },
        { text: " moved to " },
        { text: "IC Review", bold: true },
      ],
      actor: "Kuda Mlambo",
      when: "14 May 2025, 09:27",
      tone: "purple",
    },
    {
      id: "2",
      parts: [
        { text: "Document added: " },
        { text: "IC Presentation Draft", bold: true },
      ],
      actor: "Kuda Mlambo",
      when: "13 May 2025, 17:12",
      tone: "green",
    },
    {
      id: "3",
      parts: [
        { text: "Meeting completed: " },
        { text: "Granite Peak Trustees", bold: true },
      ],
      actor: "Kuda Mlambo",
      when: "10 May 2025, 15:00",
      tone: "blue",
    },
  ],
}

