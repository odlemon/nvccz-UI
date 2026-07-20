"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  UploadCloud,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type PortalTab = "requests" | "messages"
type Priority = "High" | "Medium" | "Low"
type Status =
  | "Under Review"
  | "Awaiting Investor"
  | "Assigned"
  | "Submitted"
  | "Resolved"
  | "Closed"

type ServiceRequest = {
  id: string
  reference: string
  type: string
  fund: string
  subject: string
  submittedBy: string
  lastUpdated: string
  status: Status
  priority: Priority
  linkedTo: string
  description: string
  attachments: Array<{ name: string; size: string }>
}

type ChatAttachment = { name: string; size: string }

type ThreadMessage = {
  id: string
  sender: string
  initials: string
  role: "investor" | "team"
  timestamp: string
  body: string
  attachments?: ChatAttachment[]
}

type Conversation = {
  id: string
  requestId: string
  title: string
  fund: string
  preview: string
  updated: string
  unread?: number
  linkedLabel: string
  participants: Array<{ name: string; initials: string; color: string }>
  messages: ThreadMessage[]
}

const REQUEST_TYPES = [
  "Account / Statement",
  "Capital Activity",
  "Open-Ended Activity",
  "Profile / Access",
]

const FUNDS = [
  "Arcus Growth Fund V, L.P.",
  "Arcus Growth Fund IV, L.P.",
  "Arcus Opportunities Fund II, L.P.",
  "Arcus Strategic Income Fund L.P.",
  "Arcus Credit Opportunities Fund II L.P.",
]

const STATUS_STYLE: Record<Status, string> = {
  "Under Review": "bg-[#ffedd5] text-[#c2410c]",
  "Awaiting Investor": "bg-[#ede9fe] text-[#6d28d9]",
  Assigned: "bg-[#dbeafe] text-[#1d4ed8]",
  Submitted: "bg-[#e0f2fe] text-[#0369a1]",
  Resolved: "bg-[#dcfce7] text-[#15803d]",
  Closed: "bg-[#f3f4f6] text-[#4b5563]",
}

const PRIORITY_DOT: Record<Priority, string> = {
  High: "bg-[#ef4444]",
  Medium: "bg-[#f97316]",
  Low: "bg-[#22c55e]",
}

