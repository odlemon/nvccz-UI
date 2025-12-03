"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { 
  CiTrash,
  CiWarning
} from "react-icons/ci"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  itemName: string
  isLoading?: boolean
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset internal loading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (isDeleting || isLoading) return // Prevent multiple clicks
    
    console.log('Starting delete operation...')
    setIsDeleting(true)
    try {
      await onConfirm()
      console.log('Delete operation completed')
      // Modal will be closed by parent component after successful deletion
    } catch (error) {
      console.error('Delete failed:', error)
      // Reset loading state on error so user can retry
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(isDeleting || isLoading) ? undefined : onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <CiWarning className="w-6 h-6 text-white" />
            </div>
            <div>
              {title}
              {(isDeleting || isLoading) && (
                <div className="text-sm text-gray-500 font-normal mt-1">
                  Please wait while the department is being deleted...
                </div>
              )}
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-3">
            {description}
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CiTrash className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-800">{itemName}</span>
              </div>
            </div>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isDeleting || isLoading}
            className="rounded-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isDeleting || isLoading) ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CiTrash className="w-4 h-4" />
                Delete Department
              </div>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
