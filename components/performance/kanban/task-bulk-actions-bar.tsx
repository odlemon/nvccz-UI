"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import {
  bulkStatusUpdate,
  clearTaskSelection,
} from "@/lib/store/slices/performanceTasksSlice"
import { recalculateGoalRollup } from "@/lib/store/slices/performanceSlice"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskStage } from "@/lib/api/performance-tasks-api"
import { Loader2, CheckCircle, X, Move } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  selectedIds: string[]
  onClear: () => void
}

const STAGES: { value: TaskStage; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "overdue", label: "Overdue" },
  { value: "delayed", label: "Delayed" },
  { value: "completed", label: "Complete" },
  { value: "amber", label: "Amber" },
  { value: "red", label: "Red" },
]

export function TaskBulkActionsBar({ selectedIds, onClear }: Props) {
  const dispatch = useAppDispatch()
  const [stage, setStage] = useState<TaskStage>("in_progress")
  const [busy, setBusy] = useState(false)

  if (selectedIds.length === 0) return null

  const apply = async () => {
    setBusy(true)
    try {
      const result = await dispatch(
        bulkStatusUpdate({ taskIds: selectedIds, stage })
      ).unwrap()
      toast.success(`Moved ${selectedIds.length} task(s) to ${stage}`)
      // Refresh affected goals
      const affected = result.affectedGoalIds || []
      if (affected.length > 0) {
        await Promise.allSettled(
          affected.map((goalId) => dispatch(recalculateGoalRollup(goalId)))
        )
        toast.success(`Refreshed ${affected.length} affected goal(s)`)
      }
      dispatch(clearTaskSelection())
    } catch (e: any) {
      toast.error(e?.message || "Bulk update failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border shadow-2xl rounded-full px-4 py-3 flex items-center gap-3"
      >
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>

        <div className="h-6 w-px bg-gray-200" />

        <Move className="w-4 h-4 text-gray-500" />
        <Select value={stage} onValueChange={(v) => setStage(v as TaskStage)}>
          <SelectTrigger className="w-[140px] h-8 border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={apply} disabled={busy} size="sm" className="gap-1">
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          Apply
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
          <X className="w-3.5 h-3.5" /> Clear
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
