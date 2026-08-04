/** Accounting V2 — Short-Term Investments mock fixtures (slide 10). */

export type AcStiKpi = {
  id: string
  label: string
  value: string
  icon: "bank" | "percent" | "layers" | "trend" | "alert"
  tone?: "pending"
}

export const acStiKpis: AcStiKpi[] = [
  { id: "principal", label: "Principal", value: "$8,420,000", icon: "bank" },
  { id: "interest", label: "Accrued interest", value: "$203,648", icon: "percent" },
  { id: "carrying", label: "Carrying value", value: "$8,623,648", icon: "layers" },
  { id: "yield", label: "Weighted yield", value: "13.4%", icon: "trend" },
  { id: "maturing", label: "Maturing in 30 days", value: "$1,750,000", icon: "alert", tone: "pending" },
]

export type AcStiLadderBar = {
  month: string
  value: number
  label: string
  tone?: "pending"
}

export const acStiLadder: AcStiLadderBar[] = [
  { month: "Jul 2026", value: 800, label: "$800K" },
  { month: "Aug 2026", value: 1750, label: "$1.75M", tone: "pending" },
  { month: "Sep 2026", value: 2450, label: "$2.45M" },
  { month: "Oct 2026", value: 1650, label: "$1.65M" },
  { month: "Nov 2026", value: 1100, label: "$1.10M" },
  { month: "Dec 2026", value: 660, label: "$660K" },
]

export type AcStiStatus = "Held" | "Maturing soon" | "New"

export type AcStiRow = {
  instrument: string
  issuer: string
  type: string
  currency: string
  tradeDate: string
  maturity: string
  principal: string
  rate: string
  accrued: string
  carrying: string
  status: AcStiStatus
}

export const acStiRows: AcStiRow[] = [
  { instrument: "RBZ-TB-182-2407", issuer: "Reserve Bank of Zimbabwe", type: "Treasury Bill 182-day", currency: "USD", tradeDate: "02 Mar 2026", maturity: "29 Aug 2026", principal: "$1,250,000", rate: "12.60%", accrued: "$11,640", carrying: "$1,261,640", status: "Held" },
  { instrument: "CBZ-FD-90-2406", issuer: "CBZ Bank Limited", type: "Fixed Deposit 90-day", currency: "USD", tradeDate: "15 Jun 2026", maturity: "13 Sep 2026", principal: "$1,500,000", rate: "13.25%", accrued: "$13,479", carrying: "$1,513,479", status: "Held" },
  { instrument: "OMMMF-2406", issuer: "Old Mutual Money Market Fund", type: "Money Market Fund", currency: "USD", tradeDate: "01 Jun 2026", maturity: "Open", principal: "$2,000,000", rate: "5.15%", accrued: "$7,378", carrying: "$2,007,378", status: "Held" },
  { instrument: "AFC-CP-120-2406", issuer: "Agricultural Finance Corporation", type: "Commercial Paper 120-day", currency: "USD", tradeDate: "10 Jun 2026", maturity: "08 Oct 2026", principal: "$1,200,000", rate: "14.10%", accrued: "$11,058", carrying: "$1,211,058", status: "Held" },
  { instrument: "STAN-CALL-2406", issuer: "Stanbic Bank Zimbabwe", type: "Call Account", currency: "ZiG", tradeDate: "01 Jun 2026", maturity: "Open", principal: "ZiG 100,000,000", rate: "6.00%", accrued: "ZiG 2,240,000", carrying: "ZiG 102,240,000", status: "Held" },
  { instrument: "ZIMRA-TB-91-2406", issuer: "Zimbabwe Revenue Authority", type: "Treasury Bill 91-day", currency: "USD", tradeDate: "20 Jun 2026", maturity: "19 Sep 2026", principal: "$1,000,000", rate: "12.95%", accrued: "$7,456", carrying: "$1,007,456", status: "Held" },
  { instrument: "NMB-FD-60-2406", issuer: "NMB Bank Limited", type: "Fixed Deposit 60-day", currency: "USD", tradeDate: "25 Jun 2026", maturity: "24 Aug 2026", principal: "$750,000", rate: "12.30%", accrued: "$4,637", carrying: "$754,637", status: "Maturing soon" },
  { instrument: "FBC-FD-45-2406", issuer: "FBC Bank", type: "Fixed Deposit 45-day", currency: "USD", tradeDate: "05 Jul 2026", maturity: "19 Aug 2026", principal: "$500,000", rate: "11.80%", accrued: "$1,932", carrying: "$501,932", status: "Maturing soon" },
  { instrument: "ECB-TB-365-2405", issuer: "Ecobank Zimbabwe", type: "Treasury Bill 365-day", currency: "USD", tradeDate: "15 Jan 2026", maturity: "15 Jan 2027", principal: "$1,200,000", rate: "14.50%", accrued: "$95,016", carrying: "$1,295,016", status: "New" },
]

