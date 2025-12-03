"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { kpiApiService } from "@/lib/api/kpi-api"
import { getAuthToken } from "@/lib/utils/cookies"
import { toast } from "sonner"

export function TestAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testKPIApi = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const token = getAuthToken()
      console.log('Current token:', token ? 'Present' : 'Not found')
      
      const response = await kpiApiService.getKPIs()
      setResult({ success: true, data: response })
      toast.success("API call successful!")
    } catch (error: any) {
      console.error('API test failed:', error)
      setResult({ success: false, error: error.message })
      toast.error(`API call failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testKPIApi} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Testing..." : "Test KPI API"}
          </Button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">
              {result.success ? "✅ Success" : "❌ Error"}
            </h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Token Status:</strong> {getAuthToken() ? "✅ Present" : "❌ Not found"}</p>
          <p><strong>Endpoint:</strong> https://nvccz-pi.vercel.app/api/kpis</p>
        </div>
      </CardContent>
    </Card>
  )
}
