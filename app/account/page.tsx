"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, DollarSign, Users, Building2, Calendar, Settings, Bell, Shield, Activity } from "lucide-react"

const recentActivity = [
  {
    id: 1,
    type: "investment",
    description: "New investment in TechFlow Solutions",
    amount: "$2.5M",
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: 2,
    type: "report",
    description: "Q4 2024 performance report generated",
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: 3,
    type: "meeting",
    description: "Board meeting scheduled with GreenEnergy Corp",
    date: "2024-01-13",
    status: "scheduled",
  },
]

const notifications = [
  {
    id: 1,
    title: "Quarterly Report Due",
    message: "TechFlow Solutions quarterly report is due in 3 days",
    type: "warning",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Investment Approved",
    message: "Board approved $1.8M investment in HealthTech Innovations",
    type: "success",
    time: "1 day ago",
  },
]

export default function AccountDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arcus Dashboard</h1>
          <p className="text-gray-600 mt-1">Your investment management overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/professional-avatar.png" alt="Profile" />
              <AvatarFallback>OC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Oscar Carol</h2>
              <p className="text-gray-600">Lead Manager • Arcus Investment</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
                <span className="text-sm text-gray-500">Last login: Today, 9:30 AM</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Account Level</p>
              <p className="text-lg font-semibold text-amber-600">Premium</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total AUM</p>
                <p className="text-2xl font-bold text-blue-900">$150M</p>
                <p className="text-sm text-blue-600 mt-1">+12% this quarter</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Portfolio IRR</p>
                <p className="text-2xl font-bold text-green-900">18.7%</p>
                <p className="text-sm text-green-600 mt-1">Above benchmark</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Active Investments</p>
                <p className="text-2xl font-bold text-purple-900">38</p>
                <p className="text-sm text-purple-600 mt-1">Across 3 funds</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Investors</p>
                <p className="text-2xl font-bold text-amber-900">74</p>
                <p className="text-sm text-amber-600 mt-1">+8 this month</p>
              </div>
              <Users className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${activity.type === "investment"
                        ? "bg-green-500"
                        : activity.type === "report"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">{activity.date}</p>
                  </div>
                  {activity.amount && <span className="font-semibold text-green-600">{activity.amount}</span>}
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>{activity.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <Badge
                      variant="outline"
                      className={
                        notification.type === "warning"
                          ? "border-amber-200 text-amber-700"
                          : notification.type === "success"
                            ? "border-green-200 text-green-700"
                            : "border-blue-200 text-blue-700"
                      }
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <Building2 className="w-6 h-6" />
              <span>Add Company</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <DollarSign className="w-6 h-6" />
              <span>New Investment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <Users className="w-6 h-6" />
              <span>Add Investor</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <Calendar className="w-6 h-6" />
              <span>Schedule Meeting</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
