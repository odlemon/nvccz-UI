"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Landmark,
  Layers,
  Percent,
  Play,
  Plus,
  TrendingUp,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcDrawerSectionTitle,
  AcKeyValue,
  AcScreenHeader,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acStiAccretion,
  acStiApprovals,
  acStiDetail,
  acStiDocuments,
  acStiGlMapping,
  acStiKpis,
  acStiLadder,
  acStiLimits,
  acStiPagination,
  acStiRows,
  type AcStiKpi,
  type AcStiRow,
  type AcStiStatus,
} from "@/lib/accounting-mock/fixtures-sti"
import { cn } from "@/lib/utils"

function StiKpiIcon({ kpi }: { kpi: AcStiKpi }) {
  const cls = "h-3.5 w-3.5"
  const bg = kpi.tone === "pending" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#DBEAFE] text-[#2563EB]"
  const icon =
    kpi.icon === "bank" ? (
      <Landmark className={cls} />
    ) : kpi.icon === "percent" ? (
      <Percent className={cls} />
    ) : kpi.icon === "layers" ? (
      <Layers className={cls} />
    ) : kpi.icon === "trend" ? (
      <TrendingUp className={cls} />
    ) : (
      <AlertTriangle className={cls} />
    )
  return <span className={cn("h-8 w-8 rounded-full inline-flex items-center justify-center shrink-0", bg)}>{icon}</span>
}

function stiStatusTone(status: AcStiStatus): "posted" | "pending" | "neutral" {
  if (status === "Maturing soon") return "pending"
  if (status === "New") return "neutral"
  return "posted"
}

