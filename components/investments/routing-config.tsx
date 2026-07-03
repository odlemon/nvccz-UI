"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Info, Network } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "./page-header"

export function RoutingConfig() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Routing Configuration" subtitle="Configure broker, custodian, and settlement routing behaviour" />

      {/* Broker Gateway */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Broker Gateway</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">BROKER</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Default Broker</Label>
            <Select defaultValue="fbc_zse">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fbc_zse">FBC Securities (ZSE)</SelectItem>
                <SelectItem value="sfc_vfex">SFC (VFEX)</SelectItem>
                <SelectItem value="interactive_brokers">Interactive Brokers</SelectItem>
                <SelectItem value="seczim">SECZIM Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Broker API Endpoint</Label>
            <Input className="h-8 font-mono text-xs" defaultValue="https://api.fbcsec.co.zw/v2" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Enable broker dispatch</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>When disabled, trades are settled internally without broker confirmation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Custodian Network */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Custodian Network</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">CUSTODIAN</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Internal settlement mode</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>When enabled, custodian hop is SKIPPED_INTERNAL. Suitable for internal fund-to-fund transfers.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">External Custodian ID</Label>
            <Input className="h-8 font-mono text-xs" placeholder="CUST-001" disabled />
            <p className="text-[10px] text-muted-foreground">Not required while internal settlement mode is active</p>
          </div>
        </CardContent>
      </Card>

      {/* Core Banking */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Core Banking</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">CORE_BANKING</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Cash Account Number</Label>
            <Input className="h-8 font-mono text-xs" defaultValue="1001-0023-004" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hold Release Timeout (seconds)</Label>
            <Input type="number" className="h-8 font-mono text-xs" defaultValue={30} />
          </div>
        </CardContent>
      </Card>

      {/* GL */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Accounting Register (GL)</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">ACCOUNTING_GL</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Investment Asset GL Account</Label>
            <Input className="h-8 font-mono text-xs" defaultValue="1510 — Investments" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Realized P&L GL Account</Label>
            <Input className="h-8 font-mono text-xs" defaultValue="4200 — Gain/Loss on Investments" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Auto-post to GL on settlement</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Save Configuration
        </button>
      </div>
    </div>
  )
}
