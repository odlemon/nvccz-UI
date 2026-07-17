"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Lock, Mail, Plus, Search, X } from "lucide-react"
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
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import {
  INTERACTION_TYPES,
  INTERACTION_TYPE_LABEL,
  mapCommunicationRow,
} from "@/lib/fundraising/mappers"
import {
  FrField,
  FrTableSkeleton,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type CommRow = ReturnType<typeof mapCommunicationRow>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function safeDisplayName(value: unknown, linked = false): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return linked ? "Name unavailable" : "—"
  }
  const text = String(value).trim()
  if (!text) return linked ? "Name unavailable" : "—"
  return UUID_PATTERN.test(text) ? "Name unavailable" : text
}

function communicationInvestor(item: CommRow) {
  const raw = item.raw ?? {}
  return safeDisplayName(
    raw.investor?.legalName || raw.investor?.name || raw.investorName,
    Boolean(raw.investorId || raw.investor),
  )
}

function communicationContact(item: CommRow) {
  const raw = item.raw ?? {}
  return safeDisplayName(
    raw.contact?.fullName || raw.contact?.name || raw.contactName,
    Boolean(raw.contactId || raw.contact),
  )
}

function communicationCampaign(item: CommRow) {
  const raw = item.raw ?? {}
  return safeDisplayName(
    raw.campaign?.name || raw.campaignName,
    Boolean(raw.campaignId || raw.campaign),
  )
}

function communicationOpportunity(item: CommRow) {
  const raw = item.raw ?? {}
  return safeDisplayName(
    raw.opportunity?.name || raw.opportunityName,
    Boolean(raw.opportunityId || raw.opportunity),
  )
}

function communicationOwner(item: CommRow) {
  const raw = item.raw ?? {}
  return safeDisplayName(
    raw.ownerName || raw.owner?.displayName || raw.owner?.fullName || raw.owner?.name || raw.createdByName,
    Boolean(raw.ownerId || raw.owner || raw.createdById),
  )
}

function communicationParticipants(item: CommRow): string[] {
  const participants = Array.isArray(item.raw?.participants) ? item.raw.participants : []
  return participants.map((participant: unknown) => {
    if (participant && typeof participant === "object") {
      const value = participant as Record<string, unknown>
      return safeDisplayName(value.fullName || value.displayName || value.name || value.email, true)
    }
    return safeDisplayName(participant, true)
  })
}

function communicationAttachments(item: CommRow): string[] {
  const attachments = Array.isArray(item.raw?.attachments) ? item.raw.attachments : []
  return attachments.map((attachment: unknown, index: number) => {
    if (attachment && typeof attachment === "object") {
      const value = attachment as Record<string, unknown>
      const name = value.fileName || value.filename || value.originalName || value.name || value.title
      return name ? safeDisplayName(name, true) : `Attachment ${index + 1}`
    }
    return safeDisplayName(attachment, true)
  })
}

