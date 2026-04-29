"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/lib/store"
import { subscribeNotifications } from "@/lib/realtime/socket"
import {
  pushNotificationFromSocket,
} from "@/lib/store/slices/notificationsSlice"
import { AppNotification } from "@/lib/api/performance-notifications-api"
import { toast } from "sonner"

export const useNotificationSocket = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsub = subscribeNotifications<AppNotification>((notif) => {
      dispatch(pushNotificationFromSocket(notif))
      toast(notif.title, {
        description: notif.message,
      })
    })

    return () => {
      unsub()
    }
  }, [dispatch])
}
