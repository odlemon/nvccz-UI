"use client"

import { useMemo, useState } from "react"
import {
  Download,
  FileText,
  Folder,
  FolderLock,
  FolderOpen,
  Lock,
  Plus,
  Search,
  Shield,
  X,
} from "lucide-react"
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
import { DATA_ROOMS, roomStatusClass, type DataRoom } from "./data-rooms-mock-data"
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
  onClose,
  onInvite,
}: {
  room: DataRoom
  onClose: () => void
  onInvite: () => void
}) {
  const [openFolder, setOpenFolder] = useState<string | null>(room.folders[0]?.name ?? null)

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
          <p className="mb-2 text-[11px] font-semibold text-[#0f172a]">Folders</p>
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
          {openFolder ? (
            <div className="mt-2 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {openFolder}
              </p>
              <ul className="mt-1.5 space-y-1">
                {["Investment Memorandum.pdf", "Track Record Summary.xlsx", "FAQ Q2.docx"]
                  .slice(0, Math.min(3, room.folders.find((f) => f.name === openFolder)?.docs ?? 1))
                  .map((doc) => (
                    <li key={doc} className="flex items-center gap-2 text-[11px] text-[#334155]">
                      <FileText className="h-3.5 w-3.5 text-[#64748b]" />
                      {doc}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
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
                    {a.actor}{" "}
                    <span className="font-normal text-[#64748b]">{a.action.toLowerCase()}</span> {a.doc}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">{a.at}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </aside>
  )
}

export function FundraisingDataRooms() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(DATA_ROOMS[0].id)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roomName, setRoomName] = useState("ZGF II Investor Due Diligence")
  const [roomCampaign, setRoomCampaign] = useState("ZGF II")
  const [inviteName, setInviteName] = useState("Granite Peak Trustees")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return DATA_ROOMS.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.campaign.toLowerCase().includes(q)) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      return true
    })
  }, [search, statusFilter])

  const selected =
    filtered.find((r) => r.id === selectedId) ?? DATA_ROOMS.find((r) => r.id === selectedId) ?? null

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">Data Rooms</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Secure folders, watermarks, expiry and activity monitoring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
            <Download className="h-4 w-4" />
            Export activity
          </Button>
          <Button
            variant="gradient-info"
            className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Data Room
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Active rooms", value: DATA_ROOMS.filter((r) => r.status === "Active").length },
          { label: "Documents", value: DATA_ROOMS.reduce((s, r) => s + r.documents, 0) },
          { label: "Views (7d)", value: DATA_ROOMS.reduce((s, r) => s + r.views7d, 0) },
          { label: "Downloads (7d)", value: DATA_ROOMS.reduce((s, r) => s + r.downloads7d, 0) },
        ].map((k) => (
          <div key={k.label} className={cn(CARD, "p-3.5")}>
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
          </div>
        ))}
      </div>

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
                  className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] text-[12px] sm:w-[130px]">
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
                  onClick={() => setSelectedId(room.id)}
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
                  <div className="flex flex-wrap gap-1.5">
                    {room.folders.slice(0, 3).map((f, i) => {
                      const ft = folderTone(f.name, i)
                      return (
                        <span
                          key={f.name}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            ft.bg,
                            ft.icon,
                          )}
                        >
                          <Folder className="h-3 w-3" />
                          {f.name}
                        </span>
                      )
                    })}
                    {room.folders.length > 3 ? (
                      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#64748b]">
                        +{room.folders.length - 3}
                      </span>
                    ) : null}
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
            onClose={() => setSelectedId(null)}
            onInvite={() => setInviteOpen(true)}
          />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Data Room"
        steps={[
          { id: "identity", short: "1", label: "Room details" },
          { id: "security", short: "2", label: "Security" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel="Create data room"
        validateStep={(step) =>
          step === "identity" && !roomName.trim() ? ["Room name is required"] : []
        }
        onSubmit={() => {
          toast.success(`Data room “${roomName.trim()}” created`)
          setRoomName("ZGF II Investor Due Diligence")
        }}
      >
        {(step) =>
          step === "identity" ? (
            <div className="space-y-3">
              <FrField label="Room name">
                <input className={frInputClass} value={roomName} onChange={(e) => setRoomName(e.target.value)} />
              </FrField>
              <FrField label="Campaign">
                <select
                  className={frSelectClass}
                  value={roomCampaign}
                  onChange={(e) => setRoomCampaign(e.target.value)}
                >
                  <option>ZGF II</option>
                  <option>Institutional Mandates FY25</option>
                </select>
              </FrField>
            </div>
          ) : step === "security" ? (
            <p className="rounded-[6px] border border-[#dbeafe] bg-[#eff6ff] p-3 text-[12px] text-[#1e40af]">
              Watermarking and MFA will be enabled for invited investors by default.
            </p>
          ) : (
            <ReviewList
              items={[
                { label: "Data room", value: roomName },
                { label: "Campaign", value: roomCampaign },
                { label: "Security", value: "Watermarking and MFA enabled" },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrDialogShell
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite investor"
        description={`Grant access to ${selected?.name ?? "selected room"}`}
        size="lg"
        footer={
          <FrFormFooter
            onCancel={() => setInviteOpen(false)}
            onSubmit={() => {
              if (!inviteName.trim()) return
              toast.success(`Invite sent to ${inviteName.trim()}`)
              setInviteName("Granite Peak Trustees")
              setInviteOpen(false)
            }}
            submitLabel="Send invite"
            submitDisabled={!inviteName.trim()}
          />
        }
      >
        <FrField label="Investor / contact">
          <input
            className={frInputClass}
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Organisation or contact email"
          />
        </FrField>
      </FrDialogShell>
    </div>
  )
}
