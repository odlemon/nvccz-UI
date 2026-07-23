"use client"

import { cn } from "@/lib/utils"
import { pm } from "@/lib/performance-mock/tokens"
import { useMemo, type ReactNode } from "react"

export function PmCard({
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
        "bg-white border border-[#E5E7EB] shadow-sm",
        onClick && "cursor-pointer hover:border-[#DDD6FE] transition-colors",
        className
      )}
      style={{ borderRadius: pm.radius }}
    >
      {children}
    </div>
  )
}

export function PmMetricCard({
  label,
  value,
  trend,
  trendPositive,
  icon,
  iconBg,
}: {
  label: string
  value: string
  trend?: string
  trendPositive?: boolean
  icon?: ReactNode
  iconBg?: string
}) {
  return (
    <PmCard className="p-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#6B7280] truncate">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-[#111827] tracking-tight truncate">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-0.5 text-[11px] font-medium",
                trendPositive === false ? "text-[#EF4444]" : trendPositive ? "text-[#10B981]" : "text-[#6B7280]"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg || pm.primarySoft, color: pm.primary }}
          >
            {icon}
          </div>
        )}
      </div>
    </PmCard>
  )
}

export function PmStatusPill({
  label,
  tone = "neutral",
}: {
  label: string
  tone?: "success" | "warning" | "danger" | "info" | "purple" | "neutral"
}) {
  const tones: Record<string, string> = {
    success: "bg-[#D1FAE5] text-[#065F46]",
    warning: "bg-[#FEF3C7] text-[#92400E]",
    danger: "bg-[#FEE2E2] text-[#991B1B]",
    info: "bg-[#DBEAFE] text-[#1E40AF]",
    purple: "bg-[#F5F3FF] text-[#6D28D9]",
    neutral: "bg-[#F3F4F6] text-[#4B5563]",
  }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", tones[tone])}>
      {label}
    </span>
  )
}

export function PmPageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: string[]
}) {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <p className="text-[11px] text-[#6B7280]">
          {breadcrumbs.map((b, i) => (
            <span key={b}>
              {i > 0 && <span className="mx-1.5 text-[#D1D5DB]">›</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-[#111827] font-medium" : ""}>{b}</span>
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-[#6B7280] max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

export function PmButton({
  children,
  variant = "primary",
  className,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode
  variant?: "primary" | "outline" | "ghost"
  className?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
}) {
  const variants = {
    primary: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] border border-transparent",
    outline: "bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F9FAFB]",
    ghost: "bg-transparent text-[#7C3AED] border border-transparent hover:bg-[#F5F3FF]",
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  )
}

export function PmSelectChip({
  icon,
  label,
  onClick,
}: {
  icon?: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#374151] hover:bg-[#F9FAFB]"
    >
      {icon}
      <span>{label}</span>
      <svg className="h-3.5 w-3.5 text-[#9CA3AF]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </button>
  )
}

export function PmFilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
  className,
}: {
  icon?: ReactNode
  label?: string
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1.5 h-8 pl-2.5 pr-6 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#374151] hover:bg-[#F9FAFB]",
        className
      )}
    >
      {icon}
      {label && <span className="text-[#6B7280]">{label}:</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent outline-none text-[#111827] font-medium pr-1 cursor-pointer max-w-[160px] truncate"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg className="absolute right-2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
  )
}

export function PmAvatar({
  initials,
  name,
  role,
  size = "md",
  color = "#7C3AED",
  src,
}: {
  initials: string
  name?: string
  role?: string
  size?: "sm" | "md" | "lg"
  color?: string
  /** CDN / remote photo URL */
  src?: string
}) {
  const sizes = { sm: "h-6 w-6 text-[9px]", md: "h-8 w-8 text-[10px]", lg: "h-10 w-10 text-xs" }
  const px = { sm: 24, md: 32, lg: 40 }
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {src ? (
        <img
          src={src}
          alt={name || initials}
          width={px[size]}
          height={px[size]}
          className={cn("rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm", sizes[size])}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizes[size])}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      {(name || role) && (
        <div className="min-w-0">
          {name && <p className="text-xs font-semibold text-[#111827] truncate">{name}</p>}
          {role && <p className="text-[11px] text-[#6B7280] truncate">{role}</p>}
        </div>
      )}
    </div>
  )
}

export function PmProgress({ value, className, color = "#7C3AED" }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-[#F3F4F6] overflow-hidden", className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
    </div>
  )
}

export function PmEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      {description && <p className="mt-1 text-xs text-[#6B7280]">{description}</p>}
    </div>
  )
}

export function PmToggle({
  checked,
  onChange,
  size = "md",
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  size?: "sm" | "md"
  disabled?: boolean
}) {
  const dims = size === "sm" ? { track: "h-4 w-7", knob: "h-3 w-3", translate: "translate-x-3" } : { track: "h-5 w-9", knob: "h-4 w-4", translate: "translate-x-4" }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        dims.track,
        checked ? "bg-[#7C3AED]" : "bg-[#E5E7EB]"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow transition-transform",
          dims.knob,
          checked ? dims.translate : "translate-x-0.5"
        )}
      />
    </button>
  )
}

export function PmModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = "max-w-lg",
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn("w-full bg-white shadow-xl max-h-[90vh] overflow-y-auto", widthClass)}
        style={{ borderRadius: pm.radius }}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2.5 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
            {description && <p className="mt-0.5 text-[11px] text-[#6B7280]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] shrink-0">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#E5E7EB]">{footer}</div>}
      </div>
    </div>
  )
}

export function PmPagination({
  page,
  pageCount,
  onChange,
  summary,
  pageSizeLabel = "10 / page",
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  summary: string
  pageSizeLabel?: string
}) {
  const pages = useMemo(() => {
    const arr: (number | "ellipsis")[] = []
    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) arr.push(i)
      else if (arr[arr.length - 1] !== "ellipsis") arr.push("ellipsis")
    }
    return arr
  }, [page, pageCount])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3">
      <p className="text-xs text-[#6B7280]">{summary}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className="px-1.5 text-xs text-[#9CA3AF]">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md text-xs font-medium",
                p === page ? "bg-[#7C3AED] text-white" : "text-[#374151] hover:bg-[#F3F4F6]"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40"
        >
          ›
        </button>
        <span className="ml-2 text-xs text-[#6B7280] hidden sm:inline">{pageSizeLabel}</span>
      </div>
    </div>
  )
}

export function PmTabPills({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-[#F3F4F6] p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
            active === t.id ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
