"use client"

import { useEffect, useState } from "react"
import {
  performanceTasksApi,
  MentionUser,
} from "@/lib/api/performance-tasks-api"
import { Loader2 } from "lucide-react"

interface Props {
  taskId: string
  query: string
  onSelect: (user: { id: string; name: string }) => void
  onClose: () => void
}

export function MentionDropdown({ taskId, query, onSelect, onClose }: Props) {
  const [users, setUsers] = useState<MentionUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    performanceTasksApi
      .getMentionSuggestions(taskId, query || undefined)
      .then((res) => {
        if (!cancelled) setUsers(res.users || [])
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [taskId, query])

  return (
    <div className="absolute bottom-full left-0 mb-1 w-64 max-h-60 overflow-y-auto bg-white border rounded-lg shadow-lg z-20">
      {loading ? (
        <div className="flex items-center justify-center p-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-xs text-gray-500 text-center p-3">
          No users matching "{query}"
        </p>
      ) : (
        <ul>
          {users.slice(0, 8).map((u) => (
            <li key={u.id}>
              <button
                onClick={() => onSelect(u)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
              >
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
