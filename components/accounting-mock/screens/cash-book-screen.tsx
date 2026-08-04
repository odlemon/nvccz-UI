"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acCashAccountOptions,
  acCashControls,
  acCashDateOptions,
  acCashLiquidity,
  acCashObligations,
  acCashObligationsTotal,
  acCashPager,
  acCashRows,
  acCashSummary,
  acCashTabs,
  acCashTransfer,
  acCashTransferToOptions,
} from "@/lib/accounting-mock/fixtures-cash-book"
import { cn } from "@/lib/utils"

function reconTone(recon: string) {
  if (recon === "Matched") return "posted" as const
  if (recon === "Pending") return "pending" as const
  return "exception" as const
}

export function CashBookScreen() {
  const router = useRouter()
  const [account, setAccount] = useState(acCashAccountOptions[0])
  const [date, setDate] = useState(acCashDateOptions[0])
  const [tab, setTab] = useState(acCashTabs[0])
  const [page, setPage] = useState("1")
  const [perPage, setPerPage] = useState(acCashPager.perPage)
  const [transferOpen, setTransferOpen] = useState(true)
  const [toAccount, setToAccount] = useState(acCashTransfer.toAccount)
  const [amount, setAmount] = useState(acCashTransfer.amount)

  const filteredRows =
    tab === "All"
      ? acCashRows
      : tab === "Receipts"
        ? acCashRows.filter((r) => r.ref.startsWith("RCPT"))
        : tab === "Payments"
          ? acCashRows.filter((r) => r.ref.startsWith("PAY") || r.ref.startsWith("CHG"))
          : tab === "Transfers"
            ? acCashRows.filter((r) => r.ref.startsWith("TRF"))
            : acCashRows.filter((r) => r.recon !== "Matched")

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">Cash Book</h1>
            <div className="flex flex-wrap items-center gap-2">
              <AcSelectInput
                value={account}
                options={acCashAccountOptions}
                onChange={setAccount}
                icon={<Building2 className="h-3.5 w-3.5" />}
                className="w-[190px]"
              />
              <AcSelectInput
                value={date}
                options={acCashDateOptions}
                onChange={setDate}
                icon={<Calendar className="h-3.5 w-3.5" />}
                className="w-[150px]"
              />
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
                onClick={() => toast("Record receipt", { description: "Receipt form (mock)" })}
              >
                <Plus className="h-3.5 w-3.5" /> Record receipt
              </AcButton>
              <AcButton
                variant="cobaltOutline"
                className="h-9 px-4"
                onClick={() => toast("Record payment", { description: "Payment form (mock)" })}
              >
                <Minus className="h-3.5 w-3.5" /> Record payment
              </AcButton>
              <AcButton
                variant="cobaltOutline"
                className="h-9 px-4"
                onClick={() => setTransferOpen(true)}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
              </AcButton>
              <AcButton
                variant="cobaltOutline"
                className="h-9 px-3"
                onClick={() => toast("More actions", { description: "Export · Print · Settings (mock)" })}
              >
                <MoreHorizontal className="h-4 w-4" />
              </AcButton>
            </div>
          </div>

          {/* KPI summary bar */}
          <AcCard className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-[#EEF1F5]">
              {acCashSummary.map((k) => (
                <div key={k.label} className="px-4 py-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{k.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-[16px] font-bold tabular-nums tracking-tight",
                      k.accent ? "text-[#2563EB]" : "text-[#0B1739]"
                    )}
                  >
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          </AcCard>

          {/* Transactions table */}
          <AcCard className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
              <div className="flex items-center gap-5 border-b border-[#E5E7EB] -mb-px">
                {acCashTabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "-mb-px pb-2.5 text-[12px] font-medium border-b-2 transition-colors",
                      t === tab
                        ? "border-[#2563EB] text-[#2563EB]"
                        : "border-transparent text-[#6B7280] hover:text-[#0B1739]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <AcButton
                  variant="outline"
                  className="h-8"
                  onClick={() => toast("Filters", { description: "Advanced filters (mock)" })}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
                </AcButton>
                <button
                  type="button"
                  aria-label="Download"
                  onClick={() => toast("Download", { description: "CSV export (mock)" })}
                  className="h-8 w-8 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Table settings"
                  onClick={() => toast("Table settings")}
                  className="h-8 w-8 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        Date <ChevronDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Value date</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Reference</th>
                    <th className="px-3 py-2.5 text-left font-normal">Counterparty</th>
                    <th className="px-3 py-2.5 text-left font-normal">Description</th>
                    <th className="px-3 py-2.5 text-left font-normal">Category</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Inflow (USD)</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Outflow (USD)</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Balance (USD)</th>
                    <th className="px-3 py-2.5 text-left font-normal">Reconciliation</th>
                    <th className="px-3 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr
                      key={r.ref}
                      className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE] cursor-pointer"
                      onClick={() => toast(r.ref, { description: r.desc })}
                    >
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.valueDate}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.ref}</td>
                      <td className="px-3 py-2.5 text-[#374151] min-w-[140px]">{r.counterparty}</td>
                      <td className="px-3 py-2.5 text-[#374151] min-w-[160px]">{r.desc}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.category}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.inflow}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.outflow}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.balance}</td>
                      <td className="px-3 py-2.5">
                        <AcStatusPill label={r.recon} tone={reconTone(r.recon)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          aria-label={`Attachment for ${r.ref}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toast("Attachment", { description: r.ref })
                          }}
                          className="text-[#2563EB] hover:text-[#1D4ED8]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#EEF1F5]">
              <span className="text-[11px] text-[#6B7280]">{acCashPager.summary}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="First page"
                  onClick={() => setPage("1")}
                  className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => setPage("1")}
                  className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {acCashPager.pages.map((p) =>
                  p === "…" ? (
                    <span key={p} className="px-1 text-[11px] text-[#9CA3AF]">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPage(p)
                        toast(`Page ${p}`)
                      }}
                      className={cn(
                        "h-7 min-w-[28px] px-2 rounded-full text-[11px] font-medium border transition-colors",
                        page === p
                          ? "bg-[#2563EB] text-white border-[#2563EB]"
                          : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F8FC]"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => setPage("2")}
                  className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Last page"
                  onClick={() => setPage("22")}
                  className="h-7 w-7 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
                <AcSelectInput
                  value={perPage}
                  options={acCashPager.perPageOptions}
                  onChange={setPerPage}
                  className="w-[100px] ml-2"
                />
              </div>
            </div>
          </AcCard>
        </div>

        {/* Right rail */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-4">
          <AcCard className="overflow-hidden">
            <AcCardHeader
              title="Upcoming obligations"
              action={
                <button
                  type="button"
                  onClick={() => toast("Upcoming obligations", { description: "Full schedule (mock)" })}
                  className="text-[11px] font-medium text-[#2563EB] hover:underline"
                >
                  View all
                </button>
              }
            />
            <div className="px-4 py-2">
              {acCashObligations.map((o) => (
                <div key={o.label} className="flex items-start gap-3 py-3 border-b border-[#EEF1F5] last:border-0">
                  <span className="h-8 w-8 shrink-0 rounded-md bg-[#EFF6FF] inline-flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#9CA3AF]">{o.date}</p>
                    <p className="text-[11px] font-semibold text-[#0B1739] leading-snug">{o.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{o.amount}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{o.due}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#EEF1F5]">
              <span className="text-[11px] font-semibold text-[#0B1739]">Total upcoming</span>
              <span className="text-[12px] font-bold tabular-nums text-[#0B1739]">{acCashObligationsTotal}</span>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader
              title="Liquidity by currency"
              action={
                <button
                  type="button"
                  onClick={() => toast("Liquidity report", { description: "Full report (mock)" })}
                  className="text-[11px] font-medium text-[#2563EB] hover:underline"
                >
                  View report
                </button>
              }
            />
            <div className="px-4 py-3 space-y-4">
              {acCashLiquidity.map((l) => (
                <div key={l.currency}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-[#0B1739]">{l.currency}</span>
                    <span className="text-[11px] font-bold tabular-nums text-[#0B1739]">{l.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[#EEF1F5] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${l.pct}%`, backgroundColor: l.bar }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#6B7280] tabular-nums w-7 text-right">{l.pct}%</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">of total liquidity</p>
                </div>
              ))}
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Cash controls" />
            <div className="px-4 py-2 space-y-2">
              {acCashControls.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[11px] text-[#6B7280]">{c.label}</span>
                  <span className="inline-flex items-center gap-1.5">
                    {c.dot && <span className="h-2 w-2 rounded-full bg-[#2563EB]" />}
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        c.accent ? "text-[#2563EB]" : "text-[#0B1739]"
                      )}
                    >
                      {c.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push("/accounting-v2/bank-reconciliation")}
              className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium text-[#2563EB] hover:underline border-t border-[#EEF1F5]"
            >
              Open bank reconciliation <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </AcCard>

          {transferOpen && (
            <AcCard className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
                <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">Create transfer</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Collapse transfer form"
                    onClick={() => setTransferOpen(false)}
                    className="text-[#9CA3AF] hover:text-[#0B1739]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Close transfer form"
                    onClick={() => setTransferOpen(false)}
                    className="text-[#9CA3AF] hover:text-[#0B1739]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div>
                  <div className="flex items-end justify-between gap-2 mb-1">
                    <p className="text-[10px] text-[#6B7280]">From account</p>
                    <div className="text-right">
                      <p className="text-[9px] text-[#9CA3AF]">Available</p>
                      <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acCashTransfer.fromAvailable}</p>
                    </div>
                  </div>
                  <AcSelectInput value={account} options={acCashAccountOptions} onChange={setAccount} />
                </div>
                <div>
                  <div className="flex items-end justify-between gap-2 mb-1">
                    <p className="text-[10px] text-[#6B7280]">To account</p>
                    <div className="text-right">
                      <p className="text-[9px] text-[#9CA3AF]">Available</p>
                      <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acCashTransfer.toAvailable}</p>
                    </div>
                  </div>
                  <AcSelectInput value={toAccount} options={acCashTransferToOptions} onChange={setToAccount} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-1">Currency</p>
                    <AcSelectInput value={acCashTransfer.currency} options={["USD", "ZiG", "ZAR"]} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-1">Amount</p>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-1">Rate</p>
                    <div className="flex items-center gap-1">
                      <input
                        readOnly
                        value={acCashTransfer.rate}
                        className="flex-1 h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151]"
                      />
                      <button
                        type="button"
                        aria-label="Refresh rate"
                        onClick={() => toast("Rate refreshed", { description: acCashTransfer.rate })}
                        className="h-8 w-8 shrink-0 rounded-full bg-[#2563EB] inline-flex items-center justify-center text-white hover:bg-[#1D4ED8]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-1">Estimated amount</p>
                    <p className="h-8 flex items-center text-[11px] font-bold tabular-nums text-[#0B1739]">
                      {acCashTransfer.estimated}
                    </p>
                  </div>
                </div>
                <AcButton
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] h-9"
                  onClick={() => toast("Review transfer", { description: `${amount} USD → ${toAccount}` })}
                >
                  Review transfer
                </AcButton>
              </div>
            </AcCard>
          )}
        </div>
      </div>
    </div>
  )
}