const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: "req-1",
    reference: "REQ-000845",
    type: "Capital Activity",
    fund: "Arcus Growth Fund V, L.P.",
    subject: "Capital Call #12 – Payment Applied",
    submittedBy: "Jane Smith",
    lastUpdated: "May 28, 2025 2:18 PM",
    status: "Awaiting Investor",
    priority: "High",
    linkedTo: "Capital Call #12",
    description: "Please confirm wire application for Capital Call #12.",
    attachments: [
      { name: "CC-012 Wire Confirmation.pdf", size: "248 KB" },
      { name: "CC-012 Remittance Confirmation.pdf", size: "196 KB" },
    ],
  },
  {
    id: "req-2",
    reference: "REQ-000839",
    type: "Account / Statement",
    fund: "Arcus Opportunities Fund II, L.P.",
    subject: "Q1 2025 statement fee line inquiry",
    submittedBy: "Jane Smith",
    lastUpdated: "May 27, 2025 11:40 AM",
    status: "Under Review",
    priority: "Medium",
    linkedTo: "Q1 2025 Investor Statement",
    description: "Clarification needed on the administration fee line.",
    attachments: [{ name: "Q1_2025_Statement.pdf", size: "1.1 MB" }],
  },
  {
    id: "req-3",
    reference: "REQ-000831",
    type: "Profile / Access",
    fund: "Arcus Growth Fund V, L.P.",
    subject: "Add viewer access for finance reviewer",
    submittedBy: "Tawanda Moyo",
    lastUpdated: "May 26, 2025 4:05 PM",
    status: "Assigned",
    priority: "Low",
    linkedTo: "Organisation Access",
    description: "Grant read-only access for quarterly reports.",
    attachments: [],
  },
  {
    id: "req-4",
    reference: "REQ-000822",
    type: "Open-Ended Activity",
    fund: "Arcus Strategic Income Fund L.P.",
    subject: "Subscription SUB-000089 settlement",
    submittedBy: "Jane Smith",
    lastUpdated: "May 22, 2025 9:12 AM",
    status: "Submitted",
    priority: "Medium",
    linkedTo: "Subscription SUB-000089",
    description: "Confirm final units after May dealing date.",
    attachments: [{ name: "SUB-000089 Confirmation.pdf", size: "156 KB" }],
  },
  {
    id: "req-5",
    reference: "REQ-000810",
    type: "Capital Activity",
    fund: "Arcus Growth Fund IV, L.P.",
    subject: "Distribution notice DIST-000119 FX rate",
    submittedBy: "David Lee",
    lastUpdated: "May 18, 2025 3:33 PM",
    status: "Resolved",
    priority: "High",
    linkedTo: "Distribution DIST-000119",
    description: "Please share the historical FX used for EUR distribution.",
    attachments: [{ name: "FX Memo DIST-000119.pdf", size: "64 KB" }],
  },
  {
    id: "req-6",
    reference: "REQ-000798",
    type: "Account / Statement",
    fund: "Arcus Credit Opportunities Fund II L.P.",
    subject: "2024 tax package availability",
    submittedBy: "Jane Smith",
    lastUpdated: "May 10, 2025 10:20 AM",
    status: "Closed",
    priority: "Low",
    linkedTo: "2024 K-1 Tax Package",
    description: "Request for final 2024 tax package.",
    attachments: [{ name: "2024_K1_Tax_Package.xlsx", size: "1.1 MB" }],
  },
  {
    id: "req-7",
    reference: "REQ-000791",
    type: "Capital Activity",
    fund: "Arcus Growth Fund V, L.P.",
    subject: "Bank instruction change status",
    submittedBy: "Michael Chen",
    lastUpdated: "May 8, 2025 1:05 PM",
    status: "Under Review",
    priority: "High",
    linkedTo: "Bank Instruction Request",
    description: "Status update on bank detail change verification.",
    attachments: [],
  },
  {
    id: "req-8",
    reference: "REQ-000776",
    type: "Open-Ended Activity",
    fund: "Arcus Strategic Income Fund L.P.",
    subject: "Redemption RED-000041 dealing date",
    submittedBy: "Jane Smith",
    lastUpdated: "May 2, 2025 8:44 AM",
    status: "Awaiting Investor",
    priority: "Medium",
    linkedTo: "Redemption RED-000041",
    description: "Need confirmation of documents for redemption review.",
    attachments: [{ name: "RED-000041 Request.pdf", size: "134 KB" }],
  },
]

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    requestId: "req-1",
    title: "Capital Call #12 – Payment Applied",
    fund: "Arcus Growth Fund V, L.P.",
    preview: "The wire has been matched. Please review the attached remittance confirmation.",
    updated: "2:18 PM",
    unread: 2,
    linkedLabel: "Capital Call #12",
    participants: [
      { name: "Jane Smith", initials: "JS", color: "bg-[#2563eb]" },
      { name: "Michael Dube", initials: "MD", color: "bg-[#0f172a]" },
      { name: "Priya Ndlovu", initials: "PN", color: "bg-[#7c3aed]" },
    ],
    messages: [
      {
        id: "m1",
        sender: "Jane Smith",
        initials: "JS",
        role: "investor",
        timestamp: "May 28, 2025 9:12 AM",
        body: "We sent the CC-012 wire yesterday. Could you confirm that it has been received and applied to our investor account?",
        attachments: [{ name: "CC-012 Wire Confirmation.pdf", size: "248 KB" }],
      },
      {
        id: "m2",
        sender: "Arcus Team",
        initials: "A",
        role: "team",
        timestamp: "May 28, 2025 2:18 PM",
        body: "The wire has been matched and applied. Please review the remittance confirmation attached below.",
        attachments: [{ name: "CC-012 Remittance Confirmation.pdf", size: "196 KB" }],
      },
    ],
  },
  {
    id: "conv-2",
    requestId: "req-2",
    title: "Q1 2025 statement fee line inquiry",
    fund: "Arcus Opportunities Fund II, L.P.",
    preview: "Investor Accounting is reviewing the fee calculation.",
    updated: "Yesterday",
    unread: 0,
    linkedLabel: "Q1 2025 Investor Statement",
    participants: [
      { name: "Jane Smith", initials: "JS", color: "bg-[#2563eb]" },
      { name: "Priya Ndlovu", initials: "PN", color: "bg-[#7c3aed]" },
    ],
    messages: [
      {
        id: "m3",
        sender: "Jane Smith",
        initials: "JS",
        role: "investor",
        timestamp: "May 27, 2025 11:40 AM",
        body: "Please explain the administration fee adjustment on the Q1 statement.",
      },
      {
        id: "m4",
        sender: "Arcus Team",
        initials: "A",
        role: "team",
        timestamp: "May 27, 2025 3:05 PM",
        body: "We are reviewing the approved calculation and will reply with the supporting schedule.",
      },
    ],
  },
  {
    id: "conv-3",
    requestId: "req-4",
    title: "Subscription SUB-000089 settlement",
    fund: "Arcus Strategic Income Fund L.P.",
    preview: "Final units and dealing NAV confirmation pending.",
    updated: "May 22",
    linkedLabel: "Subscription SUB-000089",
    participants: [
      { name: "Jane Smith", initials: "JS", color: "bg-[#2563eb]" },
      { name: "Michael Dube", initials: "MD", color: "bg-[#0f172a]" },
    ],
    messages: [
      {
        id: "m5",
        sender: "Jane Smith",
        initials: "JS",
        role: "investor",
        timestamp: "May 22, 2025 9:12 AM",
        body: "Could you confirm final units allocated for SUB-000089?",
      },
    ],
  },
  {
    id: "conv-4",
    requestId: "req-8",
    title: "Redemption RED-000041 dealing date",
    fund: "Arcus Strategic Income Fund L.P.",
    preview: "Additional documentation requested before dealing date.",
    updated: "May 2",
    unread: 1,
    linkedLabel: "Redemption RED-000041",
    participants: [
      { name: "Jane Smith", initials: "JS", color: "bg-[#2563eb]" },
      { name: "Priya Ndlovu", initials: "PN", color: "bg-[#7c3aed]" },
    ],
    messages: [
      {
        id: "m6",
        sender: "Arcus Team",
        initials: "A",
        role: "team",
        timestamp: "May 2, 2025 8:44 AM",
        body: "Please upload the signed redemption notice to continue review.",
      },
    ],
  },
]

