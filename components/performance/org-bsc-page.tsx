"use client"

import { useEffect, useState } from "react"
import { scorecardApiService, type OrgBscScorecard } from "@/lib/api/scorecard-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CiFileOn } from "react-icons/ci"
import OrgBscPDF from "./org-bsc-pdf-document"

export function OrgBscPage() {
  const [data, setData] = useState<OrgBscScorecard | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      setPDFDownloadLink(() => pdfModule.PDFDownloadLink)
    })
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await scorecardApiService.getOrgBscScorecard()
      setData(response.data)
    } catch (error: any) {
      toast.error("Failed to load organisational BSC", { description: error.message })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const pillars = data?.pillars ?? []
  const overallScore = data?.orgBscScore ?? data?.overallScore ?? 0
  const warnings = data?.warnings ?? []
  const alerts = data?.alerts ?? []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Organisational BSC Dashboard</h1>
          <p className="text-gray-600">Live executive Balanced Scorecard view</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>Refresh</Button>
          {isClient && data && PDFDownloadLink && (
            <PDFDownloadLink
              document={<OrgBscPDF data={data} />}
              fileName={`org-bsc-${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading: pdfLoading }: any) => (
                <Button variant="outline" disabled={pdfLoading}>
                  <CiFileOn className={`w-4 h-4 mr-2 ${pdfLoading ? "animate-spin" : ""}`} />
                  {pdfLoading ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-6">Loading organisational BSC...</CardContent></Card>
      ) : !data ? (
        <Card><CardContent className="p-6">No BSC data available.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl gradient-primary text-white">
              <CardContent className="pt-6">
                <p className="text-sm text-white/80">Overall BSC Score</p>
                <p className="text-4xl">{Number(overallScore).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pillars</p>
                <p className="text-3xl">{pillars.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-3xl">{alerts.length}</p>
              </CardContent>
            </Card>
          </div>

          {data?.ceoVision && (
            <Card>
              <CardHeader><CardTitle>Strategic Alignment</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><span className="font-medium">Vision:</span> {data.ceoVision.statement || "N/A"}</p>
                <p className="text-sm"><span className="font-medium">Review Period:</span> {data.reviewPeriod || "N/A"}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> {data.orgBscStatus || "N/A"}</p>
                {data.ceoVision.strategyDocumentUrl && (
                  <a className="text-sm text-blue-600 underline" href={data.ceoVision.strategyDocumentUrl} target="_blank" rel="noreferrer">
                    Open Strategy Document
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {warnings.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader><CardTitle className="text-amber-900">Warnings</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((warning: string, index: number) => (
                  <p key={index} className="text-sm text-amber-800">{warning}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {alerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Active Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {alerts.map((alert: { goalId?: string; goalName?: string; type: string; message: string; pillar?: string }, index: number) => (
                  <div key={`${alert.goalId || "alert"}-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{alert.goalName || "Data alert"}</p>
                      <Badge variant="outline">{alert.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.pillar || "N/A"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Pillar Performance</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {pillars.map((pillar: { pillarCode: string; pillarLabel: string; pillarStatus: string; pillarWeight: number; pillarScore: number; goals?: unknown[] }, idx: number) => (
                <div key={pillar.pillarCode || idx} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{pillar.pillarLabel}</p>
                    <Badge variant="outline">{pillar.pillarStatus || "N/A"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Weight: {pillar.pillarWeight ?? "N/A"}%</p>
                  <p className="text-sm text-muted-foreground">Score: {pillar.pillarScore ?? "N/A"}</p>
                  <p className="text-sm text-muted-foreground">Goals: {pillar.goals?.length ?? 0}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
