"use client"

import { CiGrid41 } from "react-icons/ci"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"

const SWITCHER_BG = "oklch(0.60 0.18 252)20"
const SWITCHER_BG_HOVER = "oklch(0.60 0.18 252)30"
const SWITCHER_ICON = "oklch(0.60 0.18 252)"

interface ModuleSwitcherButtonProps {
  /** Module config id, e.g. `investments-v2` */
  currentModule?: string
  /** Display label override (defaults to module name from config) */
  moduleName?: string
  showLabel?: boolean
  className?: string
  onClick?: () => void
}

/** Uniform module switcher — matches SharedTopbar / Investments module header. */
export function ModuleSwitcherButton({
  currentModule,
  moduleName,
  showLabel = true,
  className,
  onClick,
}: ModuleSwitcherButtonProps) {
  const label =
    moduleName ??
    (currentModule ? getModuleById(currentModule)?.name : undefined) ??
    "Modules"
  const hideLabel = currentModule === "homepage" || !showLabel

  return (
    <button
      type="button"
      data-arcus-modules
      onClick={onClick}
      className={cn(
        "group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-2 py-2 transition-colors",
        className,
      )}
      style={{ backgroundColor: SWITCHER_BG }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = SWITCHER_BG_HOVER
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = SWITCHER_BG
      }}
      aria-label="Switch module"
      title="Switch module"
    >
      <span className="flex size-8 items-center justify-center rounded-full">
        <CiGrid41 size={20} style={{ color: SWITCHER_ICON }} />
      </span>
      {!hideLabel ? (
        <span className="hidden whitespace-nowrap text-sm capitalize text-muted-foreground group-hover:text-foreground sm:inline">
          {label.replace(/-/g, " ")}
        </span>
      ) : null}
    </button>
  )
}
