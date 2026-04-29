"use client"

import { useNotificationSocket } from "@/lib/hooks/useNotificationSocket"

/**
 * Mount this component once at the root of the app to subscribe to
 * realtime notifications. It renders nothing.
 */
export function GlobalRealtimeMount() {
  useNotificationSocket()
  return null
}
