import { formatMoneyDisplay, moneyAsString } from '@/lib/api/investment-ops-helpers'
import type {
  DashboardAllocation,
  DashboardSummary,
  CurrencyExposureEntry,
  OpsFund,
} from '@/lib/api/investment-ops-api'

const tones = ['gold', 'blue', 'teal'] as const

export type DashboardPortfolioRow = {
  fundId: string
  name: string
  nav: string
  asOf: string
  pnl: string
  percent: string
  tone: (typeof tones)[number]
}

export type DashboardFundRow = {
  fundId: string
  name: string
  nav: string
  valueDate: string
  shares: string
  currency: string
  tone: (typeof tones)[number]
}

export type AllocationSlice = { label: string; value: number; color: string }

export type CurrencyBar = { label: string; value: number; color: string }

function toneAt(i: number) {
  return tones[i % tones.length]
}

function formatAsOf(raw: string | null | undefined): string {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return raw
  }
}

export function mapDashboardPortfolios(summary: DashboardSummary | null | undefined): DashboardPortfolioRow[] {
  const rows = summary?.portfolios ?? []
  return rows.map((p, i) => ({
    fundId: p.fundId,
    name: p.name,
    nav: formatMoneyDisplay(p.nav),
    asOf: formatAsOf(p.valuationDate ?? p.periodEnd),
    pnl: formatMoneyDisplay(p.pnl),
    percent: `${Number(p.pnlPct ?? 0).toFixed(2)}%`,
    tone: toneAt(i),
  }))
}

export function mapDashboardFunds(funds: OpsFund[] | null | undefined): DashboardFundRow[] {
  return (funds ?? []).map((f, i) => ({
    fundId: f.id,
    name: f.name,
    nav: formatMoneyDisplay(f.latestSnapshot?.unrealizedPnlUsd ?? 0),
    valueDate: formatAsOf(f.latestSnapshot?.asOf),
    shares: '—',
    currency: f.baseCurrencyCode || 'USD',
    tone: toneAt(i),
  }))
}

const allocationColors: Record<string, string> = {
  Bond: '#ffffff',
  Bonds: '#ffffff',
  Crypto: 'var(--iv2-allocation-dark)',
  Equity: '#d9d0fa',
  Equities: '#d9d0fa',
  Others: '#8d70f4',
  Other: '#8d70f4',
  Cash: '#c4b5fd',
  Funds: '#a78bfa',
}

export function mapAllocation(alloc: DashboardAllocation | null | undefined): AllocationSlice[] {
  if (!alloc) return []
  const entries: { key: keyof DashboardAllocation; label: string }[] = [
    { key: 'bonds', label: 'Bond' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'equities', label: 'Equity' },
    { key: 'other', label: 'Others' },
  ]
  const slices = entries
    .map(({ key, label }) => {
      const bucket = alloc[key]
      const pct = typeof bucket?.pct === 'number' ? bucket.pct : Number(bucket?.pct ?? 0)
      return {
        label,
        value: Math.round(Number.isFinite(pct) ? pct : 0),
        color: allocationColors[label] ?? '#8d70f4',
      }
    })
    .filter((s) => s.value > 0)

  if (slices.length === 0) {
    // Show zeros as empty — caller should empty-state
    return []
  }
  return slices
}

export function mapCurrencyBars(rows: CurrencyExposureEntry[] | null | undefined): CurrencyBar[] {
  const list = rows ?? []
  if (list.length === 0) return []
  const max = Math.max(...list.map((r) => Math.abs(Number(r.value) || 0)), 1)
  const palette = ['var(--iv2-chart-dark)', 'var(--iv2-chart-dark-2)', '#d2e5ff', '#1388f5', '#64748b']
  return list.map((r, i) => ({
    label: r.currency || '—',
    value: Math.max(8, Math.round((Math.abs(Number(r.value) || 0) / max) * 100)),
    color: palette[i % palette.length],
  }))
}

export function periodToApiParam(period: string): string {
  const map: Record<string, string> = {
    Daily: 'DAILY',
    Weekly: 'WEEKLY',
    Monthly: 'MONTHLY',
    Quarterly: 'QUARTERLY',
    YTD: 'YTD',
  }
  return map[period] ?? 'MONTHLY'
}

export { moneyAsString, formatMoneyDisplay }
