'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Columns3,
  Download,
  Filter,
  Info,
  MoreVertical,
  Percent,
  Upload,
  Wallet,
} from 'lucide-react'
import { ReconApiBanner, ReconNavTabs, ViewSegment } from '@/components/investments-v2/recon-ui'
import { ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  mapCashLedgerRows,
  mapCashOverviewKpis,
  mapDailyCashMovement,
  mapFundSummaryKpis,
  opsErrorMessage,
  requireOpsData,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C, ReconAccent } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

const tabs = ['Ledger', 'Capital Calls', 'Distributions', 'Fees', 'Documents'] as const
type LedgerView = 'trading' | 'fund'
type LedgerRow = ReturnType<typeof mapCashLedgerRows>['items'][number]
type FundActivityTab = Exclude<(typeof tabs)[number], 'Ledger'>

const FUND_ACTIVITY_LINKS: Record<
  FundActivityTab,
  { href: string; title: string; description: string; note?: string }
> = {
  'Capital Calls': {
    href: '/portfolio/funds/capital-calls',
    title: 'Fund capital calls',
    description: 'Issue notices, track paid vs outstanding, and manage LP call schedules in Fund Ops.',
  },
  Distributions: {
    href: '/lp-portal/ledger',
    title: 'LP distributions ledger',
    description: 'Distribution notices and cash-out events are owned by the LP portal ledger, not the cash ledger API.',
    note: 'Capital call activity (including some distribution offsets) may also appear under Fund Ops capital calls.',
  },
  Fees: {
    href: '/lp-portal/ledger',
    title: 'Management & admin fees',
    description: 'Fee accruals and settlements are posted through the LP ledger module rather than fund cash ledger lines.',
  },
  Documents: {
    href: '/investments-v2/documentation',
    title: 'Investment documentation',
    description: 'Fund notices, statements, and supporting files live in the Investments documentation register.',
  },
}

