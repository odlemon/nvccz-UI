"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchCompany, updateCompany } from "@/lib/store/slices/applicationPortalSlice"
import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, X } from "lucide-react"
import { toast } from "sonner"
import { CompanyInfoCard } from "@/components/portfolio/company-info-card"
import { ContactInfoCard } from "@/components/portfolio/contact-info-card"
import { AdditionalInfoCard } from "@/components/portfolio/additional-info-card"
import { CompanyEditForm } from "@/components/portfolio/company-edit-form"
import { PortfolioSkeleton } from "@/components/portfolio/portfolio-skeleton"
import { InvestmentRecipientGuard } from "@/components/user-application-portal/investment-recipient-guard"

export default function PortfolioCompanyPage() {
  const dispatch = useAppDispatch()
  const { company, companyLoading } = useAppSelector((state) => state.applicationPortal)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    address: '',
    website: '',
    description: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
  })

  useEffect(() => {
    dispatch(fetchCompany())
  }, [dispatch])

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        address: company.address || '',
        website: company.website || '',
        description: company.description || '',
        contactPerson: company.contactPerson || '',
        contactPhone: company.contactPhone || '',
        contactEmail: company.contactEmail || '',
      })
    }
  }, [company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(updateCompany(formData)).unwrap()
      toast.success('Company information updated successfully')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error || 'Failed to update company information')
    }
  }

  if (companyLoading) {
    return (
      <ApplicationPortalLayout>
        <PortfolioSkeleton />
      </ApplicationPortalLayout>
    )
  }

  if (!company) {
    return (
      <ApplicationPortalLayout>
        <InvestmentRecipientGuard>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Company Found</h3>
                <p className="text-muted-foreground">Your company profile will appear here once registered.</p>
              </div>
            </div>
          </div>
        </InvestmentRecipientGuard>
      </ApplicationPortalLayout>
    )
  }

  return (
    <ApplicationPortalLayout>
      <InvestmentRecipientGuard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Portfolio Company Profile
            </h1>
            <p className="text-muted-foreground">Manage your company information</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={
              company.status === 'ACTIVE' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
            }>
              {company.status}
            </Badge>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className={
                isEditing
                  ? "rounded-full h-10 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  : "rounded-full h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              }
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Company Information */}
        {isEditing ? (
          <CompanyEditForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-6">
            <CompanyInfoCard company={company} />
            <ContactInfoCard company={company} />
            <AdditionalInfoCard company={company} />
          </div>
        )}
      </div>
      </InvestmentRecipientGuard>
    </ApplicationPortalLayout>
  )
}
