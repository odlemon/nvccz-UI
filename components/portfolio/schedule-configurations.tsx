"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  Edit, 
  Trash2, 
  Settings2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Settings
} from "lucide-react"
import {
  fetchScheduleConfigs,
  deleteScheduleConfig,
  setCurrentConfig
} from "@/lib/store/slices/portfolioReportingSlice"
import { ReportingScheduleConfig } from "@/lib/api/portfolio-reporting-api"
import { ScheduleConfigModal } from "./schedule-config-modal"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

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

export function ScheduleConfigurations() {
  const dispatch = useAppDispatch()
  const { canPerformAction } = useRolePermissions()
  const { configs, loading } = useAppSelector(state => state.portfolioReporting)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ReportingScheduleConfig | null>(null)

  const canManage = canPerformAction('full', 'create') // Using full access for simplicity

  useEffect(() => {
    dispatch(fetchScheduleConfigs())
  }, [dispatch])

  const handleCreate = () => {
    setSelectedConfig(null)
    setIsModalOpen(true)
  }

  const handleEdit = (config: ReportingScheduleConfig) => {
    setSelectedConfig(config)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this configuration? This may affect ongoing reporting cycles.")) {
      try {
        await dispatch(deleteScheduleConfig(id)).unwrap()
        toast.success("Configuration deleted successfully")
      } catch (error: any) {
        toast.error(error || "Failed to delete configuration")
      }
    }
  }

  if (loading && configs.length === 0) {
    return <ScheduleConfigsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporting Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Manage automation rules for portfolio company reporting cycles.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
            <Plus className="w-4 h-4 mr-2" />
            New Configuration
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(configs) && configs.map((config) => (
          <Card key={config.id} className="group overflow-hidden border-blue-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{config.name}</CardTitle>
                    {config.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 text-[10px]">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-1">{config.description || "No description"}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleEdit(config)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(config.id)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Frequency</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{config.frequency}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Automation</p>
                  <div className="flex items-center gap-2">
                    {config.autoOpenCalendar ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-sm font-medium">Auto-Open</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Reporting Window</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Opens {config.openCalendarAfterPeriodEndDays}d
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded text-orange-700 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Due {config.dueDateOffsetDaysAfterPeriodEnd}d
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Required Documents</p>
                <div className="flex flex-wrap gap-1.5">
                  {config.defaultAttachmentOptionIds?.slice(0, 3).map((doc, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-normal py-0">
                      {DOC_LABELS[doc] || doc}
                    </Badge>
                  ))}
                  {(config.defaultAttachmentOptionIds?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-[10px] font-normal py-0">
                      +{(config.defaultAttachmentOptionIds?.length || 0) - 3} more
                    </Badge>
                  )}
                  {(!config.defaultAttachmentOptionIds || config.defaultAttachmentOptionIds.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">None specified</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!Array.isArray(configs) || configs.length === 0) && !loading && (
          <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed rounded-xl bg-gray-50/50">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">No configurations found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Create your first reporting schedule to start automating portfolio data collection.
              </p>
            </div>
            <Button onClick={handleCreate} variant="outline" className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Config
            </Button>
          </div>
        )}
      </div>

      <ScheduleConfigModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={selectedConfig}
      />
    </div>
  )
}

function ScheduleConfigsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
