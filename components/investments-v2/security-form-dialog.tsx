'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { investmentsApi, type Security } from '@/lib/api/investments-api'

export const SECURITY_EXCHANGES = ['ZSE', 'VFEX', 'SECZIM', 'NYSE', 'NASDAQ', 'LSE'] as const
const CURRENCIES = ['USD', 'ZWG', 'GBP', 'EUR', 'ZAR']

interface SecurityFormData {
  symbol: string
  name: string
  exchangeCode: string
  listingCurrencyCode: string
  isin: string
  isActive: boolean
}

const EMPTY_FORM: SecurityFormData = {
  symbol: '',
  name: '',
  exchangeCode: 'ZSE',
  listingCurrencyCode: 'USD',
  isin: '',
  isActive: true,
}

interface SecurityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Security | null
  onSaved: () => void
}

export function SecurityFormDialog({ open, onOpenChange, editTarget, onSaved }: SecurityFormDialogProps) {
  const [form, setForm] = useState<SecurityFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      editTarget
        ? {
            symbol: editTarget.symbol,
            name: editTarget.name,
            exchangeCode: editTarget.exchangeCode,
            listingCurrencyCode: editTarget.listingCurrencyCode,
            isin: editTarget.isin ?? '',
            isActive: editTarget.isActive,
          }
        : EMPTY_FORM
    )
  }, [open, editTarget])

  const field = (key: keyof SecurityFormData, value: any) => setForm((p) => ({ ...p, [key]: value }))

  const handleSave = async () => {
    if (!form.symbol || !form.name) return
    setSaving(true)
    try {
      const payload = { ...form, isin: form.isin || null }
      if (editTarget) {
        const res = await investmentsApi.updateSecurity(editTarget.id, payload)
        if (!res.success) throw new Error(res.error || res.message || 'Update failed')
        toast.success(`${form.symbol} updated`)
      } else {
        const res = await investmentsApi.createSecurity(payload as any)
        if (!res.success) throw new Error(res.error || res.message || 'Create failed')
        toast.success(`${form.symbol} registered in securities master`)
      }
      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Save failed', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editTarget ? `Edit ${editTarget.symbol}` : 'Register Security'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ticker Symbol</Label>
              <Input
                placeholder="ARIS"
                value={form.symbol}
                onChange={(e) => field('symbol', e.target.value.toUpperCase())}
                className="h-8 font-mono"
                disabled={!!editTarget}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exchange</Label>
              <Select value={form.exchangeCode} onValueChange={(v) => field('exchangeCode', v)} disabled={!!editTarget}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_EXCHANGES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Company Name</Label>
            <Input
              placeholder="Ariston Holdings Limited"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Listing Currency</Label>
              <Select value={form.listingCurrencyCode} onValueChange={(v) => field('listingCurrencyCode', v)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ISIN (optional)</Label>
              <Input
                placeholder="ZW0009012345"
                value={form.isin}
                onChange={(e) => field('isin', e.target.value.toUpperCase())}
                className="h-8 font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Active</Label>
            <Switch checked={form.isActive} onCheckedChange={(v) => field('isActive', v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.symbol || !form.name}>
            {saving ? 'Saving…' : editTarget ? 'Update Security' : 'Register Security'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
