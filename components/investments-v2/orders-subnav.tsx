'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const ORDERS_SUBNAV = [
  { label: 'Trade Blotter', href: '/investments-v2/orders/blotter' },
  { label: 'Orderbook', href: '/investments-v2/orders/orderbook' },
  { label: 'Trading', href: '/investments-v2/orders/trading' },
  { label: 'Compliance', href: '/investments-v2/orders/compliance' },
] as const

export function OrdersSubNav() {
  const pathname = usePathname()

  return (
    <div
      className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {ORDERS_SUBNAV.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              active ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#64748b] hover:text-[#94a3b8]'
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
