"use client"

import type { Socket } from "socket.io-client"
import { LP_PORTAL_USE_MOCK } from "@/lib/lp-portal/config"
import { getSocket } from "@/lib/realtime/socket"

export type LpRealtimeEvent =
  | "lp_notice_updated"
  | "lp_request_created"
  | "lp_request_updated"
  | "lp_request_message"
  | "lp_thread_message"
  | "lp_thread_read"
  | "lp_thread_updated"
  | "lp_notification"

export function getLpPortalSocket(): Socket | null {
  if (LP_PORTAL_USE_MOCK) return null
  return getSocket()
}

export function joinLpPortalOrg(): void {
  getLpPortalSocket()?.emit("join_lp_portal")
}

export function joinLpRequestRoom(reference: string): void {
  getLpPortalSocket()?.emit("join_lp_request", { reference })
}

export function leaveLpRequestRoom(reference: string): void {
  getLpPortalSocket()?.emit("leave_lp_request", { reference })
}

export function joinLpThreadRoom(threadId: string): void {
  getLpPortalSocket()?.emit("join_lp_thread", { threadId })
}

export function leaveLpThreadRoom(threadId: string): void {
  getLpPortalSocket()?.emit("leave_lp_thread", { threadId })
}

export function subscribeLpRealtime<T = unknown>(
  event: LpRealtimeEvent,
  handler: (payload: T) => void,
): () => void {
  const socket = getLpPortalSocket()
  if (!socket) return () => undefined
  socket.on(event, handler as (...args: unknown[]) => void)
  return () => {
    socket.off(event, handler as (...args: unknown[]) => void)
  }
}
