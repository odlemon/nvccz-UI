"use client"

import { useEffect } from "react"
import {
  joinTaskRoom,
  leaveTaskRoom,
  subscribeTaskEvent,
} from "@/lib/realtime/socket"
import { TaskComment } from "@/lib/api/performance-tasks-api"

export interface TaskRoomHandlers {
  onMessage?: (msg: TaskComment) => void
  onCommentCreated?: (comment: TaskComment) => void
  onCommentDeleted?: (payload: { commentId: string }) => void
}

export const useTaskRoom = (taskId: string | null | undefined, handlers: TaskRoomHandlers) => {
  useEffect(() => {
    if (!taskId) return

    joinTaskRoom(taskId)

    const unsubMessage = handlers.onMessage
      ? subscribeTaskEvent<TaskComment>("task_message", handlers.onMessage)
      : undefined
    const unsubCreated = handlers.onCommentCreated
      ? subscribeTaskEvent<TaskComment>("task_comment_created", handlers.onCommentCreated)
      : undefined
    const unsubDeleted = handlers.onCommentDeleted
      ? subscribeTaskEvent<{ commentId: string }>(
          "task_comment_deleted",
          handlers.onCommentDeleted
        )
      : undefined

    return () => {
      unsubMessage?.()
      unsubCreated?.()
      unsubDeleted?.()
      leaveTaskRoom(taskId)
    }
  }, [taskId, handlers.onMessage, handlers.onCommentCreated, handlers.onCommentDeleted])
}
