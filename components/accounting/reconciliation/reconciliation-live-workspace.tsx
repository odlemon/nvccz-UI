"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Download, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AccountingExportControls } from "@/components/accounting/accounting-export-controls"
import { reconciliationApi, type ReconciliationWorkbench } from "@/lib/api/reconciliation-api"
import { chartOfAccountsApi, type ChartOfAccount } from "@/lib/api/chart-of-accounts-api"
import type { CashbookBank } from "@/lib/api/cashbook-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

const day = (value: string | undefined | null) => value ? String(value).slice(0, 10) : ""
const money = (value: number | null | undefined) => value == null ? "—" : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function PagedTable<T>({ title, columns, rows, render, exportRows, currency, loading }: {
  title: string; columns: string[]; rows: T[]; render: (row: T) => React.ReactNode[]; exportRows: (row: T) => (string | number)[]; currency: string; loading?: boolean
}) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query ? rows.filter(row => JSON.stringify(row).toLocaleLowerCase().includes(query)) : rows
  }, [rows, search])
  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, pages)
  const visible = useMemo(() => filtered.slice((current - 1) * size, current * size), [filtered, current, size])
  return <section className="border rounded-lg bg-white overflow-hidden">
    <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between text-xs font-semibold uppercase text-gray-500 tracking-wider">
      <div className="flex flex-wrap items-center gap-3"><span>{title} · {filtered.length}</span><input aria-label={`Search ${title}`} placeholder={`Search ${title.toLowerCase()}…`} className="h-8 min-w-40 rounded border bg-white px-2 text-xs font-normal normal-case tracking-normal" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} /></div>
      <AccountingExportControls label={title} spec={{ title, subtitle: `Bank Reconciliation · ${currency}`, filename: `bank-reconciliation-${title.toLowerCase().replace(/\W+/g, '-')}`, columns, rows: rows.map(exportRows) }} />
    </div>
    {loading ? <div className="p-4 space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div> :
      <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-white">{columns.map((c, i) => <th key={i} className="p-3 text-left font-medium text-gray-600 whitespace-nowrap">{c}</th>)}</tr></thead><tbody>
        {visible.map((row, i) => <tr className="border-b hover:bg-gray-50" key={i}>{render(row).map((cell, j) => <td key={j} className="p-3 align-top">{cell}</td>)}</tr>)}
        {!visible.length && <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500">No rows found.</td></tr>}
      </tbody></table></div>}
    <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t">
      <span>{filtered.length ? `${(current - 1) * size + 1}–${Math.min(current * size, filtered.length)} of ${filtered.length}` : "0 of 0"}</span>
      <div className="flex items-center gap-2"><label>Rows <select className="border rounded p-1" value={size} onChange={e => { setSize(Number(e.target.value)); setPage(1) }}>{[10, 25, 50].map(n => <option key={n}>{n}</option>)}</select></label>
        <button aria-label={`Previous ${title} page`} disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="w-4 h-4" /></button><span>{current} / {pages}</span><button aria-label={`Next ${title} page`} disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="w-4 h-4" /></button></div>
    </div>
  </section>
}

