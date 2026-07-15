"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  FileSignature,
  PenLine,
  Plus,
  Stamp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FR_AGREEMENTS,
  sigStatusClass,
  type AgreementType,
  type FrAgreement,
  type SigStatus,
} from "./agreements-mock-data"
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

const SIG_INK = ["#1e3a5f", "#0f766e", "#7c2d12", "#1d4ed8", "#4c1d95"] as const

function signatureStyle(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % SIG_INK.length
  return SIG_INK[h]
}

/** Decorative cursive signature block for mock e-sign UI */
function SignatureMark({
  name,
  signed,
  signedAt,
}: {
  name: string
  signed: boolean
  signedAt?: string | null
}) {
  const ink = signatureStyle(name)
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] border px-3 py-2.5",
        signed ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-dashed border-[#cbd5e1] bg-[#f8fafc]",
      )}
    >
      {signed ? (
        <>
          <p
            className="select-none text-[22px] leading-none tracking-wide"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              color: ink,
              transform: "rotate(-4deg)",
            }}
          >
            {name.split(" ")[0]} {name.split(" ").slice(-1)[0]?.[0]}.
          </p>
          <div className="mt-1 h-px w-full bg-[#94a3b8]/60" />
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#15803d]">
            <CheckCircle2 className="h-3 w-3" />
            Signed{signedAt ? ` · ${signedAt}` : ""}
          </p>
          <svg
            className="pointer-events-none absolute -right-1 -top-1 h-10 w-10 opacity-[0.12]"
            viewBox="0 0 40 40"
            aria-hidden
          >
            <circle cx="20" cy="20" r="14" fill="none" stroke={ink} strokeWidth="2" />
            <path d="M12 21l5 5 11-12" fill="none" stroke={ink} strokeWidth="2.5" />
          </svg>
        </>
      ) : (
        <>
          <div className="flex h-8 items-end border-b border-dashed border-[#94a3b8]/70 pb-1">
            <span className="text-[11px] italic text-[#94a3b8]">Awaiting signature…</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#c2410c]">
            <Clock className="h-3 w-3" /> Pending
          </p>
        </>
      )}
    </div>
  )
}

function typeBadge(type: AgreementType) {
  const map: Record<string, string> = {
    NDA: "bg-[#e0e7ff] text-[#3730a3]",
    Subscription: "bg-[#dcfce7] text-[#166534]",
    LPA: "bg-[#fce7f3] text-[#9d174d]",
    "Side Letter": "bg-[#ffedd5] text-[#c2410c]",
    IMA: "bg-[#dbeafe] text-[#1d4ed8]",
    "Term Sheet": "bg-[#fef3c7] text-[#b45309]",
    "Fee Schedule": "bg-[#f1f5f9] text-[#475569]",
  }
  return map[type] ?? "bg-[#f1f5f9] text-[#64748b]"
}

