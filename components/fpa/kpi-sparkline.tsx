"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

export type KpiSparklineProps = {
  values: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
  showDots?: boolean
  dashed?: boolean
  maxPoints?: number
  /** line = polyline + optional dots; area = gradient fill under line */
  variant?: "line" | "area"
  className?: string
}

export function KpiSparkline({
  values,
  color = "#2563eb",
  width = 64,
  height = 28,
  strokeWidth = 1.25,
  showDots = true,
  dashed,
  maxPoints = 6,
  variant = "line",
  className,
}: KpiSparklineProps) {
  const gid = useId().replace(/:/g, "")
  const fillId = `kpiSparkFill-${gid}`

  const pts =
    maxPoints != null && maxPoints > 0 && values.length > maxPoints
      ? values.slice(-maxPoints)
      : values
  if (pts.length === 0) return null

  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = Math.max(max - min, 1e-6)

  if (variant === "area") {
    const w = width
    const h = height
    const coords = pts.map((v, i) => {
      const x = (i / Math.max(pts.length - 1, 1)) * w
      const y = h - ((v - min) / span) * (h - 6) - 3
      return { x, y }
    })
    const line = coords.map((c) => `${c.x},${c.y}`).join(" ")
    const area =
      coords.length > 1
        ? `M ${coords[0].x},${h} L ${coords.map((c) => `${c.x},${c.y}`).join(" L ")} L ${coords[coords.length - 1].x},${h} Z`
        : ""

    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={cn("w-full shrink-0", className ?? "h-[24px]")}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {area ? <path d={area} fill={`url(#${fillId})`} /> : null}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
      </svg>
    )
  }

  const w = width
  const h = height
  const padX = 4
  const padY = 4
  const coords = pts.map((v, i) => {
    const x = padX + (i / Math.max(pts.length - 1, 1)) * (w - padX * 2)
    const y = h - padY - ((v - min) / span) * (h - padY * 2)
    return { x, y }
  })
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ")

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dashed ? "4 3" : undefined}
        points={line}
      />
      {showDots
        ? coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={1.25}
              fill="#ffffff"
              stroke={color}
              strokeWidth={0.75}
            />
          ))
        : null}
    </svg>
  )
}
