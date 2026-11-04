"use client"

/**
 * Bulk journal-entry upload for the General Ledger.
 *
 * A preparer drops a CSV or Excel workbook, every row is read and grouped into journals by reference, the whole batch is
 * validated against the live chart of accounts and currency list, and only the journals that pass are posted — each one
 * through the same `POST /accounting/journal-entries` endpoint the "New Journal Entry" form uses, so a bulk import is
 * indistinguishable from typing them one by one. Nothing is sent until the operator reviews the preview.
 */

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileSpreadsheet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCurrencies, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import { accountingApi } from "@/lib/api/accounting-api"
import { cn } from "@/lib/utils"

interface BulkJournalUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/** One journal line as read from the file, before account/currency resolution. */
interface RawLine {
  accountNo: string
  lineDescription: string
  debit: number
  credit: number
  row: number
}

/** A journal assembled from the file plus its validation outcome. */
interface ParsedJournal {
  key: string
  reference: string
  date: string
  description: string
  currencyRaw: string
  lines: RawLine[]
  errors: string[]
}

/** A journal that passed validation, ready to POST. */
interface ValidJournal {
  reference: string
  payload: {
    transactionDate: string
    referenceNumber: string
    description: string
    currencyId: string
    exchangeRate: number
    journalEntryLines: { chartOfAccountId: string; description: string; debitAmount: number; creditAmount: number }[]
  }
}

interface ImportResult {
  reference: string
  ok: boolean
  message: string
}

const TEMPLATE_HEADERS = [
  "Journal Ref",
  "Date",
  "Description",
  "Currency",
  "Account No",
  "Line Description",
  "Debit",
  "Credit",
]

const TEMPLATE_SAMPLE = [
  ["JE-BULK-0001", "2026-01-31", "Monthly accrual", "USD", "6100", "Utilities accrual", "1250.00", ""],
  ["JE-BULK-0001", "2026-01-31", "Monthly accrual", "USD", "2100", "Accrued utilities", "", "1250.00"],
]

// Map the incoming header names (loosely, so a hand-built sheet still works) onto our fields.
const HEADER_ALIASES: Record<keyof typeof COLUMN_KEY, string[]> = {
  ref: ["journal ref", "journal reference", "reference", "reference number", "ref", "ref no", "ref no."],
  date: ["date", "transaction date", "posting date"],
  description: ["description", "journal description", "narration"],
  currency: ["currency", "currency code", "ccy"],
  accountNo: ["account no", "account number", "account", "gl account", "account code"],
  lineDescription: ["line description", "line", "memo", "detail"],
  debit: ["debit", "debit amount", "dr", "dr amount"],
  credit: ["credit", "credit amount", "cr", "cr amount"],
} as any

const COLUMN_KEY = {
  ref: "ref",
  date: "date",
  description: "description",
  currency: "currency",
  accountNo: "accountNo",
  lineDescription: "lineDescription",
  debit: "debit",
  credit: "credit",
} as const

const clean = (v: any): string => (v === null || v === undefined ? "" : String(v).trim())

const cleanAmount = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0
  if (typeof v === "number") return v
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""))
  return isNaN(n) ? 0 : n
}

/** Accepts a Date cell, an Excel serial, or a text date and returns yyyy-MM-dd (or "" when unparseable). */
function toISODate(v: any): string {
  if (v === null || v === undefined || v === "") return ""
  if (v instanceof Date && !isNaN(v.getTime())) return format(v, "yyyy-MM-dd")
  if (typeof v === "number") {
    // Excel serial day count from the 1899-12-30 epoch
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd")
  }
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd")
}

