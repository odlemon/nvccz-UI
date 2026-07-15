import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  change?: number
  changeLabel?: string
  className?: string
  highlight?: boolean
}

export function StatCard({ label, value, subValue, change, changeLabel, className, highlight }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className={cn(
      'bg-[#0D1526] border border-white/[0.06] rounded-md p-3.5',
      highlight && 'border-[#2563EB]/40',
      className
    )}>
      <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider font-medium mb-1.5">{label}</div>
      <div className="text-xl font-semibold text-[#E8EDF5] font-mono leading-tight">{value}</div>
      {subValue && (
        <div className="text-[10px] text-[#4B5A72] mt-0.5">{subValue}</div>
      )}
      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-1.5 text-xs font-medium',
          isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
          {changeLabel && <span className="text-[#4B5A72] font-normal">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
