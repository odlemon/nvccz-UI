"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DollarSign, X, CreditCard, FileText, TrendingUp, Eye, Check, XCircle } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchCompanyFinancialReports } from "@/lib/store/slices/portfolioCompaniesSlice"
import { FinancialReportReviewModal } from "./financial-report-review-modal"
import { PortfolioFinancialReport } from "@/lib/api/portfolio-api"
import { format } from "date-fns"
import { FinancialReportsSkeleton } from "./financial-reports-skeleton"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTFOLIO_ACTIONS } from "@/lib/config/role-permissions"

export function CompanyDrawer() {
  const { hasSpecificAction } = useRolePermissions()
  const canReviewReports = hasSpecificAction('portfolio-management', PORTFOLIO_ACTIONS.REVIEW_FINANCIAL_REPORT)

  const dispatch = useAppDispatch()
  const { selectedCompany, financialReports, financialReportsLoading } = useAppSelector(state => state.portfolioCompanies)
  const [activeTab, setActiveTab] = useState<'overview' | 'disbursements' | 'financials'>('overview')
  const [isReviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportToReview, setReportToReview] = useState<PortfolioFinancialReport | null>(null)

  useEffect(() => {
    if (selectedCompany && activeTab === 'financials') {
      dispatch(fetchCompanyFinancialReports(selectedCompany.id))
    }
  }, [selectedCompany, activeTab, dispatch])

  const handleReviewClick = (report: PortfolioFinancialReport) => {
    setReportToReview(report)
    setReviewModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-700 border-green-400/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-700 border-yellow-400/30'
      case 'INACTIVE': return 'bg-gray-500/20 text-gray-700 border-gray-400/30'
      case 'CLOSED': return 'bg-red-500/20 text-red-700 border-red-400/30'
      default: return 'bg-blue-500/20 text-blue-700 border-blue-400/30'
    }
  }

  const getDisbursementStatusColor = (status: string) => {
    switch (status) {
      case 'DISBURSED': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'APPROVED': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      BALANCE_SHEET: 'Balance Sheet',
      INCOME_STATEMENT: 'Income Statement',
      CASHFLOW_STATEMENT: 'Cashflow Statement',
    }
    return map[type] || type
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'disbursements', label: 'Disbursements', icon: CreditCard, count: selectedCompany?.disbursements?.length || 0 },
    { id: 'financials', label: 'Financial Reports', icon: TrendingUp, count: financialReports.length },
  ]

  return (
    <>
      <FinancialReportReviewModal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} report={reportToReview} />
      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && dispatch({ type: 'portfolioCompanies/setSelectedCompany', payload: null })}>
        <SheetContent className="w-[50vw] min-w-[1000px] max-w-[1600px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
          {selectedCompany && (
            <>
              <SheetHeader className="p-6 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl">{selectedCompany.name}</SheetTitle>
                  <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'portfolioCompanies/setSelectedCompany', payload: null })}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </SheetHeader>
              {/* <SheetHeader>
                          <SheetTitle className="text-2xl font-normal flex items-center gap-2">
                            <CiFileOn className="w-6 h-6" /> {selected?.businessName}
                          </SheetTitle>
                        </SheetHeader> */}
              <div className="p-6">
                <div className="border-b mb-6">
                  <div className="flex space-x-6">
                    {tabs.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <Badge variant="secondary" className="rounded-full">{tab.count}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" />Company Information</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div><label className="text-sm text-gray-500">Registration Number</label><p className="text-base font-mono">{selectedCompany.registrationNumber}</p></div>
                        <div><label className="text-sm text-gray-500">Industry</label><p className="text-base font-medium">{selectedCompany.industry}</p></div>
                        <div><label className="text-sm text-gray-500">Status</label><div className="mt-1"><Badge className={getStatusColor(selectedCompany.status)}>{selectedCompany.status}</Badge></div></div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5" />Investment Details</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-sm text-gray-500">Total Invested</label><p className="text-xl font-semibold text-blue-600">${(Number(selectedCompany.totalInvested) || 0).toLocaleString()}</p></div>
                          <div><label className="text-sm text-gray-500">Disbursements</label><p className="text-xl font-semibold text-emerald-600">{selectedCompany.disbursements?.length || 0}</p></div>
                        </div>
                        <div><label className="text-sm text-gray-500">Fund</label><p className="text-base font-medium">{selectedCompany.fund?.name || 'No fund assigned'}</p></div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'disbursements' && (
                  <div className="space-y-4">
                    {(selectedCompany.disbursements?.length || 0) > 0 ? (
                      selectedCompany.disbursements.map((disbursement) => (
                        <Card key={disbursement.id}><CardContent className="pt-6"><div className="flex justify-between items-start"><p className="font-semibold text-xl text-gray-900">${parseFloat(disbursement.amount).toLocaleString()}</p><Badge className={`text-xs ${getDisbursementStatusColor(disbursement.status)}`}>{disbursement.status}</Badge></div><div className="text-xs text-gray-500 pt-2 border-t mt-2">Disbursed on {new Date(disbursement.disbursementDate).toLocaleDateString()}</div></CardContent></Card>
                      ))
                    ) : (
                      <div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No disbursements yet</p></div>
                    )}
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="space-y-4">
                    {financialReportsLoading ? <FinancialReportsSkeleton /> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {financialReports.map((report, idx) => (
                          <motion.div
                            key={report.id}
                            className="group relative border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                              <div className="text-center">
                                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                                <p className="text-xs text-blue-600 font-medium">{getTypeLabel(report.reportType)}</p>
                              </div>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Button asChild size="sm" className="bg-white/90 hover:bg-white text-gray-900 rounded-full">
                                  <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-1" /> Preview</a>
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">{report.title}</p>
                                  <p className="text-[11px] text-gray-500">Period: {format(new Date(report.periodStart), 'd MMM yy')} - {format(new Date(report.periodEnd), 'd MMM yy')}</p>
                                  <p className="text-[11px] text-gray-500">By: {report.submittedByFirstName} {report.submittedByLastName}</p>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge className={`${getReportStatusColor(report.status)} text-[10px] px-1.5 py-0.5`}>{report.status}</Badge>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button size="xs" variant="outline" asChild className="rounded-full px-3 py-1">
                                  <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-3 h-3 mr-1" /> View</a>
                                </Button>
                                {report.status === 'PENDING' && canReviewReports && (
                                  <Button size="xs" onClick={() => handleReviewClick(report)} className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
                                    <Check className="w-3 h-3 mr-1" /> Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {!financialReportsLoading && financialReports.length === 0 && (
                      <div className="text-center py-12 col-span-full">
                        <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No financial reports submitted.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
