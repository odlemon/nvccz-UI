"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  FileSignature,
  Loader2,
  PenLine,
  Plus,
  Stamp,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapAgreementRow } from "@/lib/fundraising/mappers"
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

type FrAgreement = ReturnType<typeof mapAgreementRow>

const DOCUMENT_TYPES = [
  "NDA",
  "TERM_SHEET",
  "SUBSCRIPTION_AGREEMENT",
  "LPA",
  "SIDE_LETTER",
  "CO_INVESTMENT_AGREEMENT",
  "IMA",
  "MANDATE",
  "FEE_SCHEDULE",
  "INVESTMENT_GUIDELINES",
]

function sigStatusClass(s: string) {
  const u = s.toUpperCase()
  if (u === "COMPLETED") return "bg-[#dcfce7] text-[#15803d]"
  if (u === "SENT" || u === "PARTIALLY SIGNED" || u === "PARTIALLY_SIGNED") return "bg-[#dbeafe] text-[#1d4ed8]"
  if (u === "EXPIRED" || u === "VOIDED" || u === "VOID") return "bg-[#fee2e2] text-[#dc2626]"
  return "bg-[#f1f5f9] text-[#64748b]"
}

function typeBadge(type: string) {
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

const SIG_INK = ["#1e3a5f", "#0f766e", "#7c2d12", "#1d4ed8", "#4c1d95"] as const

function signatureStyle(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % SIG_INK.length
  return SIG_INK[h]
}

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

export function FundraisingAgreements() {
  const [loading, setLoading] = useState(true)
  const [rawAgreements, setRawAgreements] = useState<Record<string, any>[]>([])
  const [tab, setTab] = useState<"agreements" | "signatures">("agreements")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sigsOpen, setSigsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingVersion, setUploadingVersion] = useState(false)
  const [signingId, setSigningId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loadingRefs, setLoadingRefs] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])

  const [form, setForm] = useState({
    documentType: DOCUMENT_TYPES[0],
    title: "",
    investorId: "",
    campaignId: "",
  })
  const [sigForm, setSigForm] = useState({ fullName: "", email: "", role: "", sequenceOrder: "1", expiresAt: "" })

  const items = useMemo(() => rawAgreements.map(mapAgreementRow), [rawAgreements])
  const selected = items.find((a) => a.id === selectedId) ?? null

  const signatureQueue = useMemo(
    () => items.filter((a) => a.status === "Sent" || a.status === "Partially Signed"),
    [items],
  )

  const list = tab === "agreements" ? items : signatureQueue
  const completedCount = items.filter((a) => a.status === "Completed").length
  const pendingSigs = items.reduce((n, a) => n + a.signatories.filter((s) => s.status === "Pending").length, 0)

  async function loadAgreements() {
    setLoading(true)
    try {
      const res = await fundraisingApi.listAgreements()
      setRawAgreements(res ?? [])
    } catch (err) {
      toastFrError(err, "Could not load agreements")
      setRawAgreements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgreements()
  }, [])

  useEffect(() => {
    if (!createOpen) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
    ])
      .then(([invRes, campRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [createOpen])

  function resetForm() {
    setForm({ documentType: DOCUMENT_TYPES[0], title: "", investorId: "", campaignId: "" })
  }

  async function submitCreate() {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const created = await fundraisingApi.createAgreement({
        documentType: form.documentType,
        title: form.title.trim(),
        investorId: form.investorId || undefined,
        campaignId: form.campaignId || undefined,
      })
      toast.success("Agreement created")
      resetForm()
      setCreateOpen(false)
      await loadAgreements()
      if (created?.id) setSelectedId(String(created.id))
    } catch (err) {
      toastFrError(err, "Could not create agreement")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSignatory() {
    if (!selected || !sigForm.fullName.trim()) return
    setSubmitting(true)
    try {
      await fundraisingApi.addSignatory(selected.id, {
        fullName: sigForm.fullName.trim(),
        email: sigForm.email.trim() || undefined,
        role: sigForm.role.trim() || undefined,
        sequenceOrder: Number(sigForm.sequenceOrder) || 1,
        expiresAt: sigForm.expiresAt ? new Date(sigForm.expiresAt).toISOString() : undefined,
      })
      toast.success("Signature request sent")
      setSigForm({ fullName: "", email: "", role: "", sequenceOrder: "1", expiresAt: "" })
      setSendOpen(false)
      await loadAgreements()
    } catch (err) {
      toastFrError(err, "Could not send signature request")
    } finally {
      setSubmitting(false)
    }
  }

  async function markSigned(signatoryId: string) {
    if (!selected) return
    setSigningId(signatoryId)
    try {
      await fundraisingApi.signSignatory(selected.id, signatoryId, {
        certificateRef: `manual-ack-${new Date().toISOString()}`,
      })
      toast.success("Marked as signed")
      await loadAgreements()
    } catch (err) {
      toastFrError(err, "Could not mark as signed")
    } finally {
      setSigningId(null)
    }
  }

  async function handleVersionFile(file: File | null) {
    if (!file || !selected) return
    setUploadingVersion(true)
    try {
      await fundraisingApi.uploadAgreementVersion(selected.id, file)
      toast.success("New version uploaded", { description: "Pending signatures on the prior version are invalidated." })
      await loadAgreements()
    } catch (err) {
      toastFrError(err, "Could not upload version")
    } finally {
      setUploadingVersion(false)
    }
  }

  function handleExport() {
    exportFundraisingCsv(
      items,
      [
        { key: "name", label: "Agreement" },
        { key: "type", label: "Type" },
        { key: "investor", label: "Investor" },
        { key: "campaign", label: "Campaign" },
        { key: "version", label: "Version" },
        { key: "status", label: "Status" },
        { key: "owner", label: "Owner" },
        { key: "sentDate", label: "Sent date" },
        { key: "expiry", label: "Expiry" },
        {
          key: "signatories",
          label: "Signatories",
          value: (agreement) =>
            agreement.signatories.map((signatory) => `${signatory.name} (${signatory.status})`).join("; "),
        },
      ],
      "fundraising-agreements",
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          handleVersionFile(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Agreements & Signatures</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Versioned e-sign packets — each signature is bound to a document version
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            disabled={!selected}
            onClick={() => setSendOpen(true)}
          >
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

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className={cn(CARD, "space-y-4 p-4")}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 border-b border-[#f1f5f9] pb-4 last:border-0">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-2 w-28 rounded-full" />
              </div>
            ))}
          </div>
          <div className={cn(CARD, "space-y-4 p-4")}>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full rounded-[8px]" />
            <Skeleton className="h-20 w-full rounded-[8px]" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          No agreements yet. Create one to start an e-sign packet.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className={cn(CARD, "overflow-hidden")}>
            <div className="flex items-center gap-4 border-b border-[#f1f5f9] px-3 pt-3">
              <button
                type="button"
                onClick={() => setTab("agreements")}
                className={cn(
                  "rounded-full border-b-2 px-3 pb-2.5 pt-1 text-[12px] font-medium",
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
                  "rounded-full border-b-2 px-3 pb-2.5 pt-1 text-[12px] font-medium",
                  tab === "signatures"
                    ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                    : "border-transparent text-[#94a3b8]",
                )}
              >
                Signature requests ({signatureQueue.length})
              </button>
            </div>
            {list.length === 0 ? (
              <p className="px-4 py-12 text-center text-[12px] text-[#94a3b8]">
                No {tab === "agreements" ? "agreements" : "open signature requests"} to show.
              </p>
            ) : (
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
                        "flex w-full flex-col gap-2 rounded-full px-4 py-3.5 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
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
            )}
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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                      disabled={uploadingVersion}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingVersion ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                      New version
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                      onClick={() => setSigsOpen(true)}
                    >
                      View history
                    </button>
                  </div>
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
                          {s.status === "Pending" ? (
                            <button
                              type="button"
                              disabled={signingId === s.id}
                              onClick={() => markSigned(s.id)}
                              className="rounded-full border border-[#e2e8f0] px-2.5 py-1 text-[10px] font-medium text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-50"
                            >
                              {signingId === s.id ? "Signing…" : "Mark signed"}
                            </button>
                          ) : null}
                        </div>
                        <SignatureMark name={s.name} signed={s.status === "Signed"} signedAt={s.signedAt} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      )}

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) resetForm()
        }}
        title="New Agreement"
        steps={[
          { id: "identity", short: "1", label: "Agreement" },
          { id: "parties", short: "2", label: "Parties" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel={submitting ? "Creating…" : "Create agreement"}
        validateStep={(step) => (step === "identity" && !form.title.trim() ? ["Title is required"] : [])}
        onFinish={submitCreate}
      >
        {(step) =>
          step === "identity" ? (
            <div className="space-y-3">
              <FrField label="Title">
                <input
                  className={frInputClass}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Subscription — NPF"
                />
              </FrField>
              <FrField label="Document type">
                <select
                  className={frSelectClass}
                  value={form.documentType}
                  onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </FrField>
            </div>
          ) : step === "parties" ? (
            <div className="space-y-3">
              <FrField label="Investor (optional)">
                <select
                  className={frSelectClass}
                  value={form.investorId}
                  disabled={loadingRefs}
                  onChange={(e) => setForm((f) => ({ ...f, investorId: e.target.value }))}
                >
                  <option value="">{loadingRefs ? "Loading investors…" : "None"}</option>
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
                  <option value="">{loadingRefs ? "Loading campaigns…" : "None"}</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FrField>
            </div>
          ) : (
            <ReviewList
              items={[
                { label: "Title", value: form.title || "—" },
                { label: "Type", value: form.documentType.replace(/_/g, " ") },
                { label: "Investor", value: investors.find((i) => String(i.id) === form.investorId)?.legalName || "Not linked" },
                { label: "Campaign", value: campaigns.find((c) => String(c.id) === form.campaignId)?.name || "Not linked" },
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
            onSubmit={submitSignatory}
            submitLabel={submitting ? "Sending…" : "Send request"}
            submitDisabled={!sigForm.fullName.trim() || submitting}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <FrField label="Signatory name">
              <input
                className={frInputClass}
                value={sigForm.fullName}
                onChange={(e) => setSigForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </FrField>
            <FrField label="Email">
              <input
                className={frInputClass}
                value={sigForm.email}
                onChange={(e) => setSigForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </FrField>
            <div className="grid grid-cols-2 gap-3">
              <FrField label="Signing order">
                <input type="number" min={1} className={frInputClass} value={sigForm.sequenceOrder} onChange={(e) => setSigForm((f) => ({ ...f, sequenceOrder: e.target.value }))} />
              </FrField>
              <FrField label="Expires">
                <input type="date" className={frInputClass} value={sigForm.expiresAt} onChange={(e) => setSigForm((f) => ({ ...f, expiresAt: e.target.value }))} />
              </FrField>
            </div>
            <p className="text-[9px] text-[#94a3b8]">Provider certificate, decline flow and signed-copy download are pending backend e-sign integration.</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium text-[#64748b]">Signature preview</p>
            <SignatureMark name={sigForm.fullName || "Signatory"} signed={false} />
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
