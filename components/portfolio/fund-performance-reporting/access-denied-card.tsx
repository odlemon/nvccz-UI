import { Card } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export function AccessDeniedCard({ message }: { message?: string }) {
  return (
    <Card className="bg-white border border-gray-200 shadow-none p-12 text-center">
      <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-900">Access Restricted</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {message ?? "You do not have permission to view this section. Contact your administrator if you believe this is an error."}
      </p>
    </Card>
  )
}
