"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator, AlertTriangle, CalendarIcon, BookOpen, DollarSign, Scale } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { fetchCurrencies, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import { accountingApi } from "@/lib/api/accounting-api"

interface JournalLine {
  id: number
  accountId: string
  accountName?: string
  description: string
  debitAmount: number | null
  creditAmount: number | null
}

interface CreateJournalEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateJournalEntryModal({
  isOpen,
  onClose,
  onSuccess
}: CreateJournalEntryModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    currencies = [], 
    chartOfAccounts = [],
    chartOfAccountsLoading,
    currenciesLoading 
  } = useSelector((state: RootState) => state.accounting)
  
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Form state
  const [journalDate, setJournalDate] = useState<Date>(new Date())
  const [referenceNumber, setReferenceNumber] = useState('')
  const [description, setDescription] = useState('')
  const [currencyId, setCurrencyId] = useState('')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [lines, setLines] = useState<JournalLine[]>([
    { id: 1, accountId: '', description: '', debitAmount: null, creditAmount: null },
    { id: 2, accountId: '', description: '', debitAmount: null, creditAmount: null }
  ])

  useEffect(() => {
    if (isOpen && !dataLoaded) {
      // Only load data once when modal opens and data hasn't been loaded
      dispatch(fetchCurrencies())
      dispatch(fetchChartOfAccounts({ isActive: true }))
      setDataLoaded(true)
      resetForm()
      generateReferenceNumber()
    }
  }, [isOpen, dataLoaded, dispatch])

  useEffect(() => {
    // Set default currency when currencies are loaded
    if (currencies.length > 0 && !currencyId) {
      const defaultCurrency = currencies.find(c => c.isDefault) || currencies[0]
      setCurrencyId(defaultCurrency.id)
    }
  }, [currencies, currencyId])

  const generateReferenceNumber = () => {
    const today = new Date()
    const timestamp = Date.now()
    const refNumber = `JE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${timestamp.toString().slice(-6)}`
    setReferenceNumber(refNumber)
  }

  const resetForm = () => {
    setJournalDate(new Date())
    setReferenceNumber('')
    setDescription('')
    setCurrencyId('') // Reset currency selection
    setExchangeRate(1)
    setLines([
      { id: 1, accountId: '', description: '', debitAmount: null, creditAmount: null },
      { id: 2, accountId: '', description: '', debitAmount: null, creditAmount: null }
    ])
  }

  const addLine = () => {
    const newId = Math.max(...lines.map(l => l.id)) + 1
    setLines([...lines, { id: newId, accountId: '', description: '', debitAmount: null, creditAmount: null }])
  }

  const removeLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id))
    }
  }

  const updateLine = (id: number, field: keyof JournalLine, value: any) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const getTotalDebits = () => {
    return lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
  }

  const getTotalCredits = () => {
    return lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
  }

  const isBalanced = () => {
    return Math.abs(getTotalDebits() - getTotalCredits()) < 0.01
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getAccountDetails = (accountId: string) => {
    return chartOfAccounts.find(a => a.id === accountId)
  }

  const validateForm = () => {
    if (!referenceNumber.trim()) {
      toast.error('Reference number is required')
      return false
    }
    if (!description.trim()) {
      toast.error('Description is required')
      return false
    }
    if (!currencyId) {
      toast.error('Currency is required')
      return false
    }
    
    // Check if all lines have accounts
    const hasEmptyAccounts = lines.some(line => !line.accountId || line.accountId === 'placeholder')
    if (hasEmptyAccounts) {
      toast.error('All lines must have an account selected')
      return false
    }

    // Check if all lines have either debit or credit amount
    const hasEmptyAmounts = lines.some(line => !line.debitAmount && !line.creditAmount)
    if (hasEmptyAmounts) {
      toast.error('All lines must have either a debit or credit amount')
      return false
    }

    // Check if entry is balanced
    if (!isBalanced()) {
      toast.error('Journal entry must be balanced (total debits must equal total credits)')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      const journalData = {
        transactionDate: format(journalDate, 'yyyy-MM-dd'),
        referenceNumber,
        description,
        currencyId,
        exchangeRate,
        journalEntryLines: lines
          .filter(line => line.accountId && line.accountId !== '')
          .map(line => ({
            chartOfAccountId: line.accountId,
            description: line.description,
            debitAmount: line.debitAmount || 0,
            creditAmount: line.creditAmount || 0
          }))
      }

      const response = await accountingApi.createJournalEntry(journalData)
      
      if (response.success) {
        toast.success('Journal entry created successfully')
        onSuccess()
      } else {
        toast.error(response.error || 'Failed to create journal entry')
      }
    } catch (error: any) {
      toast.error('Failed to create journal entry', {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? `${account.accountNumber} - ${account.accountName}` : ''
  }

  const handleClose = () => {
    setDataLoaded(false) // Reset data loaded flag
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 px-6 -mt-6 pt-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>New Journal Entry</span>
              <p className="text-sm font-normal text-gray-600 mt-1">Record transactions in the general ledger</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Header Information - Ledger Book Style */}
            <Card className="border border-blue-100 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Journal Entry Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Transaction Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border hover:border-blue-300 h-10 text-sm rounded-full",
                          !journalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {journalDate ? format(journalDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={journalDate}
                        onSelect={(date) => date && setJournalDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reference Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Reference Number</Label>
                  <Input
                    placeholder="e.g., JE-2024-001"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="font-mono border hover:border-blue-300 focus:border-blue-500 h-10 text-sm rounded-full"
                    required
                  />
                </div>

                {/* Currency Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Currency</Label>
                  <Select value={currencyId} onValueChange={setCurrencyId}>
                    <SelectTrigger className="border hover:border-blue-300 focus:border-blue-500 h-10 text-sm rounded-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="max-w-xs">
                      {currenciesLoading ? (
                        <SelectItem value="loading" disabled>Loading currencies...</SelectItem>
                      ) : currencies && currencies.length > 0 ? (
                        currencies.map(currency => (
                          <SelectItem key={currency.id} value={currency.id}>
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-sm flex-shrink-0">{currency.code}</span>
                              <span className="text-sm flex-shrink-0">{currency.symbol}</span>
                              <span className="text-gray-600 text-sm truncate">{currency.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-currencies" disabled>No currencies found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exchange Rate */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="border hover:border-blue-300 focus:border-blue-500 h-10 text-sm rounded-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border border-green-100 bg-gradient-to-br from-white to-green-50/30">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Description</Label>
                  <Textarea
                    placeholder="Describe the purpose of this journal entry..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-20 border hover:border-green-300 focus:border-green-500 text-sm resize-none rounded-xl"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Journal Lines - Ledger Book Style */}
            <Card className="border border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between mt-2">
                  <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Journal Entries
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="border-purple-200 hover:bg-purple-50 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Ledger Header */}
                <div className="grid grid-cols-12 gap-3 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-700">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Account</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                </div>

                {/* Journal Lines */}
                <div className="space-y-1">
                  {lines.map((line, index) => (
                    <div key={line.id} className={cn(
                      "grid grid-cols-12 gap-3 p-4 hover:bg-blue-50/50 transition-colors border-b border-gray-100",
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    )}>
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="col-span-4">
                        <Select 
                          value={line.accountId} 
                          onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                        >
                          <SelectTrigger className="border hover:border-blue-300 focus:border-blue-500 h-10 text-sm rounded-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 w-[400px]">
                            {chartOfAccountsLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading chart of accounts...
                              </SelectItem>
                            ) : chartOfAccounts && chartOfAccounts.length > 0 ? (
                              chartOfAccounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex flex-col w-full">
                                    <div className="font-semibold text-sm truncate max-w-[350px]">
                                      {account.accountNo} - {account.accountName}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {account.accountType}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-accounts" disabled>
                                No chart of accounts found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Input
                          placeholder="Line description"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          className="border hover:border-green-300 focus:border-green-500 h-10 text-sm rounded-full"
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debitAmount ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            updateLine(line.id, 'debitAmount', val === '' ? null : parseFloat(val))
                          }}
                          className="text-right font-mono border hover:border-green-300 focus:border-green-500 text-green-700 font-semibold h-10 text-sm rounded-full"
                        />
                      </div>

                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.creditAmount ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            updateLine(line.id, 'creditAmount', val === '' ? null : parseFloat(val))
                          }}
                          className="text-right font-mono border hover:border-red-300 focus:border-red-500 text-red-700 font-semibold h-10 text-sm rounded-full"
                        />
                        
                        {lines.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(line.id)}
                            className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 h-10 w-10 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg text-gray-700">Totals:</span>
                    </div>
                    
                    <div className="flex gap-8">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Debits</div>
                        <div className="text-2xl font-bold text-green-700">
                          {formatCurrency(getTotalDebits())}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Credits</div>
                        <div className="text-2xl font-bold text-red-700">
                          {formatCurrency(getTotalCredits())}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    {!isBalanced() && getTotalDebits() > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-200 rounded-full text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">
                          Out of Balance: {formatCurrency(Math.abs(getTotalDebits() - getTotalCredits()))}
                        </span>
                      </div>
                    )}
                    
                    {isBalanced() && getTotalDebits() > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full text-green-700">
                        <Scale className="w-4 h-4" />
                        <span className="font-semibold">Entry is Balanced ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleClose} size="lg" className="rounded-full">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !isBalanced() || getTotalDebits() === 0}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Create Journal Entry
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}