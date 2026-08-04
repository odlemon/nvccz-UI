"use client"

import { useState } from "react"
import { Calendar, ChevronRight, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcDrawerSectionTitle,
  AcField,
  AcScreenHeader,
  AcSelectInput,
} from "@/components/accounting-mock/primitives"
import {
  acFxBalanceCheck,
  acFxFilters,
  acFxHeader,
  acFxJournalLines,
  acFxJournalRef,
  acFxJournalTotal,
  acFxMakerChecker,
  acFxPagination,
  acFxRows,
  acFxStats,
} from "@/lib/accounting-mock/fixtures-fx"
import { cn } from "@/lib/utils"

function FxStatusDot({ status }: { status: string }) {
  const isException = status === "Missing rate"
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#374151] whitespace-nowrap">
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          isException ? "bg-[#DC2626]" : "bg-[#2563EB]"
        )}
      />
      {status}
    </span>
  )
}

export function FxRevaluationScreen() {
  const [entity, setEntity] = useState(acFxFilters.entity)
  const [periodEnd, setPeriodEnd] = useState(acFxFilters.periodEnd)
  const [funcCurrency, setFuncCurrency] = useState(acFxFilters.functionalCurrency)
  const [rateSource, setRateSource] = useState(acFxFilters.rateSource)

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title={acFxHeader.title}
        meta={acFxHeader.meta}
        subtitle={acFxHeader.subtitle}
        actions={
          <AcButton
            variant="outline"
            className="h-9 px-4"
            onClick={() => toast.success("Data refreshed")}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </AcButton>
        }
      />

      <AcCard className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <AcField label="Entity" className="w-[220px]">
            <AcSelectInput
              value={entity}
              options={[acFxFilters.entity]}
              onChange={setEntity}
            />
          </AcField>
          <AcField label="Period end" className="w-[150px]">
            <AcSelectInput
              value={periodEnd}
              options={[acFxFilters.periodEnd]}
              onChange={setPeriodEnd}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          </AcField>
          <AcField label="Functional currency" className="w-[130px]">
            <AcSelectInput
              value={funcCurrency}
              options={["USD", "ZiG", "ZAR"]}
              onChange={setFuncCurrency}
            />
          </AcField>
          <AcField label="Rate source" className="w-[180px]">
            <AcSelectInput
              value={rateSource}
              options={[acFxFilters.rateSource]}
              onChange={setRateSource}
            />
          </AcField>
        </div>
      </AcCard>

      <AcCard className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {acFxStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p
                className={cn(
                  "text-[18px] font-bold tabular-nums leading-tight",
                  s.tone === "cobalt" ? "text-[#2563EB]" : s.tone === "exception" ? "text-[#DC2626]" : "text-[#0B1739]"
                )}
              >
                {s.value}
              </p>
              {s.sub && <p className="text-[10px] text-[#9CA3AF]">{s.sub}</p>}
            </div>
          ))}
        </div>
      </AcCard>

      <AcCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                <th className="px-3 py-2.5 text-left font-normal w-6" />
                <th className="px-3 py-2.5 text-left font-normal">Account</th>
                <th className="px-3 py-2.5 text-left font-normal">Account name</th>
                <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                <th className="px-3 py-2.5 text-right font-normal">Foreign balance</th>
                <th className="px-3 py-2.5 text-right font-normal">Book rate</th>
                <th className="px-3 py-2.5 text-right font-normal">Closing rate</th>
                <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">USD book value</th>
                <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">USD revalued value</th>
                <th className="px-3 py-2.5 text-right font-normal">Gain/(loss)</th>
                <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Proposed journal</th>
                <th className="px-3 py-2.5 text-left font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {acFxRows.map((r) => (
                <tr
                  key={r.account}
                  className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE]"
                  onClick={() => toast("Account detail", { description: r.name })}
                >
                  <td className="px-3 py-2.5">
                    <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
                  </td>
                  <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.account}</td>
                  <td className="px-3 py-2.5 text-[#374151]">{r.name}</td>
                  <td className="px-3 py-2.5 text-[#374151]">{r.currency}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.foreignBalance}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.bookRate}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.closingRate}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.usdBook}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.usdRevalued}</td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      r.loss ? "text-[#DC2626]" : "text-[#0B1739]"
                    )}
                  >
                    {r.gainLoss}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.journal !== "—" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast("Journal", { description: r.journal })
                        }}
                        className="text-[#2563EB] hover:underline"
                      >
                        {r.journal}
                      </button>
                    ) : (
                      <span className="text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <FxStatusDot status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EEF1F5]">
          <span className="text-[10px] text-[#9CA3AF]">
            Showing {acFxPagination.shown} of {acFxPagination.total} accounts
          </span>
          <AcButton
            variant="outline"
            className="h-8"
            onClick={() => toast("Download", { description: "Export FX revaluation (mock)" })}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </AcButton>
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <AcCardHeader
            title="Revaluation journal preview"
            action={
              <button
                type="button"
                onClick={() => toast("Journal", { description: acFxJournalRef })}
                className="text-[11px] text-[#2563EB] hover:underline"
              >
                {acFxJournalRef}
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 text-left font-normal w-8">#</th>
                  <th className="px-3 py-2.5 text-left font-normal">Account</th>
                  <th className="px-3 py-2.5 text-left font-normal">Account name</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Debit (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Credit (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal">Narration</th>
                </tr>
              </thead>
              <tbody>
                {acFxJournalLines.map((l) => (
                  <tr key={l.n} className="border-b border-[#EEF1F5]">
                    <td className="px-3 py-2.5 text-[#374151]">{l.n}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{l.account}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{l.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{l.debit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{l.credit}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{l.narration}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#EEF1F5]">
                  <td className="px-3 py-3 font-bold text-[#0B1739]" colSpan={3}>Total</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#2563EB]">{acFxJournalTotal.debit}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#2563EB]">{acFxJournalTotal.credit}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </AcCard>

        <AcCard className="w-full xl:w-[290px] shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEF1F5]">
            <AcDrawerSectionTitle>Balance check</AcDrawerSectionTitle>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#6B7280]">Debits</span>
                <span className="font-bold tabular-nums text-[#0B1739]">{acFxBalanceCheck.debits}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#6B7280]">Credits</span>
                <span className="font-bold tabular-nums text-[#0B1739]">{acFxBalanceCheck.credits}</span>
              </div>
            </div>
            {acFxBalanceCheck.balanced && (
              <div className="flex items-center gap-2 mt-3">
                <span className="h-6 w-6 rounded-full bg-[#2563EB] inline-flex items-center justify-center">
                  <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <span className="text-[12px] font-semibold text-[#2563EB]">Balanced</span>
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">Maker-checker</p>
            {acFxMakerChecker.map((m) => (
              <div key={m.label} className="py-1.5 border-b border-[#EEF1F5] last:border-0">
                <p className="text-[10px] text-[#9CA3AF]">{m.label}</p>
                <p className="text-[11px] text-[#0B1739]">
                  {m.name} <span className="text-[#6B7280]">— {m.at}</span>
                </p>
              </div>
            ))}
          </div>
        </AcCard>
      </div>
    </div>
  )
}
