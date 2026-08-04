"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  MoreVertical,
  Plus,
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
  AcSearchInput,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acCgAccountDetail,
  acCgAccounts,
  acCgChangeSummary,
  acCgChanges,
  acCgHeader,
  acCgTree,
} from "@/lib/accounting-mock/fixtures-chart-governance"
import { cn } from "@/lib/utils"

export function ChartGovernanceScreen() {
  const [version, setVersion] = useState(acCgHeader.version)
  const [selected, setSelected] = useState("6200-010")
  const [treeSearch, setTreeSearch] = useState("")
  const [tableSearch, setTableSearch] = useState("")
  const [treeOpen, setTreeOpen] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)
  const [currencies, setCurrencies] = useState<Record<string, boolean>>({
    USD: true,
    ZiG: true,
  })

  const filteredAccounts = acCgAccounts.filter((a) => {
    const q = tableSearch.toLowerCase()
    return !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  })

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <AcScreenHeader
            title="Chart of Accounts Governance"
            subtitle="Maintain, govern and control the chart of accounts structure and rules."
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <AcField label="Version" className="w-[130px]">
            <AcSelectInput value={version} options={acCgHeader.versionOptions} onChange={setVersion} />
          </AcField>
          <AcField label="Effective date" className="w-[150px]">
            <AcSelectInput
              value={acCgHeader.effectiveDate}
              options={[acCgHeader.effectiveDate, "01 Jul 2026", "01 Sep 2026"]}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
          </AcField>
          <AcField label="Status" className="w-[130px]">
            <div className="h-8 flex items-center">
              <AcStatusPill label={acCgHeader.status} tone="pending" />
            </div>
          </AcField>
          <div className="flex items-center gap-2 pb-0.5">
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("New account")}>
              New account
            </AcButton>
            <AcButton variant="cobaltOutline" className="h-9 px-4" onClick={() => toast("Import mapping")}>
              Import mapping
            </AcButton>
            <AcButton
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
              onClick={() => toast.success("Changes submitted", { description: "Sent for review (mock)" })}
            >
              Submit changes
            </AcButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Tree */}
        {treeOpen ? (
          <AcCard className="w-full xl:w-[260px] shrink-0 overflow-hidden flex flex-col">
            <AcCardHeader
              title="Account structure"
              action={
                <button
                  type="button"
                  onClick={() => setTreeOpen(false)}
                  aria-label="Collapse tree"
                  className="text-[#9CA3AF] hover:text-[#0B1739]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              }
            />
            <div className="px-3 pb-2">
              <AcSearchInput value={treeSearch} onChange={setTreeSearch} placeholder="Search accounts" />
            </div>
            <div className="py-1 flex-1 overflow-y-auto max-h-[360px]">
              {acCgTree
                .filter((n) => {
                  const q = treeSearch.toLowerCase()
                  return !q || n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)
                })
                .map((node) => {
                  const isSelected = selected === node.code
                  return (
                    <button
                      key={`${node.code}-${node.name}`}
                      type="button"
                      onClick={() => setSelected(node.code)}
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
                          isSelected ? "text-[#2563EB] font-semibold" : "text-[#6B7280]"
                        )}
                      >
                        {node.code}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] truncate flex-1",
                          isSelected ? "text-[#2563EB] font-semibold" : "text-[#374151]"
                        )}
                      >
                        {node.name}
                      </span>
                      {node.count > 0 && (
                        <span className="text-[10px] tabular-nums text-[#9CA3AF] shrink-0">{node.count}</span>
                      )}
                    </button>
                  )
                })}
            </div>
            <div className="p-3 border-t border-[#EEF1F5]">
              <button
                type="button"
                onClick={() => toast("Add root account")}
                className="text-[11px] font-medium text-[#2563EB] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add root account
              </button>
            </div>
          </AcCard>
        ) : (
          <button
            type="button"
            onClick={() => setTreeOpen(true)}
            className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#F5F8FC]"
            aria-label="Expand tree"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Accounts table */}
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739]">Accounts ({acCgAccounts.length})</h2>
            <div className="flex items-center gap-2">
              <AcSearchInput
                value={tableSearch}
                onChange={setTableSearch}
                placeholder="Search accounts"
                className="w-[180px]"
              />
              <button type="button" aria-label="More" onClick={() => toast("Table options")} className="text-[#6B7280]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#EEF1F5] text-[#6B7280]">
                  <th className="px-3 py-2.5 text-left font-normal">Code</th>
                  <th className="px-3 py-2.5 text-left font-normal">Name</th>
                  <th className="px-3 py-2.5 text-left font-normal">Type</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Curr. rule</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Tax rule</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Reconc. req.</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Posting allowed</th>
                  <th className="px-3 py-2.5 text-left font-normal">Parent</th>
                  <th className="px-3 py-2.5 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((r) => {
                  const active = selected === r.code
                  return (
                    <tr
                      key={r.code}
                      onClick={() => {
                        setSelected(r.code)
                        setPanelOpen(true)
                      }}
                      className={cn(
                        "border-b border-[#EEF1F5] cursor-pointer",
                        active ? "bg-[#DBEAFE]" : "hover:bg-[#F9FBFE]"
                      )}
                    >
                      <td className={cn("px-3 py-2.5 whitespace-nowrap", active ? "font-semibold text-[#2563EB]" : "text-[#374151]")}>
                        {r.code}
                      </td>
                      <td className={cn("px-3 py-2.5", active ? "font-semibold text-[#2563EB]" : "text-[#374151]")}>{r.name}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.type}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.currRule}</td>
                      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.taxRule}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.reconcReq}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.postingAllowed}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{r.parent}</td>
                      <td className="px-3 py-2.5 text-[#2563EB] font-medium">{r.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EEF1F5] text-[10px] text-[#9CA3AF]">
            <span>1–10 of 18</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB] text-[#9CA3AF]">‹</button>
                <button type="button" className="h-6 w-6 rounded bg-[#2563EB] text-white text-[11px] font-medium">1</button>
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB] text-[#374151] text-[11px]">2</button>
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB] text-[#9CA3AF]">›</button>
              </div>
              <AcSelectInput value="10 / page" options={["10 / page", "25 / page"]} className="w-[90px]" />
            </div>
          </div>
        </AcCard>

        {/* Account drawer */}
        {panelOpen && (
          <AcCard className="w-full xl:w-[310px] shrink-0 overflow-hidden">
            <AcCardHeader
              title={`${acCgAccountDetail.code} · ${acCgAccountDetail.name}`}
              action={
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close panel"
                  className="text-[#9CA3AF] hover:text-[#0B1739]"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="px-4 py-3 space-y-2 border-b border-[#EEF1F5]">
              <div className="grid grid-cols-2 gap-2">
                <AcField label="Account name">
                  <input
                    defaultValue={acCgAccountDetail.accountName}
                    className="w-full h-8 px-2.5 rounded-md border border-[#E5E7EB] text-[11px] text-[#374151] outline-none focus:border-[#2563EB]"
                  />
                </AcField>
                <AcField label="Reporting group">
                  <AcSelectInput
                    value={acCgAccountDetail.reportingGroup}
                    options={["Operating Expenses", "Administrative Expenses", "Cost of Sales"]}
                  />
                </AcField>
                <AcField label="Type">
                  <div className="relative">
                    <input
                      readOnly
                      value={acCgAccountDetail.type}
                      className="w-full h-8 pl-2.5 pr-8 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] text-[11px] text-[#374151]"
                    />
                    <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9CA3AF]" />
                  </div>
                </AcField>
                <AcField label="Normal balance">
                  <AcSelectInput value={acCgAccountDetail.normalBalance} options={["Debit", "Credit"]} />
                </AcField>
              </div>
              <AcField label="Permitted currencies">
                <div className="flex items-center gap-4">
                  {acCgAccountDetail.currencies.map((c) => (
                    <label key={c} className="inline-flex items-center gap-1.5 text-[11px] text-[#374151] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currencies[c]}
                        onChange={() => setCurrencies((p) => ({ ...p, [c]: !p[c] }))}
                        className="rounded border-[#D1D5DB] text-[#2563EB]"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </AcField>
              <div className="grid grid-cols-2 gap-2">
                <AcField label="Default tax rule">
                  <AcSelectInput
                    value={acCgAccountDetail.taxRule}
                    options={["WHT Services 10%", "Standard VAT", "Exempt"]}
                  />
                </AcField>
                <AcField label="Department required">
                  <AcSelectInput value={acCgAccountDetail.departmentRequired} options={["Optional", "Required"]} />
                </AcField>
                <AcField label="Project required">
                  <AcSelectInput value={acCgAccountDetail.projectRequired} options={["Optional", "Required"]} />
                </AcField>
                <AcField label="Reconciliation owner">
                  <AcSelectInput
                    value={acCgAccountDetail.reconciliationOwner}
                    options={["Rudo Chikore", "Tariro Ncube", "Farai Moyo"]}
                  />
                </AcField>
                <AcField label="Effective date" className="col-span-2">
                  <AcSelectInput
                    value={acCgAccountDetail.effectiveDate}
                    options={[acCgAccountDetail.effectiveDate, "01 Jul 2026"]}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  />
                </AcField>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Governance checks</AcDrawerSectionTitle>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="space-y-1.5">
                  {acCgAccountDetail.governanceChecks.map((c) => (
                    <div key={c} className="flex items-start gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-[#2563EB] text-white inline-flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-[10px] text-[#374151] leading-snug">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border border-[#F5C46B] bg-[#FFFBF2] p-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <p className="text-[10px] font-semibold text-[#B45309]">
                      Used by {acCgAccountDetail.recurringJournals.length} recurring journals
                    </p>
                  </div>
                  <div className="space-y-1">
                    {acCgAccountDetail.recurringJournals.map((j) => (
                      <button
                        key={j.ref}
                        type="button"
                        onClick={() => toast(j.ref, { description: j.desc })}
                        className="block w-full text-left text-[10px] hover:underline"
                      >
                        <span className="text-[#2563EB] font-medium">{j.ref}</span>{" "}
                        <span className="text-[#374151]">{j.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3">
              <AcDrawerSectionTitle>Impact preview</AcDrawerSectionTitle>
              <table className="w-full text-[10px] mt-1">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1 text-left font-normal">Area</th>
                    <th className="py-1 text-left font-normal">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {acCgAccountDetail.impactPreview.map((r) => (
                    <tr key={r.area} className="border-t border-[#EEF1F5]">
                      <td className="py-1.5 text-[#374151] whitespace-nowrap">{r.area}</td>
                      <td className="py-1.5 text-[#374151]">
                        <span className="inline-flex items-center gap-1">
                          {r.impact}
                          <Info className="h-3 w-3 text-[#9CA3AF]" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AcCard>
        )}
      </div>

      {/* Change set */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <AcCard className="xl:col-span-3 overflow-hidden p-4">
          <h2 className="text-[13px] font-bold text-[#0B1739] mb-3">Change set summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6B7280]">Additions</span>
              <span className="font-bold text-[#2563EB] tabular-nums">{acCgChangeSummary.additions}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6B7280]">Edits</span>
              <span className="font-bold text-[#2563EB] tabular-nums">{acCgChangeSummary.edits}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6B7280]">Deactivations</span>
              <span className="font-bold text-[#DC2626] tabular-nums">{acCgChangeSummary.deactivations}</span>
            </div>
          </div>
          <div className="space-y-3 border-t border-[#EEF1F5] pt-3">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold inline-flex items-center justify-center">
                {acCgChangeSummary.preparedBy.initials}
              </span>
              <div>
                <p className="text-[10px] text-[#6B7280]">Prepared by</p>
                <p className="text-[11px] font-semibold text-[#0B1739]">{acCgChangeSummary.preparedBy.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{acCgChangeSummary.preparedBy.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold inline-flex items-center justify-center">
                {acCgChangeSummary.reviewer.initials}
              </span>
              <div>
                <p className="text-[10px] text-[#6B7280]">Reviewer</p>
                <p className="text-[11px] font-semibold text-[#0B1739]">{acCgChangeSummary.reviewer.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{acCgChangeSummary.reviewer.status}</p>
              </div>
            </div>
          </div>
          <AcButton variant="outline" className="w-full mt-4 h-9" onClick={() => toast("Audit note")}>
            Add audit note
          </AcButton>
        </AcCard>

        <AcCard className="xl:col-span-9 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739]">Change set ({acCgChanges.length})</h2>
            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
              <span>1–10 of 18</span>
              <div className="flex items-center gap-1">
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB]">‹</button>
                <button type="button" className="h-6 w-6 rounded bg-[#2563EB] text-white text-[11px]">1</button>
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB] text-[11px] text-[#374151]">2</button>
                <button type="button" className="h-6 w-6 rounded border border-[#E5E7EB]">›</button>
              </div>
              <AcSelectInput value="10 / page" options={["10 / page", "25 / page"]} className="w-[90px]" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#EEF1F5] text-[#6B7280]">
                  <th className="px-3 py-2.5 text-left font-normal">#</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Change type</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Account code</th>
                  <th className="px-3 py-2.5 text-left font-normal">Account name</th>
                  <th className="px-3 py-2.5 text-left font-normal">Field</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Old value</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">New value</th>
                  <th className="px-3 py-2.5 text-left font-normal">Reason</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Audit note</th>
                </tr>
              </thead>
              <tbody>
                {acCgChanges.map((r) => (
                  <tr key={r.num} className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE]">
                    <td className="px-3 py-2.5 text-[#374151]">{r.num}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 font-medium whitespace-nowrap",
                        r.tone === "deactivation" ? "text-[#DC2626]" : "text-[#374151]"
                      )}
                    >
                      {r.changeType}
                    </td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.accountCode}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.accountName}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.field}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.oldValue}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.newValue}</td>
                    <td className="px-3 py-2.5 text-[#374151] min-w-[160px]">{r.reason}</td>
                    <td className="px-3 py-2.5 text-[#374151] min-w-[160px]">{r.auditNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AcCard>
      </div>
    </div>
  )
}
