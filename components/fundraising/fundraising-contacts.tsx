"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive, Contact, Download, ExternalLink, Loader2, Pencil, Plus, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { influenceChipClass, type ContactInfluence } from "./contacts-mock-data"
import {
  FrConfirmDialog,
  FrDialogShell,
  FrField,
  FrTableSkeleton,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { mapContactRow } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const DECISION_INFLUENCE_OPTIONS = [
  { code: "DECISION_MAKER", label: "Decision Maker" },
  { code: "INFLUENCER", label: "Influencer" },
  { code: "GATEKEEPER", label: "Gatekeeper" },
  { code: "ANALYST", label: "Analyst" },
]

type ContactRow = ReturnType<typeof mapContactRow>

function Detail({
  contact,
  onClose,
  onEdit,
  onArchive,
  onOpenInvestor,
}: {
  contact: ContactRow
  onClose: () => void
  onEdit: () => void
  onArchive: () => void
  onOpenInvestor: () => void
}) {
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
        <button type="button" onClick={onClose} className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-[12px]">
        <div>
          <p className="text-[10px] text-[#94a3b8]">Organisation</p>
          <p className="mt-0.5 font-medium text-[#0f172a]">{contact.organisationName}</p>
          <button
            type="button"
            onClick={onOpenInvestor}
            className="mt-1 inline-flex items-center gap-1 rounded-full text-[10px] font-medium text-[#2563eb] hover:underline"
          >
            Open Investor 360 <ExternalLink className="h-3 w-3" />
          </button>
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
          <span className={cn("rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", influenceChipClass(contact.influence as ContactInfluence))}>
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
            {contact.campaigns.length === 0 ? (
              <span className="text-[11px] text-[#94a3b8]">None on file</span>
            ) : (
              contact.campaigns.map((c: string) => (
                <span key={c} className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#475569]">
                  {c}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#f1f5f9] pt-3">
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-full px-3 text-[11px] text-[#b91c1c] hover:text-[#b91c1c]"
            onClick={onArchive}
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
        </div>
      </div>
    </aside>
  )
}

const CREATE_FORM_DEFAULT = {
  investorId: "",
  fullName: "",
  email: "",
  phone: "",
  roleTitle: "",
  department: "",
  decisionInfluence: DECISION_INFLUENCE_OPTIONS[0].code,
  communicationConsent: false,
}

export function FundraisingContacts() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [orgFilter, setOrgFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(CREATE_FORM_DEFAULT)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [archiveSaving, setArchiveSaving] = useState(false)
  const [editForm, setEditForm] = useState(CREATE_FORM_DEFAULT)

  const [loading, setLoading] = useState(true)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])

  async function loadAll() {
    setLoading(true)
    try {
      const firstPage = await fundraisingApi.listInvestors({ page: 1, pageSize: 100 })
      const invList = [...(firstPage.items ?? [])]
      const totalPages = Math.max(1, Number(firstPage.totalPages ?? 1))
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await fundraisingApi.listInvestors({ page, pageSize: 100 })
        invList.push(...(next.items ?? []))
      }
      setInvestors(invList)

      const targets = invList
      const results = await Promise.allSettled(
        targets.map((inv) => fundraisingApi.getInvestor(String(inv.id))),
      )

      const flattened: ContactRow[] = []
      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return
        const org = targets[i]
        const rawContacts: Record<string, any>[] = Array.isArray(res.value?.contacts)
          ? res.value.contacts
          : []
        rawContacts.forEach((c, idx) => {
          flattened.push(mapContactRow(c, org.legalName || org.name, flattened.length + idx))
        })
      })
      setContacts(flattened)
    } catch (err) {
      toastFrError(err, "Could not load contacts")
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orgNames = useMemo(
    () => Array.from(new Set(investors.map((i) => i.legalName || i.name).filter(Boolean))).sort(),
    [investors],
  )
  const owners = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.owner).filter((o) => o && o !== "—"))).sort(),
    [contacts],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
      if (orgFilter !== "all" && c.organisationName !== orgFilter) return false
      if (ownerFilter !== "all" && c.owner !== ownerFilter) return false
      return true
    })
  }, [contacts, search, orgFilter, ownerFilter])

  const selected = filtered.find((c) => c.id === selectedId) ?? null

  async function handleCreate() {
    if (!form.investorId) {
      toast.error("Organisation is required")
      throw new Error("validation")
    }
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Full name and email are required")
      throw new Error("validation")
    }
    try {
      await fundraisingApi.createContact(form.investorId, {
        fullName: form.fullName.trim(),
        roleTitle: form.roleTitle || undefined,
        department: form.department || undefined,
        email: form.email.trim(),
        phone: form.phone || undefined,
        decisionInfluence: form.decisionInfluence,
        communicationConsent: form.communicationConsent,
      })
      toast.success(`${form.fullName.trim()} added`)
      setForm(CREATE_FORM_DEFAULT)
      await loadAll()
    } catch (err) {
      toastFrError(err, "Could not create contact")
      throw err
    }
  }

  function openEditSelected() {
    if (!selected?.investorId) return
    const raw = selected.raw ?? {}
    setEditForm({
      investorId: selected.investorId,
      fullName: String(raw.fullName || raw.name || (selected.name === "—" ? "" : selected.name)),
      email: String(raw.email || (selected.email === "—" ? "" : selected.email)),
      phone: String(raw.phone || (selected.phone === "—" ? "" : selected.phone)),
      roleTitle: String(raw.roleTitle || raw.role || (selected.role === "—" ? "" : selected.role)),
      department: String(raw.department || ""),
      decisionInfluence: String(raw.decisionInfluence || DECISION_INFLUENCE_OPTIONS[0].code),
      communicationConsent: Boolean(raw.communicationConsent),
    })
    setEditOpen(true)
  }

  async function saveSelected() {
    if (!selected?.investorId || !editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error("Full name and email are required")
      return
    }
    setEditSaving(true)
    try {
      await fundraisingApi.patchContact(selected.investorId, selected.id, {
        fullName: editForm.fullName.trim(),
        roleTitle: editForm.roleTitle.trim() || undefined,
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        department: editForm.department.trim() || undefined,
        decisionInfluence: editForm.decisionInfluence,
        communicationConsent: editForm.communicationConsent,
      })
      toast.success("Contact updated")
      await loadAll()
      setEditOpen(false)
    } catch (err) {
      toastFrError(err, "Could not update contact")
    } finally {
      setEditSaving(false)
    }
  }

  async function archiveSelected() {
    if (!selected?.investorId) return
    setArchiveSaving(true)
    try {
      await fundraisingApi.archiveContact(selected.investorId, selected.id)
      toast.success("Contact archived")
      setSelectedId(null)
      setArchiveOpen(false)
      await loadAll()
    } catch (err) {
      toastFrError(err, "Could not archive contact")
    } finally {
      setArchiveSaving(false)
    }
  }

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
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() =>
              exportFundraisingCsv(
                filtered,
                [
                  { key: "name", label: "Full name" },
                  { key: "role", label: "Role" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "organisationName", label: "Organisation" },
                  { key: "influence", label: "Decision influence" },
                  { key: "consent", label: "Communication consent", value: (row) => row.consent ? "Yes" : "No" },
                  { key: "owner", label: "Owner" },
                  { key: "nextAction", label: "Next action" },
                  { key: "lastInteraction", label: "Last interaction" },
                ],
                "fundraising-contacts",
              )
            }
          >
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
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[200px]">
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organisations</SelectItem>
                  {orgNames.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
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
                {loading ? (
                  <FrTableSkeleton columns={7} rows={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-[13px] text-[#94a3b8]">
                      No contacts match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
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
                        <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", influenceChipClass(c.influence as ContactInfluence))}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? (
          <Detail
            contact={selected}
            onClose={() => setSelectedId(null)}
            onEdit={openEditSelected}
            onArchive={() => setArchiveOpen(true)}
            onOpenInvestor={() => router.push(`/fundraising/investors?investorId=${selected.investorId}`)}
          />
        ) : null}
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
        validateStep={(step) => step === "identity" && (!form.fullName.trim() || !form.email.trim()) ? ["Full name and email are required"] : []}
        onFinish={handleCreate}
      >
        {(step) => step === "identity" ? <div className="space-y-3">
          <FrField label="Full name">
            <input className={frInputClass} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </FrField>
          <FrField label="Email">
            <input className={frInputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FrField>
          <FrField label="Phone">
            <input className={frInputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+263 77…" />
          </FrField>
        </div> : step === "organisation" ? <div className="space-y-3">
          <FrField label="Role">
            <input className={frInputClass} value={form.roleTitle} onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))} placeholder="e.g. CIO" />
          </FrField>
          <FrField label="Department">
            <input
              className={frInputClass}
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="e.g. Investments"
            />
          </FrField>
          <FrField label="Organisation">
            <select className={frSelectClass} value={form.investorId} onChange={(e) => setForm((f) => ({ ...f, investorId: e.target.value }))}>
              <option value="">Select organisation</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.legalName || inv.name}</option>
              ))}
            </select>
          </FrField>
        </div> : step === "relationship" ? <div className="space-y-3">
          <FrField label="Decision influence">
            <select className={frSelectClass} value={form.decisionInfluence} onChange={(e) => setForm((f) => ({ ...f, decisionInfluence: e.target.value }))}>
              {DECISION_INFLUENCE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </FrField>
          <label className="flex items-center gap-2 text-[12px] text-[#334155]">
            <input
              type="checkbox"
              checked={form.communicationConsent}
              onChange={(e) => setForm((f) => ({ ...f, communicationConsent: e.target.checked }))}
              className="h-4 w-4 rounded border-[#cbd5e1]"
            />
            Communication consent on file
          </label>
        </div> : <ReviewList items={[
          { label: "Contact", value: form.fullName || "—" },
          { label: "Email", value: form.email || "—" },
          { label: "Organisation / role", value: `${investors.find((i) => i.id === form.investorId)?.legalName || "—"} · ${form.roleTitle || "—"}` },
          { label: "Influence", value: DECISION_INFLUENCE_OPTIONS.find((o) => o.code === form.decisionInfluence)?.label || "—" },
          { label: "Consent", value: form.communicationConsent ? "Yes" : "No" },
        ]} />}
      </FrSimpleWizard>

      <FrDialogShell
        open={editOpen}
        onOpenChange={(open) => {
          if (!editSaving) setEditOpen(open)
        }}
        title="Edit Contact"
        description="Update the contact profile and communication preferences."
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" disabled={editSaving} onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="gradient-info" className="h-9 rounded-full px-5" disabled={editSaving} onClick={saveSelected}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Full name">
            <input className={frInputClass} value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} />
          </FrField>
          <FrField label="Role">
            <input className={frInputClass} value={editForm.roleTitle} onChange={(e) => setEditForm((f) => ({ ...f, roleTitle: e.target.value }))} />
          </FrField>
          <FrField label="Email">
            <input type="email" className={frInputClass} value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
          </FrField>
          <FrField label="Phone">
            <input className={frInputClass} value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </FrField>
          <FrField label="Department">
            <input className={frInputClass} value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} />
          </FrField>
          <FrField label="Decision influence">
            <select className={frSelectClass} value={editForm.decisionInfluence} onChange={(e) => setEditForm((f) => ({ ...f, decisionInfluence: e.target.value }))}>
              {DECISION_INFLUENCE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </FrField>
          <label className="flex items-center gap-2 text-[12px] text-[#334155] sm:col-span-2">
            <input
              type="checkbox"
              checked={editForm.communicationConsent}
              onChange={(e) => setEditForm((f) => ({ ...f, communicationConsent: e.target.checked }))}
              className="h-4 w-4 rounded border-[#cbd5e1]"
            />
            Communication consent on file
          </label>
        </div>
      </FrDialogShell>

      <FrConfirmDialog
        open={archiveOpen}
        onOpenChange={(open) => {
          if (!archiveSaving) setArchiveOpen(open)
        }}
        title="Archive contact?"
        description={selected ? `Archive ${selected.name}? The contact will no longer appear in active workflows.` : undefined}
        confirmLabel="Archive contact"
        destructive
        loading={archiveSaving}
        onConfirm={archiveSelected}
      />
    </div>
  )
}
