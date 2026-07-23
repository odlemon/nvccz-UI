'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Loader2, MoreVertical } from 'lucide-react'
import { OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import {
  mapFundOptions,
  mapPortfolioNavSummary,
  mapTradingPositions,
  type TradingPositionRow,
} from '@/lib/investments-v2/adapters/orders-adapter'

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  compact?: boolean
}) {
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
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-full border border-[#344054] bg-[#101927]/85 text-left text-[#d4dbe5] shadow-[0_8px_24px_rgba(0,0,0,.12)] transition hover:border-[#53627a] hover:bg-[#162235] focus:outline-none focus:ring-2 focus:ring-[#2f87fa]/30 ${
          compact ? 'h-8 min-w-[112px] gap-3 px-4 text-[10px]' : 'h-9 gap-3 px-4 text-[11px]'
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-[#78879b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111a28]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-xl"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] transition ${
                value === option ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              {option}
              {value === option && <Check className="ml-3 h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionMenu({ onAction }: { onAction: (action: string) => void }) {
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
    <div ref={rootRef} className="relative z-40">
      <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-full p-2 text-[#d7dee8] transition hover:bg-white/10" aria-label="More filter actions">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-40 rounded-2xl border border-white/10 bg-[#111a28]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-xl">
          {['Save current view', 'Reset filters', 'Export positions'].map((action) => (
            <button key={action} type="button" onClick={() => { onAction(action); setOpen(false) }} className="w-full rounded-full px-3 py-2 text-left text-[10px] text-[#9ca9ba] transition hover:bg-white/[0.07] hover:text-white">
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TradingPage() {
  const [positions, setPositions] = useState<TradingPositionRow[]>([])
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [navSummary, setNavSummary] = useState({ nav: '—', securities: '—', cash: '—', asOf: '—' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closedPositions, setClosedPositions] = useState('Exclude')
  const [quantitySearch, setQuantitySearch] = useState('')
  const [side, setSide] = useState<'Long' | 'Short'>('Long')
  const [expiryDate, setExpiryDate] = useState('')
  const [portfolio, setPortfolio] = useState('No filter')
  const [folder, setFolder] = useState('No filter')
  const [instrumentType, setInstrumentType] = useState('No filter')
  const [currency, setCurrency] = useState('No filter')
  const [industry, setIndustry] = useState('No filter')
  const [view, setView] = useState('Default View')
  const [fromDate, setFromDate] = useState('')
  const [asOfDate, setAsOfDate] = useState('')
  const [recalculated, setRecalculated] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const portfoliosRes = await investmentOpsApi.listPortfolios()
      if (portfoliosRes.success === false) {
        throw new Error(portfoliosRes.message || portfoliosRes.error || 'Failed to load portfolios')
      }
      const fundList = mapFundOptions(portfoliosRes.data)
      setFunds(fundList)

      if (fundList.length === 0) {
        setPositions([])
        setNavSummary({ nav: '—', securities: '—', cash: '—', asOf: '—' })
        return
      }

      const holdingsResults = await Promise.all(
        fundList.map(async (fund) => {
          try {
            const res = await investmentOpsApi.getPortfolioHoldings(fund.id)
            if (res.success === false) return [] as TradingPositionRow[]
            return mapTradingPositions(res.data, fund.name, fund.id)
          } catch {
            return [] as TradingPositionRow[]
          }
        }),
      )
      const all = holdingsResults.flat()
      setPositions(all)
      setSelectedPosition((prev) => prev ?? all[0]?.reference ?? null)

      const primary = fundList[0]
      try {
        const overviewRes = await investmentOpsApi.getPortfolioOverview(primary.id)
        if (overviewRes.success !== false && overviewRes.data) {
          const summary = mapPortfolioNavSummary(overviewRes.data)
          setNavSummary(summary)
          const asOfRaw = overviewRes.data.valuationDate ?? overviewRes.data.asOfDate
          const fromRaw = overviewRes.data.startDate
          setAsOfDate(asOfRaw ? String(asOfRaw).slice(0, 10) : '')
          setFromDate(fromRaw ? String(fromRaw).slice(0, 10) : '')
        }
      } catch {
        /* overview optional */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load positions')
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const portfolioNames = useMemo(() => ['No filter', 'All Portfolios', ...funds.map((f) => f.name)], [funds])
  const currencyOptions = useMemo(() => {
    const set = new Set(positions.map((p) => p.currency).filter((c) => c && c !== '—'))
    return ['No filter', ...[...set].sort()]
  }, [positions])
  const typeOptions = useMemo(() => {
    const set = new Set(positions.map((p) => p.type).filter((t) => t && t !== '—'))
    return ['No filter', ...[...set].sort()]
  }, [positions])
  const industryOptions = useMemo(() => {
    const set = new Set(positions.map((p) => p.industry).filter((t) => t && t !== '—'))
    return ['No filter', ...[...set].sort()]
  }, [positions])

  const filteredPositions = useMemo(() => {
    const quantity = quantitySearch.trim().replaceAll(',', '')
    return positions.filter((position) => {
      if (portfolio !== 'No filter' && portfolio !== 'All Portfolios' && position.portfolio !== portfolio) return false
      if (currency !== 'No filter' && position.currency !== currency) return false
      if (industry !== 'No filter' && position.industry !== industry) return false
      if (instrumentType !== 'No filter' && position.type !== instrumentType) return false
      const qtyNum = Number(position.quantity.replaceAll(',', ''))
      const isClosed = Number.isFinite(qtyNum) && qtyNum === 0
      if (closedPositions === 'Exclude' && isClosed) return false
      if (closedPositions === 'Only closed' && !isClosed) return false
      if (quantity && !position.quantity.replaceAll(',', '').includes(quantity)) return false
      if (side === 'Short') {
        if (!(Number.isFinite(qtyNum) && qtyNum < 0)) return false
      } else if (side === 'Long' && Number.isFinite(qtyNum) && qtyNum < 0) {
        return false
      }
      return true
    })
  }, [closedPositions, currency, industry, instrumentType, portfolio, quantitySearch, positions, side])

  const recalculate = async () => {
    const fund = funds.find((f) => f.name === portfolio) || funds[0]
    if (!fund || recalculating) return
    setRecalculating(true)
    try {
      await investmentOpsApi.recalculatePortfolio(fund.id)
      setRecalculated(true)
      await load()
      window.setTimeout(() => setRecalculated(false), 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculate failed')
    } finally {
      setRecalculating(false)
    }
  }

  const handleMenuAction = (action: string) => {
    if (action === 'Reset filters') {
      setClosedPositions('Exclude'); setQuantitySearch(''); setSide('Long'); setExpiryDate('')
      setPortfolio('No filter'); setFolder('No filter'); setInstrumentType('No filter')
      setCurrency('No filter'); setIndustry('No filter'); setView('Default View')
      return
    }
    if (action === 'Save current view') {
      window.localStorage.setItem('investments-v2-trading-view', JSON.stringify({ closedPositions, quantitySearch, side, expiryDate, portfolio, folder, instrumentType, currency, industry, view, fromDate, asOfDate }))
      return
    }
    const csv = ['Portfolio,Reference,Quantity,Currency,Type', ...filteredPositions.map(position => [position.portfolio, position.reference, position.quantity, position.currency, position.type].join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a'); link.href = url; link.download = 'investment-positions.csv'; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
      {error && (
        <div className="mb-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className="ml-3 rounded-full border border-white/20 px-3 py-1 text-[11px]" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <section className="overflow-visible rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)] shadow-[0_22px_70px_rgba(0,0,0,.18)]">
        <header className="flex min-h-[54px] items-center justify-between gap-3 border-b border-[#2a3547] px-5 py-3">
          <h1 className="text-[13px] font-medium text-white">Filters</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={recalculating}
              onClick={() => void recalculate()}
              className="inline-flex h-8 min-w-[98px] items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-semibold text-[#111722] transition hover:bg-[#edf2f8] disabled:opacity-60"
            >
              {recalculating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : recalculated ? (
                <Check className="h-3.5 w-3.5" />
              ) : null}
              {recalculating ? 'Recalculating…' : recalculated ? 'Updated' : 'Recalculate'}
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#2a3547] px-4 py-3 sm:px-5">
          <FilterDropdown label="Portfolio scope" value={portfolio === 'No filter' ? 'All Portfolios' : portfolio} options={['All Portfolios', ...funds.map((f) => f.name)]} onChange={(value) => setPortfolio(value === 'All Portfolios' ? 'All Portfolios' : value)} compact />
          <FilterDropdown label="View" value={view} options={['Default View', 'Exposure View', 'Cash View', 'Compact View']} onChange={setView} compact />
          <label className="inline-flex h-8 items-center gap-2 rounded-full border border-[#344054] bg-[#101927]/85 px-4 text-[10px] text-[#d4dbe5]">
            <CalendarDays className="h-3 w-3 shrink-0 text-[#78879b]" />
            <span className="text-[#78879b]">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[108px] bg-transparent text-[10px] outline-none"
              aria-label="From date"
            />
          </label>
          <label className="inline-flex h-8 items-center gap-2 rounded-full border border-[#344054] bg-[#101927]/85 px-4 text-[10px] text-[#d4dbe5]">
            <CalendarDays className="h-3 w-3 shrink-0 text-[#78879b]" />
            <span className="text-[#78879b]">As of</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-[108px] bg-transparent text-[10px] outline-none"
              aria-label="As of date"
            />
          </label>
          <ActionMenu onAction={handleMenuAction} />
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Closed Positions</span>
            <FilterDropdown label="Closed positions" value={closedPositions} options={['Exclude', 'Include', 'Only closed']} onChange={setClosedPositions} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Quantity from/to</span>
            <input
              value={quantitySearch}
              onChange={(event) => setQuantitySearch(event.target.value)}
              placeholder="Enter text"
              inputMode="numeric"
              className="h-9 w-full rounded-[10px] border border-[#344054] bg-[#101927]/85 px-4 text-[11px] text-white outline-none transition placeholder:text-[#68768a] focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/25"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-[10.5px] text-[#c4ccd7]">Quantity</legend>
            <div className="flex h-9 items-center gap-6">
              {(['Long', 'Short'] as const).map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 text-[11px] text-[#d3dae4]">
                  <input className="sr-only" type="radio" name="quantity-side" checked={side === option} onChange={() => setSide(option)} />
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${side === option ? 'border-[#5a7399]' : 'border-[#455268]'}`}>
                    {side === option && <span className="h-2 w-2 rounded-full bg-[#2f87fa]" />}
                  </span>
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Expiry/Maturity from/to</span>
            <span className="relative block">
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="h-9 w-full appearance-none rounded-[10px] border border-[#344054] bg-[#101927]/85 px-4 pr-10 text-[11px] text-[#d3dae4] outline-none transition focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/25"
              />
              <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b7c0cd]" />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Portfolio</span>
            <FilterDropdown label="Portfolio" value={portfolio} options={portfolioNames} onChange={setPortfolio} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Folder</span>
            <FilterDropdown label="Folder" value={folder} options={['No filter']} onChange={setFolder} />
            <p className="mt-1 text-[9px] text-[#718095]">Folder tagging is configured under Portfolios → Folder setup.</p>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Instrument type</span>
            <FilterDropdown label="Instrument type" value={instrumentType} options={typeOptions} onChange={setInstrumentType} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Currency</span>
            <FilterDropdown label="Currency" value={currency} options={currencyOptions} onChange={setCurrency} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10.5px] text-[#c4ccd7]">Industry</span>
            <FilterDropdown label="Industry" value={industry} options={industryOptions.length > 1 ? industryOptions : ['No filter']} onChange={setIndustry} />
          </label>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)]">
        <header className="flex min-h-[50px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <h2 className="text-[13px] font-medium text-white">Positions</h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px]">
            <span className="text-[#738095]">NAV: <strong className="font-normal text-[#7eb1ef]">{loading ? '…' : navSummary.nav}</strong></span>
            <span className="text-[#738095]">Securities: <strong className="font-normal text-[#7eb1ef]">{loading ? '…' : navSummary.securities}</strong></span>
            <span className="text-[#738095]">Cash balance:</span>
            <span className="text-[#738095]">Checked Cash: <strong className="font-normal text-[#a9b6c7]">{navSummary.asOf}</strong></span>
            <span className="text-[#738095]">Pending Cash: <strong className="font-normal text-[#7eb1ef]">{navSummary.cash}</strong></span>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-white/[0.035] text-left text-[9px] text-[#738095]">
              <tr>
                <th className="px-5 py-2.5 font-normal">Portfolio</th>
                <th className="px-4 py-2.5 font-normal">Reference</th>
                <th className="px-4 py-2.5 font-normal">Short Name</th>
                <th className="px-4 py-2.5 font-normal">Quantity</th>
                <th className="px-4 py-2.5 font-normal">Open</th>
                <th className="px-4 py-2.5 font-normal">Price</th>
                <th className="px-5 py-2.5 font-normal">TR</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <OpsTableSkeleton rows={8} cols={7} />
                  </td>
                </tr>
              )}
              {!loading &&
                filteredPositions.map((position, index) => (
                  <tr
                    key={`${position.fundId}-${position.reference}-${index}`}
                    onClick={() => setSelectedPosition(position.reference)}
                    className={`cursor-pointer border-b border-[#243044] transition last:border-0 hover:bg-[#2f87fa]/[0.07] ${
                      selectedPosition === position.reference ? 'bg-[#2f87fa]/[0.09]' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-[10.5px] text-[#dce3ec]">{position.portfolio}</td>
                    <td className="px-4 py-4 text-[10.5px] text-[#dce3ec]">{position.reference}</td>
                    <td className="px-4 py-4 text-[10.5px] text-[#dce3ec]">{position.shortName}</td>
                    <td className="px-4 py-4 text-[10.5px] text-[#dce3ec]">{position.quantity}</td>
                    <td className="px-4 py-4 text-[10.5px] text-[#dce3ec]">{position.open}</td>
                    <td className="px-4 py-4 text-[10.5px] text-[#dce3ec]">{position.price}</td>
                    <td className="px-5 py-4 text-[10.5px] text-[#dce3ec]">{position.tr}</td>
                  </tr>
                ))}
              {!loading && filteredPositions.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[11px] text-[#718095]">No positions match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
