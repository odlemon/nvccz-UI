'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CiUser, 
  CiCircleCheck, 
  CiCircleMinus, 
  CiClock1,
  CiImport,
  CiSquareCheck,
  CiViewList,
  CiExport,
  CiFileOn,
  CiBank,
  CiCalendar,
  CiFilter
} from 'react-icons/ci'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Upload, 
  FileText, 
  FileIcon,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DueDiligence() {
  const router = useRouter()
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null)

  const ddApplications = [
    {
      id: "APP-001",
      company: "TechCorp Inc.",
      sector: "Technology",
      amount: 15000000,
      stage: "Series A",
      submittedAt: "2024-01-15",
      businessDescription: "Revolutionary AI-powered solutions for enterprise automation and smart manufacturing.",
      industry: "Technology",
      businessStage: "GROWTH",
      foundingDate: "2020-03-15",
      progress: 75,
      completedItems: 12,
      totalItems: 16,
      daysRemaining: 15,
      status: "in_progress"
    },
    {
      id: "APP-002",
      company: "GreenEnergy Solutions",
      sector: "Energy",
      amount: 25000000,
      stage: "Series B",
      submittedAt: "2024-01-10",
      businessDescription: "Sustainable energy solutions for industrial and residential applications.",
      industry: "Energy",
      businessStage: "MATURE",
      foundingDate: "2018-06-20",
      progress: 45,
      completedItems: 7,
      totalItems: 16,
      daysRemaining: 8,
      status: "in_progress"
    },
    {
      id: "APP-003",
      company: "HealthTech Innovations",
      sector: "Healthcare",
      amount: 8000000,
      stage: "Seed",
      submittedAt: "2024-01-20",
      businessDescription: "Cutting-edge medical devices and healthcare technology solutions.",
      industry: "Healthcare",
      businessStage: "EARLY",
      foundingDate: "2022-01-10",
      progress: 25,
      completedItems: 4,
      totalItems: 16,
      daysRemaining: 22,
      status: "pending"
    },
    {
      id: "APP-004",
      company: "FinTech Dynamics",
      sector: "Finance",
      amount: 20000000,
      stage: "Series A",
      submittedAt: "2024-01-05",
      businessDescription: "Next-generation financial technology solutions for digital banking.",
      industry: "Finance",
      businessStage: "GROWTH",
      foundingDate: "2019-09-15",
      progress: 90,
      completedItems: 14,
      totalItems: 16,
      daysRemaining: 3,
      status: "in_progress"
    },
    {
      id: "APP-005",
      company: "RetailTech Solutions",
      sector: "Retail",
      amount: 12000000,
      stage: "Series B",
      submittedAt: "2024-01-12",
      businessDescription: "Next-generation retail technology solutions for omnichannel commerce.",
      industry: "Retail",
      businessStage: "MATURE",
      foundingDate: "2018-11-10",
      progress: 60,
      completedItems: 10,
      totalItems: 16,
      daysRemaining: 12,
      status: "in_progress"
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleViewApplication = (appId: string) => {
    setSelectedApplication(appId)
    router.push(`/applications/due-diligence/single-view?id=${appId}`)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-gray-900">
            Due Diligence Applications
          </h1>
          <p className="text-gray-600 mt-1">Review and manage due diligence processes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full border-gray-300">
            <CiFilter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full">
            <CiImport className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ddApplications.map((app) => (
          <Card key={app.id} className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{app.company}</h3>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {app.sector}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{app.stage} • ${app.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <CiCalendar className="w-4 h-4" />
                      <span>{app.submittedAt}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(app.status)}`}>
                  {app.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {app.businessDescription}
                </p>
              </div>

              {/* Due Diligence Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Due Diligence Progress</span>
                  <span className="text-sm font-bold text-gray-900">{app.completedItems}/{app.totalItems} completed</span>
                </div>
                
                {/* Single Thick Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-4 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${app.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span>Days Remaining: </span>
                  <span className="font-semibold text-gray-900">{app.daysRemaining}</span>
                </div>
                <Button
                  onClick={() => handleViewApplication(app.id)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-4 py-2"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
