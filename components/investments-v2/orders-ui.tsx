'use client'

import { Children, isValidElement, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-9 w-full rounded-full border border-white/10 bg-[#0a1220] px-3 text-[11px] text-slate-100 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-600'

export const buttonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] font-semibold text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40'

export function OrdersPage({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-[#05090f] text-slate-100">
      <main className="mx-auto w-full max-w-[1680px] space-y-5 p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400">Investments / Orders</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-2xl text-[11px] text-slate-500">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  )
}

export function OrdersCard({ title, eyebrow, actions, className, children }: { title?: string; eyebrow?: string; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('overflow-hidden rounded-[24px] border border-white/[0.07] bg-gradient-to-br from-[#101b30] to-[#090f1b] shadow-[0_18px_50px_rgba(0,0,0,.22)]', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5">
          <div>
            {eyebrow && <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div>}
            {title && <h2 className="text-[12px] font-semibold text-slate-100">{title}</h2>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'violet' }) {
  const colors = {
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    red: 'border-red-400/20 bg-red-400/10 text-red-300',
    blue: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
    slate: 'border-white/10 bg-white/[0.04] text-slate-400',
    violet: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  }
  return <span className={cn('inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider', colors[tone])}>{children}</span>
}

export function Metric({ label, value, detail, tone = 'text-white' }: { label: string; value: string; detail?: string; tone?: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-[#080e19]/75 p-3.5">
      <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={cn('mt-1 font-mono text-lg font-semibold', tone)}>{value}</div>
      {detail && <div className="mt-1 text-[9px] text-slate-600">{detail}</div>}
    </div>
  )
}

export function SelectField({ value, onChange, children, className }: { value: string; onChange: (value: string) => void; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const option = child as ReactElement<{ value?: string; children?: ReactNode }>
      const label = String(option.props.children ?? '')
      return { value: option.props.value ?? label, label }
    })
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(inputClass, 'flex items-center justify-between gap-2 text-left')}
      >
        <span className={cn('truncate', !selected?.value && 'text-slate-600')}>{selected?.label || 'Select…'}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-500 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="listbox" className="absolute z-50 mt-1 max-h-56 w-full min-w-[180px] overflow-y-auto rounded-[18px] border border-white/10 bg-[#0d1727] p-1.5 shadow-2xl shadow-black/50">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={`${option.value}-${option.label}`}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={cn('flex w-full items-center justify-between gap-3 rounded-full px-3 py-2 text-left text-[10px] text-slate-400 transition hover:bg-blue-500/10 hover:text-white', option.value === value && 'bg-blue-500/10 text-blue-200')}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-3 w-3 shrink-0 text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[9px] text-slate-600">{hint}</span>}
    </label>
  )
}

export function Modal({ open, title, subtitle, onClose, children, footer, width = 'max-w-3xl' }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button aria-label="Close modal" className="absolute inset-0 bg-black/60 dark:bg-black/75" onClick={onClose} />
      <div className={cn('iv2-modal-surface relative z-[1] max-h-[94vh] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1322] shadow-2xl', width)}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[calc(94vh-130px)] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.07] px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export const tableWrapClass = 'overflow-x-auto'
export const tableClass = 'w-full min-w-[1050px] border-collapse text-left text-[10px] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-white/[0.07] [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_td]:whitespace-nowrap [&_td]:border-b [&_td]:border-white/[0.045] [&_td]:px-3 [&_td]:py-3 [&_tbody_tr]:transition [&_tbody_tr:hover]:bg-blue-500/[0.06]'
