import { AddressesManagement } from "@/components/admin/addresses-management"
import { AdminLayout } from "@/components/layout/admin-layout"

export default function AddressesPage() {
  return (
    <AdminLayout>
      <div className="mx-auto py-6 px-6">
        <AddressesManagement />
      </div>
    </AdminLayout>
  )
}
