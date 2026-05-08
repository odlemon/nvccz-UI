"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { accountingApi, CreateExchangeRateRequest, ExchangeRate } from "@/lib/api/accounting-api"
import { toast } from "sonner"
import { format } from "date-fns"

// Create/Edit Exchange Rate Modal — uses custom Calendar picker for effective date
export function CreateExchangeRateModal({
  isOpen,
  onClose,
  onSuccess,
  initial
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initial?: ExchangeRate | null
}) {
  const [fromCurrencyId, setFromCurrencyId] = useState<string>("")
  const [toCurrencyId, setToCurrencyId] = useState<string>("")
  const [rate, setRate] = useState<number>(0)
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await accountingApi.getCurrencies()
      if (res.success && res.data) setCurrencies(res.data)
    }
    load()
  }, [])

  useEffect(() => {
    if (initial) {
      setFromCurrencyId(initial.fromCurrencyId)
      setToCurrencyId(initial.toCurrencyId)
      setRate(Number(initial.rate))
      setEffectiveDate(initial.date ? new Date(initial.date) : null)
      setNotes(initial.notes || "")
    } else {
      setFromCurrencyId("")
      setToCurrencyId("")
      setRate(0)
      setEffectiveDate(null)
      setNotes("")
    }
  }, [initial, isOpen])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!fromCurrencyId || !toCurrencyId || !effectiveDate) {
      toast.error("Please fill required fields")
      return
    }
    setLoading(true)
    try {
      const isoDate = format(effectiveDate, "yyyy-MM-dd")
      if (initial) {
        const payload = { rate, effectiveDate: isoDate, notes }
        const res = await accountingApi.updateExchangeRate(initial.id, payload)
        if (res.success) {
          toast.success("Exchange rate updated")
          onSuccess()
          onClose()
        } else {
          toast.error(res.error || "Failed to update exchange rate")
        }
      } else {
        const payload: CreateExchangeRateRequest = {
          fromCurrencyId,
          toCurrencyId,
          rate,
          effectiveDate: isoDate,
          notes
        }
        const res = await accountingApi.createExchangeRate(payload)
        if (res.success) {
          toast.success("Exchange rate created")
          onSuccess()
          onClose()
        } else {
          toast.error(res.error || "Failed to create exchange rate")
        }
      }
    } catch (err: any) {
      toast.error("Failed to save exchange rate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Exchange Rate" : "Create Exchange Rate"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From Currency</Label>
              <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
                <SelectTrigger className="rounded-full"><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To Currency</Label>
              <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
                <SelectTrigger className="rounded-full"><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rate</Label>
              <Input type="number" step="0.0001" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>

            <div>
              <Label>Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal rounded-full h-10 px-4">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={effectiveDate} onSelect={(d) => d && setEffectiveDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="rounded-full h-10 px-6">Cancel</Button>
            <Button type="submit" disabled={loading} variant={initial ? "gradient-update" : "gradient-create"} className="rounded-full h-10 px-6 shadow-sm">
              {loading ? "Saving..." : initial ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// View Exchange Rate Modal — details + edit/delete callbacks
export function ViewExchangeRateModal({
  isOpen,
  onClose,
  exchangeRate,
  onEdit,
  onDelete
}: {
  isOpen: boolean
  onClose: () => void
  exchangeRate: ExchangeRate | null
  onEdit?: (ex: ExchangeRate) => void
  onDelete?: (ex: ExchangeRate) => void
}) {
  if (!exchangeRate) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Exchange Rate</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div><strong>From:</strong> {exchangeRate.fromCurrency?.code} - {exchangeRate.fromCurrency?.name}</div>
          <div><strong>To:</strong> {exchangeRate.toCurrency?.code} - {exchangeRate.toCurrency?.name}</div>
          <div><strong>Rate:</strong> {exchangeRate.rate}</div>
          <div><strong>Effective Date:</strong> {new Date(exchangeRate.date).toLocaleDateString()}</div>
          <div><strong>Notes:</strong> {exchangeRate.notes || '-'}</div>
          <div className="flex justify-end gap-2 pt-4">
            {onEdit && <Button variant="outline" onClick={() => onEdit(exchangeRate)} className="rounded-full h-10 px-6">Edit</Button>}
            {onDelete && <Button variant="gradient-danger" onClick={() => onDelete(exchangeRate)} className="rounded-full h-10 px-6 shadow-sm">Delete</Button>}
            <Button onClick={onClose} variant="outline" className="rounded-full h-10 px-6">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
