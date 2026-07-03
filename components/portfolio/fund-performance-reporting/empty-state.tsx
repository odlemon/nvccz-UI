"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-gray-200 rounded-2xl bg-white">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-amber-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5 rounded-full gradient-primary text-white h-9" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
