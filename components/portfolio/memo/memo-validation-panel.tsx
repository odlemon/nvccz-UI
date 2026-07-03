"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"

export function MemoValidationPanel({ passed, errors }: { passed: boolean; errors?: string[] | null }) {
  if (passed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        All required sections are complete.
      </div>
    )
  }

  const list = Array.isArray(errors) ? errors : []

  return (
    <div className="space-y-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
      {list.length > 0 ? (
        list.map((err, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{err}</span>
          </div>
        ))
      ) : (
        <div className="flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Complete all required sections before submitting.</span>
        </div>
      )}
    </div>
  )
}
