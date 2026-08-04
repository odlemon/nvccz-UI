/** Fundraising KYC step id / index → Next path */
export const FR_KYC_STEPS = [
  { index: 0, id: 'applicant', path: '/fundraising-kyc', name: 'Applicant profile' },
  { index: 1, id: 'identity', path: '/fundraising-kyc/identity', name: 'Identity and contact' },
  { index: 2, id: 'liveness', path: '/fundraising-kyc/liveness', name: 'Selfie and liveness' },
  { index: 3, id: 'ownership', path: '/fundraising-kyc/ownership', name: 'Ownership and control' },
  { index: 4, id: 'investment', path: '/fundraising-kyc/investment', name: 'Investment and funds' },
  { index: 5, id: 'compliance', path: '/fundraising-kyc/compliance', name: 'Compliance declarations' },
  { index: 6, id: 'documents', path: '/fundraising-kyc/documents', name: 'Documents and signature' },
  { index: 7, id: 'review', path: '/fundraising-kyc/review', name: 'Review and submit' },
] as const

export const FR_KYC_PAGE_TO_PATH: Record<string, string> = {
  'applicant': '/fundraising-kyc',
  'identity': '/fundraising-kyc/identity',
  'liveness': '/fundraising-kyc/liveness',
  'ownership': '/fundraising-kyc/ownership',
  'investment': '/fundraising-kyc/investment',
  'compliance': '/fundraising-kyc/compliance',
  'documents': '/fundraising-kyc/documents',
  'review': '/fundraising-kyc/review',
}

export const FR_KYC_PATH_TO_INDEX: Record<string, number> = Object.fromEntries(
  FR_KYC_STEPS.map((s) => [s.path, s.index])
)

export function pathToFrKycStep(pathname: string): number {
  if (pathname in FR_KYC_PATH_TO_INDEX) return FR_KYC_PATH_TO_INDEX[pathname]
  if (pathname.startsWith('/fundraising-kyc/')) {
    const seg = pathname.replace('/fundraising-kyc/', '').split('/')[0]
    const hit = FR_KYC_STEPS.find((s) => s.id === seg)
    if (hit) return hit.index
  }
  return 0
}

export function frKycStepToPath(step: number): string {
  return FR_KYC_STEPS[step]?.path || '/fundraising-kyc'
}
