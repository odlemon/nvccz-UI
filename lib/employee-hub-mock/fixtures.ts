export const ehUser = {
  firstName: "Aisha",
  lastName: "Ubuntu",
  fullName: "Aisha Ubuntu",
  initials: "AU",
  title: "Investment Analyst",
  department: "Investments",
  location: "Harare, Zimbabwe",
  email: "aisha.ubuntu@matanho.com",
  avatarTone: "#0EA5B7",
}

export const ehHomeToday = [
  { time: "09:00", title: "Portfolio review", meta: "Boardroom A", kind: "meeting" as const },
  { time: "10:30", title: "Q3 strategy workshop", meta: "Teams", kind: "workshop" as const },
  { time: "13:00", title: "Focus time", meta: "Protected", kind: "focus" as const },
  { time: "14:30", title: "Team stand-up", meta: "Investments", kind: "standup" as const },
]

export const ehPriorities = [
  { id: "p1", title: "Review Q3 investment deck", done: true },
  { id: "p2", title: "Validate portfolio risk models", done: true },
  { id: "p3", title: "Prepare market commentary", done: false },
]

export const ehFeedCards = [
  {
    id: "n1",
    type: "News" as const,
    title: "Arcus and CBZ launch US$50m SME Growth Fund",
    image: "solar",
    href: "/employee-hub/news/n1",
  },
  {
    id: "nl1",
    type: "Newsletter" as const,
    title: "Arcus Weekly — Five ideas shaping the week",
    image: "abstract",
    href: "/employee-hub/newsletters/nl1",
  },
  {
    id: "f1",
    type: "Forum" as const,
    title: "Q3 strategy workshop prep",
    author: "Nyasha Moyo",
    href: "/employee-hub/forums/f1",
  },
]

export const ehNewsArticles = [
  {
    id: "n1",
    title: "Arcus and CBZ launch US$50m SME Growth Fund",
    category: "Company",
    author: "Communications",
    date: "16 Jul 2026",
    readMins: 4,
    summary: "A new growth facility will support high-potential SMEs across Zimbabwe with blended finance and advisory support.",
    body: [
      "Today Arcus announced a partnership with CBZ to launch a US$50 million SME Growth Fund aimed at scaling formal businesses with strong governance and export potential.",
      "The facility combines senior debt, mezzanine capital and hands-on operating support from the Arcus portfolio team.",
      "Employees can follow deal updates in the Investment Ops workspace and share questions in the Internal Forums.",
    ],
  },
  {
    id: "n2",
    title: "Q3 town hall: strategy, people and delivery",
    category: "Internal",
    author: "People Ops",
    date: "14 Jul 2026",
    readMins: 3,
    summary: "Leadership will walk through Q3 priorities, performance rituals and the new Employee Hub.",
    body: [
      "Join the Q3 town hall for a clear view of priorities across funds, people and operations.",
      "Bring questions on performance cycles, leave windows and the new Personal Home experience.",
    ],
  },
  {
    id: "n3",
    title: "Market pulse: ZSE open and FX desk notes",
    category: "Markets",
    author: "Research",
    date: "15 Jul 2026",
    readMins: 5,
    summary: "A concise briefing for analysts covering local equities, rates and peer activity.",
    body: ["Research published the weekly market pulse for investment teams.", "Use the Apps launcher to open Street Rates and Portfolio analytics."],
  },
]

export const ehNewsletters = [
  {
    id: "nl1",
    title: "Arcus Weekly — Five ideas shaping the week",
    issue: "Issue 28 · Jul 2026",
    status: "Published" as const,
    audience: "All employees",
    chapters: ["Opening note", "Five ideas", "People moves", "What to watch"],
    body: "This week we look at SME credit demand, portfolio governance rituals, and how Personal Home keeps focus time protected.",
  },
  {
    id: "nl2",
    title: "Investments Digest",
    issue: "Issue 12 · Jul 2026",
    status: "Draft" as const,
    audience: "Investments",
    chapters: ["Pipeline", "Risk", "LP notes"],
    body: "Pipeline momentum remains healthy. Risk models refresh this Friday.",
  },
]

export const ehForums = [
  {
    id: "f1",
    space: "Strategy",
    title: "Q3 strategy workshop prep",
    author: "Nyasha Moyo",
    replies: 18,
    views: 142,
    tags: ["Q3", "Workshop"],
    excerpt: "Please drop pre-reads and questions ahead of Wednesday's session.",
  },
  {
    id: "f2",
    space: "Investments",
    title: "Risk model validation checklist",
    author: "Tariro Ncube",
    replies: 9,
    views: 87,
    tags: ["Risk", "Models"],
    excerpt: "Looking for a reusable playbook before we lock Q3 assumptions.",
  },
  {
    id: "f3",
    space: "People",
    title: "Focus time etiquette — what works?",
    author: "Aisha Ubuntu",
    replies: 24,
    views: 210,
    tags: ["Culture", "Focus"],
    excerpt: "Sharing what our team does to protect afternoon deep work.",
  },
]

export const ehForumThread = {
  id: "f1",
  title: "Q3 strategy workshop prep",
  space: "Strategy",
  posts: [
    {
      id: "p1",
      author: "Nyasha Moyo",
      role: "Head of Strategy",
      time: "2h ago",
      body: "Please review the workshop agenda and attach any pre-reads. Accepted insights will be pinned for the room.",
      accepted: false,
    },
    {
      id: "p2",
      author: "Aisha Ubuntu",
      role: "Investment Analyst",
      time: "1h ago",
      body: "Suggest we add a 15-minute block on SME Growth Fund narrative and LP questions.",
      accepted: true,
    },
    {
      id: "p3",
      author: "Tariro Ncube",
      role: "Risk Analyst",
      time: "45m ago",
      body: "Attached the risk checklist PDF. Happy to walk through assumptions.",
      accepted: false,
    },
  ],
}