export function FundraisingAgreements() {
  const [tab, setTab] = useState<"agreements" | "signatures">("agreements")
  const [items, setItems] = useState(FR_AGREEMENTS)
  const [selectedId, setSelectedId] = useState(FR_AGREEMENTS[0].id)
  const [createOpen, setCreateOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sigsOpen, setSigsOpen] = useState(false)
  const [form, setForm] = useState({
    name: "NMBZ Holdings — Subscription Agreement",
    type: "Subscription" as AgreementType,
    investor: "NMBZ Holdings Limited",
    campaign: "ZGF II",
  })
  const [sigForm, setSigForm] = useState({
    signatory: "Tendai Mawoyo",
    role: "Investor signatory",
  })

  const selected = items.find((a) => a.id === selectedId) ?? items[0]

  const signatureQueue = useMemo(
    () => items.filter((a) => a.status === "Sent" || a.status === "Partially Signed"),
    [items],
  )

  const list = tab === "agreements" ? items : signatureQueue
  const completedCount = items.filter((a) => a.status === "Completed").length
  const pendingSigs = items.reduce(
    (n, a) => n + a.signatories.filter((s) => s.status === "Pending").length,
    0,
  )

  function createAgreement() {
    if (!form.name.trim()) return
    const ag: FrAgreement = {
      id: `ag-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      investor: form.investor,
      campaign: form.campaign,
      version: "v1",
      status: "Draft",
      signatories: [],
      sentDate: null,
      expiry: null,
      owner: "You",
    }
    setItems((p) => [ag, ...p])
    setSelectedId(ag.id)
    setCreateOpen(false)
    setForm({
      name: "NMBZ Holdings — Subscription Agreement",
      type: "Subscription",
      investor: "NMBZ Holdings Limited",
      campaign: "ZGF II",
    })
    toast.success("Agreement created")
  }

  function sendForSignature() {
    if (!sigForm.signatory.trim() || !selected) return
    setItems((prev) =>
      prev.map((a) => {
        if (a.id !== selected.id) return a
        return {
          ...a,
          status: "Sent" as SigStatus,
          sentDate: "15 Jul 2026",
          expiry: "29 Jul 2026",
          signatories: [
            ...a.signatories,
            {
              id: `s-${Date.now()}`,
              name: sigForm.signatory.trim(),
              role: sigForm.role,
              status: "Pending" as const,
              signedAt: null,
            },
          ],
        }
      }),
    )
    setSendOpen(false)
    setSigForm({ signatory: "Tendai Mawoyo", role: "Investor signatory" })
    toast.success("Signature request sent")
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Agreements & Signatures</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Versioned e-sign packets — each signature is bound to a document version
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => setSendOpen(true)}>
            <PenLine className="h-4 w-4" /> Send for Signature
          </Button>
          <Button
            variant="gradient-info"
            className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> New Agreement
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Agreements", value: items.length, icon: FileSignature },
          { label: "Fully executed", value: completedCount, icon: Stamp },
          { label: "Open requests", value: signatureQueue.length, icon: PenLine },
          { label: "Pending signers", value: pendingSigs, icon: Clock },
        ].map((k) => (
          <div key={k.label} className={cn(CARD, "flex items-center gap-3 p-3.5")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600">
              <k.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] text-[#64748b]">{k.label}</p>
              <p className="text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11px] text-[#92400e]">
        Guardrail: uploading a new agreement version invalidates outstanding signature requests for that document.
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex items-center gap-4 border-b border-[#f1f5f9] px-3 pt-3">
            <button
              type="button"
              onClick={() => setTab("agreements")}
              className={cn(
                "border-b-2 pb-2.5 text-[12px] font-medium",
                tab === "agreements"
                  ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                  : "border-transparent text-[#94a3b8]",
              )}
            >
              Agreements ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("signatures")}
              className={cn(
                "border-b-2 pb-2.5 text-[12px] font-medium",
                tab === "signatures"
                  ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                  : "border-transparent text-[#94a3b8]",
              )}
            >
              Signature requests ({signatureQueue.length})
            </button>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {list.map((a) => {
              const signed = a.signatories.filter((s) => s.status === "Signed").length
              const total = a.signatories.length
              const pct = total ? Math.round((signed / total) * 100) : 0
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    "flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
                    selectedId === a.id ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-[#0f172a]">{a.name}</p>
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", typeBadge(a.type))}>
                        {a.type}
                      </span>
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", sigStatusClass(a.status))}>
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#64748b]">
                      {a.investor} · {a.campaign} · {a.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-[160px]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-[#64748b]">
                      {total ? `${signed}/${total}` : "—"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selected ? (
          <aside className={cn(CARD, "overflow-hidden")}>
            <div className="border-b border-[#f1f5f9] bg-gradient-to-r from-[#eff6ff] to-[#ecfeff] px-4 py-3.5">
              <div className="flex items-start gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <FileSignature className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold text-[#0f172a]">{selected.name}</h2>
                  <p className="text-[11px] text-[#64748b]">
                    {selected.type} · {selected.version} · Owner {selected.owner}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-[#334155]">{selected.investor}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", sigStatusClass(selected.status))}>
                  {selected.status}
                </span>
                {selected.sentDate ? (
                  <span className="text-[10px] text-[#64748b]">Sent {selected.sentDate}</span>
                ) : null}
                {selected.expiry ? (
                  <span className="text-[10px] text-[#b45309]">Expires {selected.expiry}</span>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[#0f172a]">Signature pad</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#2563eb] hover:underline"
                  onClick={() => setSigsOpen(true)}
                >
                  View history
                </button>
              </div>

              {selected.signatories.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center">
                  <PenLine className="mx-auto h-6 w-6 text-[#94a3b8]" />
                  <p className="mt-2 text-[12px] text-[#64748b]">No signatories yet</p>
                  <Button
                    variant="gradient-info"
                    className="mt-3 rounded-full h-8 px-4 text-[11px]"
                    onClick={() => setSendOpen(true)}
                  >
                    Add signatory
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selected.signatories.map((s) => (
                    <li key={s.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-medium text-[#0f172a]">{s.name}</p>
                          <p className="text-[10px] text-[#94a3b8]">{s.role}</p>
                        </div>
                      </div>
                      <SignatureMark
                        name={s.name}
                        signed={s.status === "Signed"}
                        signedAt={s.signedAt}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Agreement"
        steps={[
          { id: "identity", short: "1", label: "Agreement" },
          { id: "parties", short: "2", label: "Parties" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel="Create agreement"
        validateStep={(step) =>
          step === "identity" && !form.name.trim() ? ["Agreement name is required"] : []
        }
        onSubmit={createAgreement}
      >
        {(step) =>
          step === "identity" ? (
            <div className="space-y-3">
              <FrField label="Name">
                <input
                  className={frInputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </FrField>
              <FrField label="Type">
                <select
                  className={frSelectClass}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AgreementType }))}
                >
                  {["NDA", "Term Sheet", "Subscription", "LPA", "Side Letter", "IMA", "Fee Schedule"].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    ),
                  )}
                </select>
              </FrField>
            </div>
          ) : step === "parties" ? (
            <div className="space-y-3">
              <FrField label="Investor">
                <Input
                  className="h-9 rounded-[6px] text-[12px]"
                  value={form.investor}
                  onChange={(e) => setForm((f) => ({ ...f, investor: e.target.value }))}
                />
              </FrField>
              <FrField label="Campaign">
                <select
                  className={frSelectClass}
                  value={form.campaign}
                  onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
                >
                  <option>ZGF II</option>
                  <option>Institutional Mandates FY25</option>
                </select>
              </FrField>
            </div>
          ) : (
            <ReviewList
              items={[
                { label: "Agreement", value: form.name },
                { label: "Type", value: form.type },
                { label: "Investor", value: form.investor },
                { label: "Campaign", value: form.campaign },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrDialogShell
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Send for Signature"
        description={`Add a signatory to ${selected?.name ?? "selected agreement"}`}
        size="lg"
        footer={
          <FrFormFooter
            onCancel={() => setSendOpen(false)}
            onSubmit={sendForSignature}
            submitLabel="Send request"
            submitDisabled={!sigForm.signatory.trim()}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <FrField label="Signatory name">
              <input
                className={frInputClass}
                value={sigForm.signatory}
                onChange={(e) => setSigForm((f) => ({ ...f, signatory: e.target.value }))}
              />
            </FrField>
            <FrField label="Role">
              <select
                className={frSelectClass}
                value={sigForm.role}
                onChange={(e) => setSigForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option>Investor signatory</option>
                <option>Fund signatory</option>
                <option>Witness</option>
              </select>
            </FrField>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium text-[#64748b]">Signature preview</p>
            <SignatureMark name={sigForm.signatory || "Signatory"} signed={false} />
          </div>
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={sigsOpen}
        onOpenChange={setSigsOpen}
        title={`Signatories — ${selected?.name ?? ""}`}
        size="xl"
        rows={(selected?.signatories ?? []).map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.role,
          meta: s.signedAt ? `Signed ${s.signedAt}` : "Awaiting signature",
          badge: s.status,
          badgeClass:
            s.status === "Signed"
              ? "bg-[#dcfce7] text-[#15803d]"
              : s.status === "Declined"
                ? "bg-[#fee2e2] text-[#dc2626]"
                : "bg-[#ffedd5] text-[#c2410c]",
        }))}
      />
    </div>
  )
}
