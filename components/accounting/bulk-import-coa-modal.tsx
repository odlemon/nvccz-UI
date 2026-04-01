"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { accountingApi } from "@/lib/api/accounting-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BulkImportCoaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkImportCoaModal({ isOpen, onClose, onSuccess }: BulkImportCoaModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setValidationResult(null)
    }
  }

  const handleValidate = async () => {
    if (!file) return
    setValidating(true)
    try {
      const response = await accountingApi.validateChartOfAccountsBulkImport(file)
      if (response.success && response.data) {
        setValidationResult(response.data)
        if (response.data.valid || (response.data.errors && response.data.errors.length === 0)) {
          toast.success("Validation passed! Review the preview below.")
        } else {
          toast.error("Validation found errors. Please fix and re-upload.")
        }
      } else {
        throw new Error(response.error || "Validation failed")
      }
    } catch (error: any) {
      toast.error("Validation failed", { description: error.message })
    } finally {
      setValidating(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setValidationResult(null)
    onClose()
  }

  const errors = validationResult?.errors || []
  const preview = validationResult?.preview || validationResult?.accounts || []
  const isValid = validationResult?.valid || (errors.length === 0 && preview.length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Bulk Import Chart of Accounts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File (CSV)</Label>
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              disabled={validating}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Validate Button */}
          <Button
            onClick={handleValidate}
            disabled={!file || validating}
            className="rounded-full"
          >
            {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Validate
          </Button>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Validation Errors ({errors.length})
              </Label>
              <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3 space-y-1">
                {errors.map((err: any, idx: number) => (
                  <p key={idx} className="text-sm text-red-700">
                    {typeof err === "string" ? err : `Row ${err.row || idx + 1}: ${err.message || JSON.stringify(err)}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Preview ({preview.length} accounts)
                {isValid && <Badge className="bg-green-100 text-green-800">Valid</Badge>}
              </Label>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Account No</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 20).map((acc: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{acc.accountNo}</TableCell>
                        <TableCell className="text-sm">{acc.accountName}</TableCell>
                        <TableCell className="text-sm">{acc.accountType}</TableCell>
                        <TableCell className="text-sm">{acc.financialStatement}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 20 && (
                <p className="text-xs text-gray-500">Showing 20 of {preview.length} accounts</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="rounded-full">
            Cancel
          </Button>
          {isValid && (
            <Button
              onClick={() => {
                toast.success(`Import validated with ${preview.length} accounts. Proceed with import on the server.`)
                onSuccess()
                handleClose()
              }}
              className="rounded-full"
            >
              Confirm Import
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
