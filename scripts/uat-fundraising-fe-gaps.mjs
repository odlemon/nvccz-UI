/**
 * Smoke test for FE gap APIs: settings, meetings, documents, engagement, curve, commissions, commitment checklist.
 * Usage: npm run uat:fundraising:fe-gaps
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
loadEnvLocal()

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api').replace(/\/$/, '')
const EMAIL = process.env.FR_UAT_EMAIL || 'admin@nts.com'
const PASSWORD = process.env.FR_UAT_PASSWORD || 'admin123'

let passed = 0
let failed = 0
const ok = (l) => { passed++; console.log(`  ✓ ${l}`) }
const fail = (l, e) => { failed++; console.error(`  ✗ ${l}`); if (e) console.error(`    ${typeof e === 'string' ? e : e.message || JSON.stringify(e)}`) }

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* ignore */ }
  return { res, json, status: res.status }
}
const dataOf = (j) => (j?.data !== undefined ? j.data : j)

async function main() {
  console.log(`\nFundraising FE-gaps UAT → ${BASE}\n`)

  let token
  {
    const { res, json } = await req('POST', '/auth/login', { body: { email: EMAIL, password: PASSWORD } })
    token = json?.token || json?.data?.token
    if (res.ok && token) ok('login')
    else { fail('login', json); process.exit(1) }
  }

  // Settings
  {
    const { res, json } = await req('GET', '/fundraising/settings', { token })
    const d = dataOf(json)
    if (res.ok && d && (d.pipelines || d.stageGates || d.amountTypes)) ok('GET /fundraising/settings')
    else if (res.status === 404) fail('GET settings', '404 — migrate FE gaps on BE?')
    else fail('GET settings', json?.error || json)
  }

  // Meetings list
  {
    const { res, json } = await req('GET', '/fundraising/meetings?pageSize=10', { token })
    if (res.ok) ok('GET /fundraising/meetings')
    else fail('GET meetings', json?.error || json)
  }

  // Documents list
  {
    const { res, json } = await req('GET', '/fundraising/documents?pageSize=10', { token })
    if (res.ok) ok('GET /fundraising/documents')
    else fail('GET documents', json?.error || json)
  }

  // Find a campaign for engagement / curve
  let campaignId
  {
    const { res, json } = await req('GET', '/fundraising/campaigns', { token })
    const list = Array.isArray(dataOf(json)) ? dataOf(json) : dataOf(json)?.items || []
    campaignId = list.find((c) => String(c.status).toUpperCase() === 'ACTIVE')?.id || list[0]?.id
    if (campaignId) ok(`campaign for extras (${campaignId})`)
    else fail('list campaigns', 'none found — run uat:fundraising:srd first')
  }

  if (campaignId) {
    const { res, json } = await req('GET', `/fundraising/campaigns/${campaignId}/engagement`, { token })
    if (res.ok && dataOf(json)) ok('GET …/campaigns/:id/engagement')
    else fail('engagement', json?.error || json)
  }

  // Forecast scenarios + curve
  if (campaignId) {
    const { res, json } = await req('GET', `/fundraising/forecasts/scenarios?campaignId=${campaignId}`, { token })
    const scenarios = Array.isArray(dataOf(json)) ? dataOf(json) : dataOf(json)?.items || []
    if (res.ok) ok(`GET forecast scenarios (${scenarios.length})`)
    else fail('forecast scenarios', json?.error || json)

    const sid = scenarios[0]?.id
    if (sid) {
      const curve = await req('GET', `/fundraising/forecasts/scenarios/${sid}/curve`, { token })
      if (curve.res.ok) ok('GET forecast scenario curve')
      else fail('forecast curve', curve.json?.error || curve.json)
    }
  }

  // Placement agents + commissions
  {
    const { res, json } = await req('GET', '/fundraising/placement-agents', { token })
    const agents = Array.isArray(dataOf(json)) ? dataOf(json) : dataOf(json)?.items || []
    if (res.ok) ok(`GET placement-agents (${agents.length})`)
    else fail('placement-agents', json?.error || json)
    if (agents[0]?.id) {
      const c = await req('GET', `/fundraising/placement-agents/${agents[0].id}/commissions`, { token })
      if (c.res.ok) ok('GET …/placement-agents/:id/commissions')
      else fail('commissions', c.json?.error || c.json)
    }
  }

  // Commitment checklist
  {
    const { res, json } = await req('GET', '/fundraising/commitments', { token })
    const items = Array.isArray(dataOf(json)) ? dataOf(json) : dataOf(json)?.items || []
    if (res.ok) ok(`GET commitments (${items.length})`)
    else fail('commitments', json?.error || json)
    if (items[0]?.id) {
      const cl = await req('GET', `/fundraising/commitments/${items[0].id}/checklist`, { token })
      if (cl.res.ok) ok('GET …/commitments/:id/checklist')
      else fail('commitment checklist', cl.json?.error || cl.json)
    }
  }

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
