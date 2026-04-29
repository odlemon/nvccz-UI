"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PerformanceConfigurationPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/performance/configuration/pillars")
  }, [router])
  return null
}
