"use client"

import { useMemo, useState } from "react"
import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DOC_CATEGORIES,
  FR_DOCUMENTS,
  docStatusClass,
  type DocCategory,
  type FrDocument,
} from "./documents-mock-data"
import {
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const FOLDER_TONES: Record<DocCategory, { bg: string; icon: string; ring: string }> = {
  Legal: { bg: "bg-[#fef3c7]", icon: "text-[#d97706]", ring: "ring-[#fde68a]" },
  "Track Record": { bg: "bg-[#dbeafe]", icon: "text-[#2563eb]", ring: "ring-[#bfdbfe]" },
  Marketing: { bg: "bg-[#fce7f3]", icon: "text-[#db2777]", ring: "ring-[#fbcfe8]" },
  "Due Diligence": { bg: "bg-[#ede9fe]", icon: "text-[#7c3aed]", ring: "ring-[#ddd6fe]" },
  KYC: { bg: "bg-[#dcfce7]", icon: "text-[#16a34a]", ring: "ring-[#bbf7d0]" },
  Financials: { bg: "bg-[#e0f2fe]", icon: "text-[#0284c7]", ring: "ring-[#bae6fd]" },
}

export function FundraisingDocuments() {
  const [search, setSearch] = useState("")
  const [folder, setFolder] = useState<DocCategory | "all">("all")
  const [selectedId, setSelectedId] = useState(FR_DOCUMENTS[0].id)
  const [docs, setDocs] = useState(FR_DOCUMENTS)
  const [createOpen, setCreateOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [allOpen, setAllOpen] = useState(false)
  const [form, setForm] = useState({
    name: "ZGF II Investor Presentation",
    category: "Legal" as DocCategory,
    campaign: "ZGF II",
    confidential: true,
  })

  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of DOC_CATEGORIES) map[c] = 0
    for (const d of docs) map[d.category] = (map[d.category] ?? 0) + 1
    return map
  }, [docs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false
      if (folder !== "all" && d.category !== folder) return false
      return true
    })
  }, [docs, search, folder])

  const selected = docs.find((d) => d.id === selectedId) ?? filtered[0]

  function createDoc() {
    if (!form.name.trim()) return
    const doc: FrDocument = {
      id: `d-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      campaign: form.campaign,
      version: "v1",
      status: "Draft",
      owner: "You",
      updated: "15 Jul 2026",
      confidential: form.confidential,
      versions: [
        {
          id: "v1",
          version: "v1",
          updated: "15 Jul 2026",
          author: "You",
          note: "Initial upload",
        },
      ],
    }
    setDocs((prev) => [doc, ...prev])
    setSelectedId(doc.id)
    setFolder(form.category)
    setCreateOpen(false)
    setForm({
      name: "ZGF II Investor Presentation",
      category: "Legal",
      campaign: "ZGF II",
      confidential: true,
    })
    toast.success("Document added")
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Documents</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Versioned fundraising library — browse by folder, keep confidential packs off email
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="gradient-info"
            className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Documents", value: docs.length, onClick: () => setAllOpen(true) },
          { label: "Folders", value: DOC_CATEGORIES.length },
          { label: "In review", value: docs.filter((d) => d.status === "In Review").length },
          { label: "Confidential", value: docs.filter((d) => d.confidential).length },
        ].map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={k.onClick}
            className={cn(CARD, "p-3.5 text-left", k.onClick && "hover:bg-[#fafafa]")}
          >
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
            {k.onClick ? (
              <p className="mt-1 text-[10px] font-medium text-[#2563eb]">View all &gt;</p>
            ) : null}
          </button>
        ))}
      </div>

      {/* Folder browser */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#0f172a]">Folders</h2>
          {folder !== "all" ? (
            <button
              type="button"
              className="text-[11px] font-medium text-[#2563eb] hover:underline"
              onClick={() => setFolder("all")}
            >
              Show all folders
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DOC_CATEGORIES.map((cat) => {
            const tone = FOLDER_TONES[cat]
            const active = folder === cat
            const count = folderCounts[cat] ?? 0
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFolder(active ? "all" : cat)}
                className={cn(
                  CARD,
                  "flex flex-col items-start gap-2 p-3 text-left transition-all hover:shadow-md",
                  active && `ring-2 ${tone.ring}`,
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-[8px]", tone.bg)}>
                  {active ? (
                    <FolderOpen className={cn("h-5 w-5", tone.icon)} />
                  ) : (
                    <Folder className={cn("h-5 w-5", tone.icon)} />
                  )}
                </span>
                <span className="text-[12px] font-semibold leading-snug text-[#0f172a]">{cat}</span>
                <span className="text-[10px] text-[#64748b]">
                  {count} file{count === 1 ? "" : "s"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <button
                type="button"
                onClick={() => setFolder("all")}
                className="font-semibold text-[#64748b] hover:text-[#2563eb]"
              >
                Library
              </button>
              {folder !== "all" ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
                  <span className="truncate font-semibold text-[#0f172a]">{folder}</span>
                </>
              ) : null}
              <span className="ml-1 rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filtered.length}
              </span>
            </div>
            <div className="relative sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-[12px] text-[#94a3b8]">
              No documents in this folder.
            </p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {filtered.map((d) => {
                const tone = FOLDER_TONES[d.category]
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
                        selectedId === d.id ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px]", tone.bg)}>
                        <FileText className={cn("h-4 w-4", tone.icon)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[12px] font-semibold text-[#0f172a]">{d.name}</p>
                          {d.confidential ? (
                            <span className="rounded-[4px] bg-[#ffedd5] px-1.5 py-0.5 text-[9px] font-semibold text-[#c2410c]">
                              Confidential
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
                              docStatusClass(d.status),
                            )}
                          >
                            {d.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#64748b]">
                          {d.category} · {d.campaign} · {d.version}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                          {d.owner} · {d.updated}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className={cn(CARD, "overflow-hidden")}>
            <div className="border-b border-[#f1f5f9] px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]",
                    FOLDER_TONES[selected.category].bg,
                  )}
                >
                  <Folder className={cn("h-4 w-4", FOLDER_TONES[selected.category].icon)} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold text-[#0f172a]">{selected.name}</h2>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">
                    {selected.category} · {selected.campaign} · {selected.version}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Status</span>
                  <span
                    className={cn(
                      "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                      docStatusClass(selected.status),
                    )}
                  >
                    {selected.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Owner</span>
                  <span className="font-medium text-[#0f172a]">{selected.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Updated</span>
                  <span className="text-[#0f172a]">{selected.updated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Folder</span>
                  <button
                    type="button"
                    className="font-medium text-[#2563eb] hover:underline"
                    onClick={() => setFolder(selected.category)}
                  >
                    {selected.category}
                  </button>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-[#0f172a]">Version history</p>
              <ul className="space-y-2">
                {selected.versions.slice(0, 3).map((v) => (
                  <li key={v.id} className="rounded-[6px] border border-[#f1f5f9] px-2.5 py-2 text-[11px]">
                    <p className="font-medium text-[#0f172a]">
                      {v.version} · {v.author}
                    </p>
                    <p className="text-[#64748b]">{v.note}</p>
                    <p className="text-[10px] text-[#94a3b8]">{v.updated}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="text-[11px] font-medium text-[#2563eb] hover:underline"
                onClick={() => setVersionsOpen(true)}
              >
                View all versions &gt;
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Upload Document"
        steps={[
          { id: "file", short: "1", label: "Document" },
          { id: "access", short: "2", label: "Classification" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel="Add document"
        validateStep={(step) =>
          step === "file" && !form.name.trim() ? ["Document name is required"] : []
        }
        onSubmit={createDoc}
      >
        {(step) =>
          step === "file" ? (
            <div className="space-y-3">
              <FrField label="Document name">
                <input
                  className={frInputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Side Letter — Nyasha"
                />
              </FrField>
              <FrField label="Folder / category">
                <select
                  className={frSelectClass}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DocCategory }))}
                >
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FrField>
            </div>
          ) : step === "access" ? (
            <div className="space-y-3">
              <FrField label="Campaign">
                <select
                  className={frSelectClass}
                  value={form.campaign}
                  onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
                >
                  <option>ZGF II</option>
                  <option>Institutional Mandates FY25</option>
                  <option>All Campaigns</option>
                </select>
              </FrField>
              <label className="flex items-center gap-2 text-[12px] text-[#475569]">
                <input
                  type="checkbox"
                  checked={form.confidential}
                  onChange={(e) => setForm((f) => ({ ...f, confidential: e.target.checked }))}
                />
                Mark as confidential
              </label>
            </div>
          ) : (
            <ReviewList
              items={[
                { label: "Document", value: form.name },
                { label: "Folder / campaign", value: `${form.category} · ${form.campaign}` },
                { label: "Access", value: form.confidential ? "Confidential" : "Standard" },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrViewAllDialog
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        title={`Versions — ${selected?.name ?? ""}`}
        description="Uploading a superseding version may void outstanding signatures."
        size="lg"
        rows={(selected?.versions ?? []).map((v) => ({
          id: v.id,
          title: v.version,
          subtitle: v.note,
          meta: `${v.author} · ${v.updated}`,
        }))}
      />

      <FrViewAllDialog
        open={allOpen}
        onOpenChange={setAllOpen}
        title="All documents"
        size="lg"
        rows={docs.map((d) => ({
          id: d.id,
          title: d.name,
          subtitle: `${d.category} · ${d.campaign} · ${d.version}`,
          meta: `${d.owner} · ${d.updated}`,
          badge: d.status,
          badgeClass: docStatusClass(d.status),
        }))}
      />
    </div>
  )
}
