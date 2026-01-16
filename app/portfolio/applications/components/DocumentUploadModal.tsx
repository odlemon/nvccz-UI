"use client"

import { useState } from "react"
import { Upload, Link as LinkIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (payload: { documentType: string; file?: File; fileUrl?: string }) => void
  editingIndex?: number | null
  documentType?: string
}

const DocumentUploadModal = ({ isOpen, onClose, onUpload, editingIndex, documentType }: DocumentUploadModalProps) => {
  const [selectedType, setSelectedType] = useState<string>(documentType || "")
  const [dragActive, setDragActive] = useState(false)
  const [mode, setMode] = useState<"file" | "url">("file")
  const [fileUrl, setFileUrl] = useState<string>("")

  const documentTypes = [
    { value: "BUSINESS_PLAN", label: "Business Plan", required: true },
    { value: "PROOF_OF_CONCEPT", label: "Proof of Concept", required: true },
    { value: "MARKET_RESEARCH", label: "Market Research", required: true },
    { value: "PROJECTED_CASH_FLOWS", label: "Projected Cash Flows", required: true },
    { value: "HISTORICAL_FINANCIALS", label: "Historical Financials", required: false }
  ]

  const FINANCIAL_TYPES = ["PROJECTED_CASH_FLOWS", "HISTORICAL_FINANCIALS"]
  const FINANCIAL_EXTENSIONS = [".csv", ".xls", ".xlsx"]
  const DEFAULT_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif", ".txt"]

  const getAllowedExtensions = () => {
    const docType = documentType || selectedType
    return FINANCIAL_TYPES.includes(docType) ? FINANCIAL_EXTENSIONS : DEFAULT_EXTENSIONS
  }

  const validateFile = (file: File) => {
    const extensions = getAllowedExtensions()
    const fileName = file.name.toLowerCase()
    const isValid = extensions.some(ext => fileName.endsWith(ext))

    if (!isValid) {
      toast.error(`Invalid file type for this document. Please upload: ${extensions.join(", ")}`)
      return false
    }
    return true
  }

  const finalizeUpload = (payload: { file?: File; fileUrl?: string }) => {
    const docType = documentType || selectedType
    if (!docType) {
      toast.error("Please select a document type first")
      return
    }

    if (payload.file && !validateFile(payload.file)) {
      return
    }

    if (mode === "url" && !payload.fileUrl) {
      toast.error("Please paste a valid file URL")
      return
    }
    onUpload({ documentType: docType, ...payload })
    onClose()
    setSelectedType("")
    setFileUrl("")
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name, file.type, file.size)
      finalizeUpload({ file })
      // Reset the input
      e.target.value = ''
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      finalizeUpload({ file })
    }
  }

  const isFinancial = FINANCIAL_TYPES.includes(documentType || selectedType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {editingIndex !== null ? "Attach / Replace Document" : "Attach Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Document Type</label>
            {documentType ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm">
                {documentTypes.find(t => t.value === documentType)?.label || documentType}
                {documentTypes.find(t => t.value === documentType)?.required && (
                  <Badge variant="destructive" className="text-xs ml-1">Required</Badge>
                )}
              </div>
            ) : (
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.label}
                        {type.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Financial Document Hint */}
          {isFinancial && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800">Financial Document Restriction</p>
                <p className="text-xs text-orange-700 mt-0.5">
                  For financial records, only CSV or Excel files (.csv, .xls, .xlsx) are accepted for better data processing.
                </p>
              </div>
            </div>
          )}

          {/* Attach Mode */}
          <div className="flex gap-2 text-sm">
            <Button variant={mode === 'file' ? 'gradient' : 'outline'} size="sm" onClick={() => setMode('file')}>Upload File</Button>
            <Button variant={mode === 'url' ? 'gradient' : 'outline'} size="sm" onClick={() => setMode('url')}>Paste File URL</Button>
          </div>

          {mode === 'file' ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {editingIndex !== null ? "Drop your new file here" : "Drop your file here"}
              </p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileInputChange}
                accept={getAllowedExtensions().join(",")}
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  {editingIndex !== null ? "Choose New File" : "Choose File"}
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium">File URL</label>
              <div className="flex gap-2">
                <Input placeholder="https://..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
                <Button onClick={() => finalizeUpload({ fileUrl })}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Attach URL
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {isFinancial
                  ? "Paste a direct link to your CSV or Excel file."
                  : "Paste a direct link to your document (PDF, image, etc.)."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentUploadModal
