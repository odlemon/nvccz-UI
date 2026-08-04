"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Info,
  Maximize2,
  MoreVertical,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcField,
  AcScreenHeader,
  AcSelectInput,
} from "@/components/accounting-mock/primitives"
import {
  acPlRows,
  acPlTitle,
  acReportControls,
  acReportList,
  acReportMeta,
  acReportSet,
  acReportSettings,
} from "@/lib/accounting-mock/fixtures-reports"
import { cn } from "@/lib/utils"

const varianceTones = {
  cobalt: "text-[#2563EB]",
  amber: "text-[#F59E0B]",
  red: "text-[#DC2626]",
}

const controlIcons = {
  ok: { bg: "bg-[#2563EB]", icon: <Check className="h-2.5 w-2.5" strokeWidth={3} /> },
  warning: { bg: "bg-[#F59E0B]", icon: <AlertTriangle className="h-2.5 w-2.5" strokeWidth={3} /> },
  info: { bg: "bg-[#F59E0B]", icon: <Info className="h-2.5 w-2.5" strokeWidth={3} /> },
}

export function FinancialReportsScreen() {
  const [report, setReport] = useState("Profit & Loss")
  const [settings, setSettings] = useState<Record<string, string>>(() =>
    Object.fromEntries(acReportSettings.map((s) => [s.label, s.value]))
  )
  const [reportSet, setReportSet] = useState(acReportSet.value)

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div>
        <AcScreenHeader
          title="Financial Reports"
          actions={
            <>
              <AcButton
                variant="outline"
                className="h-9 px-4"
                onClick={() => toast("Generate PDF", { description: `${report} · ${reportSet} (mock)` })}
              >
                <FileText className="h-3.5 w-3.5 text-[#6B7280]" /> Generate PDF
              </AcButton>
              <AcButton
                variant="outline"
                className="h-9 px-4"
                onClick={() => toast("Export Excel", { description: `${report} workbook (mock)` })}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#6B7280]" /> Export Excel
              </AcButton>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
                onClick={() => toast.success("Submitted for approval", { description: "Sent to Rudo Chikore for review." })}
              >
                Submit for approval
              </AcButton>
            </>
          }
        />
        <div className="mt-1 flex items-center gap-1 text-[11px]">
          <span className="text-[#6B7280]">{acReportSet.label}</span>
          <div className="relative inline-flex items-center">
            <select
              value={reportSet}
              onChange={(e) => setReportSet(e.target.value)}
              className="appearance-none bg-transparent pr-5 text-[11px] font-semibold text-[#0B1739] outline-none cursor-pointer"
            >
              {acReportSet.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-[#6B7280]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Report list rail */}
        <AcCard className="w-full xl:w-[196px] shrink-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#EEF1F5]">
            <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6B7280]">REPORTS</p>
          </div>
          <div className="py-1 flex-1">
            {acReportList.map((r) => {
              const active = r === report
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReport(r)
                    toast(r, { description: "Report view switched (mock)" })
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-left text-[11px] transition-colors",
                    active
                      ? "bg-[#DBEAFE] font-semibold text-[#2563EB]"
                      : "text-[#374151] hover:bg-[#F5F8FC]"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      active ? "bg-[#2563EB]" : "bg-transparent"
                    )}
                  />
                  <span className="truncate">{r}</span>
                </button>
              )
            })}
          </div>
          <div className="p-3 border-t border-[#EEF1F5]">
            <AcButton
              variant="outline"
              className="w-full h-9"
              onClick={() => toast("New custom report", { description: "Report builder (mock)" })}
            >
              <Plus className="h-3.5 w-3.5 text-[#6B7280]" /> New custom report
            </AcButton>
          </div>
        </AcCard>

        {/* Statement */}
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <AcCardHeader
            title={acPlTitle}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Expand statement"
                  onClick={() => toast("Full screen", { description: "Expanded statement view (mock)" })}
                  className="text-[#0B1739] hover:text-[#2563EB]"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Statement options"
                  onClick={() => toast("Statement options")}
                  className="text-[#0B1739] hover:text-[#2563EB]"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#EEF1F5] text-[10px] tracking-[0.06em] text-[#6B7280] align-bottom">
                  <th className="px-3 py-2.5 text-left font-normal">ACCOUNT</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">
                    JULY ACTUAL
                    <span className="block">USD</span>
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">
                    JULY BUDGET
                    <span className="block">USD</span>
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">
                    VARIANCE
                    <span className="block">USD</span>
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">
                    YTD ACTUAL
                    <span className="block">USD</span>
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">
                    YTD BUDGET
                    <span className="block">USD</span>
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">VARIANCE %</th>
                </tr>
              </thead>
              <tbody>
                {acPlRows.map((r) => {
                  const bold = r.kind !== "child"
                  return (
                    <tr
                      key={r.account}
                      className={cn(
                        "border-b border-[#EEF1F5]",
                        r.kind === "total" && "bg-[#DBEAFE]",
                        r.kind === "subtotal" && "bg-[#F3F7FD]",
                        r.kind === "child" && "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td
                        className={cn(
                          "px-3 py-2.5 whitespace-nowrap",
                          bold ? "font-bold text-[#0B1739]" : "text-[#374151]"
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {r.kind === "group" ? (
                            <ChevronDown className="h-3 w-3 text-[#6B7280]" />
                          ) : (
                            <span className="w-3 shrink-0" />
                          )}
                          {r.account}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                          bold ? "font-bold text-[#0B1739]" : "text-[#374151]"
                        )}
                      >
                        {r.julyActual}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                          bold ? "font-bold text-[#0B1739]" : "text-[#374151]"
                        )}
                      >
                        {r.julyBudget}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-semibold",
                          varianceTones[r.varianceTone],
                          bold && "font-bold"
                        )}
                      >
                        {r.variance}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                          bold ? "font-bold text-[#0B1739]" : "text-[#374151]"
                        )}
                      >
                        {r.ytdActual}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                          bold ? "font-bold text-[#0B1739]" : "text-[#374151]"
                        )}
                      >
                        {r.ytdBudget}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap text-[#2563EB]",
                          bold ? "font-bold" : "font-semibold"
                        )}
                      >
                        {r.variancePct}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AcCard>

        {/* Report settings */}
        <AcCard className="w-full xl:w-[264px] shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B1739"
              strokeWidth="2"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
            </svg>
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">Report settings</h2>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {acReportSettings.map((s) => (
              <AcField key={s.label} label={s.label}>
                <AcSelectInput
                  value={settings[s.label]}
                  options={s.options}
                  onChange={(v) => setSettings((prev) => ({ ...prev, [s.label]: v }))}
                />
              </AcField>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-[#EEF1F5]">
            <h3 className="text-[12px] font-bold text-[#0B1739] mb-2.5">Report controls</h3>
            <div className="space-y-2.5">
              {acReportControls.map((c) => (
                <div key={c.title} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-[1px] h-4 w-4 shrink-0 rounded-full inline-flex items-center justify-center text-white",
                      controlIcons[c.tone].bg
                    )}
                  >
                    {controlIcons[c.tone].icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#0B1739] leading-tight">{c.title}</p>
                    <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">{c.sub}</p>
                  </div>
                  {c.value && (
                    <span className="text-[10px] tabular-nums text-[#0B1739] whitespace-nowrap">{c.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 border-t border-[#EEF1F5]">
            {acReportMeta.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-[11px] text-[#374151]">{m.label}</span>
                <span className="text-[11px] font-semibold text-[#0B1739] text-right">{m.value}</span>
              </div>
            ))}
          </div>
        </AcCard>
      </div>
    </div>
  )
}
