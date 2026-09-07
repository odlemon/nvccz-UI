/** Shape the accounting-v52 runtime's S.accounts array expects (matanho-accounting-runtime.js seedState8/accountSeed8). */
export type Ac52Account = {
  code: string
  name: string
  type: string
  normal: 'Debit' | 'Credit'
  natural: 'Debit' | 'Credit'
  control: boolean
  posting: boolean
  scope: string
  active: boolean
  /** Real backend record id — not rendered, carried so edits can PATCH the correct row. */
  backendId?: string
}

/** Shape the runtime's S.journals array expects (matanho-accounting-runtime.js line8/postJournal8). */
export type Ac52JournalLine = {
  account: string
  debit: number
  credit: number
  description: string
  project: string
  currency: string
  rate: number
  baseDebit: number
  baseCredit: number
}

export type Ac52Journal = {
  id: string
  date: string
  reference: string
  description: string
  source: string
  sourceId: string
  currency: string
  rate: number
  status: 'Posted' | 'Submitted' | 'Void'
  maker: string
  checker: string | null
  createdAt: string
  postedAt: string | null
  cashFlow: string
  evidence: string[]
  immutable: boolean
  lines: Ac52JournalLine[]
  total: number
  /** Real backend record id, for write-back on future journal actions. */
  backendId?: string
}

export type Ac52HydratePayload = {
  data?: {
    accounts?: Ac52Account[]
    journals?: Ac52Journal[]
  }
}
