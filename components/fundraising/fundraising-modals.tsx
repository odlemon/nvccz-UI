"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type FrDialogSize = "md" | "lg" | "xl" | "2xl" | "3xl"

const SIZE_CLASS: Record<FrDialogSize, string> = {
  md: "max-w-xl sm:max-w-xl",
  lg: "max-w-3xl sm:max-w-3xl",
  xl: "max-w-4xl sm:max-w-4xl",
  "2xl": "max-w-5xl sm:max-w-5xl",
  "3xl": "max-w-6xl sm:max-w-6xl",
}

/** Shared primary CTA classes — Payroll blue→cyan pill */
export const frPrimaryBtn =
  "rounded-full h-10 px-6 shadow-sm font-semibold text-xs gap-2"
export const frPrimaryBtnSm =
  "rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
export const frPrimaryBtnXs =
  "rounded-full h-8 px-4 shadow-sm font-semibold text-[11px] gap-1.5"

export function FrDialogShell({
  open,
  onOpenChange,
  title,
  description,
  size = "lg",
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: FrDialogSize
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SIZE_CLASS[size],
          "gap-0 overflow-hidden rounded-[12px] border border-[#e2e8f0] p-0 shadow-lg",
        )}
      >
        <DialogHeader className="border-b border-[#f1f5f9] px-5 pb-3 pt-5 text-left sm:px-6">
          <DialogTitle className="text-base font-semibold text-[#0f172a]">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-xs text-[#64748b]">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="max-h-[min(78vh,720px)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f1f5f9] bg-[#fafafa] px-5 py-3">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function FrFormFooter({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitDisabled,
}: {
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-full px-4"
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        variant="gradient-info"
        className={frPrimaryBtnSm}
        onClick={onSubmit}
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </>
  )
}

export function FrField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[11px] font-medium text-[#64748b]">{label}</span>
      {children}
    </label>
  )
}

export const frInputClass =
  "h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] text-[#0f172a] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"

export const frSelectClass =
  "h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] text-[#0f172a] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"

export type FrWizardStep = {
  id: string
  short: string
  label: string
}

export function FrWizardShell({
  open,
  onOpenChange,
  title,
  steps,
  stepId,
  onStepChange,
  children,
  onBack,
  onNext,
  onSubmit,
  submitLabel = "Create",
  nextDisabled,
  submitDisabled,
  errors = [],
  canJumpTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  steps: FrWizardStep[]
  stepId: string
  onStepChange: (id: string) => void
  children: ReactNode
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  submitLabel?: string
  nextDisabled?: boolean
  submitDisabled?: boolean
  errors?: string[]
  /** If provided, only allow jumping to steps where this returns true (plus any earlier steps) */
  canJumpTo?: (id: string) => boolean
}) {
  const stepIdx = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId),
  )
  const current = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1
  const isFirst = stepIdx <= 0

  const goTo = (id: string) => {
    const target = steps.findIndex((s) => s.id === id)
    if (target < 0) return
    if (target <= stepIdx) {
      onStepChange(id)
      return
    }
    if (canJumpTo && !canJumpTo(id)) return
    onStepChange(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SIZE_CLASS["3xl"],
          "flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-[12px] border border-[#e2e8f0] p-0 shadow-lg",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-[#e2e8f0] px-5 pb-3 pt-5 text-left sm:px-6">
          <DialogTitle className="text-base font-semibold text-[#0f172a] sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-xs text-[#64748b]">
            Step {stepIdx + 1} of {steps.length}
            {current ? ` · ${current.label}` : ""}
            {" · "}
            Fields are pre-filled so you can click through
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[min(70vh,640px)] flex-1">
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-[#e2e8f0] bg-[#f8fafc] p-3 sm:block">
            <ol className="space-y-0.5">
              {steps.map((s, i) => {
                const active = s.id === stepId
                const done = i < stepIdx
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px]",
                        active && "bg-[#eff6ff] font-medium text-[#2563eb]",
                        done && !active && "text-[#16a34a]",
                        !active && !done && "text-[#64748b] hover:bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                          active && "border-[#2563eb] bg-[#2563eb] text-white",
                          done && !active && "border-[#bbf7d0] bg-[#dcfce7] text-[#16a34a]",
                          !active && !done && "border-[#e2e8f0] text-[#94a3b8]",
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : s.short}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>

          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="flex gap-1 overflow-x-auto pb-1 sm:hidden">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={cn(
                    "h-7 shrink-0 rounded-full border px-2.5 text-[10px]",
                    s.id === stepId
                      ? "border-[#2563eb] bg-[#eff6ff] font-medium text-[#2563eb]"
                      : i < stepIdx
                        ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]"
                        : "border-[#e2e8f0] text-[#64748b]",
                  )}
                >
                  {s.short}. {s.label}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-[#0f172a]">{current?.label}</h3>

            {errors.length > 0 ? (
              <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#7f1d1d]">
                <p className="font-semibold text-[#0f172a]">
                  {errors.length} requirement{errors.length === 1 ? "" : "s"} remain on this step:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  {errors.map((msg, i) => (
                    <li key={`${msg}-${i}`}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {children}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#e2e8f0] bg-[#fafafa] px-5 py-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4 gap-1"
              disabled={isFirst}
              onClick={onBack}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            {isLast ? (
              <Button
                type="button"
                variant="gradient-info"
                className={frPrimaryBtnSm}
                disabled={submitDisabled}
                onClick={onSubmit}
              >
                {submitLabel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient-info"
                className={frPrimaryBtnSm}
                disabled={nextDisabled}
                onClick={onNext}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type ViewAllRow = {
  id: string
  title: string
  subtitle?: string
  meta?: string
  badge?: string
  badgeClass?: string
}

export function FrViewAllDialog({
  open,
  onOpenChange,
  title,
  description,
  rows,
  size = "lg",
  emptyText = "No items to show.",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  rows: ViewAllRow[]
  size?: FrDialogSize
  emptyText?: string
}) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.subtitle?.toLowerCase().includes(term) ||
        r.meta?.toLowerCase().includes(term),
    )
  }, [rows, q])

  return (
    <FrDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description ?? `${rows.length} items`}
      size={size}
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-[#94a3b8]">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-[#f1f5f9]">
          {filtered.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#0f172a]">{row.title}</p>
                {row.subtitle ? (
                  <p className="mt-0.5 text-[11px] text-[#64748b]">{row.subtitle}</p>
                ) : null}
                {row.meta ? (
                  <p className="mt-1 text-[10px] text-[#94a3b8]">{row.meta}</p>
                ) : null}
              </div>
              {row.badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
                    row.badgeClass ?? "bg-[#f1f5f9] text-[#64748b]",
                  )}
                >
                  {row.badge}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </FrDialogShell>
  )
}
