/**
 * Happy-path smoke against Fundraising SRD API.
 * Order: login → investor → contact → campaign → activate → opportunity → board → transition → amount patch → 360
 *
 * Usage: npm run uat:fundraising:srd
 * Env: NEXT_PUBLIC_API_BASE_URL (default http://localhost:3002/api)
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api').replace(/\/$/, '')
const EMAIL = process.env.FR_UAT_EMAIL || 'admin@nts.com'
const PASSWORD = process.env.FR_UAT_PASSWORD || 'admin123'

let passed = 0
let failed = 0

function ok(label) {
  passed++
  console.log(`  ✓ ${label}`)
}

function fail(label, err) {
  failed++
  console.error(`  ✗ ${label}`)
  if (err) console.error(`    ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}`)
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  return { res, json, status: res.status }
}

function dataOf(json) {
  if (json?.data !== undefined) return json.data
  return json
}

async function main() {
  console.log(`\nFundraising SRD UAT → ${BASE}\n`)

  // 1. Login
  let token
  {
    const { res, json } = await req('POST', '/auth/login', {
      body: { email: EMAIL, password: PASSWORD },
    })
    token = json?.token || json?.data?.token || json?.accessToken
    if (res.ok && token) ok('login')
    else {
      fail('login', json?.error?.message || json?.message || `HTTP ${res.status}`)
      process.exit(1)
    }
  }

  const stamp = Date.now()

  // 2. Investor
  let investorId
  {
    const { res, json } = await req('POST', '/investors', {
      token,
      body: {
        legalName: `UAT Investor ${stamp}`,
        investorType: 'PENSION_FUND',
        countryCode: 'ZW',
        jurisdiction: 'Zimbabwe',
        baseCurrency: 'USD',
        estimatedAum: 100000000,
        kycStatus: 'NOT_STARTED',
        sanctionsStatus: 'NOT_SCREENED',
      },
    })
    investorId = dataOf(json)?.id
    if (res.ok && investorId) ok(`POST /investors (${investorId})`)
    else fail('POST /investors', json?.error || json)
  }

  // 3. Contact
  let contactId
  if (investorId) {
    const { res, json } = await req('POST', `/investors/${investorId}/contacts`, {
      token,
      body: {
        fullName: 'UAT Contact',
        roleTitle: 'CIO',
        email: `uat.contact.${stamp}@example.com`,
        decisionInfluence: 'DECISION_MAKER',
        communicationConsent: true,
        isPrimary: true,
      },
    })
    contactId = dataOf(json)?.id
    if (res.ok && contactId) ok(`POST /investors/:id/contacts (${contactId})`)
    else fail('POST contacts', json?.error || json)
  }

  // 4. Campaign (may need fundId — try without first, then with env FUND_ID)
  let campaignId
  {
    const body = {
      campaignType: process.env.FR_UAT_CAMPAIGN_TYPE || 'INSTITUTIONAL_MANDATE',
      name: `UAT Campaign ${stamp}`,
      description: 'UAT smoke',
      targetCapital: 50000000,
      primaryCurrency: 'USD',
      startDate: '2026-01-01',
      closeDate: '2027-12-31',
    }
    if (process.env.FR_UAT_FUND_ID) {
      body.campaignType = 'PE_FUNDRAISE'
      body.fundId = process.env.FR_UAT_FUND_ID
    }
    const { res, json } = await req('POST', '/fundraising/campaigns', { token, body })
    campaignId = dataOf(json)?.id
    if (res.ok && campaignId) ok(`POST /fundraising/campaigns (${campaignId})`)
    else fail('POST campaigns', json?.error || json)
  }

  // 5. Activate
  if (campaignId) {
    const { res, json } = await req('POST', `/fundraising/campaigns/${campaignId}/activate`, {
      token,
    })
    if (res.ok) ok('POST …/campaigns/:id/activate')
    else {
      const code = json?.error?.code
      if (code === 'ACTIVATION_REQUIREMENTS_UNMET') {
        fail(
          'activate (requirements unmet — expected until owner/docs ready)',
          (json?.error?.unmet || []).join('; ')
        )
      } else fail('activate', json?.error || json)
    }
  }

  // 6. Opportunity (needs ACTIVE campaign)
  let opportunityId
  if (campaignId && investorId) {
    const { res, json } = await req('POST', '/fundraising/opportunities', {
      token,
      body: {
        campaignId,
        investorId,
        primaryContactId: contactId || undefined,
        opportunityType: 'LP_COMMITMENT',
        opportunityCurrency: 'USD',
        indicativeAmount: 2500000,
        priority: 'HIGH',
        source: 'DIRECT',
        notes: 'UAT smoke opportunity',
      },
    })
    opportunityId = dataOf(json)?.id
    if (res.ok && opportunityId) ok(`POST /opportunities (${opportunityId})`)
    else {
      const code = json?.error?.code
      if (code === 'CAMPAIGN_NOT_ACTIVE') {
        fail('POST opportunities (campaign not active yet)', code)
      } else fail('POST opportunities', json?.error || json)
    }
  }

  // 7. Board — capture stage codes for transition
  let nextStageCode = null
  if (campaignId) {
    const { res, json } = await req('GET', `/fundraising/campaigns/${campaignId}/board`, {
      token,
    })
    const cols = dataOf(json)?.columns
    if (res.ok && Array.isArray(cols)) {
      ok(`GET board (${cols.length} columns)`)
      const codes = cols
        .map((c) => c?.stage?.stageCode)
        .filter(Boolean)
        .sort((a, b) => {
          const sa = cols.find((c) => c?.stage?.stageCode === a)?.stage?.sortOrder ?? 0
          const sb = cols.find((c) => c?.stage?.stageCode === b)?.stage?.sortOrder ?? 0
          return Number(sa) - Number(sb)
        })
      // Prefer second stage (forward from seed start); fall back to first non-target
      nextStageCode =
        codes.find((c) => c === 'CONTACTED' || c === 'INITIAL_CONTACT') ||
        codes[1] ||
        codes[0] ||
        null
    } else fail('GET board', json?.error || json)
  }

  // 8. Transition (best-effort — may STAGE_GATE_FAILED)
  if (opportunityId && nextStageCode) {
    const { res, json } = await req('POST', `/fundraising/opportunities/${opportunityId}/transition`, {
      token,
      body: { toStageCode: nextStageCode, reason: 'UAT smoke' },
    })
    if (res.ok) ok(`POST …/transition → ${nextStageCode}`)
    else if (json?.error?.code === 'STAGE_GATE_FAILED') {
      ok(
        `transition blocked by STAGE_GATE_FAILED (checklist: ${(json.error.unmetRequirements || []).length})`
      )
    } else fail('transition', json?.error || json)
  } else if (opportunityId && !nextStageCode) {
    fail('transition', 'No stage code from board')
  }

  // 9. Amount patch with reason
  if (opportunityId) {
    const { res, json } = await req('PATCH', `/fundraising/opportunities/${opportunityId}`, {
      token,
      body: { softCircleAmount: 2000000, reason: 'UAT soft circle confirmed' },
    })
    if (res.ok) ok('PATCH opportunity amount + reason')
    else fail('PATCH opportunity', json?.error || json)
  }

  // 10. Investor 360
  if (investorId) {
    const { res, json } = await req('GET', `/investors/${investorId}/360`, { token })
    const d = dataOf(json)
    if (res.ok && (d?.organisation || d?.investor)) ok('GET /investors/:id/360')
    else fail('GET 360', json?.error || json)
  }

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
