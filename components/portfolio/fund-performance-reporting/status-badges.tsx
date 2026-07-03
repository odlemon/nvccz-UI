import type { RunStatus, RunEventType, TransportMethod } from "@/lib/api/fund-performance-reporting-api"

export function ActivePill({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  )
}

const RUN_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
}

export function RunStatusBadge({ status }: { status?: RunStatus | string | null }) {
  const label = status || "—"
  const cls = RUN_STATUS_STYLES[label as string] || "bg-gray-100 text-gray-600"
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

const EVENT_TYPE_STYLES: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700",
  BOUNCE: "bg-red-100 text-red-700",
  COMPLAINT: "bg-amber-100 text-amber-700",
  DOWNLOAD: "bg-emerald-100 text-emerald-700",
}

export function EventTypeBadge({ eventType }: { eventType?: RunEventType | string | null }) {
  const label = eventType || "—"
  const cls = EVENT_TYPE_STYLES[label as string] || "bg-gray-100 text-gray-600"
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

export function TransportBadge({ method }: { method?: TransportMethod | string | null }) {
  const label = method || "—"
  const cls =
    label === "DIRECT_ATTACH" ? "bg-violet-100 text-violet-700" :
    label === "SECURE_LINK" ? "bg-cyan-100 text-cyan-700" :
    "bg-gray-100 text-gray-600"
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{String(label).replace(/_/g, " ")}</span>
}
