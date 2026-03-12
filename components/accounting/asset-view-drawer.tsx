"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Calculator, 
  Edit2, 
  Trash2,
  TrendingDown,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Asset, DepreciationScheduleItem } from "@/lib/api/accounting-api"
import { accountingApi } from "@/lib/api/accounting-api"
import { CalculateDepreciationModal } from "./calculate-depreciation-modal"
import { DisposeAssetModal } from "./dispose-asset-modal"
import { RevalueAssetModal } from "./revalue-asset-modal"
import { ConfirmationDialog } from "../ui/confirmation-drawer"
import type { AppDispatch } from "@/lib/store"
import { postDepreciation } from "@/lib/store/slices/accountingSlice"
import { useAccountingPermissions } from "@/lib/hooks/useAccountingPermissions"

interface AssetViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  asset: Asset | null
  onAssetUpdated: () => void
}

const tabs = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "depreciation", label: "Depreciation Records", icon: TrendingDown },
  { id: "schedule", label: "Depreciation Schedule", icon: Calculator }
]

export function AssetViewDrawer({ isOpen, onClose, asset, onAssetUpdated }: AssetViewDrawerProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { permissions } = useAccountingPermissions()
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    assetName: '',
    description: '',
    location: '',
    vendor: ''
  })
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationScheduleItem[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [isCalculateModalOpen, setIsCalculateModalOpen] = useState(false)
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false)
  const [isRevalueModalOpen, setIsRevalueModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [isPostConfirmOpen, setIsPostConfirmOpen] = useState(false)
  const [selectedDepreciationId, setSelectedDepreciationId] = useState<string | null>(null)
  const [postingDepreciation, setPostingDepreciation] = useState(false)

  useEffect(() => {
    if (asset) {
      setEditForm({
        assetName: asset.assetName,
        description: asset.description,
        location: asset.location || '',
        vendor: ''
      })
      if (activeTab === "schedule") {
        loadDepreciationSchedule()
      }
    }
  }, [asset, activeTab])

  const loadDepreciationSchedule = async () => {
    if (!asset) return
    
    try {
      setScheduleLoading(true)
      const response = await accountingApi.getDepreciationSchedule(asset.id)
      if (response.success) {
        setDepreciationSchedule(response.data)
      }
    } catch (error) {
      toast.error('Failed to load depreciation schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!asset) return

    try {
      setUpdating(true)
      const response = await accountingApi.updateAsset(asset.id, editForm)
      if (response.success) {
        toast.success('Asset updated successfully')
        setIsEditing(false)
        onAssetUpdated()
      } else {
        toast.error('Failed to update asset')
      }
    } catch (error) {
      toast.error('Failed to update asset')
    } finally {
      setUpdating(false)
    }
  }

  const handlePostDepreciation = (depreciationId: string) => {
    setSelectedDepreciationId(depreciationId)
    setIsPostConfirmOpen(true)
  }

  const confirmPostDepreciation = async () => {
    if (!selectedDepreciationId) return

    try {
      setPostingDepreciation(true)
      await dispatch(postDepreciation(selectedDepreciationId)).unwrap()
      toast.success('Depreciation posted successfully')
      setIsPostConfirmOpen(false)
      setSelectedDepreciationId(null)
      onAssetUpdated()
    } catch (error: any) {
      toast.error('Failed to post depreciation', {
        description: error.message
      })
      // Don't close dialog on error
    } finally {
      setPostingDepreciation(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  if (!asset) return null

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6" />
                {asset.assetName}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  asset.status === 'IN_USE' ? 'bg-green-100 text-green-800' :
                  asset.status === 'DISPOSED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {asset.status.replace('_', ' ')}
                </Badge>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Action Buttons - Top Right */}
          <div className="mt-4 flex justify-end gap-3">
            {permissions.canCalcDepreciation && (
            <Button 
              onClick={() => setIsCalculateModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-sm"
              size="sm"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Depreciation
            </Button>
            )}
            {permissions.canRevalueAsset && (
            <Button 
              onClick={() => setIsRevalueModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-sm"
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Revalue Asset
            </Button>
            )}
            {permissions.canDisposeAsset && (
            <Button 
              variant="outline" 
              onClick={() => setIsDisposeModalOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full shadow-sm"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Dispose Asset
            </Button>
            )}
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
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 border-b-2 border-transparent hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Asset Details */}
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Asset Information</CardTitle>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleUpdate} disabled={updating}>
                            {updating ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Asset Name</Label>
                          <Input
                            value={editForm.assetName}
                            onChange={(e) => setEditForm({...editForm, assetName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={editForm.location}
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-gray-900">Asset Code</h4>
                          <p className="font-mono text-blue-600">{asset.assetCode}</p>
                        </div>
                        <div>
                          <h4 className="text-gray-900">Location</h4>
                          <p className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {asset.location || 'Not specified'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="text-gray-900">Description</h4>
                          <p>{asset.description}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-gray-900">Purchase Cost</h4>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(asset.cost)}</p>
                        <p className="text-sm text-gray-500">
                          Purchased on {format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Current Book Value</h4>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(asset.currentBookValue)}</p>
                        <p className="text-sm text-gray-500">
                          Salvage Value: <span className="font-bold">{formatCurrency(asset.salvageValue)}</span>
                        </p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Depreciation Method</h4>
                        <p>{asset.depreciationMethod.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          Useful Life: {asset.usefulLifeYears} years
                        </p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Created By</h4>
                        <p>{asset.createdBy.firstName} {asset.createdBy.lastName}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(asset.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Account Mapping</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-900">Asset Account</h4>
                        <p>{asset.assetAccount.accountNo} - {asset.assetAccount.accountName}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Accumulated Depreciation Account</h4>
                        <p>{asset.accumulatedDepreciationAccount.accountNo} - {asset.accumulatedDepreciationAccount.accountName}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Depreciation Expense Account</h4>
                        <p>{asset.depreciationExpenseAccount.accountNo} - {asset.depreciationExpenseAccount.accountName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "depreciation" && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Depreciation Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {asset.depreciationRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No depreciation records found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-normal text-gray-700">Period</th>
                            <th className="text-right p-3 font-normal text-gray-700">Depreciation Amount</th>
                            <th className="text-right p-3 font-normal text-gray-700">Accumulated</th>
                            <th className="text-right p-3 font-normal text-gray-700">Book Value</th>
                            <th className="text-center p-3 font-normal text-gray-700">Status</th>
                            <th className="text-center p-3 font-normal text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.depreciationRecords.map((record) => (
                            <tr key={record.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono">{record.period}</td>
                              <td className="p-3 text-right font-bold text-red-600">
                                {formatCurrency(record.depreciationAmount)}
                              </td>
                              <td className="p-3 text-right">{formatCurrency(record.accumulatedDepreciation)}</td>
                              <td className="p-3 text-right font-bold text-green-600">
                                {formatCurrency(record.bookValue)}
                              </td>
                              <td className="p-3 text-center">
                                {record.isPosted ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Posted
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {!record.isPosted && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePostDepreciation(record.id)}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                    disabled={postingDepreciation}
                                  >
                                    {postingDepreciation && selectedDepreciationId === record.id ? (
                                      'Posting...'
                                    ) : (
                                      'Post'
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "schedule" && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Depreciation Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduleLoading ? (
                    <DepreciationScheduleSkeleton />
                  ) : depreciationSchedule.length === 0 ? (
                    <div className="text-center py-8">
                      <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No depreciation schedule available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-normal text-gray-700">Period</th>
                            <th className="text-right p-3 font-normal text-gray-700">Depreciation Amount</th>
                            <th className="text-right p-3 font-normal text-gray-700">Accumulated Depreciation</th>
                            <th className="text-right p-3 font-normal text-gray-700">Book Value</th>
                            <th className="text-center p-3 font-normal text-gray-700">Posted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depreciationSchedule.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono">{item.period}</td>
                              <td className="p-3 text-right font-bold text-red-600">
                                {formatCurrency(item.depreciationAmount)}
                              </td>
                              <td className="p-3 text-right">{formatCurrency(item.accumulatedDepreciation)}</td>
                              <td className="p-3 text-right font-bold text-green-600">
                                {formatCurrency(item.bookValue)}
                              </td>
                              <td className="p-3 text-center">
                                {item.isPosted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Calculate Depreciation Modal */}
      <CalculateDepreciationModal
        isOpen={isCalculateModalOpen}
        onClose={() => setIsCalculateModalOpen(false)}
        asset={asset}
        onSuccess={() => {
          setIsCalculateModalOpen(false)
          onAssetUpdated()
        }}
      />

      {/* Revalue Asset Modal */}
      <RevalueAssetModal
        isOpen={isRevalueModalOpen}
        onClose={() => setIsRevalueModalOpen(false)}
        asset={asset}
        onSuccess={() => {
          setIsRevalueModalOpen(false)
          onAssetUpdated()
        }}
      />

      {/* Dispose Asset Modal */}
      <DisposeAssetModal
        isOpen={isDisposeModalOpen}
        onClose={() => setIsDisposeModalOpen(false)}
        asset={asset}
        onSuccess={() => {
          setIsDisposeModalOpen(false)
          onAssetUpdated()
          onClose()
        }}
      />

      {/* Post Depreciation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isPostConfirmOpen}
        onClose={() => {
          if (!postingDepreciation) {
            setIsPostConfirmOpen(false)
            setSelectedDepreciationId(null)
          }
        }}
        onConfirm={confirmPostDepreciation}
        title="Post Depreciation Entry"
        description="Are you sure you want to post this depreciation entry? This action will create journal entries and cannot be undone."
        confirmText={postingDepreciation ? "Posting..." : "Post Depreciation"}
        cancelText="Cancel"
        variant="default"
        loading={postingDepreciation}
      />
    </>
  )
}

function DepreciationScheduleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3"><div className="h-4 w-16 bg-gray-300 rounded"></div></th>
              <th className="text-right p-3"><div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div></th>
              <th className="text-right p-3"><div className="h-4 w-24 bg-gray-300 rounded ml-auto"></div></th>
              <th className="text-right p-3"><div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div></th>
              <th className="text-center p-3"><div className="h-4 w-12 bg-gray-300 rounded mx-auto"></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b">
                <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-20 bg-red-200 rounded ml-auto"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div></td>
                <td className="p-3 text-right"><div className="h-4 w-20 bg-green-200 rounded ml-auto"></div></td>
                <td className="p-3 text-center"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
