"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Box,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { calculateCogs, postInventoryAdjustment, fetchStockMovements, postStockMovement, fetchInventoryItem } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { StockMovementModal } from "./stock-movement-modal"
import type { StockMovement, InventoryItem } from "@/lib/api/accounting-api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface InventoryViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  onItemUpdated?: () => void
}

export function InventoryViewDrawer({ isOpen, onClose, onItemUpdated }: InventoryViewDrawerProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { cogsResult, cogsLoading, adjustmentLoading } = useSelector((s: RootState) => s.accounting)
  const { selectedInventoryItem, stockMovements, stockMovementsLoading } = useSelector((s: RootState) => s.accounting)

  const [activeTab, setActiveTab] = useState<'details'|'movements'>('details')
  const [isMovementOpen, setIsMovementOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null)
  const [isCogsOpen, setIsCogsOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [cogsForm, setCogsForm] = useState({ quantity: '0', method: 'FIFO' })
  const [adjustForm, setAdjustForm] = useState({ adjustmentQuantity: '0', reason: '', notes: '' })

  useEffect(() => {
    if (selectedInventoryItem && activeTab === 'movements') {
      dispatch(fetchStockMovements(selectedInventoryItem.id))
    }
  }, [selectedInventoryItem, activeTab, dispatch])

  if (!selectedInventoryItem) return null

  const item: InventoryItem = selectedInventoryItem

  const formatCurrency = (v?: string | number) => {
    if (v === undefined || v === null || v === '') return '—'
    const num = typeof v === 'string' ? parseFloat(v) : v
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num)
  }

  const handleOpenMovement = () => {
    setIsMovementOpen(true)
  }

  const handleMovementSuccess = () => {
    setIsMovementOpen(false)
    if (item) {
      dispatch(fetchStockMovements(item.id))
      dispatch(fetchInventoryItem(item.id))
    }
    if (onItemUpdated) onItemUpdated()
  }

  const handleCalculateCogs = async () => {
    if (!item) return
    try {
      await dispatch(calculateCogs({ itemId: item.id, quantity: Number(cogsForm.quantity), method: cogsForm.method as any })).unwrap()
      toast.success('COGS calculated')
      setIsCogsOpen(false)
      if (onItemUpdated) onItemUpdated()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to calculate COGS')
    }
  }

  const handleAdjustment = async () => {
    if (!item) return
    try {
      await dispatch(postInventoryAdjustment({
        itemId: item.id,
        adjustmentQuantity: Number(adjustForm.adjustmentQuantity),
        reason: adjustForm.reason,
        notes: adjustForm.notes || undefined
      })).unwrap()
      toast.success('Stock adjustment recorded')
      setIsAdjustOpen(false)
      // refresh item and movements
      dispatch(fetchStockMovements(item.id))
      dispatch(fetchInventoryItem(item.id))
      if (onItemUpdated) onItemUpdated()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post adjustment')
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Box className="w-6 h-6" />
                <div>
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-xs text-gray-500">{item.skuNumber || '—'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn(item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-3 px-6">
            <Button
              onClick={handleOpenMovement}
              variant="gradient-create"
              className="rounded-full h-8 px-4"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Movement
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              size="sm"
              className="rounded-full h-8 px-4"
            >
              Close
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-6 px-6">
            <div className="flex space-x-1 border-b">
              <button
                onClick={() => setActiveTab('details')}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm transition-all", activeTab === 'details' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 border-b-2 border-transparent")}
              >
                <Package className="w-4 h-4" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('movements')}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm transition-all", activeTab === 'movements' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 border-b-2 border-transparent")}
              >
                <Clock className="w-4 h-4" />
                Movements
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6 px-6 space-y-6 pb-8">
            {activeTab === 'details' && (
              <>
                <Card className="shadow-sm">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Item Information</CardTitle>
                    <div className="text-xs text-gray-500">Created: {format(new Date(item.createdAt), 'MMM dd, yyyy')}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-gray-900">SKU</h4>
                        <p className="font-mono text-blue-600">{item.skuNumber || '—'}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-900">Quantity On Hand</h4>
                        <p className="font-bold">{item.quantityOnHand}</p>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-gray-900">Description</h4>
                        <p>{item.description || '—'}</p>
                      </div>

                      <div>
                        <h4 className="text-gray-900">Cost</h4>
                        <p className="font-bold text-green-600">{formatCurrency(item.costOfPurchase)}</p>
                      </div>

                      <div>
                        <h4 className="text-gray-900">Reorder Level</h4>
                        <p>{item.reorderLevel || '0'}</p>
                      </div>

                      <div>
                        <h4 className="text-gray-900">Unit</h4>
                        <p>{item.unitOfMeasure || '—'}</p>
                      </div>

                      <div>
                        <h4 className="text-gray-900">Supplier</h4>
                        <p>{item.supplier?.name || '—'}</p>
                      </div>

                      <div>
                        <h4 className="text-gray-900">Inventory Account</h4>
                        <p>{item.inventoryAssetAccount ? `${item.inventoryAssetAccount.accountNo} - ${item.inventoryAssetAccount.accountName}` : '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'movements' && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Stock Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  {stockMovementsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
                      {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded mb-2" />)}
                    </div>
                  ) : (!stockMovements || stockMovements.length === 0) ? (
                    <div className="text-center py-8">
                      <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No stock movements found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 text-sm text-gray-700">Date</th>
                            <th className="text-left p-3 text-sm text-gray-700">Type</th>
                            <th className="text-right p-3 text-sm text-gray-700">Qty</th>
                            <th className="text-right p-3 text-sm text-gray-700">Unit Cost</th>
                            <th className="text-right p-3 text-sm text-gray-700">Total Cost</th>
                            <th className="text-left p-3 text-sm text-gray-700">Reference</th>
                            <th className="text-left p-3 text-sm text-gray-700">Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockMovements.map((m: StockMovement) => (
                            <tr key={m.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono">{m.createdAt ? format(new Date(m.createdAt), 'MMM dd, yyyy') : '—'}</td>
                              <td className="p-3">{m.movementType}</td>
                              <td className="p-3 text-right">{m.quantity}</td>
                              <td className="p-3 text-right">{m.unitCost ? formatCurrency(m.unitCost) : '—'}</td>
                              <td className="p-3 text-right">{m.totalCost ? formatCurrency(m.totalCost) : '—'}</td>
                              <td className="p-3">{m.reference || m.description || '—'}</td>
                              <td className="p-3">{m.createdBy ? `${m.createdBy.firstName} ${m.createdBy.lastName}` : '—'}</td>
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

      <StockMovementModal
        isOpen={isMovementOpen}
        onClose={() => setIsMovementOpen(false)}
        itemId={item.id}
        onSuccess={handleMovementSuccess}
      />

      {/* COGS Modal */}
      {isCogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Calculate COGS</h3>
            <div className="space-y-3">
              <div>
                <Label>Quantity</Label>
                <Input value={cogsForm.quantity} onChange={e=>setCogsForm({...cogsForm, quantity:e.target.value})} />
              </div>
              <div>
                <Label>Method</Label>
                <select value={cogsForm.method} onChange={e=>setCogsForm({...cogsForm, method: e.target.value})} className="w-full rounded-full p-2 border">
                  <option value="FIFO">FIFO</option>
                  <option value="LIFO">LIFO</option>
                  <option value="AVERAGE">AVERAGE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setIsCogsOpen(false)} className="rounded-full h-10 px-6">Cancel</Button>
                <Button onClick={handleCalculateCogs} disabled={cogsLoading} variant="gradient-info" className="rounded-full h-10 px-6">
                  {cogsLoading ? 'Calculating...' : 'Calculate'}
                </Button>
              </div>
              {cogsResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div>Unit Cost: {cogsResult.unitCost}</div>
                  <div>Total Cost: {cogsResult.totalCost}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Stock Adjustment</h3>
            <div className="space-y-3">
              <div>
                <Label>Adjustment Quantity</Label>
                <Input value={adjustForm.adjustmentQuantity} onChange={e=>setAdjustForm({...adjustForm, adjustmentQuantity: e.target.value})} />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={adjustForm.reason} onChange={e=>setAdjustForm({...adjustForm, reason: e.target.value})} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={adjustForm.notes} onChange={e=>setAdjustForm({...adjustForm, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setIsAdjustOpen(false)} className="rounded-full h-10 px-6">Cancel</Button>
                <Button onClick={handleAdjustment} disabled={adjustmentLoading} variant="gradient-update" className="rounded-full h-10 px-6">
                  {adjustmentLoading ? 'Saving...' : 'Save Adjustment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
