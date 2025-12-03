"use client"

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface PayrollChartPoint {
  month: string
  gross: number
  net: number
}

interface PayrollChartProps {
  data: PayrollChartPoint[]
}

export function PayrollChart({ data }: PayrollChartProps) {
  const config = {
    gross: { label: "Gross", color: "#60a5fa" },
    net: { label: "Net", color: "#34d399" },
  }

  return (
    <ChartContainer config={config} className="w-full h-80">
      <AreaChart data={data} margin={{ left: 16, right: 16, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 14, fill: '#111827' }} />
        <YAxis tickFormatter={(v) => `$${Number(v).toLocaleString()}`} tickLine={false} axisLine={false} width={88} tick={{ fontSize: 14, fill: '#111827' }} />
        <ChartTooltip content={<ChartTooltipContent className="text-sm" />} />
        <Area type="monotone" dataKey="gross" stroke="var(--color-gross)" strokeWidth={5} fill="var(--color-gross)" fillOpacity={0.2} dot={{ r: 4 }} />
        <Area type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={5} fill="var(--color-net)" fillOpacity={0.2} dot={{ r: 4 }} />
        <ChartLegend content={<ChartLegendContent className="text-sm md:text-base" />} />
      </AreaChart>
    </ChartContainer>
  )
}


