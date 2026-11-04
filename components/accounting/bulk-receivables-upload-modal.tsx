"use client"

import { useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { accountingApi, type Customer, type AccountingCurrency, type CreateInvoiceRequest, type CreateCustomerRequest } from "@/lib/api/accounting-api"

type Kind = "invoices" | "customers"
type Row = { label: string; line: number; payload: CreateInvoiceRequest | CreateCustomerRequest; errors: string[] }
const invoiceHeaders = ["Invoice Ref", "Customer", "Invoice Date", "Currency", "Description", "Item Description", "Quantity", "Unit Price", "Taxable"]
const customerHeaders = ["Name", "Tax Number", "Contact Person", "Email", "Phone", "Address", "Payment Terms"]
const clean = (value: unknown) => String(value ?? "").trim()
const key = (value: unknown) => clean(value).toLowerCase()
const asDate = (value: unknown) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10)
  if (typeof value === "number") return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
  const parsed = new Date(clean(value))
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10)
}

export function BulkReceivablesUploadModal({ kind, isOpen, onClose, onSuccess, customers = [], currencies = [] }: {
  kind: Kind; isOpen: boolean; onClose: () => void; onSuccess: () => void | Promise<void>
  customers?: Customer[]; currencies?: AccountingCurrency[]
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [filename, setFilename] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<{ label: string; ok: boolean; message: string }[] | null>(null)
  const headers = kind === "invoices" ? invoiceHeaders : customerHeaders
  const ready = rows.filter(row => !row.errors.length)
  const customerMap = useMemo(() => new Map(customers.map(x => [key(x.name), x])), [customers])
  const currencyMap = useMemo(() => new Map(currencies.map(x => [key(x.code), x])), [currencies])
  const reset = () => { setRows([]); setFilename(""); setError(""); setResults(null) }
  const close = () => { if (!busy) { reset(); onClose() } }

  const template = () => {
    const sample = kind === "invoices"
      ? ["INV-HIST-001", customers[0]?.name || "Example Customer", "2026-01-15", currencies[0]?.code || "USD", "Historical sale", "Service", "1", "100", "No"]
      : ["Example Customer", "", "A. Contact", "accounts@example.com", "+263700000000", "Harare", "30"]
    const csv = [headers, sample].map(row => row.map(cell => `"${clean(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a"); a.href = url; a.download = `${kind}-bulk-template.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const read = async (file: File) => {
    setBusy(true); setError(""); setResults(null); setFilename(file.name)
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true })
      const sheet = book.Sheets[book.SheetNames[0]]
      if (!sheet) throw new Error("The file has no sheets.")
      const cells = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false })
      const names = (cells[0] || []).map(key)
      const idx = Object.fromEntries(headers.map(h => [h, names.indexOf(key(h))])) as Record<string, number>
      const required = kind === "invoices" ? ["Invoice Ref", "Customer", "Invoice Date", "Currency", "Item Description", "Quantity", "Unit Price"] : ["Name"]
      const missing = required.filter(h => idx[h] < 0)
      if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}. Use the template headings.`)
      const value = (row: unknown[], h: string) => idx[h] < 0 ? "" : row[idx[h]]
      const output: Row[] = []
      const seen = new Set<string>()
      const groups = new Map<string, Row>()
      for (let i = 1; i < cells.length; i++) {
        const cell = cells[i]
        if (cell.every(x => !clean(x))) continue
        if (kind === "customers") {
          const name = clean(value(cell, "Name")), email = clean(value(cell, "Email")), errors: string[] = []
          if (!name) errors.push("Name is required.")
          if (seen.has(key(name)) || customerMap.has(key(name))) errors.push("Customer name already exists or is repeated in this file.")
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email is invalid.")
          seen.add(key(name))
          output.push({ label: name || `Row ${i + 1}`, line: i + 1, errors, payload: {
            name, taxNumber: clean(value(cell, "Tax Number")) || undefined, contactPerson: clean(value(cell, "Contact Person")) || undefined,
            email: email || undefined, phone: clean(value(cell, "Phone")) || undefined, address: clean(value(cell, "Address")) || undefined,
            paymentTerms: clean(value(cell, "Payment Terms")) || undefined,
          } })
          continue
        }
        const ref = clean(value(cell, "Invoice Ref")), name = clean(value(cell, "Customer")), code = clean(value(cell, "Currency"))
        const customer = customerMap.get(key(name)), currency = currencyMap.get(key(code))
        const date = asDate(value(cell, "Invoice Date")), description = clean(value(cell, "Item Description"))
        const quantity = Number(value(cell, "Quantity")), unitPrice = Number(value(cell, "Unit Price"))
        const errors: string[] = []
        if (!ref) errors.push("Invoice Ref is required.")
        if (!customer) errors.push(`Customer "${name}" was not found.`)
        if (!currency) errors.push(`Currency "${code}" was not found.`)
        if (!date) errors.push("Invoice Date is invalid.")
        if (!description) errors.push("Item Description is required.")
        if (!(quantity > 0)) errors.push("Quantity must be greater than zero.")
        if (!(unitPrice > 0)) errors.push("Unit Price must be greater than zero.")
        const groupKey = ref || `row-${i}`
        let group = groups.get(groupKey)
        if (!group) {
          group = { label: ref || `Row ${i + 1}`, line: i + 1, errors: [], payload: {
            invoiceNumber: ref, customerId: customer?.id || "", currencyId: currency?.id || "", transactionDate: date, invoiceDate: date,
            description: clean(value(cell, "Description")) || ref, amount: 0,
            isTaxable: /^(yes|true|1)$/i.test(clean(value(cell, "Taxable"))), items: [],
          } }
          groups.set(groupKey, group); output.push(group)
        } else {
          const p = group.payload as CreateInvoiceRequest
          if (p.customerId !== customer?.id || p.currencyId !== currency?.id || p.transactionDate !== date) errors.push("Invoice header differs from the first row for this reference.")
        }
        group.errors.push(...errors.map(x => `Row ${i + 1}: ${x}`))
        const payload = group.payload as CreateInvoiceRequest
        payload.items.push({ description, quantity, unitPrice, amount: quantity * unitPrice })
        payload.amount = Math.round(payload.items.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100) / 100
      }
      if (!output.length) throw new Error("No data rows were found.")
      setRows(output)
    } catch (err) { setRows([]); setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const run = async () => {
    if (!ready.length || ready.length !== rows.length) return
    setBusy(true); const done: { label: string; ok: boolean; message: string }[] = []
    for (const row of ready) {
      try {
        const response = kind === "invoices" ? await accountingApi.createInvoice(row.payload as CreateInvoiceRequest) : await accountingApi.createCustomer(row.payload as CreateCustomerRequest)
        done.push({ label: row.label, ok: !!response.success, message: response.success ? (kind === "invoices" ? "Created as draft" : "Created") : response.error || response.message || "Failed" })
      } catch (err) { done.push({ label: row.label, ok: false, message: err instanceof Error ? err.message : String(err) }) }
      setResults([...done])
    }
    setBusy(false)
    toast.success(`${done.filter(x => x.ok).length} of ${done.length} imported`)
    if (done.some(x => x.ok)) await onSuccess()
  }

  return <Dialog open={isOpen} onOpenChange={open => !open && close()}><DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Bulk Upload {kind === "invoices" ? "Sales Invoices" : "Customers"}</DialogTitle><DialogDescription>Import historical {kind} through the existing Accounting API. Invoices are created as drafts with system generated numbers; Invoice Ref groups lines in the file.</DialogDescription></DialogHeader>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><span className="text-sm">1. Choose a CSV or Excel file</span><Button variant="outline" size="sm" onClick={template}><Download className="h-4 w-4 mr-2" />Download template</Button></div>
      <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-7 cursor-pointer hover:bg-blue-50"><FileSpreadsheet className="h-5 w-5" />{filename || "Select .csv, .xlsx or .xls"}<input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void read(file); e.target.value = "" }} /></label>
      {error && <p className="text-sm text-red-700 flex gap-2"><AlertTriangle className="h-4 w-4" />{error}</p>}
      {!!rows.length && <div className="border rounded-xl overflow-hidden"><div className="px-4 py-3 bg-gray-50 text-sm font-medium">2. Preview · {ready.length} of {rows.length} valid</div><div className="max-h-72 overflow-y-auto divide-y">{rows.map((row, i) => <div className="p-3 text-sm" key={i}><div className="flex gap-2 items-center">{row.errors.length ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}<strong>{row.label}</strong><span className="text-gray-500">Row {row.line}</span></div>{row.errors.map((message, j) => <p className="ml-6 text-xs text-red-600" key={j}>{message}</p>)}</div>)}</div></div>}
      {results && <div className="border rounded-xl p-3"><strong className="text-sm">3. Results</strong>{results.map((x, i) => <p key={i} className={`text-sm ${x.ok ? "text-green-700" : "text-red-700"}`}>{x.label}: {x.message}</p>)}</div>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={close}>{results ? "Done" : "Cancel"}</Button>{!results && <Button disabled={busy || !ready.length || ready.length !== rows.length} onClick={() => void run()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${ready.length}`}</Button>}</div>
    </div>
  </DialogContent></Dialog>
}
