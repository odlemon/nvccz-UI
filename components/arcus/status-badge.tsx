import { cn } from '@/lib/utils'

type StatusVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray'

const statusMap: Record<string, StatusVariant> = {
  // Order statuses
  executed: 'green',
  settled: 'green',
  approved: 'green',
  confirmed: 'green',
  passed: 'green',
  matched: 'green',
  validated: 'green',
  posted: 'green',
  active: 'green',
  // Warning
  pending: 'yellow',
  new: 'yellow',
  submitted: 'yellow',
  warning: 'yellow',
  investigating: 'yellow',
  manual: 'yellow',
  estimated: 'yellow',
  // Error
  rejected: 'red',
  failed: 'red',
  cancelled: 'red',
  breach: 'red',
  stale: 'red',
  unmatched: 'red',
  // Info
  checked: 'blue',
  review: 'blue',
  compliance: 'blue',
  'pending review': 'blue',
  // Default
  draft: 'gray',
  archived: 'gray',
  inactive: 'gray',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusMap[status.toLowerCase()] ?? 'gray'

  const variantClasses: Record<StatusVariant, string> = {
    green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 ring-red-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    gray: 'bg-white/5 text-[#A8B4C8] ring-white/10',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ring-1 uppercase tracking-wide',
      variantClasses[variant],
      className
    )}>
      {status}
    </span>
  )
}
