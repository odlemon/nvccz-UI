"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Building,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  Calendar,
  CreditCard,
  X,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Download,
  Landmark,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { TransactionsDataTable } from "./transactions-data-table"
import { procurementApiV2, KYCDocument, VendorBank } from "@/lib/api/procurement-api-v2"
import { toast } from "sonner"

interface Vendor {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  taxNumber: string | null
  contactPerson: string | null
  paymentTerms: string | null
  isActive: boolean
  isBlacklisted?: boolean
  blacklistReason?: string | null
  blacklistedAt?: string | null
  createdAt: string
  updatedAt: string
  transactions?: VendorTransaction[]
  summary?: {
    invoiceCount: number
    invoiceTotal: number
    purchaseOrderCount: number
    purchaseOrderTotal: number
    cashbookCount: number
    cashbookInTotal: number
    cashbookOutTotal: number
  }
}

interface VendorTransaction {
  id: string
  source: string
  type: string
  reference: string
  description: string
  date: string
  amount: number
  subtotal?: number
  taxAmount?: number
  status: string
  paymentStatus?: string
  dueDate?: string | null
  currency?: string | null
  direction?: string
  counterpartyType?: string
  bank?: {
    id: string
    name: string
    accountNumber: string
  }
  journalEntry?: {
    id: string
    referenceNumber: string
    status: string
  } | null
}

interface VendorViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  vendor?: Vendor | null
  onVendorUpdated?: () => void
}

const vendorTabs = [
  { id: "overview", label: "Vendor Info", icon: Building },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "banks", label: "Bank Accounts", icon: Landmark },
  { id: "kyc", label: "KYC Documents", icon: FileText },
]

