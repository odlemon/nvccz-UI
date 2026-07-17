'use client'

import { PlaceEquityOrderModal } from '@/components/investments-v2/place-equity-order-modal'

interface NewEquityOrderModalProps {
  open: boolean
  onClose: () => void
  container?: HTMLElement | null
  onOrderCreated?: () => void
}

export function NewEquityOrderModal({ open, onClose, onOrderCreated }: NewEquityOrderModalProps) {
  return <PlaceEquityOrderModal open={open} onClose={onClose} onComplete={onOrderCreated} />
}
