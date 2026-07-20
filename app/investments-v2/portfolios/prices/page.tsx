'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, FileUp, Loader2, Plus, Search, ShieldAlert, X } from 'lucide-react'
import { OpsKpiSkeleton, OpsListSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type IngestBatch,
  type Instrument,
} from '@/lib/api/investment-ops-api'
import { mapLatestPriceRow, type PriceRow } from '@/lib/investments-v2/adapters/portfolio-adapter'

type Status = 'Pending' | 'Validated' | 'Approved' | 'Rejected' | 'Stale' | 'Estimated' | string
type Source = 'API Confirmed' | 'Manual Override' | 'Vendor Feed' | 'File Upload' | string

const statuses = ['Pending', 'Validated', 'Approved', 'Rejected', 'Stale', 'Estimated']
const tones: Record<string, string> = {
  Pending: 'bg-amber-400/10 text-amber-300',
  Validated: 'bg-sky-400/10 text-sky-300',
  Approved: 'bg-emerald-400/10 text-emerald-300',
  Rejected: 'bg-rose-400/10 text-rose-300',
  Stale: 'bg-orange-400/10 text-orange-300',
  Estimated: 'bg-violet-400/10 text-violet-300',
}
const card = 'rounded-[24px] border border-white/[0.06] bg-[linear-gradient(135deg,#172333_0%,#101a29_58%,#0b1420_100%)] shadow-[0_20px_60px_rgba(0,0,0,.2)]'
const pill = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] font-medium transition hover:border-white/20 hover:bg-white/[0.06]'
const input = 'h-10 w-full rounded-full border border-white/10 bg-[#0a121d] px-4 text-[11px] outline-none focus:border-[#2f87fa]'

