/** Mock data for Broker & Custodian Reconciliation (screenshot-aligned). */

export type ReconStatus = 'Matched' | 'Potential' | 'Exception'

export type SideCell = {
  date: string
  reference: string
  security: string
  amount: string | null
  status: ReconStatus | null
}

export type WorkspaceRow = {
  id: string
  internal: SideCell
  broker: SideCell
  custodian: SideCell
  /** Used by exception panel when selected */
  detail?: {
    isin: string
    currency: string
    quantity: string
    price: string
    transactionType: string
    tradeDate: string
    settleDate: string
    differenceUsd: string
    assignee: string
    assigneeInitials: string
    comment: {
      author: string
      initials: string
      when: string
      body: string
    }
  }
}

export const workspaceRows: WorkspaceRow[] = [
  {
    id: 'ws_01',
    internal: {
      date: '27 May 2025',
      reference: 'IL-88420',
      security: 'Delta Corporation',
      amount: '1,245,800.00',
      status: 'Matched',
    },
    broker: {
      date: '27 May 2025',
      reference: 'BRK-55201',
      security: 'Delta Corporation',
      amount: '1,245,800.00',
      status: 'Matched',
    },
    custodian: {
      date: '27 May 2025',
      reference: 'CUS-21094',
      security: 'Delta Corporation',
      amount: '1,245,800.00',
      status: 'Matched',
    },
  },
  {
    id: 'ws_02',
    internal: {
      date: '27 May 2025',
      reference: 'IL-88411',
      security: 'CBZ Holdings',
      amount: '428,500.00',
      status: 'Exception',
    },
    broker: {
      date: '27 May 2025',
      reference: 'BRK-55188',
      security: 'CBZ Holdings',
      amount: '428,000.00',
      status: 'Exception',
    },
    custodian: {
      date: '27 May 2025',
      reference: 'CUS-21081',
      security: 'CBZ Holdings',
      amount: '428,000.00',
      status: 'Exception',
    },
    detail: {
      isin: 'ZW0009011752',
      currency: 'USD',
      quantity: '45,200',
      price: '9.48',
      transactionType: 'Buy',
      tradeDate: '26 May 2025',
      settleDate: '27 May 2025',
      differenceUsd: '500.00',
      assignee: 'Blessing Gutu',
      assigneeInitials: 'BG',
      comment: {
        author: 'Blessing Gutu',
        initials: 'BG',
        when: '27 May 2025 · 11:42',
        body: 'Broker confirm is short USD 500 vs internal ledger. Checking commission schedule before matching.',
      },
    },
  },
  {
    id: 'ws_03',
    internal: {
      date: '26 May 2025',
      reference: 'IL-88390',
      security: 'Econet Wireless',
      amount: '2,184,750.00',
      status: 'Matched',
    },
    broker: {
      date: '26 May 2025',
      reference: 'BRK-55102',
      security: 'Econet Wireless',
      amount: '2,184,750.00',
      status: 'Matched',
    },
    custodian: {
      date: '26 May 2025',
      reference: 'CUS-20955',
      security: 'Econet Wireless',
      amount: '2,184,750.00',
      status: 'Matched',
    },
  },
  {
    id: 'ws_04',
    internal: {
      date: '26 May 2025',
      reference: 'IL-88372',
      security: 'Innscor Africa',
      amount: '612,400.00',
      status: 'Potential',
    },
    broker: {
      date: '26 May 2025',
      reference: 'BRK-55088',
      security: 'Innscor Africa',
      amount: '612,900.00',
      status: 'Potential',
    },
    custodian: {
      date: '26 May 2025',
      reference: 'CUS-20940',
      security: 'Innscor Africa',
      amount: '612,400.00',
      status: 'Potential',
    },
  },
  {
    id: 'ws_05',
    internal: {
      date: '25 May 2025',
      reference: 'IL-88341',
      security: 'Old Mutual Zimbabwe',
      amount: '890,220.00',
      status: 'Matched',
    },
    broker: {
      date: '25 May 2025',
      reference: 'BRK-55021',
      security: 'Old Mutual Zimbabwe',
      amount: '890,220.00',
      status: 'Matched',
    },
    custodian: {
      date: '25 May 2025',
      reference: 'CUS-20888',
      security: 'Old Mutual Zimbabwe',
      amount: '890,220.00',
      status: 'Matched',
    },
  },
  {
    id: 'ws_06',
    internal: {
      date: '25 May 2025',
      reference: 'IL-88318',
      security: 'Padenga Holdings',
      amount: '154,000.00',
      status: 'Exception',
    },
    broker: {
      date: '—',
      reference: '—',
      security: 'Padenga Holdings',
      amount: null,
      status: null,
    },
    custodian: {
      date: '25 May 2025',
      reference: 'CUS-20861',
      security: 'Padenga Holdings',
      amount: '154,000.00',
      status: 'Exception',
    },
  },
  {
    id: 'ws_07',
    internal: {
      date: '24 May 2025',
      reference: 'IL-88290',
      security: 'Seed Co Limited',
      amount: '337,650.00',
      status: 'Matched',
    },
    broker: {
      date: '24 May 2025',
      reference: 'BRK-54980',
      security: 'Seed Co Limited',
      amount: '337,650.00',
      status: 'Matched',
    },
    custodian: {
      date: '24 May 2025',
      reference: 'CUS-20802',
      security: 'Seed Co Limited',
      amount: '337,650.00',
      status: 'Matched',
    },
  },
  {
    id: 'ws_08',
    internal: {
      date: '24 May 2025',
      reference: 'IL-88271',
      security: 'Hippo Valley Estates',
      amount: '98,440.00',
      status: 'Potential',
    },
    broker: {
      date: '24 May 2025',
      reference: 'BRK-54955',
      security: 'Hippo Valley Estates',
      amount: '98,440.00',
      status: 'Potential',
    },
    custodian: {
      date: '—',
      reference: '—',
      security: 'Hippo Valley Estates',
      amount: null,
      status: null,
    },
  },
  {
    id: 'ws_09',
    internal: {
      date: '23 May 2025',
      reference: 'IL-88240',
      security: 'Meikles Limited',
      amount: '276,100.00',
      status: 'Matched',
    },
    broker: {
      date: '23 May 2025',
      reference: 'BRK-54910',
      security: 'Meikles Limited',
      amount: '276,100.00',
      status: 'Matched',
    },
    custodian: {
      date: '23 May 2025',
      reference: 'CUS-20755',
      security: 'Meikles Limited',
      amount: '276,100.00',
      status: 'Matched',
    },
  },
  {
    id: 'ws_10',
    internal: {
      date: '23 May 2025',
      reference: 'IL-88212',
      security: 'Axia Corporation',
      amount: '512,875.00',
      status: 'Exception',
    },
    broker: {
      date: '23 May 2025',
      reference: 'BRK-54888',
      security: 'Axia Corporation',
      amount: '510,000.00',
      status: 'Exception',
    },
    custodian: {
      date: '23 May 2025',
      reference: 'CUS-20720',
      security: 'Axia Corporation',
      amount: '512,875.00',
      status: 'Exception',
    },
  },
]

