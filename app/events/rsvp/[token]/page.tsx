"use client"

import { RSVPPage } from "@/components/events/rsvp-page"
// import { RSVPPage } from "@/components/events/rsvp-page"
import { useParams, useSearchParams } from "next/navigation"

export default function EventRSVP() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const status = searchParams.get('status') as 'accepted' | 'declined' | 'maybe' | null

  return <RSVPPage token={token} initialStatus={status} />
}
