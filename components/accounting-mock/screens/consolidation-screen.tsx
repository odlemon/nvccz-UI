"use client"

import { useState } from "react"
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  acConsolidatedTb,
  acConsolidationEntities,
  acConsolidationEntityCount,
  acConsolidationHeader,
  acConsolidationStats,
  acConsolidationTabs,
  acEliminationApproval,
  acEliminationComments,
  acEliminationDrawer,
  acEliminationEvidence,
  acEliminationFx,
  acEliminationInvoices,
  acEliminationJournal,
  acEliminationReciprocal,
  acIcMatches,
  acIcPagination,
} from "@/lib/accounting-mock/fixtures-consolidation"
import { cn } from "@/lib/utils"

function ConsolDonut({ value }: { value: number }) {
  const r = 28
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[64px] w-[64px] shrink-0">
      <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="35"
          cy="35"
          r={r}
          fill="none"
          stroke="#2563EB"
          strokeWidth="8"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] font-bold text-[#2563EB]">{value}%</span>
      </div>
    </div>
  )
}

function MatchDot({ state }: { state: string }) {
  const tones: Record<string, string> = {
    Exception: "bg-[#DC2626]",
    Matched: "bg-[#2563EB]",
    Review: "bg-[#F59E0B]",
    "N/A": "bg-[#9CA3AF]",
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#374151] whitespace-nowrap">
      <span className={cn("h-2 w-2 rounded-full shrink-0", tones[state] ?? "bg-[#9CA3AF]")} />
      {state}
    </span>
  )
}

