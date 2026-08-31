export const FUNDING_APPLICATION_DRAFT_KEY = "arcus-funding-application-draft-v1"

export const FUNDING_STEPS = [
  "Company Information",
  "Ownership & Governance",
  "Business & Market",
  "Financial Information",
  "Funding Request",
  "Impact & ESG",
  "Declarations & Consent",
] as const

export type FundingStepId = (typeof FUNDING_STEPS)[number]

export type UploadedDoc = {
  documentType: string
  fileName: string
  fileUrl: string
  fileSize: number
}

export type UseOfFundsRow = {
  id: string
  category: string
  description: string
  allocation: string
}

export type FundingApplicationDraft = {
  version: 1
  stepIndex: number
  updatedAt: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  businessName: string
  businessDescription: string
  industry: string
  businessStage: string
  foundingDate: string
  ownershipPercent: string
  boardComposition: string
  keyShareholders: string
  governanceNotes: string
  marketSize: string
  competitors: string
  goToMarket: string
  productOverview: string
  revenueModel: string
  historicalRevenue: string
  projectedRevenue: string
  burnRate: string
  runwayMonths: string
  fundingRound: string
  requestedAmount: string
  proposedOwnership: string
  preMoneyValuation: string
  targetCloseDate: string
  useOfFunds: UseOfFundsRow[]
  fundingRationale: string
  milestones: string
  existingInvestors: string
  impactStatement: string
  esgPractices: string
  jobsCreated: string
  declarationAccurate: boolean
  declarationConsent: boolean
  documents: UploadedDoc[]
}

export function emptyDraft(): FundingApplicationDraft {
  return {
    version: 1,
    stepIndex: 0,
    updatedAt: new Date().toISOString(),
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantAddress: "",
    businessName: "",
    businessDescription: "",
    industry: "",
    businessStage: "",
    foundingDate: "",
    ownershipPercent: "",
    boardComposition: "",
    keyShareholders: "",
    governanceNotes: "",
    marketSize: "",
    competitors: "",
    goToMarket: "",
    productOverview: "",
    revenueModel: "",
    historicalRevenue: "",
    projectedRevenue: "",
    burnRate: "",
    runwayMonths: "",
    fundingRound: "",
    requestedAmount: "",
    proposedOwnership: "",
    preMoneyValuation: "",
    targetCloseDate: "",
    useOfFunds: [],
    fundingRationale: "",
    milestones: "",
    existingInvestors: "",
    impactStatement: "",
    esgPractices: "",
    jobsCreated: "",
    declarationAccurate: false,
    declarationConsent: false,
    documents: [],
  }
}

export function loadDraft(): FundingApplicationDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(FUNDING_APPLICATION_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FundingApplicationDraft
    if (!parsed || parsed.version !== 1) return null
    return {
      ...emptyDraft(),
      ...parsed,
      useOfFunds: Array.isArray(parsed.useOfFunds) ? parsed.useOfFunds : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      declarationAccurate: Boolean(parsed.declarationAccurate),
      declarationConsent: Boolean(parsed.declarationConsent),
      stepIndex: Math.min(
        Math.max(0, Number(parsed.stepIndex) || 0),
        FUNDING_STEPS.length - 1,
      ),
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: FundingApplicationDraft) {
  if (typeof window === "undefined") return
  const next = { ...draft, updatedAt: new Date().toISOString(), version: 1 as const }
  window.localStorage.setItem(FUNDING_APPLICATION_DRAFT_KEY, JSON.stringify(next))
}

export function clearDraft() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(FUNDING_APPLICATION_DRAFT_KEY)
}

export function newUseOfFundsRow(): UseOfFundsRow {
  return {
    id: `uof-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    category: "",
    description: "",
    allocation: "",
  }
}

export const REQUIRED_DOC_TYPES = [
  "BUSINESS_PLAN",
  "PROOF_OF_CONCEPT",
  "MARKET_RESEARCH",
  "PROJECTED_CASH_FLOWS",
] as const

export const OPTIONAL_DOC_TYPES = [
  "FINANCIAL_MODEL",
  "CAP_TABLE",
  "HISTORICAL_FINANCIALS",
] as const
