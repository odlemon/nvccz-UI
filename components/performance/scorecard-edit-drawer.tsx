"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  scorecardApiService,
  type QualitativeAttribute,
  type QualitativeEditPayload,
  type TrainingEntry,
  type Intervention,
} from "@/lib/api/scorecard-service"
import { cn } from "@/lib/utils"

export type ScorecardEditType = "EMPLOYEE" | "DEPARTMENT" | "CEO" | "BOARD"

interface ScorecardEditDrawerProps {
  open: boolean
  onClose: () => void
  type: ScorecardEditType
  subjectId?: string
  periodLabel: string
  onSaved?: () => void
}

const RATING_COLS = [
  "Unsatisfactory",
  "Needs Improvement",
  "Meets Expectations",
  "Exceeds Expectations",
  "Outstanding",
]

const DEFAULT_ATTRIBUTES: QualitativeAttribute[] = [
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Initiative",
  "Accountability", "Adaptability", "Technical Competence", "Customer Focus", "Ethics",
].map((attribute) => ({
  attribute,
  columns: RATING_COLS.map((label) => ({ label, selected: false })),
}))

function PersonalAttributesGrid({
  attributes,
  onChange,
}: {
  attributes: QualitativeAttribute[]
  onChange: (updated: QualitativeAttribute[]) => void
}) {
  const toggle = (attrIdx: number, colIdx: number) => {
    onChange(
      attributes.map((attr, ai) =>
        ai !== attrIdx
          ? attr
          : {
              ...attr,
              columns: attr.columns.map((col, ci) => ({ ...col, selected: ci === colIdx })),
            }
      )
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground w-[35%]">Attribute</th>
            {RATING_COLS.map((col) => (
              <th key={col} className="px-2 py-2 font-medium text-xs text-muted-foreground text-center whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributes.map((attr, ai) => (
            <tr key={ai} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-3 py-2 font-medium text-gray-800">{attr.attribute}</td>
              {attr.columns.map((col, ci) => (
                <td key={ci} className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(ai, ci)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center mx-auto transition-colors",
                      col.selected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 hover:border-blue-400 text-transparent"
                    )}
                  >
                    ●
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrainingEntryTable({
  title,
  rows,
  onChange,
}: {
  title: string
  rows: TrainingEntry[]
  onChange: (updated: TrainingEntry[]) => void
}) {
  const add = () =>
    onChange([...rows, { programme: "", provider: "", duration: "", status: "" }])

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  const update = (i: number, field: keyof TrainingEntry, val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button variant="ghost" size="sm" className="h-6 text-xs rounded-full px-2" onClick={add}>
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium">Programme</th>
                <th className="text-left px-2 py-1.5 font-medium">Provider</th>
                <th className="text-left px-2 py-1.5 font-medium">Duration</th>
                <th className="text-left px-2 py-1.5 font-medium">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {(["programme", "provider", "duration", "status"] as const).map((f) => (
                    <td key={f} className="px-1 py-1">
                      <Input
                        value={row[f]}
                        onChange={(e) => update(i, f, e.target.value)}
                        className="h-6 text-xs border-0 bg-transparent focus-visible:ring-0 px-1"
                        placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-400 hover:text-red-600"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InterventionsTable({
  rows,
  onChange,
}: {
  rows: Intervention[]
  onChange: (updated: Intervention[]) => void
}) {
  const add = () => onChange([...rows, { area: "", action: "", targetDate: "" }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Intervention, val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Development Interventions</p>
        <Button variant="ghost" size="sm" className="h-6 text-xs rounded-full px-2" onClick={add}>
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No interventions yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 py-1.5 font-medium">Area</th>
                <th className="text-left px-2 py-1.5 font-medium">Action</th>
                <th className="text-left px-2 py-1.5 font-medium">Target Date</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {(["area", "action", "targetDate"] as const).map((f) => (
                    <td key={f} className="px-1 py-1">
                      <Input
                        value={row[f]}
                        onChange={(e) => update(i, f, e.target.value)}
                        className="h-6 text-xs border-0 bg-transparent focus-visible:ring-0 px-1"
                        placeholder={f === "targetDate" ? "YYYY-MM-DD" : f.charAt(0).toUpperCase() + f.slice(1)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-400 hover:text-red-600"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function ScorecardEditDrawer({
  open,
  onClose,
  type,
  subjectId,
  periodLabel,
  onSaved,
}: ScorecardEditDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editReason, setEditReason] = useState("")
  const [attributes, setAttributes] = useState<QualitativeAttribute[]>(DEFAULT_ATTRIBUTES)
  const [completedTraining, setCompletedTraining] = useState<TrainingEntry[]>([])
  const [plannedTraining, setPlannedTraining] = useState<TrainingEntry[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setEditReason("")

    const fetch = async () => {
      try {
        let res: any
        if (type === "EMPLOYEE" && subjectId) {
          res = await scorecardApiService.getPersistedEmployeeScorecard(subjectId, { periodLabel })
        } else if (type === "DEPARTMENT" && subjectId) {
          res = await scorecardApiService.getPersistedDepartmentScorecard(subjectId, { periodLabel })
        } else if (type === "CEO") {
          res = await scorecardApiService.getPersistedCeoScorecard({ periodLabel })
        } else {
          res = await scorecardApiService.getPersistedBoardScorecard({ periodLabel })
        }

        const persisted = res?.data
        const attrs = persisted?.qualitativeEvaluation?.personalAttributes
        const t = persisted?.qualitativeEvaluation?.trainingAndDevelopment

        setAttributes(attrs?.length ? attrs : DEFAULT_ATTRIBUTES)
        setCompletedTraining(t?.completedTraining ?? [])
        setPlannedTraining(t?.plannedTraining ?? [])
        setInterventions(t?.interventions ?? [])
      } catch {
        setAttributes(DEFAULT_ATTRIBUTES)
        setCompletedTraining([])
        setPlannedTraining([])
        setInterventions([])
      } finally {
        setLoading(false)
      }
    }

    void fetch()
  }, [open, type, subjectId, periodLabel])

  const handleSave = async () => {
    if (!editReason.trim()) return

    setSaving(true)
    try {
      const payload: QualitativeEditPayload = {
        editReason: editReason.trim(),
        periodLabel,
        department: type === "DEPARTMENT" ? subjectId : undefined,
        qualitativeEvaluation: {
          personalAttributes: attributes,
          trainingAndDevelopment: {
            completedTraining,
            plannedTraining,
            interventions,
          },
        },
      }

      if (type === "EMPLOYEE" && subjectId) {
        await scorecardApiService.editEmployeeScorecard(subjectId, payload)
      } else if (type === "DEPARTMENT" && subjectId) {
        await scorecardApiService.editDepartmentScorecard(subjectId, payload)
      } else if (type === "CEO") {
        await scorecardApiService.editCeoScorecard(payload)
      } else {
        await scorecardApiService.editBoardScorecard(payload)
      }

      toast.success("Qualitative evaluation saved")
      onSaved?.()
      onClose()
    } catch (err: any) {
      toast.error("Failed to save", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = { EMPLOYEE: "Employee", DEPARTMENT: "Department", CEO: "CEO", BOARD: "Board" }[type]

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            Edit Qualitative Evaluation
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline" className="font-mono">{periodLabel}</Badge>
          </SheetTitle>
          <SheetDescription>
            Load persisted scorecard data, adjust ratings and training records, then save with a mandatory reason.
          </SheetDescription>
        </SheetHeader>

        {/* Mandatory edit reason */}
        <div className={cn(
          "mb-4 rounded-lg px-3 py-2 border",
          editReason.trim() ? "border-border bg-muted/30" : "border-amber-300 bg-amber-50"
        )}>
          <div className="flex items-center gap-1.5 mb-1.5">
            {!editReason.trim() && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
            <Label className="text-xs font-medium">
              Reason for edit <span className="text-red-500">*</span>
            </Label>
          </div>
          <Textarea
            placeholder="Explain why this evaluation is being edited…"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            className="text-sm resize-none min-h-[60px]"
            rows={2}
          />
          {!editReason.trim() && (
            <p className="text-[10px] text-amber-700 mt-1">Required before saving.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading persisted scorecard…</span>
          </div>
        ) : (
          <Tabs defaultValue="attributes">
            <TabsList className="mb-4">
              <TabsTrigger value="attributes">Personal Attributes</TabsTrigger>
              <TabsTrigger value="training">Training & Development</TabsTrigger>
            </TabsList>

            <TabsContent value="attributes" className="mt-0">
              <PersonalAttributesGrid attributes={attributes} onChange={setAttributes} />
            </TabsContent>

            <TabsContent value="training" className="mt-0 space-y-6">
              <TrainingEntryTable
                title="Completed Training"
                rows={completedTraining}
                onChange={setCompletedTraining}
              />
              <TrainingEntryTable
                title="Planned Training"
                rows={plannedTraining}
                onChange={setPlannedTraining}
              />
              <InterventionsTable rows={interventions} onChange={setInterventions} />
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="gradient-primary text-white"
            onClick={handleSave}
            disabled={saving || loading || !editReason.trim()}
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Evaluation"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
