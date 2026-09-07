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

/** Shape the runtime's S.banks array expects (matanho-accounting-runtime.js bank8/currentBankBalance8). */
export type Ac52Bank = {
  id: string
  name: string
  institution: string
  currency: string
  /** Chart-of-accounts code this bank's balance derives from (accountDisplayBalance8). */
  gl: string
  account: string
  feed: string
  status: 'Active' | 'Inactive'
}

/** Shape S.reconciliation.statement / .ledger lines expect. */
export type Ac52ReconciliationLine = {
  id: string
  date: string
  ref: string
  description: string
  amount: number
  status: 'Matched' | 'Unmatched' | 'Exception'
}

export type Ac52Reconciliation = {
  statement: Ac52ReconciliationLine[]
  ledger: Ac52ReconciliationLine[]
}

/** Shape the runtime's v28-layer reconBanks array expects — separate from Ac52Bank/S.banks (see matanho-accounting-runtime.js reconciliationPage28). */
export type Ac52ReconBank = {
  id: string
  name: string
  currency: string
  statement: number
  ledger: number
}

/** Shape the runtime's v28-layer apBills array expects (matanho-accounting-runtime.js apPage). */
export type Ac52ApBill = {
  id: string
  vendor: string
  invoice: string
  date: string
  due: string
  po: string
  grn: string
  project: string
  gross: number
  open: number
  match: string
  status: string
  journal: string
}

/** Shape the runtime's v28-layer apVendors array expects. */
export type Ac52ApVendor = {
  id: string
  name: string
  category: string
  open: number
  terms: number
  kyc: string
  risk: string
  currency: string
}

/** Shape the runtime's v28-layer arInvoices array expects. */
export type Ac52ArInvoice = {
  id: string
  customer: string
  date: string
  due: string
  project: string
  gross: number
  open: number
  status: string
  journal: string
}

/** Shape the runtime's v28-layer arCustomers array expects. */
export type Ac52ArCustomer = {
  id: string
  name: string
  sector: string
  outstanding: number
  overdue: number
  limit: number
  dso: number
  risk: string
  owner: string
}

/** Shape the runtime's v34-layer claims array expects (matanho-accounting-runtime.js expensesPage34). */
export type Ac52Claim = {
  id: string
  employee: string
  purpose: string
  submitted: string
  amount: number
  receipts: number
  policy: string
  status: string
}

/** Shape the runtime's v8-scoped S.approvals array expects (matanho-accounting-runtime.js approvalsPage8). */
export type Ac52Approval = {
  id: string
  type: string
  record: string
  title: string
  amount: number
  currency: string
  maker: string
  requiredRole: string
  status: string
}

/** Shape the runtime's v51-layer `inventory` array expects (matanho-accounting-runtime.js invPage). */
export type Ac52InventoryItem = {
  sku: string
  item: string
  category: string
  warehouse: string
  qty: number
  unitCost: number
  value: number
  countVar: number
  obsolete: string
  status: string
}

/** Shape the runtime's v51-layer `assets` array expects (matanho-accounting-runtime.js assetPage). */
export type Ac52FixedAsset = {
  id: string
  desc: string
  category: string
  location: string
  custodian: string
  cost: number
  accum: number
  nbv: number
  life: string
  method: string
  status: string
}

/** Shape the runtime's v17-layer `investments` array expects (matanho-accounting-runtime.js investments17). */
export type Ac52Investment = {
  id: string
  issuer: string
  type: string
  currency: string
  principal: number
  rate: number
  maturity: string
  days: number
  carrying: number
  limit: string
  status: string
}

export type Ac52HydratePayload = {
  data?: {
    accounts?: Ac52Account[]
    journals?: Ac52Journal[]
    banks?: Ac52Bank[]
    reconciliation?: Ac52Reconciliation
    reconBanks?: Ac52ReconBank[]
    reconLines?: unknown[]
    apBills?: Ac52ApBill[]
    apVendors?: Ac52ApVendor[]
    arInvoices?: Ac52ArInvoice[]
    arCustomers?: Ac52ArCustomer[]
    claims?: Ac52Claim[]
    inventoryItems?: Ac52InventoryItem[]
    fixedAssets?: Ac52FixedAsset[]
    investments?: Ac52Investment[]
    reportRows?: import('./financial-statements').Ac52ReportRows
    approvals?: Ac52Approval[]
    fx?: import('./adapters').Ac52FxSummary
  }
}
