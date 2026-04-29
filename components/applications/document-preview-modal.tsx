"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, FileText, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Document {
  id: string
  documentType: string
  fileName: string
  fileUrl: string
  isRequired: boolean
  isSubmitted: boolean
}

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  initialDocumentIndex?: number
}

export function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  documents, 
  initialDocumentIndex = 0 
}: DocumentPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialDocumentIndex)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const currentDoc = documents[currentIndex]

  // Cache for downloaded blobs
  const [blobCache, setBlobCache] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (isOpen && currentDoc) {
      loadDocument()
    }

    // Cleanup blob URLs when modal closes
    return () => {
      if (blobUrl && !blobCache.has(currentDoc?.id)) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [isOpen, currentIndex, currentDoc])

  // Helper function to check if URL is Google Drive
  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com')
  }

  // Convert Google Drive view URL to embed URL
  const convertToGoogleDriveEmbed = (url: string) => {
    if (!isGoogleDriveUrl(url)) return url
    
    // Extract file ID from various Google Drive URL formats
    let fileId = ''
    
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1].split('/')[0]
    } else if (url.includes('id=')) {
      fileId = url.split('id=')[1].split('&')[0]
    }
    
    if (fileId) {
      // Return embed URL that can be loaded in iframe
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
    
    return url
  }

  const loadDocument = async () => {
    if (!currentDoc) return

    // Check if URL is Google Drive - use iframe directly
    if (isGoogleDriveUrl(currentDoc.fileUrl)) {
      setLoading(false)
      setBlobUrl(convertToGoogleDriveEmbed(currentDoc.fileUrl))
      return
    }

    // Check if already cached
    if (blobCache.has(currentDoc.id)) {
      setBlobUrl(blobCache.get(currentDoc.id)!)
      return
    }

    try {
      setLoading(true)
      setDownloadProgress(0)

      const response = await fetch(currentDoc.fileUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      
      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        receivedLength += value.length
        
        if (total > 0) {
          setDownloadProgress((receivedLength / total) * 100)
        }
      }

      const blob = new Blob(chunks, { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      setBlobUrl(url)
      setBlobCache(prev => new Map(prev).set(currentDoc.id, url))
      setDownloadProgress(100)
    } catch (error: any) {
      console.error('Error loading document:', error)
      toast.error('Failed to load document', { 
        description: error.message || 'Please try again' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!currentDoc) return
    
    // For Google Drive links, open in new tab instead of downloading
    if (isGoogleDriveUrl(currentDoc.fileUrl)) {
      window.open(currentDoc.fileUrl, '_blank')
      toast.info('Opening document in Google Drive')
      return
    }
    
    try {
      let blob: Blob
      
      // Use cached blob if available
      if (blobCache.has(currentDoc.id)) {
        const cachedUrl = blobCache.get(currentDoc.id)!
        const response = await fetch(cachedUrl)
        blob = await response.blob()
      } else {
        const response = await fetch(currentDoc.fileUrl)
        blob = await response.blob()
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = currentDoc.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Document downloaded successfully')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download document')
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1))
    setBlobUrl(null)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0))
    setBlobUrl(null)
  }

  const formatDocumentType = (type: string) => {
    if (!type) return "Document"
    return type.replaceAll('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const handleClose = () => {
    // Clean up all blob URLs from cache
    blobCache.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    setBlobCache(new Map())
    setBlobUrl(null)
    onClose()
  }

  if (!currentDoc) return null

  const isGoogleDoc = isGoogleDriveUrl(currentDoc.fileUrl)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl md:max-w-full w-[80vw] h-[95vh] flex flex-col p-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-normal">
                  {formatDocumentType(currentDoc.documentType)}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">{currentDoc.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {documents.length > 1 && (
                <div className="flex items-center gap-2 mr-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                    className="rounded-full h-8 w-8"
                    disabled={loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {currentIndex + 1} / {documents.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="rounded-full h-8 w-8"
                    disabled={loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-full"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentDoc.fileUrl, '_blank')}
                className="rounded-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                className="rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Document Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant={currentDoc.isRequired ? 'destructive' : 'secondary'} className="text-xs">
              {currentDoc.isRequired ? 'Required' : 'Optional'}
            </Badge>
            <Badge variant={currentDoc.isSubmitted ? 'default' : 'outline'} className="text-xs">
              {currentDoc.isSubmitted ? 'Submitted' : 'Not Submitted'}
            </Badge>
            {loading && (
              <Badge variant="outline" className="text-xs">
                Loading {downloadProgress > 0 && `${Math.round(downloadProgress)}%`}
              </Badge>
            )}
            {isGoogleDoc && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                Google Drive
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isGoogleDoc ? 'Loading from Google Drive' : 'Click and drag to navigate • Use mouse wheel to zoom'}
          </p>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600 mb-2">Loading document...</p>
              {downloadProgress > 0 && (
                <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : blobUrl ? (
            <iframe
              src={isGoogleDoc ? blobUrl : `${blobUrl}#view=FitH`}
              className="w-full h-full border-0"
              title={currentDoc.fileName}
              allow="autoplay"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Failed to load document</p>
                <p className="text-sm text-gray-500 mb-4">
                  {isGoogleDoc ? 'Google Drive document may require authentication' : 'Unable to load the file'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadDocument}
                    className="rounded-full"
                  >
                    Retry
                  </Button>
                  {isGoogleDoc && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => window.open(currentDoc.fileUrl, '_blank')}
                      className="rounded-full"
                    >
                      Open in Google Drive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Navigation (if multiple documents) */}
        {documents.length > 1 && (
          <div className="px-6 py-4 border-t bg-white flex-shrink-0">
            <div className="flex gap-3 overflow-x-auto">
              {documents.map((doc, index) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setCurrentIndex(index)
                    setBlobUrl(null)
                  }}
                  disabled={loading}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all ${
                    index === currentIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <FileText className={`w-4 h-4 ${index === currentIndex ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        index === currentIndex ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {formatDocumentType(doc.documentType)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
