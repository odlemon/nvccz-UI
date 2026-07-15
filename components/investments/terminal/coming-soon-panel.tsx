"use client"

import { Clock } from "lucide-react"
import { TerminalTopbar } from "./topbar"
import { TerminalCard } from "./card"

interface ComingSoonPanelProps {
  module: string
  description: string
  plannedItems: string[]
}

export function ComingSoonPanel({ module, description, plannedItems }: ComingSoonPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <TerminalTopbar title={module} subtitle={description} />
      <div className="flex-1 p-5">
        <TerminalCard className="max-w-xl mx-auto mt-8">
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent">
              <Clock className="size-5 text-accent-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{module} is coming soon</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              This area is planned for a later phase of the Investments operations rollout. Below is the planned feature set.
            </p>
            <ul className="mt-2 w-full space-y-1.5 text-left">
              {plannedItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </TerminalCard>
      </div>
    </div>
  )
}
