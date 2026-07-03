"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart as PieChartIcon } from "lucide-react"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
} from "recharts"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1"]

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 600 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

export function HoldingsAllocationChart() {
  const { holdings, holdingsLoading } = useAppSelector((s) => s.investments)

  const data = useMemo(() => {
    return holdings
      .map((h, idx) => ({
        name: h.security?.symbol ?? h.securityId.slice(0, 8),
        value: Math.max(0, effectiveHoldingValue(h)),
        color: COLORS[idx % COLORS.length],
      }))
      .filter((d) => d.value > 0)
  }, [holdings])

  return (
    <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-800">Holdings Allocation</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {holdingsLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-28 h-28 rounded-full" />
            <div className="space-y-2 w-full">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full rounded" />)}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center">
            <PieChartIcon className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-xs text-muted-foreground">No holdings to allocate yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(val: any, name: any) => [Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 }), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                  <span className="truncate font-mono">{item.name}</span>
                  <span className="ml-auto font-semibold text-gray-900">
                    {item.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