export default function CashLedgerPage() {
  const [ledgerView, setLedgerView] = useState<LedgerView>('fund')
  const [tab, setTab] = useState<(typeof tabs)[number]>('Ledger')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [kpiPrimary, setKpiPrimary] = useState('—')
  const [kpiAvailable, setKpiAvailable] = useState('—')
  const [kpiReservations, setKpiReservations] = useState('—')
  const [dailyMovement, setDailyMovement] = useState<{ date: string; net: number; close: number }[]>([])
  const isFund = ledgerView === 'fund'
  const pageSize = 20

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [ledgerRes, overviewRes, fundRes, movementRes] = await Promise.all([
          stockPickerCashApi.getCashLedger({
            page,
            pageSize,
            view: 'LINES',
            accountPurpose: isFund ? 'FUND' : 'TRADING',
          }),
          stockPickerCashApi.getCashOverview().catch(() => null),
          isFund ? stockPickerCashApi.getFundCashSummary().catch(() => null) : Promise.resolve(null),
          isFund ? stockPickerCashApi.getCashOverviewDailyMovement().catch(() => null) : Promise.resolve(null),
        ])
        if (cancelled) return
        const ledgerData = requireOpsData(ledgerRes, 'cash ledger')
        const mapped = mapCashLedgerRows(ledgerData)
        setRows(mapped.items)
        setTotal(mapped.total)
        setTotalPages(Math.max(1, mapped.totalPages || Math.ceil((mapped.total || mapped.items.length) / pageSize) || 1))

        if (isFund && fundRes?.success && fundRes.data) {
          const fk = mapFundSummaryKpis(requireOpsData(fundRes, 'fund cash summary'))
          setKpiPrimary(fk.totalCash)
          setKpiAvailable(fk.available)
          setKpiReservations(fk.unreconciledValue)
        } else if (overviewRes?.success && overviewRes.data) {
          const ok = mapCashOverviewKpis(requireOpsData(overviewRes, 'cash overview'))
          const ccy = ok?.primaryCurrency ?? 'USD'
          setKpiPrimary(`${ccy} ${ok?.totalCash ?? '0.00'}`)
          setKpiAvailable(`${ccy} ${ok?.available ?? '0.00'}`)
          setKpiReservations(`${ccy} ${ok?.reservations ?? '0.00'}`)
        } else {
          setKpiPrimary('—')
          setKpiAvailable('—')
          setKpiReservations('—')
        }

        if (isFund && movementRes?.success && movementRes.data) {
          setDailyMovement(mapDailyCashMovement(movementRes.data))
        } else {
          setDailyMovement([])
        }
      } catch (e) {
        if (cancelled) return
        setError(opsErrorMessage(e, 'Unable to load cash ledger'))
        setRows([])
        setTotal(0)
        setTotalPages(1)
        setKpiPrimary('—')
        setKpiAvailable('—')
        setKpiReservations('—')
        setDailyMovement([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isFund, page])

  const from = rows.length === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total || rows.length)

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">
                {isFund ? 'Fund Cash Ledger' : 'Trading Cash Ledger'}
              </h1>
              <ViewSegment
                value={ledgerView}
                onChange={(id) => {
                  setLedgerView(id)
                  setPage(1)
                  setTab('Ledger')
                }}
                options={[
                  { id: 'trading', label: 'Trading' },
                  { id: 'fund', label: 'Fund' },
                ]}
              />
            </div>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              {isFund
                ? 'Track and manage cash movements and balances across your funds.'
                : 'Track client trading cash movements, settlements, and available balances.'}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <Control value={isFund ? 'All Funds' : 'All Clients'} />
            <LabeledControl label="Valuation Date" value="As of today" icon={<Calendar className="h-3.5 w-3.5" />} />
            <LabeledControl label="Currency" value="USD" />
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {isFund ? (
            <>
              <Kpi icon={<Wallet className="h-4 w-4 text-[#60A5FA]" />} iconBg="rgba(59,130,246,0.15)" label="Total Fund Cash" primary={kpiPrimary} secondary="From fund-cash-summary" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Banknote className="h-4 w-4 text-[#34D399]" />} iconBg="rgba(16,185,129,0.15)" label="Unrestricted Cash" primary={kpiAvailable} secondary="Order-eligible" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Clock3 className="h-4 w-4 text-[#FBBF24]" />} iconBg="rgba(245,158,11,0.15)" label="Open Break Variance" primary={kpiReservations} secondary="Unreconciled value" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Download className="h-4 w-4 text-[#C084FC]" />} iconBg="rgba(168,85,247,0.15)" label="Ledger Rows" primary={String(total)} secondary={`Page ${page} of ${totalPages}`} trend="—" trendTone={C.muted2} />
              <Kpi icon={<Percent className="h-4 w-4 text-[#60A5FA]" />} iconBg="rgba(59,130,246,0.15)" label="View" primary="Fund" secondary="accountPurpose=FUND" trend="—" trendTone={C.muted2} />
            </>
          ) : (
            <>
              <Kpi icon={<Wallet className="h-4 w-4 text-[#60A5FA]" />} iconBg="rgba(59,130,246,0.15)" label="Total Client Cash" primary={kpiPrimary} secondary="From cash-overview" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Banknote className="h-4 w-4 text-[#34D399]" />} iconBg="rgba(16,185,129,0.15)" label="Available to Trade" primary={kpiAvailable} secondary="After reservations" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Clock3 className="h-4 w-4 text-[#FBBF24]" />} iconBg="rgba(245,158,11,0.15)" label="Active Reservations" primary={kpiReservations} secondary="Holds" trend="—" trendTone={C.muted2} />
              <Kpi icon={<Download className="h-4 w-4 text-[#C084FC]" />} iconBg="rgba(168,85,247,0.15)" label="Ledger Rows" primary={String(total)} secondary={`Page ${page} of ${totalPages}`} trend="—" trendTone={C.muted2} />
              <Kpi icon={<Percent className="h-4 w-4 text-[#FB7185]" />} iconBg="rgba(244,63,94,0.15)" label="View" primary="Trading" secondary="accountPurpose=TRADING" trend="—" trendTone={C.muted2} />
            </>
          )}
        </section>

        <section className="overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
          <div className="flex flex-col gap-3 border-b px-4 pt-2 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.cardBorder }}>
            <div className="flex gap-1 overflow-x-auto">
              {(isFund ? tabs : (['Ledger'] as const)).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    'shrink-0 border-b-2 px-3 py-3 text-[12px] font-medium transition',
                    tab === item ? 'border-[#3B82F6] text-white' : 'border-transparent',
                  )}
                  style={{ color: tab === item ? C.text : C.muted2 }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pb-2 sm:pb-0">
              <GhostBtn icon={<Filter className="h-3.5 w-3.5" />}>Filters</GhostBtn>
            </div>
          </div>

          {tab === 'Ledger' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                      {(isFund
                        ? ['Date', 'Fund', 'Cash Account', 'Bank', 'Transaction Type', 'Description', 'Debit (USD)', 'Credit (USD)', 'Running Balance (USD)', 'Currency', 'Approval Status', '']
                        : ['Date', 'Client', 'Account', 'Cash Account', 'Bank', 'Transaction Type', 'Description', 'Debit', 'Credit', 'Running Balance', 'Currency', 'Approval Status', '']
                      ).map((h) => (
                        <th key={h || 'more'} className="px-3 py-3 text-[11px] font-medium" style={{ color: C.muted2 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={13} className="p-0">
                          <ReconTableSkeleton rows={8} cols={13} />
                        </td>
                      </tr>
                    ) : null}
                    {!loading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-3 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                          {error ? 'Unable to load ledger.' : 'No ledger entries for this segment.'}
                        </td>
                      </tr>
                    ) : null}
                    {!loading
                      ? rows.map((row, index) => (
                      <tr key={`${row.date}-${row.description}-${index}`} style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                        <td className="whitespace-nowrap px-3 py-3 text-[12px]" style={{ color: C.muted }}>{row.date}</td>
                        {isFund ? (
                          <td className="px-3 py-3 text-[12px] font-medium">{row.fund}</td>
                        ) : (
                          <td className="px-3 py-3 text-[12px] font-medium">{row.client}</td>
                        )}
                        {!isFund ? (
                          <td className="px-3 py-3 font-mono text-[11px]" style={{ color: '#60A5FA' }}>{row.account}</td>
                        ) : null}
                        <td className="px-3 py-3 text-[12px]" style={{ color: C.muted }}>{row.cashAccount}</td>
                        <td className="px-3 py-3 text-[12px]" style={{ color: C.muted }}>{row.bank}</td>
                        <td className="px-3 py-3"><TypePill type={row.type} /></td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-[12px]" style={{ color: C.muted }}>{row.description}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]" style={{ color: row.debit === '—' ? C.muted2 : C.text }}>{row.debit}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]" style={{ color: row.credit === '—' ? C.muted2 : C.text }}>{row.credit}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px] font-medium">{row.balance}</td>
                        <td className="px-3 py-3 font-mono text-[12px]" style={{ color: C.muted }}>{row.currency}</td>
                        <td className="px-3 py-3"><ApprovalPill status={row.approval} /></td>
                        <td className="px-3 py-3">
                          <button type="button" className="rounded-full p-1" style={{ color: C.muted2 }} aria-label="Row actions">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                      : null}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <p className="text-[12px]" style={{ color: C.muted2 }}>
                  Showing {from} to {to} of {total} transactions
                </p>
                <div className="flex items-center gap-1">
                  <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </PagerBtn>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-medium"
                      style={page === n ? { background: C.blue, color: '#fff' } : { color: C.muted }}
                    >
                      {n}
                    </button>
                  ))}
                  <PagerBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </PagerBtn>
                </div>
              </div>
            </>
          ) : (
            <FundActivityDeepLinks tab={tab} />
          )}
        </section>

        {isFund ? (
          <section className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-2 flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold" style={{ color: C.text }}>
                Daily Cash Movement (USD)
              </h3>
              <Info className="h-3 w-3" style={{ color: C.muted2 }} />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[10px]" style={{ color: C.muted }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-[#3B82F6]" />
                Net Cash Movement
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-[#22C55E]" />
                Closing Cash Balance
              </span>
            </div>
            <div className="h-[200px] w-full">
              {dailyMovement.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[12px]" style={{ color: C.muted2 }}>
                  No daily movement data returned.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyMovement} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={C.rowBorder} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted2 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted2 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: C.muted }}
                    />
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} dot={false} name="Net Cash Movement" />
                    <Line type="monotone" dataKey="close" stroke="#22C55E" strokeWidth={2} dot={false} name="Closing Cash Balance" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function FundActivityDeepLinks({ tab }: { tab: FundActivityTab }) {
  const link = FUND_ACTIVITY_LINKS[tab]
  return (
    <div className="space-y-4 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-2 text-center">
        <p className="text-[13px] font-medium" style={{ color: C.text }}>
          {tab} is not owned by the cash ledger API
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted2 }}>
          Fund cash ledger lines cover bank receipts, payments, and running balances. {tab.toLowerCase()} activity is
          maintained in a dedicated module — open it below to review or action records there.
        </p>
      </div>
      <article
        className="mx-auto max-w-xl rounded-[12px] border p-5"
        style={{ background: C.control, borderColor: C.cardBorder }}
      >
        <h3 className="text-[14px] font-semibold" style={{ color: C.text }}>
          {link.title}
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed" style={{ color: C.muted }}>
          {link.description}
        </p>
        {link.note ? (
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: C.muted2 }}>
            {link.note}
          </p>
        ) : null}
        <Link
          href={link.href}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full px-5 text-[12px] font-medium text-white transition hover:opacity-90"
          style={{ background: C.blue }}
        >
          Open {tab}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </article>
    </div>
  )
}

