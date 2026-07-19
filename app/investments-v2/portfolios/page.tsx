'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Folder, Loader2, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { investmentOpsApi, unwrapList, type PortfolioOverview } from '@/lib/api/investment-ops-api'
import type { Holding } from '@/lib/api/investments-api'
import {
  mapFundTabs,
  mapHoldingToOrderRow,
  mapOverviewMetrics,
  type FundTab,
  type HoldingOrderRow,
} from '@/lib/investments-v2/adapters/portfolio-adapter'

const CHART_COLORS = ['var(--iv2-chart-highlight)', '#2f87fa', '#9b82df', '#79b0f7', '#dcecff', '#87909d']
const CURRENCY_COLORS = ['#2f7ff0', '#86baf8', '#8c73cf', '#deecfb', '#87909d', '#2f87fa']

type ChartSlice = { label: string; value: number; color: string; visual?: number }

function Coin() {
  return (
    <span className="inline-flex h-[12px] w-[12px] shrink-0 items-center justify-center rounded-full bg-[#ffd51e] text-[7px] font-bold text-white">
      $
    </span>
  )
}

function CountryRings({
  countries,
  active,
  onActive,
}: {
  countries: ChartSlice[]
  active: string
  onActive: (value: string) => void
}) {
  if (countries.length === 0) {
    return (
      <div className="flex h-[165px] w-[165px] items-center justify-center text-[10px] text-[#6f7e92] sm:h-[180px] sm:w-[180px]">
        No exposure data
      </div>
    )
  }
  const rings = countries.map((item, index) => ({
    ...item,
    radius: 68 - index * 10,
    rotate: -90 + index * 26,
  }))

  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 160 160" className="h-[165px] w-[165px] sm:h-[180px] sm:w-[180px]">
        {rings.map((ring) => {
          const circumference = 2 * Math.PI * ring.radius
          const dash = circumference * (ring.value / 100)
          const isActive = active === ring.label
          return (
            <g
              key={ring.label}
              transform={`rotate(${ring.rotate} 80 80)`}
              onMouseEnter={() => onActive(ring.label)}
              onFocus={() => onActive(ring.label)}
              tabIndex={0}
              role="button"
              aria-label={`${ring.label} ${ring.value}%`}
              className="cursor-pointer outline-none"
            >
              <circle cx="80" cy="80" r={ring.radius} fill="none" stroke="var(--iv2-chart-track)" strokeWidth="6" />
              <circle
                cx="80"
                cy="80"
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={isActive ? 9 : 6}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeLinecap="round"
                className="transition-all duration-200"
                style={{ filter: isActive ? 'drop-shadow(0 0 5px rgba(255,255,255,.35))' : 'none' }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function CurrencyDonut({
  currencies,
  active,
  onActive,
}: {
  currencies: ChartSlice[]
  active: string
  onActive: (value: string) => void
}) {
  if (currencies.length === 0) {
    return (
      <div className="flex h-[150px] w-[150px] items-center justify-center text-[10px] text-[#6f7e92] sm:h-[170px] sm:w-[170px]">
        No currency data
      </div>
    )
  }

  let startAngle = 0
  const polar = (radius: number, angle: number, offsetX: number, offsetY: number) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return {
      x: 70 + radius * Math.cos(radians) + offsetX,
      y: 70 + radius * Math.sin(radians) + offsetY,
    }
  }

  const segmentPath = (start: number, end: number, explode: number) => {
    const middle = (start + end) / 2
    const middleRadians = ((middle - 90) * Math.PI) / 180
    const offsetX = Math.cos(middleRadians) * explode
    const offsetY = Math.sin(middleRadians) * explode
    const outerStart = polar(54, start, offsetX, offsetY)
    const outerEnd = polar(54, end, offsetX, offsetY)
    const innerEnd = polar(14, end, offsetX, offsetY)
    const innerStart = polar(14, start, offsetX, offsetY)
    const largeArc = end - start > 180 ? 1 : 0

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A 54 54 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A 14 14 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ')
  }

  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 140 140" className="h-[150px] w-[150px] overflow-visible sm:h-[170px] sm:w-[170px]">
        {currencies.map((item) => {
          const sweep = (item.visual ?? item.value) * 3.6
          const segmentStart = startAngle + 2.2
          const segmentEnd = startAngle + sweep - 2.2
          startAngle += sweep
          const isActive = active === item.label

          return (
            <path
              key={item.label}
              d={segmentPath(segmentStart, segmentEnd, isActive ? 7 : 4)}
              fill={item.color}
              stroke="var(--iv2-chart-outline)"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
              onMouseEnter={() => onActive(item.label)}
              onFocus={() => onActive(item.label)}
              tabIndex={0}
              role="button"
              aria-label={`${item.label} ${item.value}%`}
              className="cursor-pointer outline-none transition-all duration-200"
              style={{
                filter: isActive ? 'drop-shadow(0 8px 12px rgba(18,60,115,.38)) brightness(1.06)' : 'none',
              }}
            />
          )
        })}
        <circle cx="70" cy="70" r="12" fill="var(--iv2-chart-center)" />
      </svg>
    </div>
  )
}

function NewPositionDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (order: HoldingOrderRow) => void
}) {
  const [instrument, setInstrument] = useState('')
  const [quantity, setQuantity] = useState('')
  if (!open) return null

  const submit = () => {
    if (!instrument.trim() || !quantity.trim()) return
    onAdd({
      id: `local-${Date.now()}`,
      transaction: instrument.trim(),
      type: 'A',
      reference: `${instrument.trim()} Equity`,
      quantity,
      cost: '-0.00',
      price: '0.0000',
      value: '0.00',
      fx: '1.0000',
      nav: '0.00',
    })
    setInstrument('')
    setQuantity('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-position-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#111b29] p-5 shadow-[0_28px_90px_rgba(0,0,0,.6)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="new-position-title" className="text-base font-semibold text-white">New Position</h2>
            <p className="mt-1 text-[11px] text-[#76859a]">Add a local position to this design preview.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#8391a4] transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-[#8b99ad]">Instrument</span>
            <input
              value={instrument}
              onChange={(event) => setInstrument(event.target.value)}
              placeholder="e.g. Tesla Inc"
              className="h-10 w-full rounded-full border border-white/10 bg-[#0b1320] px-4 text-xs text-white outline-none transition placeholder:text-[#4f5e72] focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/25"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-[#8b99ad]">Quantity</span>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-full border border-white/10 bg-[#0b1320] px-4 text-xs text-white outline-none transition placeholder:text-[#4f5e72] focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/25"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-full border border-white/10 px-5 text-xs text-[#a4afbd] transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
          <button type="button" onClick={submit} className="h-9 rounded-full bg-white px-5 text-xs font-semibold text-[#111722] transition hover:bg-[#edf2f8]">Add Position</button>
        </div>
      </div>
    </div>
  )
}

export default function PortfoliosPage() {
  const [funds, setFunds] = useState<FundTab[]>([])
  const [activeFundId, setActiveFundId] = useState('')
  const [overview, setOverview] = useState<PortfolioOverview | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [countries, setCountries] = useState<ChartSlice[]>([])
  const [currencies, setCurrencies] = useState<ChartSlice[]>([])
  const [sectors, setSectors] = useState<{ label: string; value: number }[]>([])
  const [orders, setOrders] = useState<HoldingOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCountry, setActiveCountry] = useState('')
  const [activeSector, setActiveSector] = useState('')
  const [activeCurrency, setActiveCurrency] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [recalculated, setRecalculated] = useState(false)
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState('')

  const activeFund = funds.find((f) => f.id === activeFundId) ?? funds[0]
  const metrics = mapOverviewMetrics(overview, holdings)

  const loadFunds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.listPortfolios()
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load portfolios')
      const tabs = mapFundTabs(res.data)
      setFunds(tabs)
      setActiveFundId((current) => current || tabs[0]?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolios')
      setFunds([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (fundId: string) => {
    if (!fundId) {
      setOverview(null)
      setHoldings([])
      setOrders([])
      setCountries([])
      setCurrencies([])
      setSectors([])
      return
    }
    setDetailLoading(true)
    setError(null)
    try {
      const [overviewRes, holdingsRes, exposureRes] = await Promise.all([
        investmentOpsApi.getPortfolioOverview(fundId),
        investmentOpsApi.getPortfolioHoldings(fundId),
        investmentOpsApi.getPortfolioExposure(fundId),
      ])

      if (!overviewRes.success && !holdingsRes.success) {
        throw new Error(overviewRes.error || holdingsRes.error || 'Failed to load portfolio detail')
      }

      const nextOverview = overviewRes.success ? (overviewRes.data ?? null) : null
      const nextHoldings = holdingsRes.success ? unwrapList<Holding>(holdingsRes.data) : []
      setOverview(nextOverview)
      setHoldings(nextHoldings)
      const rows = nextHoldings.map(mapHoldingToOrderRow)
      setOrders(rows)
      setSelectedOrder(rows[0]?.transaction ?? '')

      if (exposureRes.success && exposureRes.data?.byExchange?.length) {
        const countrySlices = exposureRes.data.byExchange.map((item, i) => ({
          label: item.key,
          value: Number(item.pct) || 0,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
        setCountries(countrySlices)
        setActiveCountry(countrySlices[0]?.label ?? '')
      } else {
        setCountries([])
        setActiveCountry('')
      }

      const currencyBuckets = new Map<string, number>()
      for (const h of nextHoldings) {
        const ccy = h.wacCurrencyCode || h.security?.listingCurrencyCode || 'USD'
        currencyBuckets.set(ccy, (currencyBuckets.get(ccy) ?? 0) + (h.marketValue ?? h.wac * h.quantity))
      }
      const currencyTotal = Array.from(currencyBuckets.values()).reduce((a, b) => a + b, 0)
      const currencySlices = Array.from(currencyBuckets.entries()).map(([label, value], i) => {
        const pct = currencyTotal > 0 ? (value / currencyTotal) * 100 : 0
        return {
          label,
          value: Math.round(pct),
          visual: Math.max(pct, 1),
          color: CURRENCY_COLORS[i % CURRENCY_COLORS.length],
        }
      })
      setCurrencies(currencySlices)
      setActiveCurrency(currencySlices[0]?.label ?? '')
      setSectors([])
      setActiveSector('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio detail')
      setOverview(null)
      setHoldings([])
      setOrders([])
      setCountries([])
      setCurrencies([])
      setSectors([])
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFunds()
  }, [loadFunds])

  useEffect(() => {
    if (activeFundId) void loadDetail(activeFundId)
  }, [activeFundId, loadDetail])

  const activeSectorValue = useMemo(
    () => sectors.find((item) => item.label === activeSector)?.value ?? 0,
    [activeSector, sectors],
  )

  const recalculate = async () => {
    if (!activeFundId) return
    try {
      const res = await investmentOpsApi.recalculatePortfolio(activeFundId)
      if (!res.success) throw new Error(res.error || res.message || 'Recalculate failed')
      setRecalculated(true)
      await loadDetail(activeFundId)
      window.setTimeout(() => setRecalculated(false), 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculate failed')
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-[#05090f] text-[#eef2f8]">
      <PageHeader title="Portfolios" />

      {error && (
        <div className="mx-3 mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200 sm:mx-5">
          {error}
        </div>
      )}

      {(loading || detailLoading) && (
        <div className="mx-3 mt-3 flex items-center gap-2 text-[12px] text-[#8B95A7] sm:mx-5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading portfolios…
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 pb-4 pt-4 sm:px-5">
        {funds.map((portfolio) => (
          <button
            key={portfolio.id}
            type="button"
            onClick={() => setActiveFundId(portfolio.id)}
            className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-4 text-[11px] font-medium transition ${
              activeFundId === portfolio.id
                ? 'bg-[#2d8cf4] text-white shadow-[0_8px_24px_rgba(45,140,244,.25)]'
                : 'border border-white/[0.04] bg-[#172231] text-[#e1e6ee] hover:bg-[#223149]'
            }`}
          >
            <Folder className="h-3.5 w-3.5" fill="currentColor" />
            {portfolio.name}
          </button>
        ))}
        {!loading && funds.length === 0 && (
          <p className="text-[11px] text-[#6f7e92]">No portfolios returned from the API.</p>
        )}
      </div>

      <main className="flex-1 space-y-4 overflow-y-auto px-3 pb-6 sm:px-5">
        <section className="overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)] shadow-[0_22px_70px_rgba(0,0,0,.18)]">
          <header className="flex min-h-[55px] flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#f0f3f8]">
              <Folder className="h-3.5 w-3.5" fill="currentColor" />
              {activeFund?.name ?? 'Portfolio'}
            </div>
            <button
              type="button"
              onClick={() => void recalculate()}
              disabled={!activeFundId}
              className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-semibold text-[#111722] transition hover:bg-[#edf2f8] disabled:opacity-40"
            >
              {recalculated && <Check className="h-3.5 w-3.5" />}
              {recalculated ? 'Updated' : 'Recalculate'}
            </button>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead className="bg-white/[0.035] text-left text-[9px] text-[#738095]">
                <tr>
                  <th className="px-5 py-2.5 font-normal">Included</th>
                  <th className="px-4 py-2.5 font-normal">Total</th>
                  <th className="px-4 py-2.5 font-normal">In%</th>
                  <th className="px-4 py-2.5 font-normal">Interest</th>
                  <th className="px-4 py-2.5 font-normal">Dividend</th>
                  <th className="px-4 py-2.5 font-normal">Positions</th>
                  <th className="px-4 py-2.5 font-normal">Exposure</th>
                  <th className="px-4 py-2.5 font-normal">Margin</th>
                  <th className="px-5 py-2.5 font-normal">Valuedate</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  onClick={() => setExpanded((current) => !current)}
                  className="cursor-pointer bg-[#8b76d2] text-white transition hover:bg-[#957fe0]"
                >
                  <td className="px-5 py-4 text-[11px]">
                    <span className="inline-flex items-center gap-2">
                      <ChevronDown className={`h-3 w-3 transition ${expanded ? '' : '-rotate-90'}`} />
                      Securities
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[11px]"><span className="inline-flex items-center gap-1.5"><Coin />{metrics.total}</span></td>
                  <td className="px-4 py-4 text-[11px]">{metrics.securityPct}</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">{metrics.positions}</td>
                  <td className="px-4 py-4 text-[11px]">{metrics.total}</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-5 py-4 text-[11px]">{metrics.valueDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {expanded && (
            <div className="grid min-h-[245px] grid-cols-1 border-b border-[#243044] bg-[radial-gradient(circle_at_50%_30%,rgba(34,84,145,.17),transparent_62%)] lg:grid-cols-3">
              <div className="flex min-h-[220px] items-center justify-start gap-2 border-b border-[#243044] px-3 py-4 sm:gap-3 sm:px-5 lg:border-b-0 lg:border-r">
                <CountryRings countries={countries} active={activeCountry} onActive={setActiveCountry} />
                <div className="space-y-1.5">
                  {countries.map((country) => (
                    <button
                      key={country.label}
                      type="button"
                      onMouseEnter={() => setActiveCountry(country.label)}
                      onClick={() => setActiveCountry(country.label)}
                      className={`flex w-full items-center gap-1.5 rounded-full px-2 py-1 text-[9px] transition ${
                        activeCountry === country.label ? 'bg-white/10 text-white' : 'text-[#8492a5] hover:text-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: country.color }} />
                      {country.label}({country.value}%)
                    </button>
                  ))}
                  {countries.length === 0 && <p className="px-2 text-[9px] text-[#6f7e92]">No exchange exposure</p>}
                </div>
              </div>

              <div className="flex min-h-[220px] items-end justify-center gap-3 border-b border-[#243044] px-5 pb-6 pt-10 lg:border-b-0 lg:border-r">
                {sectors.length === 0 ? (
                  <p className="self-center text-[10px] text-[#6f7e92]">No sector breakdown</p>
                ) : (
                  sectors.map((sector) => {
                    const active = activeSector === sector.label
                    return (
                      <button
                        key={sector.label}
                        type="button"
                        onMouseEnter={() => setActiveSector(sector.label)}
                        onFocus={() => setActiveSector(sector.label)}
                        onClick={() => setActiveSector(sector.label)}
                        className="group relative flex h-[165px] flex-1 flex-col items-center justify-end gap-2 outline-none"
                      >
                        <span
                          className="absolute z-10 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#10151d] shadow-lg transition"
                          style={{ bottom: `${Math.min(activeSectorValue + 16, 92)}%`, opacity: active ? 1 : 0, transform: active ? 'translateY(0)' : 'translateY(5px)' }}
                        >
                          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--iv2-chart-marker)]" />
                          {sector.value}%
                        </span>
                        <span
                          className="w-full max-w-[18px] rounded-t-md border border-white/[0.06] transition-all duration-200"
                          style={{
                            height: `${sector.value}%`,
                            background: active ? '#2f8af4' : '#1d2b3e',
                            boxShadow: active ? '0 12px 26px rgba(47,138,244,.25)' : 'none',
                            transform: active ? 'translateY(-4px)' : 'none',
                          }}
                        />
                        <span className={`text-[9px] transition ${active ? 'text-white' : 'text-[#65748a]'}`}>{sector.label}</span>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="flex min-h-[220px] items-center justify-center gap-3 p-4">
                <CurrencyDonut currencies={currencies} active={activeCurrency} onActive={setActiveCurrency} />
                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <button
                      key={currency.label}
                      type="button"
                      onMouseEnter={() => setActiveCurrency(currency.label)}
                      onClick={() => setActiveCurrency(currency.label)}
                      className={`flex w-full items-center gap-1.5 rounded-full px-2 py-1 text-[9px] transition ${
                        activeCurrency === currency.label ? 'bg-white/10 text-white' : 'text-[#8492a5] hover:text-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: currency.color }} />
                      {currency.label}({currency.value}%)
                    </button>
                  ))}
                  {currencies.length === 0 && <p className="px-2 text-[9px] text-[#6f7e92]">No currency data</p>}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <tbody>
                <tr className="border-b border-[#243044] transition hover:bg-white/[0.025]">
                  <td className="w-[12%] px-5 py-4 text-[11px]">Cash</td>
                  <td className="w-[15%] px-4 py-4 text-[11px]"><span className="inline-flex items-center gap-1.5"><Coin />{metrics.cash}</span></td>
                  <td className="w-[10%] px-4 py-4 text-[11px]">{metrics.cashPct}</td>
                  <td className="w-[10%] px-4 py-4 text-[11px]">—</td>
                  <td className="w-[10%] px-4 py-4 text-[11px]">—</td>
                  <td className="w-[10%] px-4 py-4 text-[11px]">—</td>
                  <td className="w-[13%] px-4 py-4 text-[11px]">—</td>
                  <td className="w-[10%] px-4 py-4 text-[11px]">—</td>
                  <td className="w-[10%] px-5 py-4 text-[11px]">{metrics.valueDate}</td>
                </tr>
                <tr className="transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4 text-[11px]">Archive</td>
                  <td className="px-4 py-4 text-[11px]"><span className="inline-flex items-center gap-1.5"><Coin />—</span></td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-4 py-4 text-[11px]">—</td>
                  <td className="px-5 py-4 text-[11px]">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-white/[0.025] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)]">
          <header className="flex min-h-[54px] items-center justify-between gap-3 px-5 py-3">
            <h2 className="text-[14px] font-medium text-white">Holdings({orders.length})</h2>
            <button
              type="button"
              onClick={() => setPositionDialogOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-semibold text-[#111722] transition hover:bg-[#edf2f8]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Position
            </button>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-white/[0.035] text-left text-[9px] text-[#738095]">
                <tr>
                  <th className="px-5 py-2.5 font-normal">Transactions</th>
                  <th className="px-4 py-2.5 font-normal">Type</th>
                  <th className="px-4 py-2.5 font-normal">Reference</th>
                  <th className="px-4 py-2.5 font-normal">Quantity</th>
                  <th className="px-4 py-2.5 font-normal">Cost</th>
                  <th className="px-4 py-2.5 font-normal">Price</th>
                  <th className="px-4 py-2.5 font-normal">Value</th>
                  <th className="px-4 py-2.5 font-normal">FXRate</th>
                  <th className="px-5 py-2.5 font-normal">NAV</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order.transaction)}
                    className={`cursor-pointer border-b border-[#243044] transition last:border-b-0 hover:bg-[#2f87fa]/[0.08] ${
                      selectedOrder === order.transaction ? 'bg-[#2f87fa]/[0.1]' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-[11px] text-[#e0e6ef]">{order.transaction}</td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.type}</td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.reference}</td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.quantity}</td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.cost}</td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.price}</td>
                    <td className="px-4 py-4 text-[11px] text-[#dfe5ed]"><span className="inline-flex items-center gap-1.5"><Coin />{order.value}</span></td>
                    <td className="px-4 py-4 text-[11px] text-[#c3ccd8]">{order.fx}</td>
                    <td className="px-5 py-4 text-[11px] text-[#c3ccd8]">{order.nav}</td>
                  </tr>
                ))}
                {!detailLoading && orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center text-[11px] text-[#6f7e92]">
                      {activeFundId ? 'No holdings returned from the API.' : 'Select a portfolio to view holdings.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <NewPositionDialog
        open={positionDialogOpen}
        onClose={() => setPositionDialogOpen(false)}
        onAdd={(order) => {
          setOrders((current) => [order, ...current])
          setSelectedOrder(order.transaction)
        }}
      />
    </div>
  )
}
