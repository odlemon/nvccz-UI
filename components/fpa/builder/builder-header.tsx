"use client"

import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FpaModel, FpaVersion } from "@/lib/api/fpa-api"

export type BuilderValidationState = {
  valid: boolean | null
  errorCount: number
  warningCount: number
  circular: boolean | null
  circularPath: string[] | null
  lastPublishedAt?: string | null
  lastPublishedBy?: string | null
}

type Props = {
  models: FpaModel[]
  modelId: string | null
  versions: FpaVersion[]
  versionId: string | null
  validation: BuilderValidationState
  busyKey: string | null
  canConfigure: boolean
  onModelChange: (id: string) => void
  onVersionChange: (id: string) => void
  onValidate: () => void
  onTestCalc: () => void
  onChangeHistory: () => void
  onOpenModelSettings?: () => void
  onPublish?: () => void
  /** Design polish: show A.3 mock labels until live publish metadata is wired. */
  hardcodeChrome?: boolean
  versionLocked?: boolean
  /** True when model or selected version is already published — Publish must stay off. */
  publishDisabled?: boolean
  modelPublished?: boolean
  onReopenWorkspace?: () => void
}

/**
 * Model Builder workspace chrome — matches A.3 toolbar (labels above selects, not nav chips).
 */
export function BuilderHeader({
  models,
  modelId,
  versions,
  versionId,
  validation,
  busyKey,
  canConfigure,
  onModelChange,
  onVersionChange,
  onValidate,
  onTestCalc,
  onChangeHistory,
  onOpenModelSettings,
  onPublish,
  hardcodeChrome = true,
  versionLocked = false,
  publishDisabled = false,
  modelPublished = false,
  onReopenWorkspace,
}: Props) {
  const selectedModel = models.find((m) => m.id === modelId)
  const selectedVersion = versions.find((v) => v.id === versionId)

  const modelLabel =
    hardcodeChrome && !selectedModel
      ? "FY2026 Financial Model"
      : selectedModel?.name || "Select model"
  const workspaceLabel =
    hardcodeChrome && !selectedVersion
      ? "Budget 2026"
      : selectedVersion?.name || "Workspace"

  const showValid = hardcodeChrome || validation.valid === true
  const showCircularOk = hardcodeChrome || validation.circular === false
  const showUnknown = !hardcodeChrome && validation.valid == null

  const publishedAt = hardcodeChrome
    ? "May 12, 2026 9:15 AM"
    : validation.lastPublishedAt
      ? new Date(validation.lastPublishedAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null
  const publishedBy = hardcodeChrome
    ? "Sarah Delgado"
    : validation.lastPublishedBy || null

  return (
    <div className="shrink-0 border-b border-[#e2e8f0] bg-white px-5 py-3">
      <div className="flex flex-col xl:flex-row xl:items-end gap-3 xl:gap-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 min-w-0 flex-1">
          {/* Model — label above */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[#64748b]">Model</span>
            <Select value={modelId || undefined} onValueChange={onModelChange}>
              <SelectTrigger className="h-10 w-[240px] rounded-md border border-[#e2e8f0] bg-white px-3 text-[13px] font-medium text-[#0f172a] shadow-none focus:ring-2 focus:ring-[#2563eb]/20">
                <SelectValue placeholder={modelLabel} />
              </SelectTrigger>
              <SelectContent>
                {models.length === 0 ? (
                  <SelectItem value="__hardcoded__" disabled>
                    {modelLabel}
                  </SelectItem>
                ) : (
                  models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Workspace — label above */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[#64748b]">Workspace</span>
            <Select value={versionId || undefined} onValueChange={onVersionChange}>
              <SelectTrigger className="h-10 w-[160px] rounded-md border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] shadow-none focus:ring-2 focus:ring-[#2563eb]/20">
                <SelectValue placeholder={workspaceLabel} />
              </SelectTrigger>
              <SelectContent>
                {versions.length === 0 ? (
                  <SelectItem value="__hardcoded_ws__" disabled>
                    {workspaceLabel}
                  </SelectItem>
                ) : (
                  versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {String(v.status).toUpperCase() === "LOCKED" ? " (locked)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {versionLocked && canConfigure && onReopenWorkspace ? (
            <div className="flex flex-col gap-1 pb-[1px]">
              <span className="text-[11px] font-medium text-transparent">.</span>
              <button
                type="button"
                disabled={busyKey === "reopen"}
                onClick={onReopenWorkspace}
                className="h-10 inline-flex items-center gap-1.5 rounded-md border border-[#fcd34d] bg-[#fffbeb] px-3 text-[12px] font-medium text-[#92400e] hover:bg-[#fef3c7] disabled:opacity-50"
              >
                {busyKey === "reopen" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Reopen workspace
              </button>
            </div>
          ) : null}

          {/* Status + published — align to bottom of selects */}
          <div className="flex flex-wrap items-center gap-3 pb-[5px]">
            {showUnknown ? (
              <>
                <NotCheckedPill />
                <NotCheckedPill />
              </>
            ) : (
              <>
                <StatusPill
                  ok={showValid}
                  label={
                    showValid
                      ? "Valid"
                      : validation.errorCount
                        ? `${validation.errorCount} errors`
                        : "Invalid"
                  }
                  icon="check"
                />
                <StatusPill
                  ok={showCircularOk}
                  label={showCircularOk ? "Circular Check Passed" : "Circular dependency"}
                  title={
                    validation.circularPath?.length
                      ? validation.circularPath.join(" → ")
                      : undefined
                  }
                  icon="circular"
                />
              </>
            )}

            <div className="leading-tight">
              {publishedAt ? (
                <>
                  <p className="text-[12px] text-[#64748b] whitespace-nowrap">
                    Last Published: {publishedAt}
                  </p>
                  {publishedBy ? (
                    <p className="text-[12px] text-[#0f172a] whitespace-nowrap">by {publishedBy}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-[12px] text-[#94a3b8]">Never published</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pb-0">
          <button
            type="button"
            disabled={!canConfigure || !modelId || busyKey === "validate"}
            onClick={onValidate}
            className="h-10 inline-flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-medium text-[#2563eb] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            {busyKey === "validate" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
            )}
            Validate Model
          </button>

          <button
            type="button"
            disabled={!modelId || busyKey === "test"}
            onClick={onTestCalc}
            className="h-10 inline-flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
            title="Run test calculation and refresh preview"
          >
            {busyKey === "test" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Test Calc
          </button>

          <div className="inline-flex h-10 rounded-full overflow-hidden">
            <button
              type="button"
              disabled={
                !canConfigure ||
                !modelId ||
                !onPublish ||
                busyKey === "publish" ||
                validation.valid === false ||
                publishDisabled
              }
              title={
                !onPublish
                  ? "Publish API coming"
                  : publishDisabled
                    ? modelPublished
                      ? "This model is already published"
                      : "This version is already published or locked"
                    : validation.valid === false
                      ? "Fix validation errors before publishing"
                      : "Publish workspace version"
              }
              onClick={() => onPublish?.()}
              className="h-10 inline-flex items-center gap-2 rounded-l-full bg-[#2563eb] px-3.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busyKey === "publish" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Publish
            </button>
            <button
              type="button"
              disabled
              title="Publish options coming"
              className="h-10 w-9 inline-flex items-center justify-center rounded-r-full border-l border-white/30 bg-[#2563eb] text-white disabled:opacity-80 cursor-not-allowed"
              aria-label="Publish options"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onChangeHistory}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {onOpenModelSettings ? (
            <button
              type="button"
              onClick={onOpenModelSettings}
              className="h-10 rounded-full border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-medium text-[#334155] hover:bg-[#f8fafc]"
              title="Edit calendar and base currency"
            >
              Calendar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function NotCheckedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] text-[#64748b]">
      Not checked
    </span>
  )
}

function StatusPill({
  ok,
  label,
  title,
  icon,
}: {
  ok: boolean
  label: string
  title?: string
  icon: "check" | "circular"
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
        ok ? "bg-[#e8f8ee] text-[#15803d]" : "bg-[#fef2f2] text-[#b91c1c]",
      )}
    >
      {ok ? (
        icon === "circular" ? (
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
        )
      ) : null}
      {label}
    </span>
  )
}
