"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  Columns3,
  Download,
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
  AcKeyValue,
  AcScreenHeader,
  AcSearchInput,
  AcSelectInput,
  AcStatusPill,
  AcTabs,
} from "@/components/accounting-mock/primitives"
import {
  acExpenseDetail,
  acExpenseKpis,
  acExpensePagination,
  acExpenseRows,
  type AcExpenseStatus,
} from "@/lib/accounting-mock/fixtures-expenses"
import { cn } from "@/lib/utils"

const kpiTones = {
  navy: "text-[#0B1739]",
  amber: "text-[#F59E0B]",
  cobalt: "text-[#2563EB]",
  red: "text-[#DC2626]",
}

function expenseStatusTone(s: AcExpenseStatus): "posted" | "pending" | "neutral" {
  if (s === "Approved" || s === "Paid") return "posted"
  if (s === "Finance review") return "neutral"
  return "pending"
}

export function ExpensesScreen() {
  const [tab, setTab] = useState("All claims")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [selected, setSelected] = useState("EXP-2026-0718")
  const [drawerTab, setDrawerTab] = useState("Details")

  const filtered = acExpenseRows.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.employee.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    const matchStatus = status === "All" || r.status === status
    return matchSearch && matchStatus
  })

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title="Expenses & Claims"
        subtitle="Manage employee expenses, claims and reimbursements"
        actions={
          <>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("New claim")}>
              New claim
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Record expense")}>
              Record expense
            </AcButton>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
              onClick={() => toast("Reimbursement run", { description: "Select claims for payment run (mock)" })}
            >
              Reimbursement run <ChevronDown className="h-3 w-3" />
            </AcButton>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {acExpenseKpis.map((k) => (
          <AcCard key={k.id} className="px-4 py-3">
            <p className="text-[10px] text-[#6B7280]">{k.label}</p>
            <p className={cn("text-[20px] font-bold leading-tight mt-0.5", kpiTones[k.tone])}>{k.value}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-1">{k.count}</p>
          </AcCard>
        ))}
      </div>

      <AcTabs
        tabs={["All claims", "My team", "My approvals", "Awaiting my action", "Exceptions"]}
        active={tab}
        onChange={setTab}
      />

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-3">
          <AcCard className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <AcSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search claims..."
                className="flex-1 min-w-[200px]"
              />
              <AcField label="Status">
                <AcSelectInput
                  value={status === "All" ? "All" : status}
                  options={["All", "Finance review", "Awaiting manager", "Approved", "Paid"]}
                  onChange={setStatus}
                  className="w-[150px]"
                />
              </AcField>
              <AcButton variant="outline" onClick={() => toast("Columns", { description: "Column picker (mock)" })}>
                <Columns3 className="h-3.5 w-3.5 text-[#6B7280]" /> Columns
              </AcButton>
              <AcButton variant="outline" onClick={() => toast("Export", { description: "CSV download (mock)" })}>
                <Download className="h-3.5 w-3.5 text-[#6B7280]" />
              </AcButton>
              <AcButton variant="outline" onClick={() => toast("Filters", { description: "Advanced filters (mock)" })}>
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
              </AcButton>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#EEF1F5] text-[#6B7280]">
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Claim ID</th>
                    <th className="px-3 py-2.5 text-left font-normal">Employee</th>
                    <th className="px-3 py-2.5 text-left font-normal">Department</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Submitted</th>
                    <th className="px-3 py-2.5 text-left font-normal">Category</th>
                    <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Amount</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Receipt coverage</th>
                    <th className="px-3 py-2.5 text-left font-normal">Policy result</th>
                    <th className="px-3 py-2.5 text-left font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const active = selected === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        className={cn(
                          "border-b border-[#EEF1F5] cursor-pointer transition-colors",
                          active ? "bg-[#DBEAFE]" : "hover:bg-[#F9FBFE]"
                        )}
                      >
                        <td className={cn("px-3 py-2.5 whitespace-nowrap", active ? "font-semibold text-[#2563EB]" : "text-[#374151]")}>
                          {r.id}
                        </td>
                        <td className="px-3 py-2.5 text-[#374151]">{r.employee}</td>
                        <td className="px-3 py-2.5 text-[#374151]">{r.department}</td>
                        <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.submitted}</td>
                        <td className="px-3 py-2.5 text-[#374151]">{r.category}</td>
                        <td className="px-3 py-2.5 text-[#374151]">{r.currency}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] font-semibold">{r.amount}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#374151]">{r.receiptCoverage}</td>
                        <td
                          className={cn(
                            "px-3 py-2.5",
                            r.policyTone === "exception"
                              ? "text-[#DC2626] font-medium"
                              : r.policyTone === "warning"
                                ? "text-[#F59E0B] font-medium"
                                : "text-[#374151]"
                          )}
                        >
                          {r.policyResult}
                        </td>
                        <td className="px-3 py-2.5">
                          <AcStatusPill label={r.status} tone={expenseStatusTone(r.status)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EEF1F5]">
              <span className="text-[10px] text-[#9CA3AF]">
                Showing {acExpensePagination.showing} of {acExpensePagination.total} claims
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toast("Page", { description: `Page ${p} (mock)` })}
                      className={cn(
                        "h-7 w-7 rounded-md text-[11px] font-medium",
                        p === acExpensePagination.page
                          ? "bg-[#2563EB] text-white"
                          : "border border-[#E5E7EB] text-[#374151] hover:bg-[#F5F8FC]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <AcSelectInput
                  value={acExpensePagination.perPage}
                  options={["25 per page", "50 per page"]}
                  className="w-[110px]"
                />
              </div>
            </div>
          </AcCard>
        </div>

        {selected === acExpenseDetail.id && (
          <AcCard className="w-full xl:w-[400px] shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[#0B1739]">{acExpenseDetail.id}</span>
                    <AcStatusPill label={acExpenseDetail.status} tone="pending" />
                  </div>
                  <p className="text-[11px] font-semibold text-[#374151] mt-1">{acExpenseDetail.title}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{acExpenseDetail.submitted}</p>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    aria-label="Close drawer"
                    onClick={() => setSelected("")}
                    className="text-[#9CA3AF] hover:text-[#0B1739] mb-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-[18px] font-bold text-[#0B1739] tabular-nums">{acExpenseDetail.amount}</p>
                </div>
              </div>
            </div>

            <div className="px-4 pt-2">
              <AcTabs
                tabs={["Details", "Receipts (6)", "Policy", "Approvals", "Audit trail"]}
                active={drawerTab}
                onChange={setDrawerTab}
              />
            </div>

            {drawerTab === "Details" && (
              <div className="px-4 py-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <AcDrawerSectionTitle>Claim information</AcDrawerSectionTitle>
                    {acExpenseDetail.info.map((i) => (
                      <AcKeyValue key={i.label} label={i.label} value={i.value} />
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <AcDrawerSectionTitle>Policy exceptions</AcDrawerSectionTitle>
                      {acExpenseDetail.policyExceptions.map((e) => (
                        <div key={e.text} className="flex items-start gap-2 mt-1">
                          <AlertTriangle
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 mt-0.5",
                              e.tone === "exception" ? "text-[#DC2626]" : "text-[#F59E0B]"
                            )}
                          />
                          <p
                            className={cn(
                              "text-[11px]",
                              e.tone === "exception" ? "text-[#DC2626]" : "text-[#F59E0B]"
                            )}
                          >
                            {e.text}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-0.5">Duplicate detection</p>
                      <p className="text-[11px] text-[#374151]">{acExpenseDetail.duplicateDetection}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-0.5">Per-diem rule</p>
                      <p className="text-[11px] text-[#374151]">{acExpenseDetail.perDiemRule}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AcCard className="md:col-span-2 overflow-hidden">
                    <AcCardHeader title="Expense lines" />
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-[#EEF1F5] text-[#6B7280]">
                          <th className="px-3 py-2 text-left font-normal">Date</th>
                          <th className="px-3 py-2 text-left font-normal">Description</th>
                          <th className="px-3 py-2 text-left font-normal">Category</th>
                          <th className="px-3 py-2 text-right font-normal">Amount (USD)</th>
                          <th className="px-3 py-2 text-left font-normal">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acExpenseDetail.lines.map((l) => (
                          <tr key={l.desc} className="border-b border-[#EEF1F5]">
                            <td className="px-3 py-2 text-[#374151] whitespace-nowrap">{l.date}</td>
                            <td className="px-3 py-2 text-[#374151]">{l.desc}</td>
                            <td className="px-3 py-2 text-[#374151]">{l.category}</td>
                            <td
                              className={cn(
                                "px-3 py-2 text-right tabular-nums",
                                l.highlight ? "text-[#DC2626] font-semibold" : "text-[#0B1739]"
                              )}
                            >
                              {l.amount}
                            </td>
                            <td className="px-3 py-2 text-[#374151]">{l.receipt}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} className="px-3 py-2.5 font-bold text-[#0B1739]">
                            Total
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold tabular-nums text-[#0B1739]">
                            {acExpenseDetail.amount}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </AcCard>

                  <AcCard className="overflow-hidden">
                    <AcCardHeader title="Attached receipts" />
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded border border-[#E5E7EB] bg-[#F5F8FC]" />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => toast("Receipts", { description: "6 attachments (mock)" })}
                      className="block w-full py-2 text-center text-[11px] font-medium text-[#2563EB] hover:underline border-t border-[#EEF1F5]"
                    >
                      View all (6)
                    </button>
                  </AcCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AcCard className="overflow-hidden p-4">
                    <AcDrawerSectionTitle>Budget availability</AcDrawerSectionTitle>
                    <p className="text-[10px] text-[#6B7280] mb-2">{acExpenseDetail.budget.costCentre}</p>
                    <AcKeyValue label="Budget (FY 2026)" value={acExpenseDetail.budget.budget} />
                    <AcKeyValue label="Spent to date" value={acExpenseDetail.budget.spent} />
                    <AcKeyValue label="This claim" value={acExpenseDetail.budget.claim} />
                    <AcKeyValue label="Remaining" value={acExpenseDetail.budget.remaining} strong />
                  </AcCard>

                  <AcCard className="overflow-hidden p-4">
                    <AcDrawerSectionTitle>Approval chain</AcDrawerSectionTitle>
                    <div className="space-y-2 mt-1">
                      {acExpenseDetail.approvals.map((a, i) => (
                        <div key={a.name} className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-[#E5E7EB] text-[9px] font-bold text-[#6B7280] inline-flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#0B1739]">{a.name}</p>
                            <p className="text-[10px] text-[#6B7280]">{a.role}</p>
                          </div>
                          <div className="text-right">
                            <AcStatusPill
                              label={a.status}
                              tone={a.status === "Approved" ? "posted" : "pending"}
                            />
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AcCard>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#EEF1F5]">
                  <AcButton
                    variant="outline"
                    className="text-[#DC2626] border-[#F0A8A8] hover:bg-[#FEF6F6]"
                    onClick={() => toast("Returned", { description: "Sent back to employee (mock)" })}
                  >
                    Return for correction
                  </AcButton>
                  <AcButton
                    variant="cobaltOutline"
                    onClick={() => toast.success("Approved with exception", { description: "Policy exception noted." })}
                  >
                    Approve with exception
                  </AcButton>
                  <AcButton
                    className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                    onClick={() => toast.success("Approved", { description: "Claim approved." })}
                  >
                    Approve
                  </AcButton>
                </div>
              </div>
            )}
          </AcCard>
        )}
      </div>
    </div>
  )
}
