"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Info,
  MoreVertical,
  RefreshCw,
  Settings,
  User,
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
  AcTabs,
} from "@/components/accounting-mock/primitives"
import {
  acTaxAssignment,
  acTaxBreadcrumb,
  acTaxCorrection,
  acTaxCoverage,
  acTaxException,
  acTaxExceptionAmounts,
  acTaxExceptionDetails,
  acTaxEvidence,
  acTaxFilingHistory,
  acTaxHeader,
  acTaxLegend,
  acTaxMeta,
  acTaxRefreshedAt,
  acTaxReviewChain,
  acTaxRows,
  acTaxStats,
  acTaxSteps,
  acTaxTabs,
  acTaxTotals,
  acTaxVersions,
} from "@/lib/accounting-mock/fixtures-tax"
import { cn } from "@/lib/utils"

function TaxStepper({ steps }: { steps: typeof acTaxSteps }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isComplete = step.state === "complete"
        const isCurrent = step.state === "current"
        const isPending = step.state === "pending"
        const lineCobalt = isComplete || isCurrent
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "h-6 w-6 rounded-full inline-flex items-center justify-center shrink-0",
                  isComplete && "bg-[#2563EB] text-white",
                  isCurrent && "bg-[#2563EB] text-white",
                  isPending && "border-2 border-[#D1D5DB] text-[#9CA3AF] bg-white"
                )}
              >
                {isComplete ? (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold leading-none">{step.n}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  isCurrent ? "font-semibold text-[#0B1739]" : isComplete ? "text-[#374151]" : "text-[#9CA3AF]"
                )}
              >
                <span className={cn(isComplete || isCurrent ? "text-[#2563EB] font-semibold" : "text-[#9CA3AF]")}>
                  {step.n}
                </span>
                {" "}
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn("h-px w-8 mx-2 shrink-0", lineCobalt ? "bg-[#2563EB]" : "bg-[#D1D5DB]")}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TaxPackScreen() {
  const [tab, setTab] = useState("VAT")
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [assignee, setAssignee] = useState(acTaxAssignment.assignee)
  const [exceptionIdx, setExceptionIdx] = useState(0)

  const exceptionRows = acTaxRows.filter((r) => r.status === "Exception")
  const selectedException = exceptionRows[exceptionIdx] ?? exceptionRows[0]

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <p className="text-[10px] text-[#9CA3AF]">{acTaxBreadcrumb.join("  >  ")}</p>

      <AcScreenHeader
        title={acTaxHeader.title}
        meta={acTaxHeader.meta}
        actions={
          <>
            <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Regenerate pack")}>
              Regenerate pack
            </AcButton>
            <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Export working papers")}>
              Export working papers
            </AcButton>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
              onClick={() => toast("Submit for approval")}
            >
              Submit for approval
            </AcButton>
            <button
              type="button"
              onClick={() => toast("More actions")}
              className="h-9 w-9 rounded-full border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
        {acTaxMeta.map((m, i) => (
          <div key={m.label} className="flex items-center gap-4">
            {!m.grouped && i > 0 && <span className="h-4 w-px bg-[#E5E7EB]" />}
            <div>
              <p className="text-[10px] text-[#9CA3AF]">{m.label}</p>
              {m.tone === "pending" ? (
                <span className="inline-flex items-center gap-1.5 text-[#374151]">
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                  {m.value}
                </span>
              ) : (
                <p
                  className={cn(
                    "font-semibold",
                    m.tone === "cobalt" ? "text-[#2563EB]" : "text-[#0B1739]"
                  )}
                >
                  {m.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AcTabs tabs={acTaxTabs} active={tab} onChange={setTab} />

      <TaxStepper steps={acTaxSteps} />

      <AcCard className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {acTaxStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p
                className={cn(
                  "text-[18px] font-bold tabular-nums leading-tight",
                  s.tone === "cobalt" ? "text-[#2563EB]" : "text-[#0B1739]"
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
          <div>
            <p className="text-[10px] text-[#6B7280] inline-flex items-center gap-1">
              {acTaxCoverage.label}
              <Info className="h-3 w-3 text-[#9CA3AF]" />
            </p>
            <p className="text-[18px] font-bold text-[#0B1739] leading-tight">{acTaxCoverage.value}</p>
            <p className="text-[10px] text-[#9CA3AF]">{acTaxCoverage.sub}</p>
          </div>
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      Section
                      <Settings className="h-3 w-3 text-[#9CA3AF]" />
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-normal">Source ledger</th>
                  <th className="px-3 py-2.5 text-left font-normal">Return box</th>
                  <th className="px-3 py-2.5 text-right font-normal">Transactions</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">GL amount (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Tax schedule amount (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Difference (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal">Evidence</th>
                  <th className="px-3 py-2.5 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {acTaxRows.map((r) => {
                  const isException = r.status === "Exception"
                  const isSelected = selectedException?.id === r.id
                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        if (isException) {
                          const idx = exceptionRows.findIndex((e) => e.id === r.id)
                          if (idx >= 0) setExceptionIdx(idx)
                          setDrawerOpen(true)
                        }
                      }}
                      className={cn(
                        "border-b border-[#EEF1F5]",
                        isException && "bg-[#FEF6F6]",
                        isSelected && isException && "ring-1 ring-inset ring-[#DC2626]/30",
                        isException && "cursor-pointer hover:bg-[#FEE2E2]/40"
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            r.child ? "pl-4" : "",
                            isException ? "text-[#DC2626] font-medium" : "text-[#374151]"
                          )}
                        >
                          {!r.child && <ChevronDown className="h-3 w-3 text-[#6B7280] shrink-0" />}
                          {r.child && <span className="text-[#9CA3AF]">•</span>}
                          {r.section}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.ledger}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.box}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.txns}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.glAmount}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.taxAmount}</td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums",
                          isException ? "text-[#DC2626] font-semibold" : "text-[#0B1739]"
                        )}
                      >
                        {r.difference}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toast("Evidence", { description: r.evidence })
                          }}
                          className={cn(
                            "text-[11px] hover:underline",
                            isException ? "text-[#DC2626]" : "text-[#2563EB]"
                          )}
                        >
                          {r.evidence}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <AcStatusPill
                          label={r.status}
                          tone={r.status === "Exception" ? "exception" : "posted"}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#EEF1F5]">
                  <td className="px-3 py-3 font-bold text-[#0B1739]" colSpan={3}>Total</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acTaxTotals.txns}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acTaxTotals.glAmount}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acTaxTotals.taxAmount}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#DC2626]">{acTaxTotals.difference}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toast("Evidence", { description: acTaxTotals.evidence })}
                      className="text-[11px] text-[#2563EB] hover:underline"
                    >
                      {acTaxTotals.evidence}
                    </button>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#EEF1F5]">
            {acTaxLegend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    l.tone === "cobalt" && "bg-[#2563EB]",
                    l.tone === "exception" && "bg-[#DC2626]",
                    l.tone === "faint" && "bg-[#9CA3AF]"
                  )}
                />
                {l.label}
              </span>
            ))}
          </div>
        </AcCard>

        {drawerOpen && (
          <AcCard className="w-full xl:w-[290px] shrink-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-[#374151]">
                  <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                  {acTaxException.counter}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setExceptionIdx((i) => Math.max(0, i - 1))}
                    disabled={exceptionIdx === 0}
                    className="h-6 w-6 inline-flex items-center justify-center text-[#6B7280] hover:text-[#0B1739] disabled:opacity-40"
                    aria-label="Previous exception"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExceptionIdx((i) => Math.min(exceptionRows.length - 1, i + 1))}
                    disabled={exceptionIdx >= exceptionRows.length - 1}
                    className="h-6 w-6 inline-flex items-center justify-center text-[#6B7280] hover:text-[#0B1739] disabled:opacity-40"
                    aria-label="Next exception"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close exception drawer"
                className="text-[#9CA3AF] hover:text-[#0B1739]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-[#0B1739]">{acTaxException.title}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{acTaxException.sub}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#6B7280]">{acTaxException.amountLabel}</p>
                  <p className="text-[16px] font-bold text-[#DC2626] tabular-nums">{acTaxException.amount}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Transaction details</AcDrawerSectionTitle>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {acTaxExceptionDetails.map((d) => (
                  <div key={d.label}>
                    <p className="text-[10px] text-[#9CA3AF]">{d.label}</p>
                    <p className="text-[11px] text-[#0B1739] font-medium">{d.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 pt-2 border-t border-[#EEF1F5]">
                {acTaxExceptionAmounts.map((a) => (
                  <div key={a.label}>
                    <p className="text-[10px] text-[#9CA3AF]">{a.label}</p>
                    <p
                      className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        a.tone === "exception" ? "text-[#DC2626]" : "text-[#0B1739]"
                      )}
                    >
                      {a.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Evidence documents</AcDrawerSectionTitle>
                <span className="text-[10px] text-[#6B7280]">{acTaxEvidence.meta}</span>
              </div>
              {acTaxEvidence.docs.map((doc) => (
                <div key={doc.label} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-5 w-5 rounded bg-[#FEE2E2] inline-flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-[#DC2626]">PDF</span>
                    </span>
                    <span className="text-[11px] text-[#374151] truncate">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#9CA3AF]">{doc.value}</span>
                    <AcButton
                      variant="cobaltOutline"
                      className="h-7 px-2.5 text-[10px]"
                      onClick={() => toast("Upload", { description: doc.label })}
                    >
                      Upload
                    </AcButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Recommended correction</AcDrawerSectionTitle>
              <p className="text-[10px] text-[#6B7280] mb-2">{acTaxCorrection.note}</p>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1 text-left font-normal">Account</th>
                    <th className="py-1 text-left font-normal">Account name</th>
                    <th className="py-1 text-right font-normal">Debit (USD)</th>
                    <th className="py-1 text-right font-normal">Credit (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {acTaxCorrection.lines.map((l) => (
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

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex flex-wrap gap-3">
                <AcField label="Assigned to" className="flex-1 min-w-[100px]">
                  <AcSelectInput
                    value={assignee}
                    options={acTaxAssignment.assignees}
                    onChange={setAssignee}
                  />
                </AcField>
                <AcField label="Due date" className="w-[110px]">
                  <AcSelectInput value={acTaxAssignment.dueDate} options={[acTaxAssignment.dueDate]} />
                </AcField>
                <AcField label="Priority" className="w-[90px]">
                  <span className="inline-flex items-center gap-1.5 h-8 text-[11px] text-[#374151]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                    {acTaxAssignment.priority}
                  </span>
                </AcField>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Review chain</AcDrawerSectionTitle>
                <button
                  type="button"
                  onClick={() => toast("Edit review chain")}
                  className="text-[10px] text-[#2563EB] hover:underline"
                >
                  Edit
                </button>
              </div>
              {acTaxReviewChain.map((r) => (
                <div key={r.name} className="flex items-center gap-2 py-1.5">
                  <span className="h-6 w-6 rounded-full bg-[#0B1739] inline-flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#0B1739]">{r.name}</p>
                    <p className="text-[10px] text-[#6B7280]">{r.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#6B7280]">{r.date}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{r.status}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Working paper versions</AcDrawerSectionTitle>
                <button
                  type="button"
                  onClick={() => toast("View all versions")}
                  className="text-[10px] text-[#2563EB] hover:underline"
                >
                  View all
                </button>
              </div>
              {acTaxVersions.map((v) => (
                <div key={v.version} className="flex items-center justify-between gap-2 py-1.5 border-b border-[#EEF1F5] last:border-0">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0B1739]">{v.version}</p>
                    <p className="text-[10px] text-[#6B7280]">
                      {v.action} · {v.at} · {v.by}
                    </p>
                  </div>
                  {v.current && (
                    <AcButton variant="cobaltOutline" className="h-6 px-2 text-[10px] shrink-0">
                      Current
                    </AcButton>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3">
              <AcDrawerSectionTitle>Filing history</AcDrawerSectionTitle>
              <p className="text-[11px] text-[#6B7280]">{acTaxFilingHistory}</p>
            </div>
          </AcCard>
        )}

        {!drawerOpen && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            aria-label="Open exception drawer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 text-[10px] text-[#9CA3AF]">
        <button
          type="button"
          onClick={() => toast.success("Data refreshed")}
          className="inline-flex items-center gap-1.5 hover:text-[#0B1739]"
        >
          Last data refresh: {acTaxRefreshedAt}
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
