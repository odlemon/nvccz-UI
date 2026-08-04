"use client"

import { useState } from "react"
import {
  ArrowLeftRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  FileText,
  List,
  Package,
  Play,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcKeyValue,
  AcScreenHeader,
  AcSelectInput,
  AcTabs,
} from "@/components/accounting-mock/primitives"
import {
  acFaDepPreview,
  acFaDepTotal,
  acFaDetail,
  acFaDocuments,
  acFaExceptions,
  acFaKpis,
  acFaPagination,
  acFaRows,
  acFaSubtitle,
  type AcFaKpi,
  type AcFaRow,
} from "@/lib/accounting-mock/fixtures-assets"
import { cn } from "@/lib/utils"

function FaKpiIcon({ kpi }: { kpi: AcFaKpi }) {
  const cls = "h-4 w-4"
  const icon =
    kpi.icon === "file" ? (
      <FileText className={cls} />
    ) : kpi.icon === "clock" ? (
      <Clock className={cls} />
    ) : kpi.icon === "box" ? (
      <Package className={cls} />
    ) : kpi.icon === "calc" ? (
      <Calculator className={cls} />
    ) : (
      <List className={cls} />
    )
  return (
    <span className="h-8 w-8 rounded-[7px] bg-[#F1F4FA] text-[#64748B] inline-flex items-center justify-center shrink-0">
      {icon}
    </span>
  )
}

/** Solid count badge used in the depreciation preview's Exceptions column. */
function FaExceptionBadge({ count, tone }: { count: string; tone?: "pending" | "exception" }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white",
        tone === "pending" ? "bg-[#F59E0B]" : "bg-[#DC2626]"
      )}
    >
      {count}
    </span>
  )
}

const TH = "px-3 py-2.5 text-left font-semibold text-[#0B1739] border-r border-[#EEF1F5] last:border-r-0 whitespace-nowrap"
const TD = "px-3 py-2.5 border-r border-[#EEF1F5] last:border-r-0"

