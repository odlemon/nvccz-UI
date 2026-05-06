"use client"

import { useEffect, useState } from "react"
import { scorecardApiService, type ContractScorecard, type ScorecardGeneratePayload } from "@/lib/api/scorecard-service"
import { performanceBscApiService } from "@/lib/api/performance-bsc-api"
import { companyProfileApi, type CompanyAddress } from "@/lib/api/company-profile-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CiFileOn } from "react-icons/ci"
import { RefreshCw, Plus, Sparkles } from "lucide-react"
import ContractScorecardPDF from "./contract-scorecard-pdf-document"
import {
  BalancedScorecardView,
  HeatMapLegend,
  computeHeat,
  colorForPillar,
  type BSCViewColumn,
  type BSCViewRow,
  type BSCViewPerspective,
} from "./balanced-scorecard-view"

interface ContractScorecardPageProps {
  type: "CEO" | "BOARD"
}

export function ContractScorecardPage({ type }: ContractScorecardPageProps) {
  const [data, setData] = useState<ContractScorecard | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [creatingContract, setCreatingContract] = useState(false)
  const [periodLabel, setPeriodLabel] = useState("2026")
  const [isClient, setIsClient] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  const [activeAddress, setActiveAddress] = useState<CompanyAddress | null>(null)

  useEffect(() => {
    setIsClient(true)
    import("@react-pdf/renderer").then((pdfModule) => {
      setPDFDownloadLink(() => pdfModule.PDFDownloadLink)
    })
    companyProfileApi.getActiveAddress().then((a) => setActiveAddress(a)).catch(() => {})
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = type === "CEO"
        ? await scorecardApiService.getCeoScorecard({ periodLabel })
        : await scorecardApiService.getBoardScorecard({ periodLabel })
      setData(response.data)
    } catch (error: any) {
      toast.error(`Failed to load ${type} scorecard`, { description: error.message })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [type, periodLabel])

  const resolvePeriodYear = () => {
    const parsed = Number.parseInt(periodLabel, 10)
    if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) return parsed
    return new Date().getFullYear()
  }

  const handleCreateContract = async () => {
    setCreatingContract(true)
    try {
      const payload = {
        periodYear: resolvePeriodYear(),
        periodLabel: periodLabel || String(resolvePeriodYear()),
      }

      if (type === "CEO") {
        await performanceBscApiService.createCeoContract(payload)
      } else {
        await performanceBscApiService.createBoardContract(payload)
      }

      toast.success(`${type} contract created successfully`)
      await loadData()
    } catch (error: any) {
      const isDuplicate = error?.status === 409 || error?.response?.code === "PERFORMANCE_CONTRACT_DUPLICATE"
      if (isDuplicate) {
        toast.info(`${type} contract already exists for ${resolvePeriodYear()}. Loading existing scorecard...`)
        await loadData()
      } else {
        toast.error(`Failed to create ${type} contract`, {
          description: error?.message || "Please review inputs and try again",
        })
      }
    } finally {
      setCreatingContract(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const payload: ScorecardGeneratePayload = { periodLabel, sectionBlendMode: "redistribute" }
      const response = type === "CEO"
        ? await scorecardApiService.generateCeoScorecard(payload)
        : await scorecardApiService.generateBoardScorecard(payload)
      setData(response.data)
      toast.success(`${type} scorecard generated`)
    } catch (error: any) {
      toast.error(`Failed to generate ${type} scorecard`, { description: error.message })
    } finally {
      setGenerating(false)
    }
  }

  const scoreValue = data?.scores?.finalScore ?? "N/A"
  const performanceLabel = data?.scores?.performanceLabel
  const warnings = data?.warnings ?? []
  const sectionEntries = Object.entries(data?.sections ?? {})
  const agreedRatings = data?.agreedRatingsSummary ?? data?.document?.agreedRatingsSummary ?? []
  const subjectTitle = type === "CEO" ? data?.ceo?.title : data?.board?.chairpersonTitle
  const subjectName = type === "CEO" ? data?.ceo?.name : data?.board?.chairpersonName

  // ── Format helpers + BSC rows ───────────────────────────────────────────────
  const toNumber = (v: unknown) => {
    const n = typeof v === "string" ? Number.parseFloat(v) : Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const fmtNumber = (v: unknown, fb = "—") => {
    if (v === null || v === undefined || v === "") return fb
    const n = typeof v === "string" ? Number.parseFloat(v) : Number(v)
    if (!Number.isFinite(n)) return fb
    if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  const fmtWeight = (v: unknown) => {
    if (v === null || v === undefined || v === "") return "—"
    const n = typeof v === "string" ? Number.parseFloat(v) : Number(v)
    if (!Number.isFinite(n)) return "—"
    const pct = n > 1 ? n : n * 100
    return `${pct.toFixed(0)}%`
  }

  const bscPerspectives: BSCViewPerspective[] = []
  const bscRows: BSCViewRow[] = []

  for (const [key, section] of sectionEntries as Array<[string, any]>) {
    const sectionLabel = section?.label || `Section ${key}`
    const perspectiveId = `sec-${key}`
    bscPerspectives.push({
      id: perspectiveId,
      name: sectionLabel,
      color: colorForPillar(sectionLabel),
      weight: fmtWeight(section?.weight),
    })

    const indicators: any[] = Array.isArray(section?.indicators) ? section.indicators : []

    if (indicators.length === 0) {
      const heat = computeHeat({
        status: section?.performanceLabel,
        progress: toNumber(section?.sectionScore),
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: sectionLabel,
          measure: "—",
          target: "—",
          actual: "—",
          weight: fmtWeight(section?.weight),
          rating: fmtNumber(section?.sectionScore),
          weighted: fmtNumber(section?.sectionScore),
        },
      })
      continue
    }

    for (const ind of indicators) {
      const target = ind.targetValue
      const actual = ind.computedActual
      const heat = computeHeat({
        progress: ind.progressPct !== null && ind.progressPct !== undefined ? toNumber(ind.progressPct) : null,
        target: target !== null && target !== undefined ? toNumber(target) : null,
        actual: actual !== null && actual !== undefined ? toNumber(actual) : null,
        isReverseKpi: !!ind.isReverseKpi,
      })
      bscRows.push({
        perspectiveId,
        heat,
        values: {
          objective: ind.indicatorName || "—",
          measure: ind.formulaType || ind.unit || "—",
          target: fmtNumber(target),
          actual: fmtNumber(actual),
          weight: fmtWeight(ind.effectiveWeight ?? ind.weight),
          rating: fmtNumber(ind.rawRating),
          weighted: fmtNumber(ind.weightedScore),
        },
      })
    }
  }

  const bscColumns: BSCViewColumn[] = [
    { key: "objective", label: "Strategic Objective / Indicator", bold: true, width: "32%" },
    { key: "measure", label: "Measure", width: "14%" },
    { key: "target", label: "Target", align: "right", width: "9%" },
    { key: "actual", label: "Actual", align: "right", heat: true, width: "9%" },
    { key: "weight", label: "Weight", align: "right", width: "8%" },
    { key: "rating", label: "Rating", align: "right", width: "8%" },
    { key: "weighted", label: "Weighted", align: "right", heat: true, width: "10%" },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">{type} Contract Scorecard</h1>
          <p className="text-gray-600">Contract setup + contract-based executive performance scorecard</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodLabel} onValueChange={setPeriodLabel}>
            <SelectTrigger className="w-[110px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            onClick={() => void handleCreateContract()}
            disabled={creatingContract || loading}
          >
            <Plus className="w-3.5 h-3.5" />
            {creatingContract ? "Creating..." : `Create ${type}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Generate"}
          </Button>
          {isClient && data && PDFDownloadLink && (
            <PDFDownloadLink
              document={<ContractScorecardPDF data={data} type={type} activeAddress={activeAddress} />}
              fileName={`${type.toLowerCase()}-scorecard-${data.contract?.periodLabel || periodLabel}-${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ loading: pdfLoading }: any) => (
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  disabled={pdfLoading}
                >
                  <CiFileOn className={`w-3.5 h-3.5 ${pdfLoading ? "animate-spin" : ""}`} />
                  {pdfLoading ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-6">Loading {type} scorecard...</CardContent></Card>
      ) : !data ? (
        <Card><CardContent className="p-6">No {type} scorecard found for this period.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl gradient-primary text-white">
              <CardContent className="pt-6">
                <p className="text-sm text-white/80">Final Score</p>
                <p className="text-4xl">{String(scoreValue)}</p>
                <p className="text-xs text-white/80 mt-2">{data.contract?.title || `${type} Contract`}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-2xl">{data.contract?.periodLabel || periodLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Contract Party</p>
                <p className="text-lg font-medium">{subjectName || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{subjectTitle || "N/A"}</p>
              </CardContent>
            </Card>
          </div>

          {warnings.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader><CardTitle className="text-amber-900">Warnings</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {warnings.map((warning: string, idx: number) => <p key={idx} className="text-sm text-amber-800">{warning}</p>)}
              </CardContent>
            </Card>
          )}

          {/* Balanced Scorecard — perspectives as colored bands, indicators as rows,
              with heat-mapped Actual / Weighted cells. */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Balanced Scorecard</CardTitle>
                {performanceLabel && (
                  <Badge variant="outline" className="rounded-full">
                    Overall: {performanceLabel}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {bscRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No section payload available yet. Generate the scorecard to populate indicators.
                </p>
              ) : (
                <>
                  <BalancedScorecardView
                    perspectives={bscPerspectives}
                    rows={bscRows}
                    columns={bscColumns}
                  />
                  <HeatMapLegend className="pt-1" />
                </>
              )}
            </CardContent>
          </Card>

          {agreedRatings.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Agreed Ratings Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {agreedRatings.map(
                  (
                    item: { section: string; heading: string; sectionScore: number; label: string },
                    idx: number,
                  ) => (
                    <div
                      key={`${item.section}-${idx}`}
                      className="rounded-lg border p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{item.heading}</p>
                        <p className="text-xs text-muted-foreground">Section {item.section}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.sectionScore}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
