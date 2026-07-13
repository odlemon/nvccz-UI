import type { PipelineFilter } from "./pipeline-mock-data"

export type BoardStageId =
  | "prospect"
  | "contacted"
  | "qualified"
  | "management"
  | "dd"
  | "ic"

export type BoardStage = {
  id: BoardStageId
  name: string
  color: string
}

export type BoardCard = {
  id: string
  name: string
  initials: string
  type: string
  fundType: PipelineFilter
  stageId: BoardStageId
  ticket: string
  expectedRaise: string
  owner: string
  ownerInitials: string
  stageAge: number
  lastContact: string
  nextAction: string
  dueDate: string
  notes: string
  notesUpdatedBy: string
  notesUpdatedAt: string
}

export type BoardAction = {
  id: string
  title: string
  date: string
  status: "Upcoming" | "Overdue" | "Done"
}

export type BoardActivity = {
  id: string
  text: string
  actor: string
  when: string
  kind: "stage" | "note" | "document"
}

export type BoardKpi = {
  id: string
  label: string
  value: string
  meta: string
  metaTone: "up" | "down" | "alert"
  icon: "funnel" | "coins" | "trend" | "clock" | "calendar"
  accent: string
}

export const BOARD_STAGES: BoardStage[] = [
  { id: "prospect", name: "Prospect", color: "#38bdf8" },
  { id: "contacted", name: "Contacted", color: "#2563eb" },
  { id: "qualified", name: "Qualified", color: "#8b5cf6" },
  { id: "management", name: "Management Meeting", color: "#7c3aed" },
  { id: "dd", name: "DD / Data Room", color: "#06b6d4" },
  { id: "ic", name: "IC Review", color: "#1e40af" },
]

export const BOARD_KPIS: BoardKpi[] = [
  {
    id: "opps",
    label: "Pipeline Opportunities",
    value: "24",
    meta: "12% vs last month",
    metaTone: "up",
    icon: "funnel",
    accent: "#6366f1",
  },
  {
    id: "expected",
    label: "Expected Raise",
    value: "US$96.3M",
    meta: "8% vs last month",
    metaTone: "up",
    icon: "coins",
    accent: "#16a34a",
  },
  {
    id: "weighted",
    label: "Weighted Value",
    value: "US$38.4M",
    meta: "6% vs last month",
    metaTone: "up",
    icon: "trend",
    accent: "#7c3aed",
  },
  {
    id: "overdue",
    label: "Overdue Actions",
    value: "7",
    meta: "View overdue tasks",
    metaTone: "alert",
    icon: "clock",
    accent: "#dc2626",
  },
  {
    id: "age",
    label: "Avg. Stage Age (days)",
    value: "32",
    meta: "5 vs last month",
    metaTone: "down",
    icon: "calendar",
    accent: "#2563eb",
  },
]

