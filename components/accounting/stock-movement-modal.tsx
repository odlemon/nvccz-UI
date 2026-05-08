"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { postStockMovement } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch } from "@/lib/store/store"

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  onSuccess: () => void
}

export function StockMovementModal({ isOpen, onClose, itemId, onSuccess }: StockMovementModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    movementType: 'IN',
    quantity: '0',
    unitCost: '',
    referenceNumber: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    try {
      setLoading(true)
      await dispatch(postStockMovement({
        itemId,
        movementType: form.movementType as any,
        quantity: Number(form.quantity),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined
      })).unwrap()
      toast.success('Stock movement recorded')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record movement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={form.movementType} onValueChange={(v) => setForm({...form, movementType: v})}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="rounded-full" />
          </div>

          <div>
            <Label>Unit Cost</Label>
            <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({...form, unitCost: e.target.value})} className="rounded-full" />
          </div>

          <div>
            <Label>Reference</Label>
            <Input value={form.referenceNumber} onChange={(e) => setForm({...form, referenceNumber: e.target.value})} className="rounded-full" />
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-full" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-10 px-6">Cancel</Button>
            <Button type="submit" disabled={loading} variant="gradient-update" className="rounded-full h-10 px-6">{loading ? 'Saving...' : 'Record Movement'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
