"use client"

import { useMemo, useState } from "react"
import { Bell, CheckCircle2, AlertTriangle, MessageSquare, Target, FileText, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmTabPills } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type NotificationType = "alert" | "approval" | "comment" | "goal" | "report"

type Notification = {
  id: string
  type: NotificationType
  title: string
  detail: string
  time: string
  read: boolean
}

const typeMeta: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
  approval: { icon: CheckCircle2, color: "#10B981", bg: "#ECFDF5" },
  comment: { icon: MessageSquare, color: "#2563EB", bg: "#EFF6FF" },
  goal: { icon: Target, color: "#7C3AED", bg: "#F5F3FF" },
  report: { icon: FileText, color: "#F97316", bg: "#FFF7ED" },
}

const initialNotifications: Notification[] = [
  { id: "n1", type: "alert", title: "SLA Compliance breached threshold", detail: "Customer Success · APAC region support SLA fell below 95%.", time: "12m ago", read: false },
  { id: "n2", type: "approval", title: "Corrective Action Plan approved", detail: "Your CAP for SLA Compliance gap was approved by COO.", time: "1hr ago", read: false },
  { id: "n3", type: "comment", title: "New qualitative comment on Finance scorecard", detail: "Anesu Mlambo added context on Cash Reserves Ratio.", time: "3hr ago", read: false },
  { id: "n4", type: "goal", title: "Key Result at risk", detail: "Reduce average support response time to < 2hrs is trending At Risk.", time: "5hr ago", read: true },
  { id: "n5", type: "report", title: "Q2 Board Report generated", detail: "Executive Performance Summary is ready for review.", time: "1d ago", read: true },
  { id: "n6", type: "approval", title: "Workflow submission pending your review", detail: "Employee Contract Renewal — T. Chari needs your approval.", time: "1d ago", read: false },
  { id: "n7", type: "goal", title: "Objective check-in submitted", detail: "Kudakwashe Biti checked in on Customer Experience objective.", time: "2d ago", read: true },
]

export function NotificationsMockScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [tab, setTab] = useState<"all" | "unread">("all")

  const filtered = useMemo(() => (tab === "unread" ? notifications.filter((n) => !n.read) : notifications), [notifications, tab])
  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("All notifications marked as read")
  }

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Notifications"]} searchPlaceholder="Search notifications…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Notifications"
          subtitle="Stay on top of alerts, approvals, comments and goal updates across Performance Management."
          actions={
            <PmButton variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
              <Check className="h-3.5 w-3.5" /> Mark all as read
            </PmButton>
          }
        />

        <PmTabPills
          tabs={[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
          ]}
          active={tab}
          onChange={(id) => setTab(id as "all" | "unread")}
        />

        <PmCard className="overflow-hidden">
          <div className="divide-y divide-[#F1F5F9]">
            {filtered.map((n) => {
              const meta = typeMeta[n.type]
              const Icon = meta.icon
              return (
                <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3.5", !n.read && "bg-[#FAF5FF]")}>
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] shrink-0" />}
                      <p className="text-sm font-semibold text-[#111827] truncate">{n.title}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B7280] leading-snug">{n.detail}</p>
                    <p className="mt-1 text-[10px] text-[#9CA3AF]">{n.time}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button type="button" onClick={() => markRead(n.id)} title="Mark as read" className="h-7 w-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#10B981]">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => dismiss(n.id)} title="Dismiss" className="h-7 w-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#EF4444]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-14 text-center">
                <Bell className="h-8 w-8 text-[#D1D5DB] mx-auto" />
                <p className="mt-2 text-sm font-medium text-[#111827]">You&apos;re all caught up</p>
                <p className="text-xs text-[#9CA3AF]">No {tab === "unread" ? "unread " : ""}notifications right now.</p>
              </div>
            )}
          </div>
        </PmCard>
      </div>
    </div>
  )
}
