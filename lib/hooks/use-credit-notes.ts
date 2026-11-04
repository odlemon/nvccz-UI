import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import type { RootState, AppDispatch } from '@/lib/store/store'
import type { CreditNote, CreateCreditNoteRequest } from '@/lib/api/accounting-api'
import { 
  fetchCreditNotes,
  fetchCreditNote,
  createCreditNote,
  sendCreditNote,
  applyCreditNote,
  deleteCreditNote,
  setSelectedCreditNote,
  clearSelectedCreditNote,
  clearCreditNotesError
} from '@/lib/store/slices/accountingSlice'

export function useCreditNotes() {
  const dispatch = useDispatch<AppDispatch>()
  
  const {
    creditNotes,
    creditNotesLoading,
    creditNotesError,
    selectedCreditNote,
    selectedCreditNoteLoading,
    selectedCreditNoteError
  } = useSelector((state: RootState) => state.accounting)

  // Load credit notes with optional filters
  const loadCreditNotes = useCallback(async (filters?: { status?: string; currencyId?: string; page?: number; limit?: number }) => {
    try {
      await dispatch(fetchCreditNotes(filters)).unwrap()
    } catch (error: any) {
      toast.error('Failed to load credit notes', {
        description: error.message
      })
    }
  }, [dispatch])

  // Load single credit note
  const loadCreditNote = useCallback(async (id: string) => {
    try {
      await dispatch(fetchCreditNote(id)).unwrap()
    } catch (error: any) {
      toast.error('Failed to load credit note', {
        description: error.message
      })
    }
  }, [dispatch])

  // Create new credit note
  const handleCreateCreditNote = useCallback(async (data: CreateCreditNoteRequest) => {
    try {
      const result = await dispatch(createCreditNote(data)).unwrap()
      toast.success('Credit note created successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to create credit note', {
        description: error.message
      })
      throw error
    }
  }, [dispatch])

  // Send credit note to customer
  const handleSendCreditNote = useCallback(async (creditNote: CreditNote) => {
    try {
      const result = await dispatch(sendCreditNote(creditNote.id)).unwrap()
      toast.success('Credit note sent successfully')
      return result
    } catch (error: any) {
      toast.error('Failed to send credit note', {
        description: error.message
      })
      throw error
    }
  }, [dispatch])

  // Apply credit note to invoice
  const handleApplyCreditNote = useCallback(async (creditNote: CreditNote, data: { invoiceId: string, amount: number }) => {
    try {
      await dispatch(applyCreditNote({ id: creditNote.id, data })).unwrap()
      toast.success('Credit note applied successfully')
    } catch (error: any) {
      toast.error('Failed to apply credit note', {
        description: error.message
      })
      throw error
    }
  }, [dispatch])

  // Delete credit note
  const handleDeleteCreditNote = useCallback(async (creditNote: CreditNote) => {
    try {
      await dispatch(deleteCreditNote(creditNote.id)).unwrap()
      toast.success('Credit note deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete credit note', {
        description: error.message
      })
      throw error
    }
  }, [dispatch])

  // Select credit note for viewing
  const selectCreditNote = useCallback((creditNote: CreditNote | null) => {
    dispatch(setSelectedCreditNote(creditNote))
  }, [dispatch])

  // Clear selected credit note
  const clearSelected = useCallback(() => {
    dispatch(clearSelectedCreditNote())
  }, [dispatch])

  // Clear error state
  const clearError = useCallback(() => {
    dispatch(clearCreditNotesError())
  }, [dispatch])

  // Refresh selected credit note
  const refreshCreditNote = useCallback(async () => {
    if (selectedCreditNote) {
      await loadCreditNote(selectedCreditNote.id)
    }
  }, [selectedCreditNote, loadCreditNote])

  return {
    // State
    creditNotes,
    selectedCreditNote,
    loading: creditNotesLoading,
    selectedLoading: selectedCreditNoteLoading,
    error: creditNotesError,
    selectedError: selectedCreditNoteError,
    
    // Actions
    loadCreditNotes,
    loadCreditNote,
    handleCreateCreditNote,
    handleSendCreditNote,
    handleApplyCreditNote,
    handleDeleteCreditNote,
    selectCreditNote,
    clearSelected,
    clearError,
    refreshCreditNote
  }
}
