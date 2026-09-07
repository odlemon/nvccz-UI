/**
 * Period Close checklist — backend contract: /api/accounting/close-tasks
 * (nvccz/src/routes/accountingCloseTaskRoutes.ts, AccountingCloseTaskController, model
 * AccountingCloseTask). The real period-lock mechanism itself lives at
 * /api/accounting/fiscal-calendar (locks/draft, locks/commit) — see accounting-api.ts /
 * cashbook-api.ts for that surface; this file only covers the checklist layer sitting in
 * front of it.
 */
import { apiClient } from './api-client'

export interface CloseTaskPerson {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface AccountingCloseTask {
  id: string
  fiscalPeriodId: string
  workstream: string
  task: string
  ownerId: string | null
  dueAt: string | null
  status: string
  dependsOnId: string | null
  completedById: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  owner: CloseTaskPerson | null
  completedBy: CloseTaskPerson | null
  dependsOn: { id: string; task: string; status: string } | null
}

export interface FiscalPeriod {
  id: string
  periodNumber: number
  startDate: string
  endDate: string
  status: string
  moduleLocks: Array<{ moduleCode: string; lockStatus: string; reason: string | null }>
}

export interface FiscalCalendar {
  lockConfigVersion: number
  policy: { lockedPeriodPolicy: string; allowOverridePosting: boolean; glErrorBatchEnabled: boolean }
  fiscalYears: Array<{ fiscalYear: { id: string; startDate: string; endDate: string }; periods: FiscalPeriod[] }>
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export async function getFiscalCalendar(): Promise<ApiRes<FiscalCalendar>> {
  return apiClient.get<ApiRes<FiscalCalendar>>('/accounting/fiscal-calendar')
}

export async function getCloseTasks(fiscalPeriodId: string): Promise<ApiRes<AccountingCloseTask[]>> {
  return apiClient.get<ApiRes<AccountingCloseTask[]>>(`/accounting/close-tasks/periods/${fiscalPeriodId}/tasks`)
}

export async function updateCloseTaskStatus(taskId: string, status: string): Promise<ApiRes<AccountingCloseTask>> {
  return apiClient.patch<ApiRes<AccountingCloseTask>>(`/accounting/close-tasks/tasks/${taskId}`, { status })
}

export async function getCanLockPeriod(fiscalPeriodId: string): Promise<ApiRes<{ canLock: boolean; openTaskCount: number }>> {
  return apiClient.get<ApiRes<{ canLock: boolean; openTaskCount: number }>>(`/accounting/close-tasks/periods/${fiscalPeriodId}/can-lock`)
}

export async function saveLockDraft(draft: unknown): Promise<ApiRes<unknown>> {
  return apiClient.put<ApiRes<unknown>>('/accounting/fiscal-calendar/locks/draft', { draft })
}

export async function commitLockDraft(reason?: string): Promise<ApiRes<unknown>> {
  return apiClient.post<ApiRes<unknown>>('/accounting/fiscal-calendar/locks/commit', { reason })
}
