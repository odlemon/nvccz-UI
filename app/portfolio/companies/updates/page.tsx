"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, TrendingUp, Users, Plus } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

const quarterlyUpdates = [
  {
    id: 1,
    company: "TechFlow Solutions",
    quarter: "Q4 2024",
    status: "Submitted",
    submittedDate: "2024-01-15",
    revenue: "$2.4M",
    growth: "+23%",
    highlights: [
      "Launched new AI-powered analytics platform",
      "Secured 3 enterprise clients",
      "Expanded team by 8 members",
    ],
    challenges: ["Supply chain delays affecting hardware delivery", "Increased competition in the market"],
    nextQuarterGoals: ["Launch mobile application", "Expand to European markets", "Achieve $3M ARR"],
  },
  {
    id: 2,
    company: "GreenEnergy Corp",
    quarter: "Q4 2024",
    status: "Pending",
    submittedDate: null,
    revenue: "$1.8M",
    growth: "+18%",
    highlights: [],
    challenges: [],
    nextQuarterGoals: [],
  },
  {
    id: 3,
    company: "HealthTech Innovations",
    quarter: "Q4 2024",
    status: "Under Review",
    submittedDate: "2024-01-10",
    revenue: "$950K",
    growth: "+12%",
    highlights: ["FDA approval for new medical device", "Partnership with major hospital network"],
    challenges: ["Regulatory compliance costs higher than expected"],
    nextQuarterGoals: ["Scale manufacturing operations", "Hire VP of Sales"],
  },
]

export default function QuarterlyUpdatesPage() {
  const [selectedStatus, setSelectedStatus] = useState("All")
  const statuses = ["All", "Submitted", "Pending", "Under Review"]

  const filteredUpdates = quarterlyUpdates.filter(
    (update) => selectedStatus === "All" || update.status === selectedStatus,
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Under Review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="companies">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quarterly Updates</h1>
            <p className="text-gray-600 mt-1">Review and manage portfolio company quarterly reports</p>
          </div>
          <Button variant="gradient-update">
            <Plus className="w-4 h-4 mr-2" />
            Request Update
          </Button>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Submitted</p>
                <p className="text-2xl font-bold text-green-900">18</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">6</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Under Review</p>
                <p className="text-2xl font-bold text-blue-900">3</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Growth</p>
                <p className="text-2xl font-bold text-purple-900">+17.8%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "gradient-update" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Updates List */}
      <div className="space-y-6">
        {filteredUpdates.map((update) => (
          <Card key={update.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{update.company}</CardTitle>
                  <p className="text-gray-600">{update.quarter}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(update.status)}>{update.status}</Badge>
                  {update.submittedDate && (
                    <span className="text-sm text-gray-600">Submitted: {update.submittedDate}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{update.revenue}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Growth</p>
                  <p className="text-2xl font-bold text-green-600">{update.growth}</p>
                </div>
              </div>

              {update.status === "Submitted" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Highlights</h4>
                    <ul className="space-y-1">
                      {update.highlights.map((highlight, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Challenges</h4>
                    <ul className="space-y-1">
                      {update.challenges.map((challenge, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Next Quarter Goals</h4>
                    <ul className="space-y-1">
                      {update.nextQuarterGoals.map((goal, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {update.status === "Pending" && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Update not yet submitted</p>
                  <Button variant="outline">Send Reminder</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </ModuleGuard>
  )
}
