'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CircleAlert,
  Clock3,
  Columns3,
  Info,
  Search,
  ShieldAlert,
  Star,
  Upload,
  Wallet,
  FileText,
} from 'lucide-react'
import {
  Cell,
  ComposedChart,
  CartesianGrid,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ReconApiBanner, ReconNavTabs } from '@/components/investments-v2/recon-ui'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  mapCashOverviewKpis,
  mapClientAccounts,
  mapCurrencyPie,
  mapDailyCashMovement,
  mapExceptions,
  opsErrorMessage,
  requireOpsData,
} from '@/lib/investments-v2/adapters/cash-recon-adapter'
import { R as C } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

type AccountRow = ReturnType<typeof mapClientAccounts>['items'][number]

export default function ClientAccountsOverviewPage() {
  const [search, setSearch] = useState('')
  const [accountType, setAccountType] = useState('All Account Types')
  const [status, setStatus] = useState('All Statuses')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountTotal, setAccountTotal] = useState(0)
  const [kpis, setKpis] = useState<
    {
      label: string
      icon: typeof Wallet
      iconBg: string
      iconColor: string
      primary: string
      secondary: string
      trend: string
      trendTone: string
      exceptions?: boolean
    }[]
  >([])
  const [cashByCurrency, setCashByCurrency] = useState<
    { name: string; pct: number; value: string; color: string; amount: number }[]
  >([])
  const [recentAlerts, setRecentAlerts] = useState<
    { title: string; meta: string; amount?: string; when: string; tone: 'red' | 'amber' | 'blue' }[]
  >([])
  const [dailyMovement, setDailyMovement] = useState<{ date: string; net: number; close: number }[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [overviewRes, accountsRes, exceptionsRes, movementRes] = await Promise.all([
          stockPickerCashApi.getCashOverview(),
          stockPickerCashApi.listClientCashAccounts({ page: 1, pageSize: 100 }),
          stockPickerCashApi.listExceptions({ page: 1, pageSize: 5 }).catch(() => null),
          stockPickerCashApi.getCashOverviewDailyMovement().catch(() => null),
        ])
        if (cancelled) return
        const overview = requireOpsData(overviewRes, 'cash overview')
        const accountsData = requireOpsData(accountsRes, 'client cash accounts')
        const k = mapCashOverviewKpis(overview)
        const mapped = mapClientAccounts(accountsData)
        const unreconciled = mapped.items.reduce((s, a) => s + a.unreconciled, 0)
        const ccy = k?.primaryCurrency ?? 'USD'
        setAccounts(mapped.items)
        setAccountTotal(mapped.total)
        setCashByCurrency(mapCurrencyPie(k?.byCurrency ?? []))
        if (movementRes?.success && movementRes.data) {
          setDailyMovement(mapDailyCashMovement(movementRes.data))
        } else {
          setDailyMovement([])
        }
        setKpis([
          {
            label: 'Total Client Cash',
            icon: Wallet,
            iconBg: 'rgba(59,130,246,0.15)',
            iconColor: '#60A5FA',
            primary: `${ccy} ${k?.totalCash ?? '0.00'}`,
            secondary: k?.secondaryCash ? `${k.secondaryCurrency} ${k.secondaryCash}` : `${mapped.total} accounts`,
            trend: '—',
            trendTone: 'text-[#64748B]',
          },
          {
            label: 'Available Cash',
            icon: Banknote,
            iconBg: 'rgba(34,197,94,0.15)',
            iconColor: '#4ADE80',
            primary: `${ccy} ${k?.available ?? '0.00'}`,
            secondary: k?.secondaryAvailable
              ? `${k.secondaryCurrency} ${k.secondaryAvailable}`
              : 'Order-eligible',
            trend: '—',
            trendTone: 'text-[#64748B]',
          },
          {
            label: 'Pending Settlements',
            icon: Clock3,
            iconBg: 'rgba(245,158,11,0.15)',
            iconColor: '#FBBF24',
            primary: `${ccy} ${k?.reservations ?? '0.00'}`,
            secondary: 'Active reservations',
            trend: '—',
            trendTone: 'text-[#64748B]',
          },
          {
            label: 'Unreconciled Items',
            icon: FileText,
            iconBg: 'rgba(168,85,247,0.15)',
            iconColor: '#C084FC',
            primary: String(unreconciled),
            secondary: 'Open breaks on accounts',
            trend: '—',
            trendTone: 'text-[#64748B]',
          },
          {
            label: 'Exceptions',
            icon: ShieldAlert,
            iconBg: 'rgba(244,63,94,0.15)',
            iconColor: '#FB7185',
            primary: String(k?.unhealthyAccounts ?? 0),
            secondary: 'Unhealthy accounts',
            trend: '—',
            trendTone: 'text-[#64748B]',
            exceptions: true,
          },
        ])
        if (exceptionsRes?.success && exceptionsRes.data) {
          const ex = requireOpsData(exceptionsRes, 'exceptions')
          const rowsEx = mapExceptions(ex).items
          setRecentAlerts(
            rowsEx.map((r) => ({
              title: r.title,
              meta: `${r.account} · ${r.client}`,
              amount: `USD ${r.diffUsd}`,
              when: `${r.ageDays}d`,
              tone: r.severity === 'Critical' || r.severity === 'High' ? 'red' : r.severity === 'Medium' ? 'amber' : 'blue',
            })),
          )
        } else {
          setRecentAlerts([])
        }
      } catch (e) {
        if (cancelled) return
        setError(opsErrorMessage(e, 'Unable to load cash overview'))
        setAccounts([])
        setAccountTotal(0)
        setKpis([])
        setCashByCurrency([])
        setDailyMovement([])
        setRecentAlerts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return accounts.filter((row) => {
      const matchQ =
        !q ||
        `${row.accountNumber} ${row.clientName} ${row.accountType}`.toLowerCase().includes(q)
      const matchType = accountType === 'All Account Types' || row.accountType === accountType
      const matchStatus = status === 'All Statuses' || row.status === status
      return matchQ && matchType && matchStatus
    })
  }, [accountType, accounts, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, filtered.length)
  const dominantCcy = cashByCurrency[0]

  return (
    <main className="min-h-full bg-background text-foreground p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: C.text }}>
              Client Accounts Overview
            </h1>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: C.muted }}>
              Real-time summary of client cash positions, activity and exceptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label
              className="flex h-9 w-[260px] items-center gap-2 rounded-full border px-3"
              style={{ background: C.control, borderColor: C.controlBorder }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: C.muted2 }} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search accounts, clients..."
                className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#64748B]"
                style={{ color: C.text }}
              />
              <span
                className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: C.muted2, borderColor: C.controlBorder, background: C.control }}
              >
                ⌘ K
              </span>
            </label>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]"
              style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
            >
              <Calendar className="h-3.5 w-3.5" style={{ color: C.muted }} />
              <span>As of today</span>
              <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px]"
              style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
            >
              <Upload className="h-3.5 w-3.5" style={{ color: C.muted }} />
              Export
              <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted2 }} />
            </button>
          </div>
        </header>

        <ReconNavTabs variant="terminal-dark" />
        <ReconApiBanner loading={loading} error={error} />

        {/* KPI row */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {(kpis.length ? kpis : loading ? [] : [
            {
              label: 'Total Client Cash',
              icon: Wallet,
              iconBg: 'rgba(59,130,246,0.15)',
              iconColor: '#60A5FA',
              primary: '—',
              secondary: 'No data',
              trend: '—',
              trendTone: 'text-[#64748B]',
            },
          ]).map((kpi) => {
            const Icon = kpi.icon
            return (
              <article
                key={kpi.label}
                className="rounded-[12px] border p-4"
                style={{ background: C.card, borderColor: C.cardBorder }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[10px]"
                    style={{ background: kpi.iconBg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: kpi.iconColor }} />
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: C.muted }}>
                    {kpi.label}
                  </span>
                  <Info className="h-3 w-3" style={{ color: C.muted2 }} />
                </div>
                <p className="mt-3 font-mono text-[18px] font-semibold leading-none tracking-tight" style={{ color: C.text }}>
                  {kpi.primary}
                </p>
                <p className="mt-1.5 font-mono text-[11px]" style={{ color: C.muted2 }}>
                  {kpi.secondary}
                </p>
                <p className={cn('mt-3 text-[11px]', kpi.trendTone)}>
                  {kpi.trend} <span style={{ color: C.muted2 }}>vs last 7 days</span>
                </p>
              </article>
            )
          })}
        </section>

        {/* Accounts table */}
        <section
          className="overflow-hidden rounded-[12px] border"
          style={{ background: C.card, borderColor: C.cardBorder }}
        >
          <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>
                Client Accounts
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.muted, color: C.muted, border: `1px solid ${C.cardBorder}` }}
              >
                {accountTotal || filtered.length} Accounts
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                value={accountType}
                options={['All Account Types', 'Discretionary', 'Pension Fund', 'Custodial', 'Brokerage', 'Corporate']}
                onChange={(v) => {
                  setAccountType(v)
                  setPage(1)
                }}
              />
              <FilterSelect
                value={status}
                options={['All Statuses', 'Active', 'Restricted']}
                onChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              />
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px]"
                style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
              >
                <Columns3 className="h-3.5 w-3.5" style={{ color: C.muted }} />
                Columns
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                  {[
                    'Account Number',
                    'Client Name',
                    'Base Currency',
                    'Account Type',
                    'Cash Balance',
                    'Available Balance',
                    'Status',
                    'Last Activity',
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-[11px] font-medium"
                      style={{ color: C.muted2 }}
                    >
                      {head === 'Last Activity' ? (
                        <span className="inline-flex items-center gap-1">
                          {head}
                          <ChevronDown className="h-3 w-3" />
                        </span>
                      ) : (
                        head
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[12px]" style={{ color: C.muted2 }}>
                      {error ? 'Unable to load accounts.' : 'No client cash accounts found.'}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.id || row.accountNumber} style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {row.star === 'blue' ? (
                          <Star className="h-3.5 w-3.5 fill-[#3B82F6] text-[#3B82F6]" />
                        ) : row.star === 'amber' ? (
                          <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        ) : (
                          <span className="inline-block h-3.5 w-3.5 rounded-full border" style={{ borderColor: '#334155' }} />
                        )}
                        <span className="font-mono text-[12px] font-medium" style={{ color: C.blueLink }}>
                          {row.accountNumber}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium" style={{ color: C.text }}>
                      {row.clientName}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: C.muted }}>
                      {row.baseCurrency}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: C.muted }}>
                      {row.accountType}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px]" style={{ color: C.text }}>
                      {row.cashBalance}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px]" style={{ color: C.text }}>
                      {row.availableBalance}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: C.muted2 }}>
                      {row.lastActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderTop: `1px solid ${C.cardBorder}` }}
          >
            <p className="text-[12px]" style={{ color: C.muted2 }}>
              Showing {from} to {to} of {filtered.length} accounts
            </p>
            <div className="flex items-center gap-1">
              <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </PagerBtn>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={n > totalPages}
                  onClick={() => setPage(n)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-medium disabled:opacity-30"
                  style={
                    page === n
                      ? { background: C.blue, color: '#fff' }
                      : { color: C.muted, background: 'transparent' }
                  }
                >
                  {n}
                </button>
              ))}
              <PagerBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </PagerBtn>
              <PagerBtn disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </PagerBtn>
            </div>
          </div>
        </section>

        {/* Bottom panels */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-3 flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold" style={{ color: C.text }}>
                Cash by Currency
              </h3>
              <Info className="h-3 w-3" style={{ color: C.muted2 }} />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cashByCurrency}
                      dataKey="pct"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={74}
                      stroke="none"
                      paddingAngle={1.5}
                    >
                      {cashByCurrency.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-medium" style={{ color: C.muted }}>
                    {dominantCcy?.name ?? '—'}
                  </span>
                  <span className="text-[16px] font-semibold" style={{ color: C.text }}>
                    {dominantCcy ? `${dominantCcy.pct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-2.5">
                {cashByCurrency.length === 0 ? (
                  <li className="text-[12px]" style={{ color: C.muted2 }}>
                    No currency breakdown available.
                  </li>
                ) : (
                  cashByCurrency.map((item) => (
                  <li key={item.name} className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium" style={{ color: C.text }}>
                        {item.name} {item.pct.toFixed(1)}%
                      </p>
                      <p className="truncate font-mono text-[10px]" style={{ color: C.muted2 }}>
                        {item.value}
                      </p>
                    </div>
                  </li>
                  ))
                )}
              </ul>
            </div>
          </article>

          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-2 flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold" style={{ color: C.text }}>
                Daily Cash Movement (USD)
              </h3>
              <Info className="h-3 w-3" style={{ color: C.muted2 }} />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[10px]" style={{ color: C.muted }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-[#3B82F6]" />
                Net Cash Movement (USD)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-[#22C55E]" />
                Closing Cash Balance (USD)
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
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} dot={false} name="Net Cash Movement (USD)" />
                    <Line type="monotone" dataKey="close" stroke="#22C55E" strokeWidth={2} dot={false} name="Closing Cash Balance (USD)" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-semibold" style={{ color: C.text }}>
                  Recent Alerts & Exceptions
                </h3>
                <Info className="h-3 w-3" style={{ color: C.muted2 }} />
              </div>
              <button type="button" className="text-[12px] font-medium" style={{ color: C.blueLink }}>
                View all
              </button>
            </div>
            <ul>
              {recentAlerts.length === 0 ? (
                <li className="py-6 text-center text-[12px]" style={{ color: C.muted2 }}>
                  No recent exceptions.
                </li>
              ) : (
                recentAlerts.map((alert, index) => (
                <li
                  key={`${alert.title}-${alert.when}-${index}`}
                  className="flex items-start gap-2.5 py-2.5"
                  style={{ borderTop: index === 0 ? undefined : `1px solid ${C.rowBorder}` }}
                >
                  <AlertIcon tone={alert.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium leading-snug" style={{ color: C.text }}>
                      {alert.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted2 }}>
                      {alert.meta}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {alert.amount && (
                      <p className="font-mono text-[11px] font-medium" style={{ color: C.text }}>
                        {alert.amount}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px]" style={{ color: C.muted2 }}>
                      {alert.when}
                    </p>
                  </div>
                </li>
                ))
              )}
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-full border py-0 pl-3 pr-8 text-[11px] outline-none"
        style={{ background: C.control, borderColor: C.controlBorder, color: C.text }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2"
        style={{ color: C.muted2 }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: 'Active' | 'Restricted' }) {
  const active = status === 'Active'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        color: active ? '#4ADE80' : '#FBBF24',
        borderColor: active ? 'rgba(74,222,128,0.35)' : 'rgba(251,191,36,0.35)',
        background: active ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: active ? '#4ADE80' : '#FBBF24' }}
      />
      {status}
    </span>
  )
}

function PagerBtn({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30"
      style={{ color: C.muted }}
    >
      {children}
    </button>
  )
}

function AlertIcon({ tone }: { tone: 'red' | 'amber' | 'blue' }) {
  if (tone === 'amber') {
    return (
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(245,158,11,0.15)' }}
      >
        <CircleAlert className="h-3.5 w-3.5 text-[#F59E0B]" />
      </span>
    )
  }
  if (tone === 'blue') {
    return (
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(59,130,246,0.15)' }}
      >
        <Info className="h-3.5 w-3.5 text-[#60A5FA]" />
      </span>
    )
  }
  return (
    <span
      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
      style={{ background: 'rgba(244,63,94,0.15)' }}
    >
      <CircleAlert className="h-3.5 w-3.5 text-[#F43F5E]" />
    </span>
  )
}
