'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, ChevronDown, ChevronLeft, ChevronRight, Folder, FolderOpen, Link2, Loader2, Search, SlidersHorizontal, X } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All statuses')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sort, setSort] = useState<'date' | 'amount'>('date')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<TxnRow | null>(null)
  const [notice, setNotice] = useState('')

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

  const loadTransactions = useCallback(async (id: string, fund: FundTab | undefined) => {
    if (!id || !fund) {
      setTransactions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.getPortfolioTransactions(id)
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load transactions')
      const items = unwrapList<Record<string, unknown>>(res.data)
      setTransactions(mapPortfolioTransactions(items, fund))
      setSelected(null)
      setPage(1)
      setType('All')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFunds()
  }, [loadFunds])

  useEffect(() => {
    if (fundId) void loadTransactions(fundId, funds.find((f) => f.id === fundId))
  }, [fundId, funds, loadTransactions])

  const rows = useMemo(
    () =>
      transactions
        .filter((row) => type === 'All' || row.type === type)
        .filter((row) => status === 'All statuses' || row.status === status)
        .filter((row) => !search || `${row.ref} ${row.instrument} ${row.description} ${row.tradeRef}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sort === 'date' ? b.date.localeCompare(a.date) : Math.abs(b.amount) - Math.abs(a.amount))),
    [search, sort, status, transactions, type],
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / 5))
  const pageRows = rows.slice((page - 1) * 5, page * 5)
  const purchases = transactions.filter((row) => row.type === 'Purchase').reduce((sum, row) => sum + Math.abs(row.amount), 0)
  const sales = transactions.filter((row) => row.type === 'Sale').reduce((sum, row) => sum + row.amount, 0)
  const income = transactions
    .filter((row) => row.type === 'Dividend' || row.type === 'Interest')
    .reduce((sum, row) => sum + row.amount, 0)
  const flash = (value: string) => {
    setNotice(`${value} opened locally`)
    window.setTimeout(() => setNotice(''), 1600)
  }

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
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[#8B95A7]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading transactions…
          </div>
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
                {pageRows.map((row) => (
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
          <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#718096]">
            <span>Showing {pageRows.length} of {rows.length} transactions</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronLeft className="h-3.5 w-3.5" /></button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={`${pill} h-8 w-8 px-0 disabled:opacity-30`}><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </footer>
        </section>
      </div>

      {notice && (
        <div className="fixed bottom-5 right-5 z-[80] rounded-full border border-white/10 bg-[#172333] px-4 py-2 text-[11px] shadow-2xl">
          <Check className="mr-2 inline h-3.5 w-3.5 text-emerald-300" />{notice}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onMouseDown={() => setSelected(null)}>
          <aside onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[linear-gradient(145deg,#172333,#0b1420_70%)] p-6 shadow-2xl">
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
                ['Trade record', selected.tradeRef, 'Execution, broker and settlement instructions'],
                ['Valuation record', selected.valuationRef, 'Position valuation generated from this activity'],
                ['Accounting record', selected.journalRef, 'General ledger journal and posting state'],
                ['Document reference', selected.documentRef, 'Source advice, confirmation or supporting file'],
              ].map(([label, value, note]) => (
                <button key={label} type="button" onClick={() => flash(label)} className="flex w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-black/10 p-4 text-left transition hover:border-[#2f87fa]/30 hover:bg-[#2f87fa]/[0.06]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#67778c]">{label}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#8ebcff]">{value}</p>
                    <p className="mt-1 text-[9px] text-[#68778a]">{note}</p>
                  </div>
                  <Link2 className="h-4 w-4 text-[#5d7798]" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