function sentimentClass(s: string): string {
  switch (s) {
    case "Positive":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Cautious":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Negative":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function commTypeClass(t: string): string {
  if (t === "Internal Note") return "bg-[#fef3c7] text-[#b45309]"
  if (t === "DDQ") return "bg-[#ede9fe] text-[#6d28d9]"
  if (t === "Meeting" || t === "Presentation") return "bg-[#dbeafe] text-[#1d4ed8]"
  if (t === "Call") return "bg-[#e0f2fe] text-[#0369a1]"
  return "bg-[#f1f5f9] text-[#475569]"
}

const CONFIDENTIALITY_OPTIONS = ["INTERNAL", "EXTERNAL", "CONFIDENTIAL", "INTERNAL_NOTE"]

function Detail({ item, onClose }: { item: CommRow; onClose: () => void }) {
  const participants = communicationParticipants(item)
  const attachments = communicationAttachments(item)
  const confidentiality = safeDisplayName(
    item.raw?.confidentiality
      ? String(item.raw.confidentiality).replace(/_/g, " ")
      : item.confidential
        ? "Internal"
        : "External",
  )
  return (
    <aside className={cn(CARD, "max-h-[calc(100vh-8rem)] overflow-y-auto xl:sticky xl:top-4")}>
      <div className="flex items-start justify-between border-b border-[#f1f5f9] px-4 py-3.5">
        <div className="min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", commTypeClass(item.type))}>
              {item.type}
            </span>
            {item.confidential ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-semibold text-[#b45309]">
                <Lock className="h-3 w-3" /> Internal
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-[14px] font-semibold leading-snug text-[#0f172a]">{item.subject}</h2>
          <p className="mt-1 text-[11px] text-[#94a3b8]">{item.date}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-[12px]">
        <p className="leading-relaxed text-[#475569]">{item.summary}</p>
        <dl className="space-y-2 border-t border-[#f1f5f9] pt-3">
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Interaction type</dt>
            <dd className="text-right text-[#0f172a]">{item.type}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Occurred</dt>
            <dd className="text-right text-[#0f172a]">{item.date}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Investor</dt>
            <dd className="text-right font-medium text-[#0f172a]">{communicationInvestor(item)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Contact</dt>
            <dd className="text-right text-[#0f172a]">{communicationContact(item)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Campaign</dt>
            <dd className="text-right text-[#0f172a]">{communicationCampaign(item)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Opportunity</dt>
            <dd className="text-right text-[#0f172a]">{communicationOpportunity(item)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Owner</dt>
            <dd className="text-right text-[#0f172a]">{communicationOwner(item)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Outcome</dt>
            <dd className="text-right text-[#0f172a]">{item.outcome}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Sentiment</dt>
            <dd>
              <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", sentimentClass(item.sentiment))}>
                {item.sentiment}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Next action</dt>
            <dd className="text-right text-[#0f172a]">
              {item.nextAction}
              {item.nextActionDate !== "—" ? (
                <span className="block text-[10px] text-[#94a3b8]">{item.nextActionDate}</span>
              ) : null}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Confidentiality</dt>
            <dd className="text-right text-[#0f172a]">{confidentiality}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Participants</dt>
            <dd className="text-right text-[#0f172a]">{participants.length ? participants.join(", ") : "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Attachments</dt>
            <dd className="text-right text-[#0f172a]">{attachments.length ? attachments.join(", ") : "—"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  )
}

export function FundraisingCommunications() {
  const [loading, setLoading] = useState(true)
  const [rawComms, setRawComms] = useState<Record<string, any>[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  const [loadingRefs, setLoadingRefs] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [opportunities, setOpportunities] = useState<Record<string, any>[]>([])

  const [form, setForm] = useState({
    interactionType: INTERACTION_TYPES[0],
    subject: "",
    summary: "",
    confidentiality: "INTERNAL",
    investorId: "",
    campaignId: "",
    opportunityId: "",
    outcome: "",
    sentiment: "NEUTRAL",
    nextAction: "",
    dueDate: "",
  })

  const comms = useMemo(() => rawComms.map(mapCommunicationRow), [rawComms])

  async function loadComms() {
    setLoading(true)
    try {
      const res = await fundraisingApi.listCommunications()
      setRawComms(res ?? [])
    } catch (err) {
      toastFrError(err, "Could not load communications")
      setRawComms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComms()
  }, [])

  useEffect(() => {
    if (!logOpen) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
      fundraisingApi.listOpportunities(),
    ])
      .then(([invRes, campRes, oppRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
        setOpportunities(oppRes.status === "fulfilled" ? oppRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [logOpen])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return comms.filter((c) => {
      if (q && !c.subject.toLowerCase().includes(q) && !c.investor.toLowerCase().includes(q)) return false
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      return true
    })
  }, [comms, search, typeFilter])

  const selected = filtered.find((c) => c.id === selectedId) ?? comms.find((c) => c.id === selectedId) ?? null

  function resetForm() {
    setForm({
      interactionType: INTERACTION_TYPES[0],
      subject: "",
      summary: "",
      confidentiality: "INTERNAL",
      investorId: "",
      campaignId: "",
      opportunityId: "",
      outcome: "",
      sentiment: "NEUTRAL",
      nextAction: "",
      dueDate: "",
    })
  }

  const selectedInvestor = investors.find((i) => String(i.id) === form.investorId)
  const selectedCampaign = campaigns.find((c) => String(c.id) === form.campaignId)

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Communications
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Interaction log — emails, calls, meetings, DDQs and internal notes
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
                  { key: "type", label: "Interaction type" },
                  { key: "subject", label: "Subject" },
                  { key: "summary", label: "Summary" },
                  { key: "investor", label: "Investor", value: communicationInvestor },
                  { key: "contact", label: "Contact", value: communicationContact },
                  { key: "campaign", label: "Campaign", value: communicationCampaign },
                  { key: "opportunity", label: "Opportunity", value: communicationOpportunity },
                  { key: "owner", label: "Owner", value: communicationOwner },
                  { key: "date", label: "Occurred" },
                  { key: "outcome", label: "Outcome" },
                  { key: "sentiment", label: "Sentiment" },
                  { key: "nextAction", label: "Next action" },
                  { key: "nextActionDate", label: "Next action due" },
                  { key: "confidentiality", label: "Confidentiality", value: (row) => row.raw?.confidentiality || (row.confidential ? "Internal" : "External") },
                  { key: "participants", label: "Participants", value: (row) => communicationParticipants(row).join("; ") },
                  { key: "attachments", label: "Attachments", value: (row) => communicationAttachments(row).join("; ") },
                ],
                "fundraising-communications",
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setLogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Log Interaction
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
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#64748b]" />
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Activity feed</h2>
              <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subject or investor..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Array.from(new Set(Object.values(INTERACTION_TYPE_LABEL))).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <tbody>
                  <FrTableSkeleton columns={8} rows={7} />
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-16 text-center text-[12px] text-[#94a3b8]">
              No communications logged yet. Use “Log Interaction” to add one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                    {["Type", "Subject", "Investor", "Campaign", "Sentiment", "Owner", "When", "Next action"].map(
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
                        <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", commTypeClass(c.type))}>
                          {c.type}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5">
                        <p className="truncate text-[12px] font-medium text-[#0f172a]">{c.subject}</p>
                        {c.confidential ? (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#b45309]">
                            <Lock className="h-2.5 w-2.5" /> Internal only
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{communicationInvestor(c)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{communicationCampaign(c)}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", sentimentClass(c.sentiment))}>
                          {c.sentiment}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{communicationOwner(c)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#94a3b8]">{c.date}</td>
                      <td className="max-w-[140px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">{c.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selected ? <Detail item={selected} onClose={() => setSelectedId(null)} /> : null}
      </div>

      <FrSimpleWizard
        open={logOpen}
        onOpenChange={(v) => {
          if (!v) resetForm()
          setLogOpen(v)
        }}
        title="Log Interaction"
        steps={[{ id: "interaction", short: "1", label: "Interaction" }, { id: "context", short: "2", label: "Investor context" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Log interaction"
        validateStep={(step) => (step === "interaction" && !form.subject.trim() ? ["Subject is required"] : [])}
        onFinish={async () => {
          try {
            await fundraisingApi.createCommunication({
              interactionType: form.interactionType,
              subject: form.subject.trim(),
              summary: form.summary.trim() || undefined,
              confidentiality: form.confidentiality,
              investorId: form.investorId || undefined,
              campaignId: form.campaignId || undefined,
              opportunityId: form.opportunityId || undefined,
              outcome: form.outcome || undefined,
              sentiment: form.sentiment || undefined,
              nextAction: form.nextAction || undefined,
              dueDate: form.dueDate || undefined,
              occurredAt: new Date().toISOString(),
            })
            toast.success("Interaction logged")
            resetForm()
            await loadComms()
          } catch (err) {
            toastFrError(err, "Could not log interaction")
            throw err
          }
        }}
      >
        {(step) => step === "interaction" ? <div className="space-y-3">
          <FrField label="Type">
            <select
              className={frSelectClass}
              value={form.interactionType}
              onChange={(e) => setForm((f) => ({ ...f, interactionType: e.target.value }))}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>{INTERACTION_TYPE_LABEL[t]} ({t.replace(/_/g, " ")})</option>
              ))}
            </select>
          </FrField>
          <FrField label="Subject">
            <input className={frInputClass} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. ZGF II investment update" />
          </FrField>
          <FrField label="Summary">
            <textarea
              className={frInputClass + " h-20 py-2"}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Optional context"
            />
          </FrField>
          <FrField label="Confidentiality">
            <select
              className={frSelectClass}
              value={form.confidentiality}
              onChange={(e) => setForm((f) => ({ ...f, confidentiality: e.target.value }))}
            >
              {CONFIDENTIALITY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
        </div> : step === "context" ? <div className="space-y-3">
            <FrField label="Investor (optional)">
              <select
                className={frSelectClass}
                value={form.investorId}
                disabled={loadingRefs}
                onChange={(e) => setForm((f) => ({ ...f, investorId: e.target.value }))}
              >
                <option value="">{loadingRefs ? "Loading investors…" : "No investor linked"}</option>
                {investors.map((i) => (
                  <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
                ))}
              </select>
            </FrField>
            <FrField label="Campaign (optional)">
              <select
                className={frSelectClass}
                value={form.campaignId}
                disabled={loadingRefs}
                onChange={(e) => setForm((f) => ({ ...f, campaignId: e.target.value }))}
              >
                <option value="">{loadingRefs ? "Loading campaigns…" : "No campaign linked"}</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FrField>
            <FrField label="Opportunity (recommended)">
              <select
                className={frSelectClass}
                value={form.opportunityId}
                disabled={loadingRefs}
                onChange={(e) => setForm((f) => ({ ...f, opportunityId: e.target.value }))}
              >
                <option value="">No opportunity linked</option>
                {opportunities
                  .filter((o) => !form.investorId || String(o.investorId) === form.investorId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>{safeDisplayName(o.name || o.opportunityName || o.investor?.legalName || o.investorName, true)}</option>
                  ))}
              </select>
            </FrField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FrField label="Outcome">
                <input className={frInputClass} value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))} />
              </FrField>
              <FrField label="Sentiment">
                <select className={frSelectClass} value={form.sentiment} onChange={(e) => setForm((f) => ({ ...f, sentiment: e.target.value }))}>
                  <option value="POSITIVE">Positive</option><option value="NEUTRAL">Neutral</option><option value="CAUTIOUS">Cautious</option><option value="NEGATIVE">Negative</option>
                </select>
              </FrField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FrField label="Next action">
                <input className={frInputClass} value={form.nextAction} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))} />
              </FrField>
              <FrField label="Due date">
                <input type="date" className={frInputClass} value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </FrField>
            </div>
          </div> : <ReviewList items={[
            { label: "Type", value: INTERACTION_TYPE_LABEL[form.interactionType] || form.interactionType },
            { label: "Subject", value: form.subject || "—" },
            { label: "Confidentiality", value: form.confidentiality.replace(/_/g, " ") },
            { label: "Investor", value: selectedInvestor?.legalName || selectedInvestor?.name || "Not linked" },
            { label: "Campaign", value: selectedCampaign?.name || "Not linked" },
          ]} />}
      </FrSimpleWizard>
    </div>
  )
}
