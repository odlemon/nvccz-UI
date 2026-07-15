"use client"

import { useState } from "react"
import {
  CalendarDays,
  Clock,
  Download,
  FileSearch,
  FileText,
  Mail,
  MapPin,
  Plus,
  Reply,
  Rocket,
  Shield,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FrCampaignWizard } from "@/components/fundraising/fundraising-create-wizards"
import {
  CAMPAIGN_MATERIALS,
  CAMPAIGN_TABS,
  CAMPAIGN_TEMPLATES,
  DISTRIBUTION_LISTS,
  ROADSHOW_EVENTS,
  SUMMARY_CAMPAIGNS,
  TIMELINE_ITEMS,
  type CampaignSummary,
  type TimelineItem,
} from "./campaigns-mock-data"

const CARD =
  "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const CAMPAIGN_ICONS = {
  rocket: Rocket,
  mail: Mail,
  document: FileText,
  shield: Shield,
}

const TIMELINE_STYLE: Record<
  TimelineItem["tone"],
  { bar: string; gradient: string; tag: string }
> = {
  purple: {
    bar: "bg-[#7c3aed]",
    gradient: "bg-gradient-to-b from-[#7c3aed] to-[#a78bfa]",
    tag: "bg-[#ede9fe] text-[#6d28d9]",
  },
  blue: {
    bar: "bg-[#2563eb]",
    gradient: "bg-gradient-to-b from-[#2563eb] to-[#60a5fa]",
    tag: "bg-[#dbeafe] text-[#1d4ed8]",
  },
  green: {
    bar: "bg-[#16a34a]",
    gradient: "bg-gradient-to-b from-[#16a34a] to-[#4ade80]",
    tag: "bg-[#dcfce7] text-[#15803d]",
  },
  orange: {
    bar: "bg-[#ea580c]",
    gradient: "bg-gradient-to-b from-[#ea580c] to-[#fb923c]",
    tag: "bg-[#ffedd5] text-[#c2410c]",
  },
}

const TIMELINE_ICON: Record<TimelineItem["kind"], typeof Mail> = {
  email: Mail,
  followup: Mail,
  meeting: CalendarDays,
  download: Download,
  reply: Reply,
}

function PanelHeader({ title, link = "View all" }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3.5">
      <h2 className="text-[13px] font-semibold text-[#0f172a]">{title}</h2>
      {link ? (
        <button type="button" className="text-[11px] font-medium text-[#2563eb] hover:underline">
          {link}
        </button>
      ) : null}
    </div>
  )
}

function PanelFooter({ label }: { label: string }) {
  return (
    <div className="border-t border-[#f1f5f9] px-4 py-3 text-center">
      <button type="button" className="text-[11px] font-medium text-[#2563eb] hover:underline">
        {label}
      </button>
    </div>
  )
}

function MetricWithPct({ value, pct }: { value: number; pct: number }) {
  return (
    <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">
      {value}{" "}
      <span className="text-[11px] font-normal text-[#94a3b8]">({pct}%)</span>
    </p>
  )
}

