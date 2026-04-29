"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchVisionStatement } from "@/lib/store/slices/performanceConfigSlice"
import { Eye } from "lucide-react"

export function VisionBanner() {
  const dispatch = useAppDispatch()
  const { visionStatement } = useAppSelector((s) => s.performanceConfig)

  useEffect(() => {
    if (!visionStatement) {
      dispatch(fetchVisionStatement())
    }
  }, [dispatch, visionStatement])

  if (!visionStatement) return null

  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-md">
      <div className="flex items-start gap-3">
        <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
          <Eye className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide font-semibold opacity-90">
            Our Vision
          </p>
          <p className="text-base mt-1 leading-relaxed italic">
            "{visionStatement}"
          </p>
        </div>
      </div>
    </div>
  )
}
