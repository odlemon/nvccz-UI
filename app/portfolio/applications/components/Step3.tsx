"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Upload, X, FileText, Image, File, Eye, Edit, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import DocumentUploadModal from "./DocumentUploadModal"
import { useAppDispatch } from "@/lib/store"
import { addDocument, updateDocument, removeDocument as removeDocumentAction } from "@/lib/store/slices/applicationSlice"
import { getFilePreviewUrl, isOfficeDocument } from "@/lib/utils/file-preview"

interface Step3Props {
  formData: any
  updateField: (field: string, value: any) => void
  errors: Record<string, string>
}

const Step3 = ({ formData, updateField, errors }: Step3Props) => {
  const dispatch = useAppDispatch()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Ensure documents array exists
  const documents = formData.documents || []

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      documents.forEach((doc: any) => {
        if (doc.fileUrl && doc.fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(doc.fileUrl)
        }
      })
    }
  }, [documents])

  const requiredDocs = documents.filter((d: any) => d.isRequired)
  const optionalDocs = documents.filter((d: any) => !d.isRequired)

  const handleAttach = (payload: { documentType: string; file?: File; fileUrl?: string }) => {
    const { documentType, file, fileUrl } = payload
    
    if (file) {
      // Check if document type already exists
      const existingIndex = documents.findIndex((d: any) => d.documentType === documentType)
      
      const newDocument = {
        documentType: documentType as any,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        isRequired: ['BUSINESS_PLAN', 'PROOF_OF_CONCEPT', 'MARKET_RESEARCH', 'PROJECTED_CASH_FLOWS'].includes(documentType),
        file: file // ⚠️ CRITICAL: Store the actual File object
      }

      if (existingIndex >= 0) {
        // Update existing document
        dispatch(updateDocument({ index: existingIndex, document: newDocument }))
      } else {
        // Add new document
        dispatch(addDocument(newDocument))
      }
      
      toast.success("Document uploaded successfully!")
      return
    }
    
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop() || 'document'
      const existingIndex = documents.findIndex((d: any) => d.documentType === documentType)
      
      const newDocument = {
        documentType: documentType as any,
        fileName,
        fileUrl,
        fileSize: 0,
        isRequired: ['BUSINESS_PLAN', 'PROOF_OF_CONCEPT', 'MARKET_RESEARCH', 'PROJECTED_CASH_FLOWS'].includes(documentType),
      }

      if (existingIndex >= 0) {
        dispatch(updateDocument({ index: existingIndex, document: newDocument }))
      } else {
        dispatch(addDocument(newDocument))
      }
      
      toast.success("Document URL attached!")
    }
  }

  const handleRemoveDocument = (index: number) => {
    const doc = documents[index]
    
    // Clean up blob URL if it exists
    if (doc.fileUrl && doc.fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(doc.fileUrl)
    }
    
    dispatch(removeDocumentAction(index))
    toast.info("Document removed")
  }

  const previewDocument = (doc: any) => {
    setSelectedDocument(doc)
    setPreviewModalOpen(true)
  }

  const editDocument = (index: number) => {
    const doc = documents[index]
    setSelectedDocument(doc)
    setEditingIndex(index)
    setUploadModalOpen(true)
  }

  const replaceDocument = (file: File, documentType: string) => {
    if (editingIndex !== null) {
      const oldDoc = documents[editingIndex]
      
      // Clean up old blob URL
      if (oldDoc.fileUrl && oldDoc.fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldDoc.fileUrl)
      }

      const updatedDocument = {
        documentType: documentType as any,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        isRequired: ['BUSINESS_PLAN', 'PROOF_OF_CONCEPT', 'MARKET_RESEARCH', 'PROJECTED_CASH_FLOWS'].includes(documentType),
        file: file // ⚠️ CRITICAL: Store the actual File object
      }
      
      dispatch(updateDocument({ index: editingIndex, document: updatedDocument }))
      setEditingIndex(null)
      toast.success("Document replaced successfully!")
    }
  }

  const handleUpload = (payload: { documentType: string; file?: File; fileUrl?: string }) => {
    if (payload.file) {
      if (editingIndex !== null) {
        replaceDocument(payload.file, payload.documentType)
      } else {
        handleAttach(payload)
      }
    } else if (payload.fileUrl) {
      handleAttach(payload)
    }
  }

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <File className="w-5 h-5" />
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(extension || '')) return <FileText className="w-5 h-5" />
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return <Image className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Documents</h2>
        <p className="text-gray-600">Upload required docs. Optional docs can be skipped.</p>
      </div>

      {/* Required Documents */}
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {['BUSINESS_PLAN', 'PROOF_OF_CONCEPT', 'MARKET_RESEARCH', 'PROJECTED_CASH_FLOWS'].map((docType, idx) => {
          const doc = documents.find((d: any) => d.documentType === docType)
          const index = documents.findIndex((d: any) => d.documentType === docType)
          
          return (
            <motion.div 
              key={`req-${docType}`} 
              className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Document Preview Area */}
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                {doc?.fileUrl ? (
                  doc.fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-blue-600 font-medium">PDF Document</p>
                    </div>
                  ) : doc.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                    <img 
                      src={doc.fileUrl} 
                      alt={doc.fileName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <File className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-medium">Document</p>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-blue-600 font-medium">Add Document</p>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={() => doc?.fileUrl ? previewDocument(doc) : (setSelectedDocument({ documentType: docType }), setUploadModalOpen(true))}
                    className="bg-white/90 hover:bg-white text-gray-900"
                  >
                    {doc?.fileUrl ? (
                      <><Eye className="w-4 h-4 mr-1" /> Preview</>
                    ) : (
                      <>Attach</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{getTypeLabel(docType)}</p>
                    {doc?.fileUrl ? (
                      <>
                        <p className="text-xs text-gray-600 truncate">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">No file attached yet</p>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2">
                  <motion.button
                    onClick={() => doc?.fileUrl ? previewDocument(doc) : (setSelectedDocument({ documentType: docType }), setUploadModalOpen(true))}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {doc?.fileUrl ? <Eye className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  </motion.button>

                  {doc && (
                    <>
                      <motion.button
                        onClick={() => editDocument(index)}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleRemoveDocument(index)}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Optional Documents */}
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Optional Documents</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {optionalDocs.map((doc: any, idx: number) => {
          const index = documents.findIndex((d: any) => d === doc)
          
          return (
            <motion.div 
              key={`opt-${idx}`} 
              className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Document Preview Area */}
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                {doc.fileUrl ? (
                  doc.fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-blue-600 font-medium">PDF Document</p>
                    </div>
                  ) : doc.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                    <img 
                      src={doc.fileUrl} 
                      alt={doc.fileName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <File className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-medium">Document</p>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-blue-600 font-medium">Add Document</p>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={() => doc.fileUrl ? previewDocument(doc) : (setSelectedDocument(doc), setUploadModalOpen(true))}
                    className="bg-white/90 hover:bg-white text-gray-900"
                  >
                    {doc.fileUrl ? (
                      <><Eye className="w-4 h-4 mr-1" /> Preview</>
                    ) : (
                      <>Attach</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{getTypeLabel(doc.documentType)}</p>
                    {doc.fileUrl ? (
                      <>
                        <p className="text-xs text-gray-600 truncate">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">No file attached yet</p>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2">
                  <motion.button
                    onClick={() => doc.fileUrl ? previewDocument(doc) : (setSelectedDocument(doc), setUploadModalOpen(true))}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {doc.fileUrl ? <Eye className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  </motion.button>

                  <motion.button
                    onClick={() => editDocument(index)}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    onClick={() => handleRemoveDocument(index)}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
        
        {/* Add Optional Document Button */}
        <motion.div 
          className="group relative border-2 border-dashed rounded-2xl p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-300"
          onClick={() => {
            setSelectedDocument({ documentType: 'HISTORICAL_FINANCIALS', isRequired: false })
            setUploadModalOpen(true)
          }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Add Optional Document</p>
              <p className="text-xs text-gray-500 mt-1">Click to upload</p>
            </div>
          </div>
        </motion.div>
      </div>

      {errors.documents && <p className="text-red-500 text-sm mt-4">{errors.documents}</p>}

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false)
          setEditingIndex(null)
          setSelectedDocument(null)
        }}
        onUpload={handleUpload}
        editingIndex={editingIndex}
        documentType={selectedDocument?.documentType}
      />

      {/* Document Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Document Preview
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && selectedDocument.fileName && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getFileIcon(selectedDocument.fileName)}
                <div>
                  <p className="font-medium">{selectedDocument.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Badge 
                  variant={selectedDocument.isRequired ? "destructive" : "secondary"}
                  className="ml-auto"
                >
                  {selectedDocument.isRequired ? "Required" : "Optional"}
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {selectedDocument.fileName.toLowerCase().endsWith('.pdf') ? (
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">PDF Preview</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to download and view the PDF
                      </p>
                      <Button 
                        className="mt-4"
                        onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                      >
                        Open PDF
                      </Button>
                    </div>
                  </div>
                ) : selectedDocument.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                  <img
                    src={selectedDocument.fileUrl}
                    alt={selectedDocument.fileName}
                    className="w-full h-96 object-contain"
                  />
                ) : isOfficeDocument(selectedDocument.fileName) ? (
                  <iframe
                    src={getFilePreviewUrl(selectedDocument.fileUrl, selectedDocument.fileName)}
                    title={selectedDocument.fileName}
                    className="w-full h-96 border-0"
                  />
                ) : (
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Document Preview</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to download and view the document
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                      >
                        Open Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedDocument && !selectedDocument.fileName && (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">No document selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    BUSINESS_PLAN: 'Business Plan',
    PROOF_OF_CONCEPT: 'Proof of Concept',
    MARKET_RESEARCH: 'Market Research',
    PROJECTED_CASH_FLOWS: 'Projected Cash Flows',
    HISTORICAL_FINANCIALS: 'Historical Financials',
  }
  return map[type] || type
}

export default Step3
