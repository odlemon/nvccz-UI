/** Shared helpers for Investment Ops + Stock Picker Cash clients. */

export type OpsEnvelope<T> = {
  success: boolean
  message?: string
  data?: T
  code?: string
  details?: unknown
  retryable?: boolean
  meta?: { requestId?: string; serverTime?: string; [key: string]: unknown }
  [key: string]: unknown
}

export type OpsPaged<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Normalize list payloads that may be bare arrays or `{ items, page, … }`. */
export function unwrapList<T>(data: unknown): T[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as T[]
  if (typeof data === 'object' && Array.isArray((data as OpsPaged<T>).items)) {
    return (data as OpsPaged<T>).items
  }
  return []
}

export function unwrapPaged<T>(data: unknown, fallbackPage = 1, fallbackSize = 20): OpsPaged<T> {
  if (data == null) {
    return { items: [], page: fallbackPage, pageSize: fallbackSize, total: 0, totalPages: 0 }
  }
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      page: fallbackPage,
      pageSize: fallbackSize,
      total: data.length,
      totalPages: 1,
    }
  }
  const d = data as Partial<OpsPaged<T>>
  const items = Array.isArray(d.items) ? d.items : []
  return {
    items,
    page: Number(d.page ?? fallbackPage),
    pageSize: Number(d.pageSize ?? fallbackSize),
    total: Number(d.total ?? items.length),
    totalPages: Number(d.totalPages ?? (items.length ? 1 : 0)),
  }
}

export function newIdempotencyKey(prefix = 'io'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${rand}`.slice(0, 200)
}

export function idempotencyHeaders(key?: string): HeadersInit {
  return { 'Idempotency-Key': key ?? newIdempotencyKey() }
}

/** Pass through decimal strings; coerce numbers to fixed string for display/API. */
export function moneyAsString(value: unknown, digits = 2): string {
  if (value == null || value === '') return '0.00'
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(digits)
  return String(value)
}

export function formatMoneyDisplay(value: unknown, digits = 2): string {
  const raw = moneyAsString(value, digits)
  const n = Number(raw.replace(/,/g, ''))
  if (!Number.isFinite(n)) return raw
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** Prefer `message` + optional envelope `code` for banners/toasts. */
export function formatOpsError(err: unknown, fallback = 'Request failed'): string {
  if (err == null) return fallback
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    const o = err as { message?: string; code?: string; error?: string; success?: boolean }
    const message = o.message || o.error || fallback
    if (o.code) return `${message} (${o.code})`
    return message
  }
  return fallback
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}