export function ConsolidationScreen() {
  const [entityTab, setEntityTab] = useState(acConsolidationTabs[0])
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [selectedIc, setSelectedIc] = useState(acIcMatches[0].id)
  const [icPage, setIcPage] = useState(1)
  const [pairFilter, setPairFilter] = useState("All pairs")
  const [accountFilter, setAccountFilter] = useState("All accounts")
  const [matchFilter, setMatchFilter] = useState("All match states")

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title={acConsolidationHeader.title}
        meta={acConsolidationHeader.meta}
        actions={
          <>
            <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Import trial balances")}>
              Import trial balances
            </AcButton>
            <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Run eliminations")}>
              Run eliminations
            </AcButton>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
              onClick={() => toast("Generate statements")}
            >
              Generate statements <ChevronDown className="h-3 w-3" />
            </AcButton>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {acConsolidationTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEntityTab(t)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-medium border transition-colors",
              entityTab === t
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F5F8FC]"
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            {t}
          </button>
        ))}
      </div>

      <AcCard className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {acConsolidationStats.map((s) => {
            if (s.donut) {
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <ConsolDonut value={s.donut} />
                  <div>
                    <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                    <p className="text-[11px] font-semibold text-[#2563EB]">{s.sub}</p>
                  </div>
                </div>
              )
            }
            return (
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
            )
          })}
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <AcCard className="overflow-hidden">
            <AcCardHeader title="Entity status matrix" />
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal">Entity</th>
                    <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                    <th className="px-3 py-2.5 text-left font-normal">Trial balance</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Intercompany balance</th>
                    <th className="px-3 py-2.5 text-right font-normal">Differences</th>
                    <th className="px-3 py-2.5 text-right font-normal">Eliminations</th>
                    <th className="px-3 py-2.5 text-left font-normal">Status</th>
                    <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {acConsolidationEntities.map((e) => (
                    <tr key={e.entity} className="border-b border-[#EEF1F5]">
                      <td className="px-3 py-2.5 text-[#374151]">{e.entity}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{e.currency}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[#374151]">
                          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                          {e.trialBalance}
                        </span>
                        <p className="text-[10px] text-[#9CA3AF]">{e.trialBalanceAt}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{e.icBalance}</td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums",
                          e.diffRed ? "text-[#DC2626]" : "text-[#0B1739]"
                        )}
                      >
                        {e.differences}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{e.eliminations}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[#374151]">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              e.statusTone === "pending" ? "bg-[#F59E0B]" : "bg-[#2563EB]"
                            )}
                          />
                          {e.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{e.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2 text-[10px] text-[#9CA3AF]">
              Showing {acConsolidationEntityCount.shown} of {acConsolidationEntityCount.total} entities
            </p>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Intercompany matching" />
            <div className="px-4 py-2 flex flex-wrap items-center gap-2 border-b border-[#EEF1F5]">
              <AcSelectInput
                value={pairFilter}
                options={["All pairs", "MCP ↔ MA", "MCP ↔ ZGF"]}
                onChange={setPairFilter}
                className="w-[130px]"
              />
              <AcSelectInput
                value={accountFilter}
                options={["All accounts", "Management fees", "Service fees"]}
                onChange={setAccountFilter}
                className="w-[130px]"
              />
              <AcSelectInput
                value={matchFilter}
                options={["All match states", "Exception", "Matched", "Review"]}
                onChange={setMatchFilter}
                className="w-[140px]"
              />
              <AcButton variant="outline" onClick={() => toast("Filters")}>
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
              </AcButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal">Counterparty pair</th>
                    <th className="px-3 py-2.5 text-left font-normal">Account</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Entity A balance</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Entity B balance</th>
                    <th className="px-3 py-2.5 text-right font-normal">Difference</th>
                    <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                    <th className="px-3 py-2.5 text-left font-normal">Match state</th>
                    <th className="px-3 py-2.5 text-left font-normal">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {acIcMatches.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => {
                        setSelectedIc(m.id)
                        setDrawerOpen(true)
                      }}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer",
                        selectedIc === m.id ? "bg-[#DBEAFE]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className="px-3 py-2.5 text-[#2563EB]">{m.pair}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{m.account}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{m.entityA}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{m.entityB}</td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums",
                          m.diffRed ? "text-[#DC2626]" : "text-[#0B1739]"
                        )}
                      >
                        {m.difference}
                      </td>
                      <td className="px-3 py-2.5 text-[#374151]">{m.currency}</td>
                      <td className="px-3 py-2.5"><MatchDot state={m.matchState} /></td>
                      <td className="px-3 py-2.5 text-[#374151]">{m.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EEF1F5]">
              <span className="text-[10px] text-[#9CA3AF]">
                Showing {acIcPagination.shown} of {acIcPagination.total} matches
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={icPage <= 1}
                  onClick={() => setIcPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: acIcPagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIcPage(p)}
                    className={cn(
                      "h-7 w-7 rounded-md text-[11px] font-medium",
                      icPage === p ? "bg-[#2563EB] text-white" : "border border-[#E5E7EB] text-[#374151]"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={icPage >= acIcPagination.pages}
                  onClick={() => setIcPage((p) => Math.min(acIcPagination.pages, p + 1))}
                  className="h-7 w-7 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </AcCard>

          <AcCard className="overflow-hidden">
            <AcCardHeader title="Consolidated trial balance preview" />
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                    <th className="px-3 py-2.5 text-left font-normal">Account group</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Local TB (sum) USD</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Adjustments USD</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Eliminations USD</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Consolidated USD</th>
                    <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Variance USD</th>
                    <th className="px-3 py-2.5 text-left font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {acConsolidatedTb.map((r) => (
                    <tr key={r.group} className="border-b border-[#EEF1F5]">
                      <td className={cn("px-3 py-2.5", r.strong ? "font-bold text-[#0B1739]" : "text-[#374151]")}>
                        {r.group}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.localTb}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.adjustments}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.eliminations}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.consolidated}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.variance}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[#374151]">
                          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AcCard>
        </div>

        {drawerOpen && (
          <AcCard className="w-full xl:w-[290px] shrink-0 overflow-hidden">
            <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
              <div>
                <p className="text-[13px] font-bold text-[#0B1739]">{acEliminationDrawer.ref}</p>
                <AcStatusPill label={acEliminationDrawer.status} tone="exception" />
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close elimination drawer"
                className="text-[#9CA3AF] hover:text-[#0B1739]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <p className="text-[10px] text-[#9CA3AF]">Counterparty pair</p>
              <p className="text-[11px] text-[#374151]">{acEliminationDrawer.pair}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-2">Account</p>
              <p className="text-[11px] text-[#374151]">{acEliminationDrawer.account}</p>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-[#9CA3AF]">Difference</p>
                <p className="text-[14px] font-bold text-[#DC2626] tabular-nums">
                  {acEliminationDrawer.difference} {acEliminationDrawer.differenceCurrency}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Source invoices</AcDrawerSectionTitle>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">{acEliminationInvoices.entityA.entity}</p>
                  <p className="text-[11px] font-medium text-[#0B1739]">{acEliminationInvoices.entityA.invoice}</p>
                  <p className="text-[10px] text-[#6B7280]">{acEliminationInvoices.entityA.date}</p>
                  <p className="text-[11px] tabular-nums text-[#0B1739]">{acEliminationInvoices.entityA.amount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">{acEliminationInvoices.entityB.entity}</p>
                  <p className="text-[11px] font-medium text-[#0B1739]">{acEliminationInvoices.entityB.invoice}</p>
                  <p className="text-[10px] text-[#6B7280]">{acEliminationInvoices.entityB.date}</p>
                  <p className="text-[11px] tabular-nums text-[#0B1739]">{acEliminationInvoices.entityB.amount}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Reciprocal accounts</AcDrawerSectionTitle>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">Entity A account</p>
                  <p className="text-[11px] text-[#374151]">{acEliminationReciprocal.entityA.account}</p>
                  <p className="text-[11px] tabular-nums text-[#0B1739]">{acEliminationReciprocal.entityA.amount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">Entity B account</p>
                  <p className="text-[11px] text-[#374151]">{acEliminationReciprocal.entityB.account}</p>
                  <p className="text-[11px] tabular-nums text-[#0B1739]">{acEliminationReciprocal.entityB.amount}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>FX impact</AcDrawerSectionTitle>
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-[#6B7280]">USD impact</span>
                <span className="tabular-nums text-[#0B1739]">{acEliminationFx.amount}</span>
              </div>
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-[#6B7280]">{acEliminationFx.rateLabel}</span>
                <span className="tabular-nums text-[#0B1739]">{acEliminationFx.zigAmount}</span>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Proposed elimination journal (USD)</AcDrawerSectionTitle>
              <table className="w-full text-[10px] mt-2">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1 text-left font-normal">Account</th>
                    <th className="py-1 text-left font-normal">Description</th>
                    <th className="py-1 text-right font-normal">Debit</th>
                    <th className="py-1 text-right font-normal">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {acEliminationJournal.map((l) => (
                    <tr key={l.account}>
                      <td className="py-1 text-[#374151]">{l.account}</td>
                      <td className="py-1 text-[#374151]">{l.description}</td>
                      <td className="py-1 text-right tabular-nums text-[#0B1739]">{l.debit}</td>
                      <td className="py-1 text-right tabular-nums text-[#0B1739]">{l.credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Evidence</AcDrawerSectionTitle>
              {acEliminationEvidence.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  onClick={() => toast("Evidence", { description: e.name })}
                  className="flex items-center justify-between w-full py-1 text-[11px] text-[#2563EB] hover:underline"
                >
                  {e.name}
                  <span className="text-[#9CA3AF]">{e.size}</span>
                </button>
              ))}
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Comments</AcDrawerSectionTitle>
              <p className="text-[11px] text-[#6B7280]">{acEliminationComments}</p>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Approval chain</AcDrawerSectionTitle>
              {acEliminationApproval.map((a) => (
                <div key={a.name} className="flex items-center justify-between py-1.5 border-b border-[#EEF1F5] last:border-0">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0B1739]">{a.name} ({a.role})</p>
                    {a.at && <p className="text-[10px] text-[#9CA3AF]">{a.at}</p>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-[#374151]">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        a.tone === "cobalt" && "bg-[#2563EB]",
                        a.tone === "pending" && "bg-[#F59E0B]",
                        a.tone === "faint" && "bg-[#9CA3AF]"
                      )}
                    />
                    {a.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-4">
              <AcButton
                variant="cobaltOutline"
                className="flex-1"
                onClick={() => toast("Request counterparty correction")}
              >
                Request counterparty correction
              </AcButton>
              <AcButton className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={() => toast("Post elimination")}>
                Post elimination
              </AcButton>
            </div>
          </AcCard>
        )}

        {!drawerOpen && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            aria-label="Open elimination drawer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
