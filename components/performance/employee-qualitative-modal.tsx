"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { scorecardApiService, type QualitativeAttribute } from "@/lib/api/scorecard-service"
import { cn } from "@/lib/utils"

const DEFAULT_ATTRIBUTES = [
  "Judgement in decision making",
  "Leadership and Management",
  "Ethics",
  "Teamwork",
  "Communication Skills",
  "Creativity and Innovation",
  "Knowledge of Standard Operating Procedures",
  "Quality of Work",
  "Interpersonal Relations",
  "Technical Skills",
]

const COLUMNS = [
  "Excellent",
  "Very Good",
  "Satisfactory",
  "Requires Improvement",
  "Unsatisfactory",
]

function buildDefaults(existing?: QualitativeAttribute[]): QualitativeAttribute[] {
  return DEFAULT_ATTRIBUTES.map((attr) => {
    const found = existing?.find((e) => e.attribute === attr)
    if (found) return { ...found }
    return {
      attribute: attr,
      columns: COLUMNS.map((label) => ({ label, selected: false })),
    }
  })
}

interface EmployeeQualitativeModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
  periodLabel: string
  existingAttributes?: QualitativeAttribute[]
  onSaved: () => void
}

export function EmployeeQualitativeModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  periodLabel,
  existingAttributes,
  onSaved,
}: EmployeeQualitativeModalProps) {
  const [attributes, setAttributes] = useState<QualitativeAttribute[]>(() =>
    buildDefaults(existingAttributes),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAttributes(buildDefaults(existingAttributes))
    }
  }, [isOpen, existingAttributes])

  const handleSelect = (attrIndex: number, colLabel: string) => {
    setAttributes((prev) =>
      prev.map((attr, i) => {
        if (i !== attrIndex) return attr
        return {
          ...attr,
          columns: attr.columns.map((col) => ({
            ...col,
            selected: col.label === colLabel ? !col.selected : false,
          })),
        }
      }),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await scorecardApiService.saveEmployeeQualitativeEvaluation(employeeId, {
        periodLabel,
        qualitativeEvaluation: { personalAttributes: attributes },
      })
      toast.success("Employee qualitative evaluation saved successfully")
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error("Failed to save qualitative evaluation", {
        description: err?.message || "Please try again",
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = attributes.filter((a) => a.columns.some((c) => c.selected)).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!w-[95vw] sm:!max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Employee Leadership Evaluation
          </DialogTitle>
          <DialogDescription>
            Rate <span className="font-medium">{employeeName}</span>&apos;s performance across 10 personal attributes for{" "}
            <span className="font-medium">{periodLabel}</span>. Select one rating per attribute.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {DEFAULT_ATTRIBUTES.length} attributes rated
            </p>
            <Badge variant="outline" className="rounded-full">
              {employeeName} · {periodLabel}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-[30%]">
                    Attribute
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-3 font-semibold text-gray-700 text-center whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr, attrIdx) => {
                  const selectedCol = attr.columns.find((c) => c.selected)
                  return (
                    <tr
                      key={attr.attribute}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        selectedCol ? "bg-blue-50/40" : "hover:bg-gray-50/60",
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                        {attr.attribute}
                        {selectedCol && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs">
                            {selectedCol.label}
                          </Badge>
                        )}
                      </td>
                      {attr.columns.map((col) => (
                        <td key={col.label} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelect(attrIdx, col.label)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all duration-150 flex items-center justify-center mx-auto",
                              col.selected
                                ? "border-blue-600 bg-blue-600 text-white scale-110 shadow-md"
                                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50",
                            )}
                            aria-label={`${attr.attribute}: ${col.label}`}
                          >
                            {col.selected && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-full h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Evaluation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
