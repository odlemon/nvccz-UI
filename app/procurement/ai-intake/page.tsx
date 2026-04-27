"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvoiceIntakeForm } from "@/components/procurement/invoice-intake-form"
import { InvoiceVerificationQueue } from "@/components/procurement/invoice-verification-queue"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, CheckCircle } from "lucide-react"

export default function AIIntakePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Invoice Intake</h1>
          <p className="text-gray-600 mt-2">
            Upload vendor invoices, extract data with AI, and verify accuracy
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gradient-primary text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Verification Queue
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            How It Works
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <InvoiceVerificationQueue key={refreshKey} />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Invoice Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-l-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 1: Upload</h3>
                  <p className="text-sm text-gray-600">
                    Upload a PDF or image of a vendor invoice from your vendor portal or email.
                  </p>
                </div>

                <div className="border-l-4 border-l-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 2: Extract</h3>
                  <p className="text-sm text-gray-600">
                    Our AI system runs OCR and extracts invoice number, dates, vendor, amounts, and line items
                    automatically.
                  </p>
                </div>

                <div className="border-l-4 border-l-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 3: Verify</h3>
                  <p className="text-sm text-gray-600">
                    Review the extracted data for accuracy. Your verification marks it ready for 3-way matching
                    against POs and goods receipts.
                  </p>
                </div>

                <div className="border-l-4 border-l-amber-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 4: Match & Approve</h3>
                  <p className="text-sm text-gray-600">
                    The invoice is automatically matched against purchase orders and GRNs. Disputes trigger
                    manual review. Matched invoices flow to payment.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-6">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Confidence Scores:</span> Each extraction is scored 0-100%.
                  Lower scores flag potential OCR errors for careful review. Vendor-specific field corrections
                  improve accuracy over time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <InvoiceIntakeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false)
          setRefreshKey(prev => prev + 1)
        }}
      />
    </div>
  )
}
