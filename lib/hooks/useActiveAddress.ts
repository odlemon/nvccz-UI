"use client"

import { useEffect, useState } from "react"
import {
  companyProfileApi,
  CompanyAddress,
} from "@/lib/api/company-profile-api"
import type { LetterheadAddress } from "@/lib/utils/pdf-letterhead"

/** Module-level cache so multiple drawers don't re-hit the endpoint. */
let cachedAddress: LetterheadAddress | null | undefined = undefined
let inFlight: Promise<LetterheadAddress | null> | null = null

const toLetterhead = (addr: CompanyAddress | null): LetterheadAddress | null => {
  if (!addr) return null
  return {
    label: addr.label,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    logoUrl: addr.logoUrl,
  }
}

const loadActiveAddress = async (): Promise<LetterheadAddress | null> => {
  if (cachedAddress !== undefined) return cachedAddress
  if (inFlight) return inFlight
  inFlight = companyProfileApi
    .getActiveAddress()
    .then((addr) => {
      cachedAddress = toLetterhead(addr)
      return cachedAddress
    })
    .catch(() => {
      cachedAddress = null
      return null
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/**
 * Returns the active company address shaped for letterheads, or null while
 * loading / on error. Result is cached across the page so we only hit
 * /company-profile/addresses once per session.
 */
export function useActiveAddress(): LetterheadAddress | null {
  const [address, setAddress] = useState<LetterheadAddress | null>(
    cachedAddress ?? null
  )

  useEffect(() => {
    if (cachedAddress !== undefined) {
      setAddress(cachedAddress)
      return
    }
    let cancelled = false
    loadActiveAddress().then((a) => {
      if (!cancelled) setAddress(a)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return address
}

/** Force a refetch (e.g. after the user changes the active address). */
export const invalidateActiveAddress = () => {
  cachedAddress = undefined
  inFlight = null
}
