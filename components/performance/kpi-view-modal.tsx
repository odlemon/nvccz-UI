"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Target,
  TrendingUp,
  Calendar,
  Building,
  Hash,
  DollarSign,
  Percent,
  Activity,
  BarChart3
} from "lucide-react"

interface KPIViewModalProps {
  kpi: any
  isOpen: boolean
  onClose: () => void
}

export function KPIViewModal({ kpi, isOpen, onClose }: KPIViewModalProps) {
  if (!kpi) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Currency':
        return <DollarSign className="w-5 h-5" />
      case 'Percentage':
        return <Percent className="w-5 h-5" />
      case 'Number':
        return <Hash className="w-5 h-5" />
      case 'Ratio':
        return <BarChart3 className="w-5 h-5" />
      case 'Metric':
        return <Activity className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-blue-100 text-blue-800'
      case 'financial': return 'bg-green-100 text-green-800'
      case 'operational': return 'bg-orange-100 text-orange-800'
      case 'investment': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800'
      case 'weekly': return 'bg-yellow-100 text-yellow-800'
      case 'monthly': return 'bg-blue-100 text-blue-800'
      case 'quarterly': return 'bg-green-100 text-green-800'
      case 'yearly': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            {getTypeIcon(kpi.type)}
            {kpi.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {kpi.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(kpi.type)}
                    <span className="text-sm text-gray-900">{kpi.type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {kpi.unitSymbol || ""}{kpi.unit || ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight Value</label>
                  <p className="text-sm text-gray-900 mt-1">{kpi.weightValue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories and Status */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal">Categories & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1">
                    <Badge className={getCategoryColor(kpi.category || "sales")}>
                      {(kpi.category || "sales").charAt(0).toUpperCase() + (kpi.category || "sales").slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Frequency</label>
                  <div className="mt-1">
                    <Badge className={getFrequencyColor(kpi.frequency || "monthly")}>
                      {(kpi.frequency || "monthly").charAt(0).toUpperCase() + (kpi.frequency || "monthly").slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={kpi.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {kpi.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Branch</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {kpi.branch || 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Goals */}
          {kpi.performanceGoals && kpi.performanceGoals.length > 0 && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-normal flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Goals ({kpi._count?.performanceGoals || kpi.performanceGoals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kpi.performanceGoals.map((goal: any, index: number) => (
                    <div key={goal.id || index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">{goal.stage}</Badge>
                          <Badge className={
                            goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                            goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(kpi.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(kpi.updatedAt)}
                  </p>
                </div>
                {kpi.departmentId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department ID</label>
                    <p className="text-sm text-gray-900 mt-1">{kpi.departmentId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
