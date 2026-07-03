import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react"
import { TERMINAL_ALERTS, type TerminalAlert } from "@/lib/investments/mock-data"

const CONFIG: Record<
  TerminalAlert["severity"],
  { icon: LucideIcon; wrap: string; icon_c: string }
> = {
  info: { icon: Info, wrap: "bg-accent", icon_c: "text-primary" },
  warn: { icon: AlertTriangle, wrap: "bg-warn-muted", icon_c: "text-warn-foreground" },
  error: { icon: XCircle, wrap: "bg-loss-muted", icon_c: "text-loss-foreground" },
  success: { icon: CheckCircle2, wrap: "bg-gain-muted", icon_c: "text-gain-foreground" },
}

export function AlertsFeed() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Operations Feed</h2>
        <span className="rounded-full bg-loss-muted px-2 py-0.5 text-[11px] font-medium text-loss-foreground">
          {TERMINAL_ALERTS.filter((a) => a.severity === "error" || a.severity === "warn").length} action
        </span>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
        {TERMINAL_ALERTS.map((a) => {
          const c = CONFIG[a.severity]
          return (
            <li key={a.id} className="flex gap-3 px-5 py-3 hover:bg-muted/40">
              <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", c.wrap)}>
                <c.icon className={cn("h-4 w-4", c.icon_c)} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {a.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">· {a.time}</span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-foreground">{a.message}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
