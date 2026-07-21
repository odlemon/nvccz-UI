#!/usr/bin/env node
/**
 * Trading lifecycle API probe — walkthrough prep.
 * Tests order state transitions without waiting for slow execute.
 */
const API = process.env.API_BASE || 'http://localhost:3009/api'
const EMAIL = process.env.UAT_EMAIL || 'admin@nts.com'
const PASSWORD = process.env.UAT_PASSWORD || 'admin123'

const log = []

async function req(method, path, body, token, timeoutMs = 30000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method === 'POST' ? { 'Idempotency-Key': `lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => null)
    return { status: res.status, json, ok: res.ok && json?.success !== false }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD })
  const token = login.json?.token
  if (!token) {
    console.error('Login failed', login.json?.message)
    process.exit(1)
  }

  const orders = await req('GET', '/investment-ops/orders?page=1&pageSize=50', null, token)
  const items = orders.json?.data?.items ?? []
  const byStatus = {}
  for (const o of items) {
    const s = String(o.status ?? 'UNKNOWN')
    byStatus[s] = (byStatus[s] || 0) + 1
  }
  log.push({ step: 'Order inventory', detail: JSON.stringify(byStatus) })

  const draft = items.find((o) => o.status === 'DRAFT')
  const submitted = items.find((o) => o.status === 'SUBMITTED')
  const sent = items.find((o) => o.status === 'SENT_TO_BROKER')

  if (draft) {
    const sub = await req('POST', `/investment-ops/orders/${draft.id}/submit`, { expectedVersion: draft.version }, token)
    log.push({ step: 'Submit DRAFT', id: draft.id, ok: sub.ok, status: sub.status, message: sub.json?.message })
  } else {
    log.push({ step: 'Submit DRAFT', skipped: 'no DRAFT order in seed' })
  }

  if (submitted) {
    const appr = await req('POST', `/investment-ops/orders/${submitted.id}/approve`, { expectedVersion: submitted.version }, token)
    log.push({ step: 'Approve SUBMITTED', id: submitted.id, ok: appr.ok, status: appr.status })
  } else {
    log.push({ step: 'Approve SUBMITTED', skipped: 'no SUBMITTED order' })
  }

  const compliance = await req('GET', '/investment-ops/compliance/results?pageSize=5', null, token)
  const compN = compliance.json?.data?.items?.length ?? 0
  log.push({ step: 'Compliance results', count: compN, ok: compliance.ok })

  const trades = await req('GET', '/investment-ops/trades?pageSize=5', null, token)
  const tradeN = trades.json?.data?.items?.length ?? (Array.isArray(trades.json?.data) ? trades.json.data.length : 0)
  log.push({ step: 'Trades on blotter', count: tradeN, ok: trades.ok })

  if (sent) {
    log.push({ step: 'Execute probe', note: 'SENT_TO_BROKER exists; execute skipped (BA-2 ~4min). Use pre-staged EXECUTED/SETTLED trades for demo.' })
  }

  const stm = await req('GET', '/investment-ops/client-statements?page=1&pageSize=3', null, token)
  const stmItem = stm.json?.data?.items?.[0]
  if (stmItem) {
    const prev = await req('GET', `/investment-ops/client-statements/${stmItem.id}/preview`, null, token)
    log.push({ step: 'Statement preview', id: stmItem.id, ok: prev.ok, status: stmItem.status })
  }

  const exc = await req('GET', '/investment-ops/reconciliation-exceptions?page=1&pageSize=5', null, token)
  const excItems = exc.json?.data?.items ?? []
  log.push({
    step: 'Exceptions',
    count: excItems.length,
    statuses: excItems.map((e) => e.status).join(', ') || 'none',
    openCount: excItems.filter((e) => ['OPEN', 'INVESTIGATING'].includes(String(e.status).toUpperCase())).length,
  })

  console.log(JSON.stringify(log, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
