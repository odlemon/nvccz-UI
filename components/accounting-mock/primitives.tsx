"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ac } from "@/lib/accounting-mock/tokens"

export function AcCard({
  className,
  children,
  onClick,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border shadow-sm",
        onClick && "cursor-pointer hover:border-[#2563EB]/40 transition-colors",
        className
      )}
      style={{ borderColor: ac.border, borderRadius: ac.radius }}
    >
      {children}
    </div>
  )
}

export function AcButton({
  children,
  className,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode
  className?: string
  variant?: "primary" | "outline" | "ghost" | "cobaltOutline"
  type?: "button" | "submit"
  onClick?: () => void
  disabled?: boolean
}) {
  const variants = {
    primary: "bg-[#0B1739] text-white hover:bg-[#14244F]",
    outline: "bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F5F8FC]",
    ghost: "bg-transparent text-[#6B7280] hover:bg-[#F5F8FC]",
    cobaltOutline: "bg-white text-[#2563EB] border border-[#93B4F7] hover:bg-[#EFF6FF]",
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-colors disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  )
}

/** Outlined status badge, matching the PDF postings table. No green tones. */
export function AcStatusPill({
  label,
  tone = "posted",
}: {
  label: string
  tone?: "posted" | "pending" | "exception" | "neutral"
}) {
  const tones = {
    posted: "border-[#93B4F7] bg-[#F5F9FF] text-[#2563EB]",
    pending: "border-[#F5C46B] bg-[#FFFBF2] text-[#B45309]",
    exception: "border-[#F0A8A8] bg-[#FEF6F6] text-[#DC2626]",
    neutral: "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-[2px] rounded-[4px] border text-[10px] font-medium whitespace-nowrap",
        tones[tone]
      )}
    >
      {label}
    </span>
  )
}

/** Card title band with the divider used by every table widget in the PDF. */
export function AcCardHeader({
  title,
  action,
  className,
}: {
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EEF1F5]", className)}>
      <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">{title}</h2>
      {action}
    </div>
  )
}

export function AcSectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight">{title}</h2>
      {action}
    </div>
  )
}

/** Page title row used by every workspace screen in the PDF. */
export function AcScreenHeader({
  title,
  meta,
  subtitle,
  actions,
}: {
  title: string
  meta?: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">
          {title}
          {meta && <span className="ml-2 font-normal text-[#6B7280]">{meta}</span>}
        </h1>
        {subtitle && <p className="text-[11px] text-[#6B7280] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function AcTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div className="flex items-center gap-6 border-b border-[#E5E7EB]">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "-mb-px pb-2.5 text-[12px] font-medium border-b-2 transition-colors",
            t === active
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#6B7280] hover:text-[#0B1739]"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/** Labelled select used in the PDF filter bars. */
export function AcField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] text-[#6B7280] mb-1">{label}</p>
      {children}
    </div>
  )
}

export function AcSelectInput({
  value,
  options,
  onChange,
  icon,
  className,
}: {
  value: string
  options: string[]
  onChange?: (v: string) => void
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">{icon}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full h-8 pr-7 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] outline-none focus:border-[#2563EB] cursor-pointer",
          icon ? "pl-8" : "pl-2.5"
        )}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export function AcSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-3 pr-8 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB]"
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </div>
  )
}

/** Label / value row used in the PDF right-hand detail drawers. */
export function AcKeyValue({
  label,
  value,
  sub,
  strong,
  grid,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  strong?: boolean
  /** Two-column form used by the PDF detail drawers: value left-aligned in its own column. */
  grid?: boolean
}) {
  if (grid) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 py-[7px]">
        <span className={cn("text-[11px]", strong ? "font-bold text-[#0B1739]" : "text-[#6B7280]")}>{label}</span>
        <span className="min-w-0">
          <span className={cn("block text-[11px] text-[#0B1739]", strong ? "font-bold" : "font-medium")}>{value}</span>
          {sub && <span className="block text-[10px] text-[#6B7280]">{sub}</span>}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] text-[#6B7280] shrink-0">{label}</span>
      <span className="text-right min-w-0">
        <span className={cn("block text-[11px] text-[#0B1739]", strong ? "font-bold" : "font-semibold")}>{value}</span>
        {sub && <span className="block text-[10px] text-[#6B7280]">{sub}</span>}
      </span>
    </div>
  )
}

export function AcDrawerSectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold text-[#0B1739] mb-1.5">{children}</p>
}

/** ▲ / ▼ delta. Positive uses cobalt (never green), negative uses exception red. */
export function AcDelta({ value, down = false }: { value: string; down?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", down ? "text-[#DC2626]" : "text-[#2563EB]")}>
      <span className="text-[8px] leading-none">{down ? "▼" : "▲"}</span>
      {value}
    </span>
  )
}