export function ShortTermInvestmentsScreen() {
  const [ladderMode, setLadderMode] = useState<"Principal" | "Carrying value">("Principal")
  const [selected, setSelected] = useState("RBZ-TB-182-2407")
  const [panelOpen, setPanelOpen] = useState(true)

  const openRow = (row: AcStiRow) => {
    setSelected(row.instrument)
    setPanelOpen(true)
  }

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title="Short-Term Investments"
        actions={
          <>
            <AcButton className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4" onClick={() => toast("New placement")}>
              <Plus className="h-3.5 w-3.5" /> New placement
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Record maturity")}>
              <Clock className="h-3.5 w-3.5" /> Record maturity
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Run interest accrual")}>
              <Play className="h-3.5 w-3.5" /> Run interest accrual
            </AcButton>
          </>
        }
      />

      <AcCard>
        <div className="flex flex-wrap items-stretch divide-x divide-[#EEF1F5]">
          {acStiKpis.map((k) => (
            <div key={k.id} className="flex-1 min-w-[130px] px-4 py-3 flex items-center gap-3">
              <StiKpiIcon kpi={k} />
              <div>
                <p className="text-[10px] text-[#6B7280]">{k.label}</p>
                <p
                  className={cn(
                    "text-[18px] font-bold tracking-tight leading-none mt-0.5 tabular-nums",
                    k.tone === "pending" ? "text-[#F59E0B]" : "text-[#0B1739]"
                  )}
                >
                  {k.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <AcCard className="overflow-hidden">
            <AcCardHeader
              title="Maturity ladder (Principal)"
              action={
                <div className="inline-flex rounded-full border border-[#E5E7EB] p-0.5">
                  {(["Principal", "Carrying value"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLadderMode(m)}
                      className={cn(
                        "h-7 px-3 rounded-full text-[10px] font-semibold transition-colors",
                        ladderMode === m ? "bg-[#2563EB] text-white" : "text-[#6B7280] hover:text-[#0B1739]"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="h-[200px] px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acStiLadder} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#EEF1F5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                  <YAxis
                    domain={[0, 3000]}
                    ticks={[0, 1000, 2000, 3000]}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}M`}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={36}>
                    {acStiLadder.map((entry) => (
                      <Cell key={entry.month} fill={entry.tone === "pending" ? "#F59E0B" : "#2563EB"} />
                    ))}
                    <LabelList dataKey="label" position="top" style={{ fontSize: 10, fill: "#0B1739", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Investments" />
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5] bg-[#F9FAFB]">
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Instrument</th>
                    <th className="px-3 py-2.5 text-left font-normal">Issuer</th>
                    <th className="px-3 py-2.5 text-left font-normal">Type</th>
                    <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Trade date</th>
                    <th className="px-3 py-2.5 text-left font-normal">Maturity</th>
                    <th className="px-3 py-2.5 text-right font-normal">Principal</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Rate / Yield</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Accrued interest</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Carrying value</th>
                    <th className="px-3 py-2.5 text-left font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {acStiRows.map((r) => {
                    const isSelected = selected === r.instrument
                    return (
                      <tr
                        key={r.instrument}
                        onClick={() => openRow(r)}
                        className={cn(
                          "border-b border-[#EEF1F5] cursor-pointer",
                          isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#F9FBFE]"
                        )}
                      >
                        <td className="px-3 py-2.5 text-[#2563EB] font-medium whitespace-nowrap">{r.instrument}</td>
                        <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.issuer}</td>
                        <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.type}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex px-1.5 py-[1px] rounded bg-[#DBEAFE] text-[10px] font-medium text-[#2563EB]">
                            {r.currency}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.tradeDate}</td>
                        <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.maturity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.principal}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.rate}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.accrued}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.carrying}</td>
                        <td className="px-3 py-2.5">
                          <AcStatusPill label={r.status} tone={stiStatusTone(r.status)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#EEF1F5]">
              <span className="text-[10px] text-[#9CA3AF]">{acStiPagination.showing}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                  Rows per page
                  <AcSelectInput value="25" options={["10", "25", "50"]} className="w-[52px]" />
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]" aria-label="Previous">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="h-7 min-w-[28px] px-1.5 rounded-md border border-[#2563EB] bg-[#EFF6FF] text-[11px] font-medium text-[#2563EB]">
                    1
                  </button>
                  <button type="button" className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#9CA3AF]" aria-label="Next">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </AcCard>
        </div>

        {panelOpen && (
          <AcCard className="w-full xl:w-[340px] shrink-0 overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-[13px] font-bold text-[#0B1739] truncate">{acStiDetail.instrument}</h2>
                <AcStatusPill label={acStiDetail.status} tone="posted" />
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close panel" className="text-[#9CA3AF] hover:text-[#0B1739] shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5] grid grid-cols-2 gap-x-3 gap-y-1">
              <AcKeyValue label="Instrument" value={acStiDetail.instrument} />
              <AcKeyValue label="Issuer" value={acStiDetail.issuer} />
              <AcKeyValue label="Currency" value={acStiDetail.currency} />
              <AcKeyValue label="Principal" value={acStiDetail.principal} />
              <AcKeyValue label="Purchase price" value={acStiDetail.purchasePrice} />
              <AcKeyValue label="Yield" value={acStiDetail.yield} />
              <AcKeyValue label="Trade date" value={acStiDetail.tradeDate} />
              <AcKeyValue label="Maturity date" value={acStiDetail.maturity} />
              <AcKeyValue label="Days remaining" value={acStiDetail.daysRemaining} />
              <AcKeyValue label="Carrying value" value={acStiDetail.carrying} strong />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Interest / accretion schedule (Actual / 365)</AcDrawerSectionTitle>
              <table className="w-full text-[10px] mt-2">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="py-1.5 text-left font-normal">Date</th>
                    <th className="py-1.5 text-left font-normal">Description</th>
                    <th className="py-1.5 text-right font-normal">Days</th>
                    <th className="py-1.5 text-right font-normal">Interest</th>
                    <th className="py-1.5 text-right font-normal">Accretion</th>
                    <th className="py-1.5 text-right font-normal">Carrying</th>
                  </tr>
                </thead>
                <tbody>
                  {acStiAccretion.map((a) => (
                    <tr key={`${a.date}-${a.description}`} className="border-b border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151] whitespace-nowrap">{a.date}</td>
                      <td className="py-1.5 text-[#374151]">{a.description}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{a.days}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{a.interest}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{a.accretion}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{a.carrying}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Counterparty &amp; custody</AcDrawerSectionTitle>
              <AcKeyValue label="Counterparty" value={acStiDetail.counterparty} />
              <AcKeyValue label="Custody account" value={acStiDetail.custodyAccount} />
              <AcKeyValue label="Settlement account" value={acStiDetail.settlementAccount} />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>GL mapping</AcDrawerSectionTitle>
              {acStiGlMapping.map((g) => (
                <AcKeyValue key={g.label} label={g.label} value={g.value} />
              ))}
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Issuer limits &amp; concentration</AcDrawerSectionTitle>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="py-1.5 text-left font-normal">Metric</th>
                    <th className="py-1.5 text-right font-normal">Limit</th>
                    <th className="py-1.5 text-right font-normal">Current</th>
                    <th className="py-1.5 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {acStiLimits.map((l) => (
                    <tr key={l.metric} className="border-b border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151]">{l.metric}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{l.limit}</td>
                      <td className="py-1.5 text-right tabular-nums text-[#0B1739]">{l.current}</td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              l.status === "Attention" ? "bg-[#F59E0B]" : "bg-[#2563EB]"
                            )}
                          />
                          <span className="text-[#374151]">{l.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <AcDrawerSectionTitle>Evidence documents</AcDrawerSectionTitle>
                <button type="button" onClick={() => toast("All documents")} className="text-[10px] font-medium text-[#2563EB] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {acStiDocuments.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => toast(d.name)}
                    className="flex items-center gap-2 w-full text-left hover:bg-[#F5F8FC] rounded px-1 py-1"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
                    <span className="text-[11px] text-[#2563EB] flex-1 truncate">{d.name}</span>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{d.size}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <AcDrawerSectionTitle>Approval history</AcDrawerSectionTitle>
                <button type="button" onClick={() => toast("Approval history")} className="text-[10px] font-medium text-[#2563EB] hover:underline">
                  View all
                </button>
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="py-1.5 text-left font-normal">Action</th>
                    <th className="py-1.5 text-left font-normal">By</th>
                    <th className="py-1.5 text-left font-normal">Role</th>
                    <th className="py-1.5 text-left font-normal whitespace-nowrap">Date &amp; time</th>
                  </tr>
                </thead>
                <tbody>
                  {acStiApprovals.map((a) => (
                    <tr key={`${a.action}-${a.datetime}`} className="border-b border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151]">{a.action}</td>
                      <td className="py-1.5 text-[#374151]">{a.by}</td>
                      <td className="py-1.5 text-[#374151]">{a.role}</td>
                      <td className="py-1.5 text-[#374151] whitespace-nowrap">{a.datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AcCard>
        )}
      </div>
    </div>
  )
}
