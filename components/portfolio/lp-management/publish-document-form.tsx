"use client"

import { useMemo, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { publishLpDocument } from "@/lib/store/slices/lpPortalAdminSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { LP_MANAGEMENT_ACTIONS } from "@/lib/config/role-permissions"
import type { ClientRecord } from "@/lib/api/capital-calls-api"
import type { VaultDocumentCategory } from "@/lib/api/lp-portal-admin-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientPicker } from "./client-picker"
import { Upload, FileText, Loader2, UploadCloud, ShieldAlert, Info } from "lucide-react"
import { toast } from "sonner"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

const CATEGORIES: { value: VaultDocumentCategory; label: string }[] = [
  { value: "TAX", label: "Tax" },
  { value: "AUDIT", label: "Audit" },
  { value: "PERFORMANCE_REPORT", label: "Performance Report" },
  { value: "CALL_NOTICE", label: "Call Notice" },
  { value: "MANUAL", label: "Manual" },
  { value: "QUARTERLY_STATEMENT", label: "Quarterly Statement" },
]

interface PublishedLogEntry {
  id: string
  title: string
  clientLegalName: string
  category: VaultDocumentCategory
  publishedAt: string
}

export function PublishDocumentForm() {
  const dispatch = useAppDispatch()
  const { publishDocumentLoading } = useAppSelector((s) => s.lpPortalAdmin)
  const { hasSpecificAction } = useRolePermissions()
  const canPublish = hasSpecificAction("portfolio-management", LP_MANAGEMENT_ACTIONS.PUBLISH_LP_DOCUMENT)

  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [category, setCategory] = useState<VaultDocumentCategory>("TAX")
  const [title, setTitle] = useState("")
  const [fundId, setFundId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session-only running log — there's no list/history endpoint for
  // previously-published LP vault documents yet.
  const [recentlyPublished, setRecentlyPublished] = useState<PublishedLogEntry[]>([])

  const fundOptions = useMemo(() => {
    if (!selectedClient?.investmentCommitments?.length) return []
    const seen = new Map<string, string>()
    for (const c of selectedClient.investmentCommitments) {
      if (!seen.has(c.fundId)) seen.set(c.fundId, c.fund?.name || c.fundId)
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }))
  }, [selectedClient])

  const resetForm = () => {
    setSelectedClient(null)
    setCategory("TAX")
    setTitle("")
    setFundId("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!selectedClient) { toast.error("Select a client"); return }
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!file) { toast.error("Select a file to publish"); return }

    try {
      await dispatch(
        publishLpDocument({
          file,
          clientId: selectedClient.id,
          category,
          title: title.trim(),
          fundId: fundId || undefined,
        })
      ).unwrap()

      toast.success("Document published to LP vault")
      setRecentlyPublished((prev) => [
        {
          id: `${Date.now()}`,
          title: title.trim(),
          clientLegalName: selectedClient.legalName,
          category,
          publishedAt: new Date().toISOString(),
        },
        ...prev,
      ])
      resetForm()
    } catch (err) {
      toast.error("Failed to publish document", { description: errorMessage(err, "Please try again.") })
    }
  }

  if (!canPublish) {
    return (
      <div className="p-6 max-w-3xl space-y-4">
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardContent className="flex flex-col items-center text-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">You don't have permission to publish LP vault documents</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Contact your administrator if you believe you should have access to this action.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Publish LP Vault Document</CardTitle>
          <CardDescription>Upload a document directly into an LP's secure vault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</Label>
            <ClientPicker selectedClient={selectedClient} onSelect={setSelectedClient} disabled={publishDocumentLoading} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as VaultDocumentCategory)}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fund (optional)</Label>
              {fundOptions.length > 0 ? (
                <Select value={fundId} onValueChange={setFundId}>
                  <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select a fund…" /></SelectTrigger>
                  <SelectContent>
                    {fundOptions.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={fundId}
                  onChange={(e) => setFundId(e.target.value)}
                  placeholder="fund-id (optional)"
                  className="h-9"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 2026 Quarterly Statement"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Document</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer
                ${file ? "border-blue-300 bg-blue-50/50" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50/50"}
              `}
            >
              <Input
                id="lp-vault-document"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={publishDocumentLoading}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">Click or drag to upload document</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word or Excel</p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gradient-primary text-white" onClick={handleSubmit} disabled={publishDocumentLoading}>
              {publishDocumentLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" /> Publish to Vault
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Recently Published (this session)</CardTitle>
          <CardDescription className="flex items-start gap-1.5 text-xs">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            A full publish history isn't available yet — this list only reflects documents published during
            this session and resets on reload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentlyPublished.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No documents published yet this session.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentlyPublished.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.clientLegalName} · {entry.category}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">
                    {new Date(entry.publishedAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
