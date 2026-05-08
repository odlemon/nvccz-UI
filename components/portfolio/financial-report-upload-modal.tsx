"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UploadCloud, Loader2, Upload, ArrowRight, Check } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAppDispatch } from "@/lib/store"
import { uploadFinancialReport, submitPeriodKPIs } from "@/lib/store/slices/applicationPortalSlice"
import { FinancialReportType, PeriodType } from "@/lib/api/application-portal-api"

interface FinancialReportUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FinancialReportUploadModal({ isOpen, onClose }: FinancialReportUploadModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    reportType: 'BALANCE_SHEET' as FinancialReportType,
    periodType: 'MONTHLY' as PeriodType,
    periodStart: new Date(),
    periodEnd: new Date(),
    title: '',
    description: '',
    templateVersion: '1.0',
    // KPI fields
    totalRevenue: '',
    netProfit: '',
    cashFlowNet: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file to upload.")
      return
    }
    if (!formData.title) {
      toast.error("Please provide a title for the report.")
      return
    }

    setLoading(true)
    try {
      await dispatch(uploadFinancialReport({
        ...formData,
        file,
        periodStart: format(formData.periodStart, 'yyyy-MM-dd'),
        periodEnd: format(formData.periodEnd, 'yyyy-MM-dd'),
      })).unwrap()
      toast.success("Financial report uploaded successfully.")
      setStep(2)
    } catch (error: any) {
      toast.error(error || "Failed to upload report.")
    } finally {
      setLoading(false)
    }
  }

  const handleKPISubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await dispatch(submitPeriodKPIs({
        periodStart: format(formData.periodStart, 'yyyy-MM-dd'),
        periodEnd: format(formData.periodEnd, 'yyyy-MM-dd'),
        totalRevenue: Number(formData.totalRevenue),
        netProfit: Number(formData.netProfit),
        cashFlowNet: Number(formData.cashFlowNet),
      })).unwrap()
      toast.success("Financial KPIs submitted successfully.")
      handleClose()
    } catch (error: any) {
      toast.error(error || "Failed to submit KPIs.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFile(null)
    setFormData({
      reportType: 'BALANCE_SHEET',
      periodType: 'MONTHLY',
      periodStart: new Date(),
      periodEnd: new Date(),
      title: '',
      description: '',
      templateVersion: '1.0',
      totalRevenue: '',
      netProfit: '',
      cashFlowNet: '',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Upload Financial Statement' : 'Financial KPIs'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Fill in the details and upload your financial report file.'
              : 'Please provide the key financial metrics for this period.'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center mb-6">
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>1</div>
          <div className={cn("w-16 h-1 bg-muted mx-2", step >= 2 && "bg-primary")} />
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Report Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="rounded-full" />
              </div>
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={formData.reportType} onValueChange={(v) => setFormData({ ...formData, reportType: v as FinancialReportType })}>
                  <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BALANCE_SHEET">Balance Sheet</SelectItem>
                    <SelectItem value="INCOME_STATEMENT">Income Statement</SelectItem>
                    <SelectItem value="CASHFLOW_STATEMENT">Cashflow Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="periodType">Period Type</Label>
                <Select value={formData.periodType} onValueChange={(v) => setFormData({ ...formData, periodType: v as PeriodType })}>
                  <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-full", !formData.periodStart && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.periodStart ? format(formData.periodStart, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.periodStart} onSelect={(d) => d && setFormData({ ...formData, periodStart: d })} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Period End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-full", !formData.periodEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.periodEnd ? format(formData.periodEnd, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.periodEnd} onSelect={(d) => d && setFormData({ ...formData, periodEnd: d })} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="file-upload">Report File (CSV, Excel)</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <Input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">{file ? file.name : "CSV, XLSX up to 10MB"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={loading} variant="gradient-info" className="rounded-full">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {loading ? "Uploading..." : "Next: Add KPIs"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleKPISubmit} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center text-sm text-blue-800">
                <span>Period Start: <strong>{format(formData.periodStart, "PPP")}</strong></span>
                <span>Period End: <strong>{format(formData.periodEnd, "PPP")}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="totalRevenue">Total Revenue</Label>
                <Input
                  id="totalRevenue"
                  type="number"
                  value={formData.totalRevenue}
                  onChange={(e) => setFormData({ ...formData, totalRevenue: e.target.value })}
                  className="rounded-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="netProfit">Net Profit</Label>
                <Input
                  id="netProfit"
                  type="number"
                  value={formData.netProfit}
                  onChange={(e) => setFormData({ ...formData, netProfit: e.target.value })}
                  className="rounded-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cashFlowNet">Cash Flow Net</Label>
                <Input
                  id="cashFlowNet"
                  type="number"
                  value={formData.cashFlowNet}
                  onChange={(e) => setFormData({ ...formData, cashFlowNet: e.target.value })}
                  className="rounded-full"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full">Back</Button>
              <Button type="submit" disabled={loading} variant="gradient" className="rounded-full">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {loading ? "Submitting..." : "Complete Submission"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
