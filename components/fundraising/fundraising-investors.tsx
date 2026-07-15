"use client"

import { useMemo, useState } from "react"
import { Building2, Download, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INVESTOR_ORGS,
  INVESTOR_OWNERS,
  INVESTOR_TYPES,
  kycChipClass,
  kycLabel,
  type InvestorOrg,
} from "./investors-mock-data"
import {
  FrField,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

function statusClass(s: InvestorOrg["status"]) {
  if (s === "Active") return "bg-[#dcfce7] text-[#15803d]"
  if (s === "Prospect") return "bg-[#dbeafe] text-[#1d4ed8]"
  return "bg-[#f1f5f9] text-[#64748b]"
}

function DetailPanel({
  org,
  onClose,
}: {
  org: InvestorOrg
  onClose: () => void
}) {
  return (
    <aside className={cn(CARD, "max-h-[calc(100vh-8rem)] overflow-y-auto xl:sticky xl:top-4")}>
      <div className="flex items-start justify-between border-b border-[#f1f5f9] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-sm font-bold text-white"
            style={{ backgroundColor: org.logoBg }}
          >
            {org.logoLabel}
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-[#0f172a]">{org.legalName}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              {org.type} · {org.country}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-[4px] p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4 text-[12px]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#94a3b8]">Estimated AUM</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.estimatedAum}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Ticket range</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.ticketRange}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Fit score</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.score}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Open opportunities</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.openOpportunities}</p>
          </div>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Relationship</p>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Owner</dt>
              <dd className="font-medium text-[#0f172a]">{org.owner}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Status</dt>
              <dd>
                <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", statusClass(org.status))}>
                  {org.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Last interaction</dt>
              <dd className="text-[#0f172a]">{org.lastInteraction}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Next action</dt>
              <dd className="text-right text-[#0f172a]">{org.nextAction}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Commitments</dt>
              <dd className="font-medium text-[#0f172a]">{org.commitments}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Compliance</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn("rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", kycChipClass(org.kycStatus))}>
              KYC: {kycLabel(org.kycStatus)}
            </span>
            <span
              className={cn(
                "rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
                org.sanctionsStatus === "Clear"
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : org.sanctionsStatus === "Flagged"
                    ? "bg-[#fee2e2] text-[#dc2626]"
                    : "bg-[#f1f5f9] text-[#64748b]",
              )}
            >
              Sanctions: {org.sanctionsStatus}
            </span>
          </div>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Asset preferences</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {org.assetPreferences.map((p) => (
              <span key={p} className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export function FundraisingInvestors() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(INVESTOR_ORGS[0].id)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: "Zim National Infrastructure Pension Fund",
    type: "Pension Fund",
    owner: "Tariro Moyo",
    country: "Zimbabwe",
    aum: "US$180M",
    ticket: "US$3M – US$8M",
    kyc: "Not started",
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return INVESTOR_ORGS.filter((o) => {
      if (q && !o.legalName.toLowerCase().includes(q)) return false
      if (typeFilter !== "all" && o.type !== typeFilter) return false
      if (ownerFilter !== "all" && o.owner !== ownerFilter) return false
      if (statusFilter !== "all" && o.status !== statusFilter) return false
      return true
    })
  }, [search, typeFilter, ownerFilter, statusFilter])

  const selected = filtered.find((o) => o.id === selectedId) ?? INVESTOR_ORGS.find((o) => o.id === selectedId) ?? null

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Investor Organisations
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Institutional investor database — one org, many opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Investor
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 grid items-start gap-4",
          selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
        )}
      >
        <div className={cn(CARD, "min-w-0 overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#64748b]" />
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Directory</h2>
              <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="relative sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search organisations..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {INVESTOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {INVESTOR_OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {["Organisation", "Type", "Owner", "KYC", "Status", "Commitments", "Next action", "Score"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => setSelectedId(org.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#f1f5f9] last:border-b-0",
                      selectedId === org.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
                          style={{ backgroundColor: org.logoBg }}
                        >
                          {org.logoLabel}
                        </span>
                        <div>
                          <p className="text-[12px] font-medium text-[#0f172a]">{org.legalName}</p>
                          <p className="text-[10px] text-[#94a3b8]">{org.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{org.type}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{org.owner}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", kycChipClass(org.kycStatus))}>
                        {kycLabel(org.kycStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", statusClass(org.status))}>
                        {org.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#0f172a]">{org.commitments}</td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">{org.nextAction}</td>
                    <td className="px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">{org.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? <DetailPanel org={selected} onClose={() => setSelectedId(null)} /> : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Investor Organisation"
        steps={[
          { id: "identity", short: "1", label: "Organisation" },
          { id: "profile", short: "2", label: "Investment profile" },
          { id: "ownership", short: "3", label: "Relationship" },
          { id: "compliance", short: "4", label: "Compliance" },
          { id: "review", short: "5", label: "Review" },
        ]}
        submitLabel="Create investor"
        validateStep={(step) => (step === "identity" && !form.name.trim() ? ["Legal name is required"] : [])}
        onSubmit={() => {
          toast.success(`${form.name.trim()} added`)
          setForm({ name: "Zim National Infrastructure Pension Fund", type: "Pension Fund", owner: "Tariro Moyo", country: "Zimbabwe", aum: "US$180M", ticket: "US$3M – US$8M", kyc: "Not started" })
        }}
      >
        {(step) => step === "identity" ? <div className="space-y-3">
          <FrField label="Legal name">
            <input className={frInputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FrField>
          <FrField label="Investor type">
            <select className={frSelectClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {INVESTOR_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Country">
            <input className={frInputClass} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </FrField>
        </div> : step === "profile" ? <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Estimated AUM">
            <input className={frInputClass} value={form.aum} onChange={(e) => setForm((f) => ({ ...f, aum: e.target.value }))} />
          </FrField>
          <FrField label="Target ticket range">
            <input className={frInputClass} value={form.ticket} onChange={(e) => setForm((f) => ({ ...f, ticket: e.target.value }))} />
          </FrField>
        </div> : step === "ownership" ? <FrField label="Relationship owner">
            <select className={frSelectClass} value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}>
              {INVESTOR_OWNERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FrField> : step === "compliance" ? <FrField label="KYC status">
            <select className={frSelectClass} value={form.kyc} onChange={(e) => setForm((f) => ({ ...f, kyc: e.target.value }))}>
              <option>Not started</option><option>In progress</option><option>Verified</option>
            </select>
          </FrField> : <ReviewList items={[
            { label: "Organisation", value: form.name },
            { label: "Type / country", value: `${form.type} · ${form.country}` },
            { label: "AUM / ticket", value: `${form.aum} · ${form.ticket}` },
            { label: "Owner / KYC", value: `${form.owner} · ${form.kyc}` },
          ]} />}
      </FrSimpleWizard>
    </div>
  )
}
