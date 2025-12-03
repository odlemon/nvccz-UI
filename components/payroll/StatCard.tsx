"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatCard({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl">{value}</div>
      </CardContent>
    </Card>
  )
}


