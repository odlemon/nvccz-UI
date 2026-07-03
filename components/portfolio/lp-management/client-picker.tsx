"use client"

import { useEffect, useRef, useState } from "react"
import { clientsApi, type ClientRecord } from "@/lib/api/capital-calls-api"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Link2 } from "lucide-react"
import { LinkClientUserDialog } from "./link-client-user-dialog"

interface ClientPickerProps {
  selectedClient: ClientRecord | null
  onSelect: (client: ClientRecord) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * Shared searchable client picker used by the Invite Membership dialog and
 * the Document Publishing form. Calls clientsApi.list({ search }) directly —
 * this lookup isn't wired into Redux since it's a one-off search, not
 * app-wide cached state.
 */
export function ClientPicker({ selectedClient, onSelect, placeholder, disabled }: ClientPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [linkTarget, setLinkTarget] = useState<ClientRecord | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await clientsApi.list({ search: query || undefined })
        setResults(res.data.clients || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLinked = (updated: ClientRecord) => {
    setResults((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    if (selectedClient?.id === updated.id) onSelect(updated)
    setLinkTarget(null)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={selectedClient ? selectedClient.legalName : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search clients by name, investor ID or email…"}
          disabled={disabled}
          className="pl-8 h-9 text-sm rounded-full border-gray-200 bg-white"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && !loading ? (
            <div className="px-3 py-4 text-xs text-center text-muted-foreground">No clients found</div>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/40 cursor-pointer border-b border-gray-50 last:border-0"
                onClick={() => {
                  onSelect(c)
                  setQuery("")
                  setOpen(false)
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.legalName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.investorId} · {c.email}
                  </p>
                </div>
                {c.userId === null || c.userId === undefined ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLinkTarget(c)
                    }}
                    className="shrink-0"
                  >
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1 cursor-pointer"
                    >
                      <Link2 className="w-3 h-3" /> Not linked
                    </Badge>
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      {linkTarget && (
        <LinkClientUserDialog
          client={linkTarget}
          open={!!linkTarget}
          onOpenChange={(v) => {
            if (!v) setLinkTarget(null)
          }}
          onLinked={handleLinked}
        />
      )}
    </div>
  )
}
