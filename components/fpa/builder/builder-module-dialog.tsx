"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

type NameProps = {
  open: boolean
  mode: "create" | "rename"
  initialName?: string
  /** When creating a child module */
  parentName?: string | null
  busy?: boolean
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
}

/** Styled create / rename module modal — never use window.prompt. */
export function BuilderModuleNameDialog({
  open,
  mode,
  initialName = "",
  parentName = null,
  busy = false,
  onClose,
  onSubmit,
}: NameProps) {
  const [name, setName] = useState(initialName)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setErr(null)
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open, initialName])

  if (!open) return null

  const title =
    mode === "rename"
      ? "Rename module"
      : parentName
        ? `Add submodule under ${parentName}`
        : "Create module"
  const action = mode === "create" ? "Create" : "Save"
  const placeholder = parentName ? "e.g. Units & Pricing" : "e.g. Revenue Planning"

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setErr("Name is required")
      return
    }
    if (mode === "rename" && trimmed === initialName.trim()) {
      onClose()
      return
    }
    setErr(null)
    await onSubmit(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl space-y-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-name-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) onClose()
          if (e.key === "Enter" && !busy) void submit()
        }}
      >
        <h3 id="module-name-dialog-title" className="text-sm font-semibold text-[#0f172a]">
          {title}
        </h3>
        {parentName && mode === "create" ? (
          <p className="text-[12px] text-[#64748b]">
            Creates a child module inside <span className="font-medium text-[#0f172a]">{parentName}</span>.
            Add line items after selecting it in the tree.
          </p>
        ) : null}
        <label className="block text-xs text-[#64748b]">
          Module name
          <input
            ref={inputRef}
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
          />
        </label>
        {err ? <p className="text-[11px] text-[#b91c1c]">{err}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            className="h-9 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#475569] disabled:opacity-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs text-white disabled:opacity-50"
            onClick={() => void submit()}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {action}
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfirmProps = {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

/** Styled confirm — never use window.confirm. */
export function BuilderConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  busy = false,
  onClose,
  onConfirm,
}: ConfirmProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl space-y-3"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
        <p className="text-[13px] text-[#475569] leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            className="h-9 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#475569] disabled:opacity-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#dc2626] px-4 text-xs text-white disabled:opacity-50"
            onClick={() => void onConfirm()}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

type AttachDimsProps = {
  open: boolean
  catalog: Array<{ id: string; key: string; name: string; members?: Array<{ id: string; code: string; name: string }> }>
  /** Currently attached keys on the model */
  attachedKeys: string[]
  busy?: boolean
  onClose: () => void
  onSave: (dimensions: Array<{ key: string; valueIds: string[] }>) => void | Promise<void>
}

/** Attach catalog dimensions to the model (PUT …/dimensions replaces full set). */
export function BuilderAttachDimensionsDialog({
  open,
  catalog,
  attachedKeys,
  busy = false,
  onClose,
  onSave,
}: AttachDimsProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(attachedKeys))

  useEffect(() => {
    if (!open) return
    setSelected(new Set(attachedKeys.map((k) => k.toUpperCase())))
  }, [open, attachedKeys])

  if (!open) return null

  const toggle = (key: string) => {
    const k = key.toUpperCase()
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl space-y-3"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[#0f172a]">Attach dimensions</h3>
        <p className="text-[12px] text-[#64748b]">
          Choose which dimensions belong on this model. Saving replaces the full attach set.
        </p>
        <ul className="max-h-64 overflow-y-auto space-y-1 border border-[#e2e8f0] rounded-lg p-2">
          {catalog.map((d) => {
            const key = (d.key || d.name).toUpperCase()
            const on = selected.has(key)
            return (
              <li key={d.id}>
                <label className="flex items-center gap-2 rounded-md px-2 py-2 text-[12px] hover:bg-[#f8fafc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={busy}
                    onChange={() => toggle(d.key || d.name)}
                    className="rounded border-[#cbd5e1]"
                  />
                  <span className="font-medium text-[#0f172a]">{d.name}</span>
                  <span className="text-[#94a3b8] ml-auto">{d.key}</span>
                </label>
              </li>
            )
          })}
          {!catalog.length ? (
            <li className="px-2 py-6 text-center text-[12px] text-[#94a3b8]">No dimensions in catalog</li>
          ) : null}
        </ul>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            className="h-9 rounded-full border border-[#e2e8f0] px-3 text-xs text-[#475569] disabled:opacity-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs text-white disabled:opacity-50"
            onClick={() => {
              const body = catalog
                .filter((d) => selected.has((d.key || d.name).toUpperCase()))
                .map((d) => ({
                  key: d.key || d.name,
                  valueIds: (d.members || []).map((m) => m.id || m.code).filter(Boolean),
                }))
              void onSave(body)
            }}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