export const acStiPagination = {
  showing: "Showing 1 to 9 of 9 entries",
}

export const acStiDetail = {
  instrument: "RBZ-TB-182-2407",
  status: "Held" as AcStiStatus,
  issuer: "Reserve Bank of Zimbabwe",
  type: "Treasury Bill 182-day",
  currency: "USD",
  principal: "$1,250,000",
  purchasePrice: "$1,250,000",
  yield: "12.60%",
  tradeDate: "02 Mar 2026",
  maturity: "29 Aug 2026",
  daysRemaining: "45 days",
  carrying: "$1,261,640",
  counterparty: "Reserve Bank of Zimbabwe",
  custodyAccount: "CBZ Custody – STI USD",
  settlementAccount: "1100 – CBZ USD Operating",
}

export type AcStiAccretion = {
  date: string
  description: string
  days: string
  interest: string
  accretion: string
  carrying: string
}

export const acStiAccretion: AcStiAccretion[] = [
  { date: "02 Mar 2026", description: "Purchase", days: "—", interest: "—", accretion: "—", carrying: "$1,250,000" },
  { date: "30 Jun 2026", description: "Interest accrual", days: "120", interest: "$8,219", accretion: "$8,219", carrying: "$1,258,219" },
  { date: "31 Jul 2026", description: "Interest accrual", days: "31", interest: "$3,421", accretion: "$3,421", carrying: "$1,261,640" },
  { date: "29 Aug 2026", description: "Maturity", days: "29", interest: "—", accretion: "—", carrying: "$1,261,640" },
]

export const acStiGlMapping = [
  { label: "Investment account", value: "1200 – Short-term investments" },
  { label: "Accrued interest", value: "1210 – Accrued investment income" },
  { label: "Yield / discount", value: "1220 – Investment yield income" },
]

export type AcStiLimit = {
  metric: string
  limit: string
  current: string
  status: "Compliant" | "Attention"
}

export const acStiLimits: AcStiLimit[] = [
  { metric: "Issuer limit", limit: "25%", current: "14.85%", status: "Compliant" },
  { metric: "Maturity concentration (90 days)", limit: "60%", current: "56.44%", status: "Attention" },
  { metric: "Maturity on specific date", limit: "20%", current: "14.52%", status: "Compliant" },
  { metric: "Single instrument limit", limit: "30%", current: "23.75%", status: "Compliant" },
]

export const acStiDocuments = [
  { name: "Deal confirmation.pdf", size: "248 KB", date: "02 Mar 2026" },
  { name: "Settlement instruction.pdf", size: "186 KB", date: "02 Mar 2026" },
  { name: "RBZ TB Certificate.pdf", size: "412 KB", date: "02 Mar 2026" },
  { name: "Custody statement.pdf", size: "324 KB", date: "31 Jul 2026" },
]

export type AcStiApproval = {
  action: string
  by: string
  role: string
  datetime: string
  notes: string
}

export const acStiApprovals: AcStiApproval[] = [
  { action: "Approved", by: "Tariro Ncube", role: "CFO", datetime: "01 Mar 2026 14:22", notes: "Within issuer limits" },
  { action: "Reviewed", by: "Praise Moyo", role: "Treasury Manager", datetime: "28 Feb 2026 11:05", notes: "Yield benchmark met" },
  { action: "Entered", by: "Nyasha Moyo", role: "Treasury Analyst", datetime: "27 Feb 2026 16:40", notes: "Deal confirmation received" },
]
