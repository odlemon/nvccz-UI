"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Loader2, Lock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
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
import type { AppDispatch, RootState } from "@/lib/store/store"
import { setLockModalOpen, lockScenario, fetchScenario } from "@/lib/store/slices/forecastingSlice"

interface LockScenarioModalProps {
  scenarioId: string
}

export function LockScenarioModal({ scenarioId }: LockScenarioModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { lockModalOpen, lockLoading } = useSelector((state: RootState) => state.forecasting)
  const [versionLabel, setVersionLabel] = useState("")

  const handleLock = async () => {
    if (!versionLabel.trim()) {
      toast.error("Version label is required (e.g. FY2026_BOARD_APPROVED)")
      return
    }
    try {
      await dispatch(lockScenario({ id: scenarioId, version_label: versionLabel.trim() })).unwrap()
      toast.success("Scenario locked successfully", { description: `Version: ${versionLabel.trim()}` })
      setVersionLabel("")
      dispatch(fetchScenario(scenarioId))
    } catch (err: any) {
      toast.error("Failed to lock scenario", { description: err?.message || "Please try again" })
    }
  }

  return (
    <Dialog open={lockModalOpen} onOpenChange={(open) => !open && dispatch(setLockModalOpen(false))}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Lock Scenario
          </DialogTitle>
          <DialogDescription>
            Create an immutable version snapshot. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>This is irreversible.</strong> Once locked, all driver records, formulas, and cell values
              become strictly read-only. Any edit attempt will return a 403 Forbidden error.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="version-label">
              Version Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="version-label"
              placeholder="e.g. FY2026_BOARD_APPROVED"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value.toUpperCase().replace(/\s/g, "_"))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Use uppercase with underscores (auto-formatted)</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => { dispatch(setLockModalOpen(false)); setVersionLabel("") }}
            disabled={lockLoading}
            className="rounded-full h-9 px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLock}
            disabled={lockLoading || !versionLabel.trim()}
            className="rounded-full h-9 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow"
          >
            {lockLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Locking...</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" /> Lock Scenario</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
