'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

interface DocumentSlot {
  code: 'CR14' | 'BANK_LETTER' | 'CERTIFICATE_OF_INCORPORATION' | 'ITF263' | 'OTHER'
  label: string
  description?: string
  required: boolean
  file?: File | null
}

const DOCUMENT_TYPES: DocumentSlot[] = [
  {
    code: 'CERTIFICATE_OF_INCORPORATION',
    label: 'Certificate of incorporation',
    description: 'Company registration certificate from the Registrar of Companies.',
    required: true,
    file: null,
  },
  {
    code: 'CR14',
    label: 'CR14 - company extract',
    description: 'CR14 extract (shareholders, directors, registered office).',
    required: true,
    file: null,
  },
  {
    code: 'BANK_LETTER',
    label: 'Bank confirmation / account letter',
    description: 'Signed bank letter or stamped confirmation of the business account details.',
    required: true,
    file: null,
  },
  {
    code: 'ITF263',
    label: 'ZIMRA tax clearance (ITF 263)',
    description: 'Scanned ITF263 certificate if not already captured at registration.',
    required: false,
    file: null,
  },
  {
    code: 'OTHER',
    label: 'Other supporting document',
    description: 'Any additional document procurement may request.',
    required: false,
    file: null,
  },
]

interface KYCUploadFormProps {
  token: string
}

export function KYCUploadForm({ token }: KYCUploadFormProps) {
  const [documents, setDocuments] = useState<DocumentSlot[]>(DOCUMENT_TYPES)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loadingRequirements, setLoadingRequirements] = useState(true)
  const vendorName = sessionStorage.getItem('vendorName') || 'Vendor'

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const response = await procurementApiV2.getKYCRequirements(token)
        if (response.success && response.data) {
          const rows = (response.data as any)?.documentTypes || []
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped: DocumentSlot[] = rows
              .map((row: any) => ({
                code: (row.code || '').toString().toUpperCase(),
                label: row.label || row.code || 'KYC Document',
                description: row.description || '',
                required: Boolean(row.requiredForPortal),
                file: null,
              }))
              .filter((row: DocumentSlot) => Boolean(row.code)) as DocumentSlot[]

            if (mapped.length > 0) {
              setDocuments(mapped)
            }
          }
          setLoadingRequirements(false)
        }
      } catch (error) {
        console.error('Failed to load KYC requirements:', error)
        setLoadingRequirements(false)
      }
    }
    loadRequirements()
  }, [token])

  const handleFileSelect = (docCode: string, file: File | null) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.code === docCode ? { ...doc, file } : doc))
    )
  }

  const handleSubmit = async () => {
    const requiredDocs = documents.filter((d) => d.required && !d.file)
    if (requiredDocs.length > 0) {
      toast.error(`Missing required documents: ${requiredDocs.map((d) => d.label).join(', ')}`)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      documents.forEach((doc) => {
        if (doc.file) {
          formData.append('file', doc.file)
          formData.append('documentType', doc.code)
        }
      })

      const response = await procurementApiV2.uploadKYCDocuments(token, formData)

      if (!response.success) {
        toast.error('Upload failed', { description: response.message || 'Please try again' })
        return
      }

      setSubmitted(true)
      toast.success('Documents submitted successfully!')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to upload documents'
      toast.error('Upload failed', { description })
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loadingRequirements) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading KYC requirements...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 shadow-2xl">
            <CardHeader className="text-center space-y-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg pb-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Submission Complete!</CardTitle>
              <CardDescription className="text-green-50 text-lg">Thank you for registering with Arcus</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900">Documents Received</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your KYC documents have been received and are now under review by our procurement team. You will
                      be notified via email regarding your vendor approval status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900">What's Next?</h3>
                    <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                      <li>Our team will review your documents (typically 3-5 business days)</li>
                      <li>You will receive an email notification once approved</li>
                      <li>Upon approval, you can start bidding on RFQs</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-gray-600 text-sm">Your submission has been captured successfully.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload KYC Documents</h1>
          <p className="text-lg text-gray-600">Complete vendor verification for {vendorName}</p>
        </div>

        {/* Documents Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle>Required Documents</CardTitle>
            <CardDescription className="text-blue-50">Upload the following documents to complete your KYC</CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.filter((doc) => doc.required).map((doc) => (
                    <div key={doc.code} className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        {doc.file ? (
                          <div className="text-center px-3">
                            <FileText className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs text-blue-700 font-medium truncate max-w-[170px]">{doc.file.name}</p>
                          </div>
                        ) : (
                          <div className="text-center px-3">
                            <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                            <p className="text-xs text-blue-700 font-medium">Add Document</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{doc.label}</p>
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Required</span>
                        </div>
                        <label htmlFor={`upload-${doc.code}`} className="block cursor-pointer">
                          <div className="border border-dashed border-gray-300 rounded-lg py-2 px-3 text-center text-xs text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            {doc.file ? 'Replace File' : 'Upload File'}
                          </div>
                        </label>
                        <input
                          id={`upload-${doc.code}`}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const selected = e.target.files?.[0] || null
                            handleFileSelect(doc.code, selected)
                          }}
                        />
                        {doc.file && (
                          <button
                            type="button"
                            onClick={() => handleFileSelect(doc.code, null)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {documents.some((doc) => !doc.required) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Optional Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.filter((doc) => !doc.required).map((doc) => (
                      <div key={doc.code} className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                          {doc.file ? (
                            <div className="text-center px-3">
                              <FileText className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                              <p className="text-xs text-blue-700 font-medium truncate max-w-[170px]">{doc.file.name}</p>
                            </div>
                          ) : (
                            <div className="text-center px-3">
                              <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                              <p className="text-xs text-blue-700 font-medium">Add Document</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{doc.label}</p>
                              <p className="text-xs text-gray-500">{doc.description}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Optional</span>
                          </div>
                          <label htmlFor={`upload-${doc.code}`} className="block cursor-pointer">
                            <div className="border border-dashed border-gray-300 rounded-lg py-2 px-3 text-center text-xs text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                              {doc.file ? 'Replace File' : 'Upload File'}
                            </div>
                          </label>
                          <input
                            id={`upload-${doc.code}`}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const selected = e.target.files?.[0] || null
                              handleFileSelect(doc.code, selected)
                            }}
                          />
                          {doc.file && (
                            <button
                              type="button"
                              onClick={() => handleFileSelect(doc.code, null)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-8">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full h-12 text-base font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Submit Documents
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
