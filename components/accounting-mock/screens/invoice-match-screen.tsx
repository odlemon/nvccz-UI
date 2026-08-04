"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Expand,
  FileSearch,
  FileText,
  Maximize2,
  Minus,
  Plus,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcSelectInput,
  AcStatusPill,
  AcTabs,
} from "@/components/accounting-mock/primitives"
import {
  acMatchAccountOptions,
  acMatchApprovers,
  acMatchAttachments,
  acMatchAudit,
  acMatchComments,
  acMatchCompliance,
  acMatchDocument,
  acMatchFooter,
  acMatchInvoice,
  acMatchLines,
  acMatchMethodOptions,
  acMatchPayment,
  acMatchTabs,
  acMatchTotals,
} from "@/lib/accounting-mock/fixtures-match"
import { cn } from "@/lib/utils"

function complianceIcon(tone: string) {
  if (tone === "ok") return <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
  if (tone === "warn") return <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
  return <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
}

export function InvoiceMatchScreen() {
  const router = useRouter()
  const [tab, setTab] = useState(acMatchTabs[0])
  const [comment, setComment] = useState("")
  const [account, setAccount] = useState(acMatchPayment.account)
  const [method, setMethod] = useState(acMatchPayment.method)
  const [expandedLines, setExpandedLines] = useState<number[]>([])

  const toggleLine = (line: number) => {
    setExpandedLines((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
    )
  }

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">
                Supplier Invoice <span className="text-[#6B7280] font-bold">·</span> {acMatchInvoice.id}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-[4px] border border-[#F5C46B] bg-[#FFFBF2] text-[10px] font-semibold text-[#B45309]">
                <AlertTriangle className="h-3 w-3" /> {acMatchInvoice.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AcButton
                variant="outline"
                className="h-9 px-4"
                onClick={() => {
                  toast("Returned to buyer")
                  router.push("/accounting-v2/payables")
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to buyer
              </AcButton>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
                onClick={() => toast.success("Approved & scheduled", { description: acMatchPayment.amount + " USD" })}
              >
                Approve &amp; schedule <ChevronDown className="h-3.5 w-3.5" />
              </AcButton>
            </div>
          </div>

          {/* Invoice summary */}
          <AcCard className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-[#EEF1F5] border-b border-[#EEF1F5]">
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Supplier</p>
                <p className="text-[12px] font-bold text-[#0B1739]">{acMatchInvoice.supplier}</p>
                <p className="text-[10px] text-[#9CA3AF]">{acMatchInvoice.supplierCode}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Invoice No.</p>
                <p className="text-[12px] font-bold text-[#0B1739]">{acMatchInvoice.invoiceNo}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Invoice Date</p>
                <p className="text-[12px] font-bold text-[#0B1739]">{acMatchInvoice.invoiceDate}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Due Date</p>
                <p className="text-[12px] font-bold text-[#0B1739]">{acMatchInvoice.dueDate}</p>
                <p className="text-[10px] text-[#DC2626]">{acMatchInvoice.overdue}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Currency</p>
                <p className="text-[12px] font-bold text-[#0B1739]">{acMatchInvoice.currency}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Invoice Total</p>
                <p className="text-[16px] font-bold tabular-nums text-[#0B1739]">{acMatchInvoice.total}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-[#EEF1F5]">
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Purchase Order</p>
                <p className="text-[12px] font-semibold text-[#2563EB]">{acMatchInvoice.po}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Goods Receipt</p>
                <p className="text-[12px] font-semibold text-[#0B1739]">{acMatchInvoice.grn}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Buyer</p>
                <p className="text-[12px] font-semibold text-[#0B1739]">{acMatchInvoice.buyer}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Payment Terms</p>
                <p className="text-[12px] font-semibold text-[#0B1739]">{acMatchInvoice.paymentTerms}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Incoterms</p>
                <p className="text-[12px] font-semibold text-[#0B1739]">{acMatchInvoice.incoterms}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#6B7280]">Department</p>
                <p className="text-[12px] font-semibold text-[#0B1739]">{acMatchInvoice.department}</p>
              </div>
            </div>
          </AcCard>

          <AcTabs tabs={acMatchTabs} active={tab} onChange={setTab} />

          {/* Three-way match table */}
          <AcCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">Three-Way Match Details</h2>
                <span className="text-[10px] text-[#9CA3AF]">4 line items</span>
              </div>
              <AcButton
                variant="outline"
                className="h-8"
                onClick={() => setExpandedLines(acMatchLines.map((l) => l.line))}
              >
                <Expand className="h-3.5 w-3.5" /> Expand all
              </AcButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#EEF1F5]">
                    <th className="px-3 py-2 text-left font-normal text-[#6B7280] w-8" rowSpan={2}>#</th>
                    <th className="px-3 py-2 text-left font-normal text-[#6B7280] min-w-[160px]" rowSpan={2}>Item Description</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-[#2563EB] bg-[#D8E8FF] border-b border-[#EEF1F5]" colSpan={4}>INVOICE</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-[#2563EB] bg-[#D8E8FF] border-b border-[#EEF1F5]" colSpan={3}>PURCHASE ORDER</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-[#2563EB] bg-[#D8E8FF] border-b border-[#EEF1F5]" colSpan={1}>GOODS RECEIVED</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-[#2563EB] bg-[#D8E8FF] border-b border-[#EEF1F5]" colSpan={2}>VARIANCE</th>
                    <th className="px-3 py-2 text-left font-normal text-[#6B7280]" rowSpan={2}>RESULT</th>
                  </tr>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-2 py-2 text-right font-normal">Qty</th>
                    <th className="px-2 py-2 text-right font-normal">Unit Price</th>
                    <th className="px-2 py-2 text-right font-normal">Tax</th>
                    <th className="px-2 py-2 text-right font-normal">Amount</th>
                    <th className="px-2 py-2 text-right font-normal">Qty</th>
                    <th className="px-2 py-2 text-right font-normal">Unit Price</th>
                    <th className="px-2 py-2 text-right font-normal">Amount</th>
                    <th className="px-2 py-2 text-right font-normal">Qty</th>
                    <th className="px-2 py-2 text-right font-normal">Qty</th>
                    <th className="px-2 py-2 text-right font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {acMatchLines.map((l) => (
                    <tr key={l.line} className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE]">
                      <td className="px-3 py-2.5 text-[#374151]">{l.line}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-[#0B1739]">{l.item}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{l.sku}</p>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.invQty}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.invPrice}</td>
                      <td className="px-2 py-2.5 text-right text-[#374151]">{l.invTax}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.invAmount}</td>
                      <td className={cn("px-2 py-2.5 text-right tabular-nums", l.poQtyWarn ? "text-[#DC2626] font-semibold" : "text-[#0B1739]")}>
                        {l.poQty}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.poPrice}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.poAmount}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#0B1739]">{l.grQty}</td>
                      <td className={cn("px-2 py-2.5 text-right tabular-nums", l.result === "Exception" ? "text-[#DC2626] font-semibold" : "text-[#0B1739]")}>
                        {l.varQty}
                      </td>
                      <td className={cn("px-2 py-2.5 text-right tabular-nums", l.result === "Exception" ? "text-[#DC2626] font-semibold" : "text-[#0B1739]")}>
                        {l.varAmount}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleLine(l.line)}
                          className="inline-flex items-center gap-1"
                        >
                          <AcStatusPill
                            label={l.result}
                            tone={l.result === "Matched" ? "posted" : "exception"}
                          />
                          <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-6 px-4 py-3 border-t border-[#EEF1F5] bg-[#F5F8FC]">
              <div className="text-right">
                <p className="text-[10px] text-[#6B7280]">Subtotal (excl. tax)</p>
                <p className="text-[12px] font-bold tabular-nums text-[#0B1739]">{acMatchTotals.subtotal}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6B7280]">Tax (15%)</p>
                <p className="text-[12px] font-bold tabular-nums text-[#0B1739]">{acMatchTotals.tax}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6B7280]">Invoice Total</p>
                <p className="text-[14px] font-bold tabular-nums text-[#0B1739]">{acMatchTotals.total}</p>
              </div>
            </div>
          </AcCard>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AcCard className="overflow-hidden">
              <AcCardHeader
                title="Invoice Document"
                action={
                  <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                    <FileText className="h-3.5 w-3.5" />
                    {acMatchDocument.filename} · {acMatchDocument.size}
                  </div>
                }
              />
              <div className="px-4 py-3">
                <div className="rounded-md border border-[#E5E7EB] bg-[#F5F8FC] h-[180px] flex items-center justify-center">
                  <div className="text-center px-4">
                    <p className="text-[11px] font-bold text-[#0B1739]">ZIM TECH SOLUTIONS (PVT) LTD</p>
                    <p className="text-[10px] text-[#6B7280] mt-1">INVOICE {acMatchInvoice.invoiceNo}</p>
                    <p className="text-[9px] text-[#9CA3AF] mt-3">Mukuru Capital Partners (Pvt) Ltd</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 px-1">
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Zoom out" className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-white">
                      <Minus className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Zoom in" className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-white">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Download" onClick={() => toast("Download invoice")} className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#2563EB] hover:bg-white">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Fullscreen" onClick={() => toast("Fullscreen preview")} className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#2563EB] hover:bg-white">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </AcCard>

            <AcCard className="overflow-hidden">
              <AcCardHeader title="Comments" />
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add comment..."
                    className="flex-1 h-8 px-3 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB]"
                  />
                  <AcButton
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] h-8"
                    onClick={() => {
                      if (comment.trim()) {
                        toast.success("Comment added")
                        setComment("")
                      }
                    }}
                  >
                    Add
                  </AcButton>
                </div>
                <div className="space-y-3">
                  {acMatchComments.map((c) => (
                    <div key={c.date} className="border-b border-[#EEF1F5] pb-3 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-[#0B1739]">{c.author}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{c.date}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-[#374151] leading-snug">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AcCard>

            <AcCard className="overflow-hidden">
              <AcCardHeader
                title={`Attachments (${acMatchAttachments.length})`}
                action={
                  <AcButton variant="cobaltOutline" className="h-8" onClick={() => toast("Upload attachment")}>
                    <UploadCloud className="h-3.5 w-3.5" /> Upload
                  </AcButton>
                }
              />
              <div className="px-4 py-2">
                {acMatchAttachments.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 py-2.5 border-b border-[#EEF1F5] last:border-0">
                    <FileText className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-[#0B1739] truncate">{a.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{a.size} · {a.date}</p>
                    </div>
                    <button type="button" aria-label={`Download ${a.name}`} onClick={() => toast("Download", { description: a.name })} className="text-[#2563EB] hover:text-[#1D4ED8]">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </AcCard>

            <AcCard className="overflow-hidden">
              <AcCardHeader
                title="Audit Trail"
                action={
                  <button type="button" onClick={() => toast("Full audit trail")} className="text-[11px] font-medium text-[#2563EB] hover:underline">
                    View all
                  </button>
                }
              />
              <div className="px-4 py-3 space-y-0">
                {acMatchAudit.map((a, i) => (
                  <div key={a.label} className="flex items-start gap-3 py-2">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full shrink-0",
                          a.tone === "done" && "bg-[#2563EB]",
                          a.tone === "exception" && "bg-[#DC2626]",
                          a.tone === "pending" && "border-2 border-[#D1D5DB] bg-white"
                        )}
                      />
                      {i < acMatchAudit.length - 1 && (
                        <span className="w-px h-6 bg-[#E5E7EB] my-0.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-[#0B1739]">{a.label}</p>
                      <p className="text-[10px] text-[#6B7280]">{a.user} · {a.date}</p>
                      {a.sub && <p className="text-[10px] text-[#DC2626]">{a.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </AcCard>
          </div>
        </div>

        {/* Right rail */}
        <div className="w-full xl:w-[300px] shrink-0 space-y-4">
          <AcCard className="overflow-hidden">
            <AcCardHeader title="Verification & Compliance" />
            <div className="px-2 py-1">
              {acMatchCompliance.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => toast(c.label, { description: c.status })}
                  className="w-full flex items-center gap-2.5 px-2 py-2.5 border-b border-[#EEF1F5] last:border-0 hover:bg-[#F5F8FC] text-left"
                >
                  {c.label === "Duplicate Check" && <FileSearch className="h-4 w-4 text-[#6B7280] shrink-0" />}
                  {c.label === "Vendor Bank Details" && <Banknote className="h-4 w-4 text-[#6B7280] shrink-0" />}
                  {c.label === "Budget Check" && <FileText className="h-4 w-4 text-[#6B7280] shrink-0" />}
                  {c.label === "Withholding Tax" && <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" />}
                  {c.label === "Three-Way Match" && <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0" />}
                  <span className="text-[11px] text-[#374151] flex-1">{c.label}</span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    {complianceIcon(c.tone)}
                    <span className="text-[10px] font-medium text-[#374151]">{c.status}</span>
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#9CA3AF] shrink-0" />
                </button>
              ))}
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Approval Chain" />
            <div className="px-4 py-3 space-y-1">
              {acMatchApprovers.map((a, i) => (
                <div key={a.step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full inline-flex items-center justify-center text-[11px] font-bold",
                        a.active ? "bg-[#2563EB] text-white" : "border border-[#D1D5DB] text-[#9CA3AF] bg-white"
                      )}
                    >
                      {a.step}
                    </span>
                    {i < acMatchApprovers.length - 1 && (
                      <span className={cn("w-px h-6 my-0.5", a.active ? "bg-[#2563EB]" : "bg-[#E5E7EB]")} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold text-[#0B1739]">{a.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{a.role}</p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] shrink-0",
                          a.status === "Approved" && "text-[#2563EB] font-semibold",
                          a.status === "Review" && "text-[#F59E0B] font-semibold",
                          a.status === "Pending" && "text-[#9CA3AF]"
                        )}
                      >
                        {a.status}
                      </span>
                    </div>
                    {a.date && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Payment Scheduling" />
            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Pay From Account</p>
                <AcSelectInput value={account} options={acMatchAccountOptions} onChange={setAccount} />
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Payment Method</p>
                <AcSelectInput value={method} options={acMatchMethodOptions} onChange={setMethod} />
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Batch Date</p>
                <AcSelectInput
                  value={acMatchPayment.batchDate}
                  options={[acMatchPayment.batchDate, "06 Aug 2026", "07 Aug 2026"]}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#6B7280]">Estimated Payment Date</span>
                <span className="text-[11px] font-semibold text-[#0B1739]">{acMatchPayment.estimatedDate}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#6B7280]">Payment Amount (USD)</span>
                <span className="text-[12px] font-bold tabular-nums text-[#0B1739]">{acMatchPayment.amount}</span>
              </div>
              <p className="text-[10px] text-[#9CA3AF]">{acMatchPayment.note}</p>
            </div>
          </AcCard>

          <div className="px-1 space-y-1 text-[10px] text-[#9CA3AF]">
            <p>{acMatchFooter.created}</p>
            <p>{acMatchFooter.updated}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