export function VendorViewDrawer({ isOpen, onClose, vendor, onVendorUpdated }: VendorViewDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isBlacklisted, setIsBlacklisted] = useState(false)
  const [blacklistReason, setBlacklistReason] = useState<string | null>(null)

  const [banks, setBanks] = useState<VendorBank[]>([])
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [loadingBlacklistAction, setLoadingBlacklistAction] = useState(false)
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [reasonMode, setReasonMode] = useState<"blacklist" | "unblacklist">("blacklist")
  const [actionReason, setActionReason] = useState("")

  useEffect(() => {
    if (!vendor) return

    setIsBlacklisted(Boolean(vendor.isBlacklisted))
    setBlacklistReason(vendor.blacklistReason || null)
    setActiveTab("overview")
  }, [vendor])

  useEffect(() => {
    if (!vendor?.id || !isOpen) return

    const loadBanks = async () => {
      setLoadingBanks(true)
      try {
        const response = await procurementApiV2.getVendorBanks(vendor.id)
        setBanks(response.data || [])
      } catch (error: any) {
        toast.error("Failed to load vendor banks", { description: error?.message || "Please try again" })
        setBanks([])
      } finally {
        setLoadingBanks(false)
      }
    }

    const loadKyc = async () => {
      setLoadingKyc(true)
      try {
        const response = await procurementApiV2.getVendorKYCDocs(vendor.id)
        setKycDocuments(response.data || [])
      } catch (error: any) {
        toast.error("Failed to load KYC documents", { description: error?.message || "Please try again" })
        setKycDocuments([])
      } finally {
        setLoadingKyc(false)
      }
    }

    loadBanks()
    loadKyc()
  }, [vendor?.id, isOpen])

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const transformedTransactions = (vendor?.transactions || []).map((txn: VendorTransaction) => {
    let debitAmount = 0
    let creditAmount = 0

    if (txn.source === "CASHBOOK") {
      if (txn.direction === "OUT") {
        creditAmount = Math.abs(txn.amount)
      } else {
        debitAmount = Math.abs(txn.amount)
      }
    } else if (txn.source === "PROCUREMENT_INVOICE" || txn.type === "INVOICE") {
      creditAmount = txn.amount
    } else if (txn.source === "PURCHASE_ORDER" || txn.type === "PURCHASE_ORDER") {
      creditAmount = txn.amount
    } else {
      if (txn.amount >= 0) {
        debitAmount = txn.amount
      } else {
        creditAmount = Math.abs(txn.amount)
      }
    }

    return {
      id: txn.id,
      date: txn.date,
      reference: txn.reference,
      description: txn.description,
      debitAmount,
      creditAmount,
      source: txn.source,
      journalEntry: txn.journalEntry
        ? {
            id: txn.journalEntry.id,
            referenceNumber: txn.journalEntry.referenceNumber,
            description: txn.description,
            transactionDate: txn.date,
            status: txn.journalEntry.status,
            currencyId: txn.currency || "USD",
          }
        : undefined,
      journalEntryId: txn.journalEntry?.id,
      journalEntryStatus: txn.journalEntry?.status || txn.status,
    }
  })

  const sortedKycDocuments = useMemo(() => {
    return [...kycDocuments].sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime()
      const dateB = new Date(b.uploadedAt).getTime()
      return dateB - dateA
    })
  }, [kycDocuments])

  if (!vendor) return null

  const openReasonModal = (mode: "blacklist" | "unblacklist") => {
    setReasonMode(mode)
    setActionReason(mode === "unblacklist" ? "Reinstated after review" : "")
    setIsReasonModalOpen(true)
  }

  const submitBlacklistAction = async () => {
    if (!vendor?.id) return

    if (!actionReason || !actionReason.trim()) {
      toast.error("Blacklist reason is required")
      return
    }

    setLoadingBlacklistAction(true)
    try {
      if (reasonMode === "blacklist") {
        const response = await procurementApiV2.blacklistVendor(vendor.id, { reason: actionReason.trim() })
        if (!response.success) {
          throw new Error(response.message || "Failed to blacklist vendor")
        }

        setIsBlacklisted(true)
        setBlacklistReason(actionReason.trim())
        toast.success("Vendor blacklisted")
      } else {
        const response = await procurementApiV2.unblacklistVendor(vendor.id, { reason: actionReason.trim() })
        if (!response.success) {
          throw new Error(response.message || "Failed to unblacklist vendor")
        }

        setIsBlacklisted(false)
        setBlacklistReason(null)
        toast.success("Vendor removed from blacklist")
      }

      setIsReasonModalOpen(false)
      setActionReason("")
      onVendorUpdated?.()
    } catch (error: any) {
      const defaultMessage = reasonMode === "blacklist" ? "Failed to blacklist vendor" : "Failed to unblacklist vendor"
      toast.error(defaultMessage, { description: error?.message || "Please try again" })
    } finally {
      setLoadingBlacklistAction(false)
    }
  }

  const downloadKycDocument = async (documentId: string, fileName?: string) => {
    try {
      const blob = await procurementApiV2.downloadStaffKYCDoc(documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName || `kyc-${documentId}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error("Failed to download KYC document", { description: error?.message || "Please try again" })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[95vw] sm:max-w-[1200px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span>{vendor.name}</span>
                <Badge className={getStatusColor(vendor.isActive)}>
                  {getStatusIcon(vendor.isActive)}
                  <span className="ml-1">{vendor.isActive ? "Active" : "Inactive"}</span>
                </Badge>
                {isBlacklisted && <Badge className="bg-red-100 text-red-800">Blacklisted</Badge>}
              </div>
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex space-x-1 border-b flex-1 overflow-x-auto">
              {vendorTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm transition-all whitespace-nowrap",
                      isActive
                        ? "text-red-600 border-b-2 border-red-600"
                        : "text-gray-600 border-b-2 border-transparent hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {isBlacklisted ? (
              <Button variant="outline" className="gap-2" disabled={loadingBlacklistAction} onClick={() => openReasonModal("unblacklist")}>
                {loadingBlacklistAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Unblacklist
              </Button>
            ) : (
              <Button variant="destructive" className="gap-2" disabled={loadingBlacklistAction} onClick={() => openReasonModal("blacklist")}>
                {loadingBlacklistAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Blacklist
              </Button>
            )}
          </div>

          {isBlacklisted && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <span className="font-medium">Blacklist reason: </span>
              {blacklistReason || "No reason recorded"}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {activeTab === "overview" && (
            <>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Email</h4>
                        <p className="text-sm">{vendor.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Phone</h4>
                        <p className="text-sm">{vendor.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Contact Person</h4>
                        <p className="text-sm">{vendor.contactPerson || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Address</h4>
                        <p className="text-sm">{vendor.address || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Tax Number</h4>
                        <p className="text-sm font-mono">{vendor.taxNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Payment Terms</h4>
                        <p className="text-sm">{vendor.paymentTerms || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <h4 className="text-gray-900 font-medium text-sm">Created</h4>
                        <p className="text-sm">{format(new Date(vendor.createdAt), "PPP")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {vendor.summary && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 font-medium mb-1">Invoices</p>
                        <p className="text-2xl font-bold text-purple-900">{vendor.summary.invoiceCount}</p>
                        <p className="text-sm text-purple-700 mt-1">${vendor.summary.invoiceTotal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">Purchase Orders</p>
                        <p className="text-2xl font-bold text-blue-900">{vendor.summary.purchaseOrderCount}</p>
                        <p className="text-sm text-blue-700 mt-1">${vendor.summary.purchaseOrderTotal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-1">Cashbook In</p>
                        <p className="text-2xl font-bold text-green-900">{vendor.summary.cashbookCount}</p>
                        <p className="text-sm text-green-700 mt-1">${vendor.summary.cashbookInTotal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-600 font-medium mb-1">Cashbook Out</p>
                        <p className="text-2xl font-bold text-red-900">{vendor.summary.cashbookCount}</p>
                        <p className="text-sm text-red-700 mt-1">${vendor.summary.cashbookOutTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeTab === "transactions" && (
            <TransactionsDataTable transactions={transformedTransactions} loading={false} title="Vendor Transactions" />
          )}

          {activeTab === "banks" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Vendor Bank Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBanks ? (
                  <div className="py-6 text-sm text-gray-600 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading bank accounts...
                  </div>
                ) : banks.length === 0 ? (
                  <p className="text-sm text-gray-500">No bank accounts found for this vendor.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>Branch Code</TableHead>
                        <TableHead>SWIFT/BIC</TableHead>
                        <TableHead>Primary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banks.map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell>{(bank as any).name || bank.bankName || "-"}</TableCell>
                          <TableCell className="font-mono">{(bank as any).bankAccount || bank.accountNumber || "-"}</TableCell>
                          <TableCell>{(bank as any).branchCode || "-"}</TableCell>
                          <TableCell>{(bank as any).swiftBicCode || bank.swiftCode || "-"}</TableCell>
                          <TableCell>
                            {(bank as any).isPrimary || bank.isPrimary ? (
                              <Badge className="bg-emerald-100 text-emerald-800">Primary</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "kyc" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>KYC Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingKyc ? (
                  <div className="py-6 text-sm text-gray-600 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading KYC documents...
                  </div>
                ) : sortedKycDocuments.length === 0 ? (
                  <p className="text-sm text-gray-500">No KYC documents found for this vendor.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedKycDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.documentType}</TableCell>
                          <TableCell>{doc.fileName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.verificationStatus || "PENDING"}</Badge>
                          </TableCell>
                          <TableCell>{doc.uploadedAt ? format(new Date(doc.uploadedAt), "PPP p") : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadKycDocument(doc.id, doc.fileName)}>
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{reasonMode === "blacklist" ? "Blacklist Vendor" : "Remove Vendor From Blacklist"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blacklist-reason">Reason</Label>
                <Textarea
                  id="blacklist-reason"
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder={reasonMode === "blacklist" ? "Provide reason for blacklisting this vendor" : "Provide reason for unblacklisting this vendor"}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReasonModalOpen(false)} disabled={loadingBlacklistAction}>
                  Cancel
                </Button>
                <Button onClick={submitBlacklistAction} disabled={loadingBlacklistAction || !actionReason.trim()}>
                  {loadingBlacklistAction ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : reasonMode === "blacklist" ? "Blacklist" : "Unblacklist"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}

export const ViewVendorModal = VendorViewDrawer
