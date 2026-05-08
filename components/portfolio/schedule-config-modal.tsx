"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportingScheduleConfig, CreateReportingScheduleRequest, ReportingFrequency } from "@/lib/api/portfolio-reporting-api"
import { createScheduleConfig, updateScheduleConfig } from "@/lib/store/slices/portfolioReportingSlice"
import { toast } from "sonner"
import { Calendar, Info, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ScheduleConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config?: ReportingScheduleConfig | null
}

const MONTHS = [
  { id: 1, name: "January" },
  { id: 2, name: "February" },
  { id: 3, name: "March" },
  { id: 4, name: "April" },
  { id: 5, name: "May" },
  { id: 6, name: "June" },
  { id: 7, name: "July" },
  { id: 8, name: "August" },
  { id: 9, name: "September" },
  { id: 10, name: "October" },
  { id: 11, name: "November" },
  { id: 12, name: "December" },
]

const COMMON_DOCUMENTS = [
  "INCOME_STATEMENT",
  "STATEMENT_OF_FINANCIAL_POSITION",
  "CASH_FLOW_STATEMENT",
  "MANAGEMENT_ACCOUNTS",
  "BANK_STATEMENTS",
  "TAX_COMPLIANCE",
  "VAT_RETURNS",
  "PAYROLL_SUMMARY",
  "AGED_DEBTORS_REPORT",
  "AGED_CREDITORS_REPORT",
  "BUSINESS_PLAN",
  "BOARD_MINUTES",
  "INSURANCE_CERTIFICATES",
  "SHAREHOLDERS_CERTIFICATES",
  "MNE_REPORT"
]

const DOC_LABELS: Record<string, string> = {
  "INCOME_STATEMENT": "Income Statement",
  "STATEMENT_OF_FINANCIAL_POSITION": "Balance Sheet (Position)",
  "CASH_FLOW_STATEMENT": "Cash Flow Statement",
  "MANAGEMENT_ACCOUNTS": "Management Accounts",
  "BANK_STATEMENTS": "Bank Statements",
  "TAX_COMPLIANCE": "Tax Compliance",
  "VAT_RETURNS": "VAT Returns",
  "PAYROLL_SUMMARY": "Payroll Summary",
  "AGED_DEBTORS_REPORT": "Aged Debtors",
  "AGED_CREDITORS_REPORT": "Aged Creditors",
  "BUSINESS_PLAN": "Business Plan",
  "BOARD_MINUTES": "Board Minutes",
  "INSURANCE_CERTIFICATES": "Insurance Certificates",
  "SHAREHOLDERS_CERTIFICATES": "Shareholders Certificates",
  "MNE_REPORT": "M&E Report"
}

