"use client"

import { Check, FileSpreadsheet, LayoutGrid, Loader2, MoreVertical } from "lucide-react"
import {
  WORKFLOW_STAGES,
  cycleStatusLabel,
  stepperDateHints,
  workflowStepperIndex,
} from "@/components/fpa/workflow/workflow-utils"
import type { FpaBudgetCycle, FpaWorkflowStage } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"

function progressBadgeLabel(status?: string | null): string {
  const label = cycleStatusLabel(status)
  if (label === "Locked" || label === "Approved") return label
  return "In Progress"
}

/** Left card: cycle title + stepper — one composition matching the screenshot. */
export function WorkflowPlanningCycleCard({
  cycle,
  stages,
  onCycleDetails,
  cyclePicker,
  boardPack,
  cycleActions,
}: {
  cycle: FpaBudgetCycle | null
  stages?: FpaWorkflowStage[] | null
  onCycleDetails: () => void
  cyclePicker?: React.ReactNode
  /** Board pack control shown as a header web button (not in cycle actions). */
  boardPack?: {
    canShow: boolean
    hasUrl: boolean
    generating?: boolean
    onOpen: () => void
    onGenerate: () => void
  } | null
  /** Compact cycle review actions in the header (no separate Cycle actions card). */
  cycleActions?: React.ReactNode
}) {
  const active = workflowStepperIndex(cycle)
  const dates = stepperDateHints(cycle, stages)

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 h-full flex flex-col min-w-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium text-[#94a3b8]">Planning Cycle</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-semibold text-[#0f172a] truncate leading-tight">
              {cycle?.name || "Select a budget cycle"}
            </h1>
            {cycle ? (
              <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#2563eb]">
                {progressBadgeLabel(cycle.status)}
              </span>
            ) : null}
          </div>
          {cyclePicker}
          {cycleActions}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          {boardPack?.canShow ? (
            boardPack.hasUrl ? (
              <button
                type="button"
                onClick={boardPack.onOpen}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 text-xs font-medium text-white hover:bg-[#1d4ed8]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Open board pack
              </button>
            ) : (
              <button
                type="button"
                onClick={boardPack.onGenerate}
                disabled={boardPack.generating}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-[#2563eb]/40 bg-[#eff6ff] px-3 text-xs font-medium text-[#2563eb] disabled:opacity-50"
              >
                {boardPack.generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                Generate board pack
              </button>
            )
          ) : null}
          <button
            type="button"
            onClick={onCycleDetails}
            disabled={!cycle}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#475569] disabled:opacity-50 hover:bg-[#f8fafc]"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#94a3b8]" />
            Cycle Details
          </button>
          <button
            type="button"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="More"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-auto flex items-start gap-0 overflow-x-auto pb-0.5">
        {WORKFLOW_STAGES.map((stage, i) => {
          const done = cycle ? i < active : false
          const current = cycle ? i === active : false
          const dateLabel = dates[i] || ""
          return (
            <div key={stage.key} className="flex items-start min-w-[108px] flex-1">
              <div className="flex flex-col items-start gap-2 w-full pr-1">
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border-2",
                      done && "bg-[#16a34a] border-[#16a34a] text-white",
                      current && "bg-[#2563eb] border-[#2563eb] text-white",
                      !done && !current && "bg-white border-[#e2e8f0] text-[#94a3b8]",
                    )}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
                  </div>
                  {i < WORKFLOW_STAGES.length - 1 ? (
                    <div className="h-[3px] flex-1 mx-1.5 rounded-full overflow-hidden bg-[#e2e8f0] min-w-[16px]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          done && "w-full bg-[#16a34a]",
                          current && "w-1/2 bg-[#2563eb]",
                          !done && !current && "w-0",
                        )}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="pr-1">
                  <p
                    className={cn(
                      "text-[12px] font-semibold leading-tight",
                      current ? "text-[#2563eb]" : done ? "text-[#0f172a]" : "text-[#94a3b8]",
                    )}
                  >
                    {stage.label}
                  </p>
                  {done ? (
                    <p className="text-[10px] text-[#64748b] mt-0.5 leading-snug">
                      <span className="text-[#16a34a] font-medium">Completed</span>
                      {dateLabel ? ` ${dateLabel}` : ""}
                    </p>
                  ) : current ? (
                    <p className="text-[10px] text-[#2563eb] mt-0.5 leading-snug font-medium">
                      In Progress
                      {dateLabel ? ` ${dateLabel}` : ""}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-snug">
                      {dateLabel || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** @deprecated Prefer WorkflowPlanningCycleCard */
export function WorkflowCycleHeader(props: {
  cycle: FpaBudgetCycle | null
  onCycleDetails: () => void
  cyclePicker?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <WorkflowPlanningCycleCard
      cycle={props.cycle}
      onCycleDetails={props.onCycleDetails}
      cyclePicker={props.cyclePicker}
    />
  )
}

/** @deprecated Stepper lives inside PlanningCycleCard */
export function WorkflowStageStepper({ cycle }: { cycle: FpaBudgetCycle | null }) {
  return <WorkflowPlanningCycleCard cycle={cycle} onCycleDetails={() => {}} />
}
