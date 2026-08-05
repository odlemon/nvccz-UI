"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/lib/store"
import { subscribeInvestmentBrokerReply, subscribeNotifications } from "@/lib/realtime/socket"
import {
  fetchNotifications,
  pushNotificationFromSocket,
} from "@/lib/store/slices/notificationsSlice"
import { AppNotification } from "@/lib/api/performance-notifications-api"
import { toast } from "sonner"

export const useNotificationSocket = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsub = subscribeNotifications<AppNotification>((notif) => {
      if (notif?.id && notif?.title) {
        dispatch(pushNotificationFromSocket(notif))
      } else {
        void dispatch(fetchNotifications({ limit: 50, offset: 0 }))
      }
      const title = notif?.title || "New notification"
      const message =
        notif?.message ||
        (notif?.type === "INVESTMENT_BROKER_REPLY"
          ? "A broker responded to your instruction."
          : undefined)
      toast(title, { description: message })
    })

    return () => {
      unsub()
    }
  }, [dispatch])
}

/** Refetch orderbook broker thread when the AM who sent the instruction gets a live broker reply. */
export const useInvestmentBrokerReplySocket = (onReply: (orderId: string) => void) => {
  useEffect(() => {
    const unsub = subscribeInvestmentBrokerReply<{ orderId: string }>((payload) => {
      if (payload?.orderId) onReply(payload.orderId)
    })
    return unsub
  }, [onReply])
}
