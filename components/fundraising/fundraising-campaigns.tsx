"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Download,
  FileSearch,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Rocket,
  Shield,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FrCampaignWizard } from "@/components/fundraising/fundraising-create-wizards"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapCampaignCard, mapCampaignEngagement } from "@/lib/fundraising/mappers"
import {
  emptyRequirementsState,
  FrConfirmDialog,
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrPromptDialog,
  FrRequirementsDialog,
  frInputClass,
  frSelectClass,
  requirementsFromError,
  type FrRequirementsState,
} from "./fundraising-modals"

const CARD =
  "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const CAMPAIGN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "communications", label: "Communications" },
  { id: "templates", label: "Templates" },
  { id: "lists", label: "Distribution Lists" },
  { id: "events", label: "Events" },
  { id: "materials", label: "Content & Materials" },
]

type CampaignCard = ReturnType<typeof mapCampaignCard>
type CampaignEngagement = ReturnType<typeof mapCampaignEngagement>
type CampaignAction = "edit" | "pause" | "archive" | "approval"
type OperationResource = "templates" | "distribution-lists" | "events" | "materials"

function campaignIconFor(type: string) {
  const t = String(type || "").toUpperCase()
  if (t.includes("MANDATE") || t.includes("PRODUCT") || t.includes("DISTRIBUTOR")) return Shield
  if (t.includes("CO_INVESTMENT") || t.includes("SPV")) return FileText
  return Rocket
}

function PanelHeader({ title, link = "View all" }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3.5">
      <h2 className="text-[13px] font-semibold text-[#0f172a]">{title}</h2>
      {link ? (
        <button type="button" className="rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]">
          {link}
        </button>
      ) : null}
    </div>
  )
}

function EngagementStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-[9px] text-[#94a3b8]">{label}</p>
      <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">
        {value == null ? "—" : value.toLocaleString()}
      </p>
    </div>
  )
}

