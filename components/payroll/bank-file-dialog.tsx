"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { bankTemplatesApi, payrollRunsApi } from "@/lib/api/payroll-api"
import { BankTemplate } from "@/lib/api/payroll-api"
import { toast } from "sonner"

interface BankFileDialogProps {
  isOpen: boolean
  onClose: () => void
  payrollRunId: string
  payrollRunName: string
}

export function BankFileDialog({ isOpen, onClose, payrollRunId, payrollRunName }: BankFileDialogProps) {
  const [bankTemplates, setBankTemplates] = useState<BankTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Load bank templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadBankTemplates()
    }
  }, [isOpen])

  const loadBankTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const response = await bankTemplatesApi.getAll()
      if (response.success) {
        setBankTemplates(response.data)
      } else {
        toast.error("Failed to load bank templates")
      }
    } catch (error) {
      console.error("Error loading bank templates:", error)
      toast.error("Failed to load bank templates")
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a bank template")
      return
    }

    try {
      setIsGenerating(true)
      const blob = await payrollRunsApi.generateBankFile(payrollRunId, selectedTemplateId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${payrollRunName.replace(/\s+/g, '_')}_bank_file.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Bank file generated and downloaded successfully")
      onClose()
    } catch (error) {
      console.error("Error generating bank file:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate bank file"
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Bank File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Generate a CSV bank file for <span className="font-medium">{payrollRunName}</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankTemplate">Bank Template</Label>
            <Select 
              value={selectedTemplateId} 
              onValueChange={setSelectedTemplateId}
              disabled={loadingTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select bank template"} />
              </SelectTrigger>
              <SelectContent>
                {bankTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-gray-500">{template.bankName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedTemplateId || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? "Generating..." : "Generate & Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
