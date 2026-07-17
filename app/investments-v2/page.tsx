'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'YTD'
const periodOptions: Period[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'YTD']

const portfolios = [
  { name: 'Crypto Portfolio', nav: '245,893,449', asOf: '14 Apr, 20', pnl: '245,893,449', percent: '63.50%', tone: 'gold' },
  { name: 'Equity World', nav: '245,893,449', asOf: '20 Apr, 20', pnl: '245,893,449', percent: '63.50%', tone: 'blue' },
  { name: 'Multi Asset', nav: '245,893,449', asOf: '20 Apr, 20', pnl: '245,893,449', percent: '63.50%', tone: 'blue' },
  { name: 'Fixed Income', nav: '245,893,449', asOf: '21 Apr, 20', pnl: '245,893,449', percent: '63.50%', tone: 'gold' },
  { name: 'Liquid Asset', nav: '245,893,449', asOf: '24 Apr, 20', pnl: '245,893,449', percent: '63.50%', tone: 'teal' },
] as const

const funds = [
  { name: 'Crypto Fund', nav: '267,980,373', valueDate: '2 Jan, 20', shares: '102.43', currency: 'USD', tone: 'gold' },
  { name: 'Equity World Fund', nav: '12,369,689', valueDate: '26 Apr, 22', shares: '209.68', currency: 'EUR', tone: 'gold' },
  { name: 'Multi Asset SICAV', nav: '17,000,000', valueDate: '14 Jan, 20', shares: '231.25', currency: 'EUR', tone: 'blue' },
  { name: 'Fixed Income UCITS', nav: '269,893,564', valueDate: '12 Oct, 22', shares: '100.45', currency: 'USD', tone: 'teal' },
  { name: 'Liquid Assets Fund', nav: '98,420,110', valueDate: '9 Nov, 22', shares: '84.18', currency: 'GBP', tone: 'blue' },
] as const

const currencyBars = [
  { label: 'CHF', value: 54, color: 'var(--iv2-chart-dark)' },
  { label: 'EUR', value: 33, color: 'var(--iv2-chart-dark-2)' },
  { label: 'GBP', value: 70, color: '#d2e5ff' },
  { label: 'USD', value: 87, color: '#1388f5' },
  { label: 'ZAR', value: 47, color: 'var(--iv2-chart-dark-2)' },
]

