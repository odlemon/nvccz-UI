"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, X } from "lucide-react"

interface NDAModalProps {
    isOpen: boolean
    onClose: () => void
}

const NDAModal = ({ isOpen, onClose }: NDAModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl md:max-w-full w-[80vw] h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <FileText className="w-6 h-6 text-blue-600" />
                            Non-Disclosure & Confidentiality Agreement
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            Please review the terms of the agreement below.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-gray-100 relative">
                    <iframe
                        src="/NVCCZs_ONLINE_NON_DISCLOSURE_CONFIDENTIALITY_AGREEMENT.pdf"
                        className="w-full h-full border-none"
                        title="NDA Agreement"
                    />
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
                    >
                        Close Viewer
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default NDAModal
    < DialogDescription className = "mt-1" >
        Please review the terms of the agreement below.
                        </DialogDescription >
                    </div >
                </DialogHeader >

                <div className="flex-1 bg-gray-100 relative overflow-y-auto">
                    <div className="flex justify-center p-4 sm:p-8 min-h-full">
                        <Document
                            file="/NVCCZs_ONLINE_NON_DISCLOSURE_CONFIDENTIALITY_AGREEMENT.pdf"
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center justify-center p-12 text-gray-500 h-64">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                                    <p>Loading document...</p>
                                </div>
                            }
                            error={
                                <div className="flex flex-col items-center justify-center p-12 text-red-500 h-64 bg-red-50 rounded-xl my-8">
                                    <FileText className="w-8 h-8 mb-2" />
                                    <p className="font-medium">Failed to load the document.</p>
                                    <p className="text-sm mt-1 mb-4 text-red-400 text-center max-w-sm">
                                        The document couldn't be loaded automatically.
                                    </p>
                                    <a 
                                        href="/NVCCZs_ONLINE_NON_DISCLOSURE_CONFIDENTIALITY_AGREEMENT.pdf" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                    >
                                        Download PDF
                                    </a>
                                </div>
                            }
                            className="flex flex-col items-center max-w-full"
                        >
                            {Array.from(new Array(numPages || 0), (el, index) => (
                                <div key={`page_${index + 1}`} className="mb-6 shadow-lg rounded-sm overflow-hidden border border-gray-200 bg-white">
                                    <Page
                                        pageNumber={index + 1}
                                        width={pageWidth}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        loading={<div className="h-96 w-full flex items-center justify-center bg-white"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
                                    />
                                </div>
                            ))}
                        </Document>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
                    >
                        Close Viewer
                    </button>
                </div>
            </DialogContent >
        </Dialog >
    )
}

export default NDAModal
