"use client"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, AlertTriangle, Clock, User, FileText, List, Search, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { toast } from "sonner"
import { useSelector, useDispatch } from "react-redux"
import { fetchBankTransactionMatches, clearBankTransactionMatchesError } from "@/lib/store/slices/accountingSlice"
import { BankTransactionMatchesModal } from "./bank-transaction-matches-modal"

const tabs = [
    { id: "info", label: "Info", icon: FileText },
    { id: "transactions", label: "Unreconciled Entries", icon: List },
    { id: "summary", label: "Summary", icon: CheckCircle }
]

// Helper function to trim spaces
const cleanString = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

const cleanNumber = (value: any, defaultValue: number = 0): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

export function BankReconciliationViewDrawer({ 
    isOpen, 
    onClose, 
    reconciliation 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    reconciliation: any 
}) {
    const dispatch = useDispatch()
    const { bankTransactionMatches, bankTransactionMatchesLoading } = useSelector((state: any) => state.accounting)
    const [activeTab, setActiveTab] = useState("info")
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
    const [matchesModalOpen, setMatchesModalOpen] = useState(false)

    // Reset tab when drawer opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab("info")
        }
    }, [isOpen])

    if (!reconciliation) return null

    // Format amount with proper currency
    const formatAmount = (amount: any) => {
        const numAmount = cleanNumber(amount)
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(numAmount)
    }

    // Columns for unreconciled entries
    const transactionColumns: Column<any>[] = [
        {
            key: 'transactionDate',
            label: 'Date',
            render: (value) => (
                <span className="text-sm">
                    {format(new Date(value), 'MMM dd, yyyy')}
                </span>
            )
        },
        {
            key: 'description',
            label: 'Description',
            render: (value, row) => (
                <div className="max-w-xs">
                    <span className="font-medium text-sm">{cleanString(value)}</span>
                    <div className="text-xs text-gray-500 mt-1">
                        Ref: {cleanString(row.reference)}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: (value) => (
                <Badge className={cn(
                    "text-xs",
                    value === 'RECEIPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}>
                    {value}
                </Badge>
            )
        },
        {
            key: 'counterpartyType',
            label: 'Counterparty',
            render: (value) => (
                <Badge variant="outline" className="text-xs">
                    {cleanString(value)}
                </Badge>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (value, row) => (
                <span className={cn(
                    "font-bold text-sm",
                    row.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                )}>
                    {row.type === 'RECEIPT' ? '+' : '-'}{formatAmount(value)}
                </span>
            )
        }
    ]

    // Handler for clicking a transaction row
    const handleTransactionClick = (transaction: any) => {
        setSelectedTransaction(transaction)
        setMatchesModalOpen(true)
        dispatch(fetchBankTransactionMatches(transaction.id))
    }

    // Calculate totals - In the new structure, unreconciledEntries might be in reconciliationResults or coming soon
    // For now, use the counts from the top level
    const pendingCount = reconciliation.unmatchedCount || 0
    const matchedCount = reconciliation.matchedCount || 0
    const totalTxns = reconciliation.totalTransactions || 0

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Download className="w-6 h-6 text-blue-600" />
                            <div>
                                <div className="text-lg font-semibold" title={cleanString(reconciliation.fileName || reconciliation.accountNumber)}>
                                    {cleanString(reconciliation.fileName || reconciliation.accountNumber)}
                                </div>
                                <div className="text-xs text-gray-500 font-normal">
                                    Account: {cleanString(reconciliation.accountNumber)} ({reconciliation.accountCurrency})
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn(
                                "text-xs",
                                reconciliation.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            )}>
                                {reconciliation.status === 'COMPLETED' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Reconciled</>
                                ) : (
                                    <><Clock className="w-3 h-3 mr-1" />Pending</>
                                )}
                            </Badge>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                {/* Action Buttons - Top Right */}
                <div className="mt-4 flex justify-end gap-3">
                    <Button
                        variant="gradient-info"
                        className="rounded-full h-10 px-6 shadow-sm"
                        size="sm"
                        onClick={() => toast.info("Download statement feature coming soon")}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    {/* {!reconciliation.isReconciled && (
                        <Button
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-sm"
                            size="sm"
                            onClick={() => toast.success("Reconciliation feature coming soon")}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Reconcile All
                        </Button>
                    )} */}
                </div>

                {/* Tab Navigation */}
                <div className="mt-6">
                    <div className="flex space-x-1 border-b">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm transition-all",
                                        isActive
                                            ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                                            : "text-gray-600 border-b-2 border-transparent hover:text-gray-900"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.id === "transactions" && reconciliation.unmatchedCount > 0 && (
                                        <Badge className="ml-1 bg-red-100 text-red-800 text-xs">
                                            {reconciliation.unmatchedCount}
                                        </Badge>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6 space-y-6">
                    {activeTab === "info" && (
                        <div className="space-y-4">
                            {/* Bank Account Info */}
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Bank Account Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Batch / File Name</h4>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {cleanString(reconciliation.fileName || 'N/A')}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Account Number</h4>
                                            <p className="text-sm font-mono text-blue-600">
                                                {cleanString(reconciliation.accountNumber)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Statement Date</h4>
                                            <p className="text-sm text-gray-900">
                                                {reconciliation.statementDate ? format(new Date(reconciliation.statementDate), 'PPP') : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                                            <Badge className={cn(
                                                reconciliation.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            )}>
                                                {reconciliation.status === 'COMPLETED' ? 'Reconciled' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">Unmatched</p>
                                                <p className="text-2xl font-bold text-yellow-600">
                                                    {reconciliation.unmatchedCount || 0}
                                                </p>
                                            </div>
                                            <Clock className="w-8 h-8 text-yellow-500 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">Matched</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {reconciliation.matchedCount || 0}
                                                </p>
                                            </div>
                                            <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">Total Transactions</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {reconciliation.totalTransactions || 0}
                                                </p>
                                            </div>
                                            <List className="w-8 h-8 text-blue-500 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === "transactions" && (
                        <ProcurementDataTable
                            data={reconciliation.unreconciledEntries || []}
                            columns={transactionColumns}
                            title="Unreconciled Entries"
                            loading={false}
                            showSearch={true}
                            showFilters={false}
                            emptyMessage="No unreconciled transactions found. All transactions are matched!"
                            onView={handleTransactionClick}
                        />
                    )}

                    {activeTab === "summary" && (
                        <div className="space-y-4">
                            {/* Summary Card */}
                             <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Balance Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-gray-600">Opening Balance</span>
                                            <span className="text-sm font-bold text-blue-600">
                                                {formatAmount(reconciliation.openingBalance)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-gray-600">Closing Balance</span>
                                            <span className="text-sm font-bold text-blue-600">
                                                {formatAmount(reconciliation.closingBalance)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm font-medium text-gray-900">Total Transactions</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {reconciliation.totalTransactions || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-gray-600">Accuracy Score</span>
                                            <Badge variant="outline" className="text-xs">
                                                {reconciliation.overallAccuracy || 0}%
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Breakdown by Type */}
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Transaction Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {['RECEIPT', 'PAYMENT'].map(type => {
                                            const entries = reconciliation.unreconciledEntries?.filter(
                                                (t: any) => t.type === type
                                            ) || []
                                            const total = entries.reduce(
                                                (sum: number, t: any) => sum + cleanNumber(t.amount), 
                                                0
                                            )
                                            return (
                                                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={cn(
                                                            type === 'RECEIPT' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        )}>
                                                            {type}
                                                        </Badge>
                                                        <span className="text-sm text-gray-600">
                                                            {entries.length} transaction{entries.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        {formatAmount(total)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Counterparty Breakdown */}
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Counterparty Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Array.from(new Set(
                                            reconciliation.unreconciledEntries?.map((t: any) => t.counterpartyType) || []
                                        )).map((counterparty: any) => {
                                            const entries = reconciliation.unreconciledEntries?.filter(
                                                (t: any) => t.counterpartyType === counterparty
                                            ) || []
                                            return (
                                                <div key={counterparty} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                    <Badge variant="outline" className="text-xs">
                                                        {cleanString(counterparty)}
                                                    </Badge>
                                                    <span className="text-xs text-gray-600">
                                                        {entries.length} transaction{entries.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Matches Modal */}
                <BankTransactionMatchesModal
                    open={matchesModalOpen}
                    onClose={() => {
                        setMatchesModalOpen(false)
                        setSelectedTransaction(null)
                        dispatch(clearBankTransactionMatchesError())
                    }}
                    transaction={selectedTransaction}
                    matches={bankTransactionMatches}
                    loading={bankTransactionMatchesLoading}
                    reconciliationId={reconciliation?.bankId || ""}
                />
            </SheetContent>
        </Sheet>
    )
}