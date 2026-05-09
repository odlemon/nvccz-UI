"use client"

import { useState, useEffect, useRef } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2, Users, FileText, Upload } from "lucide-react"
import { boardReviewApi } from "@/lib/api/board-review-api"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BoardReviewConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  applicationName: string
  onSuccess: () => void
}

export function BoardReviewConfirmationDialog({
  isOpen,
  onClose,
  applicationId,
  applicationName,
  onSuccess
}: BoardReviewConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false)
      setFile(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!file) {
      toast.error('Please select an Investment Memorandum document')
      return
    }

    setIsLoading(true)
    
    try {
      await boardReviewApi.create(applicationId, file)
      toast.success('Board review initiated and memorandum uploaded successfully')
      onSuccess() // This will reload the application data
      onClose()
    } catch (error: any) {
      toast.error('Failed to initiate board review', { 
        description: error.message || 'Please try again.' 
      })
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      onClose()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            Initiate Board Review
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to initiate board review for <strong>{applicationName}</strong>? 
            <br /><br />
            You must upload the <strong>Final Investment Memorandum</strong> to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="memorandum" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Investment Memorandum (PDF, Word, Excel)
            </Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer
                ${file ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50/50'}
              `}
            >
              <Input
                id="memorandum"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">Click or drag to upload memorandum</p>
                  <p className="text-xs text-gray-400 mt-1">Maximum size 50MB</p>
                </>
              )}
            </div>
          </div>
          
          <ul className="list-disc list-inside mt-4 space-y-1 text-xs text-gray-500">
            <li>Move the application to the board review stage</li>
            <li>Create a board review record for tracking</li>
            <li>Notify board members for review</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => !isLoading && onClose()}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (!isLoading) {
                handleConfirm()
              }
            }}
            disabled={isLoading || !file}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initiating...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Initiate Board Review
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
