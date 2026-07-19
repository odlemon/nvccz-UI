/** Mock data for Reconciliation Exceptions & Approvals (screenshot-aligned). */

export const stpSparkline = [
  { i: 0, v: 42 },
  { i: 1, v: 48 },
  { i: 2, v: 55 },
  { i: 3, v: 52 },
  { i: 4, v: 78 },
  { i: 5, v: 92 },
  { i: 6, v: 88 },
]

export type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type ExceptionStatus = 'Pending Approval' | 'Investigating' | 'Overdue'

export type ExceptionRow = {
  id: string
  severity: ExceptionSeverity
  account: string
  client: string
  source: string
  reason: string
  diffUsd: string
  diffZwl: string
  ageDays: number
  assignee: string
  status: ExceptionStatus
  title: string
  custodian: string
  instrument: string
  quantity: string
  tradeDate: string
  settleDate: string
  approver: string
}

export const exceptionRows: ExceptionRow[] = [
  {
    id: 'EXC-2025-00081',
    severity: 'Critical',
    account: 'ZAM-001-001',
    client: 'Zambezi Asset Management',
    source: 'Custodian',
    reason: 'Unmatched Trade',
    diffUsd: '124,530.21',
    diffZwl: '3,245,771.68',
    ageDays: 5,
    assignee: 'Tawanda Moyo',
    status: 'Pending Approval',
    title: 'Unmatched Trade',
    custodian: 'Stanbic Custody',
    instrument: 'Econet Wireless',
    quantity: '250,000',
    tradeDate: '22 May 2025',
    settleDate: '27 May 2025',
    approver: 'Rudo Chikomo',
  },
  {
    id: 'EXC-2025-00080',
    severity: 'High',
    account: 'NPF-OP-ZWL',
    client: 'Nyaradzo Pension Fund',
    source: 'Broker',
    reason: 'Price Variance',
    diffUsd: '8,420.00',
    diffZwl: '219,256.80',
    ageDays: 4,
    assignee: 'Rudo Chikomo',
    status: 'Investigating',
    title: 'Price Variance',
    custodian: 'IH Securities',
    instrument: 'Delta Corporation',
    quantity: '40,000',
    tradeDate: '23 May 2025',
    settleDate: '28 May 2025',
    approver: '—',
  },
  {
    id: 'EXC-2025-00079',
    severity: 'Medium',
    account: 'EAM-022-USD',
    client: 'Eastern Africa Mandate',
    source: 'Internal',
    reason: 'Missing Settlement',
    diffUsd: '41,200.00',
    diffZwl: '1,072,848.00',
    ageDays: 7,
    assignee: 'A. Dube',
    status: 'Overdue',
    title: 'Missing Settlement',
    custodian: 'CBZ Custody',
    instrument: 'Innscor Africa',
    quantity: '12,500',
    tradeDate: '20 May 2025',
    settleDate: '23 May 2025',
    approver: '—',
  },
  {
    id: 'EXC-2025-00078',
    severity: 'Critical',
    account: 'NPF-OP-ZWL',
    client: 'Nyaradzo Pension Fund',
    source: 'Bank',
    reason: 'Bank Charge Difference',
    diffUsd: '2.88',
    diffZwl: '75.00',
    ageDays: 1,
    assignee: 'T. Moyo',
    status: 'Investigating',
    title: 'Bank Charge Difference',
    custodian: 'CBZ Bank',
    instrument: '—',
    quantity: '—',
    tradeDate: '—',
    settleDate: '26 May 2025',
    approver: '—',
  },
  {
    id: 'EXC-2025-00077',
    severity: 'Low',
    account: 'SUN-001-USD',
    client: 'Sunrise Equity Mandate',
    source: 'Custodian',
    reason: 'Timing Difference',
    diffUsd: '0.00',
    diffZwl: '0.00',
    ageDays: 2,
    assignee: 'System',
    status: 'Pending Approval',
    title: 'Timing Difference',
    custodian: 'Stanbic Custody',
    instrument: 'Cash',
    quantity: '—',
    tradeDate: '18 Jul 2026',
    settleDate: '21 Jul 2026',
    approver: 'J. Moyo',
  },
  {
    id: 'EXC-2025-00076',
    severity: 'High',
    account: 'OMN-CBZ-USD',
    client: 'Omnibus Client Pool',
    source: 'Broker',
    reason: 'FX Rate Mismatch',
    diffUsd: '18,450.55',
    diffZwl: '480,452.42',
    ageDays: 3,
    assignee: 'Rudo Chikomo',
    status: 'Overdue',
    title: 'FX Rate Mismatch',
    custodian: 'CBZ Custody',
    instrument: 'USD/ZWL Spot',
    quantity: '—',
    tradeDate: '24 May 2025',
    settleDate: '27 May 2025',
    approver: '—',
  },
  {
    id: 'EXC-2025-00075',
    severity: 'Medium',
    account: 'ZAM-001-001',
    client: 'Zambezi Asset Management',
    source: 'Custodian',
    reason: 'Quantity Break',
    diffUsd: '5,120.00',
    diffZwl: '133,324.80',
    ageDays: 6,
    assignee: 'A. Dube',
    status: 'Investigating',
    title: 'Quantity Break',
    custodian: 'Stanbic Custody',
    instrument: 'Old Mutual Zimbabwe',
    quantity: '8,400',
    tradeDate: '21 May 2025',
    settleDate: '26 May 2025',
    approver: '—',
  },
  {
    id: 'EXC-2025-00074',
    severity: 'Critical',
    account: 'EAM-022-USD',
    client: 'Eastern Africa Mandate',
    source: 'Bank',
    reason: 'Unallocated Cash',
    diffUsd: '92,885.40',
    diffZwl: '2,418,696.02',
    ageDays: 4,
    assignee: 'Tawanda Moyo',
    status: 'Pending Approval',
    title: 'Unallocated Cash',
    custodian: 'Stanbic Bank',
    instrument: 'Cash',
    quantity: '—',
    tradeDate: '23 May 2025',
    settleDate: '27 May 2025',
    approver: 'Rudo Chikomo',
  },
]

export const exceptionTimeline = [
  {
    title: 'Exception Created',
    when: '22 May 2025 · 09:14',
    who: 'System',
    tone: 'blue' as const,
  },
  {
    title: 'Assigned to Analyst',
    when: '22 May 2025 · 10:02',
    who: 'Ops Queue',
    tone: 'blue' as const,
  },
  {
    title: 'Reviewed by Analyst',
    when: '23 May 2025 · 11:40',
    who: 'Tawanda Moyo',
    tone: 'blue' as const,
  },
  {
    title: 'Escalated',
    when: '26 May 2025 · 16:05',
    who: 'Tawanda Moyo',
    tone: 'blue' as const,
  },
  {
    title: 'Pending Approval',
    when: '27 May 2025 · 08:30',
    who: 'Awaiting Rudo Chikomo',
    tone: 'amber' as const,
  },
]
