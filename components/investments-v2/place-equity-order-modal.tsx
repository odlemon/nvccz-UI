'use client'

import { useMemo, useState } from 'react'
import {
  X,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Check,
  TrendingUp as TrendUpIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/arcus/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
interface OptionItem { id: string; label: string }

interface ChartPoint { date: number; price: number }

interface MarketStats {
  bid: number
  ask: number
  dayLow: number
  dayHigh: number
  volume: number
  avgVol30d: number
}

interface HoldingSnapshot {
  shares: number
  avgCost: number
  marketValue: number
  unrealizedPnl: number
  weightPct: number
}

interface FeeBreakdown {
  fees: number
  taxes: number
  settlementAmount: number
}

interface CompliancePreview {
  outcome: 'PASSED' | 'BREACH' | 'WARNING' | string
  message: string
}

export interface PlaceEquityOrderModalProps {
  open: boolean
  onClose: () => void

  side: 'BUY' | 'SELL'
  onSideChange: (side: 'BUY' | 'SELL') => void

  fundOptions: OptionItem[]
  fundId: string
  fundName: string | null
  onFundChange: (id: string) => void

  instrumentOptions: OptionItem[]
  instrumentId: string
  onInstrumentChange: (id: string) => void

  orderType: 'MARKET' | 'LIMIT'
  onOrderTypeChange: (t: 'MARKET' | 'LIMIT') => void

  quantity: string
  onQuantityChange: (v: string) => void
  limitPrice: string
  onLimitPriceChange: (v: string) => void

  // Security header — real where available
  securityName: string | null
  securityTicker: string | null
  currency: string
  currentPrice: number | null
  changeAbs: number | null
  changePct: number | null
  marketStats: MarketStats | null
  chartData: ChartPoint[]

  // Holding + impact — real, computed by the caller
  existingHolding: HoldingSnapshot | null
  afterShares: number
  afterAvgCost: number
  afterMarketValue: number
  afterUnrealizedPnl: number
  afterWeightPct: number | null
  hasOrderInputs: boolean
  orderQty: number
  orderValue: number

  // Preview / compliance — only present once a real preview has been run
  feePreview: FeeBreakdown | null
  compliance: CompliancePreview | null
  previewLoading: boolean
  submitting: boolean

  // DOM node the theme-scoped Popover portals should mount under
  container?: HTMLElement | null

  onReviewOrder: () => void
  onSubmitOrder: () => void
}

function fmt(n: number, dp = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

function fmtVol(n: number) {
  return `${(n / 1_000_000).toFixed(2)}M`
}

// Illustrative fee-component split (Brokerage / Exchange Fee / STT) — the
// order-preview API only returns aggregate fees+taxes, not this breakdown,
// so these rates are estimates for display purposes only.
const ESTIMATED_BROKERAGE_RATE = 0.0015
const ESTIMATED_EXCHANGE_RATE = 0.000375
const ESTIMATED_STT_RATE = 0.002

const RANGE_OPTIONS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const
type RangeKey = (typeof RANGE_OPTIONS)[number]
const RANGE_MS: Record<Exclude<RangeKey, 'ALL'>, number> = {
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '3M': 90 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload as ChartPoint
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded px-2 py-1 text-[10px] text-white">
      <div className="text-[#6B7A95]">{format(new Date(p.date), 'MMM d, yyyy HH:mm')}</div>
      <div className="font-mono font-semibold">{p.price != null ? fmt(p.price, 4) : '—'}</div>
    </div>
  )
}

export function PlaceEquityOrderModal({
  open,
  onClose,
  side,
  onSideChange,
  fundOptions,
  fundId,
  fundName,
  onFundChange,
  instrumentOptions,
  instrumentId,
  onInstrumentChange,
  orderType,
  onOrderTypeChange,
  quantity,
  onQuantityChange,
  limitPrice,
  onLimitPriceChange,
  securityName,
  securityTicker,
  currency,
  currentPrice,
  changeAbs,
  changePct,
  marketStats,
  chartData,
  existingHolding,
  afterShares,
  afterAvgCost,
  afterMarketValue,
  afterUnrealizedPnl,
  afterWeightPct,
  hasOrderInputs,
  orderQty,
  orderValue,
  feePreview,
  compliance,
  previewLoading,
  submitting,
  container,
  onReviewOrder,
  onSubmitOrder,
}: PlaceEquityOrderModalProps) {
  const [dontShow, setDontShow] = useState(false)
  const [range, setRange] = useState<RangeKey>('1M')

  const latestTs = chartData.length ? chartData[chartData.length - 1].date : null
  const filteredChartData = useMemo(() => {
    if (!latestTs || range === 'ALL') return chartData
    const cutoff = latestTs - RANGE_MS[range]
    const sliced = chartData.filter((d) => d.date >= cutoff)
    return sliced.length > 1 ? sliced : chartData
  }, [chartData, range, latestTs])

  const tickFormatter = (ts: number) =>
    range === '1D' ? format(new Date(ts), 'HH:mm') : format(new Date(ts), 'MMM d')

  const estBrokerage = orderValue * ESTIMATED_BROKERAGE_RATE
  const estExchangeFee = orderValue * ESTIMATED_EXCHANGE_RATE
  const estStt = orderValue * ESTIMATED_STT_RATE
  const estTotalFees = estBrokerage + estExchangeFee + estStt
  const totalConsideration = feePreview
    ? feePreview.settlementAmount
    : hasOrderInputs
    ? side === 'BUY'
      ? orderValue + estTotalFees
      : orderValue - estTotalFees
    : null

  if (!open) return null

  const positive = (changeAbs ?? 0) >= 0
  const complianceColor = compliance?.outcome === 'PASSED' ? '#10B981' : compliance?.outcome === 'BREACH' ? '#EF4444' : '#F59E0B'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[1100px] max-h-[94vh] overflow-y-auto rounded-xl border border-white/[0.08] shadow-2xl"
        style={{ background: '#0F1729' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-white text-[15px] font-semibold">Place {side === 'BUY' ? 'Buy' : 'Sell'} Equity Order</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#6B7A95] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Security Header Card */}
          {securityTicker && (
            <div className="rounded-xl p-4" style={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-6">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[14px] font-semibold">
                    {securityName} ({securityTicker})
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[24px] font-mono font-bold text-white">
                      {currency} {currentPrice != null ? fmt(currentPrice, 4) : '—'}
                    </span>
                    {changeAbs != null && (
                      <span className={`flex items-center gap-1 text-[13px] font-mono ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        <TrendingUp className={`w-3.5 h-3.5 ${positive ? '' : 'rotate-180'}`} />
                        {positive ? '+' : ''}{fmt(changeAbs, 4)} ({changePct != null ? `${positive ? '+' : ''}${changePct.toFixed(2)}%` : '—'})
                      </span>
                    )}
                  </div>

                  {marketStats && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Bid</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmt(marketStats.bid, 4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Ask</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmt(marketStats.ask, 4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Day Low</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmt(marketStats.dayLow, 4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Day High</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmt(marketStats.dayHigh, 4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Volume</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmtVol(marketStats.volume)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B7A95] w-14">Avg. Vol (30D)</span>
                        <span className="text-[12px] font-mono text-[#C8D3E8]">{fmtVol(marketStats.avgVol30d)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chart */}
                <div className="w-[420px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider">Price History</div>
                    <div className="flex items-center gap-0.5 rounded-full p-0.5" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {RANGE_OPTIONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold transition-colors"
                          style={{
                            background: range === r ? '#2563EB' : 'transparent',
                            color: range === r ? '#fff' : '#6B7A95',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredChartData.length > 1 ? (
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={filteredChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="peqGreenGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={positive ? '#10B981' : '#EF4444'} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={positive ? '#10B981' : '#EF4444'} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <YAxis hide domain={['dataMin', 'dataMax']} />
                          <XAxis
                            dataKey="date"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={tickFormatter}
                            tick={{ fill: '#6B7A95', fontSize: 9 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={positive ? '#10B981' : '#EF4444'}
                            strokeWidth={1.5}
                            fill="url(#peqGreenGrad)"
                            dot={false}
                            activeDot={{ r: 3, fill: positive ? '#10B981' : '#EF4444' }}
                          />
                          {currentPrice != null && (
                            <ReferenceLine y={currentPrice} stroke={positive ? '#10B981' : '#EF4444'} strokeWidth={1} strokeOpacity={0.4} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[140px] flex items-center justify-center text-[11px] text-[#6B7A95]">No price history for this range</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buy / Sell Toggle */}
          <div className="grid grid-cols-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => onSideChange('BUY')}
              className="py-2.5 text-[13px] font-semibold transition-colors"
              style={{ background: side === 'BUY' ? '#2563EB' : 'transparent', color: side === 'BUY' ? '#fff' : '#94a3b8' }}
            >
              Buy
            </button>
            <button
              onClick={() => onSideChange('SELL')}
              className="py-2.5 text-[13px] font-semibold transition-colors"
              style={{ background: side === 'SELL' ? '#EF4444' : 'transparent', color: side === 'SELL' ? '#fff' : '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              Sell
            </button>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-[1fr_380px] gap-4">
            {/* LEFT: Order Details */}
            <div className="space-y-4">
              <div className="text-white text-[13px] font-semibold">Order Details</div>

              <FormField label="Portfolio">
                <SearchableSelect value={fundId} onChange={onFundChange} options={fundOptions} placeholder="Select fund…" container={container} />
              </FormField>

              <FormField label="Instrument">
                <SearchableSelect value={instrumentId} onChange={onInstrumentChange} options={instrumentOptions} placeholder="Select instrument…" container={container} />
              </FormField>

              <FormField label="Order Type">
                <div className="grid grid-cols-2 gap-1.5">
                  {(['MARKET', 'LIMIT'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => onOrderTypeChange(t)}
                      className="py-1.5 rounded-full text-[11px] font-medium transition-colors"
                      style={{
                        background: orderType === t ? '#2563EB' : '#111C30',
                        color: orderType === t ? '#fff' : '#94a3b8',
                        border: orderType === t ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {t === 'MARKET' ? 'Market' : 'Limit'}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Quantity" hint="Lot size: 1 • Min: 1">
                <div className="relative">
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => onQuantityChange(e.target.value)}
                    placeholder="0"
                    className="h-9 pr-16 text-[12px] font-mono text-white bg-[#111C30] border-white/10 focus-visible:ring-blue-500/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none" style={{ color: '#6B7A95' }}>Shares</span>
                </div>
              </FormField>

              <FormField label={`Price (${currency})`}>
                {orderType === 'MARKET' ? (
                  <Input
                    type="text"
                    value="Market"
                    readOnly
                    disabled
                    className="h-9 text-[12px] font-mono bg-[#111C30] border-white/10 text-[#6B7A95] disabled:opacity-100"
                  />
                ) : (
                  <Input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => onLimitPriceChange(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-[12px] font-mono text-white bg-[#111C30] border-white/10 focus-visible:ring-blue-500/30"
                  />
                )}
                {orderType === 'MARKET' && (
                  <p className="text-[10px] mt-1" style={{ color: '#6B7A95' }}>Market order will execute at best available price</p>
                )}
              </FormField>

              {/* Estimated Fees — illustrative Brokerage/Exchange/STT split */}
              {hasOrderInputs && (
                <div className="rounded-xl p-4 space-y-1.5" style={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[12px] font-semibold text-white">Estimated Fees</span>
                    <HelpCircle className="w-3 h-3" style={{ color: '#6B7A95' }} />
                  </div>
                  <FeeRow label={`Brokerage (${(ESTIMATED_BROKERAGE_RATE * 100).toFixed(2)}%)`} value={`${fmt(estBrokerage)} ${currency}`} />
                  <FeeRow label="Exchange Fee" value={`${fmt(estExchangeFee)} ${currency}`} />
                  <FeeRow label={`STT (${(ESTIMATED_STT_RATE * 100).toFixed(2)}%)`} value={`${fmt(estStt)} ${currency}`} />
                  <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[12px] font-semibold text-white">Total Estimated Fees</span>
                    <span className="text-[12px] font-mono font-semibold text-white">{fmt(estTotalFees)} {currency}</span>
                  </div>
                </div>
              )}

              {/* Real compliance banner (no fabricated cash balance) */}
              {compliance && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: `${complianceColor}14`, border: `1px solid ${complianceColor}40` }}
                >
                  <StatusBadge status={compliance.outcome === 'PASSED' ? 'passed' : compliance.outcome === 'BREACH' ? 'breach' : 'warning'} />
                  <div className="text-[11px]" style={{ color: '#C8D3E8' }}>{compliance.message}</div>
                </div>
              )}
            </div>

            {/* RIGHT: Holding / Impact / Summary */}
            <div className="space-y-4">
              {/* Existing Holding */}
              <div className="rounded-xl p-4" style={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-semibold text-white">Existing Holding</div>
                  {fundName && <div className="text-[10px] font-medium truncate max-w-[180px]" style={{ color: '#6B7A95' }}>{fundName}</div>}
                </div>
                {existingHolding ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <HoldingCell label="Current Shares" value={fmt(existingHolding.shares, 0)} />
                      <HoldingCell label={`Avg. Cost (${currency})`} value={existingHolding.avgCost.toFixed(4)} />
                      <HoldingCell label="Current Market Value" value={`${fmt(existingHolding.marketValue)} ${currency}`} small />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-[10px] mb-1" style={{ color: '#6B7A95' }}>Unrealised P/L</div>
                        <div className="text-[13px] font-mono font-semibold" style={{ color: existingHolding.unrealizedPnl >= 0 ? '#10B981' : '#EF4444' }}>
                          {existingHolding.unrealizedPnl >= 0 ? '+' : ''}{fmt(existingHolding.unrealizedPnl)} {currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-1" style={{ color: '#6B7A95' }}>Portfolio Weight</div>
                        <div className="text-[15px] font-mono font-semibold text-white">{existingHolding.weightPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px]" style={{ color: '#6B7A95' }}>
                    {fundId ? 'No existing position in this instrument.' : 'Select a portfolio and instrument to see your existing position.'}
                  </div>
                )}
              </div>

              {/* Impact of This Order */}
              {hasOrderInputs && (
                <div className="rounded-xl p-4" style={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[12px] font-semibold text-white mb-3">
                    Impact of This Order ({side === 'BUY' ? 'Buy' : 'Sell'} {fmt(orderQty, 0)} Shares)
                  </div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr>
                        <th className="text-left font-normal pb-2" style={{ color: '#6B7A95' }}>&nbsp;</th>
                        <th className="text-right font-normal pb-2" style={{ color: '#6B7A95' }}>BEFORE (Current)</th>
                        <th className="text-right font-normal pb-2" style={{ color: '#6B7A95' }}>AFTER (Projected)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <ImpactRow label="Shares Held" before={fmt(existingHolding?.shares ?? 0, 0)} after={fmt(afterShares, 0)} />
                      <ImpactRow label={`Avg. Cost (${currency})`} before={(existingHolding?.avgCost ?? 0).toFixed(4)} after={afterAvgCost.toFixed(4)} />
                      <ImpactRow label={`Market Value (${currency})`} before={fmt(existingHolding?.marketValue ?? 0, 0)} after={fmt(afterMarketValue, 0)} />
                      <tr>
                        <td className="py-1" style={{ color: '#94a3b8' }}>Unrealised P/L ({currency})</td>
                        <td className="text-right py-1" style={{ color: (existingHolding?.unrealizedPnl ?? 0) >= 0 ? '#10B981' : '#EF4444' }}>
                          {(existingHolding?.unrealizedPnl ?? 0) >= 0 ? '+' : ''}{fmt(existingHolding?.unrealizedPnl ?? 0, 0)}
                        </td>
                        <td className="text-right py-1 font-semibold" style={{ color: afterUnrealizedPnl >= 0 ? '#10B981' : '#EF4444' }}>
                          {afterUnrealizedPnl >= 0 ? '+' : ''}{fmt(afterUnrealizedPnl, 0)}
                        </td>
                      </tr>
                      <ImpactRow
                        label="Portfolio Weight"
                        before={`${(existingHolding?.weightPct ?? 0).toFixed(2)}%`}
                        after={afterWeightPct != null ? `${afterWeightPct.toFixed(2)}%` : '—'}
                      />
                    </tbody>
                  </table>
                  {afterWeightPct == null && (
                    <div className="text-[10px] mt-2" style={{ color: '#6B7A95' }}>Run Review Order to see the projected portfolio weight after this order.</div>
                  )}
                  {afterWeightPct != null && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <TrendUpIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                      <p className="text-[11px]" style={{ color: '#C8D3E8' }}>
                        This order will change your exposure to {securityName ?? 'this instrument'} from{' '}
                        <span className="font-semibold" style={{ color: '#F59E0B' }}>{(existingHolding?.weightPct ?? 0).toFixed(2)}%</span>{' '}
                        to <span className="font-semibold" style={{ color: '#F59E0B' }}>{afterWeightPct.toFixed(2)}%</span> of your portfolio.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-xl p-4" style={{ background: '#111C30', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[12px] font-semibold text-white mb-3">Order Summary</div>
                <div className="space-y-2 text-[11px]">
                  <SummaryRow label={`Order Value (${fmt(orderQty, 0)} Shares)`} value={hasOrderInputs ? `${fmt(orderValue)} ${currency}` : '—'} />
                  <SummaryRow label="Estimated Fees" value={hasOrderInputs ? `${fmt(estTotalFees)} ${currency}` : '—'} />
                  <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-white">Total Consideration</span>
                      <span className="text-[13px] font-mono font-bold" style={{ color: '#60A5FA' }}>
                        {totalConsideration != null ? `${fmt(totalConsideration)} ${currency}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <label className="flex items-center gap-2 cursor-pointer mr-auto">
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: dontShow ? '#2563EB' : 'transparent', border: dontShow ? '1px solid #2563EB' : '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => setDontShow((p) => !p)}
            >
              {dontShow && <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
            <span className="text-[11px]" style={{ color: '#6B7A95' }}>Don&apos;t show confirmation again</span>
          </label>

          <Button
            onClick={onClose}
            variant="outline"
            size="pill"
            className="bg-transparent text-white border-white/15 hover:bg-white/5"
          >
            Cancel
          </Button>

          <Button
            onClick={onReviewOrder}
            disabled={previewLoading}
            variant="outline"
            size="pill"
            className="bg-transparent text-[#60A5FA] border-[#2563EB] hover:bg-[#2563EB]/10"
          >
            {previewLoading ? 'Checking…' : 'Review Order'}
          </Button>

          <Button
            onClick={onSubmitOrder}
            disabled={submitting}
            size="pill"
            className={cn('text-white gap-2', side === 'BUY' ? 'bg-[#2563EB] hover:bg-[#1d4ed8]' : 'bg-[#EF4444] hover:bg-[#dc2626]')}
          >
            {submitting ? 'Placing…' : `Place ${side === 'BUY' ? 'Buy' : 'Sell'} Order`}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Small helper components ────────────────────────────────────────────────
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#6B7A95' }}>{label}</span>
      </div>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: '#6B7A95' }}>{hint}</p>}
    </div>
  )
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  container,
}: {
  value: string
  onChange: (v: string) => void
  options: OptionItem[]
  placeholder?: string
  container?: HTMLElement | null
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-9 px-3 text-[12px] font-normal bg-[#111C30] border-white/10 hover:bg-[#111C30] hover:border-white/20',
            selected ? 'text-white' : 'text-[#6B7A95]'
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        className="p-0 bg-[#111C30] border-white/10"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="bg-transparent">
          <CommandInput placeholder="Search…" className="text-[12px] text-white" />
          <CommandList>
            <CommandEmpty className="text-[11px] py-4 text-center" style={{ color: '#6B7A95' }}>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.id)
                    setOpen(false)
                  }}
                  className="text-[12px] text-white data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                >
                  <Check className={cn('mr-2 h-3.5 w-3.5', value === o.id ? 'opacity-100' : 'opacity-0')} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-[11px] font-mono" style={{ color: '#C8D3E8' }}>{value}</span>
    </div>
  )
}

function HoldingCell({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[10px] mb-0.5" style={{ color: '#6B7A95' }}>{label}</div>
      <div className={`font-mono font-semibold text-white ${small ? 'text-[11px]' : 'text-[14px]'}`}>{value}</div>
    </div>
  )
}

function ImpactRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <tr>
      <td className="py-1" style={{ color: '#94a3b8' }}>{label}</td>
      <td className="text-right py-1 text-white">{before}</td>
      <td className="text-right py-1 font-semibold text-white">{after}</td>
    </tr>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: '#6B7A95' }}>{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  )
}
