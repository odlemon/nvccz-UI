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
