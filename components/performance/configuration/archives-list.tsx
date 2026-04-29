"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchArchives } from "@/lib/store/slices/performanceConfigSlice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Archive, FileText, Download, Calendar } from "lucide-react"
import { format } from "date-fns"

export function ArchivesList() {
  const dispatch = useAppDispatch()
  const { archives } = useAppSelector((s) => s.performanceConfig)

  useEffect(() => {
    dispatch(fetchArchives())
  }, [dispatch])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-600" />
          <CardTitle>Archived Strategies</CardTitle>
        </div>
        <CardDescription>
          Historical strategy cycles. Read-only — hidden from active dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {archives.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No archived strategies.
          </p>
        ) : (
          <div className="space-y-3">
            {archives.map((s) => (
              <div
                key={s.id}
                className="border rounded-lg p-4 bg-gray-50 opacity-90"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{s.title}</p>
                      <Badge className="bg-amber-100 text-amber-800">Archived</Badge>
                      <Badge variant="outline">Read-only</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(s.periodStart), "MMM d, yyyy")} —{" "}
                      {format(new Date(s.periodEnd), "MMM d, yyyy")}
                    </p>
                    {s.visionStatement && (
                      <p className="text-xs text-gray-600 italic mt-2 border-l-2 border-gray-300 pl-3">
                        "{s.visionStatement}"
                      </p>
                    )}
                  </div>
                  {s.strategyDocumentUrl && (
                    <a
                      href={s.strategyDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
