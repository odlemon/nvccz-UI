"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Download } from "lucide-react"
import { cashbookApi } from "@/lib/api/cashbook-api"

interface ExportCashbookAuditModalProps {
    isOpen: boolean
    onClose: () => void
    banks: any[]
}

export function ExportCashbookAuditModal({ isOpen, onClose, banks }: ExportCashbookAuditModalProps) {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1 // 1-12

    const [formData, setFormData] = useState({
        year: currentYear.toString(),
        month: currentMonth.toString(),
        bankId: "null",
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        try {
            const year = parseInt(formData.year)
            const month = parseInt(formData.month)
            const bankId = formData.bankId === "null" ? null : formData.bankId

            const response = await cashbookApi.exportCashbookAudit({ year, month, bankId })

            // Auto-download the Blob
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `Cashbook_Audit_Export_${year}_${month}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success("Cashbook audit exported successfully")
            onClose()
        } catch (error: any) {
            toast.error(error.message || "Failed to export cashbook audit")
        } finally {
            setLoading(false)
        }
    }

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ]

    const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString())

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Cashbook Audit</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Select
                            value={formData.year}
                            onValueChange={(value) => setFormData({ ...formData, year: value })}
                        >
                            <SelectTrigger id="year">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="month">Month *</Label>
                        <Select
                            value={formData.month}
                            onValueChange={(value) => setFormData({ ...formData, month: value })}
                        >
                            <SelectTrigger id="month">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bankId">Bank (Optional)</Label>
                        <Select
                            value={formData.bankId}
                            onValueChange={(value) => setFormData({ ...formData, bankId: value })}
                        >
                            <SelectTrigger id="bankId">
                                <SelectValue placeholder="All Banks" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">All Banks</SelectItem>
                                {Array.isArray(banks) && banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} variant="gradient-info">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Export
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
