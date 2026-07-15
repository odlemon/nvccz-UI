export type ContactInfluence = "Decision Maker" | "Influencer" | "Gatekeeper" | "Analyst"

export type InvestorContact = {
  id: string
  name: string
  initials: string
  avatarBg: string
  role: string
  department: string
  organisationId: string
  organisationName: string
  email: string
  phone: string
  influence: ContactInfluence
  consent: boolean
  lastInteraction: string
  nextAction: string
  owner: string
  campaigns: string[]
}

export const INVESTOR_CONTACTS: InvestorContact[] = [
  {
    id: "c1",
    name: "Tendai Mawoyo",
    initials: "TM",
    avatarBg: "#7c3aed",
    role: "Chief Investment Officer",
    department: "Investments",
    organisationId: "io-1",
    organisationName: "Nyasha Pension Fund",
    email: "tendai.mawoyo@nyasha.zw",
    phone: "+263 77 100 2201",
    influence: "Decision Maker",
    consent: true,
    lastInteraction: "19 May 2025",
    nextAction: "Send clause 8.2 extract",
    owner: "Tawanda Chirwa",
    campaigns: ["ZGF II"],
  },
  {
    id: "c2",
    name: "Rudo Sibanda",
    initials: "RS",
    avatarBg: "#2563eb",
    role: "Head of Alternatives",
    department: "Investments",
    organisationId: "io-2",
    organisationName: "NMBZ Holdings Limited",
    email: "r.sibanda@nmbz.co.zw",
    phone: "+263 77 200 1102",
    influence: "Decision Maker",
    consent: true,
    lastInteraction: "20 May 2025",
    nextAction: "Confirm wire instructions",
    owner: "Tariro Moyo",
    campaigns: ["ZGF II"],
  },
  {
    id: "c3",
    name: "James Chikwanha",
    initials: "JC",
    avatarBg: "#16a34a",
    role: "Portfolio Manager",
    department: "Life Assets",
    organisationId: "io-3",
    organisationName: "Old Mutual Life Assurance",
    email: "j.chikwanha@oldmutual.co.zw",
    phone: "+263 77 300 3303",
    influence: "Influencer",
    consent: true,
    lastInteraction: "16 May 2025",
    nextAction: "Share portal credentials",
    owner: "Tariro Moyo",
    campaigns: ["ZGF II"],
  },
  {
    id: "c4",
    name: "Patience Gumbo",
    initials: "PG",
    avatarBg: "#0f766e",
    role: "Trustee Chair",
    department: "Board",
    organisationId: "io-4",
    organisationName: "Granite Peak Trustees",
    email: "p.gumbo@granitepeak.co.zw",
    phone: "+263 77 400 4404",
    influence: "Decision Maker",
    consent: true,
    lastInteraction: "18 May 2025",
    nextAction: "Book LPA walkthrough",
    owner: "Kudakwashe Mlambo",
    campaigns: ["ZGF II"],
  },
  {
    id: "c5",
    name: "Laura Chen",
    initials: "LC",
    avatarBg: "#2563eb",
    role: "Principal",
    department: "Investments",
    organisationId: "io-5",
    organisationName: "Horizon Capital",
    email: "laura@horizoncap.mu",
    phone: "+230 5 801 2200",
    influence: "Decision Maker",
    consent: false,
    lastInteraction: "14 May 2025",
    nextAction: "Obtain email consent",
    owner: "Chipo Dube",
    campaigns: ["ZGF II"],
  },
  {
    id: "c6",
    name: "Kwame Asante",
    initials: "KA",
    avatarBg: "#111827",
    role: "Director, Equity Investments",
    department: "Investments",
    organisationId: "io-6",
    organisationName: "Afreximbank",
    email: "k.asante@afreximbank.com",
    phone: "+20 2 2456 1516",
    influence: "Influencer",
    consent: true,
    lastInteraction: "15 May 2025",
    nextAction: "Confirm IC attendees",
    owner: "Tariro Moyo",
    campaigns: ["ZGF II"],
  },
  {
    id: "c7",
    name: "Sipho Ndlovu",
    initials: "SN",
    avatarBg: "#0e7490",
    role: "Acting Director Investments",
    department: "Investments",
    organisationId: "io-7",
    organisationName: "National Social Security Authority",
    email: "s.ndlovu@nssa.org.zw",
    phone: "+263 24 2708 0800",
    influence: "Decision Maker",
    consent: true,
    lastInteraction: "17 May 2025",
    nextAction: "Custody kick-off agenda",
    owner: "Grace Chirwa",
    campaigns: ["Institutional Mandates FY25"],
  },
  {
    id: "c8",
    name: "Natalie Mpofu",
    initials: "NM",
    avatarBg: "#1d4ed8",
    role: "Head of Corporate Banking",
    department: "Corporate",
    organisationId: "io-8",
    organisationName: "Stanbic Bank Zimbabwe",
    email: "natalie.mpofu@stanbic.co.zw",
    phone: "+263 24 2759 2000",
    influence: "Gatekeeper",
    consent: true,
    lastInteraction: "19 May 2025",
    nextAction: "Escalate fee memo",
    owner: "Farai Ncube",
    campaigns: ["ZGF II"],
  },
  {
    id: "c9",
    name: "Blessing Nyoni",
    initials: "BN",
    avatarBg: "#9333ea",
    role: "Investment Analyst",
    department: "Research",
    organisationId: "io-9",
    organisationName: "First Mutual Holdings",
    email: "b.nyoni@firstmutual.co.zw",
    phone: "+263 24 2886 4000",
    influence: "Analyst",
    consent: true,
    lastInteraction: "12 May 2025",
    nextAction: "Send track record pack",
    owner: "Tendai Banda",
    campaigns: ["Institutional Mandates FY25"],
  },
  {
    id: "c10",
    name: "Tatenda Chirume",
    initials: "TC",
    avatarBg: "#ea580c",
    role: "Managing Partner",
    department: "Leadership",
    organisationId: "io-10",
    organisationName: "Chiedza Ventures",
    email: "tatenda@chiedza.ventures",
    phone: "+263 77 500 5505",
    influence: "Decision Maker",
    consent: true,
    lastInteraction: "11 May 2025",
    nextAction: "Confirm capital call contact",
    owner: "Rumbidzai Chikore",
    campaigns: ["ZGF II"],
  },
  {
    id: "c11",
    name: "Owen Mutasa",
    initials: "OM",
    avatarBg: "#64748b",
    role: "CFO",
    department: "Finance",
    organisationId: "io-12",
    organisationName: "Mhufu Holdings",
    email: "owen@mhufu.co.zw",
    phone: "+263 77 600 6606",
    influence: "Influencer",
    consent: false,
    lastInteraction: "08 May 2025",
    nextAction: "Send NDA for signature",
    owner: "Nkululeko Manjengwa",
    campaigns: ["ZGF II"],
  },
  {
    id: "c12",
    name: "Farai Kumbirai",
    initials: "FK",
    avatarBg: "#db2777",
    role: "Legal Counsel",
    department: "Legal",
    organisationId: "io-1",
    organisationName: "Nyasha Pension Fund",
    email: "f.kumbirai@nyasha.zw",
    phone: "+263 77 100 2208",
    influence: "Gatekeeper",
    consent: true,
    lastInteraction: "18 May 2025",
    nextAction: "Review side letter draft",
    owner: "Tawanda Chirwa",
    campaigns: ["ZGF II"],
  },
]

export const CONTACT_ORGS = Array.from(
  new Set(INVESTOR_CONTACTS.map((c) => c.organisationName)),
).sort()

export const CONTACT_OWNERS = Array.from(new Set(INVESTOR_CONTACTS.map((c) => c.owner))).sort()

export function influenceChipClass(influence: ContactInfluence): string {
  switch (influence) {
    case "Decision Maker":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Influencer":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Gatekeeper":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
