"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { Banknote, Package, User, Building, Calculator, Copy, FileSignature, Loader2, Upload, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { cashbookApi } from "@/lib/api/cashbook-api"

export function CashbookEntryViewDrawer({ isOpen, onClose, entry }) {
	const { toast } = useToast()
	const [showContraDialog, setShowContraDialog] = useState(false)
	const [generatingContra, setGeneratingContra] = useState(false)
	const [uploadingAttachment, setUploadingAttachment] = useState(false)

	const getRelevantTabs = () => {
		const baseTabs = [
			{ id: "overview", label: "Overview", icon: Package },
		]
		if (entry?.counterpartyType === "CUSTOMER") {
			baseTabs.push({ id: "customer", label: "Customer Info", icon: User })
		} else if (entry?.counterpartyType === "VENDOR" || entry?.counterpartyType === "SUPPLIER") {
			baseTabs.push({ id: "vendor", label: "Vendor", icon: Building })
		} else if (entry?.counterpartyType === "GL") {
			baseTabs.push({ id: "gl-account", label: "GL Account", icon: Calculator })
		}
		return baseTabs
	}

	const relevantTabs = useMemo(() => getRelevantTabs(), [entry?.counterpartyType])
	const [activeTab, setActiveTab] = useState("overview")

	useEffect(() => {
		setActiveTab(relevantTabs[0]?.id || "overview")
	}, [relevantTabs])

	if (!entry) return null

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		toast({
			title: "Success",
			description: "Copied to clipboard",
		})
	}

	const handleGenerateContra = async () => {
		if (!entry?.id) return

		setGeneratingContra(true)
		try {
			const response = await cashbookApi.generateContraEntry(entry.id)

			if (response.success) {
				toast({
					title: "Success",
					description: "Contra entry generated successfully",
				})
				setShowContraDialog(false)
				// Optionally refresh the entry or close drawer
			} else {
				toast({
					title: "Error",
					description: response.message || "Failed to generate contra entry",
					variant: "destructive",
				})
			}
		} catch (error: any) {
			toast({
				title: "Error",
				description: error?.message || "Failed to generate contra entry",
				variant: "destructive",
			})
		} finally {
			setGeneratingContra(false)
		}
	}

	const renderedTabs = relevantTabs.map((tab) => {
		const Icon = tab.icon
		const isActive = activeTab === tab.id

		return (
			<button
				key={tab.id}
				onClick={() => setActiveTab(tab.id)}
				className={cn(
					"flex items-center gap-2 px-4 py-2 text-sm transition-all",
					isActive
						? "text-blue-600 border-b-2 border-blue-600"
						: "text-gray-600 border-b-2 border-transparent hover:text-gray-900"
				)}
			>
				<Icon className="w-4 h-4" />
				{tab.label}
			</button>
		)
	})

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
				<SheetHeader>
					<div className="flex items-center justify-between">
						<SheetTitle className="flex items-center gap-3">
							<Banknote className="w-6 h-6" />
							{entry.type === "RECEIPT" ? "Receipt" : "Payment"} Details - {entry.bank?.name} ({entry.bank?.accountNumber}) - {entry.bank?.currency?.code}
							<Badge
								className={
									entry.status === "POSTED"
										? "bg-green-100 text-green-800"
										: "bg-yellow-100 text-yellow-800"
								}
							>
								{entry.status}
							</Badge>
						</SheetTitle>
						<Button
							onClick={() => setShowContraDialog(true)}
							variant="outline"
							size="sm"
							className="gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 border-0"
							disabled={entry.status !== "POSTED"}
						>
							<FileSignature className="w-4 h-4" />
							Generate Contra
						</Button>
					</div>
				</SheetHeader>

				{/* Tab Navigation */}
				<div className="mt-6">
					<div className="flex space-x-1 border-b">
						{renderedTabs}
					</div>
				</div>

				{/* Tab Content */}
				<div className="mt-6 space-y-6">
					{activeTab === "overview" && (
						<>
							{/* Transaction Information */}
							<Card className="shadow-sm">
								<CardHeader>
									<CardTitle>Transaction Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Reference</h4>
											<div className="flex items-center gap-2">
												<Badge className="font-mono">{entry.reference}</Badge>
												<button onClick={() => copyToClipboard(entry.reference)} className="text-gray-500 hover:text-gray-700">
													<Copy className="w-4 h-4" />
												</button>
											</div>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Date</h4>
											<p>{format(new Date(entry.transactionDate || entry.date), "PPP")}</p>
										</div>
										<div className="col-span-2">
											<h4 className="text-gray-900 font-medium">Description</h4>
											<p>{entry.description}</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Financial Information */}
							<Card className="shadow-sm">
								<CardHeader>
									<CardTitle>Financial Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Amount</h4>
											<p
												className={
													entry.type === "RECEIPT"
														? "text-green-600 font-bold text-xl"
														: "text-red-600 font-bold text-xl"
												}
											>
												{Number(entry.amount).toLocaleString()}
											</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Type</h4>
											<p>{entry.type}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Status</h4>
											<p>{entry.status}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Reconciled</h4>
											<p>{entry.isReconciled ? "Yes" : "No"}</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Additional Information */}
							<Card className="shadow-sm">
								<CardHeader>
									<CardTitle>Additional Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Counterparty Type</h4>
											<p>{entry.counterpartyType}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Created At</h4>
											<p>{format(new Date(entry.createdAt || new Date()), "PPP")}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Updated At</h4>
											<p>{entry.updatedAt ? format(new Date(entry.updatedAt), "PPP") : "N/A"}</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</>
					)}

					{activeTab === "customer" && (
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Customer Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{entry.counterpartyType === "CUSTOMER" && entry.customer ? (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Name</h4>
											<p>{entry.customer.name}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Tax Number</h4>
											<div className="flex items-center gap-2">
												<Badge>{entry.customer.taxNumber}</Badge>
												<button onClick={() => copyToClipboard(entry.customer.taxNumber)} className="text-gray-500 hover:text-gray-700">
													<Copy className="w-4 h-4" />
												</button>
											</div>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Contact Person</h4>
											<p>{entry.customer.contactPerson}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Email</h4>
											<p>{entry.customer.email}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Phone</h4>
											<p>{entry.customer.phone}</p>
										</div>
										<div className="col-span-2">
											<h4 className="text-gray-900 font-medium">Address</h4>
											<p>{entry.customer.address}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Payment Terms</h4>
											<p>{entry.customer.paymentTerms}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Active</h4>
											<p>{entry.customer.isActive ? "Yes" : "No"}</p>
										</div>
									</div>
								) : (
									<p>No customer information available.</p>
								)}
							</CardContent>
						</Card>
					)}

					{activeTab === "vendor" && (
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Vendor Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{entry.counterpartyType === "VENDOR" && entry.vendor ? (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Name</h4>
											<p>{entry.vendor.name}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Tax Number</h4>
											<div className="flex items-center gap-2">
												<Badge>{entry.vendor.taxNumber}</Badge>
												<button onClick={() => copyToClipboard(entry.vendor.taxNumber)} className="text-gray-500 hover:text-gray-700">
													<Copy className="w-4 h-4" />
												</button>
											</div>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Contact Person</h4>
											<p>{entry.vendor.contactPerson}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Email</h4>
											<p>{entry.vendor.email}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Phone</h4>
											<p>{entry.vendor.phone}</p>
										</div>
										<div className="col-span-2">
											<h4 className="text-gray-900 font-medium">Address</h4>
											<p>{entry.vendor.address}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Payment Terms</h4>
											<p>{entry.vendor.paymentTerms}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Active</h4>
											<p>{entry.vendor.isActive ? "Yes" : "No"}</p>
										</div>
									</div>
								) : (
									<p>No vendor information available.</p>
								)}
							</CardContent>
						</Card>
					)}

					{activeTab === "gl-account" && (
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>GL Account Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{entry.glAccount ? (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<h4 className="text-gray-900 font-medium">Account No</h4>
											<div className="flex items-center gap-2">
												<Badge className="font-mono">{entry.glAccount.accountNo}</Badge>
												<button onClick={() => copyToClipboard(entry.glAccount.accountNo)} className="text-gray-500 hover:text-gray-700">
													<Copy className="w-4 h-4" />
												</button>
											</div>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Account Name</h4>
											<p>{entry.glAccount.accountName}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Account Type</h4>
											<p>{entry.glAccount.accountType}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Financial Statement</h4>
											<p>{entry.glAccount.financialStatement}</p>
										</div>
										<div className="col-span-2">
											<h4 className="text-gray-900 font-medium">Notes</h4>
											<p>{entry.glAccount.notes}</p>
										</div>
										<div>
											<h4 className="text-gray-900 font-medium">Active</h4>
											<p>{entry.glAccount.isActive ? "Yes" : "No"}</p>
										</div>
									</div>
								) : (
									<p>No GL account information available.</p>
								)}
							</CardContent>
						</Card>
					)}

				{/* Receipt Attachment */}
				<Card className="mt-4">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Paperclip className="w-4 h-4" />
							Receipt Attachment
						</CardTitle>
					</CardHeader>
					<CardContent>
						{entry.receiptAttachment || entry.attachmentUrl ? (
							<div className="flex items-center gap-2 text-sm">
								<Paperclip className="w-4 h-4 text-blue-600" />
								<a
									href={entry.receiptAttachment || entry.attachmentUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline"
								>
									View Attachment
								</a>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Input
									type="file"
									id="receipt-upload"
									className="text-sm"
									disabled={uploadingAttachment}
									onChange={async (e) => {
										const file = e.target.files?.[0]
										if (!file) return
										setUploadingAttachment(true)
										try {
											const response = await cashbookApi.uploadReceiptAttachment(entry.id, file)
											if (response.success) {
												toast({ title: "Receipt attached successfully" })
											} else {
												throw new Error(response.error || "Upload failed")
											}
										} catch (error: any) {
											toast({ title: "Upload failed", description: error.message, variant: "destructive" })
										} finally {
											setUploadingAttachment(false)
										}
									}}
								/>
								{uploadingAttachment && <Loader2 className="w-4 h-4 animate-spin" />}
							</div>
						)}
					</CardContent>
				</Card>
				</div>
			</SheetContent>

			{/* Contra Generation Confirmation Dialog */}
			<AlertDialog open={showContraDialog} onOpenChange={(open) => !generatingContra && setShowContraDialog(open)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Generate Contra Entry</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to generate a contra entry for this transaction?
							<div className="mt-4 p-3 bg-gray-50 rounded-md space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Reference:</span>
									<span className="font-medium">{entry.reference}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Amount:</span>
									<span className="font-medium">{Number(entry.amount).toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Type:</span>
									<span className="font-medium">{entry.type}</span>
								</div>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel 
							disabled={generatingContra}
							className="rounded-full"
						>
							Cancel
						</AlertDialogCancel>
						<Button
							onClick={(e) => {
								e.preventDefault()
								handleGenerateContra()
							}}
							disabled={generatingContra}
							className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
						>
							{generatingContra ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<FileSignature className="w-4 h-4 mr-2" />
									Generate Contra
								</>
							)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Sheet>
	)
}
