"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Setup is a modal on /forecasting/models — redirect legacy page URLs. */
export default function FpaModelSetupRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/forecasting/models")
  }, [router])
  return null
}
