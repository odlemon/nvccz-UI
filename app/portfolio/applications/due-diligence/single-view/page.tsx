'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CiUser,
  CiCircleCheck,
  CiCircleMinus,
  CiClock1,
  CiImport,
  CiSquareCheck,
  CiViewList,
  CiExport,
  CiFileOn,
  CiBank,
  CiCalendar
} from 'react-icons/ci'
import {
  Eye,
  Edit,
  Trash2,
  Upload,
  FileText,
  FileIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PortfolioLayout } from '@/components/layout/portfolio-layout'
import DocumentUploadModal from '../../components/DocumentUploadModal'
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

function DueDiligenceSingleView() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Stepper configuration based on actual requirements
  const stepperSteps = [
    {
      id: 0,
      title: "Company Information",
      description: "Basic company details and registration",
      requirements: [
        { name: "Upload registration documents", status: "completed", clientAction: true, documents: [{ fileName: "company_registration.pdf", fileSize: 1024000, fileUrl: "#" }] },
        { name: "Provide Tax Clearance Certificate", status: "pending", clientAction: true, documents: [] },
        { name: "Submit Directors' IDs", status: "completed", clientAction: true, documents: [{ fileName: "directors_ids.pdf", fileSize: 2048000, fileUrl: "#" }] }
      ]
    },
    {
      id: 1,
      title: "Financials",
      description: "Financial statements and accounts",
      requirements: [
        {
          name: "Upload last 3 years audited financial statements", status: "completed", clientAction: true, documents: [
            { fileName: "financials_2021.pdf", fileSize: 1536000, fileUrl: "#" },
            { fileName: "financials_2022.pdf", fileSize: 1792000, fileUrl: "#" },
            { fileName: "financials_2023.pdf", fileSize: 2048000, fileUrl: "#" }
          ]
        },
        { name: "Provide current management accounts", status: "pending", clientAction: true, documents: [] },
        { name: "Upload bank statements", status: "rejected", clientAction: true, reason: "Documents not clear, please resubmit", documents: [] }
      ]
    },
    {
      id: 2,
      title: "Compliance",
      description: "Regulatory compliance and legal matters",
      requirements: [
        { name: "Provide proof of compliance with RBZ or ZSE regulations", status: "pending", clientAction: true, documents: [] },
        { name: "Declare any legal disputes", status: "completed", clientAction: true, documents: [{ fileName: "legal_disputes_declaration.pdf", fileSize: 512000, fileUrl: "#" }] }
      ]
    },
    {
      id: 3,
      title: "Operations",
      description: "Business operations and key relationships",
      requirements: [
        { name: "Provide list of key customers/suppliers", status: "pending", clientAction: true, documents: [] },
        { name: "Upload business model explanation", status: "completed", clientAction: true, documents: [{ fileName: "business_model.pdf", fileSize: 1280000, fileUrl: "#" }] }
      ]
    }
  ]

  // Sample application data
  const selectedApp = {
    id: "APP-001",
    company: "TechCorp Inc.",
    sector: "Technology",
    amount: 15000000,
    stage: "Series A",
    submittedAt: "2024-01-15",
    businessDescription: "Revolutionary AI-powered solutions for enterprise automation and smart manufacturing.",
    industry: "Technology",
    businessStage: "GROWTH",
    foundingDate: "2020-03-15",
    progress: 75,
    completedItems: 12,
    totalItems: 16
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="w-4 h-4" />
    } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
      return <FileIcon className="w-4 h-4" />
    } else {
      return <FileIcon className="w-4 h-4" />
    }
  }

  const handleUploadDocument = (requirement: any) => {
    setSelectedRequirement(requirement)
    setShowUploadModal(true)
  }

  const handleDocumentUpload = (file: File) => {
    console.log('Uploading document:', file.name)
    setShowUploadModal(false)
  }

  const previewDocument = (document: any) => {
    setSelectedDocument(document)
    setPreviewModalOpen(true)
  }

  const editDocument = (index: number) => {
    setEditingIndex(index)
    // Handle edit logic
  }

  const removeDocument = (index: number) => {
    // Handle remove logic
    console.log('Removing document at index:', index)
  }

  const nextStep = () => {
    if (currentStep < stepperSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/applications/due-diligence')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Due Diligence Review</h1>
            <p className="text-gray-600">Application ID: {selectedApp.id}</p>
          </div>
        </div>
      </div>

      {/* Application Overview */}
      <div className="rounded-2xl border border-gray-200 ">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedApp.company}</h2>
                <p className="text-gray-600">{selectedApp.sector} • {selectedApp.stage}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CiCalendar className="w-4 h-4" />
                  <span>Submitted: {selectedApp.submittedAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CiBank className="w-4 h-4" />
                  <span>Amount: ${selectedApp.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="max-w-2xl">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedApp.businessDescription}
                </p>
              </div>
            </div>

            <div className="text-right space-y-3">
              <div className="text-sm">
                <span className="text-gray-500">Progress: </span>
                <span className="font-semibold text-gray-900">{selectedApp.progress}%</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Completed: </span>
                <span className="font-semibold text-gray-900">{selectedApp.completedItems}/{selectedApp.totalItems}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white rounded-2xl border border-gray-200  p-6">
        <div className="flex items-center justify-between">
          {stepperSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index <= currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white'
                  : 'border-gray-300 text-gray-400'
                }`}>
                {index < currentStep ? (
                  <CiSquareCheck className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="ml-2">
                <p className={`text-xs font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 leading-tight">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="space-y-6">
        <h2 className="text-xl font-normal text-gray-900 flex items-center gap-2">
          <CiUser className="w-5 h-5 text-blue-600" />
          {stepperSteps[currentStep].title}
        </h2>

        <div className="space-y-6">
          {stepperSteps[currentStep]?.requirements.map((item, itemIndex) => (
            <div key={itemIndex} className="rounded-2xl border border-gray-200 ">
              <CardContent className="p-6">
                {/* Requirement Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {item.status === "completed" ? (
                      <CiCircleCheck className="w-6 h-6 text-green-600" />
                    ) : item.status === "rejected" ? (
                      <CiCircleMinus className="w-6 h-6 text-red-600" />
                    ) : (
                      <CiClock1 className="w-6 h-6 text-yellow-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      {item.reason && (
                        <p className="text-sm text-red-600 mt-1">{item.reason}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-sm ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Badge>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {item.documents?.map((doc: any, docIndex: number) => (
                    <motion.div
                      key={docIndex}
                      className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: docIndex * 0.1 }}
                    >
                      {/* Document Preview Area */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                        {doc.fileName.toLowerCase().endsWith('.pdf') ? (
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
                            <FileIcon className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">Document</p>
                          </div>
                        )}

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => previewDocument(doc)}
                            className="bg-white/90 hover:bg-white text-gray-900"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-2">
                          <motion.button
                            onClick={() => previewDocument(doc)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            onClick={() => editDocument(docIndex)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            onClick={() => removeDocument(docIndex)}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Document Card */}
                  <motion.div
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                    onClick={() => handleUploadDocument(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-[4/3] flex items-center justify-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Add Document</p>
                    <p className="text-xs text-gray-500 mt-1">Click to upload</p>
                  </motion.div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          onClick={nextStep}
          disabled={currentStep === stepperSteps.length - 1}
          variant="gradient"
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleDocumentUpload}
      />

      {/* Document Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedDocument.fileName)}
                <span className="font-medium">{selectedDocument.fileName}</span>
                <span className="text-sm text-gray-500">
                  ({(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Document preview would be displayed here. This could be a PDF viewer, image viewer, or other document preview component.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DueDiligenceSingleViewPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications">
      <PortfolioLayout>
        <DueDiligenceSingleView />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