const KPIS = [
  {
    id: "open",
    label: "Open Requests",
    value: "8",
    link: "View all open",
    linkTone: "blue" as const,
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#2563eb]",
    icon: <Inbox className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "awaiting",
    label: "Awaiting Investor",
    value: "3",
    link: "Action required",
    linkTone: "red" as const,
    iconBg: "bg-[#ede9fe]",
    iconColor: "text-[#7c3aed]",
    icon: <AlertCircle className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "review",
    label: "Under Review",
    value: "5",
    link: "In progress",
    linkTone: "blue" as const,
    iconBg: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    icon: <Clock3 className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "unread",
    label: "Unread Messages",
    value: "2",
    link: "View messages",
    linkTone: "blue" as const,
    iconBg: "bg-[#dcfce7]",
    iconColor: "text-[#16a34a]",
    icon: <MessageSquare className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "closed",
    label: "Closed This Month",
    value: "12",
    link: "View history",
    linkTone: "blue" as const,
    iconBg: "bg-[#ccfbf1]",
    iconColor: "text-[#0d9488]",
    icon: <CheckCircle2 className="size-4" strokeWidth={2.25} />,
  },
]

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  )
}

function PriorityCell({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#374151]">
      <span className={cn("size-2 rounded-full", PRIORITY_DOT[priority])} />
      {priority}
    </span>
  )
}

function downloadMock(name: string) {
  const url = URL.createObjectURL(
    new Blob([`Mock attachment: ${name}\nLP Portal demo file.`], { type: "text/plain" }),
  )
  const a = document.createElement("a")
  a.href = url
  a.download = name.replace(/\.pdf$/i, ".txt")
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Attachment downloaded (mock).")
}

