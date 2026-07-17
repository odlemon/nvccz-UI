/**
 * Map API records → existing Fundraising UI view models (no redesign).
 */
import { asNumber } from '@/lib/api/fundraising-api'
import type { InvestorOrg, KycStatus } from '@/components/fundraising/investors-mock-data'

const TYPE_LABEL: Record<string, InvestorOrg['type']> = {
  PENSION_FUND: 'Pension Fund',
  INSURANCE: 'Insurer',
  FAMILY_OFFICE: 'Family Office',
  DFI: 'DFI',
  SOVEREIGN: 'Sovereign',
  BANK: 'Bank',
  CONSULTANT: 'Corporate',
  CORPORATE: 'Corporate',
  FUND_OF_FUNDS: 'Fund of Funds',
}

const SANCTIONS_LABEL: Record<string, InvestorOrg['sanctionsStatus']> = {
  CLEAR: 'Clear',
  NOT_SCREENED: 'Not Screened',
  BLOCKED: 'Flagged',
  FAILED: 'Flagged',
}

function moneyLabel(n: unknown, currency = 'USD'): string {
  const v = asNumber(n)
  if (!v) return '—'
  if (Math.abs(v) >= 1_000_000) return `US$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `US$${(v / 1_000).toFixed(0)}K`
  return `${currency} ${v.toLocaleString()}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const LOGO_COLORS = ['#7c3aed', '#2563eb', '#0d9488', '#ea580c', '#db2777', '#4f46e5']

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readableName(value: unknown, fallback = 'Name unavailable') {
  const text = String(value || '').trim()
  return text && !UUID_PATTERN.test(text) ? text : fallback
}

function nestedPersonName(person: Record<string, any> | null | undefined) {
  if (!person) return ''
  return person.displayName || person.fullName ||
    [person.firstName, person.lastName].filter(Boolean).join(' ') ||
    person.email || ''
}

export function mapInvestorOrg(raw: Record<string, any>, idx = 0): InvestorOrg {
  const legalName = raw.legalName || raw.name || 'Investor'
  const minT = asNumber(raw.typicalMinimumTicket)
  const maxT = asNumber(raw.typicalMaximumTicket)
  const ticketRange =
    minT || maxT
      ? `${moneyLabel(minT)}–${moneyLabel(maxT).replace(/^US\$/, '')}`
      : '—'

  const kyc = String(raw.kycStatus || 'NOT_STARTED') as KycStatus
  const statusRaw = String(raw.status || 'ACTIVE').toUpperCase()
  const status: InvestorOrg['status'] =
    statusRaw === 'INACTIVE' || statusRaw === 'ARCHIVED'
      ? 'Inactive'
      : statusRaw === 'PROSPECT'
        ? 'Prospect'
        : 'Active'

  const commitmentSummary = raw.commitmentsSummary
  const commitments =
    commitmentSummary && typeof commitmentSummary === 'object'
      ? `${moneyLabel(commitmentSummary.totalSigned, commitmentSummary.currency || 'USD')} (${asNumber(commitmentSummary.count)} commitment${asNumber(commitmentSummary.count) === 1 ? '' : 's'})`
      : typeof commitmentSummary === 'string'
        ? commitmentSummary
        : moneyLabel(raw.signedCommitmentTotal)

  return {
    id: String(raw.id),
    legalName,
    tradingName: raw.tradingName,
    type: TYPE_LABEL[String(raw.investorType || '')] || 'Corporate',
    country: raw.countryCode || raw.country || '—',
    jurisdiction: raw.jurisdiction || raw.countryCode || '—',
    estimatedAum: moneyLabel(raw.estimatedAum),
    ticketRange,
    owner: readableName(raw.relationshipOwnerName || nestedPersonName(raw.relationshipOwner)),
    status,
    kycStatus: kyc,
    sanctionsStatus:
      SANCTIONS_LABEL[String(raw.sanctionsStatus || 'NOT_SCREENED')] || 'Not Screened',
    lastInteraction: raw.lastContactAt
      ? new Date(raw.lastContactAt).toLocaleDateString()
      : '—',
    nextAction: raw.nextAction || '—',
    openOpportunities: asNumber(raw.openOpportunities ?? raw.opportunityCount),
    commitments,
    logoLabel: initials(legalName) || 'IN',
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    assetPreferences: Array.isArray(raw.assetClassPreferences)
      ? raw.assetClassPreferences
      : [],
    score: asNumber(raw.fitScore ?? raw.score, 0),
  }
}

export function mapContactRow(raw: Record<string, any>, orgName?: string, idx = 0) {
  const influence = String(raw.decisionInfluence || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const name = raw.fullName || raw.name || '—'
  return {
    id: String(raw.id),
    name,
    initials: initials(name) || 'IN',
    avatarBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    role: raw.roleTitle || raw.role || '—',
    organisation: orgName || raw.investorLegalName || raw.organisationName || '—',
    organisationName: orgName || raw.investorLegalName || raw.organisationName || '—',
    investorId: String(raw.investorId || ''),
    email: raw.email || '—',
    phone: raw.phone || '—',
    influence: influence || '—',
    consent: Boolean(raw.communicationConsent),
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    nextAction: raw.nextAction || '—',
    lastInteraction: raw.lastInteractionAt
      ? new Date(raw.lastInteractionAt).toLocaleDateString()
      : '—',
    campaigns: Array.isArray(raw.campaigns) ? raw.campaigns : [],
    raw,
  }
}

export function mapCampaignCard(raw: Record<string, any>) {
  const status = String(raw.status || 'DRAFT').toUpperCase()
  return {
    id: String(raw.id),
    name: raw.name || 'Campaign',
    type: raw.campaignType || '—',
    status: status === 'ACTIVE' ? 'live' : status === 'DRAFT' || status === 'PENDING' ? 'planned' : status.toLowerCase(),
    approvalStatus: raw.approvalStatus,
    target: moneyLabel(raw.targetCapital ?? raw.targetAmount),
    targetCapital: asNumber(raw.targetCapital ?? raw.targetAmount),
    currency: raw.primaryCurrency || 'USD',
    owner: readableName(raw.campaignOwnerName || nestedPersonName(raw.campaignOwner)),
    fundId: raw.fundId,
    startDate: raw.startDate,
    closeDate: raw.closeDate,
    raw,
  }
}

export function mapCampaignEngagement(raw: Record<string, any> | null | undefined) {
  return {
    sent: asNumber(raw?.sent),
    opened: asNumber(raw?.opened),
    replied: asNumber(raw?.replied),
    meetingsBooked: asNumber(raw?.meetingsBooked),
    materialsDownloaded: asNumber(raw?.materialsDownloaded),
    progressPct: asNumber(raw?.progressPct),
  }
}

export function mapOpportunityRow(raw: Record<string, any>) {
  return {
    id: String(raw.id),
    investor: raw.investor?.legalName || raw.investorName || '—',
    investorId: raw.investorId || raw.investor?.id,
    campaign: raw.campaign?.name || raw.campaignName || '—',
    campaignId: raw.campaignId,
    opportunity: readableName(raw.opportunity?.name || raw.opportunityName),
    opportunityId: raw.opportunityId || raw.opportunity?.id,
    stage: raw.currentStage?.stageName || raw.currentStage?.stageCode || raw.stageCode || '—',
    stageCode: raw.currentStage?.stageCode || raw.stageCode,
    softCircle: moneyLabel(raw.softCircleAmount),
    proposed: moneyLabel(raw.proposedAmount),
    signed: moneyLabel(raw.signedAmount),
    indicative: moneyLabel(raw.indicativeAmount),
    funded: moneyLabel(raw.fundedAmount),
    admitted: moneyLabel(raw.admittedAmount),
    expectedAum: moneyLabel(raw.expectedAum),
    activatedAum: moneyLabel(raw.activatedAum),
    probability: asNumber(raw.winProbabilityPct ?? raw.probability),
    owner: readableName(raw.opportunityOwnerName || nestedPersonName(raw.opportunityOwner)),
    nextAction: raw.nextAction || '—',
    priority: raw.priority || 'MEDIUM',
    status: raw.status || 'OPEN',
    currency: raw.opportunityCurrency || 'USD',
    ageDays: asNumber(raw.daysInStage ?? raw.ageDays),
    raw,
  }
}

/* ─── Communications / Meetings / Tasks ─────────────────────────────────── */

export const INTERACTION_TYPE_LABEL: Record<string, string> = {
  EMAIL: 'Email',
  PHONE_CALL: 'Call',
  VIDEO_MEETING: 'Meeting',
  PHYSICAL_MEETING: 'Meeting',
  CONFERENCE: 'Meeting',
  PRESENTATION: 'Presentation',
  FOLLOW_UP: 'Follow-up',
  INTERNAL_NOTE: 'Internal Note',
  DATA_ROOM_INVITATION: 'Data Room Invite',
  PROPOSAL_SUBMISSION: 'Follow-up',
  DDQ_RESPONSE: 'DDQ',
}

export const INTERACTION_TYPES = Object.keys(INTERACTION_TYPE_LABEL)

const SENTIMENT_LABEL: Record<string, string> = {
  POSITIVE: 'Positive',
  NEUTRAL: 'Neutral',
  CAUTIOUS: 'Cautious',
  NEGATIVE: 'Negative',
}

export function fmtDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function mapCommunicationRow(raw: Record<string, any>) {
  const interactionType = String(raw.interactionType || '')
  const confidentiality = String(raw.confidentiality || '').toUpperCase()
  return {
    id: String(raw.id),
    type: INTERACTION_TYPE_LABEL[interactionType] || (interactionType ? interactionType.replace(/_/g, ' ') : '—'),
    interactionType,
    subject: raw.subject || '(No subject)',
    summary: raw.summary || raw.notes || '—',
    investor: raw.investor?.legalName || raw.investor?.name || raw.investorName || '—',
    investorId: raw.investorId || raw.investor?.id,
    contact: raw.contact?.fullName || (Array.isArray(raw.participants) && raw.participants[0]) || '—',
    campaign: raw.campaign?.name || raw.campaignName || '—',
    campaignId: raw.campaignId,
    opportunity: readableName(raw.opportunity?.name || raw.opportunityName),
    opportunityId: raw.opportunityId || raw.opportunity?.id,
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    occurredAt: raw.occurredAt,
    date: fmtDateTime(raw.occurredAt || raw.createdAt),
    outcome: raw.outcome ? String(raw.outcome).replace(/_/g, ' ') : '—',
    nextAction: raw.nextAction || '—',
    nextActionDate: raw.dueDate ? fmtDate(raw.dueDate) : '—',
    sentiment: SENTIMENT_LABEL[String(raw.sentiment || '').toUpperCase()] || 'Neutral',
    confidential: confidentiality === 'INTERNAL' || confidentiality === 'INTERNAL_NOTE' || confidentiality === 'CONFIDENTIAL',
    raw,
  }
}

/** Dedicated meetings resource (`/fundraising/meetings`) — not the communications log. */
export const MEETING_TYPE_LABEL: Record<string, 'Video' | 'In person' | 'Call'> = {
  VIDEO: 'Video',
  IN_PERSON: 'In person',
  PHONE: 'Call',
}

export const MEETING_STATUS_LABEL: Record<string, 'Scheduled' | 'Completed' | 'Cancelled' | 'No show'> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
}

export function mapMeetingRecord(raw: Record<string, any>) {
  const start = raw.scheduledStart ? new Date(raw.scheduledStart) : null
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null
  const end = raw.scheduledEnd ? new Date(raw.scheduledEnd) : null
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null
  const type = MEETING_TYPE_LABEL[String(raw.meetingType || '').toUpperCase()] || 'Video'
  const status = MEETING_STATUS_LABEL[String(raw.status || '').toUpperCase()] || 'Scheduled'
  const owner = readableName(nestedPersonName(raw.owner) || raw.ownerName)
  const attendees: string[] =
    Array.isArray(raw.attendees) && raw.attendees.length
      ? raw.attendees.map((a: Record<string, any>) => readableName(a.fullName || a.email, 'Attendee'))
      : [owner]
  const investor = raw.investor?.legalName || raw.investor?.name || raw.investorName || '—'

  return {
    id: String(raw.id),
    title: raw.title || 'Meeting',
    investor,
    campaign: raw.campaign?.name || raw.campaignName || '—',
    date: validStart ? fmtDate(validStart) : '—',
    time: validStart
      ? `${validStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${validEnd ? `–${validEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}`
      : '—',
    type,
    owner,
    status,
    attendees,
    relatedOpportunity: raw.opportunityId ? investor : undefined,
    agenda: raw.agenda || raw.plannedDiscussion || raw.description || '',
    discussionNotes: raw.discussionNotes || raw.meetingNotes || raw.notes || '',
    outcomeSummary: raw.outcomeSummary || raw.outcome || '',
    decisions: Array.isArray(raw.decisions) ? raw.decisions : [],
    actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : [],
    scheduledStart: raw.scheduledStart,
    scheduledEnd: raw.scheduledEnd,
    campaignId: raw.campaignId,
    investorId: raw.investorId,
    raw,
  }
}

export type FrTaskStatusValue =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_INVESTOR'
  | 'WAITING_ON_INTERNAL_TEAM'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'

const TASK_STATUS_MAP: Record<string, FrTaskStatusValue> = {
  NOT_STARTED: 'NOT_STARTED',
  TODO: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_ON_INVESTOR: 'WAITING_ON_INVESTOR',
  WAITING_ON_INTERNAL_TEAM: 'WAITING_ON_INTERNAL_TEAM',
  COMPLETED: 'COMPLETED',
  DONE: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
  DELAYED: 'OVERDUE',
  RED: 'OVERDUE',
  AMBER: 'IN_PROGRESS',
}

export function mapTaskCard(raw: Record<string, any>) {
  const statusRaw = String(raw.status || raw.stage || 'NOT_STARTED').toUpperCase()
  const status = TASK_STATUS_MAP[statusRaw] || 'NOT_STARTED'
  const priorityRaw = String(raw.priority || 'MEDIUM').toUpperCase()
  const priority: 'High' | 'Medium' | 'Low' =
    priorityRaw === 'HIGH' || priorityRaw === 'URGENT' || priorityRaw === 'CRITICAL'
      ? 'High'
      : priorityRaw === 'LOW'
        ? 'Low'
        : 'Medium'

  return {
    id: String(raw.id),
    title: raw.title || 'Task',
    related: raw.investorName || raw.investor?.legalName || raw.campaignName || raw.opportunityName || '—',
    campaign: raw.campaignName || raw.campaign?.name || '—',
    dueDate: raw.dueDate ? fmtDate(raw.dueDate) : '—',
    status,
    owner: readableName(raw.ownerName || nestedPersonName(raw.assignee) || nestedPersonName(raw.owner)),
    priority,
    raw,
  }
}

/* ─── Documents (unified index — `/fundraising/documents`) ──────────────── */

export const DOCUMENT_SOURCE_LABEL: Record<string, string> = {
  DATA_ROOM: 'Data Room',
  AGREEMENT: 'Agreements',
  DDQ_EVIDENCE: 'Due Diligence',
  UPLOAD: 'Uploads',
}

export function mapDocumentRow(raw: Record<string, any>) {
  const version = raw.currentVersion || {}
  return {
    id: String(raw.id),
    name: raw.name || raw.title || version.fileName || 'Document',
    category: raw.category || 'Documents',
    campaign: raw.campaignName || raw.campaign?.name || '—',
    campaignId: raw.campaignId ? String(raw.campaignId) : undefined,
    investorId: raw.investorId ? String(raw.investorId) : undefined,
    room: DOCUMENT_SOURCE_LABEL[String(raw.sourceType || '').toUpperCase()] || 'Documents',
    sourceType: String(raw.sourceType || 'UPLOAD'),
    version: version.versionNumber
      ? `v${version.versionNumber}`
      : raw.versionCount
        ? `v${raw.versionCount}`
        : 'v1',
    status: raw.status ? String(raw.status).replace(/_/g, ' ') : 'Active',
    owner: version.uploadedBy?.displayName || raw.ownerName || '—',
    updated: fmtDate(version.uploadedAt || raw.updatedAt || raw.createdAt) || '—',
    confidential: Boolean(raw.confidential),
    raw,
  }
}

/* ─── Data rooms ──────────────────────────────────────────────────────────── */

export function mapDataRoomCard(raw: Record<string, any>, campaignName?: string) {
  const folders = Array.isArray(raw.folders) ? raw.folders : []
  const documents = Array.isArray(raw.documents) ? raw.documents : []
  const access = Array.isArray(raw.access) ? raw.access : Array.isArray(raw.accessList) ? raw.accessList : []
  const status = String(raw.status || (raw.requiresMfa !== undefined ? 'ACTIVE' : 'DRAFT')).toUpperCase()

  return {
    id: String(raw.id),
    name: raw.name || 'Data Room',
    campaign: campaignName || raw.campaign?.name || raw.campaignName || '—',
    status: status === 'ACTIVE' ? 'Active' : status === 'EXPIRED' ? 'Expired' : status === 'REVOKED' ? 'Revoked' : 'Draft',
    investorsInvited: access.length,
    documents: documents.length || asNumber(raw.documentCount),
    views7d: asNumber(raw.views7d),
    downloads7d: asNumber(raw.downloads7d),
    expiresOn: raw.expiresOn ? fmtDate(raw.expiresOn) : '—',
    owner: raw.ownerName || '—',
    watermark: Boolean(raw.watermarkEnabled ?? true),
    mfaRequired: Boolean(raw.requiresMfa),
    folders: folders.map((f: Record<string, any>) => ({
      name: f.name || 'Folder',
      docs: asNumber(f.documentCount ?? f.docs),
    })),
    documentsRaw: documents,
    recentActivity: Array.isArray(raw.recentActivity)
      ? raw.recentActivity.map((a: Record<string, any>, i: number) => ({
          id: String(a.id ?? i),
          actor: a.actor || a.investorName || '—',
          action: a.action || '—',
          doc: a.documentName || a.doc || '—',
          at: fmtDateTime(a.at || a.createdAt),
        }))
      : [],
    accessList: access.map((a: Record<string, any>, i: number) => ({
      id: String(a.id ?? i),
      investor: a.investor?.legalName || a.investorName || '—',
      contact: a.contact || a.contactName || '—',
      access: a.access || (a.viewOnly ? 'View only' : 'Download'),
      lastAccess: a.lastAccessAt ? fmtDate(a.lastAccessAt) : '—',
    })),
    raw,
  }
}

/* ─── Due diligence (DDQ) ─────────────────────────────────────────────────── */

const DDQ_ITEM_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested',
  UPLOADED: 'Uploaded',
  REVIEWED: 'Reviewed',
  FOLLOW_UP: 'Follow-up',
  COMPLETED: 'Completed',
}

export function mapDdqCaseToInvestorCard(raw: Record<string, any>) {
  const items = Array.isArray(raw.items) ? raw.items : []
  const total = items.length
  const done = items.filter((i: Record<string, any>) =>
    ['REVIEWED', 'COMPLETED'].includes(String(i.status || '').toUpperCase()),
  ).length
  const overdue = items.filter((i: Record<string, any>) => i.dueDate && new Date(i.dueDate).getTime() < Date.now() && !['REVIEWED', 'COMPLETED'].includes(String(i.status || '').toUpperCase())).length
  const name = raw.investor?.legalName || raw.investorName || raw.title || 'DDQ Case'

  return {
    id: String(raw.id),
    name,
    lead: raw.ownerName || raw.owner?.fullName || '—',
    logoLabel: name.slice(0, 2).toUpperCase(),
    logoBg: '#2563eb',
    logoText: '#fff',
    completion: total ? Math.round((done / total) * 100) : 0,
    open: total - done,
    overdue,
    daysInDd: raw.createdAt ? Math.max(0, Math.round((Date.now() - new Date(raw.createdAt).getTime()) / 86400000)) : 0,
    status: raw.status,
    raw,
  }
}

export function mapDdqItemToMatrixRow(item: Record<string, any>) {
  return {
    id: String(item.id),
    category: item.category || 'General',
    document: item.question || item.title || item.label || 'Item',
    status: DDQ_ITEM_STATUS_LABEL[String(item.status || '').toUpperCase()] || 'Requested',
    lastUpdated: fmtDate(item.updatedAt),
    owner: item.ownerName || '—',
    raw: item,
  }
}

/* ─── Agreements ──────────────────────────────────────────────────────────── */

const AGREEMENT_TYPE_LABEL: Record<string, string> = {
  NDA: 'NDA',
  TERM_SHEET: 'Term Sheet',
  SUBSCRIPTION_AGREEMENT: 'Subscription',
  LPA: 'LPA',
  SIDE_LETTER: 'Side Letter',
  CO_INVESTMENT_AGREEMENT: 'Side Letter',
  IMA: 'IMA',
  MANDATE: 'IMA',
  FEE_SCHEDULE: 'Fee Schedule',
  INVESTMENT_GUIDELINES: 'Fee Schedule',
}

const AGREEMENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_SIGNED: 'Partially Signed',
  COMPLETED: 'Completed',
  FULLY_SIGNED: 'Completed',
  EXPIRED: 'Expired',
  VOIDED: 'Voided',
}

export function mapAgreementRow(raw: Record<string, any>) {
  const documentType = String(raw.documentType || '')
  const signatories = Array.isArray(raw.signatories) ? raw.signatories : []
  const statusRaw = String(raw.status || 'DRAFT').toUpperCase()

  return {
    id: String(raw.id),
    name: raw.title || documentType.replace(/_/g, ' ') || 'Agreement',
    type: AGREEMENT_TYPE_LABEL[documentType] || documentType.replace(/_/g, ' ') || '—',
    documentType,
    investor: raw.investor?.legalName || raw.investorName || '—',
    investorId: raw.investorId,
    campaign: raw.campaign?.name || raw.campaignName || '—',
    campaignId: raw.campaignId,
    opportunityId: raw.opportunityId,
    version: raw.currentVersion ? `v${raw.currentVersion}` : raw.version || 'v1',
    status: AGREEMENT_STATUS_LABEL[statusRaw] || statusRaw.replace(/_/g, ' '),
    signatories: signatories.map((s: Record<string, any>, i: number) => ({
      id: String(s.id ?? i),
      name: s.fullName || s.name || '—',
      role: s.role || (s.email ? s.email : '—'),
      status: s.signedAt ? 'Signed' : String(s.status || 'Pending').toUpperCase() === 'DECLINED' ? 'Declined' : 'Pending',
      signedAt: s.signedAt ? fmtDate(s.signedAt) : null,
      raw: s,
    })),
    sentDate: raw.sentAt ? fmtDate(raw.sentAt) : null,
    expiry: raw.expiresAt ? fmtDate(raw.expiresAt) : null,
    owner: raw.ownerName || '—',
    raw,
  }
}

// ─── Commitments / Closings ──────────────────────────────────────────────────

const COMMITMENT_ADVANCED_STATUSES = new Set([
  'SOFT_CIRCLED', 'PROPOSED', 'DOCUMENTS_ISSUED', 'SIGNED', 'ACCEPTED',
  'ADMITTED_AT_CLOSE', 'PARTIALLY_FUNDED', 'FUNDED',
])
const COMMITMENT_SIGNED_STATUSES = new Set([
  'SIGNED', 'ACCEPTED', 'ADMITTED_AT_CLOSE', 'PARTIALLY_FUNDED', 'FUNDED',
])
const COMMITMENT_ADMITTED_STATUSES = new Set(['ADMITTED_AT_CLOSE', 'PARTIALLY_FUNDED', 'FUNDED'])
const COMMITMENT_FUNDED_STATUSES = new Set(['FUNDED', 'PARTIALLY_FUNDED'])

function investorKycToTriState(status?: string): 'Approved' | 'In Review' | 'Not Started' {
  const s = String(status || '').toUpperCase()
  if (['APPROVED', 'APPROVED_WITH_CONDITIONS', 'CLEARED'].includes(s)) return 'Approved'
  if (['UNDER_REVIEW', 'DOCUMENTS_REQUESTED', 'IN_PROGRESS'].includes(s)) return 'In Review'
  return 'Not Started'
}

export function isCompliantBlocked(investor?: Record<string, any> | null): boolean {
  if (!investor) return false
  const sanctions = String(investor.sanctionsStatus || '').toUpperCase()
  const kyc = String(investor.kycStatus || '').toUpperCase()
  return sanctions === 'BLOCKED' || sanctions === 'FAILED' || kyc === 'REJECTED'
}

export function mapCommitmentRow(
  raw: Record<string, any>,
  investorsById: Record<string, any>,
  closingsById: Record<string, any>,
  idx = 0,
) {
  const status = String(raw.status || 'INDICATIVE').toUpperCase()
  const investor = raw.investor || investorsById[String(raw.investorId)] || {}
  const legalName = investor.legalName || investor.name || raw.investorName || 'Investor'
  const amount = asNumber(raw.commitmentAmount)
  const fundedAmount = asNumber(raw.fundedAmount)
  const closing = raw.closingId ? closingsById[String(raw.closingId)] : undefined

  const docsStatus: 'Complete' | 'In Progress' | 'Not Started' = COMMITMENT_SIGNED_STATUSES.has(status)
    ? 'Complete'
    : status === 'DOCUMENTS_ISSUED'
      ? 'In Progress'
      : 'Not Started'

  const signatureStatus: 'Signed' | 'Pending' = COMMITMENT_SIGNED_STATUSES.has(status) ? 'Signed' : 'Pending'

  const fundingStatus: 'Ready to Fund' | 'Funding Confirmed' | 'Scheduled' | 'Not Scheduled' =
    COMMITMENT_FUNDED_STATUSES.has(status)
      ? 'Funding Confirmed'
      : status === 'ADMITTED_AT_CLOSE'
        ? 'Ready to Fund'
        : closing
          ? 'Scheduled'
          : 'Not Scheduled'

  const ownerName = investor.relationshipOwnerName || raw.ownerName || ''

  return {
    id: String(raw.id),
    name: legalName,
    logoDomain: '',
    logoLabel: initials(legalName) || 'IN',
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    logoText: '#fff',
    softCircled: COMMITMENT_ADVANCED_STATUSES.has(status),
    hardCircled: COMMITMENT_SIGNED_STATUSES.has(status),
    commitmentAmount: moneyLabel(amount, raw.currency),
    docsStatus,
    kycStatus: investorKycToTriState(investor.kycStatus),
    signatureStatus,
    fundingStatus,
    closeDate: fmtDate(closing?.closingDate) ?? fmtDate(raw.signedAt),
    owner: {
      name: ownerName || '—',
      initials: initials(ownerName || 'NA') || 'NA',
      avatarBg: LOGO_COLORS[(idx + 1) % LOGO_COLORS.length],
    },
    // extra fields for action handlers (not part of the visual mock type)
    status,
    investorId: String(raw.investorId || investor.id || ''),
    opportunityId: raw.opportunityId ? String(raw.opportunityId) : undefined,
    closingId: raw.closingId ? String(raw.closingId) : undefined,
    commitmentAmountRaw: amount,
    fundedAmountRaw: fundedAmount,
    currency: raw.currency || 'USD',
    complianceBlocked: isCompliantBlocked(investor),
    raw,
  }
}

export function closingState(status: string): 'done' | 'current' | 'upcoming' {
  const s = String(status || '').toUpperCase()
  if (['COMPLETED', 'CLOSED', 'DONE'].includes(s)) return 'done'
  if (['IN_PROGRESS', 'READY', 'ACTIVE'].includes(s)) return 'current'
  return 'upcoming'
}

export function closeTypeLabel(closeType?: string): string {
  return String(closeType || 'Close')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

// ─── Mandates / RFPs ─────────────────────────────────────────────────────────

export const MANDATE_ACTIVATION_FLAGS = [
  { key: 'agreementSigned', label: 'Agreement signed' },
  { key: 'kycApproved', label: 'KYC approved' },
  { key: 'guidelinesConfigured', label: 'Investment guidelines configured' },
  { key: 'benchmarkConfigured', label: 'Benchmark configured' },
  { key: 'feesConfigured', label: 'Fees configured' },
  { key: 'reportingConfigured', label: 'Reporting configured' },
  { key: 'custodianConfirmed', label: 'Custodian confirmed' },
  { key: 'openingBalancesVerified', label: 'Opening balances verified' },
  { key: 'assetsReceived', label: 'Assets received' },
] as const

export function mapMandateRow(raw: Record<string, any>, investorsById: Record<string, any>, idx = 0) {
  const investor = raw.investor || investorsById[String(raw.investorId)] || {}
  const legalName = investor.legalName || investor.name || raw.investorName || 'Investor'
  const status = String(raw.status || 'DRAFT').toUpperCase()
  const doneFlags = MANDATE_ACTIVATION_FLAGS.filter((f) => Boolean(raw[f.key])).length
  return {
    id: String(raw.id),
    kind: 'MANDATE' as const,
    name: raw.name || legalName,
    organization: legalName,
    status,
    stage: 'mandate_live' as const,
    mandateSize: raw.expectedAum ? moneyLabel(asNumber(raw.expectedAum), raw.currency) : '—',
    geography: raw.geography || investor.countryCode || investor.country || '—',
    assetClass: raw.assetClass || '—',
    mandateType: 'Mandate',
    rfpDueDate: fmtDate(raw.rfpDueDate) || '—',
    nextStep: status === 'ACTIVE' ? 'Manage mandate' : `Complete ${MANDATE_ACTIVATION_FLAGS.length - doneFlags} activation step(s)`,
    score: null as number | null,
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    logoLabel: initials(legalName) || 'MD',
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    logoText: '#ffffff',
    checklistDone: doneFlags,
    checklistTotal: MANDATE_ACTIVATION_FLAGS.length,
    investorId: String(raw.investorId || investor.id || ''),
    complianceBlocked: isCompliantBlocked(investor),
    raw,
  }
}

export function mapRfpRow(raw: Record<string, any>, investorsById: Record<string, any>, idx = 0) {
  const investor = raw.investor || investorsById[String(raw.investorId)] || {}
  const legalName = raw.institutionName || investor.legalName || investor.name || 'Institution'
  const status = String(raw.status || 'SUBMITTED').toUpperCase()
  const outcome = String(raw.outcome || 'PENDING').toUpperCase()
  return {
    id: String(raw.id),
    kind: 'RFP' as const,
    name: raw.referenceNumber ? `${raw.referenceNumber} — ${legalName}` : legalName,
    organization: legalName,
    status: outcome !== 'PENDING' ? outcome : status,
    stage: 'rfp' as const,
    mandateSize: '—',
    geography: raw.geography || investor.countryCode || investor.country || '—',
    assetClass: raw.assetClass || '—',
    mandateType: 'RFP',
    rfpDueDate: fmtDate(raw.deadline) || '—',
    nextStep:
      outcome === 'WON'
        ? 'Convert to mandate'
        : outcome === 'LOST'
          ? 'Closed — lost'
          : 'Awaiting outcome',
    score: raw.fitScore != null ? asNumber(raw.fitScore) : null,
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    logoLabel: initials(legalName) || 'RF',
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    logoText: '#ffffff',
    investorId: String(raw.investorId || investor.id || ''),
    complianceBlocked: isCompliantBlocked(investor),
    raw,
  }
}

// ─── Onboarding (KYC cases + Mandates) ───────────────────────────────────────

export function mapKycCaseToOnboarding(raw: Record<string, any>, investorsById: Record<string, any>) {
  const investor = raw.investor || investorsById[String(raw.investorId)] || {}
  const legalName = investor.legalName || investor.name || raw.investorName || 'Investor'
  const status = String(raw.status || 'NOT_STARTED').toUpperCase()
  const checklist = [
    { id: 'risk', label: 'Risk rating assessed', done: Boolean(raw.riskRating) },
    { id: 'pep', label: 'PEP screening recorded', done: raw.pepFlag !== undefined && raw.pepFlag !== null },
    {
      id: 'adverse',
      label: 'Adverse media screening recorded',
      done: raw.adverseMediaFlag !== undefined && raw.adverseMediaFlag !== null,
    },
    { id: 'approved', label: 'KYC approved', done: status === 'APPROVED' || status === 'APPROVED_WITH_CONDITIONS' },
  ]
  const done = checklist.filter((c) => c.done).length
  return {
    id: `kyc-${raw.id}`,
    kind: 'KYC' as const,
    investor: legalName,
    investorId: String(raw.investorId || investor.id || ''),
    type: 'LP Commitment' as const,
    kycStatus: status,
    mandateStatus: undefined,
    complianceHold: status === 'REJECTED' || isCompliantBlocked(investor),
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    progress: checklist.length ? Math.round((done / checklist.length) * 100) : 0,
    startedAt: fmtDate(raw.createdAt) || '—',
    campaign: '—',
    checklist,
    raw,
  }
}

export function mapMandateToOnboarding(raw: Record<string, any>, investorsById: Record<string, any>, campaignsById: Record<string, any>) {
  const investor = raw.investor || investorsById[String(raw.investorId)] || {}
  const legalName = investor.legalName || investor.name || raw.investorName || 'Investor'
  const status = String(raw.status || 'DRAFT').toUpperCase()
  const checklist = MANDATE_ACTIVATION_FLAGS.map((f) => ({
    id: f.key,
    label: f.label,
    done: Boolean(raw[f.key]),
  }))
  const done = checklist.filter((c) => c.done).length
  const campaign = raw.campaignId ? campaignsById[String(raw.campaignId)] : undefined
  return {
    id: `mandate-${raw.id}`,
    kind: 'MANDATE' as const,
    investor: legalName,
    investorId: String(raw.investorId || investor.id || ''),
    type: 'Mandate' as const,
    kycStatus: Boolean(raw.kycApproved) ? 'APPROVED' : 'UNDER_REVIEW',
    mandateStatus: status,
    complianceHold: isCompliantBlocked(investor),
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    progress: checklist.length ? Math.round((done / checklist.length) * 100) : 0,
    startedAt: fmtDate(raw.createdAt) || '—',
    campaign: campaign?.name || '—',
    checklist,
    mandateId: String(raw.id),
    raw,
  }
}

// ─── Placement agents ────────────────────────────────────────────────────────

const COMMISSION_STATUS_LABEL: Record<string, string> = {
  ACCRUING: 'Accruing',
  PENDING: 'Accruing',
  INVOICED: 'Accruing',
  PAID: 'Paid',
  SETTLED: 'Paid',
  ON_HOLD: 'On Hold',
  HOLD: 'On Hold',
  BLOCKED: 'On Hold',
}

export function mapPlacementAgentRow(raw: Record<string, any>, idx = 0) {
  const name = raw.legalName || raw.name || 'Placement Agent'
  const geography = Array.isArray(raw.geography)
    ? raw.geography.join(', ')
    : raw.territory || raw.geography || '—'
  const retainer = asNumber(raw.retainer)
  const opportunities = Array.isArray(raw.introducedOpportunities)
    ? raw.introducedOpportunities
    : Array.isArray(raw.opportunities)
      ? raw.opportunities
      : []
  const currency = raw.currency || 'USD'
  return {
    id: String(raw.id),
    name,
    geography,
    feePct: asNumber(raw.commissionPct),
    retainer: retainer ? moneyLabel(retainer) : 'None',
    period: `${fmtDate(raw.appointmentStart) || '—'} – ${fmtDate(raw.appointmentEnd) || '—'}`,
    introducedCount: asNumber(raw.assignedOpportunityCount, opportunities.length),
    commissionStatus: raw.commissionStatus
      ? COMMISSION_STATUS_LABEL[String(raw.commissionStatus).toUpperCase()] || titleCase(raw.commissionStatus)
      : null,
    accruedCommission: asNumber(raw.accruedCommission),
    accruedCommissionLabel: raw.accruedCommission != null ? moneyLabel(raw.accruedCommission, currency) : '—',
    paidCommission: asNumber(raw.paidCommission),
    paidCommissionLabel: raw.paidCommission != null ? moneyLabel(raw.paidCommission, currency) : '—',
    currency,
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
    opportunities: opportunities.map((o: Record<string, any>) => {
      const amountRaw = asNumber(o.indicativeAmount ?? o.softCircleAmount ?? o.signedAmount)
      return {
        id: String(o.id),
        investor: o.investor?.legalName || o.investorName || '—',
        amount: moneyLabel(amountRaw),
        amountRaw,
        eligible: o.eligible !== false,
      }
    }),
    appointedAt: fmtDate(raw.appointmentStart) || '—',
    owner: readableName(raw.ownerName || nestedPersonName(raw.owner)),
    logoLabel: initials(name) || 'PA',
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    raw,
  }
}

export function mapPlacementCommissionRow(raw: Record<string, any>) {
  const status = String(raw.status || raw.commissionStatus || 'ACCRUING').toUpperCase()
  return {
    id: String(raw.id ?? raw.commitmentId ?? Math.random()),
    investor: raw.investor?.legalName || raw.investorName || '—',
    amount: moneyLabel(raw.amount ?? raw.commissionAmount, raw.currency),
    status: COMMISSION_STATUS_LABEL[status] || titleCase(status),
    date: fmtDate(raw.accrualDate || raw.invoicedAt || raw.paidAt || raw.createdAt) || '—',
    raw,
  }
}

export type MonthlyProjectionPoint = { month: string; cumulativeSigned: number }

export function mapForecastScenario(raw: Record<string, any>) {
  const scenarioType = String(raw.scenarioType || 'BASE').toUpperCase()
  const monthlyProjection: MonthlyProjectionPoint[] = Array.isArray(raw.monthlyProjection)
    ? raw.monthlyProjection.map((p: Record<string, any>) => ({
        month: String(p.month ?? ''),
        cumulativeSigned: asNumber(p.cumulativeSigned),
      }))
    : []
  return {
    id: String(raw.id ?? ''),
    scenarioType,
    name: raw.name || scenarioType,
    assumptions: raw.assumptions && typeof raw.assumptions === 'object' ? raw.assumptions : {},
    projectedSigned: asNumber(raw.projectedSigned),
    projectedAum: asNumber(raw.projectedAum),
    projectedFees: asNumber(raw.projectedFees),
    monthlyProjection,
    createdAt: raw.createdAt || raw.updatedAt || null,
    raw,
  }
}

export function mapApprovalRow(raw: Record<string, any>) {
  const status = String(raw.status || raw.decision || 'PENDING').toUpperCase()
  const requestedAt = raw.requestedAt || raw.createdAt
  return {
    id: String(raw.id),
    type: raw.objectType || raw.approvalType || raw.type || '—',
    title: raw.title || raw.subject || raw.summary || `${titleCase(raw.objectType || 'Approval')} request`,
    summary: raw.description || raw.summary || raw.reason || '—',
    campaign: raw.campaignName || raw.campaign?.name || '—',
    investor: raw.investorName || raw.investor?.legalName || '—',
    requestedBy: readableName(raw.requestedByName || raw.requesterName || raw.createdByName || nestedPersonName(raw.requestedBy)),
    requestedAt: requestedAt ? new Date(requestedAt).toLocaleString() : '—',
    priority: raw.priority ? String(raw.priority).toUpperCase() : null,
    status,
    amount: raw.amount != null ? moneyLabel(raw.amount) : undefined,
    decisionNotes: raw.decisionNotes || raw.notes,
    decidedBy: readableName(raw.decidedByName || nestedPersonName(raw.decidedBy), '—'),
    decidedAt: raw.decidedAt ? new Date(raw.decidedAt).toLocaleString() : undefined,
    objectId: raw.objectId,
    objectType: raw.objectType,
    raw,
  }
}

export function mapAuditLogRow(raw: Record<string, any>) {
  const when = raw.createdAt || raw.timestamp || raw.occurredAt
  return {
    id: String(raw.id ?? raw._id ?? `${raw.objectType || 'log'}-${when || Math.random()}`),
    timestamp: when ? new Date(when).toLocaleString() : '—',
    user: readableName(raw.userName || raw.actorName || nestedPersonName(raw.user), 'System'),
    action: raw.action || raw.eventType || raw.operation || '—',
    objectType: raw.objectType || '—',
    objectName: readableName(raw.objectName || raw.objectLabel || raw.entityName, 'Name unavailable'),
    summary: raw.summary || raw.description || raw.changeDescription || raw.message || raw.reason || 'No summary supplied',
    ip: raw.ipAddress || raw.ip || '—',
    details: raw.details || raw.reason || '',
    previousValue: raw.previousValue,
    newValue: raw.newValue,
    raw,
  }
}

/* ─── Settings (pipelines / stage gates / notifications / roles) ─────────── */

export type PipelineStageRow = {
  id: string
  stageCode: string
  name: string
  probability: number | null
  sortOrder: number
  raw: Record<string, any>
}

export function mapPipelineStageRow(raw: Record<string, any>): PipelineStageRow {
  return {
    id: String(raw.id ?? raw.stageCode),
    stageCode: String(raw.stageCode ?? raw.id ?? ''),
    name: raw.stageName || raw.stageCode || 'Stage',
    probability: raw.winProbabilityPct != null ? asNumber(raw.winProbabilityPct) : null,
    sortOrder: asNumber(raw.sortOrder, 0),
    raw,
  }
}

/** Maps a `pipelines.PE_VC` / `pipelines.AM` node from `GET /fundraising/settings`. */
export function mapPipelineStages(node: unknown): PipelineStageRow[] {
  const stages = Array.isArray((node as any)?.stages) ? (node as any).stages : []
  return [...stages]
    .sort((a, b) => asNumber(a.sortOrder) - asNumber(b.sortOrder))
    .map(mapPipelineStageRow)
}

/** Boolean gate flags on `GET /fundraising/settings` → `stageGates[]`. */
export const STAGE_GATE_FLAGS: { key: string; label: string }[] = [
  { key: 'requiresIndicativeAmount', label: 'Indicative amount recorded' },
  { key: 'requiresSoftCircle', label: 'Soft circle recorded' },
  { key: 'requiresProposed', label: 'Proposed amount recorded' },
  { key: 'requiresSigned', label: 'Signed amount recorded' },
  { key: 'requiresKycNotBlocked', label: 'KYC not blocked' },
  { key: 'requiresPreviousStageChecklist', label: 'Previous stage checklist complete' },
]

export function mapStageGateRow(raw: Record<string, any>) {
  const requirements = STAGE_GATE_FLAGS.filter((f) => Boolean(raw[f.key])).map((f) => f.label)
  return {
    id: String(raw.stageCode ?? raw.id),
    stageCode: String(raw.stageCode ?? ''),
    stageName: raw.stageName ? String(raw.stageName) : titleCase(raw.stageCode),
    requirements,
    raw,
  }
}

export function mapNotificationRow(raw: Record<string, any>) {
  const eventLabel = titleCase(raw.eventKey || raw.key || 'Notification')
  const channel = raw.channel ? titleCase(raw.channel) : null
  return {
    id: String(raw.id ?? raw.eventKey),
    eventKey: raw.eventKey,
    label: channel ? `${eventLabel} (${channel})` : eventLabel,
    enabled: Boolean(raw.enabled),
    raw,
  }
}

export function mapSettingsRole(raw: Record<string, any>) {
  return {
    id: String(raw.id ?? raw.key ?? raw.name ?? Math.random()),
    name: raw.name || raw.roleName || (raw.key ? titleCase(raw.key) : 'Role'),
    summary: raw.summary || raw.description || '—',
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    raw,
  }
}

export function titleCase(value: unknown): string {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Best-effort extraction of a row array from an analytics/report payload of unknown shape. */
export function toRowsArray(data: unknown): Record<string, any>[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, any>
    for (const key of ['items', 'rows', 'stages', 'bySource', 'sources', 'byStage', 'byOwner', 'data']) {
      if (Array.isArray(obj[key])) return obj[key]
    }
    const entries = Object.entries(obj).filter(([, v]) => v != null && typeof v !== 'object')
    if (entries.length) return entries.map(([k, v]) => ({ label: titleCase(k), value: v }))
  }
  return []
}

export function rowColumns(rows: Record<string, any>[]): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0]).filter((k) => k !== 'raw')
}

export function formatCell(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(formatCell).join(', ')
  return String(value)
}

export { moneyLabel, asNumber }
