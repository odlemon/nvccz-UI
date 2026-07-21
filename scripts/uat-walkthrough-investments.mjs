#!/usr/bin/env node
/**
 * Walkthrough UAT — Reconciliation, Client Statements, Trading (API smoke).
 * Usage: node scripts/uat-walkthrough-investments.mjs
 * Env: API_BASE (default http://localhost:3009/api), UAT_EMAIL, UAT_PASSWORD
 */
const API = process.env.API_BASE || 'http://localhost:3009/api'
const EMAIL = process.env.UAT_EMAIL || 'admin@nts.com'
const PASSWORD = process.env.UAT_PASSWORD || 'admin123'

const results = []

function ok(label, detail = '') {
  results.push({ label, status: 'PASS', detail })
  console.log('✓', label, detail)
}
function fail(label, detail = '') {
  results.push({ label, status: 'FAIL', detail })
  console.log('✗', label, detail)
}

async function req(method, path, body, token) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method === 'POST' ? { 'Idempotency-Key': `uat-${Date.now()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    try {
      json = await res.json()
    } catch {
      json = null
    }
    return { status: res.status, json, ok: res.ok && json?.success !== false }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD })
  const token = login.json?.token
  if (!token) {
    fail('Login', login.json?.message || `HTTP ${login.status}`)
    process.exit(1)
  }
  ok('Login', EMAIL)

  const recon = [
    ['/investment-ops/cash-overview', 'Cash overview'],
    ['/investment-ops/client-cash-accounts?page=1&pageSize=5', 'Client accounts'],
    ['/investment-ops/reconciliation-batches?page=1&pageSize=5', 'Recon batches'],
    ['/investment-ops/reconciliation-exceptions?page=1&pageSize=5', 'Exceptions'],
    ['/investment-ops/broker-custodian/workspace', 'Broker workspace'],
    ['/investment-ops/cash-ledger?view=LINES&pageSize=10', 'Cash ledger lines'],
    ['/investment-ops/fund-cash-summary', 'Fund cash summary'],
  ]
  for (const [path, label] of recon) {
    const r = await req('GET', path, null, token)
    const n = r.json?.data?.items?.length ?? (Array.isArray(r.json?.data) ? r.json.data.length : null)
    r.ok ? ok(`Recon: ${label}`, n != null ? `${n} rows` : '') : fail(`Recon: ${label}`, r.json?.message || `HTTP ${r.status}`)
  }

  const stm = await req('GET', '/investment-ops/client-statements?page=1&pageSize=5', null, token)
  const stmId = stm.json?.data?.items?.[0]?.id
  stm.ok ? ok('Statements list', stmId || 'empty') : fail('Statements list', stm.json?.message)
  if (stmId) {
    const dl = await req('GET', `/investment-ops/client-statements/${stmId}/download?acceptPdf=true`, null, token)
    dl.ok ? ok('Statement download', dl.json?.data?.contentBase64 ? 'contentBase64' : 'envelope') : fail('Statement download', dl.json?.message)
  }

  const trading = [
    ['/investment-ops/orders?page=1&pageSize=10', 'Orders'],
    ['/investment-ops/trades', 'Trades'],
    ['/investment-ops/compliance/rules', 'Compliance rules'],
    ['/investment-ops/compliance/results?pageSize=10', 'Compliance results'],
  ]
  for (const [path, label] of trading) {
    const r = await req('GET', path, null, token)
    const n = r.json?.data?.items?.length ?? (Array.isArray(r.json?.data) ? r.json.data.length : null)
    r.ok ? ok(`Trading: ${label}`, n != null ? `${n} rows` : '') : fail(`Trading: ${label}`, r.json?.message || `HTTP ${r.status}`)
  }

  const summary = { pass: results.filter((r) => r.status === 'PASS').length, fail: results.filter((r) => r.status === 'FAIL').length }
  console.log('\n---', summary.pass, 'passed,', summary.fail, 'failed ---')
  process.exit(summary.fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
