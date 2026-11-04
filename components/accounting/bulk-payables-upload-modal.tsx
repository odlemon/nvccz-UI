"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { accountingApi, type AccountingCurrency, type CreatePurchaseInvoiceRequest, type Vendor } from "@/lib/api/accounting-api"

type ImportKind = "invoices" | "vendors"
type Preview = { key: string; row: number; payload: any; errors: string[]; summary: string }
type ImportResult = { key: string; ok: boolean; message: string }

const invoiceHeaders = ["Invoice Ref", "Vendor", "Vendor Invoice Ref", "Invoice Date", "Due Date", "Currency", "Description", "Item Name", "Item Description", "Quantity", "Unit Price", "Unit", "Taxable", "VAT Rate", "Notes"]
const vendorHeaders = ["Name", "Tax Number", "Contact Person", "Email", "Phone", "Address", "Payment Terms"]
const invoiceSample = [
  ["BILL-001", "Example Supplies", "SUP-001", "2026-01-15", "2026-02-14", "USD", "Office supplies", "Paper", "A4 paper", "2", "12.50", "pack", "No", "0", "Historical invoice"],
  ["BILL-001", "Example Supplies", "SUP-001", "2026-01-15", "2026-02-14", "USD", "Office supplies", "Pens", "Blue pens", "10", "1.20", "each", "No", "0", "Historical invoice"],
]
const vendorSample = [["Example Supplies", "", "A. Contact", "accounts@example.com", "+263700000000", "Harare", "Net 30"]]
const clean = (value: unknown) => value == null ? "" : String(value).trim()
const key = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, "")
const date = (value: unknown) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : format(value, "yyyy-MM-dd")
  if (typeof value === "number") return format(new Date(Math.round((value - 25569) * 86400 * 1000)), "yyyy-MM-dd")
  const parsed = new Date(clean(value))
  return Number.isNaN(parsed.getTime()) ? "" : format(parsed, "yyyy-MM-dd")
}
const amount = (value: unknown) => Number(clean(value).replace(/,/g, ""))

