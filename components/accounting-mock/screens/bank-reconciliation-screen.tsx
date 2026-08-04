"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns2,
  Download,
  FilePlus2,
  FileText,
  Landmark,
  List,
  MoreHorizontal,
  Percent,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcSearchInput,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acReconException,
  acReconKpis,
  acReconMatchDetails,
  acReconMatches,
  acReconOwnerOptions,
  acReconPriorityOptions,
  acReconRules,
  acReconStatementLines,
  acReconStatementPager,
  acReconSteps,
  acReconSummaryBar,
  acReconTitle,
} from "@/lib/accounting-mock/fixtures-recon"
import { cn } from "@/lib/utils"

function ReconStepper() {
  return (
    <div className="flex items-center gap-2">
      {acReconSteps.map((s, i) => (
        <div key={s.step} className="flex items-center gap-2 min-w-0 first:flex-none flex-1 last:flex-none">
          {i > 0 && (
            <span
              className={cn(
                "h-px flex-1 min-w-[20px]",
                s.state === "todo" ? "border-t border-dashed border-[#D1D5DB]" : "bg-[#2563EB] h-[2px]"
              )}
            />
          )}
          <span
            className={cn(
              "h-6 w-6 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-bold",
              s.state === "done" && "bg-[#2563EB] text-white",
              s.state === "current" && "border-[1.5px] border-[#F59E0B] text-[#F59E0B] bg-white",
              s.state === "todo" && "border border-[#D1D5DB] text-[#9CA3AF] bg-white"
            )}
          >
            {s.step}
          </span>
          <span
            className={cn(
              "text-[12px] whitespace-nowrap",
              s.state === "done" && "font-semibold text-[#0B1739]",
              s.state === "current" && "font-bold text-[#F59E0B]",
              s.state === "todo" && "text-[#9CA3AF]"
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function confidenceTone(c: number) {
  if (c >= 80) return "bg-[#2563EB] text-white"
  if (c >= 70) return "bg-[#DBEAFE] text-[#2563EB]"
  return "bg-[#FFFBF2] text-[#B45309] border border-[#F5C46B]"
}

export function BankReconciliationScreen() {
  const [search, setSearch] = useState("")
  const [selectedLine, setSelectedLine] = useState("RTGS0049281")
  const [page, setPage] = useState("1")
  const [owner, setOwner] = useState(acReconException.owner)
  const [priority, setPriority] = useState(acReconException.priority)
  const [comment, setComment] = useState(acReconException.comment)
  const [rulesOpen, setRulesOpen] = useState(true)

  const filteredLines = acReconStatementLines.filter(
    (l) =>
      !search ||
      l.narrative.toLowerCase().includes(search.toLowerCase()) ||
      l.ref.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div>
        <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">
          Bank Reconciliation <span className="text-[#6B7280] font-bold">·</span> {acReconTitle.account}{" "}
          <span className="text-[#6B7280] font-bold">·</span> {acReconTitle.date}
        </h1>
        <div className="mt-3">
          <ReconStepper />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {acReconKpis.map((k) => {
          const icons = {
            "Statement balance": <Landmark className="h-3.5 w-3.5" />,
            "Ledger balance": <FileText className="h-3.5 w-3.5" />,
            Difference: <Scale className="h-3.5 w-3.5" />,
            "Statement lines": <List className="h-3.5 w-3.5" />,
            Matched: <Percent className="h-3.5 w-3.5" />,
            Exceptions: <AlertCircle className="h-3.5 w-3.5" />,
          }
          return (
            <AcCard key={k.label} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center",
                    k.tone === "exception" ? "bg-[#FEF6F6] text-[#DC2626]" : "bg-[#EFF6FF] text-[#2563EB]"
                  )}
                >
                  {icons[k.label as keyof typeof icons]}
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF] truncate">{k.label}</p>
                  <p
                    className={cn(
                      "text-[14px] font-bold tabular-nums tracking-tight",
                      k.tone === "exception" ? "text-[#DC2626]" : k.tone === "posted" ? "text-[#2563EB]" : "text-[#0B1739]"
                    )}
                  >
                    {k.value}
                  </p>
                </div>
              </div>
            </AcCard>
          )
        })}
      </div>

      {/* Three-column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Statement lines */}
        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader title="Bank statement lines (184)" />
          <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
            <AcSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search statement lines..."
              className="flex-1 min-w-[140px]"
            />
            <AcButton variant="outline" className="h-8" onClick={() => toast("Filters")}>
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
            </AcButton>
            <AcButton variant="outline" className="h-8 px-2" onClick={() => toast("More")}>
              <MoreHorizontal className="h-4 w-4" />
            </AcButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">Date <ChevronDown className="h-3 w-3" /></span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-normal">Narrative</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Amount (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal">Reference</th>
                  <th className="px-3 py-2.5 text-left font-normal">Match status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((l) => {
                  const isSelected = selectedLine === l.ref
                  return (
                    <tr
                      key={l.ref + l.narrative}
                      onClick={() => setSelectedLine(l.ref)}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer",
                        isSelected ? "bg-[#DBEAFE] border-l-2 border-l-[#2563EB]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{l.date}</td>
                      <td className="px-3 py-2.5 text-[#374151] min-w-[120px]">{l.narrative}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{l.amount}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{l.ref}</td>
                      <td className="px-3 py-2.5">
                        <AcStatusPill
                          label={l.status}
                          tone={l.status === "Matched" ? "posted" : "pending"}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-t border-[#EEF1F5]">
            <span className="text-[10px] text-[#9CA3AF]">{acReconStatementPager.summary}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="First" className="h-6 w-6 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280]">
                <ChevronsLeft className="h-3 w-3" />
              </button>
              <button type="button" aria-label="Prev" className="h-6 w-6 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280]">
                <ChevronLeft className="h-3 w-3" />
              </button>
              {acReconStatementPager.pages.map((p) =>
                p === "…" ? (
                  <span key={p} className="px-1 text-[10px] text-[#9CA3AF]">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-medium border",
                      page === p ? "bg-[#2563EB] text-white border-[#2563EB]" : "border-[#E5E7EB] text-[#374151]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <button type="button" aria-label="Next" className="h-6 w-6 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280]">
                <ChevronRight className="h-3 w-3" />
              </button>
              <button type="button" aria-label="Last" className="h-6 w-6 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280]">
                <ChevronsRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </AcCard>

        {/* Suggested matches + match details */}
        <div className="xl:col-span-4 space-y-4">
          <AcCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
              <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">Suggested ledger matches</h2>
              <div className="flex items-center gap-2">
                <AcSelectInput value="Auto" options={["Auto", "Manual", "All"]} className="w-[80px]" />
                <button
                  type="button"
                  aria-label="Refresh matches"
                  onClick={() => toast("Matches refreshed")}
                  className="h-8 w-8 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal">Confidence</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 text-left font-normal">Description</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Amount (USD)</th>
                    <th className="px-3 py-2.5 text-left font-normal">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {acReconMatches.map((m) => (
                    <tr
                      key={m.ref}
                      className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE] cursor-pointer"
                      onClick={() => toast(m.ref, { description: `${m.confidence}% confidence` })}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold",
                            confidenceTone(m.confidence)
                          )}
                        >
                          {m.confidence}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{m.date}</td>
                      <td className="px-3 py-2.5 text-[#374151] min-w-[140px]">{m.desc}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{m.amount}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{m.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Match details" />
            <div className="px-4 py-3 space-y-3 border-b border-[#EEF1F5]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-[#6B7280]">Statement line</p>
                  <p className="text-[11px] font-semibold text-[#0B1739]">{acReconMatchDetails.statementLine}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#6B7280]">Amount</p>
                  <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acReconMatchDetails.statementAmount}</p>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-[#6B7280]">Ledger line</p>
                  <p className="text-[11px] font-semibold text-[#0B1739]">{acReconMatchDetails.ledgerLine}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#6B7280]">Amount</p>
                  <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acReconMatchDetails.ledgerAmount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[10px] text-[#6B7280]">Variance</p>
                  <p className="text-[11px] font-semibold text-[#0B1739]">{acReconMatchDetails.variance}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280]">Match rule</p>
                  <p className="text-[11px] text-[#374151]">{acReconMatchDetails.rule}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                onClick={() => toast.success("Matched", { description: "RTGS0049281 ↔ JRN0726-1542" })}
              >
                <Scale className="h-3.5 w-3.5" /> Match
              </AcButton>
              <AcButton variant="outline" onClick={() => toast("Split match")}>
                <Columns2 className="h-3.5 w-3.5" /> Split
              </AcButton>
              <AcButton variant="outline" onClick={() => toast("Create adjustment")}>
                <FilePlus2 className="h-3.5 w-3.5" /> Create adjustment
              </AcButton>
              <AcButton variant="outline" className="px-2" onClick={() => toast("More")}>
                <MoreHorizontal className="h-4 w-4" />
              </AcButton>
            </div>
          </AcCard>
        </div>

        {/* Exception details */}
        <AcCard className="xl:col-span-4 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">Exception details</h2>
            <div className="flex items-center gap-2">
              <AcStatusPill label={acReconException.status} tone="pending" />
              <button type="button" aria-label="Collapse" className="text-[#9CA3AF] hover:text-[#0B1739]">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-[10px] text-[#6B7280]">Reason</p>
              <p className="text-[11px] font-semibold text-[#0B1739]">{acReconException.reason}</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-[#6B7280]">Statement line</p>
                <p className="text-[11px] text-[#374151]">{acReconException.statementLine}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-[#6B7280]">Amount</p>
                <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acReconException.statementAmount}</p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-[#6B7280]">Suggested ledger</p>
                <p className="text-[11px] text-[#374151]">{acReconException.ledgerLine}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-[#6B7280]">Amount</p>
                <p className="text-[11px] font-bold tabular-nums text-[#0B1739]">{acReconException.ledgerAmount}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Owner</p>
                <AcSelectInput
                  value={owner}
                  options={acReconOwnerOptions}
                  onChange={setOwner}
                  icon={<User className="h-3.5 w-3.5" />}
                />
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] mb-1">Priority</p>
                <AcSelectInput value={priority} options={acReconPriorityOptions} onChange={setPriority} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1">Comments</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-2.5 py-2 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] outline-none focus:border-[#2563EB] resize-none"
              />
              <p className="mt-1 text-[10px] text-[#9CA3AF]">{acReconException.commentCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1.5">Evidence</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#E5E7EB]">
                <FileText className="h-4 w-4 text-[#2563EB] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#0B1739] truncate">{acReconException.evidence}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{acReconException.evidenceSize}</p>
                </div>
                <button type="button" aria-label="Download evidence" onClick={() => toast("Download")} className="text-[#6B7280] hover:text-[#2563EB]">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Delete evidence" onClick={() => toast("Evidence removed")} className="text-[#6B7280] hover:text-[#DC2626]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </AcCard>
      </div>

      {/* Summary bar */}
      <AcCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] text-[#6B7280]">Matched</p>
              <p className="text-[14px] font-bold tabular-nums text-[#2563EB]">{acReconSummaryBar.matched}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280]">Unmatched</p>
              <p className="text-[14px] font-bold tabular-nums text-[#F59E0B]">{acReconSummaryBar.unmatched}</p>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#DC2626]" />
              <div>
                <p className="text-[10px] text-[#6B7280]">Difference</p>
                <p className="text-[14px] font-bold tabular-nums text-[#DC2626]">{acReconSummaryBar.difference}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280]">Last auto-match</p>
              <p className="text-[11px] text-[#374151]">{acReconSummaryBar.lastAutoMatch}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AcButton variant="cobaltOutline" onClick={() => setRulesOpen(true)}>
              <ShieldCheck className="h-3.5 w-3.5" /> Rules
            </AcButton>
            <AcButton variant="outline" onClick={() => toast.success("Progress saved")}>
              Save progress
            </AcButton>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              onClick={() => toast.success("Sent for review")}
            >
              Send for review <ArrowRight className="h-3.5 w-3.5" />
            </AcButton>
          </div>
        </div>
      </AcCard>

      {/* Reconciliation rules */}
      {rulesOpen && (
        <AcCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <button
              type="button"
              onClick={() => setRulesOpen(false)}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0B1739]"
            >
              <ChevronDown className="h-4 w-4" /> Reconciliation rules ({acReconRules.length})
            </button>
            <div className="flex items-center gap-2">
              <AcButton variant="outline" onClick={() => toast("Manage rules")}>Manage rules</AcButton>
              <button type="button" aria-label="Close rules" onClick={() => setRulesOpen(false)} className="text-[#9CA3AF] hover:text-[#0B1739]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-4 py-2.5 text-left font-normal w-8" />
                  <th className="px-3 py-2.5 text-left font-normal">Rule name</th>
                  <th className="px-3 py-2.5 text-left font-normal">Conditions</th>
                  <th className="px-3 py-2.5 text-left font-normal">Action</th>
                  <th className="px-4 py-2.5 text-right font-normal">Exceptions</th>
                </tr>
              </thead>
              <tbody>
                {acReconRules.map((r) => (
                  <tr key={r.id} className="border-b border-[#EEF1F5]">
                    <td className="px-4 py-2.5 text-[#6B7280]">{r.id}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#0B1739]">{r.name}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.conditions}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.action}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#0B1739]">{r.exceptions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AcCard>
      )}
    </div>
  )
}
