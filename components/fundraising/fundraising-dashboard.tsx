"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Download,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FrOpportunityWizard } from "@/components/fundraising/fundraising-create-wizards"
import { FrTableSkeleton } from "@/components/fundraising/fundraising-modals"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapCampaignCard, mapOpportunityRow, moneyLabel, asNumber } from "@/lib/fundraising/mappers"
import {
  stageChipClass,
  taskStatusClass,
  taskStatusLabel,
  type DashActivity,
  type DashTaskStatus,
} from "./dashboard-mock-data"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type DashMode = "pe_vc" | "asset_mgmt"

const AM_CAMPAIGN_TYPES = ["INSTITUTIONAL_MANDATE", "PRODUCT_LAUNCH", "DISTRIBUTOR_CAMPAIGN"]
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function safePersonName(value: unknown, fallback = "Name unavailable") {
  const name = typeof value === "string" ? value.trim() : ""
  return name && !UUID_PATTERN.test(name) ? name : fallback
}

function embeddedOwnerName(raw: Record<string, any>, mappedOwner: string) {
  const owner = raw.owner || raw.assignedOwner || raw.relationshipOwner
  const embedded =
    owner && typeof owner === "object"
      ? owner.fullName || owner.name || [owner.firstName, owner.lastName].filter(Boolean).join(" ")
      : undefined
  return safePersonName(embedded || raw.ownerName || raw.assignedOwnerName || mappedOwner)
}

function modeForCampaignType(type?: string): DashMode {
  return type && AM_CAMPAIGN_TYPES.includes(type) ? "asset_mgmt" : "pe_vc"
}

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

type MappedCampaign = ReturnType<typeof mapCampaignCard>
type MappedOpportunity = ReturnType<typeof mapOpportunityRow>

type DashTask = {
  id: string
  title: string
  related: string
  dueDate: string
  status: DashTaskStatus
  raw: Record<string, any>
}

function mapTaskRow(raw: Record<string, any>): DashTask {
  return {
    id: String(raw.id),
    title: raw.title || raw.name || "Untitled task",
    related:
      raw.investorName ||
      raw.campaignName ||
      raw.opportunityName ||
      (raw.investorId ? `Investor ${raw.investorId}` : "") ||
      (raw.campaignId ? `Campaign ${raw.campaignId}` : "") ||
      "—",
    dueDate: raw.dueDate ? new Date(raw.dueDate).toLocaleDateString() : "—",
    status: (raw.status || "NOT_STARTED") as DashTaskStatus,
    raw,
  }
}

type KpiCardDef = {
  id: string
  label: string
  amount: string
  helper: string
  pct?: number
  icon: typeof Target
  iconColor: string
  iconBg: string
  barColor?: string
}

