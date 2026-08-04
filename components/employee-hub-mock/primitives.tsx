"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { eh } from "@/lib/employee-hub-mock/tokens"

export function EhCard({
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
        onClick && "cursor-pointer hover:border-[#0EA5B7]/40 transition-colors",
        className
      )}
      style={{ borderColor: eh.border, borderRadius: eh.radius }}
    >
      {children}
    </div>
  )
}

export function EhButton({
  children,
  className,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode
  className?: string
  variant?: "primary" | "outline" | "ghost" | "cyan"
  type?: "button" | "submit"
  onClick?: () => void
  disabled?: boolean
}) {
  const variants = {
    primary: "bg-[#0F172A] text-white hover:bg-[#1E293B]",
    outline: "bg-white text-[#0F172A] border border-[#E8E6E1] hover:bg-[#F7F6F3]",
    ghost: "bg-transparent text-[#334155] hover:bg-[#F1F5F9]",
    cyan: "bg-[#0EA5B7] text-white hover:bg-[#0D94A5]",
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  )
}

export function EhPill({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode
  className?: string
  tone?: "neutral" | "cyan" | "azure" | "success" | "warning"
}) {
  const tones = {
    neutral: "bg-[#F1F5F9] text-[#334155]",
    cyan: "bg-[#E6F7F9] text-[#0E7490]",
    azure: "bg-[#EFF6FF] text-[#1D4ED8]",
    success: "bg-[#ECFDF5] text-[#047857]",
    warning: "bg-[#FFFBEB] text-[#B45309]",
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  )
}

export function EhSectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">{title}</h2>
      {action}
    </div>
  )
}

export function EhAvatar({
  initials,
  size = "md",
  className,
}: {
  initials: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" }
  return (
    <div
      className={cn(
        "rounded-full bg-[#0EA5B7] text-white font-bold inline-flex items-center justify-center shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}

export function EhEmptyStub({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
      <p className="text-lg font-semibold text-[#0F172A]">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-[#64748B] max-w-md">{subtitle}</p>}
    </div>
  )
}
