/**
 * Timesheets & Projects — backend contract: /api/accounting/timesheets, /api/accounting/projects
 * (nvccz/src/routes/timesheetRoutes.ts, projectRoutes.ts; models Project, Timesheet, TimesheetEntry).
 * Genuinely new domain, no legacy backend to inherit shape from.
 */
import { apiClient } from './api-client'

export interface TimesheetEntryRow {
  id: string
  timesheetId: string
  projectId: string
  date: string
  hours: string
  billable: boolean
  notes: string | null
  project: Project
}

export interface Timesheet {
  id: string
  userId: string
  weekEnding: string
  status: string
  submittedAt: string | null
  approvedById: string | null
  approvedAt: string | null
  user: { id: string; firstName: string; lastName: string; email: string }
  entries: TimesheetEntryRow[]
}

export interface Project {
  id: string
  name: string
  clientName: string | null
  projectType: string | null
  budget: string | null
  status: string
  isActive: boolean
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export async function getPendingApprovalTimesheets(): Promise<ApiRes<Timesheet[]>> {
  return apiClient.get<ApiRes<Timesheet[]>>('/accounting/timesheets/pending-approval')
}

export async function getMyTimesheets(): Promise<ApiRes<Timesheet[]>> {
  return apiClient.get<ApiRes<Timesheet[]>>('/accounting/timesheets/mine')
}

export async function getProjects(): Promise<ApiRes<Project[]>> {
  return apiClient.get<ApiRes<Project[]>>('/accounting/projects')
}

export async function approveTimesheet(id: string): Promise<ApiRes<Timesheet>> {
  return apiClient.post<ApiRes<Timesheet>>(`/accounting/timesheets/${id}/approve`, {})
}

export async function returnTimesheet(id: string): Promise<ApiRes<Timesheet>> {
  return apiClient.post<ApiRes<Timesheet>>(`/accounting/timesheets/${id}/return`, {})
}
