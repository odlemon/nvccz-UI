"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Download, FileBarChart, Link2, Mail } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchLpReports, downloadLpReport } from "@/lib/store/slices/lpPortalSlice"
import type { LpReport } from "@/lib/api/lp-portal-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FundMetricsGrid } from "./fund-metrics-grid"

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
      return "default"
    case "PENDING":
      return "secondary"
    case "FAILED":
      return "destructive"
    default:
      return "outline"
  }
}

function ReportCard({ report }: { report: LpReport }) {
  const dispatch = useAppDispatch()

  const handleDownload = async () => {
    try {
      await dispatch(
        downloadLpReport({ jobId: report.jobId, filename: `${report.templateName}-${report.periodEnd}.pdf` })
      ).unwrap()
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Report not available")
    }
  }

  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <FileBarChart className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">{report.templateName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {report.fundName} · {report.periodStart} – {report.periodEnd}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline">{report.reportLevel}</Badge>
            <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
            <Badge variant="secondary" className="gap-1">
              {report.transportMethod === "SECURE_LINK" ? (
                <Link2 className="w-3 h-3" />
              ) : (
                <Mail className="w-3 h-3" />
              )}
              {report.transportMethod?.replaceAll("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.metrics && (
          <FundMetricsGrid
            metrics={{
              commitment: report.metrics.totalCommitment,
              paidIn: report.metrics.totalPaidIn,
              distributions: report.metrics.totalDistributions,
              unfundedCommitment: report.metrics.unfundedCommitment,
              nav: report.metrics.nav,
              dpi: report.metrics.dpi,
              tvpi: report.metrics.tvpi,
              rvpi: report.metrics.rvpi,
              netIrr: report.metrics.netIrr,
              currencyCode: report.metrics.currencyCode,
            }}
          />
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {report.deliveredAt ? `Delivered ${new Date(report.deliveredAt).toLocaleDateString()}` : "Not yet delivered"}
          </span>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function LpReports() {
  const dispatch = useAppDispatch()
  const { reports, reportsPagination, reportsLoading, reportsError } = useAppSelector((s) => s.lpPortal)
  const [fundId, setFundId] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchLpReports(undefined))
  }, [dispatch])

  const applyFilter = () => {
    setPage(1)
    dispatch(fetchLpReports(fundId || undefined))
  }

  // NOTE: lpPortalApi.getReports() only accepts a `fundId` param — there's no page
  // param on the endpoint, so all reports matching the filter come back in one shot.
  // We paginate over that array client-side using the page size the API reports back
  // in `reportsPagination.limit`; true server-side pagination isn't wired.
  const pageSize = reportsPagination?.limit || 10
  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize))
  const pagedReports = useMemo(
    () => reports.slice((page - 1) * pageSize, page * pageSize),
    [reports, page, pageSize]
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Performance Reports</h1>
        <p className="text-sm text-muted-foreground">Historical performance report deliveries for your funds.</p>
      </div>

      <Card className="border-gray-200 shadow-none">
        <CardContent className="py-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fund ID</label>
            <Input
              placeholder="Filter by fund ID"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-56"
            />
          </div>
          <Button onClick={applyFilter}>Apply Filter</Button>
        </CardContent>
      </Card>

      {reportsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : reportsError ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{reportsError}</CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-12 text-center space-y-2">
            <FileBarChart className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No performance reports have been delivered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {pagedReports.map((report) => <ReportCard key={report.jobId} report={report} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
