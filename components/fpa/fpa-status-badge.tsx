import { cn } from "@/lib/utils"

const tones = {
  high: "bg-[#fef2f2] text-[#dc2626]",
  medium: "bg-[#fff7ed] text-[#ea580c]",
  low: "bg-[#f0fdf4] text-[#16a34a]",
  info: "bg-[#eff6ff] text-[#2563eb]",
  success: "bg-[#f0fdf4] text-[#16a34a]",
  danger: "bg-[#fef2f2] text-[#dc2626]",
  warning: "bg-[#fffbeb] text-[#d97706]",
  neutral: "bg-[#f1f5f9] text-[#64748b]",
} as const

export type FpaBadgeTone = keyof typeof tones

export function FpaStatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode
  tone?: FpaBadgeTone
  className?: string
}) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  )
}
