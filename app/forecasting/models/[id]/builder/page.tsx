"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/** Legacy path — redirect to Model Builder detail. */
export default function LegacyModelBuilderRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) router.replace(`/forecasting/model-builder/${id}`)
  }, [id, router])

  return (
    <div className="flex items-center justify-center py-20 gap-2 text-[#64748b]">
      <Loader2 className="w-5 h-5 animate-spin" /> Opening Model Builder…
    </div>
  )
}
