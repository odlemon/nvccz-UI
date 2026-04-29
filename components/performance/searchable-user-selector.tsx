"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, User, X } from "lucide-react"

interface Props {
  selectedUser: AppUser | null
  onChange: (user: AppUser | null) => void
  placeholder?: string
  emptyHint?: string
}

export function SearchableUserSelector({
  selectedUser,
  onChange,
  placeholder = "Search users...",
  emptyHint = "Start typing to search users",
}: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || users.length > 0 || loading) return
    const loadUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await usersApi.getAll()
        setUsers(res.data || [])
      } catch (e: any) {
        setError(e?.message || "Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [open, users.length, loading])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
      return fullName.includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, query])

  return (
    <div ref={containerRef} className="space-y-2">
      {selectedUser && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className="bg-emerald-50 border-emerald-200 text-emerald-800 pr-1 gap-1"
          >
            <User className="w-3 h-3" />
            <span className="max-w-[200px] truncate">
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-1 hover:bg-emerald-100 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 rounded-full"
        />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-30 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading users...
              </div>
            ) : error ? (
              <p className="p-3 text-sm text-red-600 text-center">{error}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 text-center">
                {query ? `No users match "${query}"` : emptyHint}
              </p>
            ) : (
              <ul>
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(isSelected ? null : u)
                          setOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-emerald-50 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                          isSelected ? "bg-emerald-50" : ""
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
