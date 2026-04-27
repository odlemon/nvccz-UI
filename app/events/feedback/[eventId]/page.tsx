"use client"

import { PublicFeedbackPage } from "@/components/events/public-feedback-page"
import { useParams } from "next/navigation"

export default function EventFeedback() {
  const params = useParams()
  const eventId = params.eventId as string

  return <PublicFeedbackPage eventId={eventId} />
}
