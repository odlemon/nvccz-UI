"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSecurityConfigModalOpen } from "@/lib/store/slices/investmentsSlice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export function SecurityConfigModal() {
  const dispatch = useAppDispatch()
  const { securityConfigTarget } = useAppSelector((s) => s.investments)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("investments", "investments-portfolios-instruments")

  const [alertAbove, setAlertAbove] = useState("")
  const [alertBelow, setAlertBelow] = useState("")
  const [emailAlert, setEmailAlert] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [inAppAlert, setInAppAlert] = useState(true)
  const [brokerProfile, setBrokerProfile] = useState("default")

  if (!securityConfigTarget) return null

  const tick = null // would come from latestPrices in a real impl

  return (
    <Sheet open onOpenChange={() => dispatch(setSecurityConfigModalOpen(false))}>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{securityConfigTarget.symbol}</span>
            <Badge variant="outline">{securityConfigTarget.exchangeCode}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 overflow-y-auto">
          <div>
            <p className="text-xs text-muted-foreground">{securityConfigTarget.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{securityConfigTarget.listingCurrencyCode}</p>
          </div>

          <Separator />

          {/* Price alerts */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Price Alerts</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Alert Above</Label>
                <Input
                  type="number"
                  placeholder="0.0000"
                  value={alertAbove}
                  onChange={(e) => setAlertAbove(e.target.value)}
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alert Below</Label>
                <Input
                  type="number"
                  placeholder="0.0000"
                  value={alertBelow}
                  onChange={(e) => setAlertBelow(e.target.value)}
                  className="h-8 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification channels */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Notification Channels</p>
            <div className="flex items-center justify-between">
              <Label className="text-sm">In-app notifications</Label>
              <Switch checked={inAppAlert} onCheckedChange={setInAppAlert} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email alerts</Label>
                <Switch checked={emailAlert} onCheckedChange={setEmailAlert} />
              </div>
              {emailAlert && (
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="h-8 text-sm"
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Default broker profile */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Default Broker Profile</Label>
            <Select value={brokerProfile} onValueChange={setBrokerProfile} disabled={!isAdmin}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="fbc_zse">FBC Securities (ZSE)</SelectItem>
                <SelectItem value="sfc_vfex">SFC (VFEX)</SelectItem>
                <SelectItem value="interactive_brokers">Interactive Brokers</SelectItem>
              </SelectContent>
            </Select>
            {!isAdmin && (
              <p className="text-[10px] text-muted-foreground">Read-only — admin access required to change broker profile</p>
            )}
          </div>

          <Separator />

          {/* Vendor symbol mappings (read-only) */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Vendor Symbol Mappings</p>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Bloomberg</span>
                <span>{securityConfigTarget.symbol} ZH Equity</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Reuters</span>
                <span>{securityConfigTarget.symbol}.ZW</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">ISIN</span>
                <span>{securityConfigTarget.isin ?? `ZW${securityConfigTarget.id.slice(0, 10).toUpperCase()}`}</span>
              </div>
            </div>
          </div>

          <Button className="w-full gradient-primary text-white">Save Configuration</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
