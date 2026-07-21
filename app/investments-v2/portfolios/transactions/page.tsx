'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, ChevronDown, Folder, FolderOpen, Link2, Search, SlidersHorizontal, X } from 'lucide-react'
import { OpsKpiSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { DetailPanel } from '@/components/investments-v2/ui/detail-panel'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'
import { investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import {
  formatMoneyDisplay,
  mapFundTabs,
  mapPortfolioTransactions,
  type FundTab,
  type TxnRow,
} from '@/lib/investments-v2/adapters/portfolio-adapter'

const card = 'rounded-[24px] border border-white/[0.06] bg-[linear-gradient(135deg,#172333_0%,#101a29_58%,#0b1420_100%)] shadow-[0_20px_60px_rgba(0,0,0,.2)]'
const pill = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] font-medium transition hover:border-white/20 hover:bg-white/[0.06]'
const PAGE_SIZE = 5
const typeTone: Record<string, string> = {
  Purchase: 'bg-emerald-400/10 text-emerald-300',
  Sale: 'bg-rose-400/10 text-rose-300',
  Dividend: 'bg-violet-400/10 text-violet-300',
  Interest: 'bg-sky-400/10 text-sky-300',
  'Corporate Action': 'bg-amber-400/10 text-amber-300',
  Fee: 'bg-orange-400/10 text-orange-300',
  'Manual Adjustment': 'bg-fuchsia-400/10 text-fuchsia-300',
}

export default function TransactionsPage() {
  const [funds, setFunds] = useState<FundTab[]>([])
  const [fundId, setFundId] = useState('')
  const [transactions, setTransactions] = useState<TxnRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All statuses')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sort, setSort] = useState<'date' | 'amount'>('date')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<TxnRow | null>(null)

  const activeFund = funds.find((f) => f.id === fundId) ?? funds[0]
  const portfolioName = activeFund?.name ?? 'Portfolio'

  const types = useMemo(() => {
    const set = new Set(transactions.map((row) => row.type))
    return ['All', ...Array.from(set)]
  }, [transactions])

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

  const loadTransactions = useCallback(async (id: string, fund: FundTab | undefined, pageNum = 1) => {
    if (!id || !fund) {
      setTransactions([])
      setTotalRows(0)
      setTotalPages(1)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.getPortfolioTransactions(id, {
        page: pageNum,
        pageSize: PAGE_SIZE,
        ...(status !== 'All statuses' ? { status: status.toUpperCase() } : {}),
        ...(type !== 'All' ? { type: type.toUpperCase().replace(/\s+/g, '_') } : {}),
      })
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load transactions')

      const payload = res.data
      let items: Record<string, unknown>[] = []
      if (Array.isArray(payload)) {
        items = payload as Record<string, unknown>[]
        setTotalRows(items.length)
        setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)))
      } else if (payload && typeof payload === 'object') {
        const envelope = payload as { items?: unknown[]; total?: number; totalPages?: number; page?: number }
        items = unwrapList<Record<string, unknown>>(payload)
        setTotalRows(Number(envelope.total ?? items.length))
        setTotalPages(Math.max(1, Number(envelope.totalPages ?? Math.ceil((envelope.total ?? items.length) / PAGE_SIZE))))
      }

      setTransactions(mapPortfolioTransactions(items, fund))
      setSelected(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions')
      setTransactions([])
      setTotalRows(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [status, type])

  useEffect(() => {
    void loadFunds()
  }, [loadFunds])

  useEffect(() => {
    if (fundId) void loadTransactions(fundId, funds.find((f) => f.id === fundId), page)
  }, [fundId, funds, loadTransactions, page])

  const rows = useMemo(
    () =>
      transactions
        .filter((row) => !search || `${row.ref} ${row.instrument} ${row.description} ${row.tradeRef}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sort === 'date' ? b.date.localeCompare(a.date) : Math.abs(b.amount) - Math.abs(a.amount))),
    [search, sort, transactions],
  )
  const pageRows = rows
  const purchases = transactions.filter((row) => row.type === 'Purchase').reduce((sum, row) => sum + Math.abs(row.amount), 0)
  const sales = transactions.filter((row) => row.type === 'Sale').reduce((sum, row) => sum + row.amount, 0)
  const income = transactions
    .filter((row) => row.type === 'Dividend' || row.type === 'Interest')
    .reduce((sum, row) => sum + row.amount, 0)

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#edf3fa] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="px-1">
          <p className="text-[10px] uppercase tracking-[.24em] text-[#65758b]">Portfolio market</p>
          <h1 className="mt-1 text-xl font-semibold">Transactions</h1>
          <p className="mt-1 text-[11px] text-[#77869a]">Portfolio activity with linked trade, valuation and accounting records.</p>
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

        {loading && transactions.length === 0 && funds.length === 0 ? (
          <OpsKpiSkeleton count={4} />
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Transactions', transactions.length],
              ['Purchases', transactions.length ? `$${formatMoneyDisplay(purchases, 0)}` : '—'],
              ['Sales', transactions.length ? `$${formatMoneyDisplay(sales, 0)}` : '—'],
              ['Income received', transactions.length ? `$${formatMoneyDisplay(income, 0)}` : '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className={`${card} px-5 py-4`}>
                <p className="text-[9px] uppercase tracking-[.16em] text-[#718096]">{label}</p>
                <p className="mt-2 font-mono text-xl font-semibold">{value}</p>
              </div>
            ))}
          </section>
        )}

        <section className={`${card} overflow-visible`}>
          <div className="border-b border-white/[0.07] p-4">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {types.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setType(item); setPage(1) }}
                  className={`${pill} h-8 shrink-0 px-3 ${type === item ? 'border-[#2f87fa]/60 bg-[#2f87fa]/15 text-white' : 'text-[#8997a9]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold">{portfolioName} activity</p>
                <p className="mt-1 text-[9px] text-[#6f7e92]">Settlement and accounting status shown at record level.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#0b1420] px-4 text-[#7c8a9e]">
                  <Search className="h-3.5 w-3.5" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search reference or instrument" className="w-full bg-transparent text-[11px] text-white outline-none" />
                </label>
                <button type="button" onClick={() => { setSort((value) => (value === 'date' ? 'amount' : 'date')); setPage(1) }} className={`${pill} text-[#aeb8c7]`}>
                  <ArrowDownUp className="h-3.5 w-3.5" />{sort === 'date' ? 'Newest first' : 'Largest amount'}
                </button>
                <div className="relative">
                  <button type="button" onClick={() => setFilterOpen((v) => !v)} className={`${pill} text-[#aeb8c7]`}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />{status}<ChevronDown className="h-3 w-3" />
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111b29] p-2 shadow-2xl">
                      {['All statuses', 'Posted', 'Pending', 'Reversed'].map((item) => (
                        <button key={item} type="button" onClick={() => { setStatus(item); setPage(1); setFilterOpen(false) }} className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[10px] ${status === item ? 'bg-[#2f87fa] text-white' : 'text-[#9aa8ba] hover:bg-white/[0.06]'}`}>
                          {item}{status === item && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-[10px]">
              <thead className="text-[#6f7e92]">
                <tr>
                  {['Transaction', 'Date', 'Type', 'Instrument', 'Quantity', 'Price', 'Net amount', 'Currency', 'Status', 'Linked records'].map((head) => (
                    <th key={head} className={`border-b border-white/[0.06] px-4 py-3 font-medium ${['Quantity', 'Price', 'Net amount'].includes(head) ? 'text-right' : ''}`}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="p-0">
                      <OpsTableSkeleton rows={8} cols={10} />
                    </td>
                  </tr>
                )}
                {!loading && pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className={`cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.035] ${selected?.id === row.id ? 'bg-[#2f87fa]/10' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-[#70adff]">{row.ref}</td>
                    <td className="px-4 py-3 font-mono text-[#7d8b9e]">{row.date}</td>
                    <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] ${typeTone[row.type] ?? 'bg-white/[.06] text-[#9aa8ba]'}`}>{row.type}</span></td>
                    <td className="px-4 py-3"><p className="font-semibold text-white">{row.instrument}</p><p className="mt-1 text-[9px] text-[#78879a]">{row.description}</p></td>
                    <td className="px-4 py-3 text-right font-mono">{row.quantity?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#a6b1c0]">{row.price?.toFixed(4) ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${row.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{row.amount >= 0 ? '+' : ''}{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono">{row.currency}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] ${row.status === 'Posted' ? 'bg-emerald-400/10 text-emerald-300' : row.status === 'Pending' ? 'bg-amber-400/10 text-amber-300' : 'bg-rose-400/10 text-rose-300'}`}>{row.status}</span></td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelected(row) }} className={`${pill} h-7 px-3 text-[#8ebcff]`}>
                        <Link2 className="h-3 w-3" />View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-14 text-center text-[11px] text-[#6f7e92]">
                      No transactions returned from the API.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            rowsShown={pageRows.length}
            totalRows={totalRows}
            pageSize={PAGE_SIZE}
          />
        </section>
      </div>

      <DetailPanel open={Boolean(selected)} onClose={() => setSelected(null)} width="max-w-xl">
        {selected && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[.2em] text-[#64758b]">Linked record</p>
                <h2 className="mt-2 text-lg font-semibold">{selected.ref}</h2>
                <p className="mt-1 text-[10px] text-[#718096]">{selected.description}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className={`${pill} h-9 w-9 px-0`}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['Net amount', `${selected.amount >= 0 ? '+' : ''}${selected.amount.toLocaleString()} ${selected.currency}`],
                ['Status', selected.status],
                ['Transaction type', selected.type],
                ['Effective date', selected.date],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-white/[0.07] bg-black/10 p-4">
                  <p className="text-[9px] uppercase tracking-wider text-[#66768b]">{label}</p>
                  <p className="mt-2 text-[11px]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['Trade record', selected.tradeId || selected.tradeRef, 'Execution, broker and settlement instructions'],
                ['Order', selected.orderId || '—', 'Source order id when linked'],
                ['Valuation record', selected.valuationRunId || selected.valuationRef, 'Position valuation generated from this activity'],
                ['Accounting record', selected.journalEntryId || selected.journalRef, 'General ledger journal and posting state'],
                ['Document reference', selected.documentId || selected.documentRef, 'Source advice, confirmation or supporting file'],
              ].map(([label, value, note]) => (
                <div key={label} className="flex w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-black/10 p-4 text-left">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#67778c]">{label}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#8ebcff]">{value || '—'}</p>
                    <p className="mt-1 text-[9px] text-[#68778a]">{note}</p>
                    {(!value || value === '—') && (
                      <p className="mt-1 text-[9px] text-amber-200/70">No linked id returned by the transactions API.</p>
                    )}
                  </div>
                  <Link2 className="h-4 w-4 text-[#5d7798]" />
                </div>
              ))}
            </div>
          </>
        )}
      </DetailPanel>
    </main>
  )
}
