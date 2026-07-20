'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, Search, ShieldAlert, X } from 'lucide-react'
import { OpsKpiSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { formatOpsError, investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import { mapInstrumentRow, type InstrumentRow } from '@/lib/investments-v2/adapters/portfolio-adapter'

const card = 'rounded-[24px] border border-white/[0.06] bg-[linear-gradient(135deg,#172333_0%,#101a29_58%,#0b1420_100%)] shadow-[0_20px_60px_rgba(0,0,0,.2)]'
const pill = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] font-medium transition hover:border-white/20 hover:bg-white/[0.06]'
const input = 'h-10 w-full rounded-full border border-white/10 bg-[#0a121d] px-4 text-[11px] outline-none focus:border-[#2f87fa]'
const PAGE_SIZE = 5

const STATUS_FILTERS = ['All statuses', 'Draft', 'Pending approval', 'Active', 'Inactive', 'Restricted', 'Suspended'] as const

function statusBadgeClass(status: string): string {
  if (status === 'Active') return 'bg-emerald-400/10 text-emerald-300'
  if (status === 'Pending approval') return 'bg-amber-400/10 text-amber-300'
  if (status === 'Draft') return 'bg-sky-400/10 text-sky-300'
  return 'bg-slate-400/10 text-slate-300'
}

export default function InstrumentsPage() {
  const [items, setItems] = useState<InstrumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All statuses')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<InstrumentRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [lifecycleBusy, setLifecycleBusy] = useState(false)
  const [lifecycleError, setLifecycleError] = useState<string | null>(null)

  const loadInstruments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.listInstruments({ page: 1, pageSize: 200 })
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load instruments')
      const rows = unwrapList<Record<string, unknown>>(res.data).map(mapInstrumentRow)
      setItems(rows)
      return rows
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load instruments')
      setItems([])
      return [] as InstrumentRow[]
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInstruments()
  }, [loadInstruments])

  const categories = useMemo(() => {
    const set = new Set(items.map((row) => row.type).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [items])

  const filtered = useMemo(
    () =>
      items
        .filter((row) => category === 'All' || row.type === category)
        .filter((row) => status === 'All statuses' || row.status === status || row.restriction === status)
        .filter((row) => `${row.symbol} ${row.name} ${row.isin} ${row.sector}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sortAsc ? 1 : -1) * a.symbol.localeCompare(b.symbol)),
    [category, items, search, sortAsc, status],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const refreshSelected = useCallback(async (id: string) => {
    const rows = await loadInstruments()
    const next = rows.find((row) => row.id === id) ?? null
    setSelected(next)
    return next
  }, [loadInstruments])

  const addInstrument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateSubmitting(true)
    setCreateError(null)
    try {
      const data = new FormData(event.currentTarget)
      const name = String(data.get('name') || '').trim()
      const ticker = String(data.get('symbol') || '').trim().toUpperCase()
      const market = String(data.get('market') || '').trim().toUpperCase()
      const typeRaw = String(data.get('type') || '').trim()
      const instrumentTypeCode = (typeRaw ? typeRaw.toUpperCase().replace(/\s+/g, '_') : 'EQUITY')
      const isin = String(data.get('isin') || '').trim()
      const sector = String(data.get('sector') || '').trim()
      const submitAfterCreate = data.get('submitAfterCreate') === 'on'

      const res = await investmentOpsApi.createInstrument({
        ticker,
        shortName: name,
        fullName: name,
        instrumentTypeCode,
        exchangeCode: market,
        marketCode: market || undefined,
        listingCurrencyCode: 'USD',
        valuationMethod: 'MARK_TO_MARKET',
        ...(isin ? { isin } : {}),
        ...(sector ? { sector } : {}),
      })

      if (res.success === false) {
        throw new Error(formatOpsError(res, 'Failed to create instrument'))
      }

      const created = res.data as { id?: string; auditVersion?: number } | undefined
      const createdId = created?.id ? String(created.id) : null
      let version = Number(created?.auditVersion ?? 1)

      if (submitAfterCreate && createdId) {
        const submitRes = await investmentOpsApi.submitInstrument(createdId, { expectedVersion: version })
        if (submitRes.success === false) {
          throw new Error(formatOpsError(submitRes, 'Created, but submit for approval failed'))
        }
        version = Number((submitRes.data as { auditVersion?: number } | undefined)?.auditVersion ?? version + 1)
      }

      setCreateOpen(false)
      setPage(1)
      const nextRows = await loadInstruments()
      if (createdId) {
        setSelected(nextRows.find((row) => row.id === createdId) ?? null)
        setLifecycleError(null)
      }
    } catch (e) {
      setCreateError(formatOpsError(e, 'Failed to create instrument'))
    } finally {
      setCreateSubmitting(false)
    }
  }

  const runLifecycle = async (action: 'submit' | 'approve') => {
    if (!selected?.id) return
    setLifecycleBusy(true)
    setLifecycleError(null)
    try {
      const body = { expectedVersion: selected.auditVersion }
      const res =
        action === 'submit'
          ? await investmentOpsApi.submitInstrument(selected.id, body)
          : await investmentOpsApi.approveInstrument(selected.id, body)
      if (res.success === false) {
        throw new Error(
          formatOpsError(res, action === 'submit' ? 'Failed to submit instrument' : 'Failed to approve instrument'),
        )
      }
      await refreshSelected(selected.id)
    } catch (e) {
      setLifecycleError(
        formatOpsError(e, action === 'submit' ? 'Failed to submit instrument' : 'Failed to approve instrument'),
      )
    } finally {
      setLifecycleBusy(false)
    }
  }

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#edf3fa] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.24em] text-[#65758b]">Portfolio market</p>
            <h1 className="mt-1 text-xl font-semibold">Instrument registry</h1>
            <p className="mt-1 text-[11px] text-[#77869a]">
              Create → submit → approve to make an instrument Active for order tickets.
            </p>
          </div>
          <button type="button" onClick={() => { setCreateError(null); setCreateOpen(true) }} className={`${pill} border-[#2f87fa] bg-[#2f87fa] text-white`}>
            <Plus className="h-3.5 w-3.5" />Create instrument
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">{error}</div>
        )}
        {loading && items.length === 0 ? (
          <OpsKpiSkeleton count={4} />
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Registered', items.length, 'text-white'],
              ['Active', items.filter((r) => r.rawStatus === 'ACTIVE').length, 'text-emerald-300'],
              ['Pending', items.filter((r) => r.rawStatus === 'PENDING_APPROVAL' || r.rawStatus === 'DRAFT').length, 'text-amber-300'],
              ['Restricted', items.filter((r) => r.restriction !== 'None').length, 'text-amber-300'],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className={`${card} px-5 py-4`}>
                <p className="text-[9px] uppercase tracking-[.16em] text-[#718096]">{label}</p>
                <p className={`mt-2 font-mono text-xl font-semibold ${tone}`}>{value}</p>
              </div>
            ))}
          </section>
        )}

        <section className={`${card} overflow-visible`}>
          <div className="border-b border-white/[0.07] p-4">
            <div className="flex gap-1.5 overflow-x-auto pb-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setCategory(item); setPage(1) }}
                  className={`${pill} h-8 shrink-0 px-3 ${category === item ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8997a9]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#0b1420] px-4 text-[#7c8a9e] lg:max-w-sm">
                <Search className="h-3.5 w-3.5" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search symbol, name or identifier" className="w-full bg-transparent text-[11px] text-white outline-none" />
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <button type="button" onClick={() => setFilterOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>{status}<ChevronDown className="h-3 w-3" /></button>
                  {filterOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {STATUS_FILTERS.map((item) => (
                        <button key={item} type="button" onClick={() => { setStatus(item); setPage(1); setFilterOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${status === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{status === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setSortAsc((v) => !v)} className={`${pill} text-[#aeb8c7]`}>
                  <ArrowDownUp className="h-3.5 w-3.5" />Symbol {sortAsc ? 'A–Z' : 'Z–A'}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-[10px]">
              <thead className="text-[#6f7e92]">
                <tr>
                  {['Instrument', 'Identifiers', 'Classification', 'Market', 'Currency', 'Latest price', 'State', 'Restriction', 'Updated'].map((head) => (
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
                {!loading && rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setLifecycleError(null); setSelected(row) }}
                    className={`cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.035] ${selected?.id === row.id ? 'bg-[#2f87fa]/10' : ''}`}
                  >
                    <td className="px-4 py-3"><p className="font-semibold text-white">{row.symbol}</p><p className="mt-1 text-[9px] text-[#78879a]">{row.name}</p></td>
                    <td className="px-4 py-3 font-mono text-[#8c9aab]"><p>{row.isin}</p><p className="mt-1 text-[9px]">{row.sedol}</p></td>
                    <td className="px-4 py-3"><p>{row.type}</p><p className="mt-1 text-[9px] text-[#78879a]">{row.sector}</p></td>
                    <td className="px-4 py-3">{row.market}</td>
                    <td className="px-4 py-3 font-mono">{row.currency}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{row.price != null ? row.price.toFixed(4) : '—'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] ${statusBadgeClass(row.status)}`}>{row.status}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] ${row.restriction === 'None' ? 'bg-white/[.06] text-[#9aa8ba]' : row.restriction === 'Suspended' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'}`}>{row.restriction}</span></td>
                    <td className="px-4 py-3 font-mono text-[#7d8b9e]">{row.updated}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center text-[11px] text-[#6f7e92]">
                      No instruments returned from the API.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#718096]">
            <span>Showing {rows.length} of {filtered.length} instruments</span>
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
          <aside onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[linear-gradient(145deg,#172333,#0b1420_70%)] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[.2em] text-[#64758b]">Security master</p>
                <h2 className="mt-2 text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 font-mono text-[10px] text-[#718096]">{selected.symbol} · {selected.market}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>

            <section className="mt-4 rounded-[24px] border border-white/[0.07] bg-black/10 p-5">
              <h3 className="text-[11px] font-semibold">Lifecycle</h3>
              <p className="mt-2 text-[10px] text-[#8795a8]">
                Order tickets only list <span className="text-emerald-300">Active</span> instruments.
                Draft → Submit for approval → Approve.
              </p>
              {lifecycleError && (
                <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">{lifecycleError}</div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.rawStatus === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={lifecycleBusy}
                    onClick={() => void runLifecycle('submit')}
                    className={`${pill} border-[#2f87fa] bg-[#2f87fa] text-white disabled:opacity-50`}
                  >
                    {lifecycleBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Submit for approval
                  </button>
                )}
                {selected.rawStatus === 'PENDING_APPROVAL' && (
                  <button
                    type="button"
                    disabled={lifecycleBusy}
                    onClick={() => void runLifecycle('approve')}
                    className={`${pill} border-emerald-500/50 bg-emerald-500/20 text-emerald-200 disabled:opacity-50`}
                  >
                    {lifecycleBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Approve for trading
                  </button>
                )}
                {selected.rawStatus === 'ACTIVE' && (
                  <span className="rounded-full bg-emerald-400/10 px-3 py-2 text-[10px] text-emerald-300">
                    Active — available on place-order
                  </span>
                )}
                {!['DRAFT', 'PENDING_APPROVAL', 'ACTIVE'].includes(selected.rawStatus) && (
                  <span className="rounded-full bg-white/[0.06] px-3 py-2 text-[10px] text-[#9aa8ba]">
                    Status {selected.status} — no FE action for this state
                  </span>
                )}
              </div>
            </section>

            {[
              { title: 'Identifiers', fields: [['ISIN', selected.isin], ['SEDOL', selected.sedol], ['Symbol', selected.symbol], ['Market', selected.market]] },
              { title: 'Classification', fields: [['Asset type', selected.type], ['Category', selected.category], ['Sector', selected.sector], ['Country', selected.country]] },
              { title: 'Pricing', fields: [['Currency', selected.currency], ['Latest price', selected.price != null ? selected.price.toFixed(4) : '—'], ['Price source', selected.source], ['Issuer', selected.issuer]] },
              ...(selected.coupon != null
                ? [{ title: 'Fixed-income terms', fields: [['Coupon', `${selected.coupon}%`], ['Maturity', selected.maturity ?? '—'], ['Face value', String(selected.faceValue ?? '—')], ['Quote basis', 'Percentage of par']] }]
                : []),
              { title: 'Control & audit', fields: [['Status', selected.status], ['Restriction', selected.restriction], ['Version', String(selected.auditVersion)], ['Created by', selected.createdBy], ['Last updated', selected.updated]] },
            ].map((section) => (
              <section key={section.title} className="mt-4 rounded-[24px] border border-white/[0.07] bg-black/10 p-5">
                <h3 className="text-[11px] font-semibold">{section.title}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-5">
                  {section.fields.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[9px] uppercase tracking-wider text-[#66768b]">{label}</dt>
                      <dd className="mt-1 text-[11px] text-[#c8d0db]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </aside>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setCreateOpen(false)}>
          <form onSubmit={addInstrument} onMouseDown={(e) => e.stopPropagation()} className={`${card} w-full max-w-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[.2em] text-[#68788d]">Investment Ops</p>
                <h2 className="mt-1 text-lg font-semibold">Create instrument</h2>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>
            {createError && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">{createError}</div>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[['symbol', 'Symbol'], ['name', 'Instrument name'], ['isin', 'ISIN'], ['type', 'Asset type'], ['sector', 'Sector'], ['market', 'Market']].map(([name, label]) => (
                <label key={name}>
                  <span className="mb-2 block text-[10px] text-[#8795a8]">{label}</span>
                  <input name={name} required={name !== 'isin'} className={input} />
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-start gap-2 text-[10px] text-[#aeb8c7]">
              <input name="submitAfterCreate" type="checkbox" defaultChecked className="mt-0.5 rounded border-white/20" />
              <span>Submit for approval after create (still needs Approve for trading).</span>
            </label>
            <p className="mt-3 flex gap-2 text-[9px] text-amber-200/70"><ShieldAlert className="h-3 w-3 shrink-0" />New records start as Draft. Place-order only lists Active instruments after approval.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={createSubmitting} onClick={() => setCreateOpen(false)} className={`${pill} text-[#aab5c4] disabled:opacity-50`}>Cancel</button>
              <button type="submit" disabled={createSubmitting} className={`${pill} border-[#2f87fa] bg-[#2f87fa] text-white disabled:opacity-50`}>
                {createSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating…</> : 'Create instrument'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