function KpiCard({ kpi }: { kpi: KpiCardDef }) {
  const Icon = kpi.icon
  return (
    <div className={cn(CARD, "relative flex flex-col overflow-hidden p-3.5 pb-4")}>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-[6px]"
        style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="mt-2.5 text-[11px] font-medium leading-snug text-[#64748b]">{kpi.label}</p>
      <p className="mt-1.5 text-[20px] font-bold leading-none tabular-nums tracking-tight text-[#0f172a]">
        {kpi.amount}
      </p>
      <p className="mt-1.5 text-[10px] text-[#94a3b8]">{kpi.helper}</p>
      {typeof kpi.pct === "number" ? (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#f1f5f9]">
          <div
            className="h-full"
            style={{
              width: `${Math.min(kpi.pct, 100)}%`,
              backgroundColor: kpi.barColor ?? kpi.iconColor,
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function ProgressBar({
  label,
  valueM,
  targetM,
  color,
}: {
  label: string
  valueM: number
  targetM: number
  color: string
}) {
  const pct = targetM > 0 ? Math.min((valueM / targetM) * 100, 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#64748b]">{label}</span>
        <span className="font-semibold tabular-nums text-[#0f172a]">
          US${valueM.toFixed(1)}M · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
        <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
}: {
  task: DashTask
  onToggle: () => void
}) {
  const done = task.status === "COMPLETED"
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-2.5 border-b border-[#f1f5f9] px-3 py-2.5 text-left last:border-b-0 hover:bg-[#f8fafc]"
    >
      <span
        className={cn(
          "mt-0.5 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border",
          done
            ? "border-[#16a34a] bg-[#16a34a] text-white"
            : "border-[#cbd5e1] bg-white",
        )}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[12px] font-medium leading-snug text-[#0f172a]",
            done && "line-through text-[#94a3b8]",
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 text-[10px] text-[#94a3b8]">{task.related}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
              taskStatusClass(task.status),
            )}
          >
            {taskStatusLabel(task.status)}
          </span>
          <span className="text-[10px] text-[#94a3b8]">Due {task.dueDate}</span>
        </div>
      </div>
    </button>
  )
}

function ActivityIcon({ kind }: { kind: DashActivity["kind"] }) {
  const map = {
    meeting: Users,
    email: Mail,
    ddq: FileText,
    commitment: CircleDollarSign,
    call: Phone,
    document: Shield,
  }
  const Icon = map[kind]
  return <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
}

function oppInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

const LOGO_TONES = ["#f97316", "#16a34a", "#7c3aed", "#1d4ed8", "#0f766e", "#111827", "#0e7490", "#9333ea"]

function OpportunityRow({
  opp,
  mode,
  idx,
  selected,
  onSelect,
}: {
  opp: MappedOpportunity
  mode: DashMode
  idx: number
  selected: boolean
  onSelect: () => void
}) {
  const colA = mode === "pe_vc" ? opp.softCircle : opp.expectedAum
  const colB = mode === "pe_vc" ? opp.signed : opp.activatedAum
  const colC = mode === "pe_vc" ? opp.funded : "—"

  return (
    <tr
      onClick={onSelect}
      className={cn(
        "cursor-pointer border-b border-[#f1f5f9] last:border-b-0",
        selected ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
      )}
    >
      <td className="whitespace-nowrap px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
            style={{ backgroundColor: LOGO_TONES[idx % LOGO_TONES.length] }}
          >
            {oppInitials(opp.investor)}
          </span>
          <span className="text-[12px] font-medium text-[#0f172a]">{opp.investor}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">
        {opp.campaign}
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
            stageChipClass(opp.stage),
          )}
        >
          {opp.stage}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">
        {colA}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">
        {colB}
      </td>
      {mode === "pe_vc" ? (
        <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">
          {colC}
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">
        {embeddedOwnerName(opp.raw, opp.owner)}
      </td>
      <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">
        {opp.nextAction}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] tabular-nums text-[#64748b]">
        {opp.ageDays}d
      </td>
    </tr>
  )
}

export function FundraisingDashboard() {
  const [campaigns, setCampaigns] = useState<MappedCampaign[]>([])
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [mode, setMode] = useState<DashMode>("pe_vc")
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null)
  const [tasks, setTasks] = useState<DashTask[]>([])
  const [createOppOpen, setCreateOppOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null)
  const [opportunities, setOpportunities] = useState<MappedOpportunity[]>([])
  const [activities, setActivities] = useState<DashActivity[]>([])

  useEffect(() => {
    fundraisingApi
      .listCampaigns()
      .then((rows) => setCampaigns(rows.map(mapCampaignCard)))
      .catch((err) => toastFrError(err))
  }, [])

  const campaignsById = useMemo(() => {
    const map = new Map<string, MappedCampaign>()
    campaigns.forEach((c) => map.set(c.id, c))
    return map
  }, [campaigns])

  const selectedCampaign =
    campaignFilter !== "all" ? campaignsById.get(campaignFilter) : undefined

  const effectiveMode: DashMode = selectedCampaign
    ? modeForCampaignType(selectedCampaign.type)
    : mode

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = campaignFilter !== "all" ? { campaignId: campaignFilter } : {}
    Promise.all([
      fundraisingApi.getDashboard(params),
      fundraisingApi.listOpportunities(params),
      fundraisingApi.listTasks(params),
      fundraisingApi.listAuditLogs({ limit: 20 }),
    ])
      .then(([dash, opps, taskRes, auditRows]) => {
        if (cancelled) return
        setDashboard(dash || {})
        setOpportunities((opps || []).map(mapOpportunityRow))
        const rawTasks = (taskRes?.performanceTasks || []) as Record<string, any>[]
        setTasks(rawTasks.map(mapTaskRow))
        setActivities(
          (auditRows ?? []).map((row: Record<string, any>, index: number) => {
            const text = `${row.action || ""} ${row.objectType || ""}`.toLowerCase()
            const kind: DashActivity["kind"] = text.includes("meeting")
              ? "meeting"
              : text.includes("ddq")
                ? "ddq"
                : text.includes("document") || text.includes("agreement")
                  ? "document"
                  : text.includes("commitment")
                    ? "commitment"
                    : text.includes("call")
                      ? "call"
                      : "email"
            const at = row.createdAt || row.timestamp || row.occurredAt
            return {
              id: String(row.id ?? index),
              kind,
              title: row.summary || `${row.action || "Updated"} ${row.objectName || row.objectType || "record"}`,
              detail: row.details || row.objectName || row.objectType || "Fundraising activity",
              timestamp: at ? new Date(at).toLocaleString() : "—",
              actor: safePersonName(
                row.user?.fullName ||
                  row.user?.name ||
                  [row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ") ||
                  row.userName ||
                  row.actorName,
              ),
            }
          }),
        )
      })
      .catch((err) => {
        if (!cancelled) toastFrError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignFilter])

  const scopedOpportunities = useMemo(() => {
    if (campaignFilter !== "all") return opportunities
    return opportunities.filter((o) => {
      const camp = o.campaignId ? campaignsById.get(String(o.campaignId)) : undefined
      return modeForCampaignType(camp?.type) === effectiveMode
    })
  }, [opportunities, campaignFilter, campaignsById, effectiveMode])

  const kpis = useMemo(() => {
    const d = dashboard || {}
    const target = asNumber(d.targetTotal)
    const signed = asNumber(d.signedTotal)
    const admitted = asNumber(d.admittedTotal)
    const funded = asNumber(d.fundedTotal)
    const expectedAum = asNumber(d.expectedAumTotal)
    const activatedAum = asNumber(d.activatedAumTotal)
    const weighted = asNumber(d.weightedPipeline)
    const soft = scopedOpportunities.reduce((sum, o) => sum + asNumber(o.raw?.softCircleAmount), 0)
    const pct = (v: number) => (target > 0 ? Math.round((v / target) * 100) : 0)
    return {
      target,
      signed,
      admitted,
      funded,
      expectedAum,
      activatedAum,
      weighted,
      soft,
      pctSigned: pct(signed),
      pctAdmitted: pct(admitted),
      pctFunded: pct(funded),
      pctSoft: pct(soft),
      pctExpectedAum: pct(expectedAum),
      pctActivatedAum: pct(activatedAum),
    }
  }, [dashboard, scopedOpportunities])

  const kpiCards: KpiCardDef[] = useMemo(() => {
    if (effectiveMode === "asset_mgmt") {
      return [
        {
          id: "target",
          label: "AUM Target",
          amount: moneyLabel(kpis.target),
          helper: "Mandate target",
          icon: Target,
          iconColor: "#7c3aed",
          iconBg: "#ede9fe",
        },
        {
          id: "soft",
          label: "Qualified Interest",
          amount: moneyLabel(kpis.soft),
          helper: `${kpis.pctSoft}% of target`,
          pct: kpis.pctSoft,
          icon: Users,
          iconColor: "#2563eb",
          iconBg: "#dbeafe",
          barColor: "#2563eb",
        },
        {
          id: "expected",
          label: "Expected AUM",
          amount: moneyLabel(kpis.expectedAum),
          helper: `${kpis.pctExpectedAum}% of target`,
          pct: kpis.pctExpectedAum,
          icon: TrendingUp,
          iconColor: "#d97706",
          iconBg: "#fef3c7",
          barColor: "#d97706",
        },
        {
          id: "signed",
          label: "Agreements Signed",
          amount: moneyLabel(kpis.signed),
          helper: `${kpis.pctSigned}% of target`,
          pct: kpis.pctSigned,
          icon: BadgeCheck,
          iconColor: "#7c3aed",
          iconBg: "#ede9fe",
          barColor: "#7c3aed",
        },
        {
          id: "activated",
          label: "Activated AUM",
          amount: moneyLabel(kpis.activatedAum),
          helper: "Assets under management",
          pct: kpis.pctActivatedAum,
          icon: Wallet,
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
          barColor: "#16a34a",
        },
        {
          id: "weighted",
          label: "Weighted Pipeline",
          amount: moneyLabel(kpis.weighted),
          helper: "Prob × confidence",
          icon: Coins,
          iconColor: "#2563eb",
          iconBg: "#dbeafe",
        },
      ]
    }

    return [
      {
        id: "target",
        label: "Fundraising Target",
        amount: moneyLabel(kpis.target),
        helper: "Campaign target",
        icon: Target,
        iconColor: "#7c3aed",
        iconBg: "#ede9fe",
      },
      {
        id: "soft",
        label: "Soft Circled",
        amount: moneyLabel(kpis.soft),
        helper: `${kpis.pctSoft}% of target · non-binding`,
        pct: kpis.pctSoft,
        icon: Users,
        iconColor: "#7c3aed",
        iconBg: "#ede9fe",
        barColor: "#7c3aed",
      },
      {
        id: "signed",
        label: "Signed Commitments",
        amount: moneyLabel(kpis.signed),
        helper: `${kpis.pctSigned}% · not cash`,
        pct: kpis.pctSigned,
        icon: BadgeCheck,
        iconColor: "#2563eb",
        iconBg: "#dbeafe",
        barColor: "#2563eb",
      },
      {
        id: "admitted",
        label: "Admitted at Close",
        amount: moneyLabel(kpis.admitted),
        helper: `${kpis.pctAdmitted}% of target`,
        pct: kpis.pctAdmitted,
        icon: Shield,
        iconColor: "#0f766e",
        iconBg: "#ccfbf1",
        barColor: "#0f766e",
      },
      {
        id: "funded",
        label: "Funded",
        amount: moneyLabel(kpis.funded),
        helper: `${kpis.pctFunded}% · cash received`,
        pct: kpis.pctFunded,
        icon: Wallet,
        iconColor: "#16a34a",
        iconBg: "#dcfce7",
        barColor: "#16a34a",
      },
      {
        id: "weighted",
        label: "Weighted Pipeline",
        amount: moneyLabel(kpis.weighted),
        helper: "Prob × confidence",
        icon: Coins,
        iconColor: "#d97706",
        iconBg: "#fef3c7",
      },
    ]
  }, [effectiveMode, kpis])

  const progress = useMemo(() => {
    const targetM = kpis.target / 1_000_000
    const signedM = kpis.signed / 1_000_000
    const fundedM = (effectiveMode === "asset_mgmt" ? kpis.activatedAum : kpis.funded) / 1_000_000
    return {
      targetM,
      signedM,
      fundedM,
      remainingM: Math.max(targetM - signedM, 0),
      signedLabel: effectiveMode === "asset_mgmt" ? "Agreements signed" : "Signed commitments",
      fundedLabel: effectiveMode === "asset_mgmt" ? "Activated AUM" : "Funded capital",
    }
  }, [kpis, effectiveMode])

  const coverage = useMemo(() => {
    const d = dashboard || {}
    const ratio = asNumber(d.coverageRatio)
    const remaining = Math.max(kpis.target - kpis.signed, 0)
    return {
      grossPipeline: moneyLabel(d.grossPipeline),
      weightedPipeline: moneyLabel(d.weightedPipeline),
      remainingTarget: moneyLabel(remaining),
      coverageRatio: ratio ? `${ratio.toFixed(2)}×` : "—",
      coveragePct: Math.round(ratio * 100),
    }
  }, [dashboard, kpis])

  const funnel = useMemo(() => {
    const order: string[] = []
    const byStage = new Map<string, { count: number; amount: number }>()
    scopedOpportunities.forEach((o) => {
      const key = o.stage
      if (!byStage.has(key)) {
        byStage.set(key, { count: 0, amount: 0 })
        order.push(key)
      }
      const entry = byStage.get(key)!
      entry.count += 1
      entry.amount += asNumber(o.raw?.indicativeAmount ?? o.raw?.softCircleAmount)
    })
    return order.map((label) => ({
      id: label,
      label,
      count: byStage.get(label)!.count,
      amount: moneyLabel(byStage.get(label)!.amount),
    }))
  }, [scopedOpportunities])

  const filteredOpportunities = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedOpportunities.filter((o) => {
      if (stageFilter && o.stage.toLowerCase() !== stageFilter.toLowerCase()) return false
      if (q && !o.investor.toLowerCase().includes(q)) return false
      return true
    })
  }, [scopedOpportunities, stageFilter, search])

  async function toggleTask(task: DashTask) {
    const next: DashTaskStatus = task.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED"
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      await fundraisingApi.patchTask(task.id, { status: next })
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      toastFrError(err)
    }
  }

  function onCampaignChange(v: string) {
    setCampaignFilter(v)
    setStageFilter(null)
    setSelectedOpp(null)
    const camp = v !== "all" ? campaignsById.get(v) : undefined
    if (camp) setMode(modeForCampaignType(camp.type))
  }

  function exportDashboard() {
    exportFundraisingCsv(
      filteredOpportunities.map((opp) => ({
        investor: opp.investor,
        campaign: opp.campaign,
        stage: opp.stage,
        proposed: opp.proposed,
        softCircle: opp.softCircle,
        signed: opp.signed,
        funded: opp.funded,
        owner: embeddedOwnerName(opp.raw, opp.owner),
        nextAction: opp.nextAction,
        ageDays: opp.ageDays,
      })),
      [
        { key: "investor", label: "Investor" },
        { key: "campaign", label: "Campaign" },
        { key: "stage", label: "Stage" },
        { key: "proposed", label: "Proposed Amount" },
        { key: "softCircle", label: "Soft Circle" },
        { key: "signed", label: "Signed" },
        { key: "funded", label: "Funded" },
        { key: "owner", label: "Owner" },
        { key: "nextAction", label: "Next Action" },
        { key: "ageDays", label: "Days in Stage" },
      ],
      "fundraising-dashboard-opportunities",
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Fundraising Dashboard
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            {selectedCampaign ? selectedCampaign.name : "All Campaigns"}
            {selectedCampaign ? (
              <span className="text-[#94a3b8]"> · {formatType(selectedCampaign.type)}</span>
            ) : (
              <span className="text-[#94a3b8]">
                {" "}
                · {effectiveMode === "pe_vc" ? "PE/VC commitments view" : "Asset management AUM view"}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={campaignFilter} onValueChange={onCampaignChange}>
            <SelectTrigger className="h-9 w-[200px] rounded-full border-[#e2e8f0] text-[12px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {campaignFilter === "all" ? (
            <div className="inline-flex rounded-full border border-[#e2e8f0] bg-white p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode("pe_vc")
                  setStageFilter(null)
                }}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  effectiveMode === "pe_vc"
                    ? "rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "rounded-full text-[#64748b] hover:bg-[#f8fafc]",
                )}
              >
                PE/VC
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("asset_mgmt")
                  setStageFilter(null)
                }}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  effectiveMode === "asset_mgmt"
                    ? "rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "rounded-full text-[#64748b] hover:bg-[#f8fafc]",
                )}
              >
                Asset Mgmt
              </button>
            </div>
          ) : null}

          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#64748b]">
            <CalendarDays className="h-3.5 w-3.5" />
            {loading ? "Refreshing…" : "Live"}
          </span>
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            onClick={exportDashboard}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOppOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {loading && !dashboard ? (
          <div className="col-span-2 flex items-center justify-center py-10 text-[#94a3b8] md:col-span-3 xl:col-span-6">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          kpiCards.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)
        )}
      </div>

      {/* Mid row */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Campaign progress */}
        <div className={cn(CARD, "p-4")}>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Campaign Progress</h2>
            <Link
              href="/fundraising/commitments"
              className="text-[11px] font-medium text-[#2563eb] hover:underline"
            >
              Closings &gt;
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            <ProgressBar
              label="Target"
              valueM={progress.targetM}
              targetM={progress.targetM}
              color="#cbd5e1"
            />
            <ProgressBar
              label={progress.signedLabel}
              valueM={progress.signedM}
              targetM={progress.targetM}
              color="#7c3aed"
            />
            <ProgressBar
              label={progress.fundedLabel}
              valueM={progress.fundedM}
              targetM={progress.targetM}
              color="#16a34a"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f1f5f9] pt-3 text-[11px]">
            <div>
              <p className="text-[#94a3b8]">Start date</p>
              <p className="mt-0.5 font-semibold text-[#0f172a]">
                {selectedCampaign?.startDate
                  ? new Date(selectedCampaign.startDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[#94a3b8]">Target close</p>
              <p className="mt-0.5 font-semibold text-[#0f172a]">
                {selectedCampaign?.closeDate
                  ? new Date(selectedCampaign.closeDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[#94a3b8]">Remaining to target</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-[#0f172a]">
                US${progress.remainingM.toFixed(1)}M
              </p>
            </div>
          </div>
        </div>

        {/* Coverage */}
        <div className={cn(CARD, "p-4")}>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Coverage & Forecast</h2>
            <Link
              href="/fundraising/forecasts"
              className="text-[11px] font-medium text-[#2563eb] hover:underline"
            >
              Forecasts &gt;
            </Link>
          </div>
          <div className="mt-4 space-y-2.5 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Gross pipeline</span>
              <span className="font-semibold tabular-nums text-[#0f172a]">
                {coverage.grossPipeline}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Weighted pipeline</span>
              <span className="font-semibold tabular-nums text-[#0f172a]">
                {coverage.weightedPipeline}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Remaining target</span>
              <span className="font-semibold tabular-nums text-[#0f172a]">
                {coverage.remainingTarget}
              </span>
            </div>
            <div className="rounded-[6px] bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748b]">Coverage ratio</span>
                <span className="text-lg font-bold tabular-nums text-[#7c3aed]">
                  {coverage.coverageRatio}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#e2e8f0]">
                <div
                  className="h-full rounded-[2px] bg-[#7c3aed]"
                  style={{ width: `${Math.min(coverage.coveragePct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className={cn(CARD, "flex flex-col overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Stage Funnel</h2>
            {stageFilter ? (
              <button
                type="button"
                onClick={() => setStageFilter(null)}
                className="rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:underline"
              >
                Clear filter
              </button>
            ) : (
              <span className="text-[10px] text-[#94a3b8]">Click to filter</span>
            )}
          </div>
          <ul className="flex-1 divide-y divide-[#f1f5f9]">
            {funnel.length === 0 ? (
              <li className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
                No opportunities yet.
              </li>
            ) : (
              funnel.map((stage) => {
                const active = stageFilter?.toLowerCase() === stage.label.toLowerCase()
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setStageFilter((prev) =>
                          prev?.toLowerCase() === stage.label.toLowerCase()
                            ? null
                            : stage.label,
                        )
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors",
                        active ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-[#0f172a]">{stage.label}</p>
                        <p className="text-[10px] text-[#94a3b8]">{stage.count} opportunities</p>
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#0f172a]">
                        {stage.amount}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Opportunities */}
        <section className={cn(CARD, "flex min-w-0 flex-col overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Open Opportunities</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filteredOpportunities.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search investors..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
                />
              </div>
              <Link
                href="/fundraising/pipeline"
                className="text-[11px] font-medium text-[#2563eb] hover:underline"
              >
                View pipeline &gt;
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Investor</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Campaign</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Stage</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                    {effectiveMode === "pe_vc" ? "Soft Circle" : "Expected AUM"}
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                    {effectiveMode === "pe_vc" ? "Signed" : "Activated AUM"}
                  </th>
                  {effectiveMode === "pe_vc" ? (
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Funded</th>
                  ) : null}
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Owner</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Next Action</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Age</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <FrTableSkeleton columns={effectiveMode === "pe_vc" ? 9 : 8} rows={5} />
                ) : filteredOpportunities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={effectiveMode === "pe_vc" ? 9 : 8}
                      className="px-3 py-10 text-center text-[13px] text-[#94a3b8]"
                    >
                      No opportunities match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp, idx) => (
                    <OpportunityRow
                      key={opp.id}
                      opp={opp}
                      mode={effectiveMode}
                      idx={idx}
                      selected={selectedOpp === opp.id}
                      onSelect={() => setSelectedOpp(opp.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tasks + Activity */}
        <aside className="flex flex-col gap-4">
          <div className={cn(CARD, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-3 py-3">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">My Tasks</h2>
              <Link
                href="/fundraising/meetings"
                className="text-[11px] font-medium text-[#2563eb] hover:underline"
              >
                View all &gt;
              </Link>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-[#94a3b8]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="px-3 py-10 text-center text-[12px] text-[#94a3b8]">No open tasks.</p>
              ) : (
                tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} />
                ))
              )}
            </div>
          </div>

          <div className={cn(CARD, "overflow-hidden")}>
            <div className="border-b border-[#f1f5f9] px-3 py-3">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Recent Activity</h2>
            </div>
            <ul className="max-h-[300px] divide-y divide-[#f1f5f9] overflow-y-auto">
              {loading ? (
                <li className="px-3 py-10 text-center text-[12px] text-[#94a3b8]">Loading activity…</li>
              ) : activities.length === 0 ? (
                <li className="px-3 py-10 text-center text-[12px] text-[#94a3b8]">
                  No recent activity from the audit log.
                </li>
              ) : (
                activities.map((item) => (
                  <li key={item.id} className="flex gap-2.5 px-3 py-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
                      <ActivityIcon kind={item.kind} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium leading-snug text-[#0f172a]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-[#64748b]">{item.detail}</p>
                      <p className="mt-1 text-[10px] text-[#94a3b8]">
                        {item.actor} · {item.timestamp}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
      <FrOpportunityWizard
        open={createOppOpen}
        onOpenChange={setCreateOppOpen}
        campaignId={campaignFilter !== "all" ? campaignFilter : undefined}
        onCreated={() => {
          const params = campaignFilter !== "all" ? { campaignId: campaignFilter } : {}
          fundraisingApi
            .listOpportunities(params)
            .then((rows) => setOpportunities(rows.map(mapOpportunityRow)))
            .catch((err) => toastFrError(err))
          fundraisingApi
            .getDashboard(params)
            .then((dash) => setDashboard(dash || {}))
            .catch((err) => toastFrError(err))
        }}
      />
    </div>
  )
}
