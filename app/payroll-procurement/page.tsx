import { ProcurementLayout } from "@/components/layout/procurement-layout"

export default function PayrollProcurementPage() {
  return (
    <ProcurementLayout>
      <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll & Procurement</h1>
        <p className="text-gray-600">Manage payroll operations and procurement processes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Employees</span>
              <span className="font-semibold">247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-semibold text-orange-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month's Payroll</span>
              <span className="font-semibold text-green-600">$2.4M</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Payroll processed for Q4</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New vendor approved</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Procurement request pending</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Process Payroll
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Add Vendor
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Create Purchase Order
            </button>
          </div>
        </div>
      </div>
      </div>
    </ProcurementLayout>
  )
}
