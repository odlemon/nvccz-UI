export type ReviewStatus = "Pending" | "Submitted" | "Calibrated" | "In Progress" | "Completed"

export type ReviewEmployee = {
  id: string
  name: string
  role: string
  department: string
  initials: string
  color: string
  src: string
  status: ReviewStatus
  dueDate: string
  dueRelative: string
  dueUrgent: boolean
  reviewPeriod: string
  competencies: { label: string; score: number }[]
  kpiSummary: { label: string; achievement: number }[]
  overallKpiScore: number
  goals: { achieved: number; partial: number; notAchieved: number; total: number }
  managerFeedback: { text: string; by: string; role: string; at: string; src: string }
  selfAssessment: { text: string; by: string; role: string; at: string; src: string }
  peerFeedback: { name: string; text: string; src: string; at: string }[]
  recommendedRating: number
  calibrationStatus: "Calibrated" | "Not Calibrated"
}

export const reviewCycles = ["FY2026 Mid-Year Review", "FY2026 Annual Review", "FY2025 Annual Review"]
export const reviewTeams = ["All Teams", "Finance", "Operations", "IT", "HR", "Investment Analysis", "Customer Success"]

export const reviewMetrics = [
  {
    id: "pending",
    label: "Pending Reviews",
    value: "32",
    pct: "28%",
    trend: "vs last cycle 45 (↓ 13)",
    trendPositive: true,
    color: "#F59E0B",
    bg: "#FEF3C7",
    spark: [48, 45, 42, 40, 36, 32],
  },
  {
    id: "submitted",
    label: "Submitted",
    value: "41",
    pct: "36%",
    trend: "vs last cycle 38 (↑ 3)",
    trendPositive: true,
    color: "#8B5CF6",
    bg: "#F3E8FF",
    spark: [30, 32, 35, 36, 38, 41],
  },
  {
    id: "calibrated",
    label: "Calibrated",
    value: "19",
    pct: "16%",
    trend: "vs last cycle 14 (↑ 5)",
    trendPositive: true,
    color: "#3B82F6",
    bg: "#DBEAFE",
    spark: [10, 12, 13, 14, 16, 19],
  },
  {
    id: "completed",
    label: "Completed",
    value: "22",
    pct: "20%",
    trend: "vs last cycle 17 (↑ 5)",
    trendPositive: true,
    color: "#10B981",
    bg: "#D1FAE5",
    spark: [12, 14, 15, 17, 19, 22],
  },
]

export const ratingOptions = ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Unsatisfactory"]

const FARAI = "https://randomuser.me/api/portraits/men/52.jpg"
const BLESSING = "https://randomuser.me/api/portraits/women/44.jpg"
const NATASHA = "https://randomuser.me/api/portraits/women/68.jpg"
const TINASHE = "https://randomuser.me/api/portraits/men/32.jpg"
const YEUKAI = "https://randomuser.me/api/portraits/women/65.jpg"
const TENDAI = "https://randomuser.me/api/portraits/men/75.jpg"
const KUDZANAI = "https://randomuser.me/api/portraits/women/33.jpg"
const REGFATSON = "https://randomuser.me/api/portraits/men/11.jpg"
const RUMBIDZAI = "https://randomuser.me/api/portraits/women/21.jpg"

