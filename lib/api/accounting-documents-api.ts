/**
 * Accounting Document Vault — backend contract: GET/POST /api/accounting/documents
 * (nvccz/src/routes/accountingDocumentRoutes.ts, controller AccountingDocumentController,
 * model AccountingDocument in prisma/schema.prisma). Company-wide, flat, no delete endpoint
 * (matches the FundDocument precedent it was copied from — that has none either).
 */
import { apiClient } from './api-client'

export interface AccountingDocument {
  id: string
  name: string
  category: string
  fileUrl: string
  storagePath: string | null
  mimeType: string | null
  fileSizeBytes: number | null
  uploadedById: string | null
  createdAt: string
  updatedAt: string
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

const BASE = '/accounting/documents'

export async function getAccountingDocuments(): Promise<ApiRes<AccountingDocument[]>> {
  return apiClient.get<ApiRes<AccountingDocument[]>>(BASE)
}

export async function uploadAccountingDocument(file: File, category: string): Promise<ApiRes<AccountingDocument>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  return apiClient.postFormData<ApiRes<AccountingDocument>>(BASE, formData)
}
