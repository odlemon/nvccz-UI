"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Settings,
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
  acGlAccount,
  acGlAccountDetails,
  acGlAudit,
  acGlRows,
  acGlTotals,
  acGlTree,
} from "@/lib/accounting-mock/fixtures-gl"
import { cn } from "@/lib/utils"

export function GeneralLedgerScreen() {
  const router = useRouter()
  const [tab, setTab] = useState("Transactions")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(`${acGlAccount.code}-${acGlAccount.name}`)
  const [treeOpen, setTreeOpen] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <AcScreenHeader
        title="General Ledger"
        actions={
          <>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
              onClick={() => {
                toast("New journal")
                router.push("/accounting-v2/journals/new")
              }}
            >
              <Plus className="h-3.5 w-3.5" /> New journal
            </AcButton>
            <AcButton variant="outline" className="h-9 px-4" onClick={() => toast("Export", { description: "CSV / XLSX (mock)" })}>
              Export <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
            </AcButton>
          </>
        }
      />

      <AcTabs tabs={["Transactions", "Trial Balance", "Chart of Accounts"]} active={tab} onChange={setTab} />

      <AcCard className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <AcField label="Account" className="w-[150px]">
            <AcSelectInput value="All accounts" options={["All accounts", "Cash & Cash Equivalents", "Receivables"]} />
          </AcField>
          <AcField label="Source" className="w-[130px]">
            <AcSelectInput value="All sources" options={["All sources", "Journal", "AP Payment", "AR Receipt", "Payroll"]} />
          </AcField>
          <AcField label="Department" className="w-[150px]">
            <AcSelectInput value="All departments" options={["All departments", "Finance", "Operations", "Sales", "HR", "IT"]} />
          </AcField>
          <AcField label="Project" className="w-[130px]">
            <AcSelectInput value="All projects" options={["All projects"]} />
          </AcField>
          <AcField label="Date range" className="w-[210px]">
            <AcSelectInput
              value="01 Jul 2026 – 31 Jul 2026"
              options={["01 Jul 2026 – 31 Jul 2026", "01 Jun 2026 – 30 Jun 2026"]}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          </AcField>
          <AcField label="Status" className="w-[130px]">
            <AcSelectInput value="All statuses" options={["All statuses", "Posted", "Pending"]} />
          </AcField>
          <AcSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reference or description"
            className="flex-1 min-w-[200px]"
          />
          <AcButton variant="outline" onClick={() => toast("Filters", { description: "Advanced filter drawer (mock)" })}>
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Filters
          </AcButton>
          <button
            type="button"
            onClick={() => {
              setSearch("")
              toast("Filters cleared")
            }}
            className="h-8 text-[11px] font-medium text-[#2563EB] hover:underline"
          >
            Clear all
          </button>
        </div>
      </AcCard>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Chart of accounts tree */}
        {treeOpen ? (
          <AcCard className="w-full xl:w-[300px] shrink-0 overflow-hidden flex flex-col">
            <AcCardHeader
              title="Chart of Accounts"
              action={
                <button
                  type="button"
                  onClick={() => setTreeOpen(false)}
                  aria-label="Collapse chart of accounts"
                  className="text-[#9CA3AF] hover:text-[#0B1739]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              }
            />
            <div className="py-2 flex-1 overflow-y-auto max-h-[560px]">
              {acGlTree.map((node) => {
                const id = `${node.code}-${node.name}`
                const isSelected = selected === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(id)}
                    className={cn(
                      "w-full flex items-center gap-1.5 pr-3 py-1.5 text-left border-l-2 transition-colors",
                      isSelected
                        ? "bg-[#DBEAFE] border-[#2563EB]"
                        : "border-transparent hover:bg-[#F5F8FC]"
                    )}
                    style={{ paddingLeft: 10 + node.depth * 14 }}
                  >
                    <span className="w-3 shrink-0 text-[#6B7280]">
                      {node.expandable ? (
                        node.expanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] shrink-0 tabular-nums",
                        isSelected ? "text-[#2563EB] font-semibold" : node.strong ? "text-[#0B1739] font-semibold" : "text-[#6B7280]"
                      )}
                    >
                      {node.code}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] truncate flex-1",
                        isSelected
                          ? "text-[#2563EB] font-semibold"
                          : node.strong
                            ? "text-[#0B1739] font-semibold"
                            : "text-[#374151]"
                      )}
                    >
                      {node.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] tabular-nums shrink-0",
                        isSelected ? "text-[#2563EB] font-semibold" : "text-[#6B7280]"
                      )}
                    >
                      {node.amount}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-2 p-3 border-t border-[#EEF1F5]">
              <AcButton variant="cobaltOutline" onClick={() => toast("New account")}>
                <Plus className="h-3.5 w-3.5" /> New account
              </AcButton>
              <button
                type="button"
                onClick={() => toast("Chart settings")}
                aria-label="Chart settings"
                className="h-8 w-8 rounded-md border border-[#E5E7EB] inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </AcCard>
        ) : (
          <button
            type="button"
            onClick={() => setTreeOpen(true)}
            className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            aria-label="Expand chart of accounts"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Transactions */}
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#0B1739] tracking-tight">
                {acGlAccount.code} · {acGlAccount.name}
              </h2>
              <span className="inline-flex items-center px-2 py-[2px] rounded-[4px] bg-[#DBEAFE] text-[10px] font-semibold text-[#2563EB]">
                {acGlAccount.status}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              {acGlAccount.openingLabel}: <span className="font-bold text-[#0B1739]">{acGlAccount.opening}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Date</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Reference</th>
                  <th className="px-3 py-2.5 text-left font-normal">Account</th>
                  <th className="px-3 py-2.5 text-left font-normal">Description</th>
                  <th className="px-3 py-2.5 text-left font-normal">Department</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Debit (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Credit (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Running Balance (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal">Source</th>
                  <th className="px-3 py-2.5 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {acGlRows.map((r) => (
                  <tr
                    key={`${r.ref}-${r.date}`}
                    onClick={() => setPanelOpen(true)}
                    className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.ref}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.account}</td>
                    <td className="px-3 py-2.5 text-[#374151] min-w-[170px]">{r.desc}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.dept}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.debit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] whitespace-nowrap">{r.credit}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                        r.strong ? "font-bold text-[#0B1739]" : "text-[#0B1739]"
                      )}
                    >
                      {r.balance}
                    </td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.source}</td>
                    <td className="px-3 py-2.5">
                      <AcStatusPill label={r.status} tone={r.status === "Posted" ? "posted" : "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-[11px]">
                  <td className="px-3 py-3 text-[#6B7280]" colSpan={5}>
                    {acGlTotals.records}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acGlTotals.debit}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acGlTotals.credit}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-[#0B1739]">{acGlTotals.balance}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </AcCard>

        {/* Account drawer */}
        {panelOpen && (
          <AcCard className="w-full xl:w-[290px] shrink-0 overflow-hidden">
            <AcCardHeader
              title={`${acGlAccount.code} · ${acGlAccount.name}`}
              action={
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close account panel"
                  className="text-[#9CA3AF] hover:text-[#0B1739]"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Account summary</AcDrawerSectionTitle>
              <AcKeyValue label="Account type" value="Bank" />
              <AcKeyValue label="Currency" value="USD" />
              <AcKeyValue label="Account status" value={acGlAccount.status} />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcKeyValue label={acGlAccount.openingLabel} value={acGlAccount.opening} />
              <AcKeyValue label="Total debits" value={acGlAccount.totalDebits} />
              <AcKeyValue label="Total credits" value={acGlAccount.totalCredits} />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcKeyValue label={acGlAccount.closingLabel} value={acGlAccount.closing} strong />
            </div>
            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Account details</AcDrawerSectionTitle>
              {acGlAccountDetails.map((d) => (
                <AcKeyValue key={d.label} label={d.label} value={d.value} />
              ))}
            </div>
            <div className="px-4 py-3">
              <AcDrawerSectionTitle>Audit trail</AcDrawerSectionTitle>
              {acGlAudit.map((a) => (
                <AcKeyValue key={a.label} label={a.label} value={a.value} sub={a.sub} />
              ))}
              <AcButton
                variant="outline"
                className="w-full mt-3 h-9"
                onClick={() => toast("Audit log", { description: "Full audit log (mock)" })}
              >
                View full audit log <ExternalLink className="h-3 w-3" />
              </AcButton>
            </div>
          </AcCard>
        )}
      </div>
    </div>
  )
}
