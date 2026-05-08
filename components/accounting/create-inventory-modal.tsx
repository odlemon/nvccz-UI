"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { createInventoryItem, updateInventoryItem } from "@/lib/store/slices/accountingSlice"
import type { InventoryItem } from "@/lib/api/accounting-api"
import * as yup from "yup"

interface CreateInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // new props for edit
  initialItem?: InventoryItem | null
  isEdit?: boolean
}

// Validation schema — required: itemName, skuNumber, costOfPurchase
const schema = yup.object().shape({
  itemName: yup.string().required("itemName is required"),
  skuNumber: yup.string().required("skuNumber is required"),
  costOfPurchase: yup
    .number()
    .typeError("costOfPurchase must be a number")
    .required("costOfPurchase is required")
    .positive("costOfPurchase must be greater than 0"),
  quantityOnHand: yup.number().integer().min(0).nullable(),
  reorderLevel: yup.number().integer().min(0).nullable(),
  unitOfMeasure: yup.string().nullable(),
  vendorId: yup.string().nullable(),
  description: yup.string().nullable()
})

export function CreateInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialItem = null,
  isEdit = false
}: CreateInventoryModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { vendors } = useSelector((s: RootState) => s.accounting)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    itemName: '',
    skuNumber: '',
    description: '',
    costOfPurchase: '',
    quantityOnHand: '0',
    reorderLevel: '0',
    unitOfMeasure: 'pieces',
    vendorId: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  // human-friendly form-level error (shown under title, not as a JSON snackbar)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (initialItem) {
      setForm({
        itemName: initialItem.itemName || '',
        skuNumber: initialItem.skuNumber || '',
        description: initialItem.description || '',
        costOfPurchase: initialItem.costOfPurchase ? String(initialItem.costOfPurchase) : '',
        quantityOnHand: initialItem.quantityOnHand ? String(initialItem.quantityOnHand) : '0',
        reorderLevel: initialItem.reorderLevel ? String(initialItem.reorderLevel) : '0',
        unitOfMeasure: initialItem.unitOfMeasure || 'pieces',
        vendorId: initialItem.supplier?.id || (initialItem.supplierId || '')
      })
      setErrors({})
     setFormError(null)
    } else {
      // reset when no initial item (create mode)
      setForm({
        itemName: '',
        skuNumber: '',
        description: '',
        costOfPurchase: '',
        quantityOnHand: '0',
        reorderLevel: '0',
        unitOfMeasure: 'pieces',
        vendorId: ''
      })
      setErrors({})
     setFormError(null)
    }
  }, [initialItem, isOpen])

  const reset = () => {
    setForm({
      itemName: '',
      skuNumber: '',
      description: '',
      costOfPurchase: '',
      quantityOnHand: '0',
      reorderLevel: '0',
      unitOfMeasure: 'pieces',
      vendorId: ''
    })
    setErrors({})
   setFormError(null)
  }

  // validate a single field and set inline error
  const validateField = async (name: string, value: any, newForm: any) => {
    try {
      // Use partial validate by validating full schema but catching only the named field
      await schema.validateAt(name, newForm)
      setErrors(prev => ({ ...prev, [name]: '' }))
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [name]: err?.message || 'Invalid value' }))
    }
  }

  const handleChange = (name: string, value: any) => {
    const newForm = { ...form, [name]: value }
    setForm(newForm)
    // validate that single field immediately
    validateField(name, value, newForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Validate full form; abortEarly:false to collect all validation errors
      await schema.validate(
        {
          itemName: form.itemName,
          skuNumber: form.skuNumber,
          description: form.description,
          costOfPurchase: form.costOfPurchase === '' ? undefined : Number(form.costOfPurchase),
          quantityOnHand: form.quantityOnHand === '' ? undefined : Number(form.quantityOnHand),
          reorderLevel: form.reorderLevel === '' ? undefined : Number(form.reorderLevel),
          unitOfMeasure: form.unitOfMeasure,
          vendorId: form.vendorId || undefined
        },
        { abortEarly: false }
      )
      // Clear errors if validation passes
      setErrors({})
     setFormError(null)

      setLoading(true)
      if (isEdit && initialItem) {
        // Update path
        await dispatch(updateInventoryItem({
          id: initialItem.id,
          data: {
            itemName: form.itemName,
            skuNumber: form.skuNumber || undefined,
            description: form.description || undefined,
            costOfPurchase: parseFloat(form.costOfPurchase),
            quantityOnHand: parseInt(form.quantityOnHand || '0'),
            reorderLevel: parseInt(form.reorderLevel || '0'),
            unitOfMeasure: form.unitOfMeasure,
            vendorId: form.vendorId || undefined
          }
        })).unwrap()
        toast.success('Inventory item updated')
      } else {
        // Create path — matches provided curl fields (no inventoryAssetAccount)
        await dispatch(createInventoryItem({
          itemName: form.itemName,
          skuNumber: form.skuNumber || undefined,
          description: form.description || undefined,
          costOfPurchase: parseFloat(form.costOfPurchase),
          quantityOnHand: parseInt(form.quantityOnHand || '0'),
          reorderLevel: parseInt(form.reorderLevel || '0'),
          unitOfMeasure: form.unitOfMeasure,
          vendorId: form.vendorId || undefined
        })).unwrap()
        toast.success('Inventory item created')
        reset()
      }
      onSuccess()
    } catch (err: any) {
      // If validation error from yup, set humanized form-level error and inline field errors (no JSON snackbar)
      if (err?.name === 'ValidationError' && Array.isArray(err.inner)) {
        const failedPaths = Array.from(new Set(err.inner.map((i: any) => i.path).filter(Boolean)))
        const missing = failedPaths.filter((p) => {
          const msg = err.inner.find((i: any) => i.path === p)?.message || ''
          return /required/i.test(msg)
        })
        const toReport = missing.length > 0 ? missing : failedPaths
        if (toReport.length > 0) {
          // set a human readable form-level error (displayed under the dialog title)
          setFormError(`Missing required fields: ${toReport.join(', ')}`)
          // set inline errors for the fields
          const newErrors: Record<string, string> = {}
          err.inner.forEach((i: any) => {
            if (i.path) newErrors[i.path] = i.message
          })
          setErrors(prev => ({ ...prev, ...newErrors }))
          return
        }
      }

      // fallback - non-validation errors (show snackbar)
      setFormError(null)
      toast.error(err?.message || (isEdit ? 'Failed to update inventory item' : 'Failed to create inventory item'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl">
        <DialogHeader>
          {/* dynamic title instead of fixed "Create Inventory Item" */}
          <DialogTitle>{isEdit ? 'Edit Inventory Item' : 'New Inventory Item'}</DialogTitle>
        </DialogHeader>

       {/* Human-readable form-level error (no JSON) */}
       {formError && <div className="px-6 text-sm text-red-600 mb-2">{formError}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={form.itemName}
                onChange={(e) => handleChange('itemName', e.target.value)}
                className="rounded-full"
              />
              {errors.itemName && <p className="text-xs text-red-600 mt-1">{errors.itemName}</p>}
            </div>
            <div>
              <Label>SKU *</Label>
              <Input
                value={form.skuNumber}
                onChange={(e) => handleChange('skuNumber', e.target.value)}
                className="rounded-full"
              />
              {errors.skuNumber && <p className="text-xs text-red-600 mt-1">{errors.skuNumber}</p>}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} className="rounded-xl" />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cost *</Label>
              <Input type="number" step="0.01" value={form.costOfPurchase} onChange={(e) => handleChange('costOfPurchase', e.target.value)} className="rounded-full" />
              {errors.costOfPurchase && <p className="text-xs text-red-600 mt-1">{errors.costOfPurchase}</p>}
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={form.quantityOnHand} onChange={(e) => handleChange('quantityOnHand', e.target.value)} className="rounded-full" />
              {errors.quantityOnHand && <p className="text-xs text-red-600 mt-1">{errors.quantityOnHand}</p>}
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input type="number" value={form.reorderLevel} onChange={(e) => handleChange('reorderLevel', e.target.value)} className="rounded-full" />
              {errors.reorderLevel && <p className="text-xs text-red-600 mt-1">{errors.reorderLevel}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Unit</Label>
              <Input value={form.unitOfMeasure} onChange={(e) => handleChange('unitOfMeasure', e.target.value)} className="rounded-full" />
              {errors.unitOfMeasure && <p className="text-xs text-red-600 mt-1">{errors.unitOfMeasure}</p>}
            </div>

            <div>
              <Label>Supplier</Label>
              <Select value={form.vendorId} onValueChange={(v) => handleChange('vendorId', v)}>
                <SelectTrigger className="rounded-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.vendorId && <p className="text-xs text-red-600 mt-1">{errors.vendorId}</p>}
            </div>

            {/* Inventory Account removed per request (API payload does not require it) */}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-10 px-6">Cancel</Button>

            <Button
              type="submit"
              disabled={loading}
              variant={isEdit ? "gradient-update" : "gradient-create"}
              className="rounded-full flex items-center h-10 px-6"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />}
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
