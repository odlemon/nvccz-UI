"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CAMPAIGN_OPTIONS,
  KYC_STATUS_LABEL,
  MANDATE_STATUS_LABEL,
  ONBOARDING_CASES,
  ONBOARDING_KPIS,
  OWNER_OPTIONS,
  kycStatusClass,
  mandateStatusClass,
  type KycOnboardingStatus,
  type OnboardingCase,
  type OnboardingKpi,
  type OnboardingType,
} from "./onboarding-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  users: Users,
  shield: Shield,
  clock: Clock,
  alert: AlertTriangle,
} as const

function StatusChip({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
        className,
      )}
    >
      {label}
    </span>
  )
}

function KpiCard({ kpi }: { kpi: OnboardingKpi }) {
  const Icon = KPI_ICONS[kpi.icon]
  return (
    <div className={cn(CARD, "flex flex-col p-4")}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[6px]"
        style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <p className="mt-3 text-[12px] font-medium text-[#64748b]">{kpi.label}</p>
      <p className="mt-1.5 text-[22px] font-bold tabular-nums text-[#0f172a]">{kpi.value}</p>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{kpi.sublabel}</p>
    </div>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-[2px] bg-[#f1f5f9]">
        <div
          className="h-full rounded-[2px] bg-[#7c3aed] transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-[#64748b]">{pct}%</span>
    </div>
  )
}

function DetailPanel({
  item,
  onViewAllChecklist,
  onRequestDocs,
}: {
  item: OnboardingCase
  onViewAllChecklist: () => void
  onRequestDocs: () => void
}) {
  const done = item.checklist.filter((c) => c.done).length
  const total = item.checklist.length

  return (
    <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
      <div className="border-b border-[#f1f5f9] px-4 py-4">
        <div className="flex items-start gap-2">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">{item.investor}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              {item.type} · {item.campaign}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip label={KYC_STATUS_LABEL[item.kycStatus]} className={kycStatusClass(item.kycStatus)} />
          {item.mandateStatus ? (
            <StatusChip
              label={MANDATE_STATUS_LABEL[item.mandateStatus]}
              className={mandateStatusClass(item.mandateStatus)}
            />
          ) : null}
        </div>
        {item.complianceHold ? (
          <div className="mt-3 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-[11px] text-[#b91c1c]">
            Compliance hold — cannot admit, fund, or activate until cleared.
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-[#94a3b8]">Owner</span>
          <span className="font-medium text-[#0f172a]">{item.owner}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-[#94a3b8]">Started</span>
          <span className="text-[#64748b]">{item.startedAt}</span>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[#0f172a]">Readiness Checklist</h3>
          <span className="text-[11px] tabular-nums text-[#64748b]">
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
          <div
            className="h-full rounded-[2px] bg-[#16a34a] transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {item.checklist.slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                  c.done ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1] bg-white",
                )}
              >
                {c.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn("text-[11px]", c.done ? "text-[#64748b]" : "text-[#0f172a]")}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-[11px] font-medium text-[#2563eb] hover:underline"
          onClick={onViewAllChecklist}
        >
          View full checklist &gt;
        </button>
      </div>

      <div className="mt-auto border-t border-[#f1f5f9] px-4 py-3">
        <Button
          variant="outline"
          className="h-8 w-full rounded-full text-[11px]"
          disabled={item.complianceHold}
          onClick={onRequestDocs}
        >
          Request Documents
        </Button>
      </div>
    </aside>
  )
}

export function FundraisingOnboarding() {
  const [cases, setCases] = useState(ONBOARDING_CASES)
  const [selectedId, setSelectedId] = useState(ONBOARDING_CASES[0].id)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [form, setForm] = useState({
    investor: "Stanbic Bank Zimbabwe",
    type: "LP Commitment" as OnboardingType,
    campaign: CAMPAIGN_OPTIONS[0],
    owner: OWNER_OPTIONS[0],
  })
  const [docsNote, setDocsNote] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cases
    return cases.filter(
      (c) =>
        c.investor.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    )
  }, [cases, search])

  const selected = cases.find((c) => c.id === selectedId) ?? cases[0]

  const holdBanner = selected?.complianceHold

  function startCase() {
    if (!form.investor.trim()) return
    const next: OnboardingCase = {
      id: `ob-${Date.now()}`,
      investor: form.investor.trim(),
      type: form.type,
      kycStatus: "NOT_STARTED",
      mandateStatus: form.type === "Mandate" ? "AWARDED" : undefined,
      complianceHold: false,
      owner: form.owner,
      progress: 0,
      startedAt: "15 Jul 2026",
      campaign: form.campaign,
      checklist:
        form.type === "Mandate"
          ? [
              { id: "c1", label: "Mandate award letter acknowledged", done: false },
              { id: "c2", label: "IMA draft circulated", done: false },
              { id: "c3", label: "Custodian onboarding pack submitted", done: false },
              { id: "c4", label: "Board resolution received", done: false },
              { id: "c5", label: "Asset transition plan signed off", done: false },
              { id: "c6", label: "Go-live readiness review", done: false },
            ]
          : [
              { id: "c1", label: "Investor profile & UBO declaration", done: false },
              { id: "c2", label: "Source of funds attestation", done: false },
              { id: "c3", label: "AML / sanctions screening", done: false },
              { id: "c4", label: "Subscription agreement executed", done: false },
              { id: "c5", label: "Custodian account opened", done: false },
              { id: "c6", label: "Capital call readiness confirmed", done: false },
            ],
    }
    setCases((prev) => [next, ...prev])
    setSelectedId(next.id)
    setCreateOpen(false)
    setForm({ investor: "Stanbic Bank Zimbabwe", type: "LP Commitment", campaign: CAMPAIGN_OPTIONS[0], owner: OWNER_OPTIONS[0] })
    toast.success("Onboarding case started")
  }

  function requestDocuments() {
    if (!selected) return
    setDocsOpen(false)
    setDocsNote("")
    setCases((prev) =>
      prev.map((c) =>
        c.id === selected.id && c.kycStatus === "NOT_STARTED"
          ? { ...c, kycStatus: "DOCUMENTS_REQUESTED" as KycOnboardingStatus }
          : c.id === selected.id
            ? c
            : c,
      ),
    )
    toast.success(`Document request sent to ${selected.investor}`)
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Client Onboarding</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            KYC, compliance readiness and mandate activation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            onClick={() => toast.success("Export started")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Start Onboarding
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ONBOARDING_KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {holdBanner ? (
        <div className="mt-4 flex items-start gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
          <div>
            <p className="text-[12px] font-semibold text-[#b91c1c]">Compliance hold active</p>
            <p className="mt-0.5 text-[11px] text-[#991b1b]">
              {selected.investor} cannot be admitted, funded, or activated until the hold is
              released by Compliance.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Onboarding Cases</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {cases.length}
              </span>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="h-8 rounded-[6px] border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {[
                    "Investor",
                    "Type",
                    "KYC",
                    "Mandate",
                    "Progress",
                    "Hold",
                    "Owner",
                    "Started",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#f1f5f9] last:border-0",
                      selectedId === c.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <span className="text-[12px] font-medium text-[#0f172a]">{c.investor}</span>
                      {c.complianceHold ? (
                        <AlertTriangle className="ml-1.5 inline h-3 w-3 text-[#dc2626]" />
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{c.type}</td>
                    <td className="px-3 py-2.5">
                      <StatusChip
                        label={KYC_STATUS_LABEL[c.kycStatus]}
                        className={kycStatusClass(c.kycStatus)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">
                      {c.mandateStatus ? MANDATE_STATUS_LABEL[c.mandateStatus] : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <ProgressBar pct={c.progress} />
                    </td>
                    <td className="px-3 py-2.5">
                      {c.complianceHold ? (
                        <StatusChip label="Hold" className="bg-[#fee2e2] text-[#dc2626]" />
                      ) : (
                        <span className="text-[11px] text-[#94a3b8]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{c.owner}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94a3b8]">{c.startedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <DetailPanel
            item={selected}
            onViewAllChecklist={() => setChecklistOpen(true)}
            onRequestDocs={() => setDocsOpen(true)}
          />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Start Onboarding"
        steps={[{ id: "client", short: "1", label: "Investor" }, { id: "setup", short: "2", label: "Case setup" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Start case"
        validateStep={(step) => step === "client" && !form.investor.trim() ? ["Investor or client is required"] : []}
        onSubmit={startCase}
      >
        {(step) => step === "client" ? <div className="space-y-3">
          <FrField label="Investor / client">
            <input
              className={frInputClass}
              value={form.investor}
              onChange={(e) => setForm((f) => ({ ...f, investor: e.target.value }))}
              placeholder="e.g. Stanbic Bank Zimbabwe"
            />
          </FrField>
          <FrField label="Type">
            <select className={frSelectClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OnboardingType }))}>
              <option value="LP Commitment">LP Commitment</option><option value="Mandate">Mandate</option>
            </select>
          </FrField>
        </div> : step === "setup" ? <div className="space-y-3">
          <FrField label="Campaign">
            <select
              className={frSelectClass}
              value={form.campaign}
              onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
            >
              {CAMPAIGN_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="Owner">
            <select
              className={frSelectClass}
              value={form.owner}
              onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
            >
              {OWNER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </FrField>
        </div> : <ReviewList items={[
          { label: "Investor", value: form.investor },
          { label: "Type / campaign", value: `${form.type} · ${form.campaign}` },
          { label: "Owner", value: form.owner },
        ]} />}
      </FrSimpleWizard>

      <FrDialogShell
        open={docsOpen}
        onOpenChange={setDocsOpen}
        title="Request Documents"
        description={`Send a document request to ${selected?.investor ?? "selected case"}`}
        footer={
          <FrFormFooter
            onCancel={() => setDocsOpen(false)}
            onSubmit={requestDocuments}
            submitLabel="Send Request"
          />
        }
      >
        <div className="space-y-3">
          <p className="text-[12px] text-[#64748b]">
            Standard pack: investor profile, UBO declaration, source of funds, and certified ID
            copies.
          </p>
          <FrField label="Additional note (optional)">
            <textarea
              className={cn(frInputClass, "min-h-[72px] resize-none py-2")}
              value={docsNote}
              onChange={(e) => setDocsNote(e.target.value)}
              placeholder="Specify any additional documents required..."
            />
          </FrField>
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        title={`Readiness Checklist — ${selected?.investor ?? ""}`}
        description={`${selected?.progress ?? 0}% complete`}
        rows={(selected?.checklist ?? []).map((c) => ({
          id: c.id,
          title: c.label,
          badge: c.done ? "Done" : "Pending",
          badgeClass: c.done ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#64748b]",
        }))}
      />
    </div>
  )
}
