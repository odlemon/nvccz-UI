'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, CircleHelp, TrendingDown, TrendingUp } from 'lucide-react'
import { Modal, SelectField } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

export interface PlaceEquityOrderModalProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

type Side = 'BUY' | 'SELL'
type ChartPeriod = '1D' | '1W' | '1M' | '3M' | '1Y'

const portfolios = ['Equity World', 'Arcus Balanced Fund', 'Growth Equity Fund', 'Pension Preservation']
const instruments = [
  { value: 'DELTA', label: 'Delta Corporation Limited (DLTA.ZW)', price: 322.5 },
  { value: 'INNSCOR', label: 'Innscor Africa Limited (INN.ZW)', price: 721.2 },
  { value: 'ECO', label: 'Econet Wireless Zimbabwe (ECO.ZW)', price: 298.1 },
]

const chartSeries: Record<ChartPeriod, { points: number[]; labels: string[]; change: number; volume: string; averageVolume: string }> = {
  '1D': { points: [316.8, 320.2, 318.9, 321.7, 320.8, 322.2, 320.6, 321.4, 319.8, 317.2, 320.3, 319.7, 321.3, 320.8, 322.1, 323.8, 323.1, 324.8, 324.1, 324.7, 323.3, 324.4, 323.5, 324.9, 322.2, 323.4, 322.5], labels: ['09:00', '11:00', '13:00', '15:00'], change: 5.5, volume: '1.24M', averageVolume: '1.18M' },
  '1W': { points: [307.4, 309.8, 308.1, 312.6, 310.9, 314.2, 316.8, 315.1, 318.7, 317.3, 321.2, 319.6, 322.5], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], change: 15.1, volume: '6.82M', averageVolume: '1.36M' },
  '1M': { points: [334.8, 330.1, 332.6, 327.9, 329.3, 325.8, 322.1, 324.5, 319.4, 316.7, 320.8, 318.6, 322.5], labels: ['16 Jun', '23 Jun', '30 Jun', '07 Jul', '16 Jul'], change: -12.3, volume: '28.6M', averageVolume: '1.30M' },
  '3M': { points: [281.2, 286.8, 292.4, 288.9, 298.1, 304.6, 301.7, 310.4, 316.2, 313.8, 320.1, 318.5, 322.5], labels: ['Apr', 'May', 'Jun', 'Jul'], change: 41.3, volume: '79.4M', averageVolume: '1.22M' },
  '1Y': { points: [246.5, 253.8, 248.2, 264.4, 276.1, 271.8, 286.7, 295.4, 302.8, 298.5, 311.6, 306.9, 322.5], labels: ['Jul 25', 'Oct 25', 'Jan 26', 'Apr 26', 'Jul 26'], change: 76, volume: '311.8M', averageVolume: '1.25M' },
}

const fieldClass = 'equity-order-field h-9 w-full rounded-full px-3 text-[10px] outline-none transition'
const panelClass = 'equity-order-panel rounded-xl'
const averageCost = 295.12
const currentShares = 50000
const currentWeight = 4.2
const availableCash = 42_458_320.45
const portfolioScale = 2_285_000

function Label({ children, help = false }: { children: React.ReactNode; help?: boolean }) {
  return <span className="equity-order-label mb-1.5 flex items-center gap-1 text-[9px]">{children}{help && <CircleHelp className="h-3 w-3" />}</span>
}

