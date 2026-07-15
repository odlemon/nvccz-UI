"use client"

import { useMemo, useState } from "react"
import { Contact, Download, Plus, Search, X } from "lucide-react"
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
  CONTACT_ORGS,
  CONTACT_OWNERS,
  INVESTOR_CONTACTS,
  influenceChipClass,
  type InvestorContact,
} from "./contacts-mock-data"
import {
  FrField,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

function Detail({ contact, onClose }: { contact: InvestorContact; onClose: () => void }) {
  return (
    <aside className={cn(CARD, "max-h-[calc(100vh-8rem)] overflow-y-auto xl:sticky xl:top-4")}>
      <div className="flex items-start justify-between border-b border-[#f1f5f9] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: contact.avatarBg }}
          >
            {contact.initials}
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-[#0f172a]">{contact.name}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">{contact.role}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-[4px] p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-[12px]">
        <div>
          <p className="text-[10px] text-[#94a3b8]">Organisation</p>
          <p className="mt-0.5 font-medium text-[#0f172a]">{contact.organisationName}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <p className="text-[10px] text-[#94a3b8]">Email</p>
            <p className="mt-0.5 text-[#0f172a]">{contact.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Phone</p>
            <p className="mt-0.5 text-[#0f172a]">{contact.phone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={cn("rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", influenceChipClass(contact.influence))}>
            {contact.influence}
          </span>
          <span
            className={cn(
              "rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
              contact.consent ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#dc2626]",
            )}
          >
            {contact.consent ? "Consent on file" : "Consent missing"}
          </span>
        </div>
        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[10px] text-[#94a3b8]">Next action</p>
          <p className="mt-0.5 font-medium text-[#0f172a]">{contact.nextAction}</p>
          <p className="mt-2 text-[10px] text-[#94a3b8]">Last interaction · {contact.lastInteraction}</p>
          <p className="mt-1 text-[10px] text-[#94a3b8]">Owner · {contact.owner}</p>
        </div>
        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Campaigns</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contact.campaigns.map((c) => (
              <span key={c} className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#475569]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export function FundraisingContacts() {
  const [search, setSearch] = useState("")
  const [orgFilter, setOrgFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(INVESTOR_CONTACTS[0].id)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: "Tendai Ncube", email: "tendai.ncube@example.com", org: CONTACT_ORGS[0] ?? "", role: "Investment Director", influence: "High" })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return INVESTOR_CONTACTS.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
      if (orgFilter !== "all" && c.organisationName !== orgFilter) return false
      if (ownerFilter !== "all" && c.owner !== ownerFilter) return false
      return true
    })
  }, [search, orgFilter, ownerFilter])

  const selected =
    filtered.find((c) => c.id === selectedId) ??
    INVESTOR_CONTACTS.find((c) => c.id === selectedId) ??
    null

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">Contacts</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Reusable people across campaigns — no duplicate contact records
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
            Add Contact
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 grid items-start gap-4",
          selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1",
        )}
      >
        <div className={cn(CARD, "min-w-0 overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Contact className="h-4 w-4 text-[#64748b]" />
              <h2 className="text-[13px] font-semibold text-[#0f172a]">People</h2>
              <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[200px]">
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organisations</SelectItem>
                  {CONTACT_ORGS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {CONTACT_OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {["Contact", "Organisation", "Influence", "Consent", "Owner", "Next action", "Last touch"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#f1f5f9] last:border-b-0",
                      selectedId === c.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: c.avatarBg }}
                        >
                          {c.initials}
                        </span>
                        <div>
                          <p className="text-[12px] font-medium text-[#0f172a]">{c.name}</p>
                          <p className="text-[10px] text-[#94a3b8]">{c.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">
                      {c.organisationName}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", influenceChipClass(c.influence))}>
                        {c.influence}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      <span className={c.consent ? "text-[#15803d]" : "text-[#dc2626]"}>
                        {c.consent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{c.owner}</td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">{c.nextAction}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#94a3b8]">{c.lastInteraction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? <Detail contact={selected} onClose={() => setSelectedId(null)} /> : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Contact"
        steps={[
          { id: "identity", short: "1", label: "Contact details" },
          { id: "organisation", short: "2", label: "Organisation" },
          { id: "relationship", short: "3", label: "Relationship" },
          { id: "review", short: "4", label: "Review" },
        ]}
        submitLabel="Create contact"
        validateStep={(step) => step === "identity" && (!form.name.trim() || !form.email.trim()) ? ["Full name and email are required"] : []}
        onSubmit={() => {
          toast.success(`${form.name.trim()} added`)
          setForm({ name: "Tendai Ncube", email: "tendai.ncube@example.com", org: CONTACT_ORGS[0] ?? "", role: "Investment Director", influence: "High" })
        }}
      >
        {(step) => step === "identity" ? <div className="space-y-3">
          <FrField label="Full name">
            <input className={frInputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FrField>
          <FrField label="Email">
            <input className={frInputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FrField>
        </div> : step === "organisation" ? <div className="space-y-3">
          <FrField label="Role">
            <input className={frInputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. CIO" />
          </FrField>
          <FrField label="Organisation">
            <select className={frSelectClass} value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}>
              {CONTACT_ORGS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FrField>
        </div> : step === "relationship" ? <FrField label="Influence">
          <select className={frSelectClass} value={form.influence} onChange={(e) => setForm((f) => ({ ...f, influence: e.target.value }))}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </FrField> : <ReviewList items={[
          { label: "Contact", value: form.name },
          { label: "Email", value: form.email },
          { label: "Organisation / role", value: `${form.org} · ${form.role}` },
          { label: "Influence", value: form.influence },
        ]} />}
      </FrSimpleWizard>
    </div>
  )
}
