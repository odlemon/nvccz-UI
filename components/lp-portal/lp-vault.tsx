"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Download, ShieldCheck, FileText } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchLpVault,
  downloadLpVaultDocument,
  verifyLpVaultDocument,
  setVaultCategoryFilter,
} from "@/lib/store/slices/lpPortalSlice"
import type { LpVaultCategory, LpVaultDocument } from "@/lib/api/lp-portal-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CopyText } from "@/components/ui/copy-text"

const CATEGORIES: Array<{ value: LpVaultCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "TAX", label: "Tax" },
  { value: "AUDIT", label: "Audit" },
  { value: "PERFORMANCE_REPORT", label: "Performance" },
  { value: "CALL_NOTICE", label: "Call Notices" },
  { value: "MANUAL", label: "Manual" },
  { value: "QUARTERLY_STATEMENT", label: "Quarterly" },
]

function VaultDocumentCard({ doc }: { doc: LpVaultDocument }) {
  const dispatch = useAppDispatch()
  const [verifyOpen, setVerifyOpen] = useState(false)
  const verifyResult = useAppSelector((s) => s.lpPortal.vaultVerifyResultById[doc.documentId])
  const verifying = useAppSelector((s) => s.lpPortal.vaultVerifyLoadingById[doc.documentId])

  const handleDownload = async () => {
    try {
      await dispatch(downloadLpVaultDocument({ documentId: doc.documentId, filename: `${doc.title}.pdf` })).unwrap()
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "File not available")
    }
  }

  const handleVerify = () => {
    setVerifyOpen(true)
    dispatch(verifyLpVaultDocument(doc.documentId))
  }

  return (
    <Card className="border-gray-200 shadow-none flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-gray-900 truncate">{doc.title}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{doc.fundName}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{doc.sourceType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Category</span>
          <Badge variant="secondary">{doc.category?.replaceAll("_", " ")}</Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Published</span>
          <span>{doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString() : "—"}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>SHA-256</span>
          <div className="flex items-center gap-1">
            <span className="font-mono">{doc.sha256 ? `${doc.sha256.slice(0, 10)}…` : "—"}</span>
            {doc.sha256 && <CopyText text={doc.sha256} showText={false} successMessage="SHA-256 copied" />}
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Popover open={verifyOpen} onOpenChange={setVerifyOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleVerify}>
                <ShieldCheck className="w-3.5 h-3.5" /> Verify
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm">
              {verifying && <p className="text-muted-foreground">Verifying…</p>}
              {!verifying && verifyResult && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    {verifyResult.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {verifyResult.verified ? "Integrity verified" : "Verification failed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Checked {verifyResult.checkedAt ? new Date(verifyResult.checkedAt).toLocaleString() : "—"}
                  </p>
                </div>
              )}
              {!verifying && !verifyResult && (
                <p className="text-muted-foreground">Click verify to check document integrity.</p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
}

export function LpVault() {
  const dispatch = useAppDispatch()
  const { vault, vaultLoading, vaultError, vaultCategoryFilter } = useAppSelector((s) => s.lpPortal)

  useEffect(() => {
    dispatch(fetchLpVault(undefined))
  }, [dispatch])

  const handleCategoryChange = (value: string) => {
    const category = value === "ALL" ? undefined : (value as LpVaultCategory)
    dispatch(setVaultCategoryFilter(category ?? null))
    dispatch(fetchLpVault(category))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Document Vault</h1>
        <p className="text-sm text-muted-foreground">Tax, audit, performance, and call notice documents.</p>
      </div>

      <Tabs value={vaultCategoryFilter ?? "ALL"} onValueChange={handleCategoryChange}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {vaultLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : vaultError ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{vaultError}</CardContent>
        </Card>
      ) : vault.length === 0 ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="py-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No documents found for this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vault.map((doc) => <VaultDocumentCard key={doc.documentId} doc={doc} />)}
        </div>
      )}
    </div>
  )
}