export const ehPeople = [
  { id: "u1", name: "Aisha Ubuntu", title: "Investment Analyst", dept: "Investments", status: "Available" as const, skills: ["Credit", "Modelling"] },
  { id: "u2", name: "Nyasha Moyo", title: "Head of Strategy", dept: "Strategy", status: "In a meeting" as const, skills: ["Strategy", "OKRs"] },
  { id: "u3", name: "Tariro Ncube", title: "Risk Analyst", dept: "Risk", status: "Focus" as const, skills: ["Risk", "Python"] },
  { id: "u4", name: "Chiedza Dube", title: "People Partner", dept: "People Ops", status: "Available" as const, skills: ["HR", "Learning"] },
  { id: "u5", name: "Farai Sibanda", title: "Controller", dept: "Finance", status: "Away" as const, skills: ["Accounting", "Payroll"] },
]

export const ehServices = [
  { id: "leave", title: "Request leave", desc: "Annual, sick and special leave", icon: "PalmTree" },
  { id: "payslip", title: "My payslips", desc: "Download recent payslips", icon: "Receipt" },
  { id: "expenses", title: "Submit expense", desc: "Claims and reimbursements", icon: "Wallet" },
  { id: "learning", title: "Learning", desc: "Courses and certifications", icon: "GraduationCap" },
  { id: "it", title: "IT service request", desc: "Access, devices, software", icon: "MonitorSmartphone" },
  { id: "hr", title: "Ask People Ops", desc: "Policies and support", icon: "HeartHandshake" },
]

export const ehApps = [
  { id: "performance", name: "Performance", path: "/performance", desc: "Goals, KPIs, reviews" },
  { id: "payroll", name: "Payroll", path: "/payroll", desc: "Employees and runs" },
  { id: "portfolio", name: "Portfolio", path: "/portfolio", desc: "Funds and companies" },
  { id: "investments", name: "Investments", path: "/investments-v2", desc: "Orders and ops" },
  { id: "fpa", name: "FP&A", path: "/forecasting-v2", desc: "Planning and models" },
  { id: "procurement", name: "Procurement", path: "/procurement", desc: "Vendors and POs" },
]

export const ehWorkProjects = [
  { id: "pr1", name: "Q3 Investment Deck", progress: 72, status: "On track", due: "24 Jul" },
  { id: "pr2", name: "SME Growth Fund narrative", progress: 41, status: "At risk", due: "30 Jul" },
  { id: "pr3", name: "Risk model refresh", progress: 88, status: "On track", due: "18 Jul" },
]

export const ehGoals = [
  { id: "g1", title: "Deliver Q3 portfolio commentary", progress: 74, confidence: "High" },
  { id: "g2", title: "Improve model turnaround", progress: 68, confidence: "Medium" },
  { id: "g3", title: "Mentor junior analyst", progress: 55, confidence: "High" },
]

export const ehCalendarWeek = [
  { day: "Mon", date: 14, items: [{ t: "09:00", title: "Desk review", kind: "meeting" as const }] },
  { day: "Tue", date: 15, items: [{ t: "11:00", title: "Credit committee", kind: "meeting" as const }] },
  {
    day: "Wed",
    date: 16,
    items: [
      { t: "09:00", title: "Portfolio review", kind: "meeting" as const },
      { t: "10:30", title: "Q3 workshop", kind: "workshop" as const },
      { t: "13:00", title: "Focus block", kind: "focus" as const },
    ],
  },
  { day: "Thu", date: 17, items: [{ t: "15:00", title: "1:1 with manager", kind: "meeting" as const }] },
  { day: "Fri", date: 18, items: [{ t: "10:00", title: "Model lock", kind: "meeting" as const }] },
]

export const ehCoverLooks = ["Editorial Mono", "Soft Chrome", "Warm Minimal", "Arcus Cyan", "Glass"]
export const ehCoverMoods = ["Deep Focus", "Main Character Energy", "Quiet Wins", "Fresh Start"]

export const ehNewsTabs = ["Top stories", "Company", "Markets", "Business", "Technology", "Africa", "For you"]

export const ehForumSpaces = [
  { id: "inv", name: "Investment Insights", count: 128 },
  { id: "cx", name: "Client Experience", count: 96 },
  { id: "people", name: "People & Culture", count: 144 },
  { id: "ops", name: "Operations", count: 112 },
  { id: "lead", name: "Ask Leadership", count: 62 },
]

export const ehServiceRequests = [
  { id: "SRV-2026-1047", service: "Annual leave", submitted: "15 Jul 2026", owner: "Chiedza Dube", status: "In progress" as const, next: "Manager approval" },
  { id: "SRV-2026-1032", service: "Laptop replacement", submitted: "12 Jul 2026", owner: "IT Support", status: "Pending" as const, next: "IT to assign device" },
  { id: "SRV-2026-0988", service: "Travel booking", submitted: "08 Jul 2026", owner: "Ops Desk", status: "Completed" as const, next: "Closed" },
]

export const ehRecentApps = [
  { name: "Performance", path: "/performance", last: "2h ago" },
  { name: "Timesheets", path: "/performance/timesheets", last: "Yesterday" },
  { name: "Portfolio", path: "/portfolio", last: "Mon" },
]

