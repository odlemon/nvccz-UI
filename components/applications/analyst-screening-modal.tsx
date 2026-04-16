"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { applicationsApi } from "@/lib/api/applications-api"
import { toast } from "sonner"
import { Loader2, Search, AlertTriangle, CheckCircle2 } from "lucide-react"

interface AnalystScreeningModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  businessName: string
  hasAssignedAnalyst: boolean
  onAssignAnalyst: () => void
  onSuccess: () => void
}

export function AnalystScreeningModal({
  isOpen,
  onClose,
  applicationId,
  businessName,
  hasAssignedAnalyst,
  onAssignAnalyst,
  onSuccess,
}: AnalystScreeningModalProps) {
  const [score, setScore] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setScore("")
      setError("")
    }
  }, [isOpen])

  const numScore = Number(score)
  const isValid = score !== "" && !isNaN(numScore) && numScore >= 0 && numScore <= 100
  const willReject = isValid && numScore < 50

  const handleSubmit = async () => {
    if (!hasAssignedAnalyst) {
      setError("Assign a lead analyst before recording the screening score")
      return
    }

    if (!score || isNaN(numScore) || numScore < 0 || numScore > 100) {
      setError("Enter a valid score between 0 and 100")
      return
    }
    setError("")

    try {
      setSubmitting(true)
      await applicationsApi.analystScreening(applicationId, numScore)
      toast.success(
        numScore < 50
          ? "Application rejected at screening"
          : "Screening passed — advancing to Active DD",
        { description: `Score: ${numScore}/100` }
      )
      onSuccess()
      onClose()
    } catch (e: any) {
      const message = e?.message || "Failed to submit screening score"
      toast.error("Failed to submit screening score", {
        description: message,
      })

      if (String(message).toLowerCase().includes("assign a lead analyst")) {
        onClose()
        onAssignAnalyst()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Search className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Analyst Screening Score
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {businessName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {!hasAssignedAnalyst && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div>
                <p className="font-medium">No lead analyst assigned yet</p>
                <p className="text-xs mt-0.5 opacity-90">
                  Assign an analyst first, then submit the screening score.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-amber-300"
                onClick={() => {
                  onClose()
                  onAssignAnalyst()
                }}
              >
                Assign Analyst
              </Button>
            </div>
          )}

          {/* Score input */}
          <div className="space-y-2">
            <Label>Screening Score (0 &ndash; 100) *</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 72"
              className="rounded-full text-center text-lg font-semibold"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Score bar */}
          {isValid && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium">
                  Threshold: 50
                </span>
                <span>100</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                {/* Threshold marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 z-10" />
                <div
                  className={`h-full rounded-full transition-all ${
                    willReject ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${numScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Outcome preview */}
          {isValid && (
            <div
              className={`flex items-center gap-3 rounded-xl p-3 text-sm ${
                willReject
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}
            >
              {willReject ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  {willReject
                    ? "Below threshold — will be rejected"
                    : "Passes threshold — will advance to Active DD"}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {willReject
                    ? "Score below 50 results in REJECTED_SCREENING status"
                    : "Score of 50 or above moves application to ACTIVE_DD stage"}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !isValid || !hasAssignedAnalyst}
              className={`rounded-full gap-1.5 text-white ${
                willReject
                  ? "bg-red-600 hover:bg-red-700"
                  : "gradient-primary"
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Score
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
