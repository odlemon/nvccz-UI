"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { downloadBlob, downloadCsvPayload, exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapDocumentRow } from "@/lib/fundraising/mappers"
import {
  FrDialogShell,
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type DocRow = ReturnType<typeof mapDocumentRow>

const DOCUMENT_CATEGORIES = ["Legal", "Track Record", "Marketing", "Due Diligence", "KYC", "Financials"]

const FOLDER_TONES = [
  { bg: "bg-[#fef3c7]", icon: "text-[#d97706]", ring: "ring-[#fde68a]" },
  { bg: "bg-[#dbeafe]", icon: "text-[#2563eb]", ring: "ring-[#bfdbfe]" },
  { bg: "bg-[#fce7f3]", icon: "text-[#db2777]", ring: "ring-[#fbcfe8]" },
  { bg: "bg-[#ede9fe]", icon: "text-[#7c3aed]", ring: "ring-[#ddd6fe]" },
  { bg: "bg-[#dcfce7]", icon: "text-[#16a34a]", ring: "ring-[#bbf7d0]" },
  { bg: "bg-[#e0f2fe]", icon: "text-[#0284c7]", ring: "ring-[#bae6fd]" },
] as const

function tone(category: string) {
  let h = 0
  for (let i = 0; i < category.length; i++) h = (h + category.charCodeAt(i)) % FOLDER_TONES.length
  return FOLDER_TONES[h]
}

function docStatusClass(s: string) {
  const u = s.toUpperCase()
  if (u.includes("APPROV") || u.includes("COMPLETE") || u.includes("SIGNED") || u.includes("ACTIVE")) return "bg-[#dcfce7] text-[#15803d]"
  if (u.includes("REVIEW") || u.includes("SENT") || u.includes("PENDING")) return "bg-[#ffedd5] text-[#c2410c]"
  if (u.includes("SUPERSEDE") || u.includes("VOID")) return "bg-[#f1f5f9] text-[#64748b]"
  return "bg-[#e0f2fe] text-[#0369a1]"
}

export function FundraisingDocuments() {
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [search, setSearch] = useState("")
  const [folder, setFolder] = useState<string>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [allOpen, setAllOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [documentDetail, setDocumentDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadCategory, setUploadCategory] = useState(DOCUMENT_CATEGORIES[0])
  const [uploadCampaignId, setUploadCampaignId] = useState("")
  const [uploadConfidential, setUploadConfidential] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadDocuments() {
    setLoading(true)
    try {
      const res = await fundraisingApi.listDocuments({ pageSize: 200 })
      setDocs((res ?? []).map(mapDocumentRow))
    } catch (err) {
      toastFrError(err, "Could not load documents")
      setDocs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (!createOpen) return
    if (campaigns.length === 0) {
      fundraisingApi
        .listCampaigns()
        .then((res) => setCampaigns(res ?? []))
        .catch(() => setCampaigns([]))
    }
  }, [createOpen, campaigns.length])

  const categories = useMemo(() => {
    const set = new Set<string>()
    docs.forEach((d) => set.add(d.category))
    return Array.from(set).sort()
  }, [docs])

  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of categories) map[c] = 0
    for (const d of docs) map[d.category] = (map[d.category] ?? 0) + 1
    return map
  }, [docs, categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false
      if (folder !== "all" && d.category !== folder) return false
      return true
    })
  }, [docs, search, folder])

  const selected = docs.find((d) => d.id === selectedId) ?? filtered[0] ?? null

  useEffect(() => {
    if (!selected?.id) {
      setDocumentDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    fundraisingApi
      .getDocument(selected.id)
      .then((detail) => {
        if (!cancelled) setDocumentDetail(detail)
      })
      .catch(() => {
        if (!cancelled) setDocumentDetail(null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.id])

  function resetUpload() {
    setUploadTitle("")
    setUploadCategory(DOCUMENT_CATEGORIES[0])
    setUploadCampaignId("")
    setUploadConfidential(false)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function submitUpload() {
    if (!uploadTitle.trim()) {
      toast.error("Give the document a title")
      return
    }
    if (!file) {
      toast.error("Choose a file to upload")
      return
    }
    setUploading(true)
    try {
      await fundraisingApi.createDocument(
        {
          title: uploadTitle.trim(),
          category: uploadCategory,
          campaignId: uploadCampaignId || undefined,
          confidential: uploadConfidential,
        },
        file,
      )
      toast.success("Document uploaded")
      setCreateOpen(false)
      resetUpload()
      await loadDocuments()
    } catch (err) {
      toastFrError(err, "Could not upload document")
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: DocRow) {
    setDownloadingId(doc.id)
    try {
      const blob = await fundraisingApi.downloadDocument(doc.id)
      downloadBlob(blob, doc.name)
    } catch (err) {
      toastFrError(err, "Could not download document")
    } finally {
      setDownloadingId(null)
    }
  }

  async function updateStatus(status: string) {
    if (!selected) return
    try {
      await fundraisingApi.patchDocument(selected.id, { status })
      toast.success("Document status updated")
      await loadDocuments()
    } catch (err) {
      toastFrError(err, "Could not update document")
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const payload = await fundraisingApi.exportDocuments({
        search: search.trim() || undefined,
        category: folder === "all" ? undefined : folder,
      })
      downloadCsvPayload(payload, "fundraising-documents")
    } catch (err) {
      toastFrError(err, "Backend document export was unavailable; exporting the currently displayed rows instead")
      exportFundraisingCsv(
        filtered,
        [
          { key: "name", label: "Document" },
          { key: "category", label: "Category" },
          { key: "campaign", label: "Campaign" },
          { key: "version", label: "Version" },
          { key: "status", label: "Status" },
          { key: "owner", label: "Owner" },
          { key: "room", label: "Data room" },
          { key: "updated", label: "Updated" },
          { key: "confidential", label: "Confidential" },
        ],
        "fundraising-documents",
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Documents</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Unified fundraising document library — browse by folder, keep confidential packs off email
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" disabled={exporting} onClick={handleExport}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Exporting…" : "Export"}
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
          { label: "Folders", value: categories.length },
          { label: "Campaigns covered", value: new Set(docs.map((d) => d.campaign)).size },
          { label: "Confidential", value: docs.filter((d) => d.confidential).length },
        ].map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={k.onClick}
            className={cn(CARD, "rounded-full p-3.5 text-left", k.onClick && "hover:bg-[#fafafa]")}
          >
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
            {k.onClick ? (
              <p className="mt-1 text-[10px] font-medium text-[#2563eb]">View all &gt;</p>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={cn(CARD, "space-y-3 p-3")}>
                <Skeleton className="h-10 w-10 rounded-[8px]" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
          <div className={cn(CARD, "space-y-3 p-4")}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 border-b border-[#f1f5f9] pb-3 last:border-0">
                <Skeleton className="h-8 w-8 rounded-[6px]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : docs.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          No documents yet. Use “Upload Document” to add one.
        </div>
      ) : (
        <>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Folders</h2>
              {folder !== "all" ? (
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                  onClick={() => setFolder("all")}
                >
                  Show all folders
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => {
                const t = tone(cat)
                const active = folder === cat
                const count = folderCounts[cat] ?? 0
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFolder(active ? "all" : cat)}
                    className={cn(
                      CARD,
                      "flex flex-col items-start gap-2 rounded-full p-3 text-left transition-all hover:shadow-md",
                      active && `ring-2 ${t.ring}`,
                    )}
                  >
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-[8px]", t.bg)}>
                      {active ? (
                        <FolderOpen className={cn("h-5 w-5", t.icon)} />
                      ) : (
                        <Folder className={cn("h-5 w-5", t.icon)} />
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
                    className="rounded-full px-2 py-1 font-semibold text-[#64748b] hover:bg-[#eff6ff] hover:text-[#2563eb]"
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
                    const t = tone(d.category)
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(d.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-full px-3 py-3 text-left transition-colors",
                            selectedId === d.id ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                          )}
                        >
                          <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px]", t.bg)}>
                            <FileText className={cn("h-4 w-4", t.icon)} />
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
                              {d.room} · {d.owner} · {d.updated}
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
                        tone(selected.category).bg,
                      )}
                    >
                      <Folder className={cn("h-4 w-4", tone(selected.category).icon)} />
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
                      <span className="text-[#94a3b8]">Source</span>
                      <span className="font-medium text-[#0f172a]">{selected.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Folder</span>
                      <button
                        type="button"
                        className="rounded-full px-2 py-1 font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                        onClick={() => setFolder(selected.category)}
                      >
                        {selected.category}
                      </button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 w-full rounded-full px-4 gap-2"
                    disabled={downloadingId === selected.id}
                    onClick={() => handleDownload(selected)}
                  >
                    {downloadingId === selected.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {downloadingId === selected.id ? "Downloading…" : "Download"}
                  </Button>
                  <select
                    className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[11px]"
                    value={String(selected.raw?.status || "ACTIVE").toUpperCase()}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="IN_REVIEW">In review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUPERSEDED">Superseded</option>
                  </select>
                  <div className="border-t border-[#f1f5f9] pt-3">
                    <p className="text-[11px] font-semibold text-[#0f172a]">Version history</p>
                    {detailLoading ? (
                      <p className="mt-2 text-[10px] text-[#94a3b8]">Loading versions…</p>
                    ) : !Array.isArray(documentDetail?.versions) || documentDetail.versions.length === 0 ? (
                      <p className="mt-2 text-[10px] text-[#94a3b8]">No version history returned.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {documentDetail.versions.map((version: Record<string, any>, index: number) => (
                          <li key={String(version.id ?? version.versionNumber ?? index)} className="rounded-[6px] bg-[#f8fafc] p-2 text-[10px]">
                            <p className="font-medium text-[#0f172a]">v{version.versionNumber ?? index + 1} · {version.fileName || "Document"}</p>
                            <p className="mt-0.5 text-[#94a3b8]">{version.uploadedAt ? new Date(version.uploadedAt).toLocaleString() : "—"}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-[9px] text-[#b45309]">Uploading a replacement may invalidate signatures bound to an older version.</p>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </>
      )}

      {/* Upload dialog */}
      <FrUploadDialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) resetUpload()
        }}
        uploading={uploading}
        campaigns={campaigns}
        title={uploadTitle}
        category={uploadCategory}
        campaignId={uploadCampaignId}
        confidential={uploadConfidential}
        file={file}
        fileInputRef={fileInputRef}
        onTitleChange={setUploadTitle}
        onCategoryChange={setUploadCategory}
        onCampaignChange={setUploadCampaignId}
        onConfidentialChange={setUploadConfidential}
        onFileChange={setFile}
        onSubmit={submitUpload}
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

function FrUploadDialog({
  open,
  onOpenChange,
  uploading,
  campaigns,
  title,
  category,
  campaignId,
  confidential,
  file,
  fileInputRef,
  onTitleChange,
  onCategoryChange,
  onCampaignChange,
  onConfidentialChange,
  onFileChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  uploading: boolean
  campaigns: Record<string, any>[]
  title: string
  category: string
  campaignId: string
  confidential: boolean
  file: File | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onTitleChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onCampaignChange: (v: string) => void
  onConfidentialChange: (v: boolean) => void
  onFileChange: (f: File | null) => void
  onSubmit: () => void
}) {
  return (
    <FrDialogShell open={open} onOpenChange={onOpenChange} title="Upload Document" description="Register a document in the fundraising library" size="lg">
      <div className="space-y-4">
        <FrField label="Title">
          <input
            className={frInputClass}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. ZGF II Investor Presentation"
          />
        </FrField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Category">
            <select className={frSelectClass} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Campaign (optional)">
            <select className={frSelectClass} value={campaignId} onChange={(e) => onCampaignChange(e.target.value)}>
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FrField>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-2.5">
          <span className="text-[12px] font-medium text-[#0f172a]">Confidential</span>
          <Switch checked={confidential} onCheckedChange={onConfidentialChange} />
        </label>
        <FrField label="File">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-[12px] text-[#64748b] hover:bg-[#f1f5f9]">
            <UploadCloud className="h-4 w-4" />
            {file ? file.name : "Choose a file to upload"}
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </FrField>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="gradient-info"
          className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
          disabled={uploading || !file || !title.trim()}
          onClick={onSubmit}
        >
          {uploading ? "Uploading…" : "Upload document"}
        </Button>
      </div>
    </FrDialogShell>
  )
}