function Badge({ value }: { value: Status | Source }) {
  const sourceTone =
    value === 'API Confirmed'
      ? 'bg-cyan-400/10 text-cyan-300'
      : value === 'Manual Override'
        ? 'bg-fuchsia-400/10 text-fuchsia-300'
        : 'bg-white/[0.07] text-[#aeb9c8]'
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold ${statuses.includes(String(value)) ? tones[String(value)] : sourceTone}`}>
      {value}
    </span>
  )
}

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [queueRows, setQueueRows] = useState<PriceRow[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [batches, setBatches] = useState<IngestBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'latest' | 'ingest' | 'queue'>('latest')
  const [status, setStatus] = useState('All statuses')
  const [market, setMarket] = useState('All markets')
  const [source, setSource] = useState('All sources')
  const [date, setDate] = useState('All dates')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [uploadSubmitting, setUploadSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSourceCode, setUploadSourceCode] = useState('MANUAL')
  const [reviewActionId, setReviewActionId] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pricesRes, batchesRes, queueRes, instrumentsRes] = await Promise.all([
        investmentOpsApi.getLatestPrices(),
        investmentOpsApi.listIngestBatches(),
        investmentOpsApi.listValidationQueue(),
        investmentOpsApi.listInstruments({ page: 1, pageSize: 200 }),
      ])
      if (!pricesRes.success) throw new Error(formatOpsError(pricesRes, 'Failed to load prices'))
      const mapped = unwrapList<Record<string, unknown>>(pricesRes.data)
        .map(mapLatestPriceRow)
        .filter((row): row is PriceRow => Boolean(row))
      setPrices(mapped)
      if (batchesRes.success) {
        setBatches(unwrapList<IngestBatch>(batchesRes.data))
      } else {
        setBatches([])
      }
      if (queueRes.success) {
        setQueueRows(
          unwrapList<Record<string, unknown>>(queueRes.data)
            .map(mapLatestPriceRow)
            .filter((row): row is PriceRow => Boolean(row)),
        )
      } else {
        setQueueRows([])
      }
      if (instrumentsRes.success) {
        setInstruments(unwrapList<Instrument>(instrumentsRes.data))
      } else {
        setInstruments([])
      }
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load prices'))
      setPrices([])
      setQueueRows([])
      setBatches([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const tableSource = view === 'queue' ? queueRows : prices

  const markets = useMemo(() => {
    const set = new Set(tableSource.map((row) => row.market).filter(Boolean))
    return ['All markets', ...Array.from(set)]
  }, [tableSource])
  const sources = useMemo(() => {
    const set = new Set(tableSource.map((row) => row.source).filter(Boolean))
    return ['All sources', ...Array.from(set)]
  }, [tableSource])

  const filtered = useMemo(
    () =>
      tableSource
        .filter((row) => status === 'All statuses' || row.status === status)
        .filter((row) => market === 'All markets' || row.market === market)
        .filter((row) => source === 'All sources' || row.source === source)
        .filter((row) => date === 'All dates' || row.priceDate === date)
        .filter((row) => `${row.ticker} ${row.name}`.toLowerCase().includes(query.toLowerCase())),
    [date, market, query, source, status, tableSource],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / 6))
  const rows = filtered.slice((page - 1) * 6, page * 6)
  const pending = queueRows.filter((row) => row.status === 'Pending').length
  const queueCount = queueRows.length

  const flash = (message: string, isError = false) => {
    setNotice(message)
    setNoticeError(isError)
    window.setTimeout(() => {
      setNotice('')
      setNoticeError(false)
    }, 2800)
  }

  const handleApprove = async (row: PriceRow) => {
    if (!row.canReview) {
      flash('Cannot approve — queue row missing API tick id', true)
      return
    }
    setReviewActionId(row.id)
    try {
      const res = await investmentOpsApi.approveValidationTick(row.id, {
        expectedVersion: row.auditVersion,
      })
      if (!res.success) throw new Error(formatOpsError(res, 'Failed to approve price'))
      flash('Price approved via API')
      await loadData()
    } catch (e) {
      flash(formatOpsError(e, 'Failed to approve price'), true)
    } finally {
      setReviewActionId(null)
    }
  }

  const handleReject = async (row: PriceRow) => {
    if (!row.canReview) {
      flash('Cannot reject — queue row missing API tick id', true)
      return
    }
    const reason = window.prompt('Rejection reason (required):')
    if (!reason?.trim()) return
    setReviewActionId(row.id)
    try {
      const res = await investmentOpsApi.rejectValidationTick(row.id, {
        reason: reason.trim(),
        expectedVersion: row.auditVersion,
      })
      if (!res.success) throw new Error(formatOpsError(res, 'Failed to reject price'))
      flash('Price rejected via API')
      await loadData()
    } catch (e) {
      flash(formatOpsError(e, 'Failed to reject price'), true)
    } finally {
      setReviewActionId(null)
    }
  }

  const addManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setManualSubmitting(true)
    setManualError(null)
    try {
      const data = new FormData(event.currentTarget)
      const securityId = String(data.get('securityId') ?? '')
      const price = Number(data.get('price'))
      if (!securityId) throw new Error('Select an instrument with a linked security')
      if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid price')
      const res = await investmentOpsApi.postManualPrice({ securityId, price })
      if (!res.success) throw new Error(formatOpsError(res, 'Failed to submit manual price'))
      setManualOpen(false)
      setView('queue')
      setPage(1)
      flash('Manual price submitted via API — pending review')
      await loadData()
    } catch (e) {
      setManualError(formatOpsError(e, 'Failed to submit manual price'))
    } finally {
      setManualSubmitting(false)
    }
  }

  const handleUploadFile = async (file: File) => {
    setUploadSubmitting(true)
    setUploadError(null)
    try {
      const csvText = await file.text()
      const res = await investmentOpsApi.uploadPrices({
        csvText,
        sourceCode: uploadSourceCode.trim() || 'MANUAL',
      })
      if (!res.success) throw new Error(formatOpsError(res, 'Failed to upload prices'))
      const accepted = (res.data as { accepted?: number } | undefined)?.accepted
      setUploadOpen(false)
      flash(
        accepted != null
          ? `Price file uploaded via API — ${accepted} row${accepted === 1 ? '' : 's'} accepted`
          : 'Price file uploaded via API',
      )
      await loadData()
    } catch (e) {
      setUploadError(formatOpsError(e, 'Failed to upload prices'))
    } finally {
      setUploadSubmitting(false)
    }
  }

  const pricedInstrumentsForSelect = useMemo(() => {
    const withSecurity = instruments.filter((item) => item.listedEquitySecurityId)
    return [...withSecurity].sort((a, b) => {
      const aActive = a.status === 'ACTIVE' ? 0 : 1
      const bActive = b.status === 'ACTIVE' ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return String(a.ticker).localeCompare(String(b.ticker))
    })
  }, [instruments])
  const instrumentsMissingSecurity = instruments.filter((item) => !item.listedEquitySecurityId).length

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#edf3fa] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-col gap-4 px-1 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.24em] text-[#65758b]">Portfolio market</p>
            <h1 className="mt-1 text-xl font-semibold">Price control centre</h1>
            <p className="mt-1 text-[11px] text-[#77869a]">Review latest market data, exceptions and approval state.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setUploadOpen(true)} className={`${pill} text-[#b7c1cf]`}><FileUp className="h-3.5 w-3.5" />Upload prices</button>
            <button type="button" onClick={() => setManualOpen(true)} className={`${pill} border-[#2f87fa] bg-[#2f87fa] text-white`}><Plus className="h-3.5 w-3.5" />Manual entry</button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">{error}</div>
        )}
        {loading && prices.length === 0 ? (
          <OpsKpiSkeleton count={4} />
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Priced instruments', prices.length, 'text-white'],
              ['Awaiting review', pending, 'text-amber-300'],
              ['Approved today', prices.filter((r) => r.status === 'Approved' && r.priceDate === 'Today').length, 'text-emerald-300'],
              ['Data exceptions', prices.filter((r) => r.flag).length, 'text-rose-300'],
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
            <div className="flex gap-1.5 overflow-x-auto">
              <button type="button" onClick={() => { setView('latest'); setPage(1) }} className={`${pill} h-8 shrink-0 ${view === 'latest' ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8896a9]'}`}>Latest prices</button>
              <button type="button" onClick={() => { setView('ingest'); setPage(1) }} className={`${pill} h-8 shrink-0 ${view === 'ingest' ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8896a9]'}`}>Ingest & manual</button>
              <button type="button" onClick={() => { setView('queue'); setPage(1) }} className={`${pill} h-8 shrink-0 ${view === 'queue' ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8896a9]'}`}>
                Validation queue <span className="rounded-full bg-amber-400/15 px-1.5 text-amber-300">{queueCount}</span>
              </button>
            </div>
            {view !== 'ingest' && (
              <div className="flex flex-wrap gap-2">
                <label className="flex h-9 min-w-[190px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#0b1420] px-4 text-[#7c8a9e]">
                  <Search className="h-3.5 w-3.5" />
                  <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search instrument" className="w-full bg-transparent text-[11px] text-white outline-none" />
                </label>
                <div className="relative">
                  <button type="button" onClick={() => setSourceOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{source}<ChevronDown className="h-3 w-3" /></button>
                  {sourceOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {sources.map((item) => (
                        <button key={item} type="button" onClick={() => { setSource(item); setPage(1); setSourceOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${source === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{source === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setDateOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{date}<ChevronDown className="h-3 w-3" /></button>
                  {dateOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {['All dates', 'Today', 'Previous business day', 'Older'].map((item) => (
                        <button key={item} type="button" onClick={() => { setDate(item); setPage(1); setDateOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${date === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{date === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setMarketOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{market}<ChevronDown className="h-3 w-3" /></button>
                  {marketOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-40 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {markets.map((item) => (
                        <button key={item} type="button" onClick={() => { setMarket(item); setPage(1); setMarketOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${market === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{market === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setFilterOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{status}<ChevronDown className="h-3 w-3" /></button>
                  {filterOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {['All statuses', ...statuses].map((item) => (
                        <button key={item} type="button" onClick={() => { setStatus(item); setPage(1); setFilterOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${status === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{status === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {view === 'ingest' ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1.25fr]">
              <button type="button" onClick={() => setUploadOpen(true)} className="group min-h-44 rounded-full border border-dashed border-[#2f87fa]/35 bg-[#2f87fa]/[0.04] p-5 text-left transition hover:border-[#2f87fa]/60 hover:bg-[#2f87fa]/[0.08]">
                <FileUp className="h-6 w-6 text-[#66a5fa]" />
                <p className="mt-5 text-sm font-semibold">Upload market prices</p>
                <p className="mt-2 text-[10px] leading-5 text-[#7d8ca0]">Upload CSV price rows to the Investment Ops ingest pipeline.</p>
                <span className="mt-4 inline-flex rounded-full bg-[#2f87fa]/15 px-3 py-1.5 text-[9px] text-[#8ebcff] group-hover:bg-[#2f87fa]/25">Choose file</span>
              </button>
              <button type="button" onClick={() => setManualOpen(true)} className="group min-h-44 rounded-full border border-white/[0.07] bg-black/10 p-5 text-left transition hover:border-[#2f87fa]/35 hover:bg-[#2f87fa]/[0.05]">
                <Plus className="h-6 w-6 text-[#66a5fa]" />
                <p className="mt-5 text-sm font-semibold">Enter a manual price</p>
                <p className="mt-2 text-[10px] leading-5 text-[#7d8ca0]">Create a controlled override with mandatory independent review before approval.</p>
                <span className="mt-4 inline-flex rounded-full bg-fuchsia-400/10 px-3 py-1.5 text-[9px] text-fuchsia-300 group-hover:bg-fuchsia-400/15">Create override</span>
              </button>
              <div className="rounded-[24px] border border-white/[0.07] bg-black/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[.16em] text-[#718096]">Recent ingest</p>
                    <h3 className="mt-1 text-sm font-semibold">Batch activity</h3>
                  </div>
                  <button type="button" onClick={() => setView('queue')} className={`${pill} h-8 px-3 text-[#8ebcff]`}>Review queue</button>
                </div>
                <div className="mt-4 space-y-2">
                  {loading && batches.length === 0 && <OpsListSkeleton rows={5} />}
                  {batches.length === 0 && !loading && (
                    <p className="px-2 py-6 text-center text-[10px] text-[#6f7e92]">No ingest batches returned from the API.</p>
                  )}
                  {!loading && batches.slice(0, 8).map((batch) => (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => { setView('queue'); setQuery(batch.sourceCode || '') }}
                      className="flex w-full items-center justify-between rounded-full border border-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.04]"
                    >
                      <div>
                        <p className="font-mono text-[10px] text-[#c4cedb]">{batch.sourceCode || batch.id}</p>
                        <p className="mt-1 text-[9px] text-[#6e7d91]">{batch.recordCount ?? 0} rows · {batch.asOfDate || '—'}</p>
                      </div>
                      <Badge value={batch.status === 'COMPLETED' ? 'Approved' : batch.status === 'PARTIAL' ? 'Validated' : 'Pending'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-[10px]">
                  <thead className="text-[#6f7e92]">
                    <tr>
                      {['Instrument', 'Market', 'Current', 'Previous', 'Change', 'Source', 'Status', 'Priced at', view === 'queue' ? 'Review action' : 'Control note'].map((head) => (
                        <th key={head} className="border-b border-white/[0.06] px-4 py-3 font-medium">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <OpsTableSkeleton rows={8} cols={9} />
                        </td>
                      </tr>
                    )}
                    {!loading && rows.map((row) => {
                      const change =
                        row.previous != null && row.previous !== 0
                          ? ((row.price - row.previous) / row.previous) * 100
                          : null
                      return (
                        <tr key={row.id} className="border-b border-white/[0.045] transition hover:bg-white/[0.035]">
                          <td className="px-4 py-3"><p className="font-semibold text-white">{row.ticker}</p><p className="mt-1 text-[9px] text-[#78879a]">{row.name}</p></td>
                          <td className="px-4 py-3 text-[#aab4c2]">{row.market} · {row.currency}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{row.price.toFixed(4)}</td>
                          <td className="px-4 py-3 font-mono text-[#8794a7]">{row.previous != null ? row.previous.toFixed(4) : '—'}</td>
                          <td className={`px-4 py-3 font-mono ${change == null ? 'text-[#8794a7]' : change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {change == null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
                          </td>
                          <td className="px-4 py-3"><Badge value={row.source} /></td>
                          <td className="px-4 py-3"><Badge value={row.status} /></td>
                          <td className="px-4 py-3 font-mono text-[#7d8b9e]">{row.time}</td>
                          <td className="max-w-[290px] px-4 py-3">
                            {view === 'queue' && ['Pending', 'Validated'].includes(row.status) ? (
                              <div>
                                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300">{row.issue || 'Ready for approval'}</p>
                                <p className="mb-2 flex items-start gap-1.5 text-[9px] text-amber-200/80"><ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />{row.flag || 'Validated and ready for approval.'}</p>
                                {row.canReview ? (
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      disabled={reviewActionId === row.id}
                                      onClick={() => void handleApprove(row)}
                                      className={`${pill} h-7 border-emerald-400/30 px-3 text-emerald-300 disabled:opacity-50`}
                                    >
                                      {reviewActionId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                      Four-eye approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={reviewActionId === row.id}
                                      onClick={() => void handleReject(row)}
                                      className={`${pill} h-7 border-rose-400/30 px-3 text-rose-300 disabled:opacity-50`}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-rose-300">Missing API tick id — cannot approve/reject this row.</p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-[9px] font-semibold text-[#9eabc0]">{row.issue || 'No exception'}</p>
                                <p className="mt-1 text-[9px] text-[#78879a]">{row.flag || 'No control exceptions'}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-14 text-center text-[11px] text-[#6f7e92]">
                          {view === 'queue' ? 'No items in the validation queue.' : 'No prices returned from the API.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#718096]">
                <span>Showing {rows.length} of {filtered.length} {view === 'queue' ? 'queue items' : 'prices'}</span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronLeft className="h-3.5 w-3.5" /></button>
                  <span>{page} / {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      {notice && (
        <div className={`fixed bottom-5 right-5 z-[80] rounded-full border px-4 py-2 text-[11px] shadow-2xl ${noticeError ? 'border-rose-400/30 bg-rose-950/90 text-rose-100' : 'border-white/10 bg-[#172333] text-[#edf3fa]'}`}>
          {!noticeError && <Check className="mr-2 inline h-3.5 w-3.5 text-emerald-300" />}
          {noticeError && <ShieldAlert className="mr-2 inline h-3.5 w-3.5 text-rose-300" />}
          {notice}
        </div>
      )}

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setManualOpen(false)}>
          <form onSubmit={(e) => void addManual(e)} onMouseDown={(e) => e.stopPropagation()} className={`${card} w-full max-w-md p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Enter manual price</h2>
              <button type="button" onClick={() => setManualOpen(false)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>
            {manualError && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[11px] text-rose-200">{manualError}</div>
            )}
            <div className="mt-6 space-y-4">
              <label>
                <span className="mb-2 block text-[10px] text-[#8795a8]">Instrument</span>
                <select name="securityId" required className={input}>
                  <option value="">Select instrument</option>
                  {pricedInstrumentsForSelect.map((item) => (
                    <option key={item.id} value={item.listedEquitySecurityId!}>
                      {item.ticker} — {item.shortName || item.fullName}
                      {item.status !== 'ACTIVE' ? ` (${item.status})` : ''}
                    </option>
                  ))}
                </select>
                {pricedInstrumentsForSelect.length === 0 && (
                  <p className="mt-2 text-[9px] text-amber-300">
                    No instruments with a linked security id. Create/approve an instrument first — BE must return `listedEquitySecurityId`.
                  </p>
                )}
                {pricedInstrumentsForSelect.length > 0 && instrumentsMissingSecurity > 0 && (
                  <p className="mt-2 text-[9px] text-[#7d8b9e]">
                    {instrumentsMissingSecurity} instrument{instrumentsMissingSecurity === 1 ? '' : 's'} hidden (no linked security id).
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-[10px] text-[#8795a8]">Price</span>
                <input name="price" type="number" step="any" min="0" required className={input} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setManualOpen(false)} className={`${pill}`}>Cancel</button>
              <button type="submit" disabled={manualSubmitting || pricedInstrumentsForSelect.length === 0} className={`${pill} border-[#2f87fa] bg-[#2f87fa] text-white disabled:opacity-50`}>
                {manualSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Submit for review
              </button>
            </div>
          </form>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setUploadOpen(false)}>
          <div onMouseDown={(e) => e.stopPropagation()} className={`${card} w-full max-w-lg p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload price file</h2>
              <button type="button" onClick={() => setUploadOpen(false)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>
            {uploadError && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[11px] text-rose-200">{uploadError}</div>
            )}
            <label className="mt-4 block">
              <span className="mb-2 block text-[10px] text-[#8795a8]">Source code</span>
              <input
                value={uploadSourceCode}
                onChange={(e) => setUploadSourceCode(e.target.value)}
                placeholder="MANUAL"
                className={input}
              />
            </label>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUploadFile(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={uploadSubmitting}
              onClick={() => uploadInputRef.current?.click()}
              className="mt-4 flex h-44 w-full flex-col items-center justify-center rounded-full border border-dashed border-[#2f87fa]/40 bg-[#2f87fa]/[0.05] text-[#8291a5] transition hover:bg-[#2f87fa]/10 disabled:opacity-50"
            >
              {uploadSubmitting ? (
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#5d9df3]" />
              ) : (
                <FileUp className="mb-3 h-7 w-7 text-[#5d9df3]" />
              )}
              <span className="text-[11px]">{uploadSubmitting ? 'Uploading via API…' : 'Select CSV price file'}</span>
              <span className="mt-1 text-[9px] text-[#5f6e82]">File contents are sent to Investment Ops upload endpoint</span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
