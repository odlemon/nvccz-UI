"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchApplicantDrawdown
} from "@/lib/store/slices/procurementV2Slice"
import { PurchaseRequisition } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { ApplicantRequisitionDrawer } from "./applicant-requisition-drawer"
import { CreateApplicantRequisitionModal } from "./create-applicant-requisition-modal"
import { cn } from "@/lib/utils"
import { CiFileOn, CiUser, CiCalendar, CiDollar } from "react-icons/ci"
import { Plus, Eye, X, TrendingUp } from "lucide-react"
import { toast } from "sonner"

type TabId = 'overview' | 'requests'

interface TabConfig {
  id: TabId
  label: string
  icon: any
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'requests', label: 'My Requests', icon: CiFileOn },
]

export function ApplicantDrawdownPage() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingRequisition, setViewingRequisition] = useState<PurchaseRequisition | null>(null)

  const {
    applicantDrawdown,
    applicantDrawdownLoading
  } = useAppSelector(state => state.procurementV2)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await dispatch(fetchApplicantDrawdown()).unwrap()
    } catch (error: any) {
      toast.error("Error loading drawdown data", { description: error.message })
    }
  }

  const handleViewRequisition = (requisition: PurchaseRequisition) => {
    setViewingRequisition(requisition)
    setIsDrawerOpen(true)
  }

  const handleCreateClick = () => {
    setIsCreateModalOpen(true)
  }

  const columns: Column<PurchaseRequisition>[] = [
    {
      key: 'requisitionNumber',
      label: 'Requisition # / Title',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CiFileOn className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{value}</span>
          </div>
          <span className="text-sm text-muted-foreground">{row.title}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status & Progress',
      sortable: true,
      render: (value, row) => {
        const statusOrder = ['DRAFT', 'PENDING_APPROVAL', 'PENDING_VC_EXECUTIVE_REVIEW', 'APPROVED', 'CONVERTED_TO_PO']
        const currentIndex = statusOrder.indexOf(value)
        const progress = currentIndex === -1 ? 0 : Math.round((currentIndex / (statusOrder.length - 1)) * 100)

        const statusColors: Record<string, string> = {
          'DRAFT': 'bg-gray-100 text-gray-800',
          'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
          'PENDING_VC_EXECUTIVE_REVIEW': 'bg-violet-100 text-violet-800',
          'APPROVED': 'bg-green-100 text-green-800',
          'CONVERTED_TO_PO': 'bg-blue-100 text-blue-800',
        }

        return (
          <div className="space-y-2">
            <Badge className={statusColors[value] || 'bg-gray-100 text-gray-800'}>
              {value.replace('_', ' ')}
            </Badge>
            <div className="w-full">
              <Progress value={progress} className="h-1" />
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <CiCalendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    }
  ]

  const requisitions = applicantDrawdown?.requisitions || []
  const totalInvestmentAward = parseFloat(applicantDrawdown?.totalInvestmentAward || '0')
  const committed = parseFloat(applicantDrawdown?.committed || '0')
  const reserved = parseFloat(applicantDrawdown?.reserved || '0')
  const available = parseFloat(applicantDrawdown?.available || '0')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drawdown Requests</h1>
          <p className="text-muted-foreground">Manage your fund drawdown requests and track approval status</p>
        </div>
      </div>

      {/* Drawdown Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-amber-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Total Award</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white font-bold">
              ${totalInvestmentAward.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 mt-1">Total investment awarded</p>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-blue-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Committed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white font-bold">
              ${committed.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 mt-1">Already disbursed</p>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-orange-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Reserved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white font-bold">
              ${reserved.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 mt-1">Pending drawdown</p>
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-emerald-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CiDollar size={20} className="text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-white">Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white font-bold">
              ${available.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 mt-1">Ready to draw down</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center border-b">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-lg font-medium border-b-2 transition-all duration-200",
                    isActive
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Approved Purchase Requisitions</h3>
                <Card>
                  <CardContent className="pt-6">
                    {applicantDrawdown?.ledgerApprovedPrs && applicantDrawdown.ledgerApprovedPrs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">PR Number</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applicantDrawdown.ledgerApprovedPrs.map((pr: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 text-blue-600 font-medium">{pr.requisitionNumber}</td>
                                <td className="py-3 px-4">{pr.title}</td>
                                <td className="py-3 px-4 font-medium">${(pr.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                                <td className="py-3 px-4 text-gray-600">{new Date(pr.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No approved purchase requisitions yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateClick}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Drawdown Request
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <ProcurementDataTable
                    data={requisitions}
                    columns={columns}
                    title=""
                    onView={handleViewRequisition}
                    loading={applicantDrawdownLoading}
                    emptyMessage="No drawdown requests yet. Create your first request to get started."
                    showSearch={false}
                    showFilters={false}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* View Drawer */}
      {viewingRequisition && (
        <ApplicantRequisitionDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          requisition={viewingRequisition}
          onSuccess={loadData}
        />
      )}

      {/* Create Modal */}
      <CreateApplicantRequisitionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadData()
        }}
      />
    </div>
  )
}
