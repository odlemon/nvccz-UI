'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2, Search } from 'lucide-react'
import { OpsKpiSkeleton, OpsPageSkeleton } from '@/components/investments-v2/loading-skeletons'
import { RefetchOverlay } from '@/components/investments-v2/ui/refetch-overlay'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchDashboardAllocation,
  fetchDashboardCurrencyExposure,
  fetchDashboardFunds,
  fetchDashboardSummary,
} from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import {
  mapAllocation,
  mapCurrencyBars,
  mapDashboardFunds,
  mapDashboardPortfolios,
  periodToApiParam,
  type AllocationSlice,
} from '@/lib/investments-v2/adapters/dashboard-adapter'

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'YTD'
const periodOptions: Period[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'YTD']

function MoneyDot({ tone }: { tone: string }) {
  const colors: Record<string, string> = {
    gold: '#ffd51e',
    blue: '#2aa1ff',
    teal: '#24d6c1',
  }

  return (
    <span
      className="inline-flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
      style={{ background: colors[tone] ?? colors.blue }}
    >
      c
    </span>
  )
}

function PeriodSelect({ value, onChange }: { value: Period; onChange: (value: Period) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={rootRef} className="relative z-30">
      <button
        type="button"
        aria-label="Dashboard period"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 min-w-[96px] items-center justify-between gap-3 rounded-full border border-[#334156] bg-[#101927]/80 px-4 text-[11px] text-[#cad2df] shadow-[0_8px_24px_rgba(0,0,0,.16)] transition hover:border-[#52627a] hover:bg-[#172235] focus:outline-none focus:ring-2 focus:ring-[#4b8cff]/40"
      >
        {value}
        <ChevronDown className={`h-3 w-3 text-[#8090a4] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-10 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#111a28]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-xl"
        >
          {periodOptions.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[11px] transition ${
                option === value
                  ? 'bg-[#258cf4] text-white'
                  : 'text-[#9ca9ba] hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              {option}
              {option === value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AllocationRings({
  allocation,
  active,
  onActive,
}: {
  allocation: AllocationSlice[]
  active: string
  onActive: (label: string) => void
}) {
  if (allocation.length === 0) {
    return (
      <div className="flex h-[190px] w-[190px] items-center justify-center text-[11px] text-white/70 sm:h-[208px] sm:w-[208px]">
        No allocation data
      </div>
    )
  }
  const rings = allocation.slice(0, 4).map((item, idx) => ({
    ...item,
    radius: [72, 58, 44, 30][idx] ?? 30,
    width: idx === 3 ? 7 : 8,
    rotate: [-90, 18, -85, 62][idx] ?? 0,
  }))
  const selected = allocation.find((item) => item.label === active) ?? allocation[0]

  return (
    <div className="relative">
      <svg viewBox="0 0 180 180" className="h-[190px] w-[190px] sm:h-[208px] sm:w-[208px]">
        {rings.map((ring) => {
          const circumference = 2 * Math.PI * ring.radius
          const progress = circumference * (ring.value / 100)
          const isActive = ring.label === active
          return (
            <g
              key={ring.radius}
              transform={`rotate(${ring.rotate} 90 90)`}
              onMouseEnter={() => onActive(ring.label)}
              onFocus={() => onActive(ring.label)}
              className="cursor-pointer outline-none"
              tabIndex={0}
              role="button"
              aria-label={`${ring.label} allocation ${ring.value}%`}
            >
              <circle cx="90" cy="90" r={ring.radius} fill="none" stroke="var(--iv2-allocation-track)" strokeWidth={ring.width} />
              <circle
                cx="90"
                cy="90"
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={isActive ? ring.width + 3 : ring.width}
                strokeDasharray={`${progress} ${circumference - progress}`}
                strokeLinecap="round"
                className="transition-all duration-200"
                style={{ filter: isActive ? 'drop-shadow(0 0 5px rgba(255,255,255,.65))' : 'none' }}
              />
            </g>
          )
        })}
      </svg>
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#6f56c5]/70 text-center shadow-inner backdrop-blur-sm">
        <span className="text-[9px] uppercase tracking-wider text-white/70">{selected.label}</span>
        <span className="text-lg font-semibold text-white">{selected.value}%</span>
      </div>
    </div>
  )
}

export default function InvestmentsDashboardPage() {
  const dispatch = useAppDispatch()
  const summary = useAppSelector((s) => s.investmentOps.dashboardSummary)
  const summaryLoading = useAppSelector((s) => s.investmentOps.dashboardSummaryLoading)
  const allocationRaw = useAppSelector((s) => s.investmentOps.dashboardAllocation)
  const allocationLoading = useAppSelector((s) => s.investmentOps.dashboardAllocationLoading)
  const currencyRaw = useAppSelector((s) => s.investmentOps.dashboardCurrencyExposure)
  const currencyLoading = useAppSelector((s) => s.investmentOps.dashboardCurrencyExposureLoading)
  const fundsRaw = useAppSelector((s) => s.investmentOps.dashboardFunds)
  const fundsLoading = useAppSelector((s) => s.investmentOps.dashboardFundsLoading)

  const [portfolioPeriod, setPortfolioPeriod] = useState<Period>('Monthly')
  const [currencyPeriod, setCurrencyPeriod] = useState<Period>('Monthly')
  const [fundPeriod, setFundPeriod] = useState<Period>('Monthly')
  const [search, setSearch] = useState('')
  const [recalculated, setRecalculated] = useState(false)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [recalcError, setRecalcError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const portfolios = useMemo(() => mapDashboardPortfolios(summary), [summary])
  const funds = useMemo(() => mapDashboardFunds(fundsRaw), [fundsRaw])
  const allocation = useMemo(() => mapAllocation(allocationRaw), [allocationRaw])
  const currencyBars = useMemo(() => mapCurrencyBars(currencyRaw), [currencyRaw])

  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [selectedFund, setSelectedFund] = useState('')
  const [activeAllocation, setActiveAllocation] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [hoveredCurrency, setHoveredCurrency] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    const period = periodToApiParam(portfolioPeriod)
    Promise.all([
      dispatch(fetchDashboardSummary({ period })),
      dispatch(fetchDashboardFunds()),
    ]).then((results) => {
      if (cancelled) return
      const failed = results.some((r) => r.meta.requestStatus === 'rejected')
      if (failed) setLoadError('Unable to load dashboard data from the server.')
    })
    return () => {
      cancelled = true
    }
  }, [dispatch, portfolioPeriod])

  useEffect(() => {
    dispatch(fetchDashboardFunds())
  }, [dispatch, fundPeriod])

  useEffect(() => {
    const fundId = portfolios.find((p) => p.name === selectedPortfolio)?.fundId || portfolios[0]?.fundId || funds[0]?.fundId
    if (!fundId) return
    dispatch(fetchDashboardAllocation(fundId))
  }, [dispatch, portfolios, funds, selectedPortfolio])

  useEffect(() => {
    const fundId = portfolios.find((p) => p.name === selectedPortfolio)?.fundId || portfolios[0]?.fundId || funds[0]?.fundId
    if (!fundId) return
    dispatch(fetchDashboardCurrencyExposure(fundId))
  }, [dispatch, portfolios, funds, selectedPortfolio, currencyPeriod])

  useEffect(() => {
    if (portfolios[0] && !selectedPortfolio) setSelectedPortfolio(portfolios[0].name)
  }, [portfolios, selectedPortfolio])
  useEffect(() => {
    if (funds[0] && !selectedFund) setSelectedFund(funds[0].name)
  }, [funds, selectedFund])
  useEffect(() => {
    if (allocation[0] && !activeAllocation) setActiveAllocation(allocation[0].label)
  }, [allocation, activeAllocation])
  useEffect(() => {
    if (currencyBars[0]) setSelectedCurrency(currencyBars[0].label)
  }, [currencyBars])

  const query = search.trim().toLowerCase()
  const visiblePortfolios = useMemo(
    () => portfolios.filter((item) => item.name.toLowerCase().includes(query)),
    [query, portfolios],
  )
  const visibleFunds = useMemo(
    () => funds.filter((item) => item.name.toLowerCase().includes(query)),
    [query, funds],
  )

  const loading = summaryLoading || fundsLoading

  const handleRecalculate = async () => {
    const fundId = portfolios.find((p) => p.name === selectedPortfolio)?.fundId || portfolios[0]?.fundId
    if (!fundId) return
    setRecalcError(null)
    setRecalcLoading(true)
    try {
      await investmentOpsApi.recalculateDashboard(fundId)
      setRecalculated(true)
      dispatch(fetchDashboardSummary({ period: periodToApiParam(portfolioPeriod) }))
      dispatch(fetchDashboardAllocation(fundId))
      dispatch(fetchDashboardCurrencyExposure(fundId))
      window.setTimeout(() => setRecalculated(false), 1800)
    } catch (e) {
      setRecalcError(e instanceof Error ? e.message : 'Recalculate failed')
    } finally {
      setRecalcLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-[#05090f] px-3 pb-7 pt-4 text-[#eef2f8] sm:px-5">
      <header className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-5">
        <h1 className="text-[20px] font-medium tracking-[-0.02em] text-white">Dashboard</h1>
        <label className="flex h-10 w-full items-center gap-3 rounded-full border border-[#303742] bg-black px-4 transition focus-within:border-[#52627a] focus-within:ring-2 focus-within:ring-[#4b8cff]/30 sm:w-[230px]">
          <Search className="h-4 w-4 shrink-0 text-[#b5bfcd]" strokeWidth={1.7} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search here..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[#717987]"
          />
        </label>
      </header>

      {(loadError || recalcError) && (
        <div className="mb-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {loadError || recalcError}
        </div>
      )}

      {loading && portfolios.length === 0 ? (
        <OpsPageSkeleton className="mb-4" kpis={4} tableRows={8} tableCols={5} />
      ) : (
      <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
        <section className="overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_52%,#0c1522_100%)] shadow-[0_22px_70px_rgba(0,0,0,.18)]">
          <div className="flex min-h-[62px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h2 className="text-[16px] font-medium lowercase text-[#f2f5fa]">portfolios</h2>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelect value={portfolioPeriod} onChange={setPortfolioPeriod} />
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={recalcLoading}
                className="inline-flex h-8 min-w-[110px] items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[11px] font-semibold text-[#111722] shadow-sm transition hover:bg-[#edf2f8] disabled:opacity-60"
              >
                {recalcLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : recalculated ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {recalcLoading ? 'Recalculating…' : recalculated ? 'Recalculated' : 'Recalculate'}
              </button>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <RefetchOverlay active={summaryLoading && portfolios.length > 0} rows={6} cols={5} />
            <table className="w-full min-w-[620px] border-collapse">
              <thead className="bg-white/[0.035] text-left text-[10px] font-normal text-[#738095]">
                <tr>
                  <th className="px-6 py-2.5 font-normal lowercase">portfolios</th>
                  <th className="px-4 py-2.5 font-normal">NAV</th>
                  <th className="px-4 py-2.5 font-normal">As of</th>
                  <th className="px-4 py-2.5 font-normal">PnL</th>
                  <th className="px-6 py-2.5 font-normal">In%</th>
                </tr>
              </thead>
              <tbody>
                {visiblePortfolios.map((portfolio) => (
                  <tr
                    key={portfolio.fundId}
                    onClick={() => setSelectedPortfolio(portfolio.name)}
                    className={`cursor-pointer border-b border-[#233043]/75 transition last:border-b-0 hover:bg-[#238cf4]/[0.08] ${
                      selectedPortfolio === portfolio.name ? 'bg-[#238cf4]/[0.11]' : ''
                    }`}
                  >
                    <td className="px-6 py-[18px] text-[12px] text-[#e2e7ef]">{portfolio.name}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5">
                        <MoneyDot tone={portfolio.tone} />
                        {portfolio.nav}
                      </span>
                    </td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{portfolio.asOf}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5">
                        <MoneyDot tone={portfolio.tone} />
                        {portfolio.pnl}
                      </span>
                    </td>
                    <td className="px-6 py-[18px] text-[12px] text-[#dce2eb]">{portfolio.percent}</td>
                  </tr>
                ))}
                {visiblePortfolios.length === 0 && !summaryLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-xs text-[#718096]">
                      {query ? 'No portfolios match your search.' : 'No portfolio data returned from the API.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-h-[350px] flex-col rounded-[24px] bg-[linear-gradient(145deg,#9d82e9_0%,#856dd8_52%,#7460ca_100%)] px-5 pb-5 pt-5 text-white shadow-[0_22px_70px_rgba(60,42,130,.24)] xl:min-h-[398px] xl:px-6">
          <h2 className="text-[16px] font-medium">
            Asset Allocation{allocationLoading ? '…' : ''}
          </h2>
          <div className="flex flex-1 items-center justify-center py-2">
            <AllocationRings allocation={allocation} active={activeAllocation} onActive={setActiveAllocation} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {allocation.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveAllocation(item.label)}
                onMouseEnter={() => setActiveAllocation(item.label)}
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-left text-[10px] transition ${
                  activeAllocation === item.label ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}({item.value}%)
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="min-h-[390px] overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(125deg,#162231_0%,#101a29_54%,#0c1522_100%)]">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h2 className="text-[16px] font-medium text-[#f2f5fa]">
              Currency Exposure{currencyLoading ? '…' : ''}
            </h2>
            <PeriodSelect value={currencyPeriod} onChange={setCurrencyPeriod} />
          </div>
          <div className="relative flex h-[308px] items-end justify-center gap-2 px-3 pb-9 sm:gap-5 sm:px-8">
            <RefetchOverlay active={currencyLoading && currencyBars.length > 0} rows={4} cols={4} />
            {currencyBars.length === 0 && !currencyLoading ? (
              <p className="self-center text-[12px] text-[#718096]">No currency exposure from API.</p>
            ) : currencyBars.length === 0 && currencyLoading ? (
              <OpsKpiSkeleton count={4} className="w-full self-center px-4" />
            ) : (
              currencyBars.map((bar) => (
                <button
                  key={bar.label}
                  type="button"
                  aria-label={`${bar.label} exposure ${bar.value}%`}
                  onMouseEnter={() => setHoveredCurrency(bar.label)}
                  onMouseLeave={() => setHoveredCurrency(null)}
                  onFocus={() => setHoveredCurrency(bar.label)}
                  onBlur={() => setHoveredCurrency(null)}
                  onClick={() => setSelectedCurrency(bar.label)}
                  className="group flex h-full min-h-[40px] flex-1 flex-col items-center justify-end gap-2 outline-none"
                >
                  <div
                    className="relative w-full max-w-[51px] min-h-[8px] rounded-t-[18px] transition-all duration-200 group-hover:opacity-100"
                    style={{
                      height: `${Math.max(bar.value, 4)}%`,
                      background: bar.color,
                      transform: (hoveredCurrency ?? selectedCurrency) === bar.label ? 'translateY(-5px)' : 'translateY(0)',
                      boxShadow:
                        (hoveredCurrency ?? selectedCurrency) === bar.label ? '0 12px 30px rgba(19,136,245,.22)' : 'none',
                      opacity: hoveredCurrency && hoveredCurrency !== bar.label ? 0.55 : 1,
                    }}
                  >
                    {(hoveredCurrency ?? selectedCurrency) === bar.label && (
                      <div className="pointer-events-none absolute left-1/2 top-6 z-20 flex h-11 min-w-[69px] -translate-x-1/2 items-center justify-center rounded-full bg-white px-3 text-[16px] font-semibold text-[#10151d] shadow-[0_12px_30px_rgba(0,0,0,.3)]">
                        {bar.value}%
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] transition ${
                      (hoveredCurrency ?? selectedCurrency) === bar.label ? 'text-white' : 'text-[#647389]'
                    }`}
                  >
                    {bar.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-h-[390px] overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_52%,#0c1522_100%)]">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h2 className="text-[16px] font-medium text-[#f2f5fa]">Funds</h2>
            <PeriodSelect value={fundPeriod} onChange={setFundPeriod} />
          </div>
          <div className="relative overflow-x-auto">
            <RefetchOverlay active={fundsLoading && funds.length > 0} rows={6} cols={5} />
            <table className="w-full min-w-[650px] border-collapse">
              <thead className="bg-white/[0.035] text-left text-[10px] text-[#738095]">
                <tr>
                  <th className="px-6 py-2.5 font-normal">Fund Name</th>
                  <th className="px-4 py-2.5 font-normal">NAV</th>
                  <th className="px-4 py-2.5 font-normal">Value Date</th>
                  <th className="px-4 py-2.5 font-normal">Shares</th>
                  <th className="px-6 py-2.5 font-normal">Currency</th>
                </tr>
              </thead>
              <tbody>
                {visibleFunds.map((fund) => (
                  <tr
                    key={fund.fundId}
                    onClick={() => setSelectedFund(fund.name)}
                    className={`cursor-pointer border-b border-[#233043]/75 transition last:border-b-0 hover:bg-[#238cf4]/[0.08] ${
                      selectedFund === fund.name ? 'bg-[#238cf4]/[0.11]' : ''
                    }`}
                  >
                    <td className="px-6 py-[18px] text-[12px] text-[#e2e7ef]">{fund.name}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5">
                        <MoneyDot tone={fund.tone} />
                        {fund.nav}
                      </span>
                    </td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{fund.valueDate}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{fund.shares}</td>
                    <td className="px-6 py-[18px] text-[12px] text-[#c2cad7]">{fund.currency}</td>
                  </tr>
                ))}
                {visibleFunds.length === 0 && !fundsLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-xs text-[#718096]">
                      {query ? 'No funds match your search.' : 'No funds returned from the API.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </>
      )}
    </div>
  )
}