function CampaignSummaryCard({
  campaign,
  engagement,
  engagementLoading,
  onActivate,
  onPatch,
  activating,
}: {
  campaign: CampaignCard
  engagement: CampaignEngagement | null
  engagementLoading: boolean
  onActivate: (id: string) => void
  onPatch: (campaign: CampaignCard, action: CampaignAction) => void
  activating: boolean
}) {
  const Icon = campaignIconFor(campaign.type)
  const isLive = campaign.status === "live"

  return (
    <div className={cn(CARD, "flex h-full flex-col p-5")}>
      <div className="flex items-center gap-2.5">
        <span style={{ color: isLive ? "#15803d" : "#6d28d9" }} className="shrink-0">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#0f172a]">
          {campaign.name}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
            isLive ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#ede9fe] text-[#6d28d9]",
          )}
        >
          {isLive ? "Live" : "Planned"}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-[#94a3b8]">{campaign.type.replace(/_/g, " ")}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748b]">
        {campaign.startDate ? `Starts ${new Date(campaign.startDate).toLocaleDateString()}` : "No start date set"}
        {campaign.closeDate ? ` · Target close ${new Date(campaign.closeDate).toLocaleDateString()}` : ""}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-y border-[#f1f5f9] py-3">
        <div>
          <p className="text-[10px] text-[#94a3b8]">Target</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">{campaign.target}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#94a3b8]">Currency</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">{campaign.currency}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] text-[#94a3b8]">Owner</p>
        <p className="mt-0.5 text-[12px] font-medium text-[#0f172a]">
          {/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(campaign.owner) ? "Name unavailable" : campaign.owner}
        </p>
      </div>

      <div className="mt-3 border-t border-[#f1f5f9] pt-3">
        {engagementLoading ? (
          <p className="flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading engagement…
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <EngagementStat label="Sent" value={engagement?.sent ?? null} />
              <EngagementStat label="Opened" value={engagement?.opened ?? null} />
              <EngagementStat label="Replied" value={engagement?.replied ?? null} />
              <EngagementStat label="Meetings" value={engagement?.meetingsBooked ?? null} />
              <EngagementStat label="Materials" value={engagement?.materialsDownloaded ?? null} />
            </div>
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                <span>Progress</span>
                <span className="font-medium text-[#0f172a]">
                  {engagement ? `${engagement.progressPct}%` : "—"}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                <div
                  className="h-full rounded-full bg-[#7c3aed]"
                  style={{ width: `${Math.min(Math.max(engagement?.progressPct ?? 0, 0), 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto pt-4">
        {isLive ? (
          <p className="text-[11px] text-[#94a3b8]">Campaign is active — visible on the pipeline board.</p>
        ) : (
          <Button
            type="button"
            variant="gradient-info"
            className="rounded-full h-8 px-4 text-[11px] font-semibold w-full"
            disabled={activating}
            onClick={() => onActivate(campaign.id)}
          >
            {activating ? "Activating…" : "Activate campaign"}
          </Button>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          <button type="button" onClick={() => onPatch(campaign, "edit")} className="rounded-full px-2 py-1 text-[9px] text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
          {isLive ? <button type="button" onClick={() => onPatch(campaign, "pause")} className="rounded-full px-2 py-1 text-[9px] text-[#64748b] hover:bg-[#f1f5f9]">Pause</button> : null}
          <button type="button" onClick={() => onPatch(campaign, "approval")} className="rounded-full px-2 py-1 text-[9px] text-[#64748b] hover:bg-[#f1f5f9]">Submit approval</button>
          <button type="button" onClick={() => onPatch(campaign, "archive")} className="rounded-full px-2 py-1 text-[9px] text-[#b91c1c] hover:bg-[#fef2f2]">Archive</button>
        </div>
      </div>
    </div>
  )
}

function CampaignCardsGrid({
  campaigns,
  loading,
  columns = 4,
  onActivate,
  onPatch,
  activatingId,
  engagementById,
  engagementLoadingIds,
}: {
  campaigns: CampaignCard[]
  loading: boolean
  columns?: 2 | 3 | 4
  onActivate: (id: string) => void
  onPatch: (campaign: CampaignCard, action: CampaignAction) => void
  activatingId: string | null
  engagementById: Record<string, CampaignEngagement | null>
  engagementLoadingIds: Set<string>
}) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 gap-4", columns >= 2 && "sm:grid-cols-2", columns >= 3 && "lg:grid-cols-3", columns >= 4 && "xl:grid-cols-4")}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className={cn(CARD, "space-y-4 p-5")}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
        No campaigns yet. Create one to get started.
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        columns >= 2 && "sm:grid-cols-2",
        columns >= 3 && "lg:grid-cols-3",
        columns >= 4 && "xl:grid-cols-4",
      )}
    >
      {campaigns.map((campaign) => (
        <CampaignSummaryCard
          key={campaign.id}
          campaign={campaign}
          engagement={engagementById[campaign.id] ?? null}
          engagementLoading={engagementLoadingIds.has(campaign.id)}
          onActivate={onActivate}
          onPatch={onPatch}
          activating={activatingId === campaign.id}
        />
      ))}
    </div>
  )
}

function CommunicationsPanel({
  footer = true,
  className,
}: {
  footer?: boolean
  className?: string
}) {
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fundraisingApi
      .listCommunications()
      .then((rows) => {
        if (!cancelled) setItems(rows ?? [])
      })
      .catch((err) => {
        if (!cancelled) toastFrError(err, "Could not load communications")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className={cn(CARD, "flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <PanelHeader title="Communications Timeline" />
      {loading ? (
        <p className="flex items-center gap-2 p-4 text-[11px] text-[#94a3b8]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading communications…
        </p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-[11px] text-[#94a3b8]">No communications recorded yet.</p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-[#f1f5f9] overflow-y-auto">
          {items.slice(0, footer ? 8 : undefined).map((item) => (
            <li key={String(item.id)} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[#0f172a]">{item.subject || "(No subject)"}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-[#64748b]">{item.summary || item.notes || "—"}</p>
                </div>
                <span className="shrink-0 text-[9px] text-[#94a3b8]">
                  {item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <div className="mt-auto shrink-0 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-full border border-[#e2e8f0] bg-[#fafbfc] py-2.5 text-[12px] font-medium text-[#2563eb] hover:bg-[#f8fafc]"
          >
            View full timeline
          </button>
        </div>
      )}
    </section>
  )
}

const OPERATION_META: Record<OperationResource, { title: string; singular: string }> = {
  templates: { title: "Templates", singular: "template" },
  "distribution-lists": { title: "Distribution Lists", singular: "distribution list" },
  events: { title: "Events", singular: "event" },
  materials: { title: "Content & Materials", singular: "material" },
}

function splitIdentifiers(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function OperationsPanel({
  resource,
  campaigns,
  selectedCampaignId,
  onCampaignChange,
  className,
  limit,
}: {
  resource: OperationResource
  campaigns: CampaignCard[]
  selectedCampaignId: string
  onCampaignChange: (id: string) => void
  className?: string
  limit?: number
}) {
  const meta = OPERATION_META[resource]
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", category: "", content: "", identifiers: "", location: "", start: "", end: "" })
  const [file, setFile] = useState<File | null>(null)

  async function loadItems() {
    if (!selectedCampaignId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      setItems(await fundraisingApi.listCampaignOps(selectedCampaignId, resource))
    } catch (err) {
      setItems([])
      toastFrError(err, `Could not load ${meta.title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, resource])

  function closeCreate(open: boolean) {
    setCreateOpen(open)
    if (!open) {
      setForm({ name: "", category: "", content: "", identifiers: "", location: "", start: "", end: "" })
      setFile(null)
    }
  }

  async function submit() {
    if (!selectedCampaignId || !formValid) return
    const body =
      resource === "templates"
        ? { name: form.name.trim(), category: form.category.trim(), content: form.content.trim() }
        : resource === "distribution-lists"
          ? { name: form.name.trim(), contactIds: splitIdentifiers(form.identifiers) }
          : resource === "events"
            ? { title: form.name.trim(), location: form.location.trim(), startAt: form.start, endAt: form.end }
            : { title: form.name.trim(), category: form.category.trim() }
    setSubmitting(true)
    try {
      await fundraisingApi.createCampaignOps(selectedCampaignId, resource, body, file ?? undefined)
      toast.success(`${meta.singular[0].toUpperCase()}${meta.singular.slice(1)} created`)
      closeCreate(false)
      await loadItems()
    } catch (err) {
      toastFrError(err, `Could not create ${meta.singular}`)
    } finally {
      setSubmitting(false)
    }
  }

  const visibleItems = limit ? items.slice(0, limit) : items
  const input = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const formValid =
    Boolean(form.name.trim()) &&
    (resource !== "templates" || Boolean(form.category.trim() && form.content.trim())) &&
    (resource !== "distribution-lists" || splitIdentifiers(form.identifiers).length > 0) &&
    (resource !== "events" || Boolean(form.location.trim() && form.start && form.end)) &&
    (resource !== "materials" || Boolean(form.category.trim() && file))

  return (
    <>
      <section className={cn(CARD, "flex min-h-0 flex-col", className)}>
        <PanelHeader title={meta.title} link="" />
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
          <select
            className={cn(frSelectClass, "min-w-[180px] flex-1 rounded-full")}
            value={selectedCampaignId}
            onChange={(event) => onCampaignChange(event.target.value)}
            disabled={campaigns.length === 0}
            aria-label={`Campaign for ${meta.title}`}
          >
            {campaigns.length === 0 ? <option value="">No campaigns available</option> : null}
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <Button type="button" variant="outline" className="h-9 rounded-full px-4 text-[11px]" disabled={!selectedCampaignId} onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: limit ?? 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <p className="p-8 text-center text-[11px] text-[#94a3b8]">
            {selectedCampaignId ? `No ${meta.title.toLowerCase()} for this campaign.` : "Select or create a campaign first."}
          </p>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-[#f1f5f9]">
            {visibleItems.map((item, index) => {
              const title = item.name || item.title || `${meta.singular} ${index + 1}`
              const downloadUrl = item.downloadUrl || item.url || item.fileUrl
              const detail =
                resource === "templates" ? item.category || item.templateType :
                resource === "distribution-lists" ? `${item.contactCount ?? item.memberCount ?? item.contacts?.length ?? 0} contacts` :
                resource === "events" ? [item.location, item.startAt || item.scheduledStart || item.startDate].filter(Boolean).join(" · ") :
                item.category || item.fileName || item.contentType
              const Icon = resource === "templates" ? FileSearch : resource === "distribution-lists" ? Users : resource === "events" ? MapPin : FileText
              return (
                <li key={String(item.id ?? index)} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#0f172a]">{title}</p>
                    {detail ? <p className="mt-0.5 truncate text-[10px] text-[#94a3b8]">{String(detail)}</p> : null}
                  </div>
                  {resource === "materials" && downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download
                      aria-label={`Download ${title}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  ) : resource === "materials" ? (
                    <button
                      type="button"
                      disabled
                      aria-label={`Download unavailable for ${title}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-[#cbd5e1]"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FrDialogShell
        open={createOpen}
        onOpenChange={closeCreate}
        title={`Add ${meta.singular}`}
        description={`Create this item under ${campaigns.find((campaign) => campaign.id === selectedCampaignId)?.name ?? "the selected campaign"}.`}
        size="md"
        footer={<FrFormFooter onCancel={() => closeCreate(false)} onSubmit={submit} submitLabel={submitting ? "Creating…" : "Create"} submitDisabled={submitting || !formValid} />}
      >
        <div className="space-y-3">
          <FrField label={resource === "events" || resource === "materials" ? "Title" : "Name"}>
            <input className={frInputClass} value={form.name} onChange={(event) => input("name", event.target.value)} />
          </FrField>
          {resource === "templates" ? (
            <>
              <FrField label="Category"><input className={frInputClass} value={form.category} onChange={(event) => input("category", event.target.value)} /></FrField>
              <FrField label="Content"><textarea className={cn(frInputClass, "h-28 py-2")} value={form.content} onChange={(event) => input("content", event.target.value)} /></FrField>
            </>
          ) : null}
          {resource === "distribution-lists" ? (
            <FrField label="Contact/member identifiers (comma-separated)">
              <textarea className={cn(frInputClass, "h-24 py-2")} value={form.identifiers} onChange={(event) => input("identifiers", event.target.value)} placeholder="contact-id-1, contact-id-2" />
            </FrField>
          ) : null}
          {resource === "events" ? (
            <>
              <FrField label="Location"><input className={frInputClass} value={form.location} onChange={(event) => input("location", event.target.value)} /></FrField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FrField label="Start"><input type="datetime-local" className={frInputClass} value={form.start} onChange={(event) => input("start", event.target.value)} /></FrField>
                <FrField label="End"><input type="datetime-local" className={frInputClass} value={form.end} onChange={(event) => input("end", event.target.value)} /></FrField>
              </div>
            </>
          ) : null}
          {resource === "materials" ? (
            <>
              <FrField label="Category"><input className={frInputClass} value={form.category} onChange={(event) => input("category", event.target.value)} /></FrField>
              <FrField label="File"><input type="file" className={cn(frInputClass, "h-auto py-2")} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></FrField>
            </>
          ) : null}
        </div>
      </FrDialogShell>
    </>
  )
}

function TabContent({
  activeTab,
  campaigns,
  loading,
  onActivate,
  onPatch,
  activatingId,
  engagementById,
  engagementLoadingIds,
  selectedCampaignId,
  onCampaignChange,
}: {
  activeTab: string
  campaigns: CampaignCard[]
  loading: boolean
  onActivate: (id: string) => void
  onPatch: (campaign: CampaignCard, action: CampaignAction) => void
  activatingId: string | null
  engagementById: Record<string, CampaignEngagement | null>
  engagementLoadingIds: Set<string>
  selectedCampaignId: string
  onCampaignChange: (id: string) => void
}) {
  switch (activeTab) {
    case "overview":
      return (
        <>
          <CampaignCardsGrid
            campaigns={campaigns}
            loading={loading}
            columns={4}
            onActivate={onActivate}
            onPatch={onPatch}
            activatingId={activatingId}
            engagementById={engagementById}
            engagementLoadingIds={engagementLoadingIds}
          />
          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className="flex lg:col-span-5">
              <CommunicationsPanel className="w-full" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-4 lg:h-full">
              <OperationsPanel resource="templates" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} className="shrink-0" limit={3} />
              <OperationsPanel resource="events" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} className="min-h-0 flex-1" limit={3} />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-3 lg:h-full">
              <OperationsPanel resource="distribution-lists" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} className="shrink-0" limit={3} />
              <OperationsPanel resource="materials" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} className="min-h-0 flex-1" limit={3} />
            </div>
          </div>
        </>
      )
    case "campaigns":
      return (
        <CampaignCardsGrid
          campaigns={campaigns}
          loading={loading}
          columns={4}
          onActivate={onActivate}
          onPatch={onPatch}
          activatingId={activatingId}
          engagementById={engagementById}
          engagementLoadingIds={engagementLoadingIds}
        />
      )
    case "communications":
      return <CommunicationsPanel footer={false} />
    case "templates":
      return <OperationsPanel resource="templates" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} />
    case "lists":
      return <OperationsPanel resource="distribution-lists" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} />
    case "events":
      return <OperationsPanel resource="events" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} />
    case "materials":
      return <OperationsPanel resource="materials" campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={onCampaignChange} />
    default:
      return null
  }
}

export function FundraisingCampaigns() {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rawCampaigns, setRawCampaigns] = useState<Record<string, any>[]>([])
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [engagementById, setEngagementById] = useState<Record<string, CampaignEngagement | null>>({})
  const [engagementLoadingIds, setEngagementLoadingIds] = useState<Set<string>>(new Set())
  const [requirements, setRequirements] = useState<FrRequirementsState>(emptyRequirementsState)
  const [selectedCampaignId, setSelectedCampaignId] = useState("")
  const [actionCampaign, setActionCampaign] = useState<CampaignCard | null>(null)
  const [action, setAction] = useState<CampaignAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", targetCapital: "" })
  const [actionReason, setActionReason] = useState("")

  const campaigns = useMemo(() => rawCampaigns.map(mapCampaignCard), [rawCampaigns])

  async function loadCampaigns() {
    setLoading(true)
    try {
      const res = await fundraisingApi.listCampaigns()
      setRawCampaigns(res ?? [])
    } catch (err) {
      toastFrError(err, "Could not load campaigns")
      setRawCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (campaigns.length === 0) {
      setSelectedCampaignId("")
    } else if (!campaigns.some((campaign) => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0].id)
    }
  }, [campaigns, selectedCampaignId])

  useEffect(() => {
    if (campaigns.length === 0) return
    const ids = campaigns.map((c) => c.id)
    setEngagementLoadingIds(new Set(ids))
    Promise.allSettled(ids.map((id) => fundraisingApi.getCampaignEngagement(id))).then((results) => {
      const next: Record<string, CampaignEngagement | null> = {}
      results.forEach((res, i) => {
        next[ids[i]] = res.status === "fulfilled" ? mapCampaignEngagement(res.value) : null
      })
      setEngagementById((prev) => ({ ...prev, ...next }))
      setEngagementLoadingIds(new Set())
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCampaigns])

  async function handleActivate(id: string) {
    setActivatingId(id)
    try {
      await fundraisingApi.activateCampaign(id)
      toast.success("Campaign activated")
      await loadCampaigns()
    } catch (err) {
      const state = requirementsFromError(err, "Campaign cannot be activated")
      if (state.open) setRequirements(state)
      else toastFrError(err, "Campaign cannot be activated")
    } finally {
      setActivatingId(null)
    }
  }

  function handlePatch(campaign: CampaignCard, nextAction: CampaignAction) {
    setActionCampaign(campaign)
    setAction(nextAction)
    setActionReason("")
    setEditForm({ name: campaign.name, targetCapital: String(campaign.targetCapital || "") })
  }

  function closeAction() {
    if (actionLoading) return
    setAction(null)
    setActionCampaign(null)
    setActionReason("")
  }

  async function runAction() {
    if (!actionCampaign || !action) return
    if ((action === "pause" || action === "approval") && !actionReason.trim()) return
    setActionLoading(true)
    try {
      if (action === "edit") {
        await fundraisingApi.patchCampaign(actionCampaign.id, {
          name: editForm.name.trim(),
          targetCapital: Number(editForm.targetCapital.replace(/,/g, "")),
        })
      } else if (action === "pause") {
        await fundraisingApi.pauseCampaign(actionCampaign.id, actionReason.trim())
      } else if (action === "archive") {
        await fundraisingApi.patchCampaign(actionCampaign.id, { status: "ARCHIVED" })
      } else {
        await fundraisingApi.submitCampaignForApproval(actionCampaign.id, {
          reason: actionReason.trim(),
          requestType: "CAMPAIGN_APPROVAL",
        })
      }
      toast.success(action === "approval" ? "Campaign submitted for approval" : "Campaign updated")
      setAction(null)
      setActionCampaign(null)
      setActionReason("")
      await loadCampaigns()
    } catch (err) {
      toastFrError(err, action === "approval" ? "Could not submit campaign for approval" : `Could not ${action} campaign`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 sm:space-y-5 sm:p-5 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-[28px]">
            Campaigns &amp; Communications
          </h1>

          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div
              className="flex flex-wrap items-center gap-0 border-b border-[#e2e8f0]"
              role="tablist"
              aria-label="Campaigns sections"
            >
              {CAMPAIGN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative rounded-full px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:text-[13px]",
                    activeTab === tab.id
                      ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-cyan-600"
                      : "text-[#64748b] hover:text-[#334155]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 pb-2 text-xs text-[#64748b] xl:pb-2.5">
              <CalendarDays className="h-3.5 w-3.5" />
              As at {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full h-10 px-6 gap-2 shadow-sm"
            disabled={campaigns.length === 0}
            onClick={() => exportFundraisingCsv(
              rawCampaigns,
              [
                { key: "name", label: "Campaign" },
                { key: "campaignType", label: "Type" },
                { key: "status", label: "Status" },
                { key: "approvalStatus", label: "Approval Status" },
                { key: "targetCapital", label: "Target Capital" },
                { key: "primaryCurrency", label: "Currency" },
                { key: "startDate", label: "Start Date" },
                { key: "closeDate", label: "Close Date" },
              ],
              "fundraising-campaigns",
            )}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            type="button"
            variant="gradient-info"
            className="rounded-full h-10 px-6 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <TabContent
        activeTab={activeTab}
        campaigns={campaigns}
        loading={loading}
        onActivate={handleActivate}
        onPatch={handlePatch}
        activatingId={activatingId}
        engagementById={engagementById}
        engagementLoadingIds={engagementLoadingIds}
        selectedCampaignId={selectedCampaignId}
        onCampaignChange={setSelectedCampaignId}
      />
      <FrCampaignWizard open={createOpen} onOpenChange={setCreateOpen} onCreated={loadCampaigns} />
      <FrDialogShell
        open={action === "edit"}
        onOpenChange={(open) => !open && closeAction()}
        title="Edit campaign"
        description={actionCampaign?.name}
        size="md"
        footer={<FrFormFooter onCancel={closeAction} onSubmit={runAction} submitLabel={actionLoading ? "Saving…" : "Save changes"} submitDisabled={actionLoading || !editForm.name.trim() || !Number(editForm.targetCapital.replace(/,/g, ""))} />}
      >
        <div className="space-y-3">
          <FrField label="Campaign name">
            <input className={frInputClass} value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
          </FrField>
          <FrField label="Target capital">
            <input type="number" min="0" className={frInputClass} value={editForm.targetCapital} onChange={(event) => setEditForm((current) => ({ ...current, targetCapital: event.target.value }))} />
          </FrField>
        </div>
      </FrDialogShell>
      <FrPromptDialog
        open={action === "pause"}
        onOpenChange={(open) => !open && closeAction()}
        title="Pause campaign"
        description={actionCampaign ? `Explain why ${actionCampaign.name} is being paused.` : undefined}
        label="Reason"
        value={actionReason}
        onValueChange={setActionReason}
        placeholder="Reason for pausing"
        multiline
        required
        submitLabel="Pause campaign"
        loading={actionLoading}
        onSubmit={runAction}
      />
      <FrPromptDialog
        open={action === "approval"}
        onOpenChange={(open) => !open && closeAction()}
        title="Submit campaign for approval"
        description={actionCampaign ? `Send ${actionCampaign.name} for campaign approval.` : undefined}
        label="Approval reason"
        value={actionReason}
        onValueChange={setActionReason}
        placeholder="Why this campaign is ready for approval"
        multiline
        required
        submitLabel="Submit for approval"
        loading={actionLoading}
        onSubmit={runAction}
      />
      <FrConfirmDialog
        open={action === "archive"}
        onOpenChange={(open) => !open && closeAction()}
        title="Archive campaign"
        description={actionCampaign ? `Archive ${actionCampaign.name}? This removes it from active campaign work.` : undefined}
        confirmLabel="Archive campaign"
        destructive
        loading={actionLoading}
        onConfirm={runAction}
      />
      <FrRequirementsDialog
        state={requirements}
        onOpenChange={(open) => setRequirements((current) => ({ ...current, open }))}
      />
    </div>
  )
}