export function ReconciliationLiveWorkspace({ selectedBank, sessionId, onBack }: { selectedBank: CashbookBank | null; sessionId: string | null; onBack: () => void }) {
  const { hasSpecificAction } = useRolePermissions()
  const canReconcile = hasSpecificAction("accounting", "bank_reconciliation")
  const canReopen = hasSpecificAction("accounting", "manage_ledger")
  const [data, setData] = useState<ReconciliationWorkbench | null>(null)
  const [loading, setLoading] = useState(!!sessionId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [matchItem, setMatchItem] = useState<string | null>(null)
  const [bookItem, setBookItem] = useState<string | null>(null)
  const [bookAccount, setBookAccount] = useState("")
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const sequence = useRef(0)
  const previewSequence = useRef(0)
  const currency = data?.bank.currency?.code || "USD"
  const id = data?.session.id || sessionId
  const draft = data?.session.status === "DRAFT"

  const reload = useCallback(async (target: string) => {
    const seq = ++sequence.current
    setLoading(true); setError("")
    try {
      const next = await reconciliationApi.workbench(target)
      if (seq !== sequence.current) return
      setData(next)
    } catch (e) { if (seq === sequence.current) setError(e instanceof Error ? e.message : "Could not load reconciliation.") }
    finally { if (seq === sequence.current) setLoading(false) }
  }, [])
  useEffect(() => { if (sessionId) void reload(sessionId); else { ++sequence.current; setData(null); setLoading(false) } return () => { ++sequence.current } }, [sessionId, reload])
  useEffect(() => { if (bookItem && !accounts.length) void chartOfAccountsApi.getChartOfAccounts({ isActive: true }).then(setAccounts).catch(e => toast.error(e.message)) }, [bookItem, accounts.length])

  const perform = async (action: () => Promise<unknown>, success: string, refresh = true) => {
    if (!id || busy) return false
    setBusy(true)
    try { await action(); toast.success(success); if (refresh) await reload(id); return true }
    catch (e) { toast.error(e instanceof Error ? e.message : "Reconciliation action failed"); return false }
    finally { setBusy(false) }
  }
  const previewFile = async (nextFile: File | null) => {
    const seq = ++previewSequence.current
    setError("")
    if (!nextFile || !selectedBank || (id && (!draft || data?.statement))) return
    setBusy(true); setPreviewLoading(true)
    let targetId = id
    try {
      const statement = await reconciliationApi.previewBankStatement(selectedBank.id, nextFile)
      if (seq !== previewSequence.current) return
      const reference = `Bank statement ${statement.statementDate}`
      if (!targetId) {
        const created = await reconciliationApi.createDraftSession(selectedBank.id, { statementDate: statement.statementDate, statementEndBalance: statement.closingBalance, openingBalance: statement.openingBalance, reference })
        if (!created.data?.id) throw new Error(created.message || "The reconciliation draft was not returned by the server.")
        targetId = created.data.id
        await reload(targetId)
      } else {
        await reconciliationApi.updateDraftSession(targetId, { statementDate: statement.statementDate, statementEndBalance: statement.closingBalance, openingBalance: statement.openingBalance, reference: data?.session.reference || reference })
      }
      await reconciliationApi.importStatement(targetId, nextFile)
      if (seq !== previewSequence.current) return
      await reload(targetId)
      toast.success(`Statement imported · ${statement.lines} lines. Match the statement and cashbook below.`)
    }
    catch (e) {
      if (targetId) await reload(targetId)
      if (seq === previewSequence.current) setError(e instanceof Error ? e.message : "Statement upload failed.")
    }
    finally { if (seq === previewSequence.current) { setBusy(false); setPreviewLoading(false) } }
  }
  const finish = async () => {
    if (!id || !data?.summary.canFinish) return
    if (!window.confirm("Finish this reconciliation? Its cleared entries will be locked through the statement date.")) return
    await perform(() => reconciliationApi.finishSession(id), "Reconciliation finalized")
  }
  const reopen = async () => {
    if (!id) return
    const reason = window.prompt("Reason for reopening this reconciliation")
    if (!reason?.trim()) return
    await perform(() => reconciliationApi.reopen(id, reason), "Reconciliation reopened")
  }
  const discard = async () => {
    if (!id || !window.confirm("Discard this draft reconciliation?")) return
    if (await perform(() => reconciliationApi.discardSession(id), "Draft discarded", false)) onBack()
  }
  const entries = data?.entries || []
  const items = data?.items || []
  return <div className="space-y-4">
    <div className="bg-white border rounded-lg p-4 space-y-4">
      {(!data || (draft && !data.statement)) && <div className="rounded-lg border border-dashed bg-gray-50 p-6">
        <h2 className="text-lg font-medium">Upload a bank statement</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a CSV or Excel statement. The statement date and balances are read from the file automatically.</p>
        {canReconcile && <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{busy ? "Reading statement…" : "Choose statement file"}<input className="sr-only" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" aria-label="Choose bank statement" onChange={e => { const file = e.target.files?.[0] || null; e.currentTarget.value = ""; void previewFile(file) }} disabled={busy || !selectedBank} /></label>
          <a href="/templates/bank-reconciliation-statement-template.csv" download className="inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-gray-50"><Download className="mr-2 h-4 w-4" />Download CSV template</a>
          <a href="/templates/bank-reconciliation-statement-template.xlsx" download className="inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-gray-50"><Download className="mr-2 h-4 w-4" />Download Excel template</a>
        </div>}
      </div>}
      {data?.statement && <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4 text-sm">
        <div><span className="text-muted-foreground">Statement date</span><p className="font-medium">{day(data.session.statementDate)}</p></div>
        <div><span className="text-muted-foreground">Opening balance</span><p className="font-medium">{money(data.summary.openingBalance)}</p></div>
        <div><span className="text-muted-foreground">Statement closing balance</span><p className="font-medium">{money(data.summary.statementEndBalance)}</p></div>
        <div><span className="text-muted-foreground">Status</span><p className="font-medium">{data.session.status === "FINALIZED" ? "Finalized" : data.statement ? "Statement imported" : "Draft"}</p></div>
      </div>}
      {data?.statement && <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">Statement imported · {items.length} lines · Credits {money(data.statement.totalCredits)} · Debits {money(data.statement.totalDebits)} · {items.filter(x => x.matched).length} matched</div>}
      {draft && data?.statement && canReconcile && <div className="flex flex-wrap gap-2 items-center"><Button variant="outline" onClick={() => id && void perform(() => reconciliationApi.autoMatch(id), "Auto-match completed")} disabled={busy}><RefreshCw className="w-4 h-4 mr-2" />Auto-match</Button><span className="text-xs text-gray-500">Search and compare statement lines with posted cashbook entries below. Unmatched bank charges or interest can be booked from a statement row.</span></div>}
    </div>
    {previewLoading && <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">Reading the statement and preparing its reconciliation…</div>}
    {error && <div role="alert" className="p-4 border border-red-200 rounded-lg text-red-700">{error}</div>}
    {loading && <div className="space-y-3">{Array.from({length:7},(_,i)=><Skeleton key={i} className="h-12 w-full" />)}</div>}
    {data && !loading && <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <PagedTable title="Cashbook" currency={currency} columns={["Cleared","Date","Reference","Description","Received","Paid"]} rows={entries} exportRows={x => [x.ticked ? "Yes" : "No",day(x.transactionDate),x.reference || "",x.description,x.received,x.paid]} render={x => [canReconcile ? <input type="checkbox" aria-label={`Clear ${x.reference || x.id}`} checked={x.ticked} disabled={!draft || busy || items.some(i => i.entry?.id === x.id)} onChange={e => id && void perform(() => reconciliationApi.tick(id,x.id,e.target.checked),e.target.checked ? "Entry ticked" : "Entry unticked")} /> : (x.ticked ? "Yes" : "No"),day(x.transactionDate),x.reference || "",x.description,money(x.received),money(x.paid)]} />
      <PagedTable title="Bank statement" currency={currency} columns={["Date","Description","Reference","Money out","Money in","Match","Action"]} rows={items} exportRows={x => [day(x.date),x.description,x.reference || "",x.debit,x.credit,x.entry?.reference || (x.matched ? "Matched" : "Unmatched"),x.matched ? "Matched" : "Unmatched"]} render={x => [day(x.date),x.description,x.reference || "",money(x.debit),money(x.credit),x.entry?.reference || (x.matched ? "Matched" : "Unmatched"),draft && canReconcile ? x.matched ? <Button size="sm" variant="outline" disabled={busy} onClick={() => id && void perform(() => reconciliationApi.unmatch(id,x.id),"Line unmatched")}>Unmatch</Button> : <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setMatchItem(x.id)}>Match</Button><Button size="sm" variant="outline" onClick={() => setBookItem(x.id)}>Book</Button></div> : ""]} />
      </div>
      <div className="bg-white border rounded-lg p-4 text-sm flex flex-wrap justify-between gap-4"><span>Opening {money(data.summary.openingBalance)} + Receipts {money(data.summary.tickedReceipts)} − Payments {money(data.summary.tickedPayments)} = Cleared {money(data.summary.clearedBalance)}</span><strong>Statement {money(data.summary.statementEndBalance)} · Difference {money(data.summary.difference)}</strong></div>
      {!!data.summary.blockers.length && draft && <div className="border rounded-lg p-3 text-sm text-amber-800 bg-amber-50">{data.summary.blockers.map(x => <p key={x}>{x}</p>)}</div>}
    </>}
    {matchItem && data && <div role="dialog" aria-label="Match statement line" className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"><div className="bg-white rounded-lg p-5 w-[520px] max-w-[95vw] space-y-3"><div className="flex justify-between"><strong>Match statement line</strong><button onClick={() => setMatchItem(null)}><X className="w-4 h-4" /></button></div><p className="text-sm">Choose a posted cashbook entry with the same direction and amount.</p><div className="max-h-72 overflow-auto space-y-1">{entries.filter(e => !items.some(i => i.entry?.id === e.id) && e.type === (items.find(i => i.id === matchItem)?.credit ? "RECEIPT" : "PAYMENT") && Math.abs(e.amount - (items.find(i => i.id === matchItem)?.credit || items.find(i => i.id === matchItem)?.debit || 0)) < 0.01).map(e => <button key={e.id} className="w-full border rounded p-2 text-left hover:bg-gray-50" onClick={async () => { if (id && await perform(() => reconciliationApi.match(id,matchItem,e.id),"Line matched")) setMatchItem(null) }}>{day(e.transactionDate)} · {e.reference} · {money(e.amount)}</button>)}</div></div></div>}
    {bookItem && <div role="dialog" aria-label="Book bank-only item" className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"><div className="bg-white rounded-lg p-5 w-[520px] max-w-[95vw] space-y-3"><div className="flex justify-between"><strong>Book bank-only item</strong><button onClick={() => setBookItem(null)}><X className="w-4 h-4" /></button></div><p className="text-sm">This creates and posts a cashbook entry to the selected GL account.</p><select className="w-full border rounded p-2" value={bookAccount} onChange={e => setBookAccount(e.target.value)}><option value="">Select GL account</option>{accounts.filter(x => x.isActive).map(x => <option key={x.id} value={x.id}>{x.accountNo} · {x.accountName}</option>)}</select><Button disabled={!bookAccount || busy} onClick={async () => { if (id && await perform(() => reconciliationApi.book(id,bookItem,bookAccount),"Bank-only item booked")) { setBookItem(null); setBookAccount("") } }}>Book and match</Button></div></div>}
    <div className="flex justify-between bg-white border rounded-lg p-4"><Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back to Sessions</Button><div className="flex gap-2">{draft && canReconcile && data?.statement && <><Button variant="outline" disabled={busy} onClick={discard}>Discard</Button><Button disabled={busy || !data?.summary.canFinish} onClick={finish}><Check className="w-4 h-4 mr-2" />Finish Reconciliation</Button></>}{draft && canReconcile && !data?.statement && <Button variant="outline" disabled={busy} onClick={discard}>Discard</Button>}{data?.session.status === "FINALIZED" && canReopen && <Button variant="outline" onClick={reopen}>Reopen</Button>}</div></div>
  </div>
}