export function LpRequestsMessagesScreen({
  initialTab = "requests",
}: {
  initialTab?: PortalTab
}) {
  const [tab, setTab] = React.useState<PortalTab>(initialTab)
  const [requests, setRequests] = React.useState(SEED_REQUESTS)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [selectedRequestId, setSelectedRequestId] = React.useState(SEED_REQUESTS[0].id)
  const [conversations, setConversations] = React.useState(SEED_CONVERSATIONS)
  const [activeConversationId, setActiveConversationId] = React.useState(SEED_CONVERSATIONS[0].id)
  const [convQuery, setConvQuery] = React.useState("")
  const [reply, setReply] = React.useState("")
  const [form, setForm] = React.useState({
    type: REQUEST_TYPES[0],
    fund: FUNDS[0],
    subject: "",
    priority: "Medium" as Priority,
    description: "",
  })
  const [formFiles, setFormFiles] = React.useState<File[]>([])
  const formFileRef = React.useRef<HTMLInputElement>(null)
  const replyFileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const filteredRequests = React.useMemo(() => {
    return requests.filter((row) => {
      if (statusFilter === "open" && (row.status === "Resolved" || row.status === "Closed")) {
        return false
      }
      if (statusFilter === "awaiting" && row.status !== "Awaiting Investor") return false
      if (statusFilter === "review" && row.status !== "Under Review") return false
      if (statusFilter === "closed" && row.status !== "Closed" && row.status !== "Resolved") {
        return false
      }
      if (query.trim()) {
        const q = query.toLowerCase()
        const hay = `${row.reference} ${row.type} ${row.fund} ${row.subject} ${row.submittedBy}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [query, requests, statusFilter])

  const selectedRequest =
    filteredRequests.find((r) => r.id === selectedRequestId) ??
    requests.find((r) => r.id === selectedRequestId) ??
    filteredRequests[0] ??
    null

  const filteredConversations = React.useMemo(() => {
    if (!convQuery.trim()) return conversations
    const q = convQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.fund.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q),
    )
  }, [convQuery, conversations])

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? conversations[0]

  const selectRequest = (id: string) => {
    setSelectedRequestId(id)
    const linked = conversations.find((c) => c.requestId === id)
    if (linked) setActiveConversationId(linked.id)
  }

  const submitRequest = () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required.")
      return
    }
    const now = new Date()
    const stamp = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    const next: ServiceRequest = {
      id: `req-${Date.now()}`,
      reference: `REQ-${String(845 + requests.length).padStart(6, "0")}`,
      type: form.type,
      fund: form.fund,
      subject: form.subject.trim(),
      submittedBy: "Jane Smith",
      lastUpdated: stamp,
      status: "Submitted",
      priority: form.priority,
      linkedTo: form.fund,
      description: form.description.trim() || "No description provided.",
      attachments: formFiles.map((f) => ({
        name: f.name,
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      })),
    }
    setRequests((prev) => [next, ...prev])
    setSelectedRequestId(next.id)
    setForm({
      type: REQUEST_TYPES[0],
      fund: FUNDS[0],
      subject: "",
      priority: "Medium",
      description: "",
    })
    setFormFiles([])
    toast.success("Request submitted (mock).")
  }

  const sendReply = () => {
    if (!reply.trim() || !activeConversation) return
    const stamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    const message: ThreadMessage = {
      id: `m-${Date.now()}`,
      sender: "Jane Smith",
      initials: "JS",
      role: "investor",
      timestamp: stamp,
      body: reply.trim(),
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              preview: message.body,
              updated: "Just now",
              unread: 0,
              messages: [...c.messages, message],
            }
          : c,
      ),
    )
    setReply("")
    toast.success("Message sent (mock).")
  }

  const onKpiClick = (id: string) => {
    if (id === "unread") {
      setTab("messages")
      return
    }
    setTab("requests")
    if (id === "open") setStatusFilter("open")
    else if (id === "awaiting") setStatusFilter("awaiting")
    else if (id === "review") setStatusFilter("review")
    else if (id === "closed") setStatusFilter("closed")
  }

  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread ?? 0), 0)

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Requests & Messages</h1>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          Submit, track, and manage your requests or communicate with the Arcus team.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((kpi) => (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onKpiClick(kpi.id)}
            className="rounded-xl border border-[#e5e7eb] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#cbd5e1]"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  kpi.iconBg,
                  kpi.iconColor,
                )}
              >
                {kpi.icon}
              </span>
            </div>
            <p className="mt-3 text-[12px] font-medium text-[#6b7280]">{kpi.label}</p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-[-0.03em] text-[#0f172a]">
              {kpi.value}
            </p>
            <span
              className={cn(
                "mt-2 inline-block text-[12px] font-medium",
                kpi.linkTone === "red" ? "text-[#dc2626]" : "text-[#2563eb]",
              )}
            >
              {kpi.link}
            </span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-5 border-b border-[#e5e7eb] px-4">
              {(
                [
                  ["requests", `Requests (${requests.length})`],
                  ["messages", `Messages (${unreadCount || 2})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "-mb-px border-b-2 py-3 text-[13px] font-semibold",
                    tab === id
                      ? "border-[#2563eb] text-[#2563eb]"
                      : "border-transparent text-[#6b7280] hover:text-[#111827]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "requests" ? (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-[140px] rounded-full border-[#e5e7eb] text-[12px] shadow-none">
                      <SelectValue placeholder="All Requests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Requests</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="awaiting">Awaiting Investor</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="closed">Closed / Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full border-[#e5e7eb] px-3 text-[12px] font-medium text-[#374151] shadow-none"
                    onClick={() => toast.message("Additional filters (mock).")}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Filters
                  </Button>
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search requests..."
                      className="h-9 rounded-full border-[#e5e7eb] pl-9 text-[12px] shadow-none"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-full border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"
                    aria-label="Export"
                    onClick={() => toast.success("Requests exported (mock).")}
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                        <th className="px-4 py-2.5">Reference</th>
                        <th className="px-3 py-2.5">Request Type</th>
                        <th className="px-3 py-2.5">Linked Fund</th>
                        <th className="px-3 py-2.5">Subject</th>
                        <th className="px-3 py-2.5">Submitted By</th>
                        <th className="px-3 py-2.5">Last Updated</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Priority</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((row) => {
                        const active = selectedRequest?.id === row.id
                        return (
                          <tr
                            key={row.id}
                            onClick={() => selectRequest(row.id)}
                            className={cn(
                              "cursor-pointer border-b border-[#f3f4f6] transition last:border-0",
                              active
                                ? "bg-[#eff6ff] shadow-[inset_3px_0_0_0_#2563eb]"
                                : "hover:bg-[#f9fafb]",
                            )}
                          >
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium text-[#2563eb]">
                              {row.reference}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[#374151]">{row.type}</td>
                            <td className="max-w-[150px] truncate px-3 py-3 text-[#4b5563]">
                              {row.fund}
                            </td>
                            <td className="max-w-[180px] truncate px-3 py-3 font-medium text-[#111827]">
                              {row.subject}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">
                              {row.submittedBy}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">
                              {row.lastUpdated}
                            </td>
                            <td className="px-3 py-3">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="px-3 py-3">
                              <PriorityCell priority={row.priority} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="rounded-full p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Actions for ${row.reference}`}
                                  >
                                    <MoreHorizontal className="size-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem onClick={() => selectRequest(row.id)}>
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      selectRequest(row.id)
                                      setTab("messages")
                                    }}
                                  >
                                    Open conversation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredRequests.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-10 text-center text-[13px] text-[#9ca3af]"
                          >
                            No requests match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[#f1f5f9] px-4 py-3 text-[12px] text-[#6b7280]">
                  Showing{" "}
                  <span className="font-medium text-[#111827]">
                    {filteredRequests.length === 0 ? 0 : 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-[#111827]">{filteredRequests.length}</span> of{" "}
                  <span className="font-medium text-[#111827]">{filteredRequests.length}</span>{" "}
                  requests
                </div>
              </>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#6b7280]">
                Conversation workspace is below. Select a thread to continue messaging the Arcus
                team.
              </div>
            )}
          </section>

          {/* Conversations + thread */}
          <section className="grid min-h-[420px] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="border-b border-[#e5e7eb] lg:border-b-0 lg:border-r">
              <div className="border-b border-[#f1f5f9] px-3 py-3">
                <p className="text-[13px] font-semibold text-[#111827]">Conversations</p>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                  <Input
                    value={convQuery}
                    onChange={(e) => setConvQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="h-8 rounded-lg border-[#e5e7eb] pl-8 text-[11px] shadow-none"
                  />
                </div>
              </div>
              <ul className="max-h-[360px] overflow-y-auto">
                {filteredConversations.map((conv) => {
                  const active = conv.id === activeConversation?.id
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveConversationId(conv.id)
                          setSelectedRequestId(conv.requestId)
                          setConversations((prev) =>
                            prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c)),
                          )
                        }}
                        className={cn(
                          "w-full border-b border-[#f3f4f6] px-3 py-3 text-left transition last:border-0",
                          active ? "bg-[#eff6ff]" : "hover:bg-[#f9fafb]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#2563eb]">
                              <FolderOpen className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-[#111827]">
                                {conv.title}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-[#9ca3af]">{conv.fund}</p>
                              <p className="mt-1 line-clamp-2 text-[11px] text-[#6b7280]">
                                {conv.preview}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[10px] text-[#9ca3af]">{conv.updated}</span>
                            {!!conv.unread && (
                              <span className="rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                className="w-full border-t border-[#f1f5f9] px-3 py-2.5 text-left text-[12px] font-medium text-[#2563eb] hover:bg-[#f8fafc]"
                onClick={() => toast.message("All conversations (mock).")}
              >
                View all conversations
              </button>
            </div>

            {activeConversation && (
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#111827]">
                      {activeConversation.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6b7280]">
                      <button
                        type="button"
                        className="rounded-full bg-[#eff6ff] px-2 py-0.5 font-medium text-[#2563eb]"
                        onClick={() => toast.message(activeConversation.linkedLabel)}
                      >
                        Linked to {activeConversation.linkedLabel}
                      </button>
                      <span>{activeConversation.fund}</span>
                      <span className="font-mono text-[#9ca3af]">
                        {requests.find((r) => r.id === activeConversation.requestId)?.reference}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#6b7280]">
                      Participants ({activeConversation.participants.length})
                    </span>
                    <div className="flex -space-x-2">
                      {activeConversation.participants.map((p) => (
                        <Avatar key={p.name} className="size-7 border-2 border-white">
                          <AvatarFallback className={cn("text-[10px] text-white", p.color)}>
                            {p.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-full border border-dashed border-[#cbd5e1] text-[#9ca3af] hover:bg-[#f9fafb]"
                      aria-label="Add participant"
                      onClick={() => toast.message("Add participant (mock).")}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {activeConversation.messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-[11px] font-semibold text-white",
                            msg.role === "investor" ? "bg-[#2563eb]" : "bg-[#0f172a]",
                          )}
                        >
                          {msg.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12px] font-semibold text-[#111827]">{msg.sender}</p>
                          <p className="text-[10px] text-[#9ca3af]">{msg.timestamp}</p>
                        </div>
                        <div
                          className={cn(
                            "mt-1.5 rounded-xl px-3 py-2.5 text-[12px] leading-5 text-[#374151]",
                            msg.role === "investor"
                              ? "border border-[#e5e7eb] bg-white"
                              : "bg-[#f3f4f6]",
                          )}
                        >
                          {msg.body}
                          {msg.attachments?.map((file) => (
                            <div
                              key={file.name}
                              className="mt-2 flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-2"
                            >
                              <FileText className="size-4 shrink-0 text-[#dc2626]" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-medium text-[#111827]">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-[#9ca3af]">{file.size}</p>
                              </div>
                              <button
                                type="button"
                                className="rounded-full p-1 text-[#2563eb] hover:bg-[#eff6ff]"
                                aria-label={`Download ${file.name}`}
                                onClick={() => downloadMock(file.name)}
                              >
                                <Download className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#f1f5f9] px-4 py-3">
                  <div className="flex items-end gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[44px] resize-none rounded-xl border-[#e5e7eb] pr-10 text-[12px] shadow-none"
                        rows={2}
                      />
                      <button
                        type="button"
                        className="absolute bottom-2 right-2 rounded-full p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#2563eb]"
                        aria-label="Attach file"
                        onClick={() => replyFileRef.current?.click()}
                      >
                        <Paperclip className="size-3.5" />
                      </button>
                      <input
                        ref={replyFileRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) toast.message(`Attached ${file.name} (mock).`)
                          e.target.value = ""
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      className="h-10 rounded-full bg-[#93c5fd] px-5 text-[12px] font-semibold text-[#1e3a8a] shadow-none hover:bg-[#60a5fa]"
                      onClick={sendReply}
                    >
                      <Send className="size-3.5" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="text-[14px] font-semibold text-[#111827]">Create New Request</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Request Type
                </label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Linked Fund
                </label>
                <Select
                  value={form.fund}
                  onValueChange={(v) => setForm((f) => ({ ...f, fund: v }))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Subject
                </label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief summary of your request"
                  className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Priority
                </label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className="inline-flex items-center gap-2">
                          <span className={cn("size-2 rounded-full", PRIORITY_DOT[p])} />
                          {p}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Provide details to help the Arcus team respond..."
                  className="min-h-[88px] rounded-lg border-[#e5e7eb] text-[12px] shadow-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Attachments
                </label>
                <button
                  type="button"
                  onClick={() => formFileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafafa] px-3 py-5 text-center transition hover:border-[#93c5fd] hover:bg-[#f8fbff]"
                >
                  <UploadCloud className="size-5 text-[#2563eb]" />
                  <p className="mt-2 text-[12px] font-medium text-[#374151]">
                    Drag & drop or click to browse
                  </p>
                  <p className="mt-1 text-[10px] text-[#9ca3af]">
                    PDF, DOC, XLSX, PNG · Max 20MB
                  </p>
                </button>
                <input
                  ref={formFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const next = Array.from(e.target.files ?? [])
                    if (next.length) setFormFiles((prev) => [...prev, ...next])
                    e.target.value = ""
                  }}
                />
                {formFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formFiles.map((f) => (
                      <li
                        key={f.name + f.size}
                        className="truncate text-[11px] text-[#4b5563]"
                      >
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                type="button"
                className="h-10 w-full rounded-full bg-[#2563eb] text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                onClick={submitRequest}
              >
                Submit Request
              </Button>
            </div>
          </section>

          {selectedRequest && (
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-[#2563eb]" />
                <h2 className="text-[14px] font-semibold text-[#111827]">Request Details</h2>
              </div>
              <dl className="mt-4 space-y-2.5 text-[12px]">
                {[
                  ["Reference", selectedRequest.reference],
                  ["Status", <StatusBadge key="s" status={selectedRequest.status} />],
                  ["Priority", <PriorityCell key="p" priority={selectedRequest.priority} />],
                  [
                    "Linked To",
                    <button
                      key="l"
                      type="button"
                      className="font-medium text-[#2563eb] hover:underline"
                      onClick={() => toast.message(selectedRequest.linkedTo)}
                    >
                      {selectedRequest.linkedTo}
                    </button>,
                  ],
                  ["Fund", selectedRequest.fund],
                  ["Submitted By", selectedRequest.submittedBy],
                  ["Last Updated", selectedRequest.lastUpdated],
                ].map(([label, value]) => (
                  <div key={String(label)} className="grid grid-cols-[100px_1fr] gap-2">
                    <dt className="text-[#9ca3af]">{label}</dt>
                    <dd className="min-w-0 font-medium text-[#111827]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 border-t border-[#f1f5f9] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold text-[#111827]">
                    Attachments ({selectedRequest.attachments.length})
                  </h3>
                  <button
                    type="button"
                    className="text-[12px] font-medium text-[#2563eb]"
                    onClick={() => toast.message("All attachments (mock).")}
                  >
                    View all
                  </button>
                </div>
                {selectedRequest.attachments.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[#9ca3af]">No attachments.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedRequest.attachments.map((file) => (
                      <li
                        key={file.name}
                        className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-2.5 py-2"
                      >
                        <FileText className="size-4 shrink-0 text-[#dc2626]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium text-[#111827]">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-[#9ca3af]">{file.size}</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1 text-[#2563eb] hover:bg-[#eff6ff]"
                          aria-label={`Download ${file.name}`}
                          onClick={() => downloadMock(file.name)}
                        >
                          <Download className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
