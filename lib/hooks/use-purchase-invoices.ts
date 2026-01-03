import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { toast } from 'sonner'
import type { RootState, AppDispatch } from '@/lib/store'
import {
  fetchPurchaseInvoices,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  submitPurchaseInvoice,
  payPurchaseInvoice,
  fetchPurchaseInvoiceById,
  setPurchaseInvoiceFilters,
  clearPurchaseInvoiceFilters,
  setSelectedPurchaseInvoice,
  clearPurchaseInvoiceError
} from '@/lib/store/slices/purchase-invoices-slice'
import { CreatePurchaseInvoiceRequest, UpdatePurchaseInvoiceRequest, SubmitPurchaseInvoiceRequest, PayPurchaseInvoiceRequest, PurchaseInvoice } from '@/lib/api/accounting-api'

export const usePurchaseInvoices = () => {
  const dispatch = useDispatch<AppDispatch>()
  
  const purchaseInvoicesState = useSelector((state: RootState) => state.purchaseInvoices)
  
  // Provide default values if state is undefined (during initial load)
  const {
    purchaseInvoices = [],
    selectedPurchaseInvoice = null,
    loading = false,
    error = null,
    filters = {},
    stats = {
      total: 0,
      draft: 0,
      posted: 0,
      pending: 0,
      paid: 0,
      totalAmount: 0,
      draftAmount: 0,
      postedAmount: 0,
      pendingAmount: 0,
      paidAmount: 0
    },
    pagination = {
      page: 1,
      limit: 10,
      totalPages: 0,
      total: 0
    }
  } = purchaseInvoicesState || {}

  // Load purchase invoices with filters
  const loadPurchaseInvoices = useCallback(async (newFilters?: any) => {
    try {
      const result = await dispatch(fetchPurchaseInvoices(newFilters)).unwrap()
      return result
    } catch (error: any) {
      toast.error('Failed to load purchase invoices', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Create new purchase invoice
  const handleCreatePurchaseInvoice = useCallback(async (invoiceData: CreatePurchaseInvoiceRequest) => {
    try {
      const result = await dispatch(createPurchaseInvoice(invoiceData)).unwrap()
      toast.success('Purchase invoice created successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to create purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Update existing purchase invoice
  const handleUpdatePurchaseInvoice = useCallback(async (id: string, data: UpdatePurchaseInvoiceRequest) => {
    try {
      const result = await dispatch(updatePurchaseInvoice({ id, data })).unwrap()
      toast.success('Purchase invoice updated successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to update purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Submit purchase invoice
  const handleSubmitPurchaseInvoice = useCallback(async (invoice: PurchaseInvoice, data: SubmitPurchaseInvoiceRequest): Promise<PurchaseInvoice> => {
    if (invoice.status !== 'DRAFT') {
      toast.error('Only draft invoices can be submitted')
      throw new Error('Invalid invoice status')
    }

    try {
      const result = await dispatch(submitPurchaseInvoice({ id: invoice.id, data })).unwrap()
      toast.success('Purchase invoice submitted successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to submit purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Pay purchase invoice
  const handlePayPurchaseInvoice = useCallback(async (invoice: PurchaseInvoice, data: PayPurchaseInvoiceRequest): Promise<PurchaseInvoice> => {
    if (invoice.paymentStatus === 'PAID') {
      toast.error('Invoice is already paid')
      throw new Error('Invalid payment status')
    }

    try {
      const result = await dispatch(payPurchaseInvoice({ id: invoice.id, data })).unwrap()
      toast.success('Purchase invoice paid successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to pay purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Refresh single purchase invoice
  const refreshPurchaseInvoice = useCallback(async (invoiceId: string): Promise<PurchaseInvoice> => {
    try {
      const result = await dispatch(fetchPurchaseInvoiceById(invoiceId)).unwrap()
      return result
    } catch (error: any) {
      toast.error('Failed to refresh purchase invoice', {
        description: error.message || 'Unknown error occurred'
      })
      throw error
    }
  }, [dispatch])

  // Filter management
  const updateFilters = useCallback((newFilters: any) => {
    dispatch(setPurchaseInvoiceFilters(newFilters))
  }, [dispatch])

  const resetFilters = useCallback(() => {
    dispatch(clearPurchaseInvoiceFilters())
  }, [dispatch])

  // Selection management
  const selectPurchaseInvoice = useCallback((invoice: PurchaseInvoice | null) => {
    dispatch(setSelectedPurchaseInvoice(invoice))
  }, [dispatch])

  // Error management
  const clearErrorState = useCallback(() => {
    dispatch(clearPurchaseInvoiceError())
  }, [dispatch])

  return {
    // State
    purchaseInvoices,
    selectedPurchaseInvoice,
    loading,
    error,
    filters,
    stats,
    pagination,
    
    // Actions
    loadPurchaseInvoices,
    handleCreatePurchaseInvoice,
    handleUpdatePurchaseInvoice,
    handleSubmitPurchaseInvoice,
    handlePayPurchaseInvoice,
    refreshPurchaseInvoice,
    updateFilters,
    resetFilters,
    selectPurchaseInvoice,
    clearErrorState
  }
}
