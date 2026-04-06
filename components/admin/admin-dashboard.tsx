"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchUsers, fetchDepartmentsWithRoles } from "@/lib/store/slices/adminSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Shield, Building2, Activity, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function AdminDashboard() {
  const dispatch = useAppDispatch()
  const { users, departmentsWithRoles, usersLoading, rolesLoading } = useAppSelector(state => state.admin)

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchUsers()).unwrap(),
          dispatch(fetchDepartmentsWithRoles()).unwrap()
        ])
      } catch (error: any) {
        toast.error("Failed to load admin data")
      }
    }
    loadData()
  }, [dispatch])

  // Calculate statistics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.role.name !== 'inactive').length
  const totalDepartments = departmentsWithRoles.length
  const totalRoles = departmentsWithRoles.reduce((acc, dept) => acc + dept.roles.length, 0)

  // Group users by department
  const usersByDepartment = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const dept = user.userDepartment || 'Unassigned'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push(user)
      return acc
    }, {} as Record<string, typeof users>)
    
    return Object.entries(grouped)
      .map(([department, users]) => ({
        department,
        count: users.length,
        roles: [...new Set(users.map(u => u.role.name))].length
      }))
      .sort((a, b) => b.count - a.count)
  }, [users])

  // Recent users (last 5)
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [users])

  if (usersLoading || rolesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl text-gray-900 mb-2">Admin Management Dashboard</h1>
        <p className="text-gray-600 font-normal">
          Comprehensive overview of users, roles, and system administration
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl gradient-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{totalUsers}</div>
            <p className="text-xs text-white/80">{activeUsers} active users</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl gradient-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Departments</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{totalDepartments}</div>
            <p className="text-xs text-white/80">With assigned roles</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Activity</CardTitle>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl">{usersByDepartment.length}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card className="bg-white rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Users by Department
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="rounded-full">
                View All Users
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersByDepartment.map((dept) => (
              <div key={dept.department} className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{dept.department}</h3>
                  <Badge variant="secondary">{dept.count} users</Badge>
                </div>
                <p className="text-sm text-gray-600">{dept.roles} unique roles</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {user.role.name}
                    </Badge>
                    {user.userDepartment && (
                      <p className="text-xs text-muted-foreground mt-1">{user.userDepartment}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-none">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/roles">
                <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  View Roles
                </Button>
              </Link>
              <Link href="/admin/departments">
                <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Department Overview
                </Button>
              </Link>
              <Link href="/admin/addresses">
                <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Company Addresses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