export const BOARD_CARDS: BoardCard[] = [
  // Prospect
  {
    id: "p1",
    name: "Chiedza Ventures",
    initials: "CV",
    type: "VC Fund",
    fundType: "vc",
    stageId: "prospect",
    ticket: "US$2.5M",
    expectedRaise: "US$2.5M",
    owner: "Tawanda Chirwa",
    ownerInitials: "TC",
    stageAge: 12,
    lastContact: "09 May 2025",
    nextAction: "Initial Call",
    dueDate: "30 May 2025",
    notes: "Early-stage VC interested in growth equity exposure. Prefers quarterly reporting cadence.",
    notesUpdatedBy: "Tawanda Chirwa",
    notesUpdatedAt: "09 May 2025",
  },
  {
    id: "p2",
    name: "Mutapa Infrastructure Fund",
    initials: "MI",
    type: "Infrastructure Fund",
    fundType: "pe",
    stageId: "prospect",
    ticket: "US$5.0M",
    expectedRaise: "US$5.0M",
    owner: "Tendai Ncube",
    ownerInitials: "TN",
    stageAge: 8,
    lastContact: "11 May 2025",
    nextAction: "Send teaser",
    dueDate: "28 May 2025",
    notes: "Infrastructure mandate with long hold periods. Exploring PE co-invest options.",
    notesUpdatedBy: "Tendai Ncube",
    notesUpdatedAt: "11 May 2025",
  },
  {
    id: "p3",
    name: "Savanna Angels Network",
    initials: "SA",
    type: "Angel Network",
    fundType: "vc",
    stageId: "prospect",
    ticket: "US$1.0M",
    expectedRaise: "US$1.2M",
    owner: "Rutendo Dube",
    ownerInitials: "RD",
    stageAge: 5,
    lastContact: "15 May 2025",
    nextAction: "Warm intro",
    dueDate: "02 Jun 2025",
    notes: "Syndicate of HNWI angels. Ticket may increase if lead investor joins.",
    notesUpdatedBy: "Rutendo Dube",
    notesUpdatedAt: "15 May 2025",
  },
  {
    id: "p4",
    name: "Midlands Pension Trust",
    initials: "MP",
    type: "Pension Fund",
    fundType: "pe",
    stageId: "prospect",
    ticket: "US$3.0M",
    expectedRaise: "US$3.5M",
    owner: "Farai Chikafu",
    ownerInitials: "FC",
    stageAge: 18,
    lastContact: "06 May 2025",
    nextAction: "CIO briefing",
    dueDate: "03 Jun 2025",
    notes: "New CIO reviewing alternatives allocation. Prefers local currency reporting.",
    notesUpdatedBy: "Farai Chikafu",
    notesUpdatedAt: "06 May 2025",
  },
  // Contacted
  {
    id: "c1",
    name: "ZIMNAT Life Assurance",
    initials: "ZL",
    type: "Insurer",
    fundType: "vc",
    stageId: "contacted",
    ticket: "US$1.5M",
    expectedRaise: "US$2.0M",
    owner: "Rutendo Dube",
    ownerInitials: "RD",
    stageAge: 21,
    lastContact: "10 May 2025",
    nextAction: "Intro call with CIO",
    dueDate: "30 May 2025",
    notes: "Insurance balance sheet seeking diversified PE exposure.",
    notesUpdatedBy: "Rutendo Dube",
    notesUpdatedAt: "10 May 2025",
  },
  {
    id: "c2",
    name: "Harare Capital Partners",
    initials: "HC",
    type: "Family Office",
    fundType: "pe",
    stageId: "contacted",
    ticket: "US$4.0M",
    expectedRaise: "US$4.0M",
    owner: "Chipo Dube",
    ownerInitials: "CD",
    stageAge: 14,
    lastContact: "12 May 2025",
    nextAction: "Share track record",
    dueDate: "27 May 2025",
    notes: "Family office with multi-asset mandate. Interested in co-invest rights.",
    notesUpdatedBy: "Chipo Dube",
    notesUpdatedAt: "12 May 2025",
  },
  {
    id: "c3",
    name: "Delta Asset Management",
    initials: "DA",
    type: "Asset Manager",
    fundType: "am",
    stageId: "contacted",
    ticket: "US$6.0M",
    expectedRaise: "US$7.0M",
    owner: "Tendai Ncube",
    ownerInitials: "TN",
    stageAge: 9,
    lastContact: "17 May 2025",
    nextAction: "Fee proposal",
    dueDate: "01 Jun 2025",
    notes: "Discretionary mandate. Fee sensitivity high — prepare tiered structure.",
    notesUpdatedBy: "Tendai Ncube",
    notesUpdatedAt: "17 May 2025",
  },
  {
    id: "c4",
    name: "Copperbelt Growth Fund",
    initials: "CG",
    type: "PE Fund",
    fundType: "pe",
    stageId: "contacted",
    ticket: "US$2.0M",
    expectedRaise: "US$2.5M",
    owner: "Tawanda Chirwa",
    ownerInitials: "TC",
    stageAge: 11,
    lastContact: "14 May 2025",
    nextAction: "Follow-up email",
    dueDate: "26 May 2025",
    notes: "Regional PE fund exploring LP-to-LP secondaries.",
    notesUpdatedBy: "Tawanda Chirwa",
    notesUpdatedAt: "14 May 2025",
  },
  // Qualified
  {
    id: "q1",
    name: "Nyasha Pension Fund",
    initials: "NP",
    type: "Pension Fund",
    fundType: "pe",
    stageId: "qualified",
    ticket: "US$7.5M",
    expectedRaise: "US$96.3M",
    owner: "Tawanda Chiwara",
    ownerInitials: "TC",
    stageAge: 16,
    lastContact: "19 May 2025",
    nextAction: "Schedule call",
    dueDate: "23 May 2025",
    notes:
      "Strong long-term mandate with allocations to private markets. Interested in infrastructure and energy transitions. Prefers co-investments and governance alignment.",
    notesUpdatedBy: "Tawanda Chiwara",
    notesUpdatedAt: "19 May 2025, 16:42",
  },
  {
    id: "q2",
    name: "Mhofu Holdings",
    initials: "MH",
    type: "Corporation",
    fundType: "pe",
    stageId: "qualified",
    ticket: "US$3.0M",
    expectedRaise: "US$3.0M",
    owner: "Tariro Moyo",
    ownerInitials: "TM",
    stageAge: 16,
    lastContact: "12 May 2025",
    nextAction: "Intro Call",
    dueDate: "26 May 2025",
    notes: "Corporate treasury exploring alternatives. Decision window Q3.",
    notesUpdatedBy: "Tariro Moyo",
    notesUpdatedAt: "12 May 2025",
  },
  {
    id: "q3",
    name: "Baobab Family Office",
    initials: "BF",
    type: "Family Office",
    fundType: "pe",
    stageId: "qualified",
    ticket: "US$6.0M",
    expectedRaise: "US$6.5M",
    owner: "Chipo Dube",
    ownerInitials: "CD",
    stageAge: 22,
    lastContact: "16 May 2025",
    nextAction: "Investment Memo",
    dueDate: "23 May 2025",
    notes: "Family office completed initial screening. Memo requested before IC.",
    notesUpdatedBy: "Chipo Dube",
    notesUpdatedAt: "16 May 2025",
  },
  {
    id: "q4",
    name: "National Social Security Authority",
    initials: "NS",
    type: "Pension Fund",
    fundType: "am",
    stageId: "qualified",
    ticket: "US$15.0M",
    expectedRaise: "US$15.0M",
    owner: "Tendai Ncube",
    ownerInitials: "TN",
    stageAge: 35,
    lastContact: "14 May 2025",
    nextAction: "Submit RFP response",
    dueDate: "29 May 2025",
    notes: "Formal RFP process. Compliance pack must accompany proposal.",
    notesUpdatedBy: "Tendai Ncube",
    notesUpdatedAt: "14 May 2025",
  },
  // Management Meeting
  {
    id: "m1",
    name: "Old Mutual Investment Group",
    initials: "OM",
    type: "Asset Manager",
    fundType: "pe",
    stageId: "management",
    ticket: "US$8.0M",
    expectedRaise: "US$8.0M",
    owner: "Farai Chikafu",
    ownerInitials: "FC",
    stageAge: 19,
    lastContact: "19 May 2025",
    nextAction: "Management meet",
    dueDate: "28 May 2025",
    notes: "Soft circle US$8.0M. Management presentation scheduled.",
    notesUpdatedBy: "Farai Chikafu",
    notesUpdatedAt: "19 May 2025",
  },
  {
    id: "m2",
    name: "African Development Bank",
    initials: "AD",
    type: "DFI",
    fundType: "pe",
    stageId: "management",
    ticket: "US$10.0M",
    expectedRaise: "US$12.0M",
    owner: "Tariro Moyo",
    ownerInitials: "TM",
    stageAge: 24,
    lastContact: "15 May 2025",
    nextAction: "ESG deep-dive",
    dueDate: "02 Jun 2025",
    notes: "DFI process requires enhanced ESG diligence and gender lens reporting.",
    notesUpdatedBy: "Tariro Moyo",
    notesUpdatedAt: "15 May 2025",
  },
  {
    id: "m3",
    name: "Sanlam Private Wealth",
    initials: "SP",
    type: "Family Office",
    fundType: "vc",
    stageId: "management",
    ticket: "US$2.0M",
    expectedRaise: "US$2.5M",
    owner: "Farai Chikafu",
    ownerInitials: "FC",
    stageAge: 15,
    lastContact: "13 May 2025",
    nextAction: "Partner briefing",
    dueDate: "31 May 2025",
    notes: "Wealth desk interested in VC sleeve within multi-strategy fund.",
    notesUpdatedBy: "Farai Chikafu",
    notesUpdatedAt: "13 May 2025",
  },
  {
    id: "m4",
    name: "Victoria Falls Endowment",
    initials: "VF",
    type: "Endowment",
    fundType: "am",
    stageId: "management",
    ticket: "US$4.5M",
    expectedRaise: "US$5.0M",
    owner: "Kuda Mlambo",
    ownerInitials: "KM",
    stageAge: 10,
    lastContact: "18 May 2025",
    nextAction: "Board presentation",
    dueDate: "04 Jun 2025",
    notes: "Endowment board meets quarterly. Presentation slot reserved for June.",
    notesUpdatedBy: "Kuda Mlambo",
    notesUpdatedAt: "18 May 2025",
  },
  // DD / Data Room
  {
    id: "d1",
    name: "Nyaradzo Pension Fund",
    initials: "NY",
    type: "Pension Fund",
    fundType: "pe",
    stageId: "dd",
    ticket: "US$8.0M",
    expectedRaise: "US$8.0M",
    owner: "Tawanda Chirwa",
    ownerInitials: "TC",
    stageAge: 31,
    lastContact: "19 May 2025",
    nextAction: "DD Q&A",
    dueDate: "21 May 2025",
    notes: "Full data room access granted. Q&A tracker open with 14 outstanding items.",
    notesUpdatedBy: "Tawanda Chirwa",
    notesUpdatedAt: "19 May 2025",
  },
  {
    id: "d2",
    name: "Hivos Impact Investors",
    initials: "HI",
    type: "Impact Fund",
    fundType: "vc",
    stageId: "dd",
    ticket: "US$1.2M",
    expectedRaise: "US$1.5M",
    owner: "Rutendo Dube",
    ownerInitials: "RD",
    stageAge: 20,
    lastContact: "16 May 2025",
    nextAction: "Share ESG DD pack",
    dueDate: "25 May 2025",
    notes: "Impact metrics and IRIS+ alignment required for IC pack.",
    notesUpdatedBy: "Rutendo Dube",
    notesUpdatedAt: "16 May 2025",
  },
  {
    id: "d3",
    name: "CBZ Asset Management",
    initials: "CB",
    type: "Asset Manager",
    fundType: "am",
    stageId: "dd",
    ticket: "US$3.5M",
    expectedRaise: "US$4.0M",
    owner: "Tendai Ncube",
    ownerInitials: "TN",
    stageAge: 17,
    lastContact: "17 May 2025",
    nextAction: "Legal review",
    dueDate: "29 May 2025",
    notes: "Legal reviewing LPA and side letter drafts.",
    notesUpdatedBy: "Tendai Ncube",
    notesUpdatedAt: "17 May 2025",
  },
  {
    id: "d4",
    name: "First Mutual Wealth",
    initials: "FM",
    type: "Asset Manager",
    fundType: "am",
    stageId: "dd",
    ticket: "US$5.5M",
    expectedRaise: "US$6.0M",
    owner: "Farai Chikafu",
    ownerInitials: "FC",
    stageAge: 13,
    lastContact: "18 May 2025",
    nextAction: "Ops DD call",
    dueDate: "27 May 2025",
    notes: "Operations diligence focused on admin and valuation policy.",
    notesUpdatedBy: "Farai Chikafu",
    notesUpdatedAt: "18 May 2025",
  },
  // IC Review
  {
    id: "i1",
    name: "Granite Peak Trustees",
    initials: "GP",
    type: "Asset Manager",
    fundType: "am",
    stageId: "ic",
    ticket: "US$5.0M",
    expectedRaise: "US$5.0M",
    owner: "Kuda Mlambo",
    ownerInitials: "KM",
    stageAge: 9,
    lastContact: "14 May 2025",
    nextAction: "IC Presentation",
    dueDate: "27 May 2025",
    notes: "IC pack circulated. Presentation scheduled for late May.",
    notesUpdatedBy: "Kuda Mlambo",
    notesUpdatedAt: "14 May 2025",
  },
  {
    id: "i2",
    name: "Horizon Capital",
    initials: "HZ",
    type: "Private Equity",
    fundType: "pe",
    stageId: "ic",
    ticket: "US$4.0M",
    expectedRaise: "US$4.0M",
    owner: "Rumbidzai Chikore",
    ownerInitials: "RC",
    stageAge: 6,
    lastContact: "13 May 2025",
    nextAction: "Commitment Docs",
    dueDate: "29 May 2025",
    notes: "Verbal commitment received. Docs pending IC formal approval.",
    notesUpdatedBy: "Rumbidzai Chikore",
    notesUpdatedAt: "13 May 2025",
  },
  {
    id: "i3",
    name: "Stanbic Pension Fund",
    initials: "ST",
    type: "Pension Fund",
    fundType: "pe",
    stageId: "ic",
    ticket: "US$6.5M",
    expectedRaise: "US$7.0M",
    owner: "Tariro Moyo",
    ownerInitials: "TM",
    stageAge: 11,
    lastContact: "15 May 2025",
    nextAction: "IC Q&A pack",
    dueDate: "01 Jun 2025",
    notes: "Committee requested additional scenario analysis in base/downside cases.",
    notesUpdatedBy: "Tariro Moyo",
    notesUpdatedAt: "15 May 2025",
  },
  {
    id: "i4",
    name: "EcoBank Wealth",
    initials: "EW",
    type: "Bank Wealth",
    fundType: "am",
    stageId: "ic",
    ticket: "US$3.0M",
    expectedRaise: "US$3.5M",
    owner: "Chipo Dube",
    ownerInitials: "CD",
    stageAge: 7,
    lastContact: "16 May 2025",
    nextAction: "Final IC vote",
    dueDate: "03 Jun 2025",
    notes: "Wealth committee meets first week of June for final vote.",
    notesUpdatedBy: "Chipo Dube",
    notesUpdatedAt: "16 May 2025",
  },
]