const allocation = [
  { label: 'Bond', value: 39, color: '#ffffff' },
  { label: 'Crypto', value: 29, color: 'var(--iv2-allocation-dark)' },
  { label: 'Equity', value: 16, color: '#d9d0fa' },
  { label: 'Others', value: 2, color: '#8d70f4' },
]

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
  active,
  onActive,
}: {
  active: string
  onActive: (label: string) => void
}) {
  const rings = [
    { ...allocation[0], radius: 72, width: 8, rotate: -90 },
    { ...allocation[1], radius: 58, width: 8, rotate: 18 },
    { ...allocation[3], radius: 44, width: 8, rotate: -85 },
    { ...allocation[2], radius: 30, width: 7, rotate: 62 },
  ]
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
  const [portfolioPeriod, setPortfolioPeriod] = useState<Period>('Monthly')
  const [currencyPeriod, setCurrencyPeriod] = useState<Period>('Monthly')
  const [fundPeriod, setFundPeriod] = useState<Period>('Monthly')
  const [search, setSearch] = useState('')
  const [recalculated, setRecalculated] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState(portfolios[0].name)
  const [selectedFund, setSelectedFund] = useState(funds[0].name)
  const [activeAllocation, setActiveAllocation] = useState(allocation[0].label)
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [hoveredCurrency, setHoveredCurrency] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  const visiblePortfolios = useMemo(
    () => portfolios.filter((item) => item.name.toLowerCase().includes(query)),
    [query],
  )
  const visibleFunds = useMemo(
    () => funds.filter((item) => item.name.toLowerCase().includes(query)),
    [query],
  )

  const handleRecalculate = () => {
    setRecalculated(true)
    window.setTimeout(() => setRecalculated(false), 1800)
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
        <section className="overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_52%,#0c1522_100%)] shadow-[0_22px_70px_rgba(0,0,0,.18)]">
          <div className="flex min-h-[62px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h2 className="text-[16px] font-medium lowercase text-[#f2f5fa]">portfolios</h2>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelect value={portfolioPeriod} onChange={setPortfolioPeriod} />
              <button
                type="button"
                onClick={handleRecalculate}
                className="inline-flex h-8 min-w-[110px] items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[11px] font-semibold text-[#111722] shadow-sm transition hover:bg-[#edf2f8]"
              >
                {recalculated && <Check className="h-3.5 w-3.5" />}
                {recalculated ? 'Recalculated' : 'Recalculate'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
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
                    key={portfolio.name}
                    onClick={() => setSelectedPortfolio(portfolio.name)}
                    className={`cursor-pointer border-b border-[#233043]/75 transition last:border-b-0 hover:bg-[#238cf4]/[0.08] ${
                      selectedPortfolio === portfolio.name ? 'bg-[#238cf4]/[0.11]' : ''
                    }`}
                  >
                    <td className="px-6 py-[18px] text-[12px] text-[#e2e7ef]">{portfolio.name}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5"><MoneyDot tone={portfolio.tone} />{portfolio.nav}</span>
                    </td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{portfolio.asOf}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5"><MoneyDot tone={portfolio.tone} />{portfolio.pnl}</span>
                    </td>
                    <td className="px-6 py-[18px] text-[12px] text-[#dce2eb]">{portfolio.percent}</td>
                  </tr>
                ))}
                {visiblePortfolios.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-xs text-[#718096]">No portfolios match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-h-[350px] flex-col rounded-[24px] bg-[linear-gradient(145deg,#9d82e9_0%,#856dd8_52%,#7460ca_100%)] px-5 pb-5 pt-5 text-white shadow-[0_22px_70px_rgba(60,42,130,.24)] xl:min-h-[398px] xl:px-6">
          <h2 className="text-[16px] font-medium">Asset Allocation</h2>
          <div className="flex flex-1 items-center justify-center py-2">
            <AllocationRings active={activeAllocation} onActive={setActiveAllocation} />
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
            <h2 className="text-[16px] font-medium text-[#f2f5fa]">Currency Exposure</h2>
            <PeriodSelect value={currencyPeriod} onChange={setCurrencyPeriod} />
          </div>
          <div className="relative flex h-[308px] items-end justify-center gap-2 px-3 pb-9 sm:gap-5 sm:px-8">
            {currencyBars.map((bar) => (
              <button
                key={bar.label}
                type="button"
                aria-label={`${bar.label} exposure ${bar.value}%`}
                onMouseEnter={() => setHoveredCurrency(bar.label)}
                onMouseLeave={() => setHoveredCurrency(null)}
                onFocus={() => setHoveredCurrency(bar.label)}
                onBlur={() => setHoveredCurrency(null)}
                onClick={() => setSelectedCurrency(bar.label)}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2 outline-none"
              >
                <div
                  className="relative w-full max-w-[51px] rounded-t-[18px] transition-all duration-200"
                  style={{
                    height: `${bar.value}%`,
                    background: bar.color,
                    transform: (hoveredCurrency ?? selectedCurrency) === bar.label ? 'translateY(-5px)' : 'translateY(0)',
                    boxShadow: (hoveredCurrency ?? selectedCurrency) === bar.label ? '0 12px 30px rgba(19,136,245,.22)' : 'none',
                    opacity: hoveredCurrency && hoveredCurrency !== bar.label ? 0.55 : 1,
                  }}
                >
                  {(hoveredCurrency ?? selectedCurrency) === bar.label && (
                    <div className="absolute left-1/2 top-6 z-20 flex h-11 min-w-[69px] -translate-x-[8%] items-center justify-center rounded-full bg-white px-3 text-[16px] font-semibold text-[#10151d] shadow-[0_12px_30px_rgba(0,0,0,.3)]">
                      <span className="absolute -left-1.5 h-2.5 w-2.5 rounded-full bg-black" />
                      {bar.value}%
                    </div>
                  )}
                </div>
                <span className={`text-[10px] transition ${(hoveredCurrency ?? selectedCurrency) === bar.label ? 'text-white' : 'text-[#647389]'}`}>{bar.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="min-h-[390px] overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_52%,#0c1522_100%)]">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h2 className="text-[16px] font-medium text-[#f2f5fa]">Funds</h2>
            <PeriodSelect value={fundPeriod} onChange={setFundPeriod} />
          </div>
          <div className="overflow-x-auto">
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
                    key={fund.name}
                    onClick={() => setSelectedFund(fund.name)}
                    className={`cursor-pointer border-b border-[#233043]/75 transition last:border-b-0 hover:bg-[#238cf4]/[0.08] ${
                      selectedFund === fund.name ? 'bg-[#238cf4]/[0.11]' : ''
                    }`}
                  >
                    <td className="px-6 py-[18px] text-[12px] text-[#e2e7ef]">{fund.name}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#d5dce7]">
                      <span className="inline-flex items-center gap-1.5"><MoneyDot tone={fund.tone} />{fund.nav}</span>
                    </td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{fund.valueDate}</td>
                    <td className="px-4 py-[18px] text-[12px] text-[#c2cad7]">{fund.shares}</td>
                    <td className="px-6 py-[18px] text-[12px] text-[#c2cad7]">{fund.currency}</td>
                  </tr>
                ))}
                {visibleFunds.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-xs text-[#718096]">No funds match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