export function ScheduleConfigModal({ isOpen, onClose, config }: ScheduleConfigModalProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [newAttachment, setNewAttachment] = useState("")
  const [formData, setFormData] = useState<CreateReportingScheduleRequest>({
    name: "",
    description: "",
    frequency: "MONTHLY",
    autoOpenCalendar: true,
    dueDateOffsetDaysAfterPeriodEnd: 10,
    openCalendarAfterPeriodEndDays: 0,
    defaultAttachmentOptionIds: ["Balance Sheet", "Income Statement", "Cashflow Statement"],
    customMonthEnds: [],
  })

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        description: config.description || "",
        frequency: config.frequency,
        autoOpenCalendar: config.autoOpenCalendar,
        dueDateOffsetDaysAfterPeriodEnd: config.dueDateOffsetDaysAfterPeriodEnd,
        openCalendarAfterPeriodEndDays: config.openCalendarAfterPeriodEndDays,
        defaultAttachmentOptionIds: config.defaultAttachmentOptionIds || [],
        customMonthEnds: config.customMonthEnds || [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        frequency: "MONTHLY",
        autoOpenCalendar: true,
        dueDateOffsetDaysAfterPeriodEnd: 10,
        openCalendarAfterPeriodEndDays: 0,
        defaultAttachmentOptionIds: ["Balance Sheet", "Income Statement", "Cashflow Statement"],
        customMonthEnds: [],
      })
    }
  }, [config, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (config) {
        await dispatch(updateScheduleConfig({ id: config.id, data: formData })).unwrap()
        toast.success("Schedule configuration updated successfully")
      } else {
        await dispatch(createScheduleConfig(formData)).unwrap()
        toast.success("Schedule configuration created successfully")
      }
      onClose()
    } catch (error: any) {
      toast.error(error || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleMonth = (monthId: number) => {
    setFormData(prev => {
      const customMonthEnds = prev.customMonthEnds || []
      if (customMonthEnds.includes(monthId)) {
        return { ...prev, customMonthEnds: customMonthEnds.filter(m => m !== monthId) }
      } else {
        return { ...prev, customMonthEnds: [...customMonthEnds, monthId].sort((a, b) => a - b) }
      }
    })
  }

  const addAttachmentOption = (val: string) => {
    if (val && !(formData.defaultAttachmentOptionIds || []).includes(val)) {
      setFormData(prev => ({
        ...prev,
        defaultAttachmentOptionIds: [...(prev.defaultAttachmentOptionIds || []), val]
      }))
    }
  }

  const removeAttachmentOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      defaultAttachmentOptionIds: (prev.defaultAttachmentOptionIds || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            {config ? "Edit Schedule Config" : "New Schedule Config"}
          </DialogTitle>
          <DialogDescription>
            Configure how and when reporting calendars should open for portfolio companies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                placeholder="e.g. Standard Monthly Reporting"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this schedule..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(val: ReportingFrequency) => setFormData({ ...formData, frequency: val })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="autoOpen"
                  checked={formData.autoOpenCalendar}
                  onCheckedChange={checked => setFormData({ ...formData, autoOpenCalendar: checked })}
                />
                <Label htmlFor="autoOpen">Auto Open Calendar</Label>
              </div>
            </div>

            {formData.frequency === "CUSTOM" && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Select Reporting Month Ends
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map(month => (
                    <button
                      key={month.id}
                      type="button"
                      onClick={() => toggleMonth(month.id)}
                      className={cn(
                        "px-2 py-1.5 text-xs rounded-md border transition-all",
                        formData.customMonthEnds?.includes(month.id)
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                      )}
                    >
                      {month.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openOffset">Open Calendar Offset (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="openOffset"
                    type="number"
                    value={formData.openCalendarAfterPeriodEndDays}
                    onChange={e => setFormData({ ...formData, openCalendarAfterPeriodEndDays: parseInt(e.target.value) })}
                  />
                  <Badge variant="outline" className="whitespace-nowrap">
                    {formData.openCalendarAfterPeriodEndDays < 0 ? "Before end" : formData.openCalendarAfterPeriodEndDays === 0 ? "On end" : "After end"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" /> Days relative to period end date.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueOffset">Due Date Offset (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="dueOffset"
                    type="number"
                    value={formData.dueDateOffsetDaysAfterPeriodEnd}
                    onChange={e => setFormData({ ...formData, dueDateOffsetDaysAfterPeriodEnd: parseInt(e.target.value) })}
                    min={0}
                  />
                  <Badge variant="outline" className="whitespace-nowrap">After end</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" /> Reporting deadline after period end.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Required Documents</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={addAttachmentOption}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select document to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DOCUMENTS.filter(doc => !(formData.defaultAttachmentOptionIds || []).includes(doc)).map(doc => (
                      <SelectItem key={doc} value={doc}>
                        {DOC_LABELS[doc] || doc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.defaultAttachmentOptionIds || []).map((option, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-2 group">
                    {DOC_LABELS[option] || option}
                    <button type="button" onClick={() => removeAttachmentOption(idx)} className="hover:text-red-600 opacity-50 group-hover:opacity-100">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {formData.defaultAttachmentOptionIds?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No required documents added.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={loading} className="min-w-[120px]">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                config ? "Update Config" : "Create Config"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
