"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Banknote, Package, FileText, AlertTriangle, Calendar as CalendarIcon, RotateCcw, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ProcurementDataTable } from "../procurement/procurement-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cashbookApi, TransactionReversal } from "@/lib/api/cashbook-api"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const reverseSchema = yup.object({
    reason: yup.string().required("Reason is required"),
    description: yup.string().required("Description is required"),
    reverseDate: yup.date().required("Reverse date is required"),
})

export function CashbookTransferViewDrawer({ isOpen, onClose, transfer, onTransferUpdate }) {
    const getRelevantTabs = () => {
        const baseTabs = [
            { id: "overview", label: "Overview", icon: Package },
        ]
        return baseTabs
    }

    const relevantTabs = useMemo(() => getRelevantTabs(), [])
    const [activeTab, setActiveTab] = useState("overview")
    const [reverseDialogOpen, setReverseDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [reversing, setReversing] = useState(false)
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
    const [reversalHistory, setReversalHistory] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const {
        control,
        handleSubmit: handleSubmitReverse,
        setValue: setValueReverse,
        watch: watchReverse,
        reset: resetReverse,
        formState: { errors: errorsReverse },
    } = useForm({
        resolver: yupResolver(reverseSchema),
        defaultValues: {
            reason: "",
            description: "",
            reverseDate: new Date(),
        },
    })

    const reverseDate = watchReverse("reverseDate")

    useEffect(() => {
        setActiveTab(relevantTabs[0]?.id || "overview")
    }, [relevantTabs])

    if (!transfer) return null

    const renderedTabs = relevantTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm transition-all",
                    isActive
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 border-b-2 border-transparent hover:text-gray-900"
                )}
            >
                <Icon className="w-4 h-4" />
                {tab.label}
            </button>
        )
    })

    const handleReverseTransaction = async (data) => {
        setReversing(true)
        try {
            const res = await cashbookApi.reverseTransaction(selectedTransaction.id, {
                ...data,
                reverseDate: format(data.reverseDate, "yyyy-MM-dd"),
            })
            if (res.success) {
                toast.success("Transaction reversed successfully")
                setReverseDialogOpen(false)
                resetReverse()
                onTransferUpdate?.()
            } else {
                toast.error(res.message)
            }
        } catch (error : any) {
            toast.error(error?.message ?? "Failed to reverse transaction")
        } finally {
            setReversing(false)
            resetReverse()
        }
    }

    const handleViewHistory = async (transactionId) => {
        setLoadingHistory(true)
        try {
            const res = await cashbookApi.getTransactionReversalHistory(transactionId)
            if (res.success && Array.isArray(res.message)) {
                setReversalHistory(res.message)
                setHistoryDialogOpen(true)
            } else {
                toast.error("Failed to load reversal history or invalid response")
                setReversalHistory([])
            }
        } catch (error) {
            toast.error("Failed to load reversal history")
            setReversalHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <SheetTitle className="flex items-center gap-3">
                                <Banknote className="w-6 h-6" />
                                Transfer Details - {transfer.reference}
                                <Badge
                                    className={
                                        transfer.status === "POSTED"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }
                                >
                                    {transfer.status}
                                </Badge>
                            </SheetTitle>
                        </div>
                    </SheetHeader>

                    {/* Tab Navigation */}
                    <div className="mt-6">
                        <div className="flex space-x-1 border-b">
                            {renderedTabs}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-6 space-y-6">
                        {activeTab === "overview" && (
                            <>
                                {/* Transfer Information */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle>Transfer Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-gray-900 font-medium">From Bank</h4>
                                                <p>{transfer.fromBank?.name} ({transfer.fromBank?.accountNumber})</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">To Bank</h4>
                                                <p>{transfer.toBank?.name} ({transfer.toBank?.accountNumber})</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Amount</h4>
                                                <p>${Number(transfer.amount).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Transfer Date</h4>
                                                <p>{format(new Date(transfer.transferDate), "PPP")}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Reference</h4>
                                                <p>{transfer.reference}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Project Code</h4>
                                                <p>{transfer.projectCode || "N/A"}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <h4 className="text-gray-900 font-medium">Description</h4>
                                                <p>{transfer.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Additional Information */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle>Additional Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Created By</h4>
                                                <p>{transfer.createdBy?.firstName} {transfer.createdBy?.lastName}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Posted At</h4>
                                                <p>{transfer.postedAt ? format(new Date(transfer.postedAt), "PPP") : "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Created At</h4>
                                                <p>{format(new Date(transfer.createdAt), "PPP")}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-medium">Updated At</h4>
                                                <p>{format(new Date(transfer.updatedAt), "PPP")}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reverse Transaction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReverse(handleReverseTransaction)} className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Controller
                                name="reason"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="reason"
                                        {...field}
                                        placeholder="Enter reason for reversal"
                                    />
                                )}
                            />
                            {errorsReverse.reason && (
                                <p className="text-sm text-red-600">{errorsReverse.reason.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        id="description"
                                        {...field}
                                        placeholder="Enter description"
                                    />
                                )}
                            />
                            {errorsReverse.description && (
                                <p className="text-sm text-red-600">{errorsReverse.description.message}</p>
                            )}
                        </div>
                        <div>
                            <Label>Reverse Date</Label>
                            <Controller
                                name="reverseDate"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal rounded-full",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errorsReverse.reverseDate && (
                                <p className="text-sm text-red-600">{errorsReverse.reverseDate.message}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setReverseDialogOpen(false)} className="rounded-full">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={reversing} variant="gradient-danger" className="rounded-full">
                                {reversing ? "Reversing..." : "Reverse"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Reversal History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {loadingHistory ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : (
                            <ProcurementDataTable
                                data={reversalHistory}
                                columns={[
                                    {
                                        key: "description",
                                        label: "Description",
                                    },
                                    {
                                        key: "amount",
                                        label: "Amount",
                                        render: (value: string) => `$${parseFloat(value || '0').toLocaleString()}`,
                                    },
                                    {
                                        key: "reversalReason",
                                        label: "Reason",
                                    },
                                    {
                                        key: "createdAt",
                                        label: "Reversed At",
                                        render: (value) => format(new Date(value), "PPP"),
                                    },
                                ]}
                                title=""
                                searchPlaceholder="Search reversals..."
                                loading={false}
                                emptyMessage="No reversals found."
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
