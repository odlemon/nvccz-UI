"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Landmark,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcDrawerSectionTitle,
  AcField,
  AcScreenHeader,
  AcSearchInput,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acPaymentRunApproval,
  acPaymentRunChecks,
  acPaymentRunDrawer,
  acPaymentRunHeader,
  acPaymentRunMeta,
  acPaymentRunPagination,
  acPaymentRunRefreshedAt,
  acPaymentRunRows,
  acPaymentRunStats,
  acPaymentRunSteps,
  acPaymentRunVersion,
} from "@/lib/accounting-mock/fixtures-payment-run"
import { cn } from "@/lib/utils"

function PaymentRunStepper({ steps }: { steps: typeof acPaymentRunSteps }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {steps.map((step, i) => {
        const isComplete = step.state === "complete"
        const isCurrent = step.state === "current"
        const isLocked = step.state === "locked"
        const isPending = step.state === "pending"
        return (
          <div key={step.n} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-2">
              <span
                className={cn(
                  "h-7 w-7 rounded-full inline-flex items-center justify-center shrink-0",
                  isComplete && "bg-[#2563EB] text-white",
                  isCurrent && "border-2 border-[#2563EB] text-[#2563EB] bg-white",
                  (isPending || isLocked) && "border-2 border-[#D1D5DB] text-[#9CA3AF] bg-white"
                )}
              >
                {isComplete ? (
                  <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span className="text-[11px] font-bold leading-none">{step.n}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  isCurrent ? "font-semibold text-[#2563EB]" : isComplete ? "text-[#374151]" : "text-[#9CA3AF]"
                )}
              >
                {step.label}
              </span>
              {step.sub && (
                <span
                  className={cn(
                    "text-[10px]",
                    isCurrent ? "text-[#2563EB]" : "text-[#9CA3AF]"
                  )}
                >
                  {step.sub}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center px-1 shrink-0">
                <div className={cn("h-px w-6", isComplete || isCurrent ? "bg-[#2563EB]" : "bg-[#D1D5DB]")} />
                <ChevronRight className="h-3 w-3 text-[#9CA3AF] -ml-0.5" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ValidationCell({ validation }: { validation: string }) {
  if (validation === "Verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[#2563EB]">
        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-5" />
        </svg>
        Verified
      </span>
    )
  }
  if (validation === "Review") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#374151]">
        <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
        Review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[#DC2626]">
      <span className="h-3.5 w-3.5 rounded-full bg-[#DC2626] inline-flex items-center justify-center">
        <X className="h-2.5 w-2.5 text-white" />
      </span>
      Bank detail mismatch
    </span>
  )
}

const statIcons = {
  users: Users,
  file: FileText,
  alert: AlertTriangle,
}

export function PaymentRunScreen() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("All")
  const [currency, setCurrency] = useState("All")
  const [rows, setRows] = useState(acPaymentRunRows)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [page, setPage] = useState(1)

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.supplier.toLowerCase().includes(search.toLowerCase()) ||
      r.invoices.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
  }

  const toggleAll = () => {
    const allSelected = filtered.every((r) => r.selected)
    setRows((prev) =>
      prev.map((r) => {
        if (!filtered.find((f) => f.id === r.id)) return r
        return { ...r, selected: !allSelected }
      })
    )
  }

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title={acPaymentRunHeader.title}
        meta={acPaymentRunHeader.meta}
        actions={
          <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("More actions")}>
            More actions <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
          </AcButton>
        }
      />

      <AcCard className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {acPaymentRunMeta.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              {m.icon === "calendar" && <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
              {m.icon === "bank" && <Landmark className="h-3.5 w-3.5 text-[#6B7280]" />}
              <div>
                <p className="text-[10px] text-[#9CA3AF]">{m.label}</p>
                {m.tone === "pending" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#374151]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                    {m.value}
                  </span>
                ) : (
                  <p className="text-[11px] font-semibold text-[#0B1739]">{m.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </AcCard>

      <AcCard className="px-4 py-4">
        <PaymentRunStepper steps={acPaymentRunSteps} />
      </AcCard>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {acPaymentRunStats.map((s) => {
          const Icon = s.icon ? statIcons[s.icon] : null
          return (
            <AcCard key={s.label} className="px-4 py-3">
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p className="mt-1 flex items-center gap-2">
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      s.tone === "exception" ? "text-[#DC2626]" : "text-[#2563EB]"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-[22px] font-bold tabular-nums leading-none",
                    s.tone === "exception" ? "text-[#DC2626]" : "text-[#0B1739]"
                  )}
                >
                  {s.value}
                </span>
              </p>
            </AcCard>
          )
        })}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <AcCard className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <AcSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search suppliers or invoices"
                className="flex-1 min-w-[200px]"
              />
              <AcButton variant="outline" onClick={() => toast("Filters")}>
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
              </AcButton>
              <AcField label="View" className="w-[100px]">
                <AcSelectInput value={view} options={["All", "Selected", "On hold"]} onChange={setView} />
              </AcField>
              <AcField label="Currency" className="w-[100px]">
                <AcSelectInput value={currency} options={["All", "USD", "ZiG"]} onChange={setCurrency} />
              </AcField>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal w-10">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every((r) => r.selected)}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#2563EB]"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left font-normal">Supplier</th>
                    <th className="px-3 py-2.5 text-left font-normal">Invoice(s)</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Due date</th>
                    <th className="px-3 py-2.5 text-left font-normal">Bank</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Account ending</th>
                    <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Gross (USD)</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">WHT (USD)</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Net payment (USD)</th>
                    <th className="px-3 py-2.5 text-left font-normal">Validation</th>
                    <th className="px-3 py-2.5 text-left font-normal">Hold reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE] cursor-pointer"
                      onClick={() => setDrawerOpen(true)}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={r.selected}
                          onChange={() => toggleRow(r.id)}
                          className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#2563EB]"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.supplier}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.invoices}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.dueDate}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.bank}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.accountEnding}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.currency}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.gross}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.wht}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#0B1739]">{r.net}</td>
                      <td className="px-3 py-2.5"><ValidationCell validation={r.validation} /></td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.holdReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EEF1F5]">
              <span className="text-[10px] text-[#9CA3AF]">
                Showing {acPaymentRunPagination.from} to {acPaymentRunPagination.to} of {acPaymentRunPagination.total} suppliers
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#6B7280]">Rows per page</span>
                <AcSelectInput
                  value={acPaymentRunPagination.perPage}
                  options={["10", "25", "50"]}
                  className="w-[60px]"
                />
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: acPaymentRunPagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-7 w-7 rounded-md text-[11px] font-medium",
                      page === p ? "bg-[#2563EB] text-white" : "border border-[#E5E7EB] text-[#374151]"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= acPaymentRunPagination.pages}
                  onClick={() => setPage((p) => Math.min(acPaymentRunPagination.pages, p + 1))}
                  className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </AcCard>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {acPaymentRunChecks.map((c) => (
              <AcCard key={c.label} className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-[#0B1739]">{c.label}</p>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      c.tone === "cobalt" ? "text-[#2563EB]" : "text-[#DC2626]"
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">{c.sub}</p>
              </AcCard>
            ))}
            <AcCard className="px-3 py-2.5">
              <p className="text-[11px] font-bold text-[#0B1739] mb-2">Approval chain</p>
              <div className="flex items-center gap-2">
                {acPaymentRunApproval.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />}
                    <div className="text-center">
                      <span className="h-6 w-6 rounded-full bg-[#0B1739] inline-flex items-center justify-center mx-auto">
                        <Users className="h-3 w-3 text-white" />
                      </span>
                      <p className="text-[10px] font-semibold text-[#0B1739] mt-1">{a.name}</p>
                      <p className="text-[9px] text-[#6B7280]">{a.title}</p>
                      <AcStatusPill label={a.status} tone="pending" />
                    </div>
                  </div>
                ))}
              </div>
            </AcCard>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#9CA3AF]">
              <button type="button" onClick={() => toast("Audit trail")} className="hover:text-[#2563EB]">
                Audit trail
              </button>
              <button type="button" onClick={() => toast("Data integrity")} className="hover:text-[#2563EB]">
                Data integrity
              </button>
              <button type="button" onClick={() => toast("Support")} className="hover:text-[#2563EB]">
                Support
              </button>
              <span>{acPaymentRunVersion}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AcButton variant="cobaltOutline" onClick={() => toast("Save selection")}>
                Save selection
              </AcButton>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                onClick={() => toast("Submit batch for approval")}
              >
                Submit batch for approval
              </AcButton>
            </div>
          </div>

          <AcCard className="px-4 py-3 bg-[#F5F8FC] border-[#E5E7EB]">
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#9CA3AF]">
              <Lock className="h-3.5 w-3.5" />
              <span>Generate bank file (Locked)</span>
            </div>
            <p className="text-center text-[10px] text-[#9CA3AF] mt-1">Available after final approval</p>
          </AcCard>

          <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
            <button
              type="button"
              onClick={() => toast.success("Data refreshed")}
              className="inline-flex items-center gap-1.5 hover:text-[#0B1739]"
            >
              Last data refresh: {acPaymentRunRefreshedAt}
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {drawerOpen && (
          <AcCard className="w-full xl:w-[290px] shrink-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
              <h2 className="text-[13px] font-bold text-[#0B1739]">{acPaymentRunDrawer.supplier}</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close supplier drawer"
                className="text-[#9CA3AF] hover:text-[#0B1739]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Selected invoices ({acPaymentRunDrawer.invoices.length})</AcDrawerSectionTitle>
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1 text-left font-normal">Invoice</th>
                    <th className="py-1 text-left font-normal">Due date</th>
                    <th className="py-1 text-right font-normal">Gross (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {acPaymentRunDrawer.invoices.map((inv) => (
                    <tr key={inv.ref} className="border-b border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151]">{inv.ref}</td>
                      <td className="py-1.5 text-[#374151]">{inv.dueDate}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{inv.gross}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 pt-2 border-t border-[#EEF1F5] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6B7280]">Total gross</span>
                  <span className="tabular-nums text-[#0B1739]">{acPaymentRunDrawer.totalGross}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6B7280]">Withholding tax (WHT)</span>
                  <span className="tabular-nums text-[#6B7280]">{acPaymentRunDrawer.wht}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-[#0B1739]">Net payment</span>
                  <span className="font-bold tabular-nums text-[#0B1739]">{acPaymentRunDrawer.netPayment}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Beneficiary & bank details</AcDrawerSectionTitle>
                <AcStatusPill label="Verified" tone="posted" />
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-[#6B7280]">Bank</span>
                  <span className="text-[#0B1739] text-right">{acPaymentRunDrawer.bank}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6B7280]">Account name</span>
                  <span className="text-[#0B1739] text-right">{acPaymentRunDrawer.accountName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6B7280]">Account number</span>
                  <span className="text-[#0B1739] text-right tabular-nums">{acPaymentRunDrawer.accountNumber}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6B7280]">Branch</span>
                  <span className="text-[#0B1739] text-right">{acPaymentRunDrawer.branch}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6B7280]">Account currency</span>
                  <span className="text-[#0B1739] text-right">{acPaymentRunDrawer.accountCurrency}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Change history</AcDrawerSectionTitle>
              {acPaymentRunDrawer.changeHistory.map((h) => (
                <div key={h.at} className="grid grid-cols-3 gap-1 py-1 text-[10px]">
                  <span className="text-[#9CA3AF]">{h.at}</span>
                  <span className="text-[#374151]">{h.by}</span>
                  <span className="text-[#374151]">{h.action}</span>
                </div>
              ))}
              <button type="button" onClick={() => toast("View full history")} className="text-[10px] text-[#2563EB] hover:underline mt-1">
                View full history
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Beneficiary confirmation document</AcDrawerSectionTitle>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-[#2563EB] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#2563EB] truncate">{acPaymentRunDrawer.document.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{acPaymentRunDrawer.document.uploaded}</p>
                  </div>
                </div>
                <button type="button" onClick={() => toast("Download")} aria-label="Download document">
                  <Download className="h-4 w-4 text-[#6B7280]" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Payment narration</AcDrawerSectionTitle>
              <p className="text-[11px] text-[#374151] mt-1">{acPaymentRunDrawer.narration}</p>
            </div>

            <div className="px-4 py-3">
              <AcDrawerSectionTitle>GL settlement</AcDrawerSectionTitle>
              <table className="w-full text-[10px] mt-2">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1 text-left font-normal">Account</th>
                    <th className="py-1 text-left font-normal">Account name</th>
                    <th className="py-1 text-right font-normal">Debit (USD)</th>
                    <th className="py-1 text-right font-normal">Credit (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {acPaymentRunDrawer.glLines.map((l) => (
                    <tr key={l.account}>
                      <td className="py-1 text-[#374151]">{l.account}</td>
                      <td className="py-1 text-[#374151]">{l.name}</td>
                      <td className="py-1 text-right tabular-nums text-[#0B1739]">{l.debit}</td>
                      <td className="py-1 text-right tabular-nums text-[#0B1739]">{l.credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AcCard>
        )}

        {!drawerOpen && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            aria-label="Open supplier drawer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