function CampaignSummaryCard({ campaign }: { campaign: CampaignSummary }) {
  const Icon = CAMPAIGN_ICONS[campaign.icon]

  return (
    <div className={cn(CARD, "flex h-full flex-col p-5")}>
      {/* Icon + title + status on one row */}
      <div className="flex items-center gap-2.5">
        <span style={{ color: campaign.iconColor }} className="shrink-0">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#0f172a]">
          {campaign.name}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
            campaign.status === "live"
              ? "bg-[#dcfce7] text-[#15803d]"
              : "bg-[#ede9fe] text-[#6d28d9]",
          )}
        >
          {campaign.status === "live" ? "Live" : "Planned"}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-[#94a3b8]">{campaign.startedLabel}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748b]">{campaign.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#f1f5f9] py-3">
        <div>
          <p className="text-[10px] text-[#94a3b8]">Sent</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">{campaign.sent}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#94a3b8]">Opened</p>
          <MetricWithPct value={campaign.opened} pct={campaign.openedPct} />
        </div>
        <div>
          <p className="text-[10px] text-[#94a3b8]">Replied</p>
          <MetricWithPct value={campaign.replied} pct={campaign.repliedPct} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-[#94a3b8]">Meetings Booked</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">
            {campaign.meetingsBooked}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#94a3b8]">Materials Downloaded</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">
            {campaign.materialsDownloaded}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${campaign.progress}%`,
                backgroundColor: campaign.progressColor,
              }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#0f172a]">
            {campaign.progress}%
          </span>
        </div>
        <p className="mt-1 text-[10px] text-[#94a3b8]">Progress</p>
      </div>
    </div>
  )
}

function CampaignCardsGrid({ columns = 4 }: { columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        columns >= 2 && "sm:grid-cols-2",
        columns >= 3 && "lg:grid-cols-3",
        columns >= 4 && "xl:grid-cols-4",
      )}
    >
      {SUMMARY_CAMPAIGNS.map((campaign) => (
        <CampaignSummaryCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const Icon = TIMELINE_ICON[item.kind]
  const style = TIMELINE_STYLE[item.tone]

  return (
    <li className="relative flex items-start gap-3 border-b border-[#f1f5f9] py-3.5 pl-4 pr-4 last:border-b-0">
      <span
        aria-hidden
        className={cn("absolute bottom-0 left-0 top-0 w-[3px]", style.bar)}
      />
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white shadow-sm",
          style.gradient,
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-[#0f172a]">
          <span className="font-semibold">{item.actor}</span> {item.action}{" "}
          <span className="font-semibold">{item.target}</span>
        </p>
        {item.detail && (
          <p className="mt-1 text-[11px] leading-snug text-[#64748b]">{item.detail}</p>
        )}
        {item.campaignTag && (
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
              style.tag,
            )}
          >
            {item.campaignTag}
          </span>
        )}
      </div>
      <div className="shrink-0 pt-0.5 text-right">
        <p className="text-[11px] leading-tight text-[#94a3b8]">{item.date}</p>
        <p className="mt-0.5 text-[11px] leading-tight tabular-nums text-[#94a3b8]">{item.time}</p>
      </div>
    </li>
  )
}

function CommunicationsPanel({
  footer = true,
  className,
}: {
  footer?: boolean
  className?: string
}) {
  return (
    <section className={cn(CARD, "flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <PanelHeader title="Communications Timeline" />
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {TIMELINE_ITEMS.map((item) => (
          <TimelineRow key={item.id} item={item} />
        ))}
      </ul>
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

function TemplatesPanel({
  footer = true,
  className,
  limit,
}: {
  footer?: boolean
  className?: string
  limit?: number
}) {
  const items = limit ? CAMPAIGN_TEMPLATES.slice(0, limit) : CAMPAIGN_TEMPLATES
  return (
    <section className={cn(CARD, "flex flex-col", className)}>
      <PanelHeader title="Templates" />
      <ul className="divide-y divide-[#f1f5f9]">
        {items.map((template) => (
          <li key={template.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
              <FileSearch className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#0f172a]">
              {template.name}
            </p>
            <span className="shrink-0 text-[10px] text-[#94a3b8]">
              Used {template.usedCount} times
            </span>
          </li>
        ))}
      </ul>
      {footer && <PanelFooter label="Manage templates" />}
    </section>
  )
}

function EventsPanel({
  footer = true,
  className,
}: {
  footer?: boolean
  className?: string
}) {
  return (
    <section className={cn(CARD, "flex min-h-0 flex-col", className)}>
      <PanelHeader title="Upcoming Roadshow Events" />
      <ul className="min-h-0 flex-1 divide-y divide-[#f1f5f9]">
        {ROADSHOW_EVENTS.map((event) => (
          <li key={event.id} className="flex items-start gap-3 px-4 py-3">
            <div className="w-10 shrink-0 text-center">
              <p className="text-lg font-bold leading-none tabular-nums text-[#0f172a]">
                {event.day}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold tracking-wide text-[#94a3b8]">
                {event.month}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#0f172a]">{event.title}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#64748b]">
                <MapPin className="h-3 w-3 shrink-0" />
                {event.location}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748b]">
                <Clock className="h-3 w-3 shrink-0" />
                {event.time}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-[#0f172a]">{event.meetings}</p>
              <p className="text-[9px] text-[#94a3b8]">Meetings</p>
            </div>
          </li>
        ))}
      </ul>
      {footer && (
        <div className="mt-auto shrink-0">
          <PanelFooter label="View full calendar" />
        </div>
      )}
    </section>
  )
}

function ListsPanel({
  footer = true,
  className,
  limit,
}: {
  footer?: boolean
  className?: string
  limit?: number
}) {
  const items = limit ? DISTRIBUTION_LISTS.slice(0, limit) : DISTRIBUTION_LISTS
  return (
    <section className={cn(CARD, "flex flex-col", className)}>
      <PanelHeader title="Distribution Lists" />
      <ul className="divide-y divide-[#f1f5f9]">
        {items.map((list) => (
          <li key={list.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#0f172a]">{list.name}</p>
            <span className="shrink-0 text-[10px] text-[#94a3b8]">{list.contacts} contacts</span>
          </li>
        ))}
      </ul>
      {footer && <PanelFooter label="Manage lists" />}
    </section>
  )
}

function MaterialsPanel({
  footer = true,
  className,
}: {
  footer?: boolean
  className?: string
}) {
  return (
    <section className={cn(CARD, "flex min-h-0 flex-col", className)}>
      <PanelHeader title="Content & Materials" />
      <ul className="min-h-0 flex-1 divide-y divide-[#f1f5f9]">
        {CAMPAIGN_MATERIALS.map((material) => (
          <li key={material.id} className="flex items-start gap-2.5 px-4 py-3">
            <FileText
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                material.tone === "red" ? "text-[#dc2626]" : "text-[#16a34a]",
              )}
              strokeWidth={1.75}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#0f172a]">{material.name}</p>
              <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                {material.fileType} · {material.version} · Updated {material.updated}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
              aria-label={`Download ${material.name}`}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {footer && (
        <div className="mt-auto shrink-0">
          <PanelFooter label="Manage materials" />
        </div>
      )}
    </section>
  )
}

function TabContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "overview":
      return (
        <>
          <CampaignCardsGrid columns={4} />
          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className="flex lg:col-span-5">
              <CommunicationsPanel className="w-full" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-4 lg:h-full">
              <TemplatesPanel className="shrink-0" limit={3} />
              <EventsPanel className="min-h-0 flex-1" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-3 lg:h-full">
              <ListsPanel className="shrink-0" limit={3} />
              <MaterialsPanel className="min-h-0 flex-1" />
            </div>
          </div>
        </>
      )
    case "campaigns":
      return <CampaignCardsGrid columns={4} />
    case "communications":
      return <CommunicationsPanel footer={false} />
    case "templates":
      return <TemplatesPanel footer={false} />
    case "lists":
      return <ListsPanel footer={false} />
    case "events":
      return <EventsPanel footer={false} />
    case "materials":
      return <MaterialsPanel footer={false} />
    default:
      return null
  }
}

export function FundraisingCampaigns() {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [createOpen, setCreateOpen] = useState(false)

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
                    "relative px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:text-[13px]",
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
              As at 20 May 2025
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full h-10 px-6 gap-2 shadow-sm">
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

      <TabContent activeTab={activeTab} />
      <FrCampaignWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
