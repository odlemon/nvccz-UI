"use client"
import { useState } from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { BankReconciliationRecords } from "./bank-reconciliation-records"
import { BankReconciliationAuditTrail } from "./bank-reconciliation-audit-trail"
import { BankReconciliationUploadModal } from "./bank-reconciliation-upload-modal"
import { accountingApi } from "@/lib/api/accounting-api"
import { toast } from "sonner"

import { useDispatch } from "react-redux"
import { fetchBankReconciliations, fetchBankReconciliationSummary } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch } from "@/lib/store/store"

export function BankReconciliationManagement() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("records")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch<AppDispatch>()

  const handleUpload = async (file: File) => {
    setLoading(true)
    try {
      const response = await accountingApi.uploadBankReconciliationFile(file)
      if (!response.success) {
        throw new Error(response.message || 'Failed to upload bank statement')
      }

      // Refresh the data after successful upload
      dispatch(fetchBankReconciliations())
      dispatch(fetchBankReconciliationSummary())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
        <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
          Upload Statement
        </button>
      </div>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="records">Reconciliation Records</Tabs.Trigger>
          <Tabs.Trigger value="audit">Audit Trail</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="records">
          <BankReconciliationRecords />
        </Tabs.Content>
        <Tabs.Content value="audit">
          <BankReconciliationAuditTrail />
        </Tabs.Content>
      </Tabs.Root>
      <BankReconciliationUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        loading={loading}
      />
    </div>
  )
}
