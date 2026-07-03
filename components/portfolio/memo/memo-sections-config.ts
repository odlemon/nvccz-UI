import type { MemoSections } from "@/lib/api/investment-memo-api"

export type SectionKey = Exclude<keyof MemoSections, "overallScore">

export interface SectionConfig {
  key: SectionKey
  label: string
  richText: boolean
}

export const MEMO_SECTIONS: SectionConfig[] = [
  { key: "executiveSummary", label: "Executive Summary", richText: true },
  { key: "investmentThesis", label: "Investment Thesis", richText: true },
  { key: "marketOpportunity", label: "Market Opportunity", richText: true },
  { key: "companyOverview", label: "Company Overview", richText: true },
  { key: "financialAnalysis", label: "Financial Analysis", richText: true },
  { key: "risksAndMitigants", label: "Risks & Mitigants", richText: true },
  { key: "dealTerms", label: "Deal Terms", richText: false },
  { key: "recommendation", label: "Recommendation", richText: false },
  { key: "additionalInformation", label: "Additional Information", richText: true },
]

// Strips HTML tags before checking for real content, since rich-text sections
// save as HTML and an empty editor still produces "<p></p>".
export function isSectionFilled(value: string | null | undefined): boolean {
  if (!value) return false
  const text = value.replace(/<[^>]*>/g, "").trim()
  return text.length > 0
}
