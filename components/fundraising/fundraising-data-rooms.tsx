"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Download,
  FileText,
  Folder,
  FolderLock,
  FolderOpen,
  FolderPlus,
  Loader2,
  Lock,
  Plus,
  Search,
  Shield,
  UploadCloud,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { downloadBlob, exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapDataRoomCard } from "@/lib/fundraising/mappers"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type DataRoom = ReturnType<typeof mapDataRoomCard>

function roomStatusClass(status: DataRoom["status"]): string {
  switch (status) {
    case "Active":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Draft":
      return "bg-[#f1f5f9] text-[#64748b]"
    case "Expired":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Revoked":
      return "bg-[#fee2e2] text-[#dc2626]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

const FOLDER_COLORS = [
  { bg: "bg-[#fef3c7]", icon: "text-[#d97706]", ring: "ring-[#fde68a]" },
  { bg: "bg-[#dbeafe]", icon: "text-[#2563eb]", ring: "ring-[#bfdbfe]" },
  { bg: "bg-[#dcfce7]", icon: "text-[#16a34a]", ring: "ring-[#bbf7d0]" },
  { bg: "bg-[#ede9fe]", icon: "text-[#7c3aed]", ring: "ring-[#ddd6fe]" },
  { bg: "bg-[#fce7f3]", icon: "text-[#db2777]", ring: "ring-[#fbcfe8]" },
  { bg: "bg-[#e0f2fe]", icon: "text-[#0284c7]", ring: "ring-[#bae6fd]" },
] as const

function folderTone(name: string, i: number) {
  return FOLDER_COLORS[(name.length + i) % FOLDER_COLORS.length]
}

function RoomDetail({
  room,
  loadingDetail,
  onClose,
  onInvite,
  onAddFolder,
  onUpload,
  onDownload,
  onActivate,
  uploading,
  downloadingId,
  activating,
}: {
  room: DataRoom
  loadingDetail: boolean
  onClose: () => void
  onInvite: () => void
  onAddFolder: () => void
  onUpload: () => void
  onDownload: (documentId: string, fileName: string) => void
  onActivate: () => void
  uploading: boolean
  downloadingId: string | null
  activating: boolean
}) {
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  return (
    <aside className={cn(CARD, "max-h-[calc(100vh-8rem)] overflow-y-auto xl:sticky xl:top-4")}>
      <div className="flex items-start justify-between border-b border-[#f1f5f9] bg-gradient-to-r from-[#eff6ff] to-[#f8fafc] px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
            <FolderLock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-[#0f172a]">{room.name}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">{room.campaign}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-[#94a3b8] hover:bg-white hover:text-[#64748b]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loadingDetail ? (
        <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12px] text-[#94a3b8]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading room detail…
        </div>
      ) : (
        <div className="space-y-4 p-4 text-[12px]">
          <div className="flex flex-wrap gap-2">
            <span className={cn("rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", roomStatusClass(room.status))}>
              {room.status}
            </span>
            {room.watermark ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#ede9fe] px-2 py-0.5 text-[10px] font-semibold text-[#6d28d9]">
                <Shield className="h-3 w-3" /> Watermark
              </span>
            ) : null}
            {room.mfaRequired ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#dbeafe] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
                <Lock className="h-3 w-3" /> MFA
              </span>
            ) : null}
            {room.status === "Draft" ? (
              <Button
                variant="outline"
                className="h-7 rounded-full px-3 text-[10px]"
                disabled={activating}
                onClick={onActivate}
              >
                {activating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {activating ? "Activating…" : "Make active"}
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Investors invited", value: room.investorsInvited },
              { label: "Documents", value: room.documents },
              { label: "Views (7d)", value: room.views7d },
              { label: "Downloads (7d)", value: room.downloads7d },
            ].map((x) => (
              <div key={x.label} className="rounded-[6px] border border-[#f1f5f9] bg-[#fafafa] px-2.5 py-2">
                <p className="text-[10px] text-[#94a3b8]">{x.label}</p>
                <p className="mt-0.5 font-semibold tabular-nums text-[#0f172a]">{x.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f1f5f9] pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#0f172a]">Folders</p>
              <button
                type="button"
                onClick={onAddFolder}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
              >
                <FolderPlus className="h-3.5 w-3.5" /> Add folder
              </button>
            </div>
            {room.folders.length === 0 ? (
              <p className="rounded-[6px] border border-dashed border-[#e2e8f0] px-3 py-4 text-center text-[11px] text-[#94a3b8]">
                No folders yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {room.folders.map((f, i) => {
                  const tone = folderTone(f.name, i)
                  const isOpen = openFolder === f.name
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setOpenFolder(isOpen ? null : f.name)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-[8px] border border-[#e2e8f0] p-2.5 text-left transition-all hover:shadow-sm",
                        isOpen && `ring-2 ${tone.ring}`,
                      )}
                    >
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-[6px]", tone.bg)}>
                        {isOpen ? (
                          <FolderOpen className={cn("h-5 w-5", tone.icon)} />
                        ) : (
                          <Folder className={cn("h-5 w-5", tone.icon)} />
                        )}
                      </span>
                      <span className="line-clamp-2 text-[11px] font-medium leading-snug text-[#0f172a]">
                        {f.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#64748b]">
                        <FileText className="h-3 w-3" />
                        {f.docs} docs
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {openFolder ? (
              <ul className="mt-2 divide-y divide-[#f1f5f9] rounded-[6px] border border-[#e2e8f0]">
                {room.documentsRaw
                  .filter((doc: Record<string, any>) => {
                    const folder = doc.folder?.name || doc.folderName
                    return !folder || folder === openFolder
                  })
                  .map((doc: Record<string, any>, index: number) => (
                    <li key={String(doc.id ?? index)} className="flex items-center justify-between gap-2 px-2.5 py-2">
                      <span className="min-w-0 truncate text-[10px] text-[#334155]">{doc.fileName || doc.name || "Document"}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full px-2 py-1 text-[9px] font-medium text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-50"
                        disabled={downloadingId === String(doc.id)}
                        onClick={() => onDownload(String(doc.id), doc.fileName || doc.name || "document")}
                      >
                        {downloadingId === String(doc.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Download"
                        )}
                      </button>
                    </li>
                  ))}
                {room.documentsRaw.length === 0 ? <li className="px-2.5 py-3 text-[10px] text-[#94a3b8]">No files returned for this folder.</li> : null}
              </ul>
            ) : null}
            <Button
              variant="outline"
              className="mt-2 h-8 w-full rounded-full text-[12px] gap-1.5"
              disabled={uploading}
              onClick={onUpload}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
              Upload document
            </Button>
          </div>

          <div className="border-t border-[#f1f5f9] pt-3">
            <p className="text-[11px] font-semibold text-[#0f172a]">Access</p>
            <ul className="mt-2 divide-y divide-[#f1f5f9]">
              {room.accessList.length === 0 ? (
                <li className="py-2 text-[11px] text-[#94a3b8]">No active invitations</li>
              ) : (
                room.accessList.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-[10px] font-bold text-white">
                      {a.investor.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#0f172a]">{a.investor}</p>
                      <p className="text-[10px] text-[#94a3b8]">
                        {a.contact} · {a.access} · {a.lastAccess}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <Button variant="outline" className="mt-2 h-8 w-full rounded-full text-[12px]" onClick={onInvite}>
              Invite investor
            </Button>
          </div>

          <div className="border-t border-[#f1f5f9] pt-3">
            <p className="text-[11px] font-semibold text-[#0f172a]">Recent activity</p>
            <ul className="mt-2 space-y-2">
              {room.recentActivity.length === 0 ? (
                <li className="text-[11px] text-[#94a3b8]">No recent activity</li>
              ) : (
                room.recentActivity.map((a) => (
                  <li key={a.id} className="text-[11px]">
                    <p className="font-medium text-[#0f172a]">
                      {a.actor} <span className="font-normal text-[#64748b]">{a.action.toLowerCase()}</span> {a.doc}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">{a.at}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </aside>
  )
}

export function FundraisingDataRooms() {
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [campaignId, setCampaignId] = useState("")

  const [loadingRooms, setLoadingRooms] = useState(false)
  const [rawRooms, setRawRooms] = useState<Record<string, any>[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)

  const [roomName, setRoomName] = useState("")
  const [requiresMfa, setRequiresMfa] = useState(true)
  const [folderName, setFolderName] = useState("")

  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [loadingInvestors, setLoadingInvestors] = useState(false)
  const [inviteInvestorId, setInviteInvestorId] = useState("")
  const [inviteExpiry, setInviteExpiry] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const campaignName = campaigns.find((c) => String(c.id) === campaignId)?.name

  const rooms = useMemo(() => rawRooms.map((r) => mapDataRoomCard(r, campaignName)), [rawRooms, campaignName])

  async function loadCampaigns() {
    setLoadingCampaigns(true)
    try {
      const res = await fundraisingApi.listCampaigns()
      setCampaigns(res ?? [])
      const active = res.find((c: Record<string, any>) => String(c.status).toUpperCase() === "ACTIVE")
      const chosen = active ?? res[0]
      if (chosen) setCampaignId(String(chosen.id))
    } catch (err) {
      toastFrError(err, "Could not load campaigns")
      setCampaigns([])
    } finally {
      setLoadingCampaigns(false)
    }
  }

  async function loadRooms(id: string) {
    if (!id) {
      setRawRooms([])
      return
    }
    setLoadingRooms(true)
    try {
      const res = await fundraisingApi.listDataRooms(id)
      setRawRooms(res ?? [])
      setSelectedId(null)
    } catch (err) {
      toastFrError(err, "Could not load data rooms")
      setRawRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (campaignId) loadRooms(campaignId)
  }, [campaignId])

  async function selectRoom(id: string) {
    setSelectedId(id)
    setLoadingDetail(true)
    try {
      const detail = await fundraisingApi.getDataRoom(id)
      setRawRooms((prev) => prev.map((r) => (String(r.id) === id ? { ...r, ...detail } : r)))
    } catch (err) {
      toastFrError(err, "Could not load room detail")
    } finally {
      setLoadingDetail(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rooms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.campaign.toLowerCase().includes(q)) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      return true
    })
  }, [rooms, search, statusFilter])

  const selected = filtered.find((r) => r.id === selectedId) ?? rooms.find((r) => r.id === selectedId) ?? null

  async function refreshSelected() {
    if (!selectedId) return
    try {
      const detail = await fundraisingApi.getDataRoom(selectedId)
      setRawRooms((prev) => prev.map((r) => (String(r.id) === selectedId ? { ...r, ...detail } : r)))
    } catch {
      // best-effort refresh
    }
  }

  async function submitCreateRoom() {
    if (!roomName.trim() || !campaignId) return
    setSubmitting(true)
    try {
      await fundraisingApi.createDataRoom(campaignId, {
        name: roomName.trim(),
        requiresMfa,
        status: "ACTIVE",
      })
      toast.success(`Data room "${roomName.trim()}" created`)
      setRoomName("")
      setCreateOpen(false)
      await loadRooms(campaignId)
    } catch (err) {
      toastFrError(err, "Could not create data room")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFolder() {
    if (!folderName.trim() || !selectedId) return
    setSubmitting(true)
    try {
      await fundraisingApi.createDataRoomFolder(selectedId, { name: folderName.trim() })
      toast.success("Folder created")
      setFolderName("")
      setFolderOpen(false)
      await refreshSelected()
    } catch (err) {
      toastFrError(err, "Could not create folder")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitInvite() {
    if (!inviteInvestorId || !selectedId) return
    setSubmitting(true)
    try {
      await fundraisingApi.grantDataRoomAccess(selectedId, {
        investorId: inviteInvestorId,
        expiresAt: inviteExpiry ? new Date(inviteExpiry).toISOString() : undefined,
      })
      toast.success("Invite sent")
      setInviteInvestorId("")
      setInviteExpiry("")
      setInviteOpen(false)
      await refreshSelected()
    } catch (err) {
      toastFrError(err, "Could not send invite")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUploadFile(file: File | null) {
    if (!file || !selectedId) return
    setUploading(true)
    try {
      await fundraisingApi.uploadDataRoomDocument(selectedId, file)
      toast.success("Document uploaded")
      await refreshSelected()
    } catch (err) {
      toastFrError(err, "Could not upload document")
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(documentId: string, fileName: string) {
    if (!selectedId) return
    setDownloadingId(documentId)
    try {
      const blob = await fundraisingApi.downloadDataRoomDocument(selectedId, documentId)
      downloadBlob(blob, fileName)
    } catch (err) {
      toastFrError(err, "Could not download document")
    } finally {
      setDownloadingId(null)
    }
  }

  async function activateSelectedRoom() {
    if (!selectedId) return
    setActivating(true)
    try {
      const updated = await fundraisingApi.patchDataRoom(selectedId, { status: "ACTIVE" })
      setRawRooms((prev) =>
        prev.map((room) => (String(room.id) === selectedId ? { ...room, ...updated, status: "ACTIVE" } : room)),
      )
      toast.success("Data room is now active")
      await refreshSelected()
    } catch (err) {
      toastFrError(err, "Could not activate data room")
    } finally {
      setActivating(false)
    }
  }

  function exportActivity() {
    const activity = rooms.flatMap((room) =>
      room.recentActivity.map((entry) => ({
        room: room.name,
        campaign: room.campaign,
        actor: entry.actor,
        action: entry.action,
        document: entry.doc,
        occurredAt: entry.at,
      })),
    )
    exportFundraisingCsv(
      activity,
      [
        { key: "room", label: "Data room" },
        { key: "campaign", label: "Campaign" },
        { key: "actor", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "document", label: "Document" },
        { key: "occurredAt", label: "Occurred at" },
      ],
      "data-room-activity",
    )
  }

  useEffect(() => {
    if (!inviteOpen) return
    setLoadingInvestors(true)
    fundraisingApi
      .listInvestors({ pageSize: 100 })
      .then((res) => setInvestors(res.items ?? []))
      .catch(() => setInvestors([]))
      .finally(() => setLoadingInvestors(false))
  }, [inviteOpen])

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          handleUploadFile(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">Data Rooms</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Secure folders, watermarks, expiry and activity monitoring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="h-9 w-full rounded-full border-[#e2e8f0] text-[12px] sm:w-[220px]">
              <SelectValue placeholder={loadingCampaigns ? "Loading campaigns…" : "Select campaign"} />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={exportActivity}>
            <Download className="h-4 w-4" />
            Export activity
          </Button>
          <Button
            variant="gradient-info"
            className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            disabled={!campaignId}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Data Room
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Active rooms", value: rooms.filter((r) => r.status === "Active").length },
          { label: "Documents", value: rooms.reduce((s, r) => s + r.documents, 0) },
          { label: "Views (7d)", value: rooms.reduce((s, r) => s + r.views7d, 0) },
          { label: "Downloads (7d)", value: rooms.reduce((s, r) => s + r.downloads7d, 0) },
        ].map((k) => (
          <div key={k.label} className={cn(CARD, "p-3.5")}>
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
          </div>
        ))}
      </div>

      {loadingRooms ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={cn(CARD, "space-y-4 p-4")}>
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-[10px]" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : !campaignId ? (
        <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          No campaigns available. Create a campaign first.
        </div>
      ) : rooms.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          No data rooms for this campaign yet. Create one to start sharing documents securely.
        </div>
      ) : (
        <div
          className={cn(
            "mt-5 grid items-start gap-4",
            selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1",
          )}
        >
          <div className="min-w-0 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-[#64748b]" />
                <h2 className="text-[13px] font-semibold text-[#0f172a]">Rooms</h2>
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
                    placeholder="Search rooms..."
                    className="h-8 rounded-full border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((room, idx) => {
                const tone = folderTone(room.name, idx)
                const active = selectedId === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => selectRoom(room.id)}
                    className={cn(
                      CARD,
                      "flex flex-col gap-3 p-4 text-left transition-all hover:shadow-md",
                      active && "ring-2 ring-blue-500/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("flex h-11 w-11 items-center justify-center rounded-[10px]", tone.bg)}>
                        <Folder className={cn("h-6 w-6", tone.icon)} />
                      </span>
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", roomStatusClass(room.status))}>
                        {room.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0f172a]">{room.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#64748b]">{room.campaign}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-2 text-[11px] text-[#64748b]">
                      <span>{room.documents} docs · {room.investorsInvited} invited</span>
                      <span>Exp {room.expiresOn}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selected ? (
            <RoomDetail
              room={selected}
              loadingDetail={loadingDetail}
              onClose={() => setSelectedId(null)}
              onInvite={() => setInviteOpen(true)}
              onAddFolder={() => setFolderOpen(true)}
              onUpload={() => fileInputRef.current?.click()}
              onDownload={handleDownload}
              onActivate={activateSelectedRoom}
              uploading={uploading}
              downloadingId={downloadingId}
              activating={activating}
            />
          ) : null}
        </div>
      )}

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Data Room"
        steps={[
          { id: "identity", short: "1", label: "Room details" },
          { id: "security", short: "2", label: "Security" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel={submitting ? "Creating…" : "Create data room"}
        validateStep={(step) => (step === "identity" && !roomName.trim() ? ["Room name is required"] : [])}
        onFinish={submitCreateRoom}
      >
        {(step) =>
          step === "identity" ? (
            <div className="space-y-3">
              <FrField label="Room name">
                <input className={frInputClass} value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. ZGF II Investor Due Diligence" />
              </FrField>
              <FrField label="Campaign">
                <input className={frInputClass} value={campaignName || ""} disabled />
              </FrField>
            </div>
          ) : step === "security" ? (
            <label className="flex items-center gap-2 text-[12px] text-[#334155]">
              <input
                type="checkbox"
                checked={requiresMfa}
                onChange={(e) => setRequiresMfa(e.target.checked)}
                className="h-4 w-4 rounded border-[#cbd5e1]"
              />
              Require MFA for invited investors
            </label>
          ) : (
            <ReviewList
              items={[
                { label: "Data room", value: roomName || "—" },
                { label: "Campaign", value: campaignName || "—" },
                { label: "Security", value: requiresMfa ? "MFA required" : "MFA not required" },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrDialogShell
        open={folderOpen}
        onOpenChange={setFolderOpen}
        title="Add folder"
        description={`Create a folder in ${selected?.name ?? "the selected room"}`}
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setFolderOpen(false)}
            onSubmit={submitFolder}
            submitLabel={submitting ? "Creating…" : "Create folder"}
            submitDisabled={!folderName.trim() || submitting}
          />
        }
      >
        <FrField label="Folder name">
          <input className={frInputClass} value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. Legal" />
        </FrField>
      </FrDialogShell>

      <FrDialogShell
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite investor"
        description={`Grant access to ${selected?.name ?? "selected room"}`}
        size="lg"
        footer={
          <FrFormFooter
            onCancel={() => setInviteOpen(false)}
            onSubmit={submitInvite}
            submitLabel={submitting ? "Sending…" : "Send invite"}
            submitDisabled={!inviteInvestorId || submitting}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Investor">
            <select
              className={frSelectClass}
              value={inviteInvestorId}
              disabled={loadingInvestors}
              onChange={(e) => setInviteInvestorId(e.target.value)}
            >
              <option value="">{loadingInvestors ? "Loading investors…" : "Select investor"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Access expires (optional)">
            <input type="date" className={frInputClass} value={inviteExpiry} onChange={(e) => setInviteExpiry(e.target.value)} />
          </FrField>
        </div>
      </FrDialogShell>
    </div>
  )
}
