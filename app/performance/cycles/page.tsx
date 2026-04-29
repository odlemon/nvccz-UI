"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CyclesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/performance/reviews?tab=cycles")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-gray-400">Redirecting to Reviews...</div>
    </div>
  )
}
