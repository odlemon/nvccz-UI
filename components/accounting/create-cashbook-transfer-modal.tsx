"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Banknote, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { cashbookApi } from "@/lib/api/cashbook-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export function CreateCashbookTransferModal({ isOpen, onClose, banks, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [transferDate, setTransferDate] = useState<Date>(new Date())
    const [formData, setFormData] = useState({
        fromBankId: "",
        toBankId: "",
        amount: "",
        description: "",
        reference: "",
        projectCode: "",
    })

    useEffect(() => {
        if (!isOpen) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                onClose()
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isOpen, onClose])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        if (!formData.fromBankId || !formData.toBankId || !formData.amount || !formData.description || !formData.reference) {
            toast.error("Please fill in all required fields")
            return
        }
        if (formData.fromBankId === formData.toBankId) {
            toast.error("From and To banks cannot be the same")
            return
        }
        try {
            setLoading(true)
            const payload = {
                fromBankId: formData.fromBankId,
                toBankId: formData.toBankId,
                amount: parseFloat(formData.amount),
                transferDate: format(transferDate, "yyyy-MM-dd"),
                description: formData.description,
                reference: formData.reference,
                projectCode: formData.projectCode || undefined,
            }
            const res = await cashbookApi.createCashbookTransfer(payload)
            if (res.success) {
                toast.success("Transfer created successfully")
                setFormData({
                    fromBankId: "",
                    toBankId: "",
                    amount: "",
                    description: "",
                    reference: "",
                    projectCode: "",
                })
                setTransferDate(new Date())
                onSuccess()
            } else {
                toast.error("Failed to create transfer")
            }
        } catch {
            toast.error("Failed to create transfer")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Banknote className="w-5 h-5" />
                        New Cashbook Transfer
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>From Bank *</Label>
                            <Select
                                value={formData.fromBankId}
                                onValueChange={v => setFormData({ ...formData, fromBankId: v })}
                            >
                                <SelectTrigger className="rounded-full">
                                    <SelectValue placeholder="Select from bank..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.id} value={bank.id}>
                                            {bank.name} - {bank.accountNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>To Bank *</Label>
                            <Select
                                value={formData.toBankId}
                                onValueChange={v => setFormData({ ...formData, toBankId: v })}
                            >
                                <SelectTrigger className="rounded-full">
                                    <SelectValue placeholder="Select to bank..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.id} value={bank.id}>
                                            {bank.name} - {bank.accountNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Amount *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                            className="rounded-full"
                        />
                    </div>
                    <div>
                        <Label>Description *</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            className="rounded-2xl"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <Label>Reference *</Label>
                            <Input
                                value={formData.reference}
                                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                required
                                className="rounded-full"
                            />
                        </div>
                        <div>
                            <Label>Project Code</Label>
                            <Input
                                value={formData.projectCode}
                                onChange={e => setFormData({ ...formData, projectCode: e.target.value })}
                                className="rounded-full"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Transfer Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal rounded-full",
                                        !transferDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {transferDate ? format(transferDate, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                <Calendar
                                    mode="single"
                                    selected={transferDate}
                                    onSelect={date => date && setTransferDate(date)}
                                    initialFocus
                                    className="rounded-xl"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} variant="gradient-create" className="rounded-full">
                            {loading ? "Creating..." : "Create Transfer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
