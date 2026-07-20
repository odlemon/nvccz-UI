'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, ChevronDown, ChevronLeft, ChevronRight, Folder, FolderOpen, Search, SlidersHorizontal, X } from 'lucide-react'
import { OpsKpiSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import type { Holding } from '@/lib/api/investments-api'
import {
  formatMoneyDisplay,
  mapFundTabs,
  mapHoldingsToPositions,
  mapValuedPositionsPayload,
  type FundTab,
  type PositionRow,
} from '@/lib/investments-v2/adapters/portfolio-adapter'

const card = 'rounded-[24px] border border-white/[0.06] bg-[linear-gradient(135deg,#172333_0%,#101a29_58%,#0b1420_100%)] shadow-[0_20px_60px_rgba(0,0,0,.2)]'
const pill = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] font-medium transition hover:border-white/20 hover:bg-white/[0.06]'
const money = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `$${formatMoneyDisplay(value, 0)}`
  }
}

export default function PositionsPage() {
  const [funds, setFunds] = useState<FundTab[]>([])
  const [fundId, setFundId] = useState('')
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('All positions')
  const [currency, setCurrency] = useState('All currencies')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [sort, setSort] = useState<'value' | 'ticker'>('value')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PositionRow | null>(null)

  const activeFund = funds.find((f) => f.id === fundId) ?? funds[0]
  const portfolioName = activeFund?.name ?? 'Portfolio'

  const loadFunds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.listPortfolios()
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load portfolios')
      const tabs = mapFundTabs(res.data)
      setFunds(tabs)
      setFundId((current) => current || tabs[0]?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolios')
      setFunds([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPositions = useCallback(async (id: string, fund: FundTab | undefined) => {
    if (!id || !fund) {
      setPositions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [positionsRes, holdingsRes, overviewRes] = await Promise.all([
        investmentOpsApi.getPortfolioPositions(id),
        investmentOpsApi.getPortfolioHoldings(id),
        investmentOpsApi.getPortfolioOverview(id),
      ])

      const fromPositions =
        positionsRes.success ? mapValuedPositionsPayload(positionsRes.data, fund) : []
      if (fromPositions.length > 0) {
        setPositions(fromPositions)
      } else if (holdingsRes.success) {
        const holdings = unwrapList<Holding>(holdingsRes.data)
        const nav = overviewRes.success ? overviewRes.data?.nav : null
        setPositions(mapHoldingsToPositions(holdings, fund, nav != null ? Number(nav) : null))
      } else if (!positionsRes.success) {
        throw new Error(
          positionsRes.error ||
            holdingsRes.error ||
            positionsRes.message ||
            holdingsRes.message ||
            'Failed to load positions',
        )
      } else {
        setPositions([])
      }
      setSelected(null)
      setPage(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load positions')
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFunds()
  }, [loadFunds])

  useEffect(() => {
    if (fundId) void loadPositions(fundId, funds.find((f) => f.id === fundId))
  }, [fundId, funds, loadPositions])

  const currencyOptions = useMemo(() => {
    const set = new Set(positions.map((row) => row.currency).filter(Boolean))
    return ['All currencies', ...Array.from(set)]
  }, [positions])

  const filtered = useMemo(
    () =>
      positions
        .filter((row) => type === 'All positions' || row.type === type)
        .filter((row) => currency === 'All currencies' || row.currency === currency)
        .filter((row) => !search || `${row.ticker} ${row.name} ${row.sector}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sort === 'value' ? b.value - a.value : a.ticker.localeCompare(b.ticker))),
    [currency, positions, search, sort, type],
  )
  const totalValue = positions.reduce((sum, row) => sum + row.value, 0)
  const totalPnl = positions.reduce((sum, row) => sum + row.pnl, 0)
  const cashValue = positions.filter((row) => row.type === 'Cash').reduce((sum, row) => sum + row.value, 0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5))
  const rows = filtered.slice((page - 1) * 5, page * 5)

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#edf3fa] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="px-1">
          <p className="text-[10px] uppercase tracking-[.24em] text-[#65758b]">Portfolio market</p>
          <h1 className="mt-1 text-xl font-semibold">Positions</h1>
          <p className="mt-1 text-[11px] text-[#77869a]">Holdings, cash and valuation context by portfolio.</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">{error}</div>
        )}
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {funds.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFundId(item.id)
                setPage(1)
                setSelected(null)
              }}
              className={`${pill} h-10 shrink-0 ${fundId === item.id ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8997a9]'}`}
            >
              {fundId === item.id ? <FolderOpen className="h-3.5 w-3.5 text-[#5d9df3]" /> : <Folder className="h-3.5 w-3.5" />}
              {item.name}
            </button>
          ))}
          {!loading && funds.length === 0 && <p className="text-[11px] text-[#6f7e92]">No portfolios returned from the API.</p>}
        </nav>

        {loading && positions.length === 0 && funds.length === 0 ? (
          <OpsKpiSkeleton count={4} />
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total market value', positions.length ? money(totalValue) : '—', 'text-white'],
              ['Unrealised P&L', positions.length ? `${totalPnl >= 0 ? '+' : ''}${money(totalPnl)}` : '—', totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'],
              ['Cash balance', positions.length ? money(cashValue) : '—', 'text-[#70adff]'],
              ['Open positions', positions.length, 'text-white'],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className={`${card} px-5 py-4`}>
                <p className="text-[9px] uppercase tracking-[.16em] text-[#718096]">{label}</p>
                <p className={`mt-2 font-mono text-xl font-semibold ${tone}`}>{value}</p>
              </div>
            ))}
          </section>
        )}

        <section className={`${card} overflow-visible`}>
          <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold">{portfolioName}</p>
              <p className="mt-1 text-[9px] text-[#6f7e92]">Live positions · falls back to holdings when valuation items are empty</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 min-w-[210px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#0b1420] px-4 text-[#7c8a9e]">
                <Search className="h-3.5 w-3.5" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search holdings" className="w-full bg-transparent text-[11px] text-white outline-none" />
              </label>
              <div className="relative">
                <button type="button" onClick={() => setCurrencyOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{currency}<ChevronDown className="h-3 w-3" /></button>
                {currencyOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-40 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                    {currencyOptions.map((item) => (
                      <button key={item} type="button" onClick={() => { setCurrency(item); setPage(1); setCurrencyOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${currency === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                        {item}{currency === item && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button type="button" onClick={() => setFilterOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}><SlidersHorizontal className="h-3.5 w-3.5" />{type}<ChevronDown className="h-3 w-3" /></button>
                {filterOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                    {['All positions', 'Holding', 'Cash'].map((item) => (
                      <button key={item} type="button" onClick={() => { setType(item); setPage(1); setFilterOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${type === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                        {item}{type === item && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setSort((value) => (value === 'value' ? 'ticker' : 'value'))} className={`${pill} text-[#aeb8c7]`}>
                <ArrowDownUp className="h-3.5 w-3.5" />{sort === 'value' ? 'Market value' : 'Ticker'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-[10px]">
              <thead className="text-[#6f7e92]">
                <tr>
                  {['Position', 'Type', 'Sector', 'Currency', 'Quantity', 'Average cost', 'Market price', 'Market value', 'Unrealised P&L', 'Weight', 'Open date'].map((head) => (
                    <th key={head} className={`border-b border-white/[0.06] px-4 py-3 font-medium ${['Quantity', 'Average cost', 'Market price', 'Market value', 'Unrealised P&L', 'Weight'].includes(head) ? 'text-right' : ''}`}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <OpsTableSkeleton rows={8} cols={11} />
                    </td>
                  </tr>
                )}
                {!loading && rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className={`cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.035] ${selected?.id === row.id ? 'bg-[#2f87fa]/10' : ''}`}
                  >
                    <td className="px-4 py-3"><p className="font-semibold text-white">{row.ticker}</p><p className="mt-1 text-[9px] text-[#78879a]">{row.name}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] ${row.type === 'Cash' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-[#2f87fa]/15 text-[#70adff]'}`}>{row.type}</span></td>
                    <td className="px-4 py-3 text-[#a5b0bf]">{row.sector}</td>
                    <td className="px-4 py-3 font-mono text-[#a5b0bf]">{row.currency}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#a5b0bf]">{row.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{row.value.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-mono ${row.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{row.pnl >= 0 ? '+' : ''}{row.pnl.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.weight.toFixed(1)}%</td>
                    <td className="px-4 py-3 font-mono text-[#7d8b9e]">{row.date}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-14 text-center text-[11px] text-[#6f7e92]">
                      No positions returned from the API.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-black/10">
                  <td colSpan={7} className="px-4 py-3 text-[9px] uppercase tracking-wider text-[#718096]">Portfolio total · {positions.length} positions</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{positions.length ? totalValue.toLocaleString() : '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{positions.length ? `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}` : '—'}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#718096]">
            <span>Showing {rows.length} of {filtered.length} positions</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronLeft className="h-3.5 w-3.5" /></button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </footer>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onMouseDown={() => setSelected(null)}>
          <aside onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[linear-gradient(145deg,#172333,#0b1420_70%)] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[.2em] text-[#64758b]">Position detail</p>
                <h2 className="mt-2 text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 font-mono text-[10px] text-[#718096]">{portfolioName} · {selected.ticker}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['Market value', money(selected.value)],
                ['Unrealised P&L', `${selected.pnl >= 0 ? '+' : ''}${money(selected.pnl)}`],
                ['Portfolio weight', `${selected.weight.toFixed(1)}%`],
                ['Position type', selected.type],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-white/[0.07] bg-black/10 p-4">
                  <p className="text-[9px] uppercase tracking-wider text-[#66768b]">{label}</p>
                  <p className="mt-2 font-mono text-sm">{value}</p>
                </div>
              ))}
            </div>
            <section className="mt-5 rounded-[24px] border border-white/[0.07] bg-black/10 p-5">
              <h3 className="text-[11px] font-semibold">Valuation detail</h3>
              <dl className="mt-4 grid grid-cols-2 gap-5">
                {[
                  ['Quantity', selected.quantity.toLocaleString()],
                  ['Average cost', selected.cost.toFixed(4)],
                  ['Current price', selected.price.toFixed(4)],
                  ['Currency', selected.currency],
                  ['Sector', selected.sector],
                  ['Open date', selected.date],
                  ['Pricing source', selected.type === 'Cash' ? 'Unit price' : 'Approved market close'],
                  ['Last valued', selected.date],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[9px] uppercase tracking-wider text-[#66768b]">{label}</dt>
                    <dd className="mt-1 text-[11px] text-[#c8d0db]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}
