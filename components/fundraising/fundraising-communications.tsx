"use client"

import { useMemo, useState } from "react"
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
import {
  COMM_TYPES,
  COMMUNICATIONS,
  commTypeClass,
  sentimentClass,
  type Communication,
} from "./communications-mock-data"
import {
  FrField,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

function Detail({ item, onClose }: { item: Communication; onClose: () => void }) {
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
        <button type="button" onClick={onClose} className="rounded-[4px] p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-[12px]">
        <p className="leading-relaxed text-[#475569]">{item.summary}</p>
        <dl className="space-y-2 border-t border-[#f1f5f9] pt-3">
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Investor</dt>
            <dd className="text-right font-medium text-[#0f172a]">{item.investor}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Contact</dt>
            <dd className="text-right text-[#0f172a]">{item.contact}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Campaign</dt>
            <dd className="text-right text-[#0f172a]">{item.campaign}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Owner</dt>
            <dd className="text-right text-[#0f172a]">{item.owner}</dd>
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
        </dl>
      </div>
    </aside>
  )
}

export function FundraisingCommunications() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(COMMUNICATIONS[0].id)
  const [logOpen, setLogOpen] = useState(false)
  const [form, setForm] = useState({ subject: "ZGF II investment update", type: "Email", investor: "National Pension Authority" })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return COMMUNICATIONS.filter((c) => {
      if (q && !c.subject.toLowerCase().includes(q) && !c.investor.toLowerCase().includes(q)) return false
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      return true
    })
  }, [search, typeFilter])

  const selected =
    filtered.find((c) => c.id === selectedId) ??
    COMMUNICATIONS.find((c) => c.id === selectedId) ??
    null

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
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
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
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {COMM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{c.investor}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{c.campaign}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", sentimentClass(c.sentiment))}>
                        {c.sentiment}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{c.owner}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#94a3b8]">{c.date}</td>
                    <td className="max-w-[140px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">{c.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? <Detail item={selected} onClose={() => setSelectedId(null)} /> : null}
      </div>

      <FrSimpleWizard
        open={logOpen}
        onOpenChange={setLogOpen}
        title="Log Interaction"
        steps={[{ id: "interaction", short: "1", label: "Interaction" }, { id: "context", short: "2", label: "Investor context" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Log interaction"
        validateStep={(step) => step === "interaction" && !form.subject.trim() ? ["Subject is required"] : []}
        onSubmit={() => {
          toast.success("Interaction logged")
          setForm({ subject: "ZGF II investment update", type: "Email", investor: "National Pension Authority" })
        }}
      >
        {(step) => step === "interaction" ? <div className="space-y-3">
          <FrField label="Type">
            <select className={frSelectClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {COMM_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Subject">
            <input className={frInputClass} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </FrField>
        </div> : step === "context" ? <FrField label="Investor">
            <input className={frInputClass} value={form.investor} onChange={(e) => setForm((f) => ({ ...f, investor: e.target.value }))} />
          </FrField> : <ReviewList items={[
            { label: "Type", value: form.type },
            { label: "Subject", value: form.subject },
            { label: "Investor", value: form.investor || "Not linked" },
          ]} />}
      </FrSimpleWizard>
    </div>
  )
}
