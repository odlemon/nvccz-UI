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

/** Shape the runtime's v27-layer ST27.schedules array expects (matanho-accounting-runtime.js recurringPage27 / baseSchedules27). */
export type Ac52RecurringSchedule = {
  id: string
  type: string
  counterparty: string
  description: string
  frequency: string
  cadence: string
  nextRun: string
  currency: string
  amount: number
  debit: string
  credit: string
  project: string
  entity: string
  approval: string
  status: string
  amountMode: string
  owner: string
  lastRun: string
  lastResult: string
  exception: string
  version: number
  autoPost: boolean
}

/** Shape the runtime's v8-scoped S.approvals array expects (matanho-accounting-runtime.js approvalsPage8). `backendKind`/`backendId` aren't part of the original mock shape but ride along on real rows so the write path (approve/reject) knows which real endpoint to call: 'journal' -> PATCH journal-entries/:id/post|void (backendId = JournalEntry.id), 'approval' -> POST approvals/:id/approve|reject (backendId = the real Approval.id, not the ApprovalRequest id). */
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
  backendKind?: 'journal' | 'approval'
  backendId?: string
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

/** Shape the runtime's `documents` array expects (matanho-accounting-runtime.js vaultPage). Real uploads carry no class/versions/status workflow — see adaptAc52VaultDocuments for the honest defaults used. */
export type Ac52VaultDocument = {
  id: string
  name: string
  folder: string
  type: string
  owner: string
  modified: string
  class: string
  versions: number
  status: string
  content: string
}

/** Shape the runtime's `compliancePacks` array expects (matanho-accounting-runtime.js compliance17). Only Income Tax (CIT+CGT) packs are real — the backend has no VAT/WHT/SAF-T pack persistence yet, so those stay mock rows and real Income Tax packs are merged alongside them. */
export type Ac52TaxPack = {
  id: string
  name: string
  type: string
  period: string
  status: string
  readiness: number
  exceptions: number
  owner: string
  due: string
}

/** Shape the runtime's `closeTasks` array expects (matanho-accounting-runtime.js closePage — confirmed NOT the live renderer, kept for potential reuse). No per-task evidence-file tracking exists in the backend, so `evidence` stays an honest 0. */
export type Ac52CloseTask = {
  workstream: string
  task: string
  owner: string
  due: string
  evidence: number
  status: string
  dependency: string
  /** Real backend row id — used to route 'mark complete' through the live API instead of the local-only mock fallback. */
  backendId: string
  fiscalPeriodId: string
}

/** Shape the runtime's V11 `C.tasks[i]` expects (matanho-accounting-runtime.js home()/workstream()/taskPage() — the actual live Period Close renderer, confirmed empirically; closePage() above is dead code for this page). No backend tracks a sub-checklist, evidence count, or priority per task, so those carry honest neutral defaults (empty checklist, 0/1 evidence, 'Medium' priority) rather than invented detail — the real fields (id/ws/name/owner/due/status/dependency) drive every downstream view since all of home()'s sibling pages and its single click handler operate generically on C.tasks/C.ws. */
export type Ac52CloseTaskV11 = {
  id: string
  ws: string
  name: string
  owner: string
  due: string
  status: string
  dependency: string
  evidence: number
  required: number
  checklist: number[]
  priority: string
  source: string
  note: string
  control: string
}

/** Shape the runtime's `ts` array expects (matanho-accounting-runtime.js timesheetsPage34). Real backend has no hourly-rate/cost tracking, so `cost` stays honest 0; `owner` (rendered as "Approver") stays 'Unassigned' until a real approval exists — a SUBMITTED timesheet genuinely has no approver yet. `days` buckets real entry hours onto the current Mon-Fri calendar week for the Command-tab weekly grid (matanho-accounting-runtime.js timesheets48). */
export type Ac52Timesheet = {
  id: string
  employee: string
  project: string
  client: string
  hours: number
  billable: number
  cost: number
  status: string
  owner: string
  days: number[]
}

/** Shape the runtime's `projects` array expects (matanho-accounting-runtime.js timesheetsPage34). No hourly-rate/billing-rate tracking exists in the backend, so hours/billable/cost/revenue/wip carry honest 0 rather than invented commercial figures. */
export type Ac52Project = {
  id: string
  name: string
  client: string
  type: string
  budget: number
  hours: number
  billable: number
  cost: number
  revenue: number
  wip: number
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

/**
 * Shape the runtime's `auditLog` array expects (matanho-accounting-runtime.js line ~203 —
 * consumed by auditPage() for the standalone Immutable Audit Trail page and by settings17()'s
 * 'audit' tab). The backend's AuditLog row carries no role, so `role` is resolved from the
 * users list where possible and left as an honest '—' when the actor is a system/service
 * event with no user attached.
 */
export type Ac52AuditEvent = {
  time: string
  event: string
  record: string
  user: string
  role: string
  ip: string
  detail: string
  class: string
}

/**
 * Real replacement for the runtime's `ceoEntities` demo fixture (matanho-accounting-runtime.js
 * ceoPage()). Assembled in live-loaders from the consolidation summary plus the same posted-journal
 * cash derivation Command Centre uses, so the CEO View ties to the operational pages instead of
 * showing a parallel set of invented figures. `close` is null and `risk` 0 because neither
 * per-entity close progress nor a finance risk register exists in the backend.
 */
export type Ac52CeoEntity = {
  id: string
  name: string
  sector: string
  revenue: number
  profit: number
  cash: number
  ar: number
  ap: number
  risk: number
  close: number | null
  margin: number
}

export type Ac52CeoSummary = {
  cash: number
  revenue: number
  netIncome: number
  entities: Ac52CeoEntity[]
}

/**
 * Real replacement for the runtime's `users` / `roles` / `rolePermissions` fixtures, consumed by
 * accessPage12() (the live Dynamic RBAC renderer — note pages.access is assigned three times and
 * accessPage12 is last) and by settings17()'s 'access' tab.
 *
 * `mfa` and `last` are '—': the backend tracks neither MFA enrolment nor last-active time for
 * users, and the mock's "Enforced" / "2 min ago" values asserted both. `scope` is the user's real
 * department where one is set — there is no per-user entity/fund scoping model to read.
 */
export type Ac52AccessUser = {
  name: string
  email: string
  role: string
  scope: string
  mfa: string
  last: string
  status: string
}

export type Ac52AccessData = {
  users: Ac52AccessUser[]
  roles: string[]
  /** Role name -> the permission keys that role actually holds, straight from the roles table. */
  rolePermissions: Record<string, string[]>
  /** Permission keys actually in use, so the matrix shows real keys rather than invented ones. */
  permissionKeys: string[]
}

/**
 * Real fiscal periods for Settings > Periods & lock (settings17). The tiles this replaces were
 * four hardcoded months carrying invented lock dates ("Locked 03 Jul") and completion
 * percentages. No per-period completion metric exists, so none is shown.
 */
export type Ac52FiscalPeriod = {
  id: string
  name: string
  status: string
  isCurrent: boolean
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
    recurring?: Ac52RecurringSchedule[]
    vaultDocuments?: Ac52VaultDocument[]
    taxPacks?: Ac52TaxPack[]
    consolidation?: import('../api/consolidation-api').ConsolidationSummary
    closeTasks?: Ac52CloseTask[]
    closeTasksV11?: Ac52CloseTaskV11[]
    timesheets?: Ac52Timesheet[]
    projects?: Ac52Project[]
    auditLog?: Ac52AuditEvent[]
    ceo?: Ac52CeoSummary
    access?: Ac52AccessData
    fiscalPeriods?: Ac52FiscalPeriod[]
  }
}
