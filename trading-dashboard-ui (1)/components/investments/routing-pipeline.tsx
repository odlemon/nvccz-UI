import { cn } from "@/lib/utils"
import { Check, X, Loader2, Minus } from "lucide-react"
import { isSkippedInternal, type RoutingHop } from "@/lib/investments/mock-data"

const LABELS: Record<string, string> = {
  BROKER: "Broker",
  CUSTODIAN: "Custodian",
  CORE_BANKING: "Core Bank",
  ACCOUNTING_GL: "GL",
}

function dotTone(hop: RoutingHop) {
  if (isSkippedInternal(hop)) return "bg-muted text-muted-foreground ring-border"
  switch (hop.status) {
    case "CONFIRMED":
      return "bg-gain text-white ring-gain/30"
    case "DISPATCHED":
      return "bg-primary text-primary-foreground ring-primary/30"
    case "RETRYING":
      return "bg-warn text-white ring-warn/30"
    case "FAILED":
      return "bg-loss text-white ring-loss/30"
    default:
      return "bg-muted text-muted-foreground ring-border"
  }
}

function DotIcon({ hop }: { hop: RoutingHop }) {
  if (isSkippedInternal(hop)) return <Minus className="h-3 w-3" />
  switch (hop.status) {
    case "CONFIRMED":
      return <Check className="h-3 w-3" strokeWidth={3} />
    case "RETRYING":
      return <Loader2 className="h-3 w-3 animate-spin" />
    case "FAILED":
      return <X className="h-3 w-3" strokeWidth={3} />
    default:
      return <span className="h-1 w-1 rounded-full bg-current" />
  }
}

export function RoutingPipeline({
  hops,
  compact = false,
}: {
  hops: RoutingHop[]
  compact?: boolean
}) {
  if (!hops.length) {
    return <span className="text-xs text-muted-foreground">Not routed</span>
  }
  return (
    <div className="flex items-center">
      {hops.map((hop, i) => (
        <div key={hop.id} className="flex items-center">
          <div className="group relative flex flex-col items-center">
            <span
              className={cn(
                "flex items-center justify-center rounded-full ring-1 ring-inset",
                compact ? "h-5 w-5" : "h-6 w-6",
                dotTone(hop),
              )}
              title={`${LABELS[hop.target]} — ${isSkippedInternal(hop) ? "SKIPPED" : hop.status}`}
            >
              <DotIcon hop={hop} />
            </span>
            {!compact && (
              <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                {LABELS[hop.target]}
              </span>
            )}
          </div>
          {i < hops.length - 1 && (
            <span
              className={cn(
                "h-0.5 w-4",
                hop.status === "CONFIRMED" || isSkippedInternal(hop) ? "bg-gain/50" : "bg-border",
                compact ? "mx-0.5" : "mx-1 -mt-4",
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
