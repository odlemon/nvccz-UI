/**
 * Collect FP&A API gaps during runtime for the backend feedback MD.
 * Safe for client bundles; dumps to sessionStorage + console.
 */

import { safeJsonStringify, sanitizeForJson } from '@/lib/utils/safe-json'

export type FpaApiGap = {
  at: string
  method?: string
  path: string
  status?: number
  request?: unknown
  response?: unknown
  message: string
  impact: string
  category: 'broken' | 'mismatch' | 'missing' | 'behavior'
}

const KEY = 'fpa-api-gaps'

export function logFpaGap(gap: Omit<FpaApiGap, 'at'> & { at?: string }) {
  const entry: FpaApiGap = {
    at: gap.at ?? new Date().toISOString(),
    method: gap.method,
    path: gap.path,
    status: gap.status,
    request: gap.request,
    response: gap.response != null ? sanitizeForJson(gap.response) : undefined,
    message: gap.message,
    impact: gap.impact,
    category: gap.category,
  }

  if (typeof window !== 'undefined') {
    try {
      const prev: FpaApiGap[] = JSON.parse(sessionStorage.getItem(KEY) || '[]')
      prev.push(entry)
      sessionStorage.setItem(KEY, safeJsonStringify(prev.slice(-200)))
    } catch {
      /* ignore */
    }
  }

  // eslint-disable-next-line no-console
  console.warn('[FP&A API gap]', entry)
  return entry
}

export function getFpaGaps(): FpaApiGap[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function clearFpaGaps() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(KEY)
}

export function errorMessage(err: unknown, fallback = 'Request failed'): string {
  if (!err) return fallback
  if (typeof err === 'string') return err
  const e = err as {
    message?: string
    response?: { message?: string; code?: string; errors?: Array<{ message?: string }> }
    status?: number
  }
  const first = e.response?.errors?.[0]?.message
  return first || e.response?.message || e.message || fallback
}

/** Extract setup/validate field errors from ApiError.response. */
export function setupErrorsFrom(err: unknown): Array<{
  code: string
  step?: string
  message: string
  field?: string
}> {
  const e = err as { response?: { errors?: Array<{ code?: string; step?: string; message?: string; field?: string }> } }
  const list = e.response?.errors
  if (!Array.isArray(list)) return []
  return list.map((x) => ({
    code: x.code || 'VALIDATION',
    step: x.step,
    message: x.message || 'Validation failed',
    field: x.field,
  }))
}
