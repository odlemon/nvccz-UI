'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'

/** Theme-token surfaces — work in .investments-terminal.light and .dark */
export const reconCard =
  'rounded-[24px] border border-border bg-card text-card-foreground shadow-[0_12px_40px_rgba(15,23,42,.06)]'
export const reconPill =
  'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-[11px] font-medium text-foreground transition hover:bg-muted'
export const reconInput =
  'h-9 w-full rounded-full border border-input bg-muted px-4 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary'
export const reconPrimaryPill =
  'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-4 text-[11px] font-medium text-primary-foreground transition hover:opacity-90'
export const reconSearch =
  'flex h-8 min-w-[180px] items-center gap-2 rounded-full border border-border bg-muted px-3 text-muted-foreground'
export const reconThead =
  'bg-muted/60 text-[9px] uppercase tracking-wider text-muted-foreground'
export const reconMonoLink = 'font-mono text-primary'
export const reconSubtle = 'text-muted-foreground'
export const reconDivider = 'border-border'

const navLinks = [
  { href: '/investments-v2/reconciliation', label: 'Overview', exact: true },
  { href: '/investments-v2/reconciliation/cash-ledger', label: 'Cash ledger' },
  { href: '/investments-v2/reconciliation/fund-cash', label: 'Fund cash' },
  { href: '/investments-v2/reconciliation/broker-custodian', label: 'Broker & custodian' },
  { href: '/investments-v2/reconciliation/exceptions', label: 'Exceptions' },
  { href: '/investments-v2/reconciliation/statements', label: 'Statements' },
]

/** Pill segment control for Trading|Fund / Client|Investor switches on the same route. */
export function ViewSegment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (id: T) => void
  /** @deprecated Ignored — always theme-tokenized for light/dark */
  variant?: 'default' | 'terminal-dark'
}) {
  return (
    <div role="tablist" className="inline-flex rounded-full border border-border bg-muted p-1">
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] font-medium transition',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Shared recon screen tabs — use on Overview and inside ReconShell. */
export function ReconNavTabs({
  variant: _variant = 'default',
}: {
  /** @deprecated Ignored — always theme-tokenized for light/dark */
  variant?: 'default' | 'terminal-dark'
}) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Reconciliation screens"
      className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted p-1"
    >
      {navLinks.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-[10px] font-medium transition',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function ReconShell({
  eyebrow = 'Investments / Reconciliation',
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-h-full bg-background p-3 text-foreground sm:p-5">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <header className="flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1 max-w-2xl text-[11px] text-muted-foreground">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <ReconNavTabs />
        {children}
      </div>
    </main>
  )
}

export function KpiCard({
  label,
  value,
  tone = 'text-foreground',
  hint,
}: {
  label: string
  value: string
  tone?: string
  hint?: string
}) {
  return (
    <div className={`${reconCard} px-5 py-4`}>
      <p className="text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</p>
      <p className={cn('mt-2 font-mono text-xl font-semibold', tone)}>{value}</p>
      {hint && <p className="mt-1 text-[9px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function StatusPill({ value }: { value: string }) {
  const v = value.toLowerCase()
  const tone =
    v.includes('match') ||
    v.includes('healthy') ||
    v.includes('delivered') ||
    v.includes('approved') ||
    v === 'active' ||
    v.includes('resolved')
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : v.includes('critical') ||
          v.includes('unreconcil') ||
          v.includes('exception') ||
          v.includes('failed') ||
          v.includes('escalat') ||
          v.includes('break') ||
          v.includes('suspend')
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300'
        : v.includes('pending') ||
            v.includes('investigat') ||
            v.includes('potential') ||
            v.includes('reconcil') ||
            v.includes('suggested') ||
            v.includes('open') ||
            v.includes('assigned') ||
            v.includes('suspense')
          ? 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300'
          : 'border-border bg-muted text-muted-foreground'
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium', tone)}>
      {value}
    </span>
  )
}

export function ReconDropdown({
  value,
  options,
  onChange,
  className = '',
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${reconPill} h-8 min-w-[132px] justify-between px-3 text-[10px]`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={cn('h-3 w-3 shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 min-w-full overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px]',
                option === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {option}
              {option === value && <Check className="ml-3 h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReconToast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-full border border-primary/30 bg-popover px-4 py-2 text-[11px] text-popover-foreground shadow-2xl">
      {message}
    </div>
  )
}

/** Loading / error / offline sample banner for cash recon live wiring. */
export function ReconApiBanner({
  loading,
  error,
  offlineSample,
}: {
  loading?: boolean
  error?: string | null
  offlineSample?: boolean
}) {
  if (!loading && !error && !offlineSample) return null
  return (
    <div className="space-y-2">
      {loading ? (
        <div className="overflow-hidden rounded-[12px] border border-border bg-muted/30">
          <ReconTableSkeleton rows={5} cols={5} />
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[10px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          {error}
        </div>
      ) : null}
      {offlineSample ? (
        <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
          Showing offline sample — API unavailable
        </div>
      ) : null}
    </div>
  )
}