export function BulkJournalUploadModal({ isOpen, onClose, onSuccess }: BulkJournalUploadModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { currencies = [], chartOfAccounts = [] } = useSelector((state: RootState) => state.accounting)

  const [fileName, setFileName] = useState("")
  const [journals, setJournals] = useState<ParsedJournal[]>([])
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCurrencies())
      dispatch(fetchChartOfAccounts({ isActive: true }))
    }
  }, [isOpen, dispatch])

  const reset = () => {
    setFileName("")
    setJournals([])
    setParseError("")
    setResults(null)
  }

  const handleClose = () => {
    if (importing) return
    reset()
    onClose()
  }

  // accountNo (string, trimmed) → the backend id the journal line needs
  const accountByNo = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>()
    for (const a of chartOfAccounts) m.set(clean(a.accountNo), { id: a.id, name: clean(a.accountName) })
    return m
  }, [chartOfAccounts])

  // currency code (upper) → id; blank in the file falls back to the default currency
  const currencyByCode = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of currencies) m.set(clean(c.code).toUpperCase(), c.id)
    return m
  }, [currencies])

  const defaultCurrencyId = useMemo(() => {
    const def = currencies.find((c: any) => c.isDefault) || currencies[0]
    return def ? def.id : ""
  }, [currencies])

  const handleFile = async (file: File) => {
    setParsing(true)
    setParseError("")
    setResults(null)
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array", cellDates: true })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) throw new Error("The file has no sheets.")
      const aoa: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: "" })
      if (!aoa.length) throw new Error("The first sheet is empty.")

      const headerRow = (aoa[0] || []).map((h) => clean(h).toLowerCase())
      const idx: Partial<Record<keyof typeof COLUMN_KEY, number>> = {}
      for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
        idx[key as keyof typeof COLUMN_KEY] = headerRow.findIndex((h) => (aliases as string[]).includes(h))
      }
      const missing = (["ref", "date", "accountNo", "debit", "credit"] as const).filter((k) => idx[k] === -1 || idx[k] === undefined)
      if (missing.length) {
        throw new Error(`Could not find column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Use the template for the exact headings.`)
      }

      const get = (row: any[], k: keyof typeof COLUMN_KEY) => {
        const i = idx[k]
        return i === undefined ? "" : row[i]
      }

      // Group consecutive rows by reference into journals, preserving first-seen order.
      const order: string[] = []
      const byRef = new Map<string, ParsedJournal>()
      for (let r = 1; r < aoa.length; r++) {
        const row = aoa[r]
        const ref = clean(get(row, "ref"))
        const accountNo = clean(get(row, "accountNo"))
        const debit = cleanAmount(get(row, "debit"))
        const credit = cleanAmount(get(row, "credit"))
        if (!ref && !accountNo && !debit && !credit) continue // fully blank row
        if (!ref) {
          if (!byRef.has("__noref__")) {
            order.push("__noref__")
            byRef.set("__noref__", { key: "__noref__", reference: "", date: "", description: "", currencyRaw: "", lines: [], errors: [] })
          }
        }
        const key = ref || "__noref__"
        let j = byRef.get(key)
        if (!j) {
          j = { key, reference: ref, date: toISODate(get(row, "date")), description: clean(get(row, "description")), currencyRaw: clean(get(row, "currency")), lines: [], errors: [] }
          byRef.set(key, j)
          order.push(key)
        }
        j.lines.push({ accountNo, lineDescription: clean(get(row, "lineDescription")), debit, credit, row: r + 1 })
      }

      const parsed = order.map((k) => byRef.get(k)!).filter((j) => j.lines.length)
      if (!parsed.length) throw new Error("No journal rows were found below the header.")
      setJournals(parsed)
    } catch (e: any) {
      setJournals([])
      setParseError(e?.message || String(e))
    } finally {
      setParsing(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = "" // allow re-picking the same file
  }

  // Validation runs live so the preview and the "Import" count stay in step with the loaded accounts/currencies.
  const validated = useMemo(() => {
    return journals.map((j) => {
      const errors: string[] = []
      if (!j.reference) errors.push("Every row needs a Journal Ref to group it into a journal.")
      if (!j.date) errors.push("Add a valid Date (yyyy-mm-dd) on every row.")
      else if (j.date > format(new Date(), "yyyy-MM-dd")) errors.push("The date cannot be in the future.")
      if (!j.description) errors.push("Description is required.")

      let currencyId = ""
      if (j.currencyRaw) {
        currencyId = currencyByCode.get(j.currencyRaw.toUpperCase()) || ""
        if (!currencyId) errors.push(`Unknown currency "${j.currencyRaw}".`)
      } else {
        currencyId = defaultCurrencyId
        if (!currencyId) errors.push("No currencies are set up to default to.")
      }

      if (j.lines.length < 2) errors.push("A journal needs at least two lines.")
      let dr = 0
      let cr = 0
      const resolvedLines = j.lines.map((l) => {
        const acc = accountByNo.get(l.accountNo)
        if (!acc) errors.push(`Row ${l.row}: account "${l.accountNo || "(blank)"}" is not in the chart of accounts.`)
        if (l.debit && l.credit) errors.push(`Row ${l.row}: a line is either a debit or a credit, not both.`)
        if (!l.debit && !l.credit) errors.push(`Row ${l.row}: the line has no amount.`)
        if (l.debit < 0 || l.credit < 0) errors.push(`Row ${l.row}: amounts cannot be negative.`)
        dr += l.debit
        cr += l.credit
        return acc ? { chartOfAccountId: acc.id, description: l.lineDescription, debitAmount: l.debit, creditAmount: l.credit } : null
      })

      if (Math.round((dr - cr) * 100) !== 0) errors.push(`Debits (${dr.toFixed(2)}) and credits (${cr.toFixed(2)}) do not balance.`)

      const unique = Array.from(new Set(errors))
      const valid = unique.length === 0 && resolvedLines.every(Boolean)
      const payload: ValidJournal | null = valid
        ? {
            reference: j.reference,
            payload: {
              transactionDate: j.date,
              referenceNumber: j.reference,
              description: j.description,
              currencyId,
              exchangeRate: 1,
              journalEntryLines: resolvedLines as ValidJournal["payload"]["journalEntryLines"],
            },
          }
        : null
      return { journal: j, errors: unique, payload }
    })
  }, [journals, accountByNo, currencyByCode, defaultCurrencyId])

  const validJournals = validated.filter((v) => v.payload).map((v) => v.payload as ValidJournal)
  const invalidCount = validated.length - validJournals.length

  const downloadTemplate = () => {
    const rows = [TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "journal-bulk-upload-template.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const runImport = async () => {
    if (!validJournals.length) return
    setImporting(true)
    setResults(null)
    const collected: ImportResult[] = []
    // Sequential so a server-side sequence/reference clash on one journal cannot race the next.
    for (const v of validJournals) {
      try {
        const res = await accountingApi.createJournalEntry(v.payload)
        collected.push({ reference: v.reference, ok: !!res.success, message: res.success ? "Created as a draft" : res.error || res.message || "Failed" })
      } catch (e: any) {
        collected.push({ reference: v.reference, ok: false, message: e?.message || String(e) })
      }
      setResults([...collected])
    }
    const okCount = collected.filter((c) => c.ok).length
    setImporting(false)
    toast.success(`${okCount} of ${collected.length} journals imported`, {
      description: okCount === collected.length ? "Each is waiting for an approver to post it." : "See the results list for the ones that failed.",
    })
    if (okCount) onSuccess() // refresh the register behind the modal
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 px-6 -mt-6 pt-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>Bulk Upload Journal Entries</span>
              <p className="text-sm font-normal text-gray-600 mt-1">Post many journals at once from a CSV or Excel file</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Upload a spreadsheet of journal lines, validate them, and create the journals.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 min-h-0 space-y-5 py-4">
          {/* Format guidance + file picker */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-blue-800">1. Choose a file</h3>
                <p className="text-xs text-gray-600 mt-1">
                  One row per journal line. Rows sharing a <strong>Journal Ref</strong> become one journal. A journal needs at
                  least two lines and its debits must equal its credits.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="rounded-full h-9">
                <Download className="w-4 h-4 mr-2" />
                Download template
              </Button>
            </div>

            <label className="mt-4 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-white/70 px-6 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
              <FileSpreadsheet className="w-6 h-6 text-blue-500" />
              <span className="text-sm text-gray-700">
                {fileName ? <strong>{fileName}</strong> : "Click to select a .csv, .xlsx or .xls file"}
              </span>
              <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={onInputChange} disabled={parsing || importing} />
            </label>

            <div className="mt-3 overflow-x-auto rounded-lg bg-gray-50 border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    {TEMPLATE_HEADERS.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {TEMPLATE_SAMPLE.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {row.map((c, k) => (
                        <td key={k} className="px-3 py-1.5 whitespace-nowrap">{c || <span className="text-gray-300">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Reading file…
            </div>
          )}
          {parseError && !parsing && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview + validation */}
          {!parsing && journals.length > 0 && (
            <div className="rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">2. Review {journals.length} journal{journals.length === 1 ? "" : "s"}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800">{validJournals.length} ready</Badge>
                  {invalidCount > 0 && <Badge className="bg-red-100 text-red-800">{invalidCount} with errors</Badge>}
                </div>
              </div>
              <div className="max-h-[42vh] overflow-y-auto divide-y divide-gray-100">
                {validated.map(({ journal, errors, payload }) => (
                  <div key={journal.key} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-blue-700 truncate">{journal.reference || "(no reference)"}</span>
                          <span className="text-xs text-gray-500">{journal.date || "no date"} · {journal.lines.length} line{journal.lines.length === 1 ? "" : "s"}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{journal.description || "no description"}</p>
                      </div>
                      {payload ? (
                        <Badge className="bg-green-100 text-green-800 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 shrink-0"><AlertTriangle className="w-3 h-3 mr-1" />{errors.length} issue{errors.length === 1 ? "" : "s"}</Badge>
                      )}
                    </div>
                    {errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {errors.map((e, i) => (
                          <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import results */}
          {results && (
            <div className="rounded-xl border border-gray-200">
              <div className="border-b bg-gray-50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">3. Import results</h3>
              </div>
              <div className="max-h-[30vh] overflow-y-auto divide-y divide-gray-100">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                    <span className="font-mono text-gray-700 truncate">{r.reference}</span>
                    {r.ok ? (
                      <span className="flex items-center gap-1.5 text-green-700"><CheckCircle2 className="w-4 h-4" />{r.message}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600"><AlertTriangle className="w-4 h-4" />{r.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t flex-shrink-0">
          <div className="text-xs text-gray-500">
            {journals.length ? `${validJournals.length} of ${journals.length} journals ready to import` : "No file loaded yet"}
          </div>
          <div className="flex items-center gap-3">
            {journals.length > 0 && !results && (
              <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={importing} className="rounded-full text-gray-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleClose} disabled={importing} className="rounded-full h-10 px-6">
              {results ? "Done" : "Cancel"}
            </Button>
            {!results && (
              <Button
                type="button"
                onClick={runImport}
                disabled={importing || !validJournals.length}
                variant="gradient-create"
                className="rounded-full h-10 px-6"
              >
                {importing ? (
                  <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Importing…</div>
                ) : (
                  <div className="flex items-center gap-2"><Plus className="w-4 h-4" />Import {validJournals.length} journal{validJournals.length === 1 ? "" : "s"}</div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
