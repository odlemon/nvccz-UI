/** Hydrate payload collections expected by MatanhoPortfolioUI.hydrate */

export type Pv11Fund = {
  id: string
  name: string
  vintage: number
  strategy: string
  currency: string
  commitment: number
  called: number
  nav: number
  distributed: number
  grossIrr: number
  netIrr: number
  tvpi: number
  dpi: number
  status: string
  geography: string
  managementFee: string
  carry: string
}

export type Pv11Company = {
  id: string
  name: string
  sector: string
  stage: string
  entry: string
  invested: number
  fairValue: number
  ownership: number
  revenueGrowth: number
  runway: number
  health: number
  boardDate: string
  lastReport: string
  fund: string
  city: string
  revenue: number[]
  ebitda: number[]
  arr: number
  margin: number
  nrr: number
  clients: number
  esg: number[]
  color: string
}

export type Pv11Deal = {
  id: string
  name: string
  sector: string
  round: string
  amount: number
  owner: string
  age: number
  priority: string
  stage: string
  score: number
  fund: string
  featured?: boolean
  applicationId?: string
  progress?: number
  hasDueDiligence?: boolean
  hasTermSheet?: boolean
  hasBoardReview?: boolean
}

export type Pv11CapitalCall = {
  id: string
  fund: string
  fundId?: string
  callDate: string
  dueDate: string
  purpose: string
  amount: number
  lpCount: number
  collected: number
  status: string
  approval: string
}

export type Pv11Lp = {
  id: string
  name: string
  type: string
  geography: string
  commitment: number
  called: number
  distributed: number
  netIrr: number
  owner: string
  lastInteraction: string
  kyc: string
  portal: string
  unfunded: number
  tvpi: number
  dpi: number
  color: string
}

export type Pv11Report = {
  id: string
  type: string
  fund: string
  entity: string
  owner: string
  frequency: string
  due: string
  status: string
  progress: number
  channel: string
}

export type Pv11Document = {
  id: string
  folder: string
  name: string
  type: string
  version: string
  owner: string
  uploaded: string
  status: string
  access: string
  classification?: string
  signatureStatus?: string
  retention?: string
  size?: string
  pages?: number
}

export type Pv11CashAccount = {
  id: string
  fund: string
  vehicle: string
  purpose: string
  provider: string
  masked: string
  currency: string
  ownership: string
  status: string
  posted: number
  settled: number
  reserved: number
  held: number
  expectedIn: number
  expectedOut: number
  deployable: number
  distributable: number
  reconHealth: number
  lastStatement: string
  tolerance: number
  gl: string
}

export type Pv11CashJournal = {
  id: string
  source: string
  event: string
  account: string
  fund: string
  valueDate: string
  debit: number
  credit: number
  signed: number
  status: string
  reconciled: number
  accounting: string
  maker: string
  checker: string
}

export type Pv11CashReservation = {
  id: string
  source: string
  fund: string
  vehicle: string
  account: string
  beneficiary: string
  amount: number
  remaining: number
  required: string
  expiry: string
  purpose: string
  status: string
  owner: string
  approval: string
}

export type Pv11StatementImport = {
  id: string
  provider: string
  account: string
  period: string
  filename: string
  lines: number
  opening: number
  movements: number
  closing: number
  status: string
  errors: number
  warnings: number
  duplicate: string
  received: string
  parser: string
}

export type Pv11ReconciliationBatch = {
  id: string
  account: string
  fund: string
  currency: string
  period: string
  opening: number
  internal: number
  external: number
  adjusted: number
  variance: number
  matched: number
  breaks: number
  status: string
  owner: string
  approvals: string
}

export type Pv11Exception = {
  id: string
  code: string
  title?: string
  account?: string
  amount: number
  owner: string
  age: number
  sla: string
  status: string
  severity: string
  evidence?: string
}

export type Pv11ReportVaultItem = {
  id: string
  type: string
  fund: string
  period: string
  status: string
  pages: number
  recipients: number
  owner?: string
  updated?: string
}

export type Pv11SignatureEnvelope = {
  id: string
  name: string
  status: string
  progress: number
  signers: number
  signed: number
  template?: string
  owner?: string
  due?: string
}

export type Pv11MailerList = {
  id: string
  name: string
  source: string
  status: string
  members: number
  active: number
  pending: number
  bounced: number
  campaigns: number
  tags: string[]
  channels?: string[]
}

export type Pv11DashboardMetrics = {
  totalInvested?: number
  availableForDrawdown?: number
  fundGrossIRR?: number
  lpNetIRR?: number
  tvpi?: number
  dpi?: number
  unrealizedValue?: number
  companyCount?: number
  activeInvestments?: number
  realizedInvestments?: number
}

export type Pv11DashboardCharts = {
  performance?: {
    labels: string[]
    capitalInvested: number[]
    distributions: number[]
    otherExpenses: number[]
    netCashFlow: number[]
  }
  jCurve?: { labels: string[]; values: number[] }
  sectors?: { label: string; value: number; display: string; color: string }[]
  valueTrend?: { labels: string[]; values: number[] }
  recentActivity?: { title: string; detail: string }[]
}

export type Pv11HydratePayload = {
  data: Partial<{
    funds: Pv11Fund[]
    companies: Pv11Company[]
    deals: Pv11Deal[]
    capitalCalls: Pv11CapitalCall[]
    lps: Pv11Lp[]
    reports: Pv11Report[]
    documents: Pv11Document[]
    cashAccounts: Pv11CashAccount[]
    cashJournals: Pv11CashJournal[]
    cashReservations: Pv11CashReservation[]
    statementImports: Pv11StatementImport[]
    reconciliationBatches: Pv11ReconciliationBatch[]
    reconciliationExceptions: Pv11Exception[]
    reportVaultItems: Pv11ReportVaultItem[]
    signatureEnvelopes: Pv11SignatureEnvelope[]
    mailerLists: Pv11MailerList[]
    dashboardMetrics: Pv11DashboardMetrics
    dashboardCharts: Pv11DashboardCharts
    closeControls: unknown[]
    rbac: unknown
  }>
  state?: Record<string, unknown>
  meta?: {
    errors: string[]
    loadedAt: string
    scopes?: string[]
    partial?: boolean
    merge?: boolean
  }
}
