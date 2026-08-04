"use client"

import { useState } from "react"
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Clock,
  Eye,
  Flag,
  Mail,
  MoreHorizontal,
  Phone,
  ReceiptText,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcDrawerSectionTitle,
  AcField,
  AcScreenHeader,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acArActivity,
  acArAgeing,
  acArBuckets,
  acArDetail,
  acArDso,
  acArInvoices,
  acArOutstanding,
  acArPagination,
  type AcArInvoice,
  type AcArStatus,
} from "@/lib/accounting-mock/fixtures-receivables"
import { cn } from "@/lib/utils"

function arStatusTone(status: AcArStatus): "posted" | "pending" | "exception" | "neutral" {
  if (status === "Overdue") return "exception"
  if (status === "Promise to pay") return "pending"
  if (status === "Paid") return "posted"
  return "neutral"
}

function ActivityIcon({ icon }: { icon: (typeof acArActivity)[number]["icon"] }) {
  const cls = "h-3 w-3"
  if (icon === "mail") return <Mail className={cls} />
  if (icon === "eye") return <Eye className={cls} />
  if (icon === "bell") return <Bell className={cls} />
  return <Calendar className={cls} />
}

export function ReceivablesScreen() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["INV-2026-00481"]))
  const [panelOpen, setPanelOpen] = useState(true)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState("10")

  const ageingTotal = acArAgeing.reduce((s, seg) => s + seg.weight, 0)

  const toggleRow = (invoice: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(invoice)) next.delete(invoice)
      else next.add(invoice)
      return next
    })
  }

  const openDetail = (row: AcArInvoice) => {
    setSelected(new Set([row.invoice]))
    setPanelOpen(true)
  }

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title="Accounts Receivable & Collections"
        actions={
          <>
            <div className="inline-flex items-center">
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4 rounded-r-none"
                onClick={() => toast("New invoice")}
              >
                New invoice
              </AcButton>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-2 rounded-l-none border-l border-white/20"
                onClick={() => toast("New invoice options")}
                aria-label="New invoice options"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </AcButton>
            </div>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Allocate receipt")}>
              Allocate receipt
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Send statements")}>
              Send statements
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 w-9 px-0" onClick={() => toast("More actions")} aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </AcButton>
          </>
        }
      />

      {/* KPI band */}
      <div className="flex flex-col xl:flex-row gap-3">
        <AcCard className="xl:w-[220px] shrink-0 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-[#DBEAFE] inline-flex items-center justify-center text-[#2563EB] shrink-0">
              <ReceiptText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] text-[#6B7280]">{acArOutstanding.label}</p>
              <p className="text-[22px] font-bold text-[#0B1739] tracking-tight leading-none mt-0.5">{acArOutstanding.value}</p>
            </div>
          </div>
        </AcCard>

        <AcCard className="flex-1 min-w-0">
          <div className="flex flex-wrap items-stretch divide-x divide-[#EEF1F5]">
            {acArBuckets.map((b, i) => (
              <div key={b.id} className={cn("flex-1 min-w-[100px] px-4 py-3", i === 0 && "flex items-center gap-3")}>
                {i === 0 && (
                  <span className="h-9 w-9 rounded-full bg-[#DBEAFE] inline-flex items-center justify-center text-[#2563EB] shrink-0">
                    <Clock className="h-4 w-4" />
                  </span>
                )}
                <div className={i === 0 ? "" : "pl-1"}>
                  <p className={cn("text-[11px]", b.tone === "exception" ? "text-[#DC2626]" : "text-[#6B7280]")}>{b.label}</p>
                  <p className={cn("text-[18px] font-bold tracking-tight leading-none mt-0.5 tabular-nums", b.tone === "exception" ? "text-[#DC2626]" : "text-[#0B1739]")}>
                    {b.value}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex-1 min-w-[90px] px-4 py-3">
              <p className="text-[11px] text-[#6B7280]">{acArDso.label}</p>
              <p className="text-[18px] font-bold text-[#F59E0B] tracking-tight leading-none mt-0.5">{acArDso.value}</p>
              <p className="text-[10px] text-[#F59E0B] mt-0.5">{acArDso.note}</p>
            </div>
          </div>
        </AcCard>
      </div>

      {/* Ageing + filters */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <AcCard className="xl:col-span-5 overflow-hidden">
          <AcCardHeader title="Ageing of outstanding (USD)" />
          <div className="px-4 py-4">
            <div className="flex items-end gap-1 mb-2 min-h-[28px]">
              {acArAgeing.map((seg) => (
                <div key={seg.id} className="text-center" style={{ width: `${(seg.weight / ageingTotal) * 100}%` }}>
                  <span className="text-[10px] font-semibold text-[#0B1739] tabular-nums whitespace-nowrap">{seg.amount}</span>
                </div>
              ))}
            </div>
            <div className="flex h-7 rounded overflow-hidden">
              {acArAgeing.map((seg) => (
                <div
                  key={seg.id}
                  className="h-full"
                  style={{ width: `${(seg.weight / ageingTotal) * 100}%`, backgroundColor: seg.color }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[10px] text-[#374151]">
              {acArAgeing.map((seg) => (
                <span key={seg.id} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: seg.color }} />
                  {seg.label}
                </span>
              ))}
            </div>
          </div>
        </AcCard>

        <AcCard className="xl:col-span-7 overflow-hidden">
          <AcCardHeader
            title="Filters"
            action={
              <button type="button" onClick={() => toast("Filters cleared")} className="text-[11px] font-medium text-[#2563EB] hover:underline">
                Clear all
              </button>
            }
          />
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AcField label="Customer">
              <AcSelectInput value="All customers" options={["All customers", "Mavambo Foods", "BancABC Custody"]} />
            </AcField>
            <AcField label="Status">
              <AcSelectInput value="All statuses" options={["All statuses", "Overdue", "Part-paid", "Paid", "Promise to pay"]} />
            </AcField>
            <AcField label="Currency">
              <AcSelectInput value="All currencies" options={["All currencies", "USD", "ZiG"]} />
            </AcField>
            <AcField label="Salesperson">
              <AcSelectInput value="All salespeople" options={["All salespeople", "Tariro Ncube", "Praise Moyo"]} />
            </AcField>
            <AcField label="Due date">
              <AcSelectInput value="All" options={["All", "Overdue", "Due this week"]} icon={<Calendar className="h-3.5 w-3.5" />} />
            </AcField>
            <div className="flex items-end">
              <AcButton variant="cobaltOutline" className="w-full h-8" onClick={() => toast("More filters")}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
              </AcButton>
            </div>
          </div>
        </AcCard>
      </div>

      {/* Table + drawer */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 w-8">
                    <input type="checkbox" className="rounded border-[#D1D5DB]" aria-label="Select all" />
                  </th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Customer</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Invoice</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Issue date</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Due date</th>
                  <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Original</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Outstanding</th>
                  <th className="px-3 py-2.5 text-right font-normal">Age</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Collection status</th>
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {acArInvoices.map((r) => {
                  const isSelected = selected.has(r.invoice)
                  return (
                    <tr
                      key={r.invoice}
                      onClick={() => openDetail(r)}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer transition-colors",
                        isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(r.invoice)}
                          className="rounded border-[#D1D5DB]"
                          aria-label={`Select ${r.invoice}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.customer}</td>
                      <td className="px-3 py-2.5 text-[#2563EB] font-medium whitespace-nowrap">{r.invoice}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.issueDate}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.dueDate}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.currency}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.original}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.outstanding}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.age}</td>
                      <td className="px-3 py-2.5">
                        <AcStatusPill label={r.status} tone={arStatusTone(r.status)} />
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toast("Row actions", { description: r.invoice })}
                          className="text-[#9CA3AF] hover:text-[#0B1739]"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#EEF1F5]">
            <span className="text-[10px] text-[#9CA3AF]">{acArPagination.showing}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                Rows per page
                <AcSelectInput
                  value={rowsPerPage}
                  options={["10", "25", "50"]}
                  onChange={setRowsPerPage}
                  className="w-[56px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]" aria-label="First page">
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]" aria-label="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {acArPagination.pages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(Number(p))}
                    className={cn(
                      "h-7 min-w-[28px] px-1.5 rounded-md border text-[11px] font-medium",
                      page === Number(p)
                        ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                        : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F8FC]"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#374151] hover:bg-[#F5F8FC]" aria-label="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#374151] hover:bg-[#F5F8FC]" aria-label="Last page">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </AcCard>

        {panelOpen && (
          <AcCard className="w-full xl:w-[300px] shrink-0 overflow-hidden">
            <AcCardHeader
              title={`${acArDetail.invoice} · ${acArDetail.customer}`}
              action={
                <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close panel" className="text-[#9CA3AF] hover:text-[#0B1739]">
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="grid grid-cols-3 divide-x divide-[#EEF1F5] border-b border-[#EEF1F5]">
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-[#6B7280]">Outstanding</p>
                <p className="text-[14px] font-bold text-[#DC2626] tabular-nums mt-0.5">{acArDetail.outstanding}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-[#6B7280]">Due date</p>
                <p className="text-[12px] font-semibold text-[#0B1739] mt-0.5">{acArDetail.dueDate}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-[#6B7280]">Days overdue</p>
                <p className="text-[12px] font-bold text-[#DC2626] mt-0.5">{acArDetail.daysOverdue}</p>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <p className="text-[10px] text-[#6B7280] mb-1">Contact</p>
              <p className="text-[12px] font-bold text-[#0B1739]">{acArDetail.contactName}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#2563EB]">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{acArDetail.contactEmail}</span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#374151]">
                <Phone className="h-3 w-3 shrink-0 text-[#6B7280]" />
                {acArDetail.contactPhone}
              </p>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5] grid grid-cols-2 gap-2">
              <AcButton className="bg-[#2563EB] hover:bg-[#1D4ED8] h-8 text-[11px]" onClick={() => toast("Send reminder")}>
                <Mail className="h-3 w-3" /> Send reminder
              </AcButton>
              <AcButton variant="cobaltOutline" className="h-8 text-[11px]" onClick={() => toast("Record promise")}>
                <Clock className="h-3 w-3" /> Record promise
              </AcButton>
              <AcButton variant="cobaltOutline" className="h-8 text-[11px]" onClick={() => toast("Open dispute")}>
                <Flag className="h-3 w-3" /> Open dispute
              </AcButton>
              <AcButton variant="cobaltOutline" className="h-8 text-[11px]" onClick={() => toast("Allocate receipt")}>
                <CircleDollarSign className="h-3 w-3" /> Allocate receipt
              </AcButton>
              <AcButton variant="cobaltOutline" className="h-8 w-8 px-0 col-span-2 justify-self-end" onClick={() => toast("More actions")} aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </AcButton>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Activity timeline</AcDrawerSectionTitle>
              <div className="space-y-3 mt-2">
                {acArActivity.map((a, i) => (
                  <div key={a.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "h-6 w-6 rounded-full inline-flex items-center justify-center shrink-0",
                          a.tone === "pending" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#DBEAFE] text-[#2563EB]"
                        )}
                      >
                        <ActivityIcon icon={a.icon} />
                      </span>
                      {i < acArActivity.length - 1 && <span className="w-px flex-1 bg-[#E5E7EB] border-l border-dashed border-[#D1D5DB] min-h-[12px] mt-1" />}
                    </div>
                    <div className="pb-1 min-w-0">
                      <p className="text-[11px] font-medium text-[#0B1739] leading-snug">{a.title}</p>
                      {a.detail && <p className="text-[10px] text-[#374151] mt-0.5">{a.detail}</p>}
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5] grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-[#6B7280]">Revenue account</p>
                <p className="text-[11px] font-semibold text-[#0B1739] mt-0.5">{acArDetail.revenueAccount}</p>
                <p className="text-[10px] text-[#374151]">{acArDetail.revenueSegment}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280]">Tax treatment</p>
                <p className="text-[11px] font-semibold text-[#0B1739] mt-0.5">{acArDetail.taxTreatment}</p>
                <p className="text-[10px] text-[#374151]">{acArDetail.taxCode}</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <AcDrawerSectionTitle>Notes</AcDrawerSectionTitle>
              <p className="text-[11px] text-[#374151]">{acArDetail.notes}</p>
            </div>
          </AcCard>
        )}
      </div>
    </div>
  )
}
