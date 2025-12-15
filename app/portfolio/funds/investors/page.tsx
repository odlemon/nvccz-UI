"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Mail, Phone, Building, DollarSign, Calendar, Users } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

const investors = [
  {
    id: 1,
    name: "Sarah Johnson",
    organization: "Pension Fund Associates",
    type: "Institutional",
    commitment: "$5M",
    deployed: "$3.2M",
    funds: ["Kyntaro Growth Fund I", "Kyntaro Tech Fund"],
    joinDate: "2022-03-15",
    email: "sarah.johnson@pfa.com",
    phone: "+1 (555) 123-4567",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "Michael Chen",
    organization: "Family Office Partners",
    type: "Family Office",
    commitment: "$3M",
    deployed: "$2.8M",
    funds: ["Kyntaro Seed Fund"],
    joinDate: "2023-01-20",
    email: "m.chen@fop.com",
    phone: "+1 (555) 234-5678",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    organization: "High Net Worth Individual",
    type: "Individual",
    commitment: "$1.5M",
    deployed: "$1.1M",
    funds: ["Kyntaro Growth Fund I"],
    joinDate: "2022-08-10",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function InvestorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All")

  const investorTypes = ["All", "Institutional", "Family Office", "Individual"]

  const filteredInvestors = investors.filter((investor) => {
    const matchesSearch =
      investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "All" || investor.type === selectedType
    return matchesSearch && matchesType
  })

  const totalCommitment = investors.reduce(
    (sum, inv) => sum + Number.parseFloat(inv.commitment.replace("$", "").replace("M", "")),
    0,
  )
  const totalDeployed = investors.reduce(
    (sum, inv) => sum + Number.parseFloat(inv.deployed.replace("$", "").replace("M", "")),
    0,
  )

  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="funds">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investors</h1>
            <p className="text-gray-600 mt-1">Manage your investor relationships and commitments</p>
          </div>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Investor
          </Button>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Investors</p>
                <p className="text-2xl font-bold text-blue-900">{investors.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Commitments</p>
                <p className="text-2xl font-bold text-green-900">${totalCommitment}M</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Deployed Capital</p>
                <p className="text-2xl font-bold text-purple-900">${totalDeployed}M</p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Deployment Rate</p>
                <p className="text-2xl font-bold text-amber-900">
                  {Math.round((totalDeployed / totalCommitment) * 100)}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search investors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {investorTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInvestors.map((investor) => (
          <Card key={investor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={investor.avatar || "/placeholder.svg"} alt={investor.name} />
                    <AvatarFallback>
                      {investor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{investor.name}</CardTitle>
                    <p className="text-sm text-gray-600">{investor.organization}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {investor.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Commitment</p>
                    <p className="text-lg font-semibold">{investor.commitment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deployed</p>
                    <p className="text-lg font-semibold text-green-600">{investor.deployed}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {investor.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {investor.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined {investor.joinDate}
                  </div>
                </div>

                {/* Fund Participation */}
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Fund Participation</p>
                  <div className="flex flex-wrap gap-1">
                    {investor.funds.map((fund, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {fund}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </ModuleGuard>
  )
}