export type QueueCard = {
  id: string
  security: string
  reference: string
  date: string
  amount: string
}

export type QueueColumn = {
  id: string
  label: string
  count: string
  /** Accent for header dot, column border, and card edge */
  accent: string
  /** Soft column fill */
  tint: string
  more: string
  cards: QueueCard[]
}

export const queueColumns: QueueColumn[] = [
  {
    id: 'new',
    label: 'New',
    count: '112',
    accent: '#3B82F6',
    tint: 'rgba(59,130,246,0.06)',
    more: '+ 109 more',
    cards: [
      { id: 'n1', security: 'OK Zimbabwe', reference: 'TRD-2025-10412', date: '27 May 2025', amount: '42,180.00' },
      { id: 'n2', security: 'Art Corporation', reference: 'TRD-2025-10408', date: '27 May 2025', amount: '18,640.00' },
      { id: 'n3', security: 'Nampak Zimbabwe', reference: 'TRD-2025-10394', date: '26 May 2025', amount: '67,920.00' },
    ],
  },
  {
    id: 'potential',
    label: 'Potential Match',
    count: '86',
    accent: '#38BDF8',
    tint: 'rgba(56,189,248,0.06)',
    more: '+ 83 more',
    cards: [
      { id: 'p1', security: 'Innscor Africa', reference: 'TRD-2025-10372', date: '26 May 2025', amount: '612,400.00' },
      { id: 'p2', security: 'Hippo Valley Estates', reference: 'TRD-2025-10341', date: '24 May 2025', amount: '98,440.00' },
      { id: 'p3', security: 'FBC Holdings', reference: 'TRD-2025-10318', date: '25 May 2025', amount: '221,300.00' },
    ],
  },
  {
    id: 'matched',
    label: 'Matched',
    count: '1,248',
    accent: '#22C55E',
    tint: 'rgba(34,197,94,0.06)',
    more: '+ 1,245 more',
    cards: [
      { id: 'm1', security: 'Delta Corporation', reference: 'TRD-2025-10420', date: '27 May 2025', amount: '1,245,800.00' },
      { id: 'm2', security: 'Econet Wireless', reference: 'TRD-2025-10390', date: '26 May 2025', amount: '2,184,750.00' },
      { id: 'm3', security: 'Seed Co Limited', reference: 'TRD-2025-10355', date: '24 May 2025', amount: '337,650.00' },
    ],
  },
  {
    id: 'exception',
    label: 'Exception',
    count: '23',
    accent: '#F59E0B',
    tint: 'rgba(245,158,11,0.07)',
    more: '+ 20 more',
    cards: [
      { id: 'e1', security: 'CBZ Holdings', reference: 'TRD-2025-10411', date: '27 May 2025', amount: '428,500.00' },
      { id: 'e2', security: 'Padenga Holdings', reference: 'TRD-2025-10241', date: '25 May 2025', amount: '32,100.00' },
      { id: 'e3', security: 'Axia Corporation', reference: 'TRD-2025-10212', date: '23 May 2025', amount: '512,875.00' },
    ],
  },
  {
    id: 'escalated',
    label: 'Escalated',
    count: '3',
    accent: '#EF4444',
    tint: 'rgba(239,68,68,0.07)',
    more: '+ 0 more',
    cards: [
      { id: 'x1', security: 'Masimba Holdings', reference: 'TRD-2025-10190', date: '22 May 2025', amount: '93,450.00' },
      { id: 'x2', security: 'Zimplow Holdings', reference: 'TRD-2025-10144', date: '21 May 2025', amount: '31,200.00' },
      { id: 'x3', security: 'Tafaria Capital', reference: 'TRD-2025-10101', date: '20 May 2025', amount: '128,770.00' },
    ],
  },
]
