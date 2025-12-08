"use client"

import { useState, useEffect } from "react"
import { Building2, TrendingUp, DollarSign, BarChart3, Eye, X, CreditCard } from "lucide-react"
import { 
  CiBank, 
  CiDollar, 
  CiSearch, 
  CiCirclePlus,
  CiEdit,
  CiTrash,
  CiCreditCard1
} from "react-icons/ci"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchPortfolioCompanies, setSelectedCompany } from "@/lib/store/slices/portfolioCompaniesSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyDrawer } from "@/components/portfolio/companies/company-drawer"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function CompaniesPage() {
  const dispatch = useAppDispatch()
  const { companies, loading, error } = useAppSelector(state => state.portfolioCompanies)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSector, setSelectedSector] = useState("All")

  useEffect(() => {
    dispatch(fetchPortfolioCompanies())
  }, [dispatch])

  const sectors = ["All", "Technology", "Healthcare", "Clean Energy", "Fintech", "Legal Technology", "Other"]

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSector = selectedSector === "All" || company.industry === selectedSector
    return matchesSearch && matchesSector
  })

  const totalCompanies = companies.length
  const activeCompanies = companies.filter(c => c.status === 'ACTIVE').length
  const totalInvestment = companies.reduce((sum, c) => sum + (Number(c.totalInvested) || 0), 0)
  const avgPerformance = companies.length > 0 ? (totalInvestment / companies.length) : 0

  const handleViewCompany = (company: any) => {
    dispatch(setSelectedCompany(company))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500 text-white border-green-400'
      case 'PENDING': return 'bg-gray-500 text-white border-yellow-400'
      case 'INACTIVE': return 'bg-gray-500 text-white border-gray-400'
      case 'CLOSED': return 'bg-red-500 text-white border-red-400'
      default: return 'bg-blue-500 text-white border-blue-400'
    }
  }

  const getStatusColorLight = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-300'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'INACTIVE': return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'CLOSED': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-blue-100 text-blue-700 border-blue-300'
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

  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="companies">
      <PortfolioLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-normal text-gray-900">Portfolio Companies</h1>
              <p className="text-gray-600 mt-1">Manage and track your portfolio companies</p>
            </div>
          </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Companies */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <CiBank className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">Total Companies</p>
                  <p className="text-3xl font-normal text-white">{totalCompanies}</p>
                </div>
              </div>
              {/* <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="w-3/4 h-2 bg-white rounded-full"></div>
              </div> */}
            </div>

            {/* Active Investments */}
            <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">Active Companies</p>
                  <p className="text-3xl font-normal text-white">{activeCompanies}</p>
                </div>
              </div>
              {/* <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="w-4/5 h-2 bg-white rounded-full"></div>
              </div> */}
            </div>

            {/* Total Investment */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <CiDollar className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">Total Investment</p>
                  <p className="text-3xl font-normal text-white">${(totalInvestment / 1000).toFixed(1)}K</p>
                </div>
              </div>
              {/* <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="w-2/3 h-2 bg-white rounded-full"></div>
              </div> */}
            </div>

            {/* Avg Investment */}
            <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">Avg. Investment</p>
                  <p className="text-3xl font-normal text-white">${avgPerformance.toFixed(0)}</p>
                </div>
              </div>
              {/* <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="w-5/6 h-2 bg-white rounded-full"></div>
              </div> */}
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-full border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {sectors.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSector(sector)}
                    className={selectedSector === sector 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full border-0 whitespace-nowrap" 
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full whitespace-nowrap"
                    }
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div 
                key={company.id} 
                onClick={() => handleViewCompany(company)}
                className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-2xl p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{company.name}</h3>
                      <p className="text-sm text-white/80">{company.industry}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(company.status)}`}>
                    {company.status}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/70">Total Invested</p>
                      <p className="text-lg font-normal text-white">${(Number(company.totalInvested) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Disbursements</p>
                      <p className="text-lg font-normal text-white">{company.disbursements?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Fund</p>
                      <p className="text-sm font-normal text-white truncate">{company.fund?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Owner</p>
                      <p className="text-sm font-normal text-white truncate">{company.user?.firstName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Last Update */}
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Registration</span>
                    <span className="text-white/90 text-xs font-mono">{(company.registrationNumber || '').slice(0, 15)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Company Drawer */}
        <CompanyDrawer />
      </div>
    </PortfolioLayout>
    </ModuleGuard>
  )
}