export function FixedAssetsScreen() {
  const [tab, setTab] = useState("Overview")
  const [selected, setSelected] = useState("AST-IT-0087")
  const [panelOpen, setPanelOpen] = useState(true)
  const [page, setPage] = useState(1)

  const openRow = (row: AcFaRow) => {
    setSelected(row.assetId)
    setPanelOpen(true)
  }

  return (
    <div className="p-4 lg:p-5 flex flex-col xl:flex-row gap-4 items-start">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-4">
        <AcScreenHeader
          title="Fixed Asset Register"
          subtitle={acFaSubtitle}
          actions={
            <>
              <AcButton className="h-9 px-4" onClick={() => toast("Add asset")}>
                <Plus className="h-3.5 w-3.5" /> Add asset
              </AcButton>
              <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Transfer asset")}>
                <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
              </AcButton>
              <AcButton className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4" onClick={() => toast("Run July depreciation")}>
                <Play className="h-3.5 w-3.5" /> Run July depreciation
              </AcButton>
            </>
          }
        />

        <AcCard>
          <div className="flex flex-wrap items-stretch divide-x divide-[#EEF1F5]">
            {acFaKpis.map((k) => (
              <div key={k.id} className="flex-1 min-w-[150px] px-4 py-3 flex items-center gap-2.5">
                <FaKpiIcon kpi={k} />
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] truncate">{k.label}</p>
                  <p className="text-[17px] font-bold text-[#0B1739] tracking-tight leading-tight mt-0.5 tabular-nums">
                    {k.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AcCard>

        {/* Asset register table */}
        <AcCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#EEF1F5]">
                  <th className={TH}>Asset ID</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Custodian</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>
                    <span className="inline-flex items-center gap-1">
                      Acquisition date <ChevronsUpDown className="h-3 w-3 text-[#9CA3AF]" />
                    </span>
                  </th>
                  <th className={cn(TH, "text-right")}>Cost</th>
                  <th className={cn(TH, "text-right")}>Accum. depreciation</th>
                  <th className={cn(TH, "text-right")}>NBV</th>
                  <th className={TH}>Method</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {acFaRows.map((r) => {
                  const isSelected = selected === r.assetId
                  return (
                    <tr
                      key={r.assetId}
                      onClick={() => openRow(r)}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer",
                        isSelected ? "bg-[#EAF2FE]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className={cn(TD, "text-[#2563EB] font-medium whitespace-nowrap")}>{r.assetId}</td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.description}</td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.assetClass}</td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.custodian}</td>
                      <td className={cn(TD, "text-[#374151]")}>{r.location}</td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.acquisitionDate}</td>
                      <td className={cn(TD, "text-right tabular-nums text-[#0B1739] whitespace-nowrap")}>{r.cost}</td>
                      <td className={cn(TD, "text-right tabular-nums text-[#0B1739] whitespace-nowrap")}>{r.accumDepr}</td>
                      <td className={cn(TD, "text-right tabular-nums text-[#0B1739] whitespace-nowrap")}>{r.nbv}</td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.method}</td>
                      <td className={TD}>
                        <span className="inline-flex items-center gap-1.5 text-[#2563EB] whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#EEF1F5]">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#6B7280]">{acFaPagination.showing}</span>
              <AcSelectInput value="10 per page" options={["10 per page", "25 per page", "50 per page"]} className="w-[118px]" />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {acFaPagination.pages.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-[#9CA3AF]">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(Number(p))}
                    className={cn(
                      "h-7 min-w-[28px] px-1.5 rounded-md border text-[11px] font-medium",
                      page === Number(p)
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F8FC]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#374151]"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </AcCard>

        {/* July depreciation preview — exceptions summary is nested on the right */}
        <AcCard className="overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h2 className="text-[13px] font-bold text-[#0B1739]">July depreciation preview</h2>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              Preview of depreciation to be posted for the current period.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 px-4 pb-4 items-start">
            <div className="flex-1 min-w-0 overflow-x-auto rounded-md border border-[#EEF1F5]">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#F9FAFC] border-b border-[#EEF1F5]">
                    <th className={TH}>Asset class</th>
                    <th className={cn(TH, "text-right")}>Assets (count)</th>
                    <th className={cn(TH, "text-right")}>July charge (USD)</th>
                    <th className={cn(TH, "text-center")}>Exceptions</th>
                    <th className={TH}>Posting account</th>
                    <th className={TH}>Journal reference</th>
                  </tr>
                </thead>
                <tbody>
                  {acFaDepPreview.map((r) => (
                    <tr key={r.assetClass} className="border-b border-[#EEF1F5]">
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.assetClass}</td>
                      <td className={cn(TD, "text-right tabular-nums text-[#0B1739]")}>{r.count}</td>
                      <td className={cn(TD, "text-right tabular-nums text-[#0B1739]")}>{r.charge}</td>
                      <td className={cn(TD, "text-center")}>
                        {r.exceptionTone ? (
                          <FaExceptionBadge count={r.exceptions} tone={r.exceptionTone} />
                        ) : (
                          <span className="text-[#9CA3AF]">{r.exceptions}</span>
                        )}
                      </td>
                      <td className={cn(TD, "text-[#374151] whitespace-nowrap")}>{r.postingAccount}</td>
                      <td className={cn(TD, "text-[#2563EB] font-medium whitespace-nowrap")}>{r.journalRef}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={cn(TD, "font-bold text-[#0B1739]")}>TOTAL</td>
                    <td className={cn(TD, "text-right font-bold tabular-nums text-[#0B1739]")}>{acFaDepTotal.count}</td>
                    <td className={cn(TD, "text-right font-bold tabular-nums text-[#0B1739]")}>{acFaDepTotal.charge}</td>
                    <td className={cn(TD, "text-center")}>
                      <FaExceptionBadge count={acFaDepTotal.exceptions} tone="exception" />
                    </td>
                    <td className={cn(TD, "text-[#9CA3AF]")}>–</td>
                    <td className={cn(TD, "text-[#9CA3AF]")}>–</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full lg:w-[240px] shrink-0 space-y-2">
              <div className="rounded-md border border-[#EEF1F5] bg-[#FBFCFE] px-3 py-3">
                <p className="text-[11px] font-bold text-[#0B1739] mb-2">
                  Exceptions summary ({acFaExceptions.length})
                </p>
                <div className="space-y-2.5">
                  {acFaExceptions.map((e) => (
                    <div key={e.id} className="flex items-start gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full mt-[5px] shrink-0",
                          e.tone === "exception" ? "bg-[#DC2626]" : "bg-[#F59E0B]"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#0B1739]">{e.title}</p>
                        <p className="text-[10px] text-[#6B7280]">{e.detail}</p>
                        <button
                          type="button"
                          onClick={() => toast(e.title, { description: e.detail })}
                          className="text-[10px] font-medium text-[#2563EB] hover:underline"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8] h-8 w-full justify-center"
                onClick={() => toast.success("Depreciation run validated")}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Validate depreciation run
              </AcButton>
              <AcButton
                variant="cobaltOutline"
                className="h-8 w-full justify-center"
                onClick={() => toast("Export preview (PDF)")}
              >
                <FileText className="h-3.5 w-3.5" /> Export preview (PDF)
              </AcButton>
            </div>
          </div>
        </AcCard>
      </div>

      {/* Full-height detail rail */}
      {panelOpen && (
        <AcCard className="w-full xl:w-[360px] shrink-0 overflow-hidden self-stretch">
          <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#0B1739]">{acFaDetail.assetId}</p>
              <p className="text-[14px] font-bold text-[#0B1739] mt-0.5">{acFaDetail.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full bg-[#EFF6FF] text-[10px] font-medium text-[#2563EB]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                {acFaDetail.status}
              </span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close panel"
                className="text-[#9CA3AF] hover:text-[#0B1739]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pt-3">
            <AcTabs
              tabs={["Overview", "Documents (3)", "Transfers (2)", "Audit log (6)"]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="px-4 py-3 border-b border-[#EEF1F5]">
            <AcKeyValue grid label="Serial number" value={acFaDetail.serial} />
            <AcKeyValue grid label="Asset tag" value={acFaDetail.assetTag} />
            <AcKeyValue grid label="Custodian" value={acFaDetail.custodian} />
            <AcKeyValue grid label="Location" value={acFaDetail.location} />
            <AcKeyValue grid label="Acquisition date" value={acFaDetail.acquisitionDate} />
            <AcKeyValue grid label="In-service date" value={acFaDetail.inServiceDate} />
          </div>

          <div className="px-4 py-3 border-b border-[#EEF1F5]">
            <AcKeyValue grid label="Cost" value={acFaDetail.cost} />
            <AcKeyValue grid label="Useful life" value={acFaDetail.usefulLife} />
            <AcKeyValue grid label="Depreciation method" value={acFaDetail.method} />
            <AcKeyValue grid label="Residual value" value={acFaDetail.residual} />
            <AcKeyValue grid label="Monthly depreciation" value={acFaDetail.monthlyDepr} />
            <AcKeyValue grid label="Accumulated depreciation" value={acFaDetail.accumDepr} />
            <AcKeyValue grid strong label="Net book value" value={acFaDetail.nbv} />
          </div>

          <div className="px-4 py-3">
            <p className="text-[11px] font-bold text-[#0B1739] mb-2">Quick links</p>
            <div className="space-y-2">
              {acFaDocuments.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toast(d)}
                  className="flex items-center gap-2 text-[11px] text-[#2563EB] hover:underline w-full text-left"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                  {d}
                </button>
              ))}
            </div>
          </div>
        </AcCard>
      )}
    </div>
  )
}
