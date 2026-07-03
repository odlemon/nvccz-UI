import { Card } from "@/components/ui/card"
import { Landmark } from "lucide-react"

export function NoFundSelected() {
  return (
    <Card className="bg-white border border-gray-200 shadow-none p-12 text-center">
      <Landmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-900">Select a Fund</p>
      <p className="text-sm text-muted-foreground mt-1">
        Choose a fund from the selector above to view its reporting workspace.
      </p>
    </Card>
  )
}