function Money({ value }: { value: number }) {
  return <>{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZWL</>
}

function SignedMoney({ value }: { value: number }) {
  return <>{value >= 0 ? '+' : '−'}{Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZWL</>
}

export function PlaceEquityOrderModal({ open, onClose, onComplete }: PlaceEquityOrderModalProps) {
  const [side, setSide] = useState<Side>('BUY')
  const [portfolio, setPortfolio] = useState('Equity World')
  const [instrumentCode, setInstrumentCode] = useState('DELTA')
  const [orderType, setOrderType] = useState('MARKET')
  const [quantity, setQuantity] = useState('10000')
  const [limitPrice, setLimitPrice] = useState('322.50')
  const [timeInForce, setTimeInForce] = useState('Day')
  const [validity, setValidity] = useState('2026-07-21')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1D')
  const [skipConfirmation, setSkipConfirmation] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  const instrument = instruments.find((item) => item.value === instrumentCode) ?? instruments[0]
  const chart = chartSeries[chartPeriod]
  const shares = Math.max(0, Number(quantity) || 0)
  const executionPrice = orderType === 'MARKET' ? instrument.price : Math.max(0, Number(limitPrice) || 0)
  const orderValue = shares * executionPrice
  const brokerage = orderValue * 0.0015
  const exchangeFee = orderValue * 0.0004
  const sellTax = side === 'SELL' ? orderValue * 0.01 : 0
  const fees = brokerage + exchangeFee + sellTax
  const consideration = side === 'BUY' ? orderValue + fees : orderValue - fees
  const exceedsHolding = side === 'SELL' && shares > currentShares
  const projectedShares = side === 'BUY' ? currentShares + shares : Math.max(0, currentShares - shares)
  const currentValue = currentShares * instrument.price
  const projectedValue = projectedShares * instrument.price
  const currentCostBasis = currentShares * averageCost
  const projectedCostBasis = side === 'BUY' ? currentCostBasis + consideration : projectedShares * averageCost
  const projectedAverageCost = projectedShares ? projectedCostBasis / projectedShares : 0
  const currentProfit = currentValue - currentCostBasis
  const projectedProfit = projectedValue - projectedCostBasis
  const currentProfitPercent = currentCostBasis ? currentProfit / currentCostBasis * 100 : 0
  const projectedProfitPercent = projectedCostBasis ? projectedProfit / projectedCostBasis * 100 : 0
  const projectedWeight = Math.max(0, currentWeight + (side === 'BUY' ? 1 : -1) * orderValue / portfolioScale)
  const hasCash = side === 'SELL' || consideration <= availableCash
  const isValid = shares > 0 && executionPrice > 0 && hasCash && !exceedsHolding
  const settlementDate = validity ? new Date(`${validity}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const feeRows = useMemo(() => [
    ['Brokerage (0.15%)', brokerage],
    ['Exchange Fee (0.04%)', exchangeFee],
    ...(side === 'SELL' ? [['Sell Tax (1.00%)', sellTax] as const] : []),
  ] as const, [brokerage, exchangeFee, sellTax, side])

  const chartGeometry = useMemo(() => {
    const min = Math.min(...chart.points)
    const max = Math.max(...chart.points)
    const range = Math.max(max - min, 1)
    const coordinates = chart.points.map((point, index) => {
      const x = index / (chart.points.length - 1) * 430
      const y = 20 + (max - point) / range * 92
      return [x, y] as const
    })
    const line = coordinates.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    return { line, area: `${line} L430 128 L0 128 Z`, min, max }
  }, [chart])

  const close = () => {
    setReviewed(false)
    onClose()
  }

  const placeOrder = () => {
    if (!isValid) return
    onComplete?.()
    close()
  }

  const setOrderSide = (value: Side) => {
    setSide(value)
    setReviewed(false)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Place Equity Order"
      width="max-w-[980px]"
      footer={
        <div className="equity-order-footer flex w-full flex-wrap items-center justify-end gap-2">
          <label className="equity-order-footer-label mr-auto flex items-center gap-2 text-[9px]">
            <input type="checkbox" checked={skipConfirmation} onChange={(event) => setSkipConfirmation(event.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
            Don&apos;t show confirmation again
          </label>
          <button type="button" onClick={close} className="equity-order-button equity-order-button-secondary h-9 rounded-full px-5 text-[10px] font-medium">Cancel</button>
          <button type="button" disabled={!isValid} onClick={() => setReviewed(true)} className="equity-order-button equity-order-button-review h-9 rounded-full px-5 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-40">
            {reviewed ? 'Order reviewed' : 'Review Order'}
          </button>
          <button type="button" disabled={!isValid} onClick={placeOrder} className={cn('equity-order-button flex h-9 items-center gap-2 rounded-full px-5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40', side === 'BUY' ? 'equity-order-button-buy' : 'equity-order-button-sell')}>
            Place {side === 'BUY' ? 'Buy' : 'Sell'} Order <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      }
    >
      <div className="equity-order-ticket">
        <section className={cn(panelClass, 'equity-order-market mb-2.5 grid overflow-hidden lg:grid-cols-[1.02fr_1.18fr]')}>
          <div className="p-4">
            <p className="equity-order-title text-[11px] font-semibold">{instrument.label.split(' (')[0]} ({instrumentCode})</p>
            <div className="mt-2.5 grid grid-cols-[1fr_auto_auto] items-center gap-5">
              <div>
                <p className="equity-order-price font-mono text-xl font-semibold">ZWL {instrument.price.toFixed(4)}</p>
                <p className={cn('mt-1 flex items-center gap-1.5 text-[10px] font-medium', chart.change >= 0 ? 'equity-order-positive' : 'equity-order-negative')}>
                  {chart.change >= 0 ? '+' : '−'}{Math.abs(chart.change).toFixed(4)} ({chart.change >= 0 ? '+' : '−'}{Math.abs(chart.change / (instrument.price - chart.change) * 100).toFixed(2)}%)
                  {chart.change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </p>
              </div>
              <div><p className="equity-order-label text-[8px]">Bid</p><p className="equity-order-value mt-1 font-mono text-[9px]">322.1000</p></div>
              <div><p className="equity-order-label text-[8px]">Ask</p><p className="equity-order-value mt-1 font-mono text-[9px]">323.0000</p></div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[
                ['Volume', chart.volume],
                ['Avg. Vol (30D)', chart.averageVolume],
                [chartPeriod === '1D' ? 'Day Low' : `${chartPeriod} Low`, chartGeometry.min.toFixed(4)],
                [chartPeriod === '1D' ? 'Day High' : `${chartPeriod} High`, chartGeometry.max.toFixed(4)],
              ].map(([label, value]) => <div key={label}><p className="equity-order-label text-[8px]">{label}</p><p className="equity-order-value mt-1 font-mono text-[9px]">{value}</p></div>)}
            </div>
          </div>
          <div className="equity-order-chart relative min-h-40 border-t p-3 pt-4 lg:border-l lg:border-t-0">
            <select aria-label="Chart period" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value as ChartPeriod)} className="equity-order-period absolute left-3 top-3 z-10 h-7 rounded-full px-2.5 text-[8px] font-medium outline-none">
              {(Object.keys(chartSeries) as ChartPeriod[]).map((period) => <option key={period}>{period}</option>)}
            </select>
            <svg viewBox="0 0 480 140" className="mt-2 h-32 w-full" preserveAspectRatio="none" aria-label={`${chartPeriod} price chart`}>
              <defs><linearGradient id="equity-order-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop className="equity-order-chart-fill-start" offset="0" /><stop className="equity-order-chart-fill-end" offset="1" /></linearGradient></defs>
              {[32, 64, 96].map((y) => <line className="equity-order-chart-grid" key={y} x1="0" y1={y} x2="430" y2={y} />)}
              <path d={chartGeometry.area} fill="url(#equity-order-chart-fill)" />
              <path className={cn('equity-order-chart-line', chart.change < 0 && 'is-negative')} d={chartGeometry.line} fill="none" />
              <text className="equity-order-chart-axis" x="440" y="24">{chartGeometry.max.toFixed(2)}</text>
              <text className="equity-order-chart-axis" x="440" y="68">{((chartGeometry.max + chartGeometry.min) / 2).toFixed(2)}</text>
              <text className="equity-order-chart-axis" x="440" y="112">{chartGeometry.min.toFixed(2)}</text>
            </svg>
            <div className="equity-order-chart-labels absolute bottom-2 left-3 right-12 flex justify-between text-[8px]">{chart.labels.map((label) => <span key={label}>{label}</span>)}</div>
          </div>
        </section>

        <div className="grid gap-2.5 lg:grid-cols-[.91fr_1.14fr]">
          <section className={cn(panelClass, 'p-3')}>
            <div className="equity-order-segment grid grid-cols-2 gap-1 rounded-full p-1">
              {(['BUY', 'SELL'] as const).map((value) => <button key={value} type="button" onClick={() => setOrderSide(value)} className={cn('h-8 rounded-full text-[9px] font-semibold transition', side === value ? value === 'BUY' ? 'equity-order-tab-buy text-white' : 'equity-order-tab-sell text-white' : 'equity-order-tab-idle')}>{value === 'BUY' ? 'Buy' : 'Sell'}</button>)}
            </div>
            <h3 className="equity-order-heading mt-3 text-[10px] font-semibold">Order Details</h3>
            <div className="mt-2.5 space-y-2.5">
              <div><Label help>Portfolio</Label><SelectField value={portfolio} onChange={setPortfolio}>{portfolios.map((item) => <option key={item}>{item}</option>)}</SelectField></div>
              <div><Label help>Instrument</Label><SelectField value={instrumentCode} onChange={(value) => { setInstrumentCode(value); setLimitPrice(String(instruments.find((item) => item.value === value)?.price ?? 0)); setReviewed(false) }}>{instruments.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField></div>
              <div><Label help>Order Type</Label><div className="equity-order-segment grid grid-cols-4 gap-1 rounded-full p-1">{['MARKET', 'LIMIT', 'STOP', 'STOP LIMIT'].map((value) => <button key={value} type="button" onClick={() => { setOrderType(value); setReviewed(false) }} className={cn('h-7 rounded-full text-[8px] font-medium transition', orderType === value ? 'equity-order-tab-buy text-white' : 'equity-order-tab-idle')}>{value === 'STOP LIMIT' ? 'Stop Limit' : value[0] + value.slice(1).toLowerCase()}</button>)}</div></div>
              <div><Label help>Quantity</Label><div className="relative"><input type="number" min="1" max={side === 'SELL' ? currentShares : undefined} step="1" value={quantity} onChange={(event) => { setQuantity(event.target.value); setReviewed(false) }} className={cn(fieldClass, 'pr-14')} /><span className="equity-order-label absolute right-3 top-2.5 text-[8px]">Shares</span></div><p className={cn('mt-1 text-[8px]', exceedsHolding ? 'equity-order-negative' : 'equity-order-muted')}>{exceedsHolding ? `Maximum sell quantity is ${currentShares.toLocaleString()} shares` : `Lot size: 1 · Min: 1${side === 'SELL' ? ` · Available: ${currentShares.toLocaleString()}` : ''}`}</p></div>
              <div><Label help>Price (ZWL)</Label><input type="number" min="0" value={orderType === 'MARKET' ? instrument.price : limitPrice} disabled={orderType === 'MARKET'} onChange={(event) => { setLimitPrice(event.target.value); setReviewed(false) }} className={fieldClass} /><p className="equity-order-muted mt-1 text-[8px]">{orderType === 'MARKET' ? 'Market order will execute at best available price' : 'Enter your execution price'}</p></div>
              <div><Label help>Time in Force</Label><SelectField value={timeInForce} onChange={(value) => { setTimeInForce(value); setReviewed(false) }}><option>Day</option><option>Good Till Cancelled</option><option>Fill or Kill</option></SelectField></div>
              <div><Label help>Validity</Label><div className="relative"><input type="date" value={validity} onChange={(event) => { setValidity(event.target.value); setReviewed(false) }} className={cn(fieldClass, 'pr-10')} /><CalendarDays className="equity-order-muted pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5" /></div></div>
            </div>
            <div className="equity-order-fees mt-3 space-y-1.5 border-t pt-3 text-[8px]">
              {feeRows.map(([label, value]) => <div key={label} className="flex justify-between"><span className="equity-order-label">{label}</span><span className="font-mono"><Money value={value} /></span></div>)}
              <div className="equity-order-fee-total flex justify-between border-t pt-2 text-[9px] font-semibold"><span>Total Estimated Fees</span><span className="font-mono"><Money value={fees} /></span></div>
            </div>
            <div className={cn('equity-order-status mt-3 flex items-center gap-3 rounded-xl border p-3', isValid ? 'is-valid' : 'is-invalid')}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-[9px] font-medium">{side === 'BUY' ? (hasCash ? 'Sufficient cash available' : 'Insufficient available cash') : (exceedsHolding ? 'Insufficient shares available' : 'Sufficient shares available')}</p>
                <p className="mt-1 text-[8px] opacity-75">{side === 'BUY' ? <>Available Cash: <Money value={availableCash} /></> : <>Available Shares: {currentShares.toLocaleString()}</>}</p>
              </div>
            </div>
          </section>

          <div className="space-y-2.5">
            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">Existing Holding</h3>
              <div className="equity-order-holding-top mt-3 grid grid-cols-1 sm:grid-cols-3">
                {[['Current Shares', currentShares.toLocaleString()], ['Avg. Cost (ZWL)', averageCost.toFixed(4)], ['Current Market Value', `${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ZWL`]].map(([label, value]) => <div key={label} className="equity-order-metric"><p className="equity-order-label text-[8px]">{label}</p><p className="equity-order-value mt-1.5 font-mono text-[10px]">{value}</p></div>)}
              </div>
              <div className="equity-order-holding-bottom mt-3 grid grid-cols-1 border-t pt-3 sm:grid-cols-2">
                <div className="equity-order-metric"><p className="equity-order-label text-[8px]">Unrealised P/L</p><p className="equity-order-positive mt-1.5 font-mono text-[10px]"><SignedMoney value={currentProfit} /><span className="block text-[8px]">(+{currentProfitPercent.toFixed(2)}%)</span></p></div>
                <div className="equity-order-metric"><p className="equity-order-label text-[8px]">Portfolio Weight</p><p className="equity-order-value mt-1.5 font-mono text-[10px]">{currentWeight.toFixed(2)}%</p></div>
              </div>
            </section>

            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">Impact of This Order ({side === 'BUY' ? 'Buy' : 'Sell'} {shares.toLocaleString()} Shares)</h3>
              <div className="equity-order-impact mt-3 grid grid-cols-[1.12fr_1fr_1fr] text-[8px]">
                <div />
                <p className="equity-order-label pb-1.5 text-center text-[7px]">BEFORE (Current)</p>
                <p className="equity-order-label pb-1.5 text-center text-[7px]">AFTER (Projected)</p>
                {[
                  ['Shares Held', currentShares.toLocaleString(), projectedShares.toLocaleString()],
                  ['Avg. Cost (ZWL)', averageCost.toFixed(4), projectedAverageCost.toFixed(4)],
                  ['Market Value (ZWL)', currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 }), projectedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })],
                  ['Unrealised P/L', `${currentProfit >= 0 ? '+' : '−'}${Math.abs(currentProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n(${currentProfitPercent >= 0 ? '+' : '−'}${Math.abs(currentProfitPercent).toFixed(2)}%)`, `${projectedProfit >= 0 ? '+' : '−'}${Math.abs(projectedProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n(${projectedProfitPercent >= 0 ? '+' : '−'}${Math.abs(projectedProfitPercent).toFixed(2)}%)`],
                  ['Portfolio Weight', `${currentWeight.toFixed(2)}%`, `${projectedWeight.toFixed(2)}%`],
                ].flatMap(([label, before, after]) => [
                  <p key={`${label}-label`} className="equity-order-impact-label py-1.5">{label}</p>,
                  <p key={`${label}-before`} className={cn('equity-order-impact-value whitespace-pre-line py-1.5 text-center font-mono', label === 'Unrealised P/L' && 'equity-order-positive')}>{before}</p>,
                  <p key={`${label}-after`} className={cn('equity-order-impact-value whitespace-pre-line py-1.5 text-center font-mono', label === 'Unrealised P/L' && 'equity-order-positive')}>{after}</p>,
                ])}
              </div>
              <div className="equity-order-callout mt-2.5 flex items-start gap-3 rounded-xl border p-3">
                {side === 'BUY' ? <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" /> : <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />}
                <p className="text-[8px] leading-4">This order will {side === 'BUY' ? 'increase' : 'decrease'} your exposure to {instrument.label.split(' (')[0]} from <b>{currentWeight.toFixed(2)}%</b> to <b>{projectedWeight.toFixed(2)}%</b> of your portfolio.</p>
              </div>
            </section>

            <section className={cn(panelClass, 'p-4')}>
              <h3 className="equity-order-heading text-[10px] font-semibold">Order Summary</h3>
              <div className="mt-3 space-y-2 text-[8px]">
                <div className="flex justify-between gap-4"><span className="equity-order-label">Order Value ({shares.toLocaleString()} Shares)</span><span className="font-mono"><Money value={orderValue} /></span></div>
                <div className="flex justify-between gap-4"><span className="equity-order-label">Estimated Fees</span><span className="font-mono"><Money value={fees} /></span></div>
                <div className="equity-order-summary-total flex justify-between gap-4 border-t pt-2 text-[9px] font-semibold"><span>{side === 'BUY' ? 'Total Consideration' : 'Net Proceeds'}</span><span className="equity-order-accent font-mono"><Money value={consideration} /></span></div>
                <div className="flex justify-between gap-4"><span className="equity-order-label">Settlement Date</span><span className="equity-order-accent">{settlementDate} (T+2)</span></div>
              </div>
            </section>
            {reviewed && <div className="equity-order-reviewed rounded-xl border px-4 py-3 text-[9px]">Order reviewed. Confirm the summary and place the {side.toLowerCase()} order when ready.</div>}
          </div>
        </div>
      </div>
    </Modal>
  )
}