function Kpi({
  icon,
  iconBg,
  label,
  primary,
  secondary,
  trend,
  trendTone,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  primary: string
  secondary: string
  trend: string
  trendTone: string
}) {
  return (
    <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: iconBg }}>
          {icon}
        </span>
        <span className="text-[12px] font-medium" style={{ color: C.muted }}>{label}</span>
        <Info className="h-3 w-3" style={{ color: C.muted2 }} />
      </div>
      <p className="mt-3 font-mono text-[16px] font-semibold leading-snug tracking-tight">{primary}</p>
      <p className="mt-1 font-mono text-[11px]" style={{ color: C.muted2 }}>{secondary}</p>
      <p className="mt-3 text-[11px]" style={{ color: trendTone }}>{trend}</p>
    </article>
  )
}

function Control({ value }: { value: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder }}>
      {value}
      <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
    </span>
  )
}

function LabeledControl({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px]" style={{ color: C.muted2 }}>{label}</span>
      <span className="inline-flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-[8px] border px-3 text-[12px]" style={{ background: C.control, borderColor: C.controlBorder }}>
        <span className="inline-flex items-center gap-2">
          {icon && <span style={{ color: C.muted }}>{icon}</span>}
          {value}
        </span>
        <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
      </span>
    </label>
  )
}

function GhostBtn({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px]" style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}>
      {icon && <span style={{ color: C.muted }}>{icon}</span>}
      {children}
    </button>
  )
}

function TypePill({ type }: { type: 'Receipt' | 'Payment' | 'Transfer' }) {
  const styles =
    type === 'Receipt'
      ? { color: ReconAccent.greenSoft, background: 'rgba(16,185,129,0.12)' }
      : type === 'Payment'
        ? { color: ReconAccent.blueSoft, background: 'rgba(59,130,246,0.12)' }
        : { color: ReconAccent.purpleSoft, background: 'rgba(168,85,247,0.12)' }
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={styles}>
      {type}
    </span>
  )
}

function ApprovalPill({ status }: { status: 'Approved' | 'Pending' }) {
  const approved = status === 'Approved'
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        color: approved ? ReconAccent.greenSoft : ReconAccent.amberSoft,
        borderColor: approved ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)',
        background: approved ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
      }}
    >
      {status}
    </span>
  )
}

function PagerBtn({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30" style={{ color: C.muted }}>
      {children}
    </button>
  )
}