export const BOARD_ACTIONS_BY_CARD: Record<string, BoardAction[]> = {
  q1: [
    { id: "a1", title: "Schedule follow-up call", date: "23 May 2025", status: "Upcoming" },
    { id: "a2", title: "Share updated track record", date: "27 May 2025", status: "Upcoming" },
  ],
}

export const BOARD_ACTIVITY_BY_CARD: Record<string, BoardActivity[]> = {
  q1: [
    { id: "1", text: "Stage changed to Qualified", actor: "Tawanda Chiwara", when: "19 May 2025", kind: "stage" },
    { id: "2", text: "Note added", actor: "Tawanda Chiwara", when: "19 May 2025", kind: "note" },
    { id: "3", text: "Document added: Fund Overview.pdf", actor: "Tawanda Chiwara", when: "16 May 2025", kind: "document" },
  ],
}

export function boardActionsFor(cardId: string): BoardAction[] {
  return (
    BOARD_ACTIONS_BY_CARD[cardId] ?? [
      { id: "d1", title: "Follow up with owner", date: "28 May 2025", status: "Upcoming" },
    ]
  )
}

export function boardActivityFor(cardId: string): BoardActivity[] {
  return (
    BOARD_ACTIVITY_BY_CARD[cardId] ?? [
      { id: "1", text: "Opportunity created", actor: "System", when: "01 May 2025", kind: "stage" },
    ]
  )
}

export function filterBoardCards(filter: PipelineFilter): BoardCard[] {
  if (filter === "all") return BOARD_CARDS
  return BOARD_CARDS.filter((c) => c.fundType === filter)
}
