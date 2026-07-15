import { io, Socket } from "socket.io-client"
import { getAuthToken } from "@/lib/utils/cookies"

let socket: Socket | null = null

const getWebSocketUrl = (): string => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  if (wsUrl) return wsUrl
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://31.220.82.129:3009/api"
  return apiUrl.replace(/\/api\/?$/, "")
}

export const getSocket = (): Socket => {
  if (socket && socket.connected) return socket

  const token = getAuthToken()

  socket = io(getWebSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
  })

  socket.on("connect_error", (err) => {
    console.warn("[socket] connect_error:", err.message)
  })

  return socket
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinTaskRoom = (taskId: string): void => {
  const s = getSocket()
  s.emit("join_task_room", { taskId })
}

export const leaveTaskRoom = (taskId: string): void => {
  if (!socket) return
  socket.emit("leave_task_room", { taskId })
}

export const subscribeTaskEvent = <T = any>(
  event: "task_message" | "task_comment_created" | "task_comment_deleted",
  handler: (payload: T) => void
): (() => void) => {
  const s = getSocket()
  s.on(event, handler as any)
  return () => {
    s.off(event, handler as any)
  }
}

export const subscribeNotifications = <T = any>(
  handler: (payload: T) => void
): (() => void) => {
  const s = getSocket()
  s.on("notification_created", handler as any)
  return () => {
    s.off("notification_created", handler as any)
  }
}