export function BulkPayablesUploadModal({ kind, isOpen, onClose, onSuccess, vendors = [], currencies = [] }: {
  kind: ImportKind
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void | Promise<void>
  vendors?: Vendor[]
  currencies?: AccountingCurrency[]
}) {
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<Preview[]>([])
  const [parseError, setParseError] = useState("")
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const isInvoice = kind === "invoices"
  const title = isInvoice ? "Bulk Upload Purchase Invoices" : "Bulk Upload Vendors"
  const headers = isInvoice ? invoiceHeaders : vendorHeaders
  const samples = isInvoice ? invoiceSample : vendorSample

  const vendorByName = useMemo(() => new Map(vendors.map(vendor => [key(vendor.name), vendor])), [vendors])
  const currencyByCode = useMemo(() => new Map(currencies.map(currency => [key(currency.code), currency])), [currencies])
  const ready = preview.filter(item => item.errors.length === 0)

  const reset = () => { setFileName(""); setPreview([]); setParseError(""); setResults(null) }
  const close = () => { if (importing) return; reset(); onClose() }

  const downloadTemplate = () => {
    const rows = [headers, ...samples]
    const csv = rows.map(row => row.map(cell => `"${clean(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = isInvoice ? "purchase-invoice-bulk-template.csv" : "vendor-bulk-template.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const readFile = async (file: File) => {
    setParsing(true); setParseError(""); setResults(null); setFileName(file.name)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error("The file has no sheets.")
      const cells = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" })
      if (cells.length < 2) throw new Error("The first sheet has no data rows.")
      const names = (cells[0] as unknown[]).map(key)
      const index = Object.fromEntries(headers.map(header => [header, names.indexOf(key(header))])) as Record<string, number>
      const required = isInvoice ? ["Invoice Ref", "Vendor", "Invoice Date", "Currency", "Item Name", "Quantity", "Unit Price"] : ["Name"]
      const missing = required.filter(header => index[header] < 0)
      if (missing.length) throw new Error(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Use the template for exact headings.`)
      const get = (row: unknown[], header: string) => index[header] < 0 ? "" : row[index[header]]
      const seenVendorNames = new Set<string>()
      const items: Preview[] = []
      const invoiceGroups = new Map<string, Preview>()
      for (let i = 1; i < cells.length; i++) {
        const row = cells[i] as unknown[]
        if (row.every(value => !clean(value))) continue
        if (!isInvoice) {
          const name = clean(get(row, "Name"))
          const email = clean(get(row, "Email"))
          const errors: string[] = []
          if (!name) errors.push("Vendor name is required.")
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email format is invalid.")
          if (seenVendorNames.has(key(name))) errors.push("Vendor name is repeated in this file.")
          if (vendorByName.has(key(name))) errors.push("An active vendor with this name already exists.")
          seenVendorNames.add(key(name))
          items.push({ key: name || `Row ${i + 1}`, row: i + 1, errors, summary: email || clean(get(row, "Contact Person")), payload: {
            name, taxNumber: clean(get(row, "Tax Number")) || undefined, contactPerson: clean(get(row, "Contact Person")) || undefined,
            email: email || undefined, phone: clean(get(row, "Phone")) || undefined, address: clean(get(row, "Address")) || undefined,
            paymentTerms: clean(get(row, "Payment Terms")) || undefined,
          } })
          continue
        }
        const ref = clean(get(row, "Invoice Ref"))
        const vendorName = clean(get(row, "Vendor"))
        const vendor = vendorByName.get(key(vendorName)) || vendors.find(item => item.id === vendorName)
        const currencyRaw = clean(get(row, "Currency"))
        const currency = currencyByCode.get(key(currencyRaw)) || currencies.find(item => item.id === currencyRaw)
        const invoiceDate = date(get(row, "Invoice Date"))
        const dueDate = clean(get(row, "Due Date")) ? date(get(row, "Due Date")) : invoiceDate
        const quantity = amount(get(row, "Quantity"))
        const unitPrice = amount(get(row, "Unit Price"))
        const taxable = /^(yes|true|1)$/i.test(clean(get(row, "Taxable")))
        const rawRate = clean(get(row, "VAT Rate"))
        const parsedRate = rawRate.endsWith("%") ? amount(rawRate.slice(0, -1)) / 100 : amount(rawRate)
        const vatRate = parsedRate > 1 ? parsedRate / 100 : parsedRate
        const errors: string[] = []
        if (!ref) errors.push("Invoice Ref is required to group lines.")
        if (!vendor) errors.push(`Vendor "${vendorName || "(blank)"}" was not found in the active vendor list.`)
        if (!currency) errors.push(`Currency "${currencyRaw || "(blank)"}" was not found.`)
        if (!invoiceDate) errors.push("Invoice Date is invalid.")
        if (!dueDate) errors.push("Due Date is invalid.")
        if (!clean(get(row, "Item Name"))) errors.push("Item Name is required.")
        if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Quantity must be greater than zero.")
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) errors.push("Unit Price must be greater than zero.")
        if (taxable && (!rawRate || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 1)) errors.push("Taxable rows need a VAT Rate between 0 and 1 (or 0–100%).")
        const groupKey = ref || `__row${i}`
        let group = invoiceGroups.get(groupKey)
        const vendorInvoiceReference = clean(get(row, "Vendor Invoice Ref")) || ref
        if (!group) {
          group = { key: ref || `Row ${i + 1}`, row: i + 1, errors: [], summary: vendorName, payload: {
            vendorId: vendor?.id || "", invoiceDate, dueDate, currencyId: currency?.id || "",
            description: clean(get(row, "Description")) || ref, vendorInvoiceReference,
            isTaxable: taxable, notes: clean(get(row, "Notes")) || undefined, items: [],
          } satisfies CreatePurchaseInvoiceRequest }
          invoiceGroups.set(groupKey, group)
          items.push(group)
        } else if (group.payload.vendorId !== (vendor?.id || "") || group.payload.currencyId !== (currency?.id || "") || group.payload.invoiceDate !== invoiceDate || group.payload.vendorInvoiceReference !== vendorInvoiceReference) {
          group.errors.push(`Row ${i + 1}: invoice header differs from the first row for this reference.`)
        }
        group.errors.push(...errors.map(error => `Row ${i + 1}: ${error}`))
        group.payload.items.push({ itemName: clean(get(row, "Item Name")), description: clean(get(row, "Item Description")) || clean(get(row, "Item Name")), quantity, unitPrice, unit: clean(get(row, "Unit")) || "each", vatRate: taxable ? vatRate : 0 })
      }
      if (!items.length) throw new Error("No import rows were found below the header.")
      setPreview(items)
    } catch (error) {
      setPreview([])
      setParseError(error instanceof Error ? error.message : String(error))
    } finally {
      setParsing(false)
    }
  }

  const runImport = async () => {
    if (!ready.length) return
    setImporting(true); setResults(null)
    const completed: ImportResult[] = []
    for (const item of ready) {
      try {
        const response = isInvoice ? await accountingApi.createPurchaseInvoice(item.payload) : await accountingApi.createVendor(item.payload)
        completed.push({ key: item.key, ok: !!response.success, message: response.success ? "Created as a draft" : response.error || response.message || "Failed" })
      } catch (error) {
        completed.push({ key: item.key, ok: false, message: error instanceof Error ? error.message : String(error) })
      }
      setResults([...completed])
    }
    const successCount = completed.filter(item => item.ok).length
    setImporting(false)
    toast.success(`${successCount} of ${completed.length} ${isInvoice ? "invoices" : "vendors"} imported`)
    if (successCount) await onSuccess()
  }

  return <Dialog open={isOpen} onOpenChange={open => !open && close()}>
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 px-6 -mt-6 pt-6 flex-shrink-0">
        <DialogTitle className="flex items-center gap-3 text-xl"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Upload className="w-5 h-5 text-white" /></div><div><span>{title}</span><p className="text-sm font-normal text-gray-600 mt-1">Import historical {isInvoice ? "invoices" : "vendors"} from a CSV or Excel file</p></div></DialogTitle>
        <DialogDescription className="sr-only">Upload a spreadsheet, review validation, and import the valid records.</DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto px-1 min-h-0 space-y-5 py-4">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-blue-800">1. Choose a file</h3><p className="text-xs text-gray-600 mt-1">{isInvoice ? "One row per invoice line. Rows sharing an Invoice Ref become one draft invoice. Vendor and currency must already exist." : "One row per vendor. Imported vendors enter the normal draft approval workflow."}</p></div><Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="rounded-full h-9"><Download className="w-4 h-4 mr-2" />Download template</Button></div>
          <label className="mt-4 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-white/70 px-6 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"><FileSpreadsheet className="w-6 h-6 text-blue-500" /><span className="text-sm text-gray-700">{fileName ? <strong>{fileName}</strong> : "Click to select a .csv, .xlsx or .xls file"}</span><input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = "" }} disabled={parsing || importing} /></label>
          <div className="mt-3 overflow-x-auto rounded-lg bg-gray-50 border border-gray-100"><table className="w-full text-xs"><thead><tr className="text-left text-gray-500">{headers.map(header => <th key={header} className="px-3 py-2 font-medium whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="text-gray-700">{samples.map((row, i) => <tr key={i} className="border-t border-gray-100">{row.map((cell, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{cell || <span className="text-gray-300">—</span>}</td>)}</tr>)}</tbody></table></div>
        </div>
        {parsing && <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="w-4 h-4 animate-spin" />Reading file…</div>}
        {parseError && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{parseError}</div>}
        {!parsing && preview.length > 0 && <div className="rounded-xl border border-gray-200"><div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 px-5 py-3"><h3 className="text-sm font-semibold text-gray-800">2. Review {preview.length} {isInvoice ? "invoice" : "vendor"}{preview.length === 1 ? "" : "s"}</h3><div className="flex items-center gap-2 text-xs"><Badge className="bg-green-100 text-green-800">{ready.length} ready</Badge>{preview.length > ready.length && <Badge className="bg-red-100 text-red-800">{preview.length - ready.length} with errors</Badge>}</div></div><div className="max-h-[42vh] overflow-y-auto divide-y divide-gray-100">{preview.map((item, i) => <div key={`${item.key}-${i}`} className="px-5 py-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><span className="font-mono text-sm font-semibold text-blue-700 truncate">{item.key}</span><p className="text-xs text-gray-600 truncate">Row {item.row} · {item.summary}{isInvoice ? ` · ${item.payload.items.length} line${item.payload.items.length === 1 ? "" : "s"}` : ""}</p></div>{item.errors.length ? <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 shrink-0"><AlertTriangle className="w-3 h-3 mr-1" />{item.errors.length} issue{item.errors.length === 1 ? "" : "s"}</Badge> : <Badge className="bg-green-100 text-green-800 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>}</div>{item.errors.length > 0 && <ul className="mt-2 space-y-0.5">{item.errors.map((error, j) => <li key={j} className="text-xs text-red-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{error}</li>)}</ul>}</div>)}</div></div>}
        {results && <div className="rounded-xl border border-gray-200"><div className="border-b bg-gray-50 px-5 py-3"><h3 className="text-sm font-semibold text-gray-800">3. Import results</h3></div><div className="max-h-[30vh] overflow-y-auto divide-y divide-gray-100">{results.map((item, i) => <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"><span className="font-mono text-gray-700 truncate">{item.key}</span><span className={item.ok ? "flex items-center gap-1.5 text-green-700" : "flex items-center gap-1.5 text-red-600"}>{item.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{item.message}</span></div>)}</div></div>}
      </div>
      <div className="flex items-center justify-between gap-3 pt-4 border-t flex-shrink-0"><div className="text-xs text-gray-500">{preview.length ? `${ready.length} of ${preview.length} ready to import` : "No file loaded yet"}</div><div className="flex items-center gap-3">{preview.length > 0 && !results && <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={importing} className="rounded-full text-gray-500"><Trash2 className="w-4 h-4 mr-2" />Clear</Button>}<Button type="button" variant="outline" onClick={close} disabled={importing} className="rounded-full h-10 px-6">{results ? "Done" : "Cancel"}</Button>{!results && <Button type="button" onClick={() => void runImport()} disabled={importing || !ready.length} variant="gradient-create" className="rounded-full h-10 px-6">{importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</> : <><Plus className="w-4 h-4 mr-2" />Import {ready.length} {isInvoice ? "invoice" : "vendor"}{ready.length === 1 ? "" : "s"}</>}</Button>}</div></div>
    </DialogContent>
  </Dialog>
}
