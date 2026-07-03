"use client"

import { useId } from "react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

export function Sparkline({ data, color = "#3B82F6" }: { data: number[]; color?: string }) {
  const gradientId = `spark-${useId().replace(/[:]/g, "")}`

  if (data.length < 2) {
    return <div className="h-10 flex items-center text-[10px] text-gray-300">No trend data</div>
  }

  const chartData = data.map((v, i) => ({ i, v }))

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