export const reviewEmployees: ReviewEmployee[] = [
  {
    id: "emp-001",
    name: "Blessing Moyo",
    role: "Financial Analyst",
    department: "Finance Department",
    initials: "BM",
    color: "#7C3AED",
    src: BLESSING,
    status: "In Progress",
    dueDate: "22 Jul 2026",
    dueRelative: "5 days left",
    dueUrgent: true,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Analytical Thinking", score: 4.2 },
      { label: "Financial Acumen", score: 4.5 },
      { label: "Attention to Detail", score: 4.0 },
      { label: "Communication", score: 4.1 },
      { label: "Team Collaboration & Initiative", score: 4.4 },
    ],
    kpiSummary: [
      { label: "Revenue Growth", achievement: 92 },
      { label: "Cost Optimization", achievement: 85 },
      { label: "Process Accuracy", achievement: 78 },
      { label: "Client Satisfaction", achievement: 88 },
    ],
    overallKpiScore: 84,
    goals: { achieved: 4, partial: 1, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Blessing has demonstrated strong analytical skills and a deep understanding of financial modeling. She consistently delivers high-quality work and proactively identifies opportunities for improvement. Focus on continuing to strengthen presentation skills and building deeper relationships with cross-functional teams.",
      by: "Farai Muchengeti",
      role: "Direct Manager",
      at: "09 Jul 2026, 04:15 PM",
      src: FARAI,
    },
    selfAssessment: {
      text: "I am proud of the progress made on my KPIs and contributing to key financial initiatives. I have taken ownership of challenges and improved my efficiency. I will continue strengthening my presentation skills and building deeper relationships with cross-functional teams.",
      by: "Blessing Moyo",
      role: "Employee",
      at: "09 Jul 2026, 04:11 PM",
      src: BLESSING,
    },
    peerFeedback: [
      { name: "Natasha Chari", text: "Great to work with and always willing to help and collaborate.", src: NATASHA, at: "08 Jul 2026" },
      { name: "Tinashe Muchengeti", text: "Detail oriented and adds value to the team.", src: TINASHE, at: "07 Jul 2026" },
      { name: "Yeukai Sibanda", text: "Reliable, proactive, and communicates clearly.", src: YEUKAI, at: "06 Jul 2026" },
    ],
    recommendedRating: 4,
    calibrationStatus: "Not Calibrated",
  },
  {
    id: "emp-002",
    name: "Natasha Chari",
    role: "HR Business Partner",
    department: "HR Department",
    initials: "NC",
    color: "#DB2777",
    src: NATASHA,
    status: "Submitted",
    dueDate: "15 Jul 2026",
    dueRelative: "2 days ago",
    dueUrgent: true,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Stakeholder Management", score: 4.3 },
      { label: "Employee Relations", score: 4.6 },
      { label: "Attention to Detail", score: 4.1 },
      { label: "Communication", score: 4.5 },
      { label: "Initiative & Ownership", score: 4.2 },
    ],
    kpiSummary: [
      { label: "Time to Hire", achievement: 90 },
      { label: "Retention Rate", achievement: 94 },
      { label: "Training Completion", achievement: 81 },
      { label: "Employee Engagement", achievement: 86 },
    ],
    overallKpiScore: 88,
    goals: { achieved: 5, partial: 0, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Natasha has been an outstanding partner to the business, consistently exceeding expectations on engagement initiatives.",
      by: "Farai Muchengeti",
      role: "Direct Manager",
      at: "08 Jul 2026, 11:02 AM",
      src: FARAI,
    },
    selfAssessment: {
      text: "This cycle I focused on improving retention and streamlining onboarding. I'm proud of the engagement survey results.",
      by: "Natasha Chari",
      role: "Employee",
      at: "08 Jul 2026, 10:40 AM",
      src: NATASHA,
    },
    peerFeedback: [
      { name: "Blessing Moyo", text: "Always responsive and great to partner with on people matters.", src: BLESSING, at: "07 Jul 2026" },
      { name: "Tendai Nyathi", text: "Very organized and proactive.", src: TENDAI, at: "06 Jul 2026" },
    ],
    recommendedRating: 5,
    calibrationStatus: "Not Calibrated",
  },
  {
    id: "emp-003",
    name: "Tinashe Muchengeti",
    role: "Investment Analyst",
    department: "Investment Analysis",
    initials: "TM",
    color: "#2563EB",
    src: TINASHE,
    status: "Pending",
    dueDate: "25 Jul 2026",
    dueRelative: "8 days left",
    dueUrgent: false,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Financial Modeling", score: 4.0 },
      { label: "Market Research", score: 4.2 },
      { label: "Attention to Detail", score: 3.9 },
      { label: "Communication", score: 3.8 },
      { label: "Initiative & Ownership", score: 4.0 },
    ],
    kpiSummary: [
      { label: "Deal Screening Accuracy", achievement: 82 },
      { label: "Report Turnaround", achievement: 76 },
      { label: "Portfolio Monitoring", achievement: 80 },
      { label: "Stakeholder Feedback", achievement: 79 },
    ],
    overallKpiScore: 79,
    goals: { achieved: 3, partial: 2, notAchieved: 0, total: 5 },
    managerFeedback: { text: "Not yet submitted.", by: "Rumbidzai Nyathi", role: "Direct Manager", at: "—", src: RUMBIDZAI },
    selfAssessment: { text: "Not yet submitted.", by: "Tinashe Muchengeti", role: "Employee", at: "—", src: TINASHE },
    peerFeedback: [],
    recommendedRating: 3,
    calibrationStatus: "Not Calibrated",
  },
  {
    id: "emp-004",
    name: "Yeukai Sibanda",
    role: "Operations Manager",
    department: "Operations",
    initials: "YS",
    color: "#0D9488",
    src: YEUKAI,
    status: "Calibrated",
    dueDate: "10 Jul 2026",
    dueRelative: "7 days ago",
    dueUrgent: false,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Process Improvement", score: 4.5 },
      { label: "Team Leadership", score: 4.4 },
      { label: "Attention to Detail", score: 4.2 },
      { label: "Communication", score: 4.3 },
      { label: "Initiative & Ownership", score: 4.6 },
    ],
    kpiSummary: [
      { label: "Loan TAT", achievement: 88 },
      { label: "SLA Compliance", achievement: 91 },
      { label: "Cost per Transaction", achievement: 84 },
      { label: "Team Productivity", achievement: 89 },
    ],
    overallKpiScore: 89,
    goals: { achieved: 5, partial: 0, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Yeukai continues to raise the bar for operational excellence across the branch network.",
      by: "Farai Muchengeti",
      role: "Direct Manager",
      at: "05 Jul 2026, 02:00 PM",
      src: FARAI,
    },
    selfAssessment: {
      text: "Focused on reducing turnaround times and improving SLA adherence this cycle.",
      by: "Yeukai Sibanda",
      role: "Employee",
      at: "05 Jul 2026, 01:20 PM",
      src: YEUKAI,
    },
    peerFeedback: [{ name: "Kudzai Ncube", text: "Excellent leadership during the system migration.", src: TENDAI, at: "04 Jul 2026" }],
    recommendedRating: 5,
    calibrationStatus: "Calibrated",
  },
  {
    id: "emp-005",
    name: "Tendai Nyathi",
    role: "IT Project Lead",
    department: "IT Department",
    initials: "TN",
    color: "#0284C7",
    src: TENDAI,
    status: "Completed",
    dueDate: "03 Jul 2026",
    dueRelative: "12 days ago",
    dueUrgent: false,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Technical Delivery", score: 4.6 },
      { label: "Project Management", score: 4.5 },
      { label: "Attention to Detail", score: 4.3 },
      { label: "Communication", score: 4.2 },
      { label: "Initiative & Ownership", score: 4.5 },
    ],
    kpiSummary: [
      { label: "System Uptime", achievement: 96 },
      { label: "Project Delivery", achievement: 90 },
      { label: "Incident Response", achievement: 87 },
      { label: "Budget Adherence", achievement: 93 },
    ],
    overallKpiScore: 92,
    goals: { achieved: 5, partial: 0, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Tendai led the ERP integration flawlessly. A model of technical excellence.",
      by: "Kudzai Ncube",
      role: "Direct Manager",
      at: "01 Jul 2026, 09:10 AM",
      src: TENDAI,
    },
    selfAssessment: {
      text: "Delivered the SAP integration ahead of schedule while maintaining system uptime.",
      by: "Tendai Nyathi",
      role: "Employee",
      at: "01 Jul 2026, 08:55 AM",
      src: TENDAI,
    },
    peerFeedback: [{ name: "Kudakwashe Sibanda", text: "Always available and technically excellent.", src: REGFATSON, at: "30 Jun 2026" }],
    recommendedRating: 5,
    calibrationStatus: "Calibrated",
  },
  {
    id: "emp-006",
    name: "Kudzanai Ncube",
    role: "HR Coordinator",
    department: "HR Department",
    initials: "KN",
    color: "#DB2777",
    src: KUDZANAI,
    status: "Pending",
    dueDate: "24 Jul 2026",
    dueRelative: "7 days left",
    dueUrgent: false,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Coordination", score: 3.9 },
      { label: "Attention to Detail", score: 4.0 },
      { label: "Communication", score: 3.8 },
      { label: "Initiative & Ownership", score: 3.7 },
      { label: "Employee Relations", score: 3.9 },
    ],
    kpiSummary: [
      { label: "Onboarding TAT", achievement: 75 },
      { label: "Query Resolution", achievement: 80 },
      { label: "Filing Accuracy", achievement: 88 },
      { label: "Training Coordination", achievement: 77 },
    ],
    overallKpiScore: 80,
    goals: { achieved: 3, partial: 1, notAchieved: 1, total: 5 },
    managerFeedback: { text: "Not yet submitted.", by: "Natasha Chari", role: "Direct Manager", at: "—", src: NATASHA },
    selfAssessment: { text: "Not yet submitted.", by: "Kudzanai Ncube", role: "Employee", at: "—", src: KUDZANAI },
    peerFeedback: [],
    recommendedRating: 3,
    calibrationStatus: "Not Calibrated",
  },
  {
    id: "emp-007",
    name: "Regfatson Zulu",
    role: "Customer Success Agent",
    department: "Customer Success",
    initials: "RZ",
    color: "#F97316",
    src: REGFATSON,
    status: "In Progress",
    dueDate: "20 Jul 2026",
    dueRelative: "3 days left",
    dueUrgent: true,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Customer Empathy", score: 4.4 },
      { label: "Problem Solving", score: 4.1 },
      { label: "Attention to Detail", score: 3.9 },
      { label: "Communication", score: 4.3 },
      { label: "Initiative & Ownership", score: 4.0 },
    ],
    kpiSummary: [
      { label: "CSAT Score", achievement: 91 },
      { label: "First Response Time", achievement: 84 },
      { label: "Resolution Rate", achievement: 88 },
      { label: "Ticket Backlog", achievement: 79 },
    ],
    overallKpiScore: 85,
    goals: { achieved: 4, partial: 1, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Regfatson consistently keeps CSAT high while managing a heavy ticket load.",
      by: "Kundai Chikore",
      role: "Direct Manager",
      at: "10 Jul 2026, 03:30 PM",
      src: FARAI,
    },
    selfAssessment: {
      text: "Worked hard on reducing first response time and improving ticket resolution quality.",
      by: "Regfatson Zulu",
      role: "Employee",
      at: "10 Jul 2026, 03:10 PM",
      src: REGFATSON,
    },
    peerFeedback: [{ name: "Reginald Zulu", text: "Great with escalations and always calm under pressure.", src: TINASHE, at: "09 Jul 2026" }],
    recommendedRating: 4,
    calibrationStatus: "Not Calibrated",
  },
  {
    id: "emp-008",
    name: "Rumbidzai Nyathi",
    role: "Senior Investment Analyst",
    department: "Investment Analysis",
    initials: "RN",
    color: "#2563EB",
    src: RUMBIDZAI,
    status: "Submitted",
    dueDate: "14 Jul 2026",
    dueRelative: "1 day ago",
    dueUrgent: true,
    reviewPeriod: "01 Jan 2026 – 30 Jun 2026",
    competencies: [
      { label: "Financial Modeling", score: 4.6 },
      { label: "Deal Structuring", score: 4.5 },
      { label: "Attention to Detail", score: 4.4 },
      { label: "Communication", score: 4.3 },
      { label: "Initiative & Ownership", score: 4.5 },
    ],
    kpiSummary: [
      { label: "Deal Screening Accuracy", achievement: 94 },
      { label: "Report Turnaround", achievement: 89 },
      { label: "Portfolio Monitoring", achievement: 91 },
      { label: "Stakeholder Feedback", achievement: 92 },
    ],
    overallKpiScore: 91,
    goals: { achieved: 5, partial: 0, notAchieved: 0, total: 5 },
    managerFeedback: {
      text: "Rumbidzai's diligence on the Q2 deals was exceptional.",
      by: "Farai Muchengeti",
      role: "Direct Manager",
      at: "13 Jul 2026, 05:00 PM",
      src: FARAI,
    },
    selfAssessment: {
      text: "Led three deal screenings this cycle with strong stakeholder feedback.",
      by: "Rumbidzai Nyathi",
      role: "Employee",
      at: "13 Jul 2026, 04:45 PM",
      src: RUMBIDZAI,
    },
    peerFeedback: [{ name: "Tinashe Muchengeti", text: "Sharp analytical mind, great to learn from.", src: TINASHE, at: "12 Jul 2026" }],
    recommendedRating: 5,
    calibrationStatus: "Not Calibrated",
  },
]
