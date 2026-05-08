"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  FileText,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Scale,
  Building2,
  Info,
  ChevronDown,
  TrendingUp,
  Activity
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { postJournalEntry, voidJournalEntry } from "@/lib/store/slices/accountingSlice"

interface JournalEntry {
  id: string
  transactionDate: string
  referenceNumber: string
  description: string
  totalAmount: string
  status: 'PENDING' | 'POSTED' | 'VOID'
  journalEntryLines: JournalEntryLine[]
  createdBy: {
    firstName: string
    lastName: string
  }
  createdAt: string
  updatedAt: string
}

interface JournalEntryLine {
  id: string
  debitAmount: string
  creditAmount: string
  description: string
  chartOfAccount: {
    accountNo: string
    accountName: string
    accountType: string
  }
}

interface JournalEntryViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  entry: JournalEntry | null
  onEntryUpdated: () => void
}

export function JournalEntryViewDrawer({
  isOpen,
  onClose,
  entry,
  onEntryUpdated
}: JournalEntryViewDrawerProps) {
  const dispatch = useDispatch<AppDispatch>()
  
  // Get loading states from Redux store
  const { isPostingJournalEntry, isVoidingJournalEntry } = useSelector((state: RootState) => state.accounting)
  
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)

  if (!entry) return null

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'VOID':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'VOID':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper function to get account description
  const getAccountDescription = (accountType: string): string => {
    const descriptions: Record<string, string> = {
      'Current Asset': 'Assets that are expected to be converted to cash or consumed within one year.',
      'Fixed Asset': 'Long-term assets used in operations, not easily converted to cash.',
      'Current Liability': 'Obligations due within one year or operating cycle.',
      'Long-term Liability': 'Obligations due beyond one year.',
      'Equity': 'Owner\'s residual interest in assets after deducting liabilities.',
      'Revenue': 'Income earned from normal business operations.',
      'Expense': 'Costs incurred in earning revenue.',
      'Contra-Asset': 'Asset account with a credit balance that reduces total assets.',
    }
    return descriptions[accountType] || 'Account used for recording financial transactions.'
  }

  // Helper function to get normal balance
  const getNormalBalance = (accountType: string): string => {
    const debitAccounts = ['Current Asset', 'Fixed Asset', 'Expense', 'Contra-Asset']
    return debitAccounts.includes(accountType) ? 'Debit' : 'Credit'
  }

  const handlePostEntry = async () => {
    try {
      const result = await dispatch(postJournalEntry(entry.id))
      if (postJournalEntry.fulfilled.match(result)) {
        // Use the message from the API response
        const message = result.meta.requestStatus === 'fulfilled' ? "Journal entry posted successfully" : "Journal entry posted successfully"
        toast.success(message)
        onEntryUpdated()
        setShowPostDialog(false) // Close dialog on success
        onClose()
      } else if (postJournalEntry.rejected.match(result)) {
        const errorMessage = typeof result.payload === 'string' ? result.payload : "Unknown error occurred"
        toast.error("Failed to post journal entry", {
          description: errorMessage
        })
        // Don't close dialog on error - let user try again or cancel
      }
    } catch (error: any) {
      toast.error("Failed to post journal entry", {
        description: error.message || "An unexpected error occurred"
      })
      // Don't close dialog on error
    }
    // Don't close dialog here - only close on success
  }

  const handleVoidEntry = async () => {
    try {
      const result = await dispatch(voidJournalEntry(entry.id))
      if (voidJournalEntry.fulfilled.match(result)) {
        // Use the message from the API response
        const message = result.meta.requestStatus === 'fulfilled' ? "Journal entry voided successfully" : "Journal entry voided successfully"
        toast.success(message)
        onEntryUpdated()
        setShowVoidDialog(false) // Close dialog on success
        onClose()
      } else if (voidJournalEntry.rejected.match(result)) {
        const errorMessage = typeof result.payload === 'string' ? result.payload : "Unknown error occurred"
        toast.error("Failed to void journal entry", {
          description: errorMessage
        })
        // Don't close dialog on error - let user try again or cancel
      }
    } catch (error: any) {
      toast.error("Failed to void journal entry", {
        description: error.message || "An unexpected error occurred"
      })
      // Don't close dialog on error
    }
    // Don't close dialog here - only close on success
  }

  const handleCloseDrawer = () => {
    // Prevent closing drawer if operations in progress
    if (isPostingJournalEntry || isVoidingJournalEntry) {
      toast.warning("Please wait for the current operation to complete")
      return
    }
    onClose()
  }

  const totalDebits = entry.journalEntryLines.reduce((sum, line) => 
    sum + parseFloat(line.debitAmount || '0'), 0)
  
  const totalCredits = entry.journalEntryLines.reduce((sum, line) => 
    sum + parseFloat(line.creditAmount || '0'), 0)

  const debitLines = entry.journalEntryLines.filter(line => 
    parseFloat(line.debitAmount || '0') > 0)
  
  const creditLines = entry.journalEntryLines.filter(line => 
    parseFloat(line.creditAmount || '0') > 0)

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  // Account info popover component
  const AccountInfoPopover = ({ account }: { account: JournalEntryLine['chartOfAccount'] }) => {
    const [open, setOpen] = useState(false)
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors">
                {account.accountNo}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            <p className="font-semibold text-sm text-gray-900 leading-tight hover:text-blue-600 transition-colors">
              {account.accountName}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {account.accountType}
            </p>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" side="top" align="start">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-900">{account.accountName}</h4>
                <p className="text-sm text-gray-600">Account Details</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Account Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{account.accountNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Account Type</p>
                  <Badge variant="outline" className="text-xs">
                    {account.accountType}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Financial Statement</p>
                  <p className="text-sm font-medium text-gray-900">
                    {account.accountType.includes('Asset') || account.accountType.includes('Liability') || account.accountType.includes('Equity') 
                      ? 'Balance Sheet' 
                      : 'Income Statement'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {getAccountDescription(account.accountType)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Normal Balance:</span>
                <span className="font-medium">
                  {getNormalBalance(account.accountType)}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleCloseDrawer}>
        <SheetContent 
          side="right" 
          className="p-0 overflow-y-auto"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900">Journal Entry</span>
                  <p className="text-sm text-gray-600 font-mono">
                    {entry.referenceNumber}
                  </p>
                </div>
              </SheetTitle>
              
              {/* Status Badge and Action Buttons */}
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(entry.status)} border text-sm px-3 py-1.5 rounded-full font-medium`}>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(entry.status)}
                    {entry.status}
                  </div>
                </Badge>
                
                {/* Action Buttons */}
                {entry.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="gradient-create"
                      className="rounded-full px-4 h-9 shadow-sm"
                      onClick={() => setShowPostDialog(true)}
                      disabled={isPostingJournalEntry || isVoidingJournalEntry || !isBalanced}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {isPostingJournalEntry ? 'Posting...' : 'Post'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-red-200 text-red-600 hover:bg-red-50 px-4 h-9 shadow-sm"
                      onClick={() => setShowVoidDialog(true)}
                      disabled={isPostingJournalEntry || isVoidingJournalEntry}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {isVoidingJournalEntry ? 'Voiding...' : 'Void'}
                    </Button>
                  </div>
                )}
                
                {entry.status === 'POSTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-red-200 text-red-600 hover:bg-red-50 px-4 h-9 shadow-sm"
                    onClick={() => setShowVoidDialog(true)}
                    disabled={isPostingJournalEntry || isVoidingJournalEntry}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {isVoidingJournalEntry ? 'Voiding...' : 'Void'}
                  </Button>
                )}

                {entry.status === 'VOID' && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <XCircle className="w-4 h-4 mr-1 text-red-500" />
                    <span>Voided</span>
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {/* Description Card */}
          
            {/* Modern T-Account Display */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200 py-4 border-b">
                <CardTitle className="text-center text-lg font-bold text-slate-800">
                  T-Account View
                </CardTitle>
                <p className="text-center text-sm text-slate-600 font-mono opacity-75">
                  {entry.referenceNumber}
                </p>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Modern T-Account Structure */}
                <div className="grid grid-cols-2">
                  {/* DEBIT SIDE (Left) */}
                  <div className="border-r border-gray-200">
                    <div className="bg-gradient-to-r from-emerald-50 to-green-100 border-b border-gray-200 p-4 text-center">
                      <h3 className="text-base font-bold text-emerald-800 mb-1">
                        DEBIT
                      </h3>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(totalDebits)}
                      </p>
                    </div>
                    
                    <div className="p-4 min-h-[300px]">
                      {debitLines.length > 0 ? (
                        <div className="space-y-3">
                          {debitLines.map((line, index) => (
                            <div key={line.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 pr-2">
                                  <AccountInfoPopover account={line.chartOfAccount} />
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-base text-emerald-700">
                                    {formatCurrency(line.debitAmount)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 bg-emerald-50 p-2 rounded-md border border-emerald-100">
                                {line.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <ArrowUpDown className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No debit entries</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CREDIT SIDE (Right) */}
                  <div>
                    <div className="bg-gradient-to-r from-rose-50 to-red-100 border-b border-gray-200 p-4 text-center">
                      <h3 className="text-base font-bold text-rose-800 mb-1">
                        CREDIT
                      </h3>
                      <p className="text-xl font-bold text-rose-700">
                        {formatCurrency(totalCredits)}
                      </p>
                    </div>
                    
                    <div className="p-4 min-h-[300px]">
                      {creditLines.length > 0 ? (
                        <div className="space-y-3">
                          {creditLines.map((line, index) => (
                            <div key={line.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 pr-2">
                                  <AccountInfoPopover account={line.chartOfAccount} />
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-base text-rose-700">
                                    {formatCurrency(line.creditAmount)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 bg-rose-50 p-2 rounded-md border border-rose-100">
                                {line.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <ArrowUpDown className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No credit entries</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance Check Footer */}
                <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                  <div className="flex items-center justify-center">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      isBalanced 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {isBalanced ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Entry Balanced
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Out of Balance: {formatCurrency(Math.abs(totalDebits - totalCredits))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              <Card className="border-0  shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-800 text-base leading-relaxed font-medium">
                  {entry.description}
                </p>
              </CardContent>
            </Card>


            {/* Entry Metadata */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Date</span>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {format(new Date(entry.transactionDate), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Amount</span>
                </div>
                <p className="font-semibold text-sm text-green-600">
                  {formatCurrency(entry.totalAmount)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <User className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-gray-600">Created By</span>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {entry.createdBy.firstName} {entry.createdBy.lastName}
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Post Confirmation Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={(open) => {
        // Prevent closing dialog when posting is in progress
        if (!isPostingJournalEntry) {
          setShowPostDialog(open)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Post Journal Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to post this journal entry?</p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Reference: {entry.referenceNumber}</p>
                <p className="text-sm text-blue-700">Amount: {formatCurrency(entry.totalAmount)}</p>
                <p className="text-sm text-blue-700">Date: {format(new Date(entry.transactionDate), 'MMM d, yyyy')}</p>
              </div>
              <p className="text-sm text-gray-600">
                Once posted, this entry will be locked and cannot be edited. Only voiding will be possible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPostingJournalEntry} className="rounded-full h-10 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // Prevent default dialog close behavior
                handlePostEntry()
              }}
              disabled={isPostingJournalEntry || !isBalanced}
              className={cn(buttonVariants({ variant: "gradient-create" }), "rounded-full h-10 px-6")}
            >
              {isPostingJournalEntry ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Post Entry
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={(open) => {
        // Prevent closing dialog when voiding is in progress
        if (!isVoidingJournalEntry) {
          setShowVoidDialog(open)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Void Journal Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to void this journal entry?</p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Reference: {entry.referenceNumber}</p>
                <p className="text-sm text-red-700">Amount: {formatCurrency(entry.totalAmount)}</p>
                <p className="text-sm text-red-700">Date: {format(new Date(entry.transactionDate), 'MMM d, yyyy')}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">⚠️ Warning</p>
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. The journal entry will be permanently voided and cannot be restored.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoidingJournalEntry} className="rounded-full h-10 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // Prevent default dialog close behavior
                handleVoidEntry()
              }}
              disabled={isVoidingJournalEntry}
              className={cn(buttonVariants({ variant: "gradient-danger" }), "rounded-full h-10 px-6")}
            >
              {isVoidingJournalEntry ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Voiding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Void Entry
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
