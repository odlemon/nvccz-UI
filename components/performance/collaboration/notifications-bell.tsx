"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/store/slices/notificationsSlice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell, Check, ChevronRight } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function NotificationsBell() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { feed, unreadCount, loading } = useAppSelector((s) => s.notifications)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }))
  }, [dispatch])

  const handleClick = (id: string, link?: string, isRead?: boolean) => {
    if (!isRead) dispatch(markNotificationRead(id))
    setOpen(false)
    if (link) router.push(link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllNotificationsRead())}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && feed.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">Loading...</p>
          ) : feed.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No notifications yet
            </p>
          ) : (
            feed.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n.id, n.link, n.isRead)}
                className={cn(
                  "w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2",
                  !n.isRead && "bg-blue-50/50"
                )}
              >
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      !n.isRead && "font-semibold"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {n.link && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false)
              router.push("/performance/notifications")
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
