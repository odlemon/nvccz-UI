"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/store/slices/notificationsSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Check, ChevronRight, Loader2 } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function NotificationsFeedPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { feed, unreadCount, loading } = useAppSelector(
    (s) => s.notifications
  )
  const [tab, setTab] = useState<"all" | "unread">("all")

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 100 }))
  }, [dispatch])

  const filtered = tab === "unread" ? feed.filter((n) => !n.isRead) : feed

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-blue-600" />
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => dispatch(markAllNotificationsRead())}
            className="gap-2"
          >
            <Check className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary">{feed.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread
            <Badge variant="secondary">{unreadCount}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading && feed.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {tab === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) dispatch(markNotificationRead(n.id))
                    if (n.link) router.push(n.link)
                  }}
                  className={cn(
                    "w-full text-left p-4 hover:bg-gray-50 flex items-start gap-3",
                    !n.isRead && "bg-blue-50/30"
                  )}
                >
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          "text-sm",
                          !n.isRead && "font-semibold"
                        )}
                      >
                        {n.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(n.createdAt), "PPP p")} —{" "}
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {n.link && (
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
